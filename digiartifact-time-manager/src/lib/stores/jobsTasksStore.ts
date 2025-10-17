import { get, writable } from 'svelte/store'

import { fetchJobsWithTasks, type JobWithTasks } from '../services/jobsTasksService'

function createJobsTasksStore() {
  const { subscribe, set } = writable<JobWithTasks[]>([])
  let initialized = false

  async function refresh(includeInactive = true) {
    const snapshot = await fetchJobsWithTasks(includeInactive)
    set(snapshot)
    initialized = true
    return snapshot
  }

  async function ensure(includeInactive = true) {
    if (!initialized) {
      await refresh(includeInactive)
    }
  }

  function getSnapshot() {
    return get({ subscribe })
  }

  function clear() {
    set([])
    initialized = false
  }

  return {
    subscribe,
    refresh,
    ensure,
    getSnapshot,
    clear,
  }
}

export const jobsTasksStore = createJobsTasksStore()
