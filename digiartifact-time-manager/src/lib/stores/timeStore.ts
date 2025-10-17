import { writable } from 'svelte/store'

export type TimerState = {
  active: boolean
  startedAt: string | null
  elapsedMs: number
  jobId: string | null
  taskId: string | null
  manualEntry: boolean
}

const initialState: TimerState = {
  active: false,
  startedAt: null,
  elapsedMs: 0,
  jobId: null,
  taskId: null,
  manualEntry: false,
}

let tickHandle: ReturnType<typeof setInterval> | undefined

function createTimeStore() {
  const store = writable<TimerState>({ ...initialState })

  function clearTicker() {
    if (tickHandle) {
      clearInterval(tickHandle)
      tickHandle = undefined
    }
  }

  function start(jobId: string, taskId: string | null, manual = false) {
    clearTicker()
    const startedAt = new Date().toISOString()
    store.set({
      active: true,
      startedAt,
      elapsedMs: 0,
      jobId,
      taskId,
      manualEntry: manual,
    })

    tickHandle = setInterval(() => {
      store.update((state) =>
        state.active && state.startedAt
          ? {
              ...state,
              elapsedMs: Date.now() - new Date(state.startedAt).getTime(),
            }
          : state,
      )
    }, 1000)
  }

  function stop() {
    clearTicker()
    store.update((state) => ({ ...state, active: false }))
  }

  function reset() {
    clearTicker()
    store.set({ ...initialState })
  }

  return {
    subscribe: store.subscribe,
    start,
    stop,
    reset,
    setManual(manualEntry: boolean) {
      store.update((state) => ({ ...state, manualEntry }))
    },
    setJob(jobId: string | null) {
      store.update((state) => ({ ...state, jobId }))
    },
    setTask(taskId: string | null) {
      store.update((state) => ({ ...state, taskId }))
    },
  }
}

export const timeStore = createTimeStore()
