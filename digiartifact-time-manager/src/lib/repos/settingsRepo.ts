import { createRepository } from './baseRepo'
import type { SettingRecord } from '../types/entities'

const base = createRepository('settings', 'setting')

export const settingsRepo = {
  ...base,
  async getByKey(key: string) {
    const matches = await base.queryByIndex('by_key', key)
    return matches[0]
  },
  async upsert(key: string, value: SettingRecord['value']) {
    const existing = await settingsRepo.getByKey(key)
    if (existing) {
      return base.update(existing.id, { key, value })
    }
    return base.create({ key, value })
  },
}
