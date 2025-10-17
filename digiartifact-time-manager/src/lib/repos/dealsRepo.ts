import { createRepository } from './baseRepo'

const base = createRepository('deals', 'deal')

export const dealsRepo = {
  ...base,
  listByClient(clientId: string) {
    return base.queryByIndex('by_client', clientId)
  },
  listByStage(stage: string) {
    return base.queryByIndex('by_stage', stage)
  },
}
