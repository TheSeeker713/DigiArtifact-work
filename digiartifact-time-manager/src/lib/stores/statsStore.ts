import { writable } from 'svelte/store'

import { defaultSettings } from '../types/settings'

export type WeeklyTotals = {
  weekBucket: string
  totalMinutes: number
  targetMinutes: number
}

export type PerJobTotals = Record<string, number>

export type PrimaryJobTotal = {
  jobId: string
  minutes: number
  hours: number
}

export type StatsState = {
  weekly: WeeklyTotals
  perJob: PerJobTotals
  weeklyTotalHours: number
  primaryJobTotals: PrimaryJobTotal[]
  lastUpdated: string | null
}

const initialState: StatsState = {
  weekly: {
    weekBucket: '',
    totalMinutes: 0,
    targetMinutes: defaultSettings.weekTargetHours * 60,
  },
  perJob: {},
  weeklyTotalHours: 0,
  primaryJobTotals: [],
  lastUpdated: null,
}

function minutesToHours(minutes: number) {
  return Math.max(0, Math.round((minutes / 60) * 100) / 100)
}

function computePrimaryJobTotals(perJob: PerJobTotals): PrimaryJobTotal[] {
  return Object.entries(perJob)
    .filter(([, minutes]) => minutes > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([jobId, minutes]) => ({
      jobId,
      minutes,
      hours: minutesToHours(minutes),
    }))
}

function createStatsStore() {
  const store = writable<StatsState>({ ...initialState })

  return {
    subscribe: store.subscribe,
    setSnapshot(snapshot: { weekly: WeeklyTotals; perJob: PerJobTotals; lastUpdated: string | null }) {
      const weeklyTotalHours = minutesToHours(snapshot.weekly.totalMinutes)
      const primaryJobTotals = computePrimaryJobTotals(snapshot.perJob)

      store.set({
        weekly: snapshot.weekly,
        perJob: { ...snapshot.perJob },
        weeklyTotalHours,
        primaryJobTotals,
        lastUpdated: snapshot.lastUpdated,
      })
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
          weeklyTotalHours: minutesToHours(weekly.totalMinutes),
          primaryJobTotals: computePrimaryJobTotals(perJob),
          lastUpdated: new Date().toISOString(),
        }
      })
    },
    setTargetMinutes(weekBucket: string, targetMinutes: number) {
      store.update((state) => {
        const weekly =
          state.weekly.weekBucket === weekBucket
            ? { ...state.weekly, targetMinutes }
            : { weekBucket, totalMinutes: 0, targetMinutes }

        return {
          weekly,
          perJob: state.perJob,
          weeklyTotalHours: minutesToHours(weekly.totalMinutes),
          primaryJobTotals: computePrimaryJobTotals(state.perJob),
          lastUpdated: new Date().toISOString(),
        }
      })
    },
    reset() {
      store.set({ ...initialState })
    },
    /**
     * Real-time update for active session minutes
     * Updates weekly totals with current running session time
     */
    updateLiveMinutes(weekBucket: string, liveMinutes: number, targetMinutes: number) {
      store.update((state) => {
        const weekly = {
          weekBucket,
          totalMinutes: liveMinutes,
          targetMinutes,
        }

        return {
          ...state,
          weekly,
          weeklyTotalHours: minutesToHours(liveMinutes),
          lastUpdated: new Date().toISOString(),
        }
      })
    },
  }
}

export const statsStore = createStatsStore()
