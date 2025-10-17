import { getDB } from '../data/db'
import { jobsRepo } from '../repos/jobsRepo'
import { tasksRepo } from '../repos/tasksRepo'
import { nowIso } from '../repos/baseRepo'
import type { AuditRecord, JobRecord, TaskRecord } from '../types/entities'

export type JobWithTasks = JobRecord & { tasks: TaskRecord[] }

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function fetchJobsWithTasks(includeInactive = true): Promise<JobWithTasks[]> {
  const [jobs, tasks] = await Promise.all([jobsRepo.list(), tasksRepo.list()])

  const jobMap = new Map<string, TaskRecord[]>()
  for (const task of tasks) {
    const bucket = jobMap.get(task.jobId)
    if (bucket) {
      bucket.push(task)
    } else {
      jobMap.set(task.jobId, [task])
    }
  }

  const filteredJobs = includeInactive
    ? jobs
    : jobs.filter((job) => (job.status ?? 'active') !== 'inactive')

  return filteredJobs
    .map((job) => ({
      ...job,
      tasks: (jobMap.get(job.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function resetJobsAndTasks(): Promise<void> {
  const [jobs, tasks] = await Promise.all([jobsRepo.list(true), tasksRepo.list(true)])

  await Promise.all(
    tasks
      .filter((task) => !task.deletedAt)
      .map((task) => tasksRepo.softDelete(task.id)),
  )

  await Promise.all(
    jobs
      .filter((job) => !job.deletedAt)
      .map((job) => jobsRepo.softDelete(job.id)),
  )

  const db = await getDB()
  const auditRecord: AuditRecord = {
    id: generateId(),
    entity: 'jobs_tasks_reset',
    entityId: 'jobs_tasks',
    action: 'delete',
    timestamp: nowIso(),
    before: {
      jobs: jobs.map((job) => job.id),
      tasks: tasks.map((task) => task.id),
    },
    after: { reset: true },
  }

  await db.add('audit', auditRecord)
}
