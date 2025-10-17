import { JOB_TARGETS, TIMEZONE, WEEK_START, WEEK_TARGET_HOURS } from '../config/appConfig'

export type Settings = {
  timezone: string
  weekStart: string
  weekTargetHours: number
  jobTargets: Record<string, number>
}

export const defaultSettings: Settings = {
  timezone: TIMEZONE,
  weekStart: WEEK_START,
  weekTargetHours: WEEK_TARGET_HOURS,
  jobTargets: { ...JOB_TARGETS },
}
