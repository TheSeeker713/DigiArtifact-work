/// <reference lib="webworker" />
import type {
  DataSnapshot,
  ReportFilters,
  ReportResult,
  ExportEntity,
} from '../types/reports'

type WorkerRequest =
  | { type: 'compute'; filters: ReportFilters; snapshot: DataSnapshot }
  | { type: 'export'; format: 'csv' | 'json'; entity: ExportEntity; filters: ReportFilters; snapshot: DataSnapshot }

type WorkerResponse =
  | { type: 'result'; payload: ReportResult }
  | { type: 'export-meta'; filename: string; mime: string }
  | { type: 'export-chunk'; data: string }
  | { type: 'export-end' }
  | { type: 'error'; message: string }

function round2(n: number) { return Math.round(n * 100) / 100 }

function within(dateIso: string, start?: string | null, end?: string | null): boolean {
  const t = new Date(dateIso).getTime()
  if (!Number.isFinite(t)) return false
  if (start) {
    const s = new Date(start).getTime()
    if (Number.isFinite(s) && t < s) return false
  }
  if (end) {
    const e = new Date(end).getTime()
    if (Number.isFinite(e) && t > e) return false
  }
  return true
}

function compute(filters: ReportFilters, s: DataSnapshot): ReportResult {
  const { startDate, endDate, clientId, jobId, billable } = filters

  const jobsById = new Map(s.jobs.map(j => [j.id, j]))
  const peopleById = new Map(s.people.map(p => [p.id, p]))
  const productsById = new Map(s.products.map(p => [p.id, p]))

  // Time
  const filteredLogs = s.timeLogs.filter(l => {
    if (l.deletedAt) return false
    if (billable === 'yes' && !l.billable) return false
    if (billable === 'no' && l.billable) return false
    if (jobId && l.jobId !== jobId) return false
    if (clientId) {
      const job = jobsById.get(l.jobId)
      if (!job || job.clientId !== clientId) return false
    }
    return within(l.startDT, startDate, endDate)
  })

  let totalMinutes = 0
  const minutesByJob = new Map<string, number>()
  const minutesByPerson = new Map<string | undefined, number>()
  for (const log of filteredLogs) {
    totalMinutes += log.durationMinutes
    minutesByJob.set(log.jobId, (minutesByJob.get(log.jobId) ?? 0) + log.durationMinutes)
    minutesByPerson.set(log.personId, (minutesByPerson.get(log.personId) ?? 0) + log.durationMinutes)
  }

  const time = {
    totalMinutes,
    byJob: Array.from(minutesByJob.entries()).map(([jid, minutes]) => ({
      jobId: jid,
      jobTitle: jobsById.get(jid)?.title ?? 'Job',
      minutes,
    })).sort((a, b) => b.minutes - a.minutes),
    byPerson: Array.from(minutesByPerson.entries()).map(([pid, minutes]) => ({
      personId: pid,
      personName: pid ? (peopleById.get(pid)?.name ?? 'Person') : 'Unassigned',
      minutes,
    })).sort((a, b) => b.minutes - a.minutes),
  }

  // Billing
  const invFiltered = s.invoices.filter(i => {
    if (clientId && i.clientId !== clientId) return false
    return within(i.issueDate, startDate, endDate)
  })
  const invoiceIds = new Set(invFiltered.map(i => i.id))
  const payFiltered = s.payments.filter(p => invoiceIds.has(p.invoiceId) && within(p.receivedDate, startDate, endDate))
  const invoicesTotal = round2(invFiltered.reduce((sum, i) => sum + (i.total ?? 0), 0))
  const paymentsTotal = round2(payFiltered.reduce((sum, p) => sum + (p.amount ?? 0), 0))
  const outstandingTotal = round2(invoicesTotal - paymentsTotal)
  const billing = { invoicesTotal, paymentsTotal, outstandingTotal }

  // Profit
  const expensesFiltered = s.expenses.filter(e => {
    if (clientId && e.clientId !== clientId) return false
    if (jobId && e.jobId !== jobId) return false
    return within(e.date, startDate, endDate)
  })
  const revenue = invoicesTotal
  const expenses = round2(expensesFiltered.reduce((sum, e) => sum + (e.amount ?? 0), 0))
  const profit = round2(revenue - expenses)
  const profitSummary = { revenue, expenses, profit }

  // Pipeline
  const dealsFiltered = s.deals.filter(d => !d.deletedAt && (!clientId || d.clientId === clientId))
  const byStageMap = new Map<string, { count: number; estimatedValue: number }>()
  for (const d of dealsFiltered) {
    const stat = byStageMap.get(d.stage) ?? { count: 0, estimatedValue: 0 }
    stat.count += 1
    stat.estimatedValue += d.valueEstimate ?? 0
    byStageMap.set(d.stage, stat)
  }
  const pipeline = { byStage: Array.from(byStageMap.entries()).map(([stage, v]) => ({ stage, ...v })) }

  // Product sales
  const salesFiltered = s.productSales.filter(ps => within(ps.date, startDate, endDate))
  const byProductMap = new Map<string, { net: number; qty: number }>()
  for (const ps of salesFiltered) {
    const bucket = byProductMap.get(ps.productId) ?? { net: 0, qty: 0 }
    bucket.net += ps.net ?? 0
    bucket.qty += ps.quantity ?? 0
    byProductMap.set(ps.productId, bucket)
  }
  const productSales = {
    byProduct: Array.from(byProductMap.entries()).map(([pid, v]) => ({
      productId: pid,
      sku: productsById.get(pid)?.sku ?? '',
      title: productsById.get(pid)?.title ?? 'Product',
      net: round2(v.net),
      qty: v.qty,
    })).sort((a, b) => b.net - a.net),
  }

  return { time, billing, profit: profitSummary, pipeline, productSales }
}

function csvEscape(v: unknown): string {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function* toCsv(entity: ExportEntity, rows: any[]): Generator<string> {
  switch (entity) {
    case 'timeLogs': {
      yield 'id,startDT,endDT,durationMinutes,jobId,taskId,personId,billable,approved,invoiceId,note\n'
      for (const r of rows) {
        yield [r.id, r.startDT, r.endDT, r.durationMinutes, r.jobId, r.taskId ?? '', r.personId ?? '', r.billable, r.approved ?? '', r.invoiceId ?? '', csvEscape(r.note)].join(',') + '\n'
      }
      break
    }
    case 'invoices': {
      yield 'id,clientId,issueDate,dueDate,status,subtotal,tax,total,currency\n'
      for (const r of rows) {
        yield [r.id, r.clientId, r.issueDate, r.dueDate, r.status, r.subtotal, r.tax, r.total, r.currency].join(',') + '\n'
      }
      break
    }
    case 'payments': {
      yield 'id,invoiceId,receivedDate,method,amount,reference\n'
      for (const r of rows) {
        yield [r.id, r.invoiceId, r.receivedDate, csvEscape(r.method), r.amount, csvEscape(r.reference)].join(',') + '\n'
      }
      break
    }
    case 'expenses': {
      yield 'id,date,clientId,jobId,category,vendor,amount,note\n'
      for (const r of rows) {
        yield [r.id, r.date, r.clientId ?? '', r.jobId ?? '', csvEscape(r.category), csvEscape(r.vendor), r.amount, csvEscape(r.note)].join(',') + '\n'
      }
      break
    }
    case 'productSales': {
      yield 'id,date,productId,quantity,gross,fees,net,channelRef\n'
      for (const r of rows) {
        yield [r.id, r.date, r.productId, r.quantity, r.gross, r.fees, r.net, csvEscape(r.channelRef)].join(',') + '\n'
      }
      break
    }
    case 'deals': {
      yield 'id,clientId,title,stage,valueEstimate,probability,jobType,jobId,tags,stageChangedAt\n'
      for (const r of rows) {
        yield [r.id, r.clientId, csvEscape(r.title), r.stage, r.valueEstimate ?? '', r.probability ?? '', csvEscape(r.jobType), r.jobId ?? '', (r.tags ?? []).join('|'), r.stageChangedAt ?? ''].join(',') + '\n'
      }
      break
    }
  }
}

function filterRowsForExport(entity: ExportEntity, filters: ReportFilters, s: DataSnapshot): any[] {
  const { startDate, endDate, clientId, jobId } = filters
  switch (entity) {
    case 'timeLogs':
      return s.timeLogs.filter(r => within(r.startDT, startDate, endDate) && (!jobId || r.jobId === jobId))
    case 'invoices':
      return s.invoices.filter(r => within(r.issueDate, startDate, endDate) && (!clientId || r.clientId === clientId))
    case 'payments': {
      const invIds = new Set(s.invoices.filter(i => (!clientId || i.clientId === clientId)).map(i => i.id))
      return s.payments.filter(r => invIds.has(r.invoiceId) && within(r.receivedDate, startDate, endDate))
    }
    case 'expenses':
      return s.expenses.filter(r => within(r.date, startDate, endDate) && (!clientId || r.clientId === clientId) && (!jobId || r.jobId === jobId))
    case 'productSales':
      return s.productSales.filter(r => within(r.date, startDate, endDate))
    case 'deals':
      return s.deals.filter(r => !r.deletedAt && (!clientId || r.clientId === clientId))
  }
}

function handleExport(format: 'csv' | 'json', entity: ExportEntity, filters: ReportFilters, s: DataSnapshot) {
  const rows = filterRowsForExport(entity, filters, s)
  const filename = `${entity}-${Date.now()}.${format}`
  const mime = format === 'csv' ? 'text/csv' : 'application/json'
  ;(self as any).postMessage({ type: 'export-meta', filename, mime } satisfies WorkerResponse)

  if (format === 'csv') {
    const gen = toCsv(entity, rows)
    for (const chunk of gen) {
      ;(self as any).postMessage({ type: 'export-chunk', data: chunk } satisfies WorkerResponse)
    }
  } else {
    // Stream JSON array in chunks
    ;(self as any).postMessage({ type: 'export-chunk', data: '[' } satisfies WorkerResponse)
    rows.forEach((row, idx) => {
      const json = JSON.stringify(row)
      const prefix = idx === 0 ? '' : ','
      ;(self as any).postMessage({ type: 'export-chunk', data: prefix + json } satisfies WorkerResponse)
    })
    ;(self as any).postMessage({ type: 'export-chunk', data: ']' } satisfies WorkerResponse)
  }

  ;(self as any).postMessage({ type: 'export-end' } satisfies WorkerResponse)
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  try {
    const msg = ev.data
    if (msg.type === 'compute') {
      const result = compute(msg.filters, msg.snapshot)
      ;(self as any).postMessage({ type: 'result', payload: result } satisfies WorkerResponse)
    } else if (msg.type === 'export') {
      handleExport(msg.format, msg.entity, msg.filters, msg.snapshot)
    }
  } catch (err: any) {
    ;(self as any).postMessage({ type: 'error', message: err?.message ?? String(err) } satisfies WorkerResponse)
  }
}

export {}
