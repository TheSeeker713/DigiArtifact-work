import { createRepository } from './baseRepo'

const base = createRepository('activities', 'activity')

export const activitiesRepo = {
  ...base,
  listByClient(clientId: string) {
    return base.queryByIndex('by_client', clientId)
  },
  listByClientAndDate(clientId: string, dateKey: string) {
    return base.queryByIndex('by_client_date', [clientId, dateKey])
  },
}
