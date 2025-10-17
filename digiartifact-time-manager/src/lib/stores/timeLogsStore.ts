import { writable, get } from 'svelte/store'

import { timeLogsRepo } from '../repos/timeLogsRepo'
import type { TimeLogRecord } from '../types/entities'

function sortLogs(logs: TimeLogRecord[]) {
  return [...logs].sort((a, b) => b.startDT.localeCompare(a.startDT))
}

function createTimeLogsStore() {
  const { subscribe, set, update } = writable<TimeLogRecord[]>([])
  let hydrated = false

  async function hydrate(force = false) {
    if (hydrated && !force) return get({ subscribe })
    const logs = await timeLogsRepo.list()
    const sorted = sortLogs(logs)
    set(sorted)
    hydrated = true
    return sorted
  }

  function upsert(log: TimeLogRecord) {
    update((current) => {
      const index = current.findIndex((item) => item.id === log.id)
      if (index === -1) {
        return sortLogs([log, ...current])
      }
      const next = [...current]
      next[index] = log
      return sortLogs(next)
    })
  }

  function remove(id: string) {
    update((current) => current.filter((item) => item.id !== id))
  }

  function clear() {
    set([])
    hydrated = false
  }

  return {
    subscribe,
    hydrate,
    upsert,
    remove,
    clear,
    isHydrated() {
      return hydrated
    },
    getSnapshot() {
      return get({ subscribe })
    },
  }
}

export const timeLogsStore = createTimeLogsStore()
