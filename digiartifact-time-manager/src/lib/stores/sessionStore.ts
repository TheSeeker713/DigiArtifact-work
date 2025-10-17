import { writable } from 'svelte/store'

export type SessionState = {
  lowEndMode: boolean
  isLoading: boolean
  lastSyncedAt?: string | null
}

const initialState: SessionState = {
  lowEndMode: false,
  isLoading: false,
  lastSyncedAt: null,
}

function createSessionStore() {
  const store = writable<SessionState>(initialState)

  return {
    subscribe: store.subscribe,
    setLowEndMode(enabled: boolean) {
      store.update((state) => ({ ...state, lowEndMode: enabled }))
    },
    setLoading(isLoading: boolean) {
      store.update((state) => ({ ...state, isLoading }))
    },
    markSynced(timestamp: string) {
      store.update((state) => ({ ...state, lastSyncedAt: timestamp }))
    },
    reset() {
      store.set(initialState)
    },
  }
}

export const sessionStore = createSessionStore()
