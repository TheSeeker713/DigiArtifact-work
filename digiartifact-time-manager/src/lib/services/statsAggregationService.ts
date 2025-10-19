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
