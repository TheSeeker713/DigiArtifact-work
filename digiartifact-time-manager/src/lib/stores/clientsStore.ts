import { get, writable } from 'svelte/store'

import { activitiesRepo } from '../repos/activitiesRepo'
import { clientsRepo } from '../repos/clientsRepo'
import { contactsRepo } from '../repos/contactsRepo'
import { dealsRepo } from '../repos/dealsRepo'
import { invoicesRepo } from '../repos/invoicesRepo'
import { paymentsRepo } from '../repos/paymentsRepo'
import type {
  ActivityRecord,
  ClientRecord,
  ContactRecord,
  DealRecord,
  InvoiceRecord,
  PaymentRecord,
} from '../types/entities'

export type ClientsState = {
  clients: ClientRecord[]
  contacts: ContactRecord[]
  deals: DealRecord[]
  invoices: InvoiceRecord[]
  payments: PaymentRecord[]
  activities: ActivityRecord[]
}

const INITIAL_STATE: ClientsState = {
  clients: [],
  contacts: [],
  deals: [],
  invoices: [],
  payments: [],
  activities: [],
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export type ClientCache = {
  contactsByClient: Record<string, ContactRecord[]>
  dealsByClient: Record<string, DealRecord[]>
  invoicesByClient: Record<string, InvoiceRecord[]>
  paymentsByInvoice: Record<string, PaymentRecord[]>
  paymentsByClient: Record<string, PaymentRecord[]>
  activitiesByClient: Record<string, ActivityRecord[]>
  outstandingByClient: Record<string, number>
  nextActionByClient: Record<string, string | undefined>
}

function pushRecord<T extends { clientId: string }>(
  bucket: Record<string, T[]>,
  record: T,
) {
  const list = bucket[record.clientId]
  if (list) {
    list.push(record)
  } else {
    bucket[record.clientId] = [record]
  }
}

function buildClientCache(state: ClientsState): ClientCache {
  const contactsByClient: Record<string, ContactRecord[]> = {}
  const dealsByClient: Record<string, DealRecord[]> = {}
  const invoicesByClient: Record<string, InvoiceRecord[]> = {}
  const paymentsByInvoice: Record<string, PaymentRecord[]> = {}
  const paymentsByClient: Record<string, PaymentRecord[]> = {}
  const activitiesByClient: Record<string, ActivityRecord[]> = {}
  const outstandingByClient: Record<string, number> = {}
  const nextActionByClient: Record<string, string | undefined> = {}

  const invoiceClientMap = new Map<string, string>()
  const today = new Date().toISOString().slice(0, 10)

  for (const contact of state.contacts) {
    pushRecord(contactsByClient, contact)
  }

  for (const deal of state.deals) {
    pushRecord(dealsByClient, deal)
  }

  for (const invoice of state.invoices) {
    pushRecord(invoicesByClient, invoice)
    invoiceClientMap.set(invoice.id, invoice.clientId)
  }

  for (const payment of state.payments) {
    const list = paymentsByInvoice[payment.invoiceId]
    if (list) {
      list.push(payment)
    } else {
      paymentsByInvoice[payment.invoiceId] = [payment]
    }

    const clientId = invoiceClientMap.get(payment.invoiceId)
    if (clientId) {
      const clientPayments = paymentsByClient[clientId]
      if (clientPayments) {
        clientPayments.push(payment)
      } else {
        paymentsByClient[clientId] = [payment]
      }
    }
  }

  for (const activity of state.activities) {
    pushRecord(activitiesByClient, activity)
    if (!activity.nextActionDate) continue
    const candidate = activity.nextActionDate
    const current = nextActionByClient[activity.clientId]
    if (!current) {
      nextActionByClient[activity.clientId] = candidate
      continue
    }

    const candidateFuture = candidate >= today
    const currentFuture = current >= today

    if (candidateFuture && !currentFuture) {
      nextActionByClient[activity.clientId] = candidate
      continue
    }

    if (candidateFuture === currentFuture && candidate < current) {
      nextActionByClient[activity.clientId] = candidate
    }
  }

  for (const invoice of state.invoices) {
    const paidTotal = (paymentsByInvoice[invoice.id] ?? []).reduce(
      (sum, payment) => sum + (payment.amount ?? 0),
      0,
    )
    const outstanding = Math.max(0, roundCurrency((invoice.total ?? 0) - paidTotal))
    if (!outstanding) continue
    outstandingByClient[invoice.clientId] = roundCurrency(
      (outstandingByClient[invoice.clientId] ?? 0) + outstanding,
    )
  }

  return {
    contactsByClient,
    dealsByClient,
    invoicesByClient,
    paymentsByInvoice,
    paymentsByClient,
    activitiesByClient,
    outstandingByClient,
    nextActionByClient,
  }
}

export type ClientSummary = {
  client: ClientRecord
  outstanding: number
  contactCount: number
  nextActionDate?: string
}

export type InvoiceWithAmounts = InvoiceRecord & {
  paidTotal: number
  outstanding: number
}

export type ClientDetail = {
  client: ClientRecord
  contacts: ContactRecord[]
  deals: DealRecord[]
  invoices: InvoiceWithAmounts[]
  payments: PaymentRecord[]
  activities: ActivityRecord[]
  outstanding: number
  nextActionDate?: string
}

export function getClientSummaries(state: ClientsState, cache?: ClientCache): ClientSummary[] {
  const computed = cache ?? buildClientCache(state)
  return state.clients.map((client) => ({
    client,
    outstanding: computed.outstandingByClient[client.id] ?? 0,
    contactCount: (computed.contactsByClient[client.id] ?? []).length,
    nextActionDate: computed.nextActionByClient[client.id],
  }))
}

export function getClientDetail(
  clientId: string,
  state: ClientsState,
  cache?: ClientCache,
): ClientDetail | null {
  const client = state.clients.find((entry) => entry.id === clientId)
  if (!client) return null

  const computed = cache ?? buildClientCache(state)

  const contacts = [...(computed.contactsByClient[clientId] ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  const deals = [...(computed.dealsByClient[clientId] ?? [])].sort((a, b) =>
    a.title.localeCompare(b.title),
  )

  const invoiceRecords = [...(computed.invoicesByClient[clientId] ?? [])].sort((a, b) =>
    (b.issueDate ?? '').localeCompare(a.issueDate ?? ''),
  )

  const invoices = invoiceRecords.map((invoice) => {
    const payments = computed.paymentsByInvoice[invoice.id] ?? []
    const paidTotal = roundCurrency(
      payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0),
    )
    const outstanding = Math.max(0, roundCurrency((invoice.total ?? 0) - paidTotal))
    return {
      ...invoice,
      paidTotal,
      outstanding,
    }
  })

  const payments = [...(computed.paymentsByClient[clientId] ?? [])].sort((a, b) =>
    (b.receivedDate ?? '').localeCompare(a.receivedDate ?? ''),
  )

  const activities = [...(computed.activitiesByClient[clientId] ?? [])].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? ''),
  )

  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstanding, 0)

  return {
    client,
    contacts,
    deals,
    invoices,
    payments,
    activities,
    outstanding,
    nextActionDate: computed.nextActionByClient[clientId],
  }
}

function createClientsStore() {
  const store = writable<ClientsState>(INITIAL_STATE)
  const { subscribe, set } = store
  let initialized = false

  async function refresh() {
    const [clients, contacts, deals, invoices, payments, activities] = await Promise.all([
      clientsRepo.list(),
      contactsRepo.list(),
      dealsRepo.list(),
      invoicesRepo.list(),
      paymentsRepo.list(),
      activitiesRepo.list(),
    ])

    const state: ClientsState = {
      clients,
      contacts,
      deals,
      invoices,
      payments,
      activities,
    }

    set(state)
    initialized = true
    return state
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

export const clientsStore = createClientsStore()
export const buildClientsCache = buildClientCache
