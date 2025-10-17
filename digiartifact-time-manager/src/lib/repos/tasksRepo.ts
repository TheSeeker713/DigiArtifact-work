import { createRepository } from './baseRepo'

const base = createRepository('tasks', 'task')

export const tasksRepo = {
  ...base,
  listByJob(jobId: string) {
    return base.queryByIndex('by_job', jobId)
  },
}
