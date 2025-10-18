import { derived } from 'svelte/store'

import { statsStore } from '../stores/statsStore'
import { settingsStore } from '../stores/settingsStore'
import { jobsTasksStore } from '../stores/jobsTasksStore'
import { getIsoWeekRange } from '../utils/time'

export const weeklySummarySelector = derived(
  [statsStore, settingsStore],
  ([$stats, $settings]) => {
    const weekRange = getIsoWeekRange()
    const targetHours = Math.round(($stats.weekly.targetMinutes / 60) * 100) / 100
    const progressRatio = targetHours > 0 ? Math.min(1, $stats.weeklyTotalHours / targetHours) : 0

    return {
      weekBucket: $stats.weekly.weekBucket,
      weekRange,
      totalHours: $stats.weeklyTotalHours,
      targetHours,
      progressRatio,
      lastUpdated: $stats.lastUpdated,
      configuredTargets: { ...$settings.jobTargets },
    }
  },
  {
    weekBucket: '',
    weekRange: getIsoWeekRange(),
    totalHours: 0,
    targetHours: 0,
    progressRatio: 0,
    lastUpdated: null,
    configuredTargets: {},
  },
)

export const primaryJobTotalsSelector = derived(
  [statsStore, jobsTasksStore],
  ([$stats, $jobs]) => {
    const titleMap = new Map($jobs.map((job) => [job.id, job.title]))

    return $stats.primaryJobTotals.map((entry) => ({
      jobId: entry.jobId,
      title: titleMap.get(entry.jobId) ?? 'Unknown job',
      minutes: entry.minutes,
      hours: entry.hours,
    }))
  },
  [],
)

export const targetJobProgressSelector = derived(
  [statsStore, jobsTasksStore, settingsStore],
  ([$stats, $jobs, $settings]) => {
    const titleToId = new Map($jobs.map((job) => [job.title, job.id]))

    return Object.entries($settings.jobTargets).map(([title, targetHours]) => {
      const jobId = titleToId.get(title) ?? null
      const minutes = jobId ? $stats.perJob[jobId] ?? 0 : 0
      const hours = Math.round((minutes / 60) * 100) / 100
      const ratio = targetHours > 0 ? Math.min(1, hours / targetHours) : 0

      return {
        title,
        jobId,
        hours,
        targetHours,
        ratio,
      }
    })
  },
  [],
)
