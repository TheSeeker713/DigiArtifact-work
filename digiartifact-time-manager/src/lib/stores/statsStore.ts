import { writable } from 'svelte/store'

export type WeeklyTotals = {
  totalMinutes: number
  targetMinutes: number
}

export type PerJobTotals = Record<string, number>

export type StatsState = {
  weekly: WeeklyTotals
  perJob: PerJobTotals
  lastUpdated: string | null
}

const initialState: StatsState = {
  weekly: {
    totalMinutes: 0,
    targetMinutes: 60 * 60,
  },
  perJob: {},
  lastUpdated: null,
}

function createStatsStore() {
  const store = writable<StatsState>({ ...initialState })

  return {
    subscribe: store.subscribe,
    setWeekly(totals: WeeklyTotals) {
      store.update((state) => ({
        ...state,
        weekly: totals,
        lastUpdated: new Date().toISOString(),
      }))
    },
    setPerJob(perJob: PerJobTotals) {
      store.update((state) => ({
        ...state,
        perJob,
        lastUpdated: new Date().toISOString(),
      }))
    },
    reset() {
      store.set({ ...initialState })
    },
  }
}

export const statsStore = createStatsStore()
