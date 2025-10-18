import { get } from 'svelte/store'

import { settingsStore } from '../stores/settingsStore'
import { timeLogsRepo } from '../repos/timeLogsRepo'
import { invoicesRepo } from '../repos/invoicesRepo'
import { paymentsRepo } from '../repos/paymentsRepo'
import { dealsRepo } from '../repos/dealsRepo'
import { startOfWeek, formatWeekBucket, type WeekStart } from '../utils/time'

export type WeekSeriesPoint = {
  week: string
  label: string
  minutes: number
}

export type MonthSeriesPoint = {
  label: string
  total: number
}

export type PipelineStagePoint = {
  stage: string
  total: number
}

export type AgingBucketPoint = {
  bucket: string
  total: number
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function getWeekStartValue(): WeekStart {
  const { weekStart } = get(settingsStore)
  return (weekStart as WeekStart) || 'Monday'
}

export async function fetchEightWeekHours(): Promise<WeekSeriesPoint[]> {
  const weekStart = getWeekStartValue()
  const now = new Date()
  const currentWeekStart = startOfWeek(now, weekStart)

  const buckets: Record<string, number> = {}
  const logs = await timeLogsRepo.list()
  for (const log of logs) {
    buckets[log.weekBucket] = (buckets[log.weekBucket] ?? 0) + log.durationMinutes
  }

  const result: WeekSeriesPoint[] = []
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(currentWeekStart)
    weekDate.setDate(weekDate.getDate() - i * 7)
    const bucket = formatWeekBucket(weekDate, weekStart)
    const label = bucket.slice(5)
    result.push({
      week: bucket,
      label,
      minutes: buckets[bucket] ?? 0,
    })
  }

  return result
}

export async function fetchRevenueByMonth(months = 6): Promise<MonthSeriesPoint[]> {
  const invoices = await invoicesRepo.list()
  const payments = await paymentsRepo.list()
  const map = new Map<string, { billed: number; paid: number }>()

  for (const invoice of invoices) {
    const monthKey = invoice.issueDate.slice(0, 7)
    if (!map.has(monthKey)) {
      map.set(monthKey, { billed: 0, paid: 0 })
    }
    map.get(monthKey)!.billed += invoice.total ?? 0
  }

  for (const payment of payments) {
    const monthKey = payment.receivedDate.slice(0, 7)
    if (!map.has(monthKey)) {
      map.set(monthKey, { billed: 0, paid: 0 })
    }
    map.get(monthKey)!.paid += payment.amount ?? 0
  }

  const keys = Array.from(map.keys()).sort()
  const recent = keys.slice(-months)

  return recent.map((key) => {
    const entry = map.get(key) ?? { billed: 0, paid: 0 }
    return {
      label: key,
      total: roundCurrency(entry.paid || entry.billed),
    }
  })
}

export async function fetchPipelineTotals(): Promise<PipelineStagePoint[]> {
  const deals = await dealsRepo.list()
  const stageMap = new Map<string, number>()

  for (const deal of deals) {
    const stage = deal.stage ?? 'Unknown'
    stageMap.set(stage, (stageMap.get(stage) ?? 0) + (deal.valueEstimate ?? 0))
  }

  return Array.from(stageMap.entries()).map(([stage, total]) => ({
    stage,
    total: roundCurrency(total),
  }))
}

export async function fetchAgingBuckets(): Promise<AgingBucketPoint[]> {
  const invoices = await invoicesRepo.list()
  const now = new Date()

  const buckets: Record<string, number> = {
    Current: 0,
    '1-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  }

  for (const invoice of invoices) {
    if ((invoice.status ?? '').toLowerCase() === 'paid') continue
    const due = new Date(invoice.dueDate)
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    const amount = invoice.total ?? 0

    if (diff <= 0) buckets.Current += amount
    else if (diff <= 30) buckets['1-30'] += amount
    else if (diff <= 60) buckets['31-60'] += amount
    else if (diff <= 90) buckets['61-90'] += amount
    else buckets['90+'] += amount
  }

  return Object.entries(buckets).map(([bucket, total]) => ({
    bucket,
    total: roundCurrency(total),
  }))
}
