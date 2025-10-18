import { createRepository } from './baseRepo'
import type { WorkSessionRecord } from '../types/entities'

const baseRepo = createRepository('work_sessions', 'WorkSession')

export async function getActiveSession(): Promise<WorkSessionRecord | undefined> {
  const results = await baseRepo.queryByIndex('by_status', 'active', false)
  return results[0]
}

export async function getAllSessions(includeDeleted = false): Promise<WorkSessionRecord[]> {
  return baseRepo.list(includeDeleted)
}

export const workSessionsRepo = {
  ...baseRepo,
  getActiveSession,
  getAllSessions,
}
