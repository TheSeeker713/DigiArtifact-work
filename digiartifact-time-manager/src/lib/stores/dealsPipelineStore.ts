import { get, writable } from 'svelte/store'

import { clientsRepo } from '../repos/clientsRepo'
import { dealsRepo } from '../repos/dealsRepo'
import { jobsRepo } from '../repos/jobsRepo'
import type { ClientRecord, DealRecord, JobRecord } from '../types/entities'

export type DealsPipelineState = {
  deals: DealRecord[]
  clients: ClientRecord[]
  jobs: JobRecord[]
}

const INITIAL_STATE: DealsPipelineState = {
  deals: [],
  clients: [],
  jobs: [],
}

function createDealsPipelineStore() {
  const store = writable<DealsPipelineState>(INITIAL_STATE)
  const { subscribe, set } = store
  let initialized = false

  async function refresh() {
    const [deals, clients, jobs] = await Promise.all([
      dealsRepo.list(),
      clientsRepo.list(),
      jobsRepo.list(),
    ])

    set({ deals, clients, jobs })
    initialized = true
    return { deals, clients, jobs }
  }

  async function ensure() {
    if (!initialized) {
      await refresh()
    }
  }

  function getSnapshot() {
    return get(store)
  }

  function clear() {
    set(INITIAL_STATE)
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

export const dealsPipelineStore = createDealsPipelineStore()
