import { get } from 'svelte/store'

import { eventBus } from '../events/eventBus'
import { settingsStore } from '../stores/settingsStore'
import { statsStore } from '../stores/statsStore'
import { initializeTimeLogStats } from './timeLogsService'
import { getCurrentWeekBucket } from '../utils/time'

let bootstrapped = false

export async function initStatsAggregator() {
  if (bootstrapped) return

  await initializeTimeLogStats()

  const unsubscribe = eventBus.on('settings:updated', () => {
    const settings = get(settingsStore)
    const currentWeek = getCurrentWeekBucket(settings.weekStart as any)
    const targetMinutes = settings.weekTargetHours * 60
    statsStore.setTargetMinutes(currentWeek, targetMinutes)
  })

  bootstrapped = true

  return () => {
    unsubscribe()
    bootstrapped = false
  }
}
