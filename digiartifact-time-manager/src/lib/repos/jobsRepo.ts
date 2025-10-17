import { createRepository } from './baseRepo'

const base = createRepository('jobs', 'job')

export const jobsRepo = {
  ...base,
  listByClient(clientId: string) {
    return base.queryByIndex('by_client', clientId)
  },
  listByStatus(status: string) {
    return base.queryByIndex('by_status', status)
  },
}
