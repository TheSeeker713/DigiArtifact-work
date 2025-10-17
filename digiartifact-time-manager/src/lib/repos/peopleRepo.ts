import { createRepository } from './baseRepo'
import type { PersonRecord } from '../types/entities'

const base = createRepository('people', 'person')

export const peopleRepo = {
  ...base,
  listByRole(role: PersonRecord['role']) {
    return base.queryByIndex('by_role', role)
  },
}
