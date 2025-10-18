import { clientsRepo } from '../repos/clientsRepo'
import { jobsRepo } from '../repos/jobsRepo'
import { tasksRepo } from '../repos/tasksRepo'
import { timeLogsRepo } from '../repos/timeLogsRepo'
import { invoicesRepo } from '../repos/invoicesRepo'
import { paymentsRepo } from '../repos/paymentsRepo'
import { expensesRepo } from '../repos/expensesRepo'
import { productsRepo } from '../repos/productsRepo'
import { productSalesRepo } from '../repos/productSalesRepo'
import { dealsRepo } from '../repos/dealsRepo'
import { peopleRepo } from '../repos/peopleRepo'
import type { ReportFilters, DataSnapshot, ReportResult, ExportEntity } from '../types/reports'

type ExportHandlers = {
  onMeta: (meta: { filename: string; mime: string }) => void
  onChunk: (chunk: string) => void
  onEnd: () => void
  onError: (message: string) => void
}

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    // Vite will handle this web worker import pattern
    worker = new Worker(new URL('../workers/reportsWorker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

async function getSnapshot(): Promise<DataSnapshot> {
  const [people, clients, jobs, tasks, timeLogs, invoices, payments, expenses, products, productSales, deals] =
    await Promise.all([
      peopleRepo.list(),
      clientsRepo.list(),
      jobsRepo.list(),
      tasksRepo.list(),
      timeLogsRepo.list(),
      invoicesRepo.list(),
      paymentsRepo.list(),
      expensesRepo.list(),
      productsRepo.list(),
      productSalesRepo.list(),
      dealsRepo.list(),
    ])

  return { people, clients, jobs, tasks, timeLogs, invoices, payments, expenses, products, productSales, deals }
}

export async function computeReports(filters: ReportFilters): Promise<ReportResult> {
  const snapshot = await getSnapshot()
  const w = getWorker()
  return new Promise<ReportResult>((resolve, reject) => {
    const handler = (ev: MessageEvent) => {
      const msg = ev.data
      if (msg?.type === 'result') {
        w.removeEventListener('message', handler)
        resolve(msg.payload as ReportResult)
      } else if (msg?.type === 'error') {
        w.removeEventListener('message', handler)
        reject(new Error(msg.message))
      }
    }
    w.addEventListener('message', handler)
    w.postMessage({ type: 'compute', filters, snapshot })
  })
}

export async function exportData(
  entity: ExportEntity,
  format: 'csv' | 'json',
  filters: ReportFilters,
  handlers: ExportHandlers,
) {
  const snapshot = await getSnapshot()
  const w = getWorker()
  const onMsg = (ev: MessageEvent) => {
    const msg = ev.data
    if (msg?.type === 'export-meta') handlers.onMeta({ filename: msg.filename, mime: msg.mime })
    else if (msg?.type === 'export-chunk') handlers.onChunk(msg.data)
    else if (msg?.type === 'export-end') {
      w.removeEventListener('message', onMsg)
      handlers.onEnd()
    } else if (msg?.type === 'error') {
      w.removeEventListener('message', onMsg)
      handlers.onError(msg.message)
    }
  }
  w.addEventListener('message', onMsg)
  w.postMessage({ type: 'export', entity, format, filters, snapshot })
}
