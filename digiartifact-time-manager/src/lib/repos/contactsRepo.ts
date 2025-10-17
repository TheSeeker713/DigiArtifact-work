import { createRepository } from './baseRepo'

const base = createRepository('contacts', 'contact')

export const contactsRepo = {
  ...base,
  listByClient(clientId: string) {
    return base.queryByIndex('by_client', clientId)
  },
}
