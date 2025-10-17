import { createRepository } from './baseRepo'

const base = createRepository('form_submissions', 'form_submission')

export const formSubmissionsRepo = {
  ...base,
  listBySource(source: string) {
    return base.queryByIndex('by_source', source)
  },
}
