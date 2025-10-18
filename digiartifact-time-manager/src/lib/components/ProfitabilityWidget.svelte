<script lang="ts">
  import { onMount } from 'svelte'

  import { expensesRepo } from '../repos/expensesRepo'
  import { invoicesRepo } from '../repos/invoicesRepo'
  import { invoiceItemsRepo } from '../repos/invoiceItemsRepo'
  import { timeLogsRepo } from '../repos/timeLogsRepo'
  import type { ExpenseRecord, InvoiceRecord, InvoiceItemRecord, TimeLogRecord } from '../types/entities'

  export let jobId: string | undefined = undefined
  export let clientId: string | undefined = undefined
  export let defaultRate = 0

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  let loading = false
  let startDate = ''
  let endDate = ''

  let expenses: ExpenseRecord[] = []
  let invoices: InvoiceRecord[] = []
  let invoiceItems: InvoiceItemRecord[] = []
  let timeLogs: TimeLogRecord[] = []

  const today = new Date()
  const ninetyDaysAgo = new Date(today)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  startDate = ninetyDaysAgo.toISOString().slice(0, 10)
  endDate = today.toISOString().slice(0, 10)

  onMount(async () => {
    await loadData()
  })

  async function loadData() {
    if (!jobId && !clientId) return

    loading = true
    try {
      if (jobId) {
        const [expenseData, invoiceData, invoiceItemData, timeLogData] = await Promise.all([
          expensesRepo.listByJob(jobId),
          invoicesRepo.list(),
          invoiceItemsRepo.list(),
          timeLogsRepo.listByJob(jobId),
        ])
        expenses = expenseData
        invoiceItems = invoiceItemData.filter((item) => item.jobId === jobId)
        const invoiceIds = new Set(invoiceItems.map((item) => item.invoiceId))
        invoices = invoiceData.filter((invoice) => invoiceIds.has(invoice.id))
        timeLogs = timeLogData
      } else if (clientId) {
        const [expenseData, invoiceData, invoiceItemData, allJobs] = await Promise.all([
          expensesRepo.listByClient(clientId),
          invoicesRepo.listByClient(clientId),
          invoiceItemsRepo.list(),
          expensesRepo.list(),
        ])
        expenses = expenseData
        invoices = invoiceData
        const invoiceIds = new Set(invoices.map((invoice) => invoice.id))
        invoiceItems = invoiceItemData.filter((item) => invoiceIds.has(item.invoiceId))
        timeLogs = []
      }
    } catch (error) {
      console.error(error)
    } finally {
      loading = false
    }
  }

  function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0)
  }

  function isWithinRange(dateStr: string, start: string, end: string) {
    if (!start || !end) return true
    return dateStr >= start && dateStr <= end
  }

  $: filteredExpenses = expenses.filter((expense) => isWithinRange(expense.date, startDate, endDate))
  $: totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)

  $: filteredInvoices = invoices.filter((invoice) => isWithinRange(invoice.issueDate, startDate, endDate))
  $: filteredInvoiceIds = new Set(filteredInvoices.map((invoice) => invoice.id))
  $: filteredInvoiceItems = invoiceItems.filter((item) => filteredInvoiceIds.has(item.invoiceId))
  $: invoicedRevenue = filteredInvoiceItems.reduce((sum, item) => sum + (item.amount ?? 0), 0)

  $: filteredTimeLogs = timeLogs.filter((log) => isWithinRange(log.startDT, startDate, endDate) && log.billable && !log.invoiceId)
  $: unbilledHours = filteredTimeLogs.reduce((sum, log) => sum + log.durationMinutes / 60, 0)
  $: forecastRevenue = unbilledHours * defaultRate

  $: totalRevenue = invoicedRevenue + forecastRevenue
  $: profit = totalRevenue - totalExpenses
  $: profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  async function handleRangeChange() {
    await loadData()
  }
</script>

<article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
  <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 class="text-lg font-semibold text-slate-100">Profitability</h3>
      <p class="text-xs text-slate-400">
        Revenue (invoiced + forecast) minus expenses over selected range
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <input
        class="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-slate-100"
        type="date"
        bind:value={startDate}
        on:change={handleRangeChange}
      />
      <span class="text-slate-500">to</span>
      <input
        class="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-slate-100"
        type="date"
        bind:value={endDate}
        on:change={handleRangeChange}
      />
    </div>
  </header>

  {#if loading}
    <p class="text-slate-400">Loading profitability data…</p>
  {:else}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <span class="text-xs uppercase tracking-wide text-slate-500">Invoiced</span>
        <p class="mt-1 text-lg font-semibold text-slate-100">{formatCurrency(invoicedRevenue)}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <span class="text-xs uppercase tracking-wide text-slate-500">Forecast</span>
        <p class="mt-1 text-lg font-semibold text-slate-100">{formatCurrency(forecastRevenue)}</p>
        <p class="text-xs text-slate-400">{unbilledHours.toFixed(1)}h @ {formatCurrency(defaultRate)}/h</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <span class="text-xs uppercase tracking-wide text-slate-500">Expenses</span>
        <p class="mt-1 text-lg font-semibold text-red-400">{formatCurrency(totalExpenses)}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <span class="text-xs uppercase tracking-wide text-slate-500">Net Profit</span>
        <p class="mt-1 text-lg font-semibold {profit >= 0 ? 'text-green-400' : 'text-red-400'}">
          {formatCurrency(profit)}
        </p>
        <p class="text-xs text-slate-400">{profitMargin.toFixed(1)}% margin</p>
      </div>
    </div>
  {/if}
</article>
