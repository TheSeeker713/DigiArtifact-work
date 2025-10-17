import { createRepository } from './baseRepo'

const base = createRepository('clients', 'client')

export const clientsRepo = {
  ...base,
  listByStatus(status: string) {
    return base.queryByIndex('by_status', status)
  },
}
