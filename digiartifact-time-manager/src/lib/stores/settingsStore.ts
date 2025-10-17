import { writable } from 'svelte/store'

import { JOB_TARGETS, TIMEZONE, WEEK_START, WEEK_TARGET_HOURS } from '../config/appConfig'

export type Settings = {
  timezone: string
  weekStart: string
  weekTargetHours: number
  jobTargets: Record<string, number>
}

export const STORAGE_KEY = 'datm.settings.v1'

export const defaultSettings: Settings = {
  timezone: TIMEZONE,
  weekStart: WEEK_START,
  weekTargetHours: WEEK_TARGET_HOURS,
  jobTargets: { ...JOB_TARGETS },
}

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

function cloneSettings(settings: Settings): Settings {
  return {
    timezone: settings.timezone,
    weekStart: settings.weekStart,
    weekTargetHours: settings.weekTargetHours,
    jobTargets: { ...settings.jobTargets },
  }
}

function loadSettings(): Settings {
  if (typeof window === 'undefined') {
    return cloneSettings(defaultSettings)
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return cloneSettings(defaultSettings)
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      timezone: parsed.timezone ?? defaultSettings.timezone,
      weekStart: parsed.weekStart ?? defaultSettings.weekStart,
      weekTargetHours: Number.isFinite(Number(parsed.weekTargetHours))
        ? Number(parsed.weekTargetHours)
        : defaultSettings.weekTargetHours,
      jobTargets: sanitizeJobTargets(parsed.jobTargets, defaultSettings.jobTargets),
    }
  } catch (error) {
    console.warn('settingsStore: failed to parse persisted settings', error)
    return cloneSettings(defaultSettings)
  }
}

function createSettingsStore() {
  const store = writable<Settings>(loadSettings())

  const persist = (settings: Settings) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  store.subscribe((value) => {
    persist(value)
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
