export type WeekStart = 'Sunday' | 'Monday' | 'Saturday'

const WEEK_START_LOOKUP: Record<WeekStart, number> = {
  Sunday: 0,
  Monday: 1,
  Saturday: 6,
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
