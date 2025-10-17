import { defaultSettings } from '../types/settings'
import { settingsRepo } from '../repos/settingsRepo'

const DEFAULT_KEY = 'app.defaults'
const CURRENT_KEY = 'app.current'

export async function seedDefaults() {
  const [defaultsRecord, currentRecord] = await Promise.all([
    settingsRepo.getByKey(DEFAULT_KEY),
    settingsRepo.getByKey(CURRENT_KEY),
  ])

  if (!defaultsRecord) {
    await settingsRepo.upsert(DEFAULT_KEY, defaultSettings)
  }

  if (!currentRecord) {
    await settingsRepo.upsert(CURRENT_KEY, defaultSettings)
  }
}

export const SETTINGS_DEFAULT_KEY = DEFAULT_KEY
export const SETTINGS_CURRENT_KEY = CURRENT_KEY
