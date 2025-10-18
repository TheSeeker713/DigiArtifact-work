import { get, writable } from 'svelte/store'

import { clientsRepo } from '../repos/clientsRepo'
import { invoicesRepo } from '../repos/invoicesRepo'
import { invoiceItemsRepo } from '../repos/invoiceItemsRepo'
import { jobsRepo } from '../repos/jobsRepo'
import { paymentsRepo } from '../repos/paymentsRepo'
import { productSalesRepo } from '../repos/productSalesRepo'
import { productsRepo } from '../repos/productsRepo'
import { tasksRepo } from '../repos/tasksRepo'
import { timeLogsRepo } from '../repos/timeLogsRepo'
import type {
  ClientRecord,
  InvoiceItemRecord,
  InvoiceRecord,
  JobRecord,
  PaymentRecord,
  ProductRecord,
  ProductSaleRecord,
  TaskRecord,
  TimeLogRecord,
} from '../types/entities'

export type BillingState = {
  clients: ClientRecord[]
  jobs: JobRecord[]
  tasks: TaskRecord[]
  timeLogs: TimeLogRecord[]
  invoices: InvoiceRecord[]
  invoiceItems: InvoiceItemRecord[]
  payments: PaymentRecord[]
  products: ProductRecord[]
  productSales: ProductSaleRecord[]
  taxRate: number
}

const INITIAL_STATE: BillingState = {
  clients: [],
  jobs: [],
  tasks: [],
  timeLogs: [],
  invoices: [],
  invoiceItems: [],
  payments: [],
  products: [],
  productSales: [],
  taxRate: 0.0825,
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export type BillingCache = {
  itemsByInvoice: Record<string, InvoiceItemRecord[]>
  paymentsByInvoice: Record<string, PaymentRecord[]>
  invoicesByClient: Record<string, InvoiceRecord[]>
  jobsByClient: Record<string, JobRecord[]>
  tasksByJob: Record<string, TaskRecord[]>
  timeLogsByJob: Record<string, TimeLogRecord[]>
  productSalesByProduct: Record<string, ProductSaleRecord[]>
}

export type InvoiceComputed = InvoiceRecord & {
  items: InvoiceItemRecord[]
  payments: PaymentRecord[]
  paidTotal: number
  outstanding: number
}

export type TimeLogGroup = {
  jobId: string
  taskId?: string | null
  minutes: number
  logs: TimeLogRecord[]
  jobTitle: string
  taskName?: string
}

function pushByKey<T extends { id?: string }>(bucket: Record<string, T[]>, key: string, value: T) {
  const list = bucket[key]
  if (list) {
    list.push(value)
  } else {
    bucket[key] = [value]
  }
}

export function buildBillingCache(state: BillingState): BillingCache {
  const itemsByInvoice: Record<string, InvoiceItemRecord[]> = {}
  const paymentsByInvoice: Record<string, PaymentRecord[]> = {}
  const invoicesByClient: Record<string, InvoiceRecord[]> = {}
  const jobsByClient: Record<string, JobRecord[]> = {}
  const tasksByJob: Record<string, TaskRecord[]> = {}
  const timeLogsByJob: Record<string, TimeLogRecord[]> = {}
  const productSalesByProduct: Record<string, ProductSaleRecord[]> = {}

  state.invoiceItems.forEach((item) => pushByKey(itemsByInvoice, item.invoiceId, item))
  state.payments.forEach((payment) => pushByKey(paymentsByInvoice, payment.invoiceId, payment))
  state.invoices.forEach((invoice) => pushByKey(invoicesByClient, invoice.clientId, invoice))
  state.jobs.forEach((job) => pushByKey(jobsByClient, job.clientId ?? 'unassigned', job))
  state.tasks.forEach((task) => pushByKey(tasksByJob, task.jobId, task))
  state.timeLogs.forEach((log) => pushByKey(timeLogsByJob, log.jobId, log))
  state.productSales.forEach((sale) => pushByKey(productSalesByProduct, sale.productId, sale))

  return {
    itemsByInvoice,
    paymentsByInvoice,
    invoicesByClient,
    jobsByClient,
    tasksByJob,
    timeLogsByJob,
    productSalesByProduct,
  }
}

export function getInvoiceComputed(
  invoice: InvoiceRecord,
  cache: BillingCache,
): InvoiceComputed {
  const items = [...(cache.itemsByInvoice[invoice.id] ?? [])]
  const payments = [...(cache.paymentsByInvoice[invoice.id] ?? [])]
  const paidTotal = roundCurrency(payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0))
  const outstanding = Math.max(0, roundCurrency((invoice.total ?? 0) - paidTotal))

  return {
    ...invoice,
    items,
    payments,
    paidTotal,
    outstanding,
  }
}

export function getInvoicesWithDetails(
  state: BillingState,
  cache?: BillingCache,
): InvoiceComputed[] {
  const computedCache = cache ?? buildBillingCache(state)
  return state.invoices
    .map((invoice) => getInvoiceComputed(invoice, computedCache))
    .sort((a, b) => (b.issueDate ?? '').localeCompare(a.issueDate ?? ''))
}

export function groupBillableTimeForClient(
  state: BillingState,
  clientId: string,
  startIso: string,
  endIso: string,
): TimeLogGroup[] {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return []
  }

  const jobMap = new Map(state.jobs.filter((job) => job.clientId === clientId).map((job) => [job.id, job]))
  if (jobMap.size === 0) return []

  const tasksByJob = new Map<string, Map<string, TaskRecord>>()
  for (const task of state.tasks) {
    let taskMap = tasksByJob.get(task.jobId)
    if (!taskMap) {
      taskMap = new Map()
      tasksByJob.set(task.jobId, taskMap)
    }
    taskMap.set(task.id, task)
  }

  const groups = new Map<string, TimeLogGroup>()

  for (const log of state.timeLogs) {
    if (!log.billable) continue
    if (log.approved === false) continue
    if (log.invoiceId) continue
    if (!jobMap.has(log.jobId)) continue

    const logStart = new Date(log.startDT)
    if (Number.isNaN(logStart.getTime())) continue
    if (logStart < start || logStart > end) continue

    const taskId = log.taskId ?? ''
    const key = `${log.jobId}::${taskId}`
    const existing = groups.get(key)
    if (existing) {
      existing.minutes += log.durationMinutes
      existing.logs.push(log)
    } else {
      const job = jobMap.get(log.jobId)
      const taskName = log.taskId ? tasksByJob.get(log.jobId)?.get(log.taskId)?.name : undefined
      groups.set(key, {
        jobId: log.jobId,
        taskId: log.taskId ?? undefined,
        minutes: log.durationMinutes,
        logs: [log],
        jobTitle: job?.title ?? 'Job',
        taskName,
      })
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.jobTitle !== b.jobTitle) return a.jobTitle.localeCompare(b.jobTitle)
    const taskA = a.taskName ?? ''
    const taskB = b.taskName ?? ''
    return taskA.localeCompare(taskB)
  })
}

function createBillingStore() {
  const store = writable<BillingState>(INITIAL_STATE)
  const { subscribe, set } = store
  let initialized = false

  async function refresh() {
    const [clients, jobs, tasks, timeLogs, invoices, invoiceItems, payments, products, productSales] =
      await Promise.all([
        clientsRepo.list(),
        jobsRepo.list(),
        tasksRepo.list(),
        timeLogsRepo.list(),
        invoicesRepo.list(),
        invoiceItemsRepo.list(),
        paymentsRepo.list(),
        productsRepo.list(),
        productSalesRepo.list(),
      ])

    const state: BillingState = {
      clients,
      jobs,
      tasks,
      timeLogs,
      invoices,
      invoiceItems,
      payments,
      products,
      productSales,
      taxRate: INITIAL_STATE.taxRate,
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

export const billingStore = createBillingStore()
