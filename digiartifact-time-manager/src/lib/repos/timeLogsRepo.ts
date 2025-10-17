import { createRepository } from './baseRepo'

const base = createRepository('timelogs', 'timelog')

export const timeLogsRepo = {
  ...base,
  listByJob(jobId: string) {
    return base.queryByIndex('by_job', jobId)
  },
  listByWeek(weekBucket: string) {
    return base.queryByIndex('by_week', weekBucket)
  },
  listByJobWeek(jobId: string, weekBucket: string) {
    return base.queryByIndex('by_job_week', [jobId, weekBucket])
  },
  listByPerson(personId: string) {
    return base.queryByIndex('by_person', personId)
  },
}
