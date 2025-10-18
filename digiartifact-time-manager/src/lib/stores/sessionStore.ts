import { writable, get } from 'svelte/store'
import { detectLowEndDevice } from '../utils/detectLowEnd'
import { settingsStore } from './settingsStore'

export type SessionState = {
  lowEndMode: boolean;
  isLoading: boolean;
  lastSyncedAt?: string | null;
  performanceMonitorEnabled: boolean;
  highContrast: boolean;
}

const initialState: SessionState = {
  lowEndMode: false,
  isLoading: false,
  lastSyncedAt: null,
  performanceMonitorEnabled: false,
  highContrast: false,
}

function createSessionStore() {
  const store = writable<SessionState>(initialState)
  let initialized = false

  // Initialize low-end mode: Settings override if set, else auto-detect
  function initialize() {
    if (initialized) return
    initialized = true

    const settings = get(settingsStore)
    const autoDetect = detectLowEndDevice()
    const lowEndMode = settings.lowEndMode !== undefined ? settings.lowEndMode : autoDetect
    const performanceMonitorEnabled = settings.performanceMonitorEnabled ?? false
    const highContrast = settings.highContrast ?? false

    store.update((state) => ({
      ...state,
      lowEndMode,
      performanceMonitorEnabled,
      highContrast,
    }))
    if (highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }

  // Call initialize after a tick to ensure settingsStore is hydrated
  if (typeof window !== 'undefined') {
    setTimeout(initialize, 0)
  }

  return {
    subscribe: store.subscribe,
    setLowEndMode(enabled: boolean) {
      store.update((state) => ({ ...state, lowEndMode: enabled }))
      // Persist to settings
      settingsStore.update((s) => ({ ...s, lowEndMode: enabled }))
    },
    setHighContrast(enabled: boolean) {
      store.update((state) => ({ ...state, highContrast: enabled }))
      settingsStore.update((s) => ({ ...s, highContrast: enabled }))
      if (enabled) {
        document.body.classList.add('high-contrast')
      } else {
        document.body.classList.remove('high-contrast')
      }
    },
    setLoading(isLoading: boolean) {
      store.update((state) => ({ ...state, isLoading }))
    },
    markSynced(timestamp: string) {
      store.update((state) => ({ ...state, lastSyncedAt: timestamp }))
    },
    setPerformanceMonitor(enabled: boolean) {
      store.update((state) => ({ ...state, performanceMonitorEnabled: enabled }))
      settingsStore.update((s) => ({ ...s, performanceMonitorEnabled: enabled }))
    },
    reset() {
      store.set(initialState)
    },
  }
}

export const sessionStore = createSessionStore()
