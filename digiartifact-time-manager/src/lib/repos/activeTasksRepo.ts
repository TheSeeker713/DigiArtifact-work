import { createRepository } from './baseRepo'
import type { ActiveTaskRecord } from '../types/entities'

const baseRepo = createRepository('active_tasks', 'ActiveTask')

export async function getRunningTasks(): Promise<ActiveTaskRecord[]> {
  // Get both running and paused tasks
  const running = await baseRepo.queryByIndex('by_status', 'running', false)
  const paused = await baseRepo.queryByIndex('by_status', 'paused', false)
  return [...running, ...paused]
}

export async function getTasksByJob(jobId: string): Promise<ActiveTaskRecord[]> {
  return baseRepo.queryByIndex('by_job', jobId, false)
}

export async function getAllTasks(includeDeleted = false): Promise<ActiveTaskRecord[]> {
  return baseRepo.list(includeDeleted)
}

export const activeTasksRepo = {
  ...baseRepo,
  getRunningTasks,
  getTasksByJob,
  getAllTasks,
}
