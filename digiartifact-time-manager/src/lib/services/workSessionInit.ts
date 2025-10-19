/**
 * FIX 9: Work Session Initialization
 * 
 * Load active work session from database into workSessionStore on app startup.
 * This ensures all components have access to current session state immediately.
 */

import { workSessionStore } from '../stores/workSessionStore'
import { workSessionsRepo } from '../repos/workSessionsRepo'
import { debugLog } from '../utils/debug'

let initialized = false

/**
 * Initialize workSessionStore with active session from database.
 * Call this once on app startup (e.g., in Dashboard or root layout).
 */
export async function initializeWorkSession(): Promise<void> {
  if (initialized) {
    debugLog.ui.info('WorkSession: Already initialized, skipping')
    return
  }

  try {
    debugLog.ui.info('WorkSession: Initializing...')
    const activeSession = await workSessionsRepo.getActiveSession()
    
    if (activeSession) {
      debugLog.ui.info('WorkSession: Found active session', {
        session_id: activeSession.id,
        status: activeSession.status,
        clock_in: activeSession.clockInTime,
      })
      workSessionStore.setActiveSession(activeSession)
    } else {
      debugLog.ui.info('WorkSession: No active session')
      workSessionStore.setActiveSession(null)
    }

    initialized = true
  } catch (error) {
    debugLog.ui.error('WorkSession: Initialization failed', { error })
    workSessionStore.setError('Failed to load work session')
    throw error
  }
}

/**
 * Reset initialization flag (for testing or forced reload)
 */
export function resetWorkSessionInit(): void {
  initialized = false
}
