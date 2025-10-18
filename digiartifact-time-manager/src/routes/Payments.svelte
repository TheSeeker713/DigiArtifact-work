<script lang="ts">
  import { onMount } from 'svelte'

  import {
    billingStore,
    buildBillingCache,
    getInvoicesWithDetails,
    type BillingState,
  } from '../lib/stores/billingStore'
  import { buildClientStatement, recordPaymentForInvoice } from '../lib/services/billingService'
  import { toastError, toastSuccess } from '../lib/stores/toastStore'

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  let loading = false
  let recording = false
  let exportingClientId: string | null = null
  let selectedClientId = ''
  let state: BillingState = {
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

  const todayIso = new Date().toISOString().slice(0, 10)

  type PaymentForm = {
    invoiceId: string
    amount: string
    receivedDate: string
    method: string
    reference: string
  }

  let paymentForm: PaymentForm = {
    invoiceId: '',
    amount: '',
    receivedDate: todayIso,
    method: '',
    reference: '',
  }

  onMount(async () => {
    loading = true
    try {
      await billingStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Unable to load payments data.')
    } finally {
      loading = false
    }
  })

  $: state = $billingStore
  $: cache = buildBillingCache(state)
  $: invoices = getInvoicesWithDetails(state, cache)
  $: invoiceLookup = new Map(invoices.map((invoice) => [invoice.id, invoice]))
  $: openInvoices = invoices.filter((invoice) => invoice.outstanding > 0.01)
  $: clients = [...state.clients].sort((a, b) => a.name.localeCompare(b.name))
  $: payments = [...state.payments].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))

  $: if (!paymentForm.invoiceId && openInvoices.length) {
    paymentForm = {
      ...paymentForm,
      invoiceId: openInvoices[0].id,
      amount: openInvoices[0].outstanding ? String(openInvoices[0].outstanding) : '',
    }
  }

  $: if (!openInvoices.length && paymentForm.invoiceId) {
    paymentForm = {
      ...paymentForm,
      invoiceId: '',
      amount: '',
    }
  }

  $: if (paymentForm.invoiceId) {
    const outstanding = invoiceLookup.get(paymentForm.invoiceId)?.outstanding ?? 0
    if (paymentForm.amount === '' && outstanding > 0) {
      paymentForm = {
        ...paymentForm,
        amount: String(outstanding),
      }
    }
  }

  function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0)
  }

  function formatDate(value: string | undefined) {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return dateFormatter.format(parsed)
  }

  function parseAmount(value: string) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.round(numeric * 100) / 100)
  }

  $: totalPayments = payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0)
  $: latestPayment = payments[0]

  function handleInvoiceChange(invoiceId: string) {
    paymentForm = {
      ...paymentForm,
      invoiceId,
      amount: invoiceLookup.get(invoiceId)?.outstanding
        ? String(invoiceLookup.get(invoiceId)?.outstanding)
        : '',
    }
  }

  async function handleRecordPayment(event: Event) {
    event.preventDefault()
    if (!paymentForm.invoiceId) {
      toastError('Choose an invoice to credit.')
      return
    }

    const amount = parseAmount(paymentForm.amount)
    if (amount <= 0) {
      toastError('Enter a payment amount greater than zero.')
      return
    }

    const invoice = invoiceLookup.get(paymentForm.invoiceId)
    if (!invoice) {
      toastError('Invoice no longer exists.')
      return
    }

    if (amount - invoice.outstanding > 1) {
      const confirmOver = window.confirm('This payment exceeds the outstanding balance. Continue?')
      if (!confirmOver) {
        return
      }
    }

    recording = true
    try {
      await recordPaymentForInvoice({
        invoiceId: paymentForm.invoiceId,
        amount,
        receivedDate: paymentForm.receivedDate,
        method: paymentForm.method,
        reference: paymentForm.reference,
      })
      await billingStore.refresh()
      toastSuccess('Payment recorded.')
      paymentForm = {
        invoiceId: paymentForm.invoiceId,
        amount: '',
        receivedDate: todayIso,
        method: '',
        reference: '',
      }
    } catch (error) {
      console.error(error)
      toastError('Unable to record payment.')
    } finally {
      recording = false
    }
  }

  function buildCsvValue(value: string | number) {
    const raw = typeof value === 'number' ? value.toString() : value
    const safe = raw.replace(/"/g, '""')
    return `"${safe}"`
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const header = ['Date', 'Type', 'Reference', 'Description', 'Amount', 'Balance', 'Due Date', 'Status']
    const csv = [header, ...rows]
      .map((line) => line.map((value) => buildCsvValue(value)).join(','))
      .join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function exportStatement(clientId: string) {
    if (!clientId) {
      toastError('Select a client to export.')
      return
    }
    exportingClientId = clientId
    try {
      const rows = buildClientStatement(state.invoices, state.payments, clientId)
      if (!rows.length) {
        toastError('No billing activity for this client yet.')
        return
      }
      const csvRows = rows.map((row) => [
        formatDate(row.date),
        row.type,
        row.reference,
        row.description,
        formatCurrency(row.amount),
        formatCurrency(row.balance),
        row.dueDate ? formatDate(row.dueDate) : '',
        row.status ?? '',
      ])
  const client = clients.find((entry) => entry.id === clientId)
      const filename = `statement-${client ? client.name.replace(/\s+/g, '-').toLowerCase() : 'client'}.csv`
      downloadCsv(filename, csvRows)
      toastSuccess('Client statement exported.')
    } catch (error) {
      console.error(error)
      toastError('Unable to export statement.')
    } finally {
      exportingClientId = null
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Payments</h2>
    <p class="text-sm text-slate-400">
      Log receipts, apply them to invoices, and export client statements without leaving offline mode.
    </p>
  </header>

  <article class="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Payments recorded</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{payments.length}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Total collected</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{formatCurrency(totalPayments)}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Outstanding invoices</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{openInvoices.length}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Latest payment</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">
        {latestPayment ? formatDate(latestPayment.receivedDate) : '—'}
      </p>
    </div>
  </article>

  <form class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200" on:submit={handleRecordPayment}>
    <header class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-slate-100">Record payment</h3>
      <p class="text-xs text-slate-400">Partial payments automatically update outstanding balances.</p>
    </header>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Invoice</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={paymentForm.invoiceId}
          on:change={(event) => handleInvoiceChange((event.currentTarget as HTMLSelectElement).value)}
          required
          disabled={openInvoices.length === 0}
        >
          {#if openInvoices.length === 0}
            <option value="">All invoices settled</option>
          {:else}
            {#each openInvoices as invoice}
              <option value={invoice.id}>
                {invoice.id.slice(0, 8)}… · {formatCurrency(invoice.outstanding)} due {formatDate(invoice.dueDate)}
              </option>
            {/each}
          {/if}
        </select>
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Amount</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="number"
          min="0"
          step="0.01"
          bind:value={paymentForm.amount}
          required
        />
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Received</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="date"
          bind:value={paymentForm.receivedDate}
          required
        />
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Method</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          placeholder="Wire, ACH, Cash"
          bind:value={paymentForm.method}
        />
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Reference</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          placeholder="Txn ID or memo"
          bind:value={paymentForm.reference}
        />
      </label>
    </div>

    <div class="flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        disabled={recording || !paymentForm.invoiceId}
      >
        {recording ? 'Saving…' : 'Record payment'}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        on:click={() => {
          paymentForm = {
            invoiceId: '',
            amount: '',
            receivedDate: todayIso,
            method: '',
            reference: '',
          }
        }}
        disabled={recording}
      >
        Clear form
      </button>
    </div>
  </form>

  <section class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-100">Client statements</h3>
        <p class="text-xs text-slate-400">Export CSV statements with running balances.</p>
      </div>
      <div class="flex items-center gap-3 text-sm text-slate-300">
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={selectedClientId}
        >
          <option value="">Select client</option>
          {#each clients as client}
            <option value={client.id}>{client.name}</option>
          {/each}
        </select>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          on:click={() => selectedClientId && exportStatement(selectedClientId)}
          disabled={!selectedClientId || !!exportingClientId}
        >
          {exportingClientId === selectedClientId ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
    </header>
  </section>

  {#if loading}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      Loading payments…
    </article>
  {:else if payments.length === 0}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      No payments logged yet.
    </article>
  {:else}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
      <header class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>Recent payments</span>
        <span>{payments.length}</span>
      </header>
      <div class="mt-3 overflow-x-auto">
        <table class="min-w-full text-left text-xs">
          <thead class="border-b border-slate-800 text-slate-400">
            <tr>
              <th class="px-3 py-2 font-semibold">Received</th>
              <th class="px-3 py-2 font-semibold">Invoice</th>
              <th class="px-3 py-2 font-semibold">Method</th>
              <th class="px-3 py-2 font-semibold">Reference</th>
              <th class="px-3 py-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-200">
            {#each payments as payment}
              <tr>
                <td class="px-3 py-2">{formatDate(payment.receivedDate)}</td>
                <td class="px-3 py-2">
                  {invoiceLookup.get(payment.invoiceId)
                    ? `Invoice ${payment.invoiceId.slice(0, 8)}…`
                    : 'Invoice removed'}
                </td>
                <td class="px-3 py-2">{payment.method ?? '—'}</td>
                <td class="px-3 py-2">{payment.reference ?? payment.id.slice(0, 8)}</td>
                <td class="px-3 py-2 text-right">{formatCurrency(payment.amount ?? 0)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </article>
  {/if}
</section>
