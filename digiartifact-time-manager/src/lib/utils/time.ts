export type WeekStart = 'Sunday' | 'Monday' | 'Saturday'

const WEEK_START_LOOKUP: Record<WeekStart, number> = {
  Sunday: 0,
  Monday: 1,
  Saturday: 6,
}

export type IsoWeekRange = {
  weekNumber: number
  start: string
  end: string
  label: string
}

export function startOfWeek(date: Date, weekStart: WeekStart = 'Monday'): Date {
  const startIndex = WEEK_START_LOOKUP[weekStart] ?? 1
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  const currentDay = result.getDay()
  const diff = (currentDay - startIndex + 7) % 7
  result.setDate(result.getDate() - diff)
  return result
}

export function formatWeekBucket(date: Date, weekStart: WeekStart = 'Monday'): string {
  const start = startOfWeek(date, weekStart)
  return start.toISOString().slice(0, 10)
}

export function getIsoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const diff = target.getTime() - yearStart.getTime()
  return Math.floor(diff / 604800000) + 1
}

export function getIsoWeekRange(date: Date = new Date()): IsoWeekRange {
  const weekStart = startOfWeek(date, 'Monday')
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  const startIso = start.toISOString().slice(0, 10)
  const endIso = end.toISOString().slice(0, 10)
  const weekNumber = getIsoWeekNumber(date)

  return {
    weekNumber,
    start: startIso,
    end: endIso,
    label: `Week ${weekNumber} (${startIso} → ${endIso})`,
  }
}

export function combineDateAndTime(dateISO: string, time: string): Date {
  if (!dateISO || !time) {
    throw new Error('combineDateAndTime requires both date and time strings')
  }
  const [hours, minutes] = time.split(':').map((value) => Number(value))
  const base = new Date(dateISO)
  base.setHours(hours, minutes, 0, 0)
  return base
}

export function diffMinutes(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  return Math.max(0, Math.round(ms / 60000))
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

export function getCurrentWeekBucket(weekStart: WeekStart = 'Monday'): string {
  return formatWeekBucket(new Date(), weekStart)
}
