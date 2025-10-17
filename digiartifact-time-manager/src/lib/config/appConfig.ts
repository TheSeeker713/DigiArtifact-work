export const TIMEZONE = 'America/Los_Angeles'
export const WEEK_START = 'Monday'
export const WEEK_TARGET_HOURS = 60

export const JOB_TARGETS = {
  Freelancing: 20,
  Content: 20,
  Digital: 20,
} as const

export type DefaultJobTargets = typeof JOB_TARGETS
