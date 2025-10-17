import { createRepository } from './baseRepo'

const base = createRepository('invoices', 'invoice')

export const invoicesRepo = {
  ...base,
  listByClient(clientId: string) {
    return base.queryByIndex('by_client', clientId)
  },
  listByStatus(status: string) {
    return base.queryByIndex('by_status', status)
  },
}
