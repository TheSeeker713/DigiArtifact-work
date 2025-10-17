import { createRepository } from './baseRepo'

const base = createRepository('expenses', 'expense')

export const expensesRepo = {
  ...base,
  listByJob(jobId: string) {
    return base.queryByIndex('by_job', jobId)
  },
  listByClient(clientId: string) {
    return base.queryByIndex('by_client', clientId)
  },
}
