import { writable } from 'svelte/store'

import { defaultSettings } from '../types/settings'

export type WeeklyTotals = {
  weekBucket: string
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
    weekBucket: '',
    totalMinutes: 0,
    targetMinutes: defaultSettings.weekTargetHours * 60,
  },
  perJob: {},
  lastUpdated: null,
}

function createStatsStore() {
  const store = writable<StatsState>({ ...initialState })

  return {
    subscribe: store.subscribe,
    setSnapshot(snapshot: StatsState) {
      store.set({ ...snapshot, perJob: { ...snapshot.perJob } })
    },
    applyTimeDelta(
      weekBucket: string,
      jobId: string,
      deltaMinutes: number,
      targetMinutes: number,
      affectsWeekly: boolean,
    ) {
      store.update((state) => {
        const perJob = { ...state.perJob }
        const currentJobTotal = perJob[jobId] ?? 0
        perJob[jobId] = Math.max(0, currentJobTotal + deltaMinutes)

        const weekly = affectsWeekly
          ? {
              weekBucket,
              totalMinutes:
                state.weekly.weekBucket === weekBucket
                  ? Math.max(0, state.weekly.totalMinutes + deltaMinutes)
                  : Math.max(0, deltaMinutes),
              targetMinutes,
            }
          : {
              ...state.weekly,
              targetMinutes,
            }

        return {
          weekly,
          perJob,
          lastUpdated: new Date().toISOString(),
        }
      })
    },
    setTargetMinutes(weekBucket: string, targetMinutes: number) {
      store.update((state) => ({
        weekly:
          state.weekly.weekBucket === weekBucket
            ? { ...state.weekly, targetMinutes }
            : { weekBucket, totalMinutes: 0, targetMinutes },
        perJob: state.perJob,
        lastUpdated: new Date().toISOString(),
      }))
    },
    reset() {
      store.set({ ...initialState })
    },
  }
}

export const statsStore = createStatsStore()
