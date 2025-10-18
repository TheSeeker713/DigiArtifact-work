import { writable } from 'svelte/store'

import { SETTINGS_CURRENT_KEY, seedDefaults } from '../data/seed'
import { settingsRepo } from '../repos/settingsRepo'
import { defaultSettings, type Settings } from '../types/settings'

export { defaultSettings }
export type { Settings }

function sanitizeJobTargets(candidate: unknown, fallback: Record<string, number>) {
  if (!candidate || typeof candidate !== 'object') {
    return { ...fallback }
  }

  const next: Record<string, number> = {}

  for (const [key, rawValue] of Object.entries(candidate as Record<string, unknown>)) {
    const numeric = Number(rawValue)
    if (Number.isFinite(numeric) && numeric >= 0) {
      next[key] = numeric
    }
  }

  return Object.keys(next).length ? next : { ...fallback }
}

function normalizeSettings(candidate: unknown): Settings {
  if (!candidate || typeof candidate !== 'object') {
    return cloneSettings(defaultSettings)
  }

  const value = candidate as Partial<Settings>

  return {
    timezone: typeof value.timezone === 'string' && value.timezone.trim().length
      ? value.timezone
      : defaultSettings.timezone,
    weekStart: typeof value.weekStart === 'string' && value.weekStart.trim().length
      ? value.weekStart
      : defaultSettings.weekStart,
    weekTargetHours:
      Number.isFinite(Number(value.weekTargetHours)) && Number(value.weekTargetHours) >= 0
        ? Number(value.weekTargetHours)
        : defaultSettings.weekTargetHours,
    jobTargets: sanitizeJobTargets(value.jobTargets, defaultSettings.jobTargets),
    lowEndMode: typeof value.lowEndMode === 'boolean' ? value.lowEndMode : defaultSettings.lowEndMode,
    performanceMonitorEnabled: typeof value.performanceMonitorEnabled === 'boolean' ? value.performanceMonitorEnabled : defaultSettings.performanceMonitorEnabled,
    highContrast: typeof value.highContrast === 'boolean' ? value.highContrast : defaultSettings.highContrast,
  }
}

export function cloneSettings(settings: Settings): Settings {
  return {
    timezone: settings.timezone,
    weekStart: settings.weekStart,
    weekTargetHours: settings.weekTargetHours,
    jobTargets: { ...settings.jobTargets },
    lowEndMode: settings.lowEndMode,
    performanceMonitorEnabled: settings.performanceMonitorEnabled,
    highContrast: settings.highContrast,
  }
}

function createSettingsStore() {
  const store = writable<Settings>(cloneSettings(defaultSettings))
  let hydrated = false

  async function hydrate() {
    if (typeof window === 'undefined') return

    try {
      await seedDefaults()
      const record = await settingsRepo.getByKey(SETTINGS_CURRENT_KEY)
      if (record && record.value) {
        store.set(normalizeSettings(record.value))
      } else {
        store.set(cloneSettings(defaultSettings))
        await settingsRepo.upsert(SETTINGS_CURRENT_KEY, defaultSettings)
      }
    } catch (error) {
      console.warn('settingsStore: hydration failed, using defaults', error)
      store.set(cloneSettings(defaultSettings))
    } finally {
      hydrated = true
    }
  }

  void hydrate()

  store.subscribe(async (value) => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      await settingsRepo.upsert(SETTINGS_CURRENT_KEY, cloneSettings(value))
    } catch (error) {
      console.warn('settingsStore: failed to persist settings', error)
    }
  })

  return {
    subscribe: store.subscribe,
    set(value: Settings) {
      store.set(cloneSettings(value))
    },
    update(updater: (value: Settings) => Settings) {
      store.update((current) => cloneSettings(updater(current)))
    },
    reset() {
      store.set(cloneSettings(defaultSettings))
    },
  }
}

export const settingsStore = createSettingsStore()
export const cloneSettingsSnapshot = cloneSettings
