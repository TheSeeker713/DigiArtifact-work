import { createRepository } from './baseRepo'

const base = createRepository('schedules', 'schedule')

export const schedulesRepo = {
  ...base,
  listByPerson(personId: string) {
    return base.queryByIndex('by_person', personId)
  },
  listByJob(jobId: string) {
    return base.queryByIndex('by_job', jobId)
  },
}
