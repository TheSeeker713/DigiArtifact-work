import { get } from 'svelte/store'

import { timeLogsRepo } from '../repos/timeLogsRepo'
import { nowIso } from '../repos/baseRepo'
import type { TimeLogRecord } from '../types/entities'
import { statsStore } from '../stores/statsStore'
import { settingsStore } from '../stores/settingsStore'
import { timeLogsStore } from '../stores/timeLogsStore'
import { eventBus } from '../events/eventBus'
import { formatWeekBucket, getCurrentWeekBucket } from '../utils/time'

const DEFAULT_PERSON_ID = 'self'

export type TimerLogInput = {
  jobId: string
  taskId?: string | null
  startedAt: string
  endedAt: string
  durationMinutes: number
  note?: string
  billable?: boolean
}

export type ManualLogInput = {
  jobId: string
  taskId?: string | null
  start: Date
  end: Date
  note?: string
  billable?: boolean
}

function toIso(date: Date) {
  return date.toISOString()
}

async function ensureNoOverlap(
  personId: string,
  startIso: string,
  endIso: string,
  excludeId?: string,
) {
  const logs = await timeLogsRepo.listByPerson(personId)
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()

  for (const log of logs) {
    if (excludeId && log.id === excludeId) continue
    const logStart = new Date(log.startDT).getTime()
    const logEnd = new Date(log.endDT).getTime()
    const overlaps = Math.max(start, logStart) < Math.min(end, logEnd)
    if (overlaps) {
      throw new Error('OVERLAP')
    }
  }
}

function coerceDurationMinutes(minutes: number) {
  return Math.max(1, Math.round(minutes))
}

function computeWeekBucket(dateISO: string, weekStart: string) {
  const date = new Date(dateISO)
  return formatWeekBucket(date, weekStart as any)
}

function applyAggregateDelta(
  weekBucket: string,
  jobId: string,
  deltaMinutes: number,
  targetMinutes: number,
  affectsWeekly: boolean,
) {
  statsStore.applyTimeDelta(weekBucket, jobId, deltaMinutes, targetMinutes, affectsWeekly)
}

function deriveTargetMinutes() {
  const settings = get(settingsStore)
  return settings.weekTargetHours * 60
}

function getWeekStartSetting() {
  const settings = get(settingsStore)
  return settings.weekStart as any
}

function shouldAffectWeekly(weekBucket: string) {
  const settings = get(settingsStore)
  const currentWeek = getCurrentWeekBucket(settings.weekStart as any)
  return currentWeek === weekBucket
}

export async function createTimerLog(input: TimerLogInput): Promise<TimeLogRecord> {
  const personId = DEFAULT_PERSON_ID
  const weekBucket = computeWeekBucket(input.startedAt, getWeekStartSetting())

  await ensureNoOverlap(personId, input.startedAt, input.endedAt)

  const record = await timeLogsRepo.create({
    jobId: input.jobId,
    taskId: input.taskId ?? null,
    personId,
    startDT: input.startedAt,
    endDT: input.endedAt,
    durationMinutes: coerceDurationMinutes(input.durationMinutes),
    note: input.note?.trim() ? input.note.trim() : undefined,
    billable: input.billable ?? true,
    weekBucket,
    approved: true,
  } as any)

  timeLogsStore.upsert(record)
  const targetMinutes = deriveTargetMinutes()
  applyAggregateDelta(weekBucket, record.jobId, record.durationMinutes, targetMinutes, shouldAffectWeekly(weekBucket))
  eventBus.emit('timelog:created', {
    id: record.id,
    jobId: record.jobId,
    durationMinutes: record.durationMinutes,
    weekBucket: record.weekBucket,
  })
  return record
}

export async function createManualLog(input: ManualLogInput): Promise<TimeLogRecord> {
  const startIso = toIso(input.start)
  const endIso = toIso(input.end)
  if (endIso <= startIso) {
    throw new Error('INVALID_RANGE')
  }

  const durationMinutes = coerceDurationMinutes((input.end.getTime() - input.start.getTime()) / 60000)
  const personId = DEFAULT_PERSON_ID
  const weekBucket = computeWeekBucket(startIso, getWeekStartSetting())

  await ensureNoOverlap(personId, startIso, endIso)

  const record = await timeLogsRepo.create({
    jobId: input.jobId,
    taskId: input.taskId ?? null,
    personId,
    startDT: startIso,
    endDT: endIso,
    durationMinutes,
    note: input.note?.trim() ? input.note.trim() : undefined,
    billable: input.billable ?? true,
    weekBucket,
    approved: true,
  } as any)

  timeLogsStore.upsert(record)
  const targetMinutes = deriveTargetMinutes()
  applyAggregateDelta(weekBucket, record.jobId, record.durationMinutes, targetMinutes, shouldAffectWeekly(weekBucket))
  eventBus.emit('timelog:created', {
    id: record.id,
    jobId: record.jobId,
    durationMinutes: record.durationMinutes,
    weekBucket: record.weekBucket,
  })
  return record
}

export async function updateTimeLogNote(id: string, note: string | null) {
  const existing = await timeLogsRepo.getById(id)
  if (!existing) {
    throw new Error('NOT_FOUND')
  }

  const updated = await timeLogsRepo.update(id, {
    note: note?.trim() ? note.trim() : undefined,
  } as any)

  timeLogsStore.upsert(updated)
  eventBus.emit('timelog:updated', {
    id: updated.id,
    jobId: updated.jobId,
    durationMinutes: updated.durationMinutes,
    weekBucket: updated.weekBucket,
  })
  return updated
}

export async function deleteTimeLog(id: string) {
  const existing = await timeLogsRepo.getById(id)
  if (!existing) return

  await timeLogsRepo.softDelete(id)
  timeLogsStore.remove(id)

  const targetMinutes = deriveTargetMinutes()
  applyAggregateDelta(
    existing.weekBucket,
    existing.jobId,
    -existing.durationMinutes,
    targetMinutes,
    shouldAffectWeekly(existing.weekBucket),
  )

  eventBus.emit('timelog:deleted', { id })
}

export async function loadAllTimeLogs() {
  return timeLogsStore.hydrate(true)
}

export async function initializeTimeLogStats() {
  const logs = await timeLogsRepo.list()
  const settings = get(settingsStore)
  const currentWeek = getCurrentWeekBucket(settings.weekStart as any)
  const targetMinutes = settings.weekTargetHours * 60

  let weeklyTotal = 0
  const perJob: Record<string, number> = {}

  for (const log of logs) {
    perJob[log.jobId] = (perJob[log.jobId] ?? 0) + log.durationMinutes
    if (log.weekBucket === currentWeek) {
      weeklyTotal += log.durationMinutes
    }
  }

  statsStore.setSnapshot({
    weekly: {
      weekBucket: currentWeek,
      totalMinutes: weeklyTotal,
      targetMinutes,
    },
    perJob,
    lastUpdated: logs.length ? nowIso() : null,
  })
}
