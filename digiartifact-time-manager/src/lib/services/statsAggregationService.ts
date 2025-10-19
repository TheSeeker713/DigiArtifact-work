/**
 * FIX 4: Incremental Weekly Aggregation Service
 * 
 * Provides a central hook for TimeLog changes that:
 * - Computes week buckets using Settings timezone and week start day
 * - Incrementally updates cached aggregates in statsStore
 * - Persists aggregates to IndexedDB for fast Dashboard reloads
 */

import { get } from 'svelte/store'
import type { TimeLogRecord } from '../types/entities'
import { statsStore } from '../stores/statsStore'
import { settingsStore } from '../stores/settingsStore'
import { settingsRepo } from '../repos/settingsRepo'
import { formatWeekBucket, getCurrentWeekBucket } from '../utils/time'

export type TimeLogEventType = 'create' | 'update' | 'delete'

export type CachedStats = {
  weekly: {
    weekBucket: string
    totalMinutes: number
    targetMinutes: number
  }
  perJob: Record<string, number>
  lastUpdated: string
  lastComputedAt?: string // Timestamp of last full recomputation
}

const STATS_CACHE_KEY = 'cached_stats_v1'

/**
 * Compute week bucket from TimeLog start_dt using Settings preferences
 */
function computeWeekBucket(startDT: string): string {
  const settings = get(settingsStore)
  const weekStart = settings.weekStart || 'monday'
  const date = new Date(startDT)
  return formatWeekBucket(date, weekStart as any)
}

/**
 * Get current week bucket from Settings
 */
function getCurrentWeek(): string {
  const settings = get(settingsStore)
  return getCurrentWeekBucket(settings.weekStart as any)
}

/**
 * Get target minutes from Settings
 */
function getTargetMinutes(): number {
  const settings = get(settingsStore)
  return (settings.weekTargetHours || 40) * 60
}

/**
 * Check if week bucket affects current week aggregates
 */
function affectsCurrentWeek(weekBucket: string): boolean {
  return weekBucket === getCurrentWeek()
}

/**
 * Save current stats to IndexedDB cache
 */
async function persistStatsCache(stats: CachedStats): Promise<void> {
  try {
    await settingsRepo.upsert(STATS_CACHE_KEY, JSON.stringify(stats))
    console.log('[StatsAggregator] Cached stats persisted to IndexedDB', stats)
  } catch (error) {
    console.error('[StatsAggregator] Failed to persist stats cache:', error)
  }
}

/**
 * Load cached stats from IndexedDB
 */
export async function loadCachedStats(): Promise<CachedStats | null> {
  try {
    const setting = await settingsRepo.getByKey(STATS_CACHE_KEY)
    if (!setting || !setting.value) return null

    const cached = JSON.parse(setting.value as string) as CachedStats
    console.log('[StatsAggregator] Loaded cached stats from IndexedDB', cached)
    return cached
  } catch (error) {
    console.error('[StatsAggregator] Failed to load cached stats:', error)
    return null
  }
}

/**
 * Central hook for TimeLog changes (create/update/delete)
 * Updates statsStore incrementally and persists to cache
 */
export async function onTimeLogChanged(
  eventType: TimeLogEventType,
  timeLog: TimeLogRecord,
  oldTimeLog?: TimeLogRecord,
): Promise<void> {
  const weekBucket = computeWeekBucket(timeLog.startDT)
  const targetMinutes = getTargetMinutes()
  const isCurrentWeek = affectsCurrentWeek(weekBucket)

  console.log(`[StatsAggregator] TimeLog ${eventType}:`, {
    id: timeLog.id,
    jobId: timeLog.jobId,
    durationMinutes: timeLog.durationMinutes,
    weekBucket,
    isCurrentWeek,
  })

  // Handle different event types
  switch (eventType) {
    case 'create':
      // Add to aggregates
      statsStore.applyTimeDelta(
        weekBucket,
        timeLog.jobId,
        timeLog.durationMinutes,
        targetMinutes,
        isCurrentWeek,
      )
      break

    case 'delete':
      // Subtract from aggregates
      statsStore.applyTimeDelta(
        weekBucket,
        timeLog.jobId,
        -timeLog.durationMinutes,
        targetMinutes,
        isCurrentWeek,
      )
      break

    case 'update':
      if (!oldTimeLog) {
        console.warn('[StatsAggregator] Update event missing oldTimeLog, skipping')
        return
      }

      // If job or duration changed, recalculate
      const oldWeekBucket = computeWeekBucket(oldTimeLog.startDT)
      const oldIsCurrentWeek = affectsCurrentWeek(oldWeekBucket)

      // Subtract old values
      if (oldTimeLog.jobId) {
        statsStore.applyTimeDelta(
          oldWeekBucket,
          oldTimeLog.jobId,
          -oldTimeLog.durationMinutes,
          targetMinutes,
          oldIsCurrentWeek,
        )
      }

      // Add new values
      statsStore.applyTimeDelta(
        weekBucket,
        timeLog.jobId,
        timeLog.durationMinutes,
        targetMinutes,
        isCurrentWeek,
      )
      break
  }

  // Persist updated stats to cache
  const currentStats = get(statsStore)
  await persistStatsCache({
    weekly: currentStats.weekly,
    perJob: currentStats.perJob,
    lastUpdated: new Date().toISOString(),
  })
}

/**
 * Initialize stats from cache or recompute from all TimeLogs
 */
export async function initializeStats(force = false): Promise<void> {
  // Try to load from cache first
  if (!force) {
    const cached = await loadCachedStats()
    if (cached) {
      console.log('[StatsAggregator] Initializing from cache')
      statsStore.setSnapshot(cached)
      return
    }
  }

  // No cache or forced recompute - fall back to full recompute
  console.log('[StatsAggregator] No cache found or force=true, recomputing from all TimeLogs')
  const { initializeTimeLogStats } = await import('./timeLogsService')
  await initializeTimeLogStats()

  // Save newly computed stats to cache
  const currentStats = get(statsStore)
  await persistStatsCache({
    weekly: currentStats.weekly,
    perJob: currentStats.perJob,
    lastUpdated: currentStats.lastUpdated || new Date().toISOString(),
  })
}

/**
 * Force recomputation of week aggregates for a specific person and week range
 * Optimized to use by_week index for efficient queries
 * Used by Dashboard debug tools and backfill operations
 */
export async function recomputeWeekAggregates(params?: {
  personId?: string
  weekRange?: { startIso: string; endIso: string }
  weekBucket?: string
}): Promise<{ 
  weeklyTotalHours: number
  perJobTotals: Record<string, number>
  weekBucket: string
  logCount: number
}> {
  console.log('[StatsAggregator] Force recomputing week aggregates', params)

  // Import dependencies
  const { timeLogsRepo } = await import('../repos/timeLogsRepo')
  const { isInRange, getWeekLabel } = await import('../utils/timeBuckets')
  
  // Get current week range and bucket if not provided
  const settings = get(settingsStore)
  const weekStart = settings.weekStart || 'monday'
  const tz = settings.timezone || 'America/New_York'
  
  let startIso = params?.weekRange?.startIso
  let endIso = params?.weekRange?.endIso
  let weekBucket = params?.weekBucket
  
  if (!startIso || !endIso || !weekBucket) {
    const { getCurrentWeekRange } = await import('../utils/timeBuckets')
    const range = getCurrentWeekRange(tz, weekStart as any)
    startIso = range.startIso
    endIso = range.endIso
    weekBucket = range.weekLabel
  }

  // OPTIMIZED: Use by_week index for O(log n) lookup
  // This is much faster than filtering all logs O(n)
  const logsInWeek = await timeLogsRepo.listByWeek(weekBucket)
  
  // Filter by personId if specified, and validate range
  const filteredLogs = logsInWeek.filter((log: import('../types/entities').TimeLogRecord) => {
    const inRange = isInRange(log.startDT, startIso!, endIso!)
    const matchesPerson = params?.personId ? log.personId === params.personId : true
    return inRange && matchesPerson
  })

  console.log(`[StatsAggregator] Found ${filteredLogs.length} TimeLogs in week ${weekBucket}`)

  // Compute totals
  let totalMinutes = 0
  const perJobTotals: Record<string, number> = {}

  for (const log of filteredLogs) {
    totalMinutes += log.durationMinutes
    perJobTotals[log.jobId] = (perJobTotals[log.jobId] || 0) + log.durationMinutes
  }

  const weeklyTotalHours = Math.round((totalMinutes / 60) * 100) / 100

  console.log('[StatsAggregator] Recomputed totals:', {
    weeklyTotalHours,
    totalMinutes,
    perJobTotals,
    logCount: filteredLogs.length,
    weekBucket,
  })

  // Only update statsStore if this is the current week
  const currentWeekBucket = getCurrentWeek()
  if (weekBucket === currentWeekBucket) {
    const targetMinutes = (settings.weekTargetHours || 40) * 60

    statsStore.setSnapshot({
      weekly: {
        weekBucket,
        totalMinutes,
        targetMinutes,
      },
      perJob: perJobTotals,
      lastUpdated: new Date().toISOString(),
    })

    // Persist current week to cache
    await persistStatsCache({
      weekly: {
        weekBucket,
        totalMinutes,
        targetMinutes,
      },
      perJob: perJobTotals,
      lastUpdated: new Date().toISOString(),
      lastComputedAt: new Date().toISOString(),
    })
  }

  return {
    weeklyTotalHours,
    perJobTotals,
    weekBucket,
    logCount: filteredLogs.length,
  }
}

/**
 * Backfill weekly aggregates for the last N weeks
 * Useful for fixing historical zeros or validating data integrity
 * 
 * @param weeksBack - Number of weeks to backfill (default: 8)
 * @param onProgress - Optional callback for progress updates
 */
export async function backfillWeeklyTotals(
  weeksBack = 8,
  onProgress?: (progress: { current: number; total: number; weekBucket: string }) => void
): Promise<{
  totalWeeks: number
  successCount: number
  results: Array<{
    weekBucket: string
    hours: number
    logCount: number
  }>
}> {
  console.log(`[StatsAggregator] Starting backfill for last ${weeksBack} weeks`)

  const settings = get(settingsStore)
  const weekStart = settings.weekStart || 'monday'
  const tz = settings.timezone || 'America/New_York'

  // Import utilities
  const { weekRangeFor } = await import('../utils/timeBuckets')

  // Generate week ranges for last N weeks
  const weeks: Array<{ weekBucket: string; startIso: string; endIso: string }> = []
  const now = new Date()

  for (let i = 0; i < weeksBack; i++) {
    const weekDate = new Date(now)
    weekDate.setDate(weekDate.getDate() - i * 7)
    
    const range = weekRangeFor(weekDate.toISOString(), tz, weekStart as any)
    weeks.push({
      weekBucket: range.weekLabel,
      startIso: range.startIso,
      endIso: range.endIso,
    })
  }

  console.log('[StatsAggregator] Backfilling weeks:', weeks.map(w => w.weekBucket))

  // Recompute each week
  const results: Array<{ weekBucket: string; hours: number; logCount: number }> = []
  let successCount = 0

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]
    
    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: weeks.length,
        weekBucket: week.weekBucket,
      })
    }

    try {
      const result = await recomputeWeekAggregates({
        weekRange: { startIso: week.startIso, endIso: week.endIso },
        weekBucket: week.weekBucket,
      })

      results.push({
        weekBucket: week.weekBucket,
        hours: result.weeklyTotalHours,
        logCount: result.logCount,
      })
      successCount++

      console.log(`[StatsAggregator] Backfilled week ${week.weekBucket}: ${result.weeklyTotalHours}h from ${result.logCount} logs`)
    } catch (error) {
      console.error(`[StatsAggregator] Failed to backfill week ${week.weekBucket}:`, error)
      results.push({
        weekBucket: week.weekBucket,
        hours: 0,
        logCount: 0,
      })
    }
  }

  console.log('[StatsAggregator] Backfill complete:', {
    totalWeeks: weeks.length,
    successCount,
    results,
  })

  return {
    totalWeeks: weeks.length,
    successCount,
    results,
  }
}
