/**
 * FIX 9: Work Session Store - Single Source of Truth
 * 
 * Global store for tracking active work session state.
 * All components subscribe to this instead of maintaining separate local state.
 * 
 * Benefits:
 * - Centralized active session management
 * - Automatic UI updates across all components (header badge, clock component, etc.)
 * - Prevents ghost "1 Timer Active" after clock out
 * - Clear state transitions on clock in/out/error
 */

import { writable } from 'svelte/store'
import type { WorkSessionRecord } from '../types/entities'
import { debugLog } from '../utils/debug'

export type WorkSessionState = {
  activeSession: WorkSessionRecord | null
  loading: boolean
  error: string | null
  lastClockOutAt: string | null
}

const initialState: WorkSessionState = {
  activeSession: null,
  loading: false,
  error: null,
  lastClockOutAt: null,
}

function createWorkSessionStore() {
  const store = writable<WorkSessionState>({ ...initialState })

  return {
    subscribe: store.subscribe,
    
    /**
     * Set active session (after clock in or loading from DB)
     */
    setActiveSession(session: WorkSessionRecord | null) {
      debugLog.ui.info('WorkSessionStore: setActiveSession', { 
        session_id: session?.id, 
        status: session?.status 
      })
      store.update(state => ({
        ...state,
        activeSession: session,
        error: null,
      }))
    },
    
    /**
     * Clear active session (after successful clock out)
     */
    clearActiveSession() {
      debugLog.ui.info('WorkSessionStore: clearActiveSession')
      store.update(state => ({
        ...state,
        activeSession: null,
        error: null,
        lastClockOutAt: new Date().toISOString(),
      }))
    },
    
    /**
     * Set loading state (during clock in/out operations)
     */
    setLoading(loading: boolean) {
      store.update(state => ({ ...state, loading }))
    },
    
    /**
     * Set error state (if clock in/out fails)
     */
    setError(error: string) {
      debugLog.ui.error('WorkSessionStore: setError', { error })
      store.update(state => ({ ...state, error, loading: false }))
    },
    
    /**
     * Clear error state
     */
    clearError() {
      store.update(state => ({ ...state, error: null }))
    },
    
    /**
     * Update active session in place (e.g., after break start/end)
     */
    updateActiveSession(updates: Partial<WorkSessionRecord>) {
      store.update(state => {
        if (!state.activeSession) return state
        return {
          ...state,
          activeSession: { ...state.activeSession, ...updates },
        }
      })
    },
    
    /**
     * Reset to initial state
     */
    reset() {
      store.set({ ...initialState })
    },
  }
}

export const workSessionStore = createWorkSessionStore()
