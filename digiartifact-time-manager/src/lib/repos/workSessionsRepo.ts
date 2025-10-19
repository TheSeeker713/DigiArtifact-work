import { createRepository } from './baseRepo'
import type { WorkSessionRecord, BreakPeriod } from '../types/entities'
import { nanoid } from 'nanoid'

const baseRepo = createRepository('work_sessions', 'WorkSession')

export async function getActiveSession(): Promise<WorkSessionRecord | undefined> {
  try {
    // Try to query by index first
    const results = await baseRepo.queryByIndex('by_status', 'active', false)
    if (results.length > 0) {
      return results[0]
    }

    // Also check for sessions with 'on_break' status
    const breakResults = await baseRepo.queryByIndex('by_status', 'on_break', false)
    if (breakResults.length > 0) {
      return breakResults[0]
    }

    // Defensive fallback: scan all sessions if index query returns empty
    console.warn('[WorkSessionsRepo] Index query returned empty, scanning all sessions')
    const allSessions = await baseRepo.list(false)
    const activeSession = allSessions.find(s => s.status === 'active' || s.status === 'on_break')
    
    if (activeSession) {
      console.log('[WorkSessionsRepo] Found active session via scan:', activeSession)
    }
    
    return activeSession
  } catch (error) {
    console.error('[WorkSessionsRepo] Error getting active session:', error)
    throw error
  }
}

export async function getAllSessions(includeDeleted = false): Promise<WorkSessionRecord[]> {
  return baseRepo.list(includeDeleted)
}

/**
 * Start a break for the active work session
 */
export async function startBreak(sessionId: string): Promise<WorkSessionRecord> {
  try {
    console.log('[WorkSessionsRepo] Starting break for session:', sessionId)
    
    const session = await baseRepo.getById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (session.status !== 'active') {
      throw new Error('Can only start break on active session')
    }

    const newBreak: BreakPeriod = {
      id: nanoid(),
      startTime: new Date().toISOString(),
      endTime: null,
      durationMinutes: undefined,
    }

    const breaks = session.breaks || []
    breaks.push(newBreak)

    const updated = await baseRepo.update(sessionId, {
      status: 'on_break',
      breaks,
    })

    console.log('[WorkSessionsRepo] Break started successfully')
    return updated
  } catch (error) {
    console.error('[WorkSessionsRepo] Error starting break:', error)
    throw error
  }
}

/**
 * End the current break for the active work session
 */
export async function endBreak(sessionId: string): Promise<WorkSessionRecord> {
  try {
    console.log('[WorkSessionsRepo] Ending break for session:', sessionId)
    
    const session = await baseRepo.getById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (session.status !== 'on_break') {
      throw new Error('Session is not on break')
    }

    const breaks = session.breaks || []
    const currentBreak = breaks.find(b => !b.endTime)
    
    if (!currentBreak) {
      throw new Error('No active break found')
    }

    // End the current break
    const now = new Date().toISOString()
    currentBreak.endTime = now
    const breakStart = new Date(currentBreak.startTime).getTime()
    const breakEnd = new Date(now).getTime()
    currentBreak.durationMinutes = Math.floor((breakEnd - breakStart) / 60000)

    // Calculate total break time
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0)

    const updated = await baseRepo.update(sessionId, {
      status: 'active',
      breaks,
      totalBreakMinutes,
    })

    console.log('[WorkSessionsRepo] Break ended successfully, duration:', currentBreak.durationMinutes, 'minutes')
    return updated
  } catch (error) {
    console.error('[WorkSessionsRepo] Error ending break:', error)
    throw error
  }
}

/**
 * Get the current active break for a session
 */
export function getCurrentBreak(session: WorkSessionRecord): BreakPeriod | null {
  if (!session.breaks || session.breaks.length === 0) {
    return null
  }

  const currentBreak = session.breaks.find(b => !b.endTime)
  return currentBreak || null
}

/**
 * Calculate net work time (total time - break time)
 */
export function calculateNetMinutes(session: WorkSessionRecord): number {
  const totalMinutes = session.totalMinutes || 0
  const breakMinutes = session.totalBreakMinutes || 0
  return Math.max(0, totalMinutes - breakMinutes)
}

export const workSessionsRepo = {
  ...baseRepo,
  getActiveSession,
  getAllSessions,
  startBreak,
  endBreak,
  getCurrentBreak,
  calculateNetMinutes,
}
