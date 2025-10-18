<script lang="ts">
  import { onMount } from 'svelte'

  import {
    billingStore,
    buildBillingCache,
    getInvoicesWithDetails,
    groupBillableTimeForClient,
    type BillingState,
    type InvoiceComputed,
    type TimeLogGroup,
  } from '../lib/stores/billingStore'
  import {
    createInvoiceFromDraft,
    updateInvoiceStatus,
    type InvoiceDraftInput,
    type TimeLogInvoiceGroupInput,
  } from '../lib/services/billingService'
  import { toastError, toastSuccess, toastInfo } from '../lib/stores/toastStore'
  import type { InvoiceRecord } from '../lib/types/entities'

  const invoiceStatuses: InvoiceRecord['status'][] = ['draft', 'sent', 'partial', 'paid', 'overdue']

  type TimeGroupSelection = {
    selected: boolean
    rate: string
    description: string
  }

  type ManualLineDraft = {
    id: string
    description: string
    quantity: string
    unitPrice: string
    type: 'other' | 'expense'
  }

  type ProductLineDraft = {
    id: string
    productId: string
    description: string
    quantity: string
    unitPrice: string
  }

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  let loading = false
  let creating = false
  let savingStatus: Record<string, boolean> = {}
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

  function addDays(base: string, days: number) {
    if (!base) return todayIso
    const date = new Date(base)
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
  }

  function randomId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }

  onMount(async () => {
    loading = true
    try {
      await billingStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Unable to load billing data.')
    } finally {
      loading = false
    }
  })

  $: state = $billingStore
  $: cache = buildBillingCache(state)
  $: invoices = getInvoicesWithDetails(state, cache)
  $: clients = [...state.clients].sort((a, b) => a.name.localeCompare(b.name))
  $: products = [...state.products].sort((a, b) => a.title.localeCompare(b.title))

  let selectedClientId = ''
  $: if (!selectedClientId && clients.length) {
    selectedClientId = clients[0].id
  }

  let issueDate = todayIso
  let dueDate = addDays(todayIso, 14)
  let statusSelection: InvoiceRecord['status'] = 'draft'
  let taxRateInput = (state.taxRate * 100).toFixed(2)
  $: if (!taxRateInput && state.taxRate >= 0) {
    taxRateInput = (state.taxRate * 100).toFixed(2)
  }

  let notes = ''
  let timeRangeStart = todayIso
  let timeRangeEnd = todayIso
  let timeGroupSelections: Record<string, TimeGroupSelection> = {}
  let manualLines: ManualLineDraft[] = []
  let productLines: ProductLineDraft[] = []

  function toStartIso(date: string) {
    if (!date) return ''
    return new Date(`${date}T00:00:00`).toISOString()
  }

  function toEndIso(date: string) {
    if (!date) return ''
    return new Date(`${date}T23:59:59`).toISOString()
  }

  function timeGroupKey(group: TimeLogGroup) {
    return `${group.jobId}::${group.taskId ?? ''}`
  }

  $: timeGroups = selectedClientId && timeRangeStart && timeRangeEnd
    ? groupBillableTimeForClient(state, selectedClientId, toStartIso(timeRangeStart), toEndIso(timeRangeEnd))
    : []

  $: timeGroupMap = new Map(timeGroups.map((group) => [timeGroupKey(group), group]))

  function ensureSelections(groups: TimeLogGroup[]) {
    const next: Record<string, TimeGroupSelection> = {}
    let changed = false
    for (const group of groups) {
      const key = timeGroupKey(group)
      const existing = timeGroupSelections[key]
      if (existing) {
        next[key] = existing
      } else {
        const job = state.jobs.find((entry) => entry.id === group.jobId)
        const defaultRate = job?.rate ?? 0
        next[key] = {
          selected: false,
          rate: defaultRate ? String(defaultRate) : '0',
          description: group.taskName ? `${group.jobTitle} — ${group.taskName}` : group.jobTitle,
        }
        changed = true
      }
    }

    if (Object.keys(timeGroupSelections).length !== Object.keys(next).length) {
      changed = true
    }

    if (changed) {
      timeGroupSelections = next
    }
  }

  $: ensureSelections(timeGroups)

  function addManualLine() {
    manualLines = [
      ...manualLines,
      {
        id: randomId(),
        description: '',
        quantity: '1',
        unitPrice: '0',
        type: 'other',
      },
    ]
  }

  function removeManualLine(id: string) {
    manualLines = manualLines.filter((line) => line.id !== id)
  }

  function addProductLine() {
    productLines = [
      ...productLines,
      {
        id: randomId(),
        productId: products[0]?.id ?? '',
        description: products[0]?.title ?? '',
        quantity: '1',
        unitPrice: products[0] ? String(products[0].price ?? 0) : '0',
      },
    ]
  }

  function removeProductLine(id: string) {
    productLines = productLines.filter((line) => line.id !== id)
  }

  function roundCurrency(value: number) {
    return Math.round(value * 100) / 100
  }

  function parseNumber(value: string) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return numeric
  }

  $: selectedTimeItems = Object.entries(timeGroupSelections)
    .filter(([key, selection]) => selection.selected && timeGroupMap.has(key))
    .map(([key, selection]) => {
      const group = timeGroupMap.get(key)!
      const rate = parseNumber(selection.rate)
      const hours = roundCurrency(group.minutes / 60)
      const amount = roundCurrency(hours * rate)
      return {
        key,
        group,
        rate,
        hours,
        amount,
        description: selection.description,
      }
    })

  $: manualPreview = manualLines
    .map((line) => {
      const quantity = parseNumber(line.quantity)
      const unitPrice = parseNumber(line.unitPrice)
      const amount = roundCurrency(quantity * unitPrice)
      return {
        id: line.id,
        description: line.description.trim(),
        quantity,
        unitPrice,
        amount,
        type: line.type,
      }
    })
    .filter((line) => line.description && line.quantity > 0 && line.unitPrice >= 0)

  $: productPreview = productLines
    .map((line) => {
      const quantity = parseNumber(line.quantity)
      const unitPrice = parseNumber(line.unitPrice)
      const amount = roundCurrency(quantity * unitPrice)
      return {
        id: line.id,
        productId: line.productId,
        description: line.description.trim(),
        quantity,
        unitPrice,
        amount,
      }
    })
    .filter((line) => line.description && line.quantity > 0 && line.unitPrice >= 0)

  $: subtotal = roundCurrency(
    selectedTimeItems.reduce((sum, item) => sum + item.amount, 0) +
      manualPreview.reduce((sum, item) => sum + item.amount, 0) +
      productPreview.reduce((sum, item) => sum + item.amount, 0),
  )

  function parseTaxRate(value: string) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric < 0) return 0
    return numeric / 100
  }

  $: taxRateDecimal = parseTaxRate(taxRateInput)
  $: taxAmount = roundCurrency(subtotal * taxRateDecimal)
  $: totalAmount = roundCurrency(subtotal + taxAmount)

  $: outstandingTotal = invoices.reduce((sum, invoice) => sum + invoice.outstanding, 0)
  $: draftedCount = invoices.filter((invoice) => invoice.status === 'draft').length
  $: sentCount = invoices.filter((invoice) => invoice.status === 'sent').length
  $: overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length

  function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0)
  }

  function formatDate(value: string | undefined) {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return dateFormatter.format(parsed)
  }

  async function handleCreateInvoice(event: Event) {
    event.preventDefault()
    if (!selectedClientId) {
      toastError('Select a client to invoice.')
      return
    }
    if (!selectedTimeItems.length && !manualPreview.length && !productPreview.length) {
      toastError('Add at least one line item before creating an invoice.')
      return
    }

    const timeLogItems: TimeLogInvoiceGroupInput[] = selectedTimeItems.map((item) => ({
      jobId: item.group.jobId,
      taskId: item.group.taskId ?? null,
      minutes: item.group.minutes,
      rate: item.rate,
      description: item.description,
      logIds: item.group.logs.map((log) => log.id),
    }))

    const manualItems: InvoiceDraftInput['manualItems'] = manualPreview.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      type: item.type,
    }))

    const productItems: InvoiceDraftInput['productItems'] = productPreview.map((item) => ({
      productId: item.productId || undefined,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))

    creating = true
    try {
      await createInvoiceFromDraft({
        clientId: selectedClientId,
        issueDate,
        dueDate,
        status: statusSelection,
        taxRate: taxRateDecimal,
        notes,
        timeLogItems,
        manualItems,
        productItems,
      })
      await billingStore.refresh()
      toastSuccess('Invoice created.')
      notes = ''
      manualLines = []
      productLines = []
      timeGroupSelections = {}
      timeRangeStart = issueDate
      timeRangeEnd = dueDate
    } catch (error) {
      console.error(error)
      if (error instanceof Error && error.message === 'EMPTY_INVOICE') {
        toastError('Cannot create an empty invoice.')
      } else {
        toastError('Unable to create the invoice.')
      }
    } finally {
      creating = false
    }
  }

  async function handleStatusChange(invoice: InvoiceComputed, status: InvoiceRecord['status']) {
    if (status === invoice.status) return
    savingStatus = { ...savingStatus, [invoice.id]: true }
    try {
      await updateInvoiceStatus(invoice.id, status)
      await billingStore.refresh()
      toastInfo('Invoice status updated.')
    } catch (error) {
      console.error(error)
      toastError('Unable to update invoice status.')
    } finally {
      savingStatus = { ...savingStatus, [invoice.id]: false }
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Invoices</h2>
    <p class="text-sm text-slate-400">
      Assemble invoices from approved time, products, and fixed lines. Status updates and payments keep
      AR and statements current even when offline.
    </p>
  </header>

  <article class="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Total outstanding</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{formatCurrency(outstandingTotal)}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Drafts</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{draftedCount}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Sent</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{sentCount}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Overdue</span>
      <p class="mt-1 text-xl font-semibold text-rose-300">{overdueCount}</p>
    </div>
  </article>

  <form class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6" on:submit={handleCreateInvoice}>
    <header class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-slate-100">Create invoice</h3>
      <p class="text-sm text-slate-400">
        Select billable time between dates, add fixed lines, and pull products. Totals update as you go.
      </p>
    </header>

    <section class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Client</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={selectedClientId}
          required
        >
          {#if clients.length === 0}
            <option value="">No clients available</option>
          {:else}
            {#each clients as client}
              <option value={client.id}>{client.name}</option>
            {/each}
          {/if}
        </select>
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Issue date</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="date"
          bind:value={issueDate}
          required
        />
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Due date</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="date"
          bind:value={dueDate}
          required
        />
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Status</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={statusSelection}
        >
          {#each invoiceStatuses as status}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Tax rate (%)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="number"
          min="0"
          step="0.01"
          bind:value={taxRateInput}
        />
      </label>
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Notes (optional)</span>
        <textarea
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          rows={3}
          bind:value={notes}
        ></textarea>
      </label>
    </section>

    <section class="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 class="text-base font-semibold text-slate-100">Billable time</h4>
          <p class="text-xs text-slate-400">Select approved logs to convert into hourly lines.</p>
        </div>
        <div class="flex flex-wrap gap-3 text-xs text-slate-300">
          <label class="flex items-center gap-2">
            <span>From</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-slate-100"
              type="date"
              bind:value={timeRangeStart}
            />
          </label>
          <label class="flex items-center gap-2">
            <span>To</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-slate-100"
              type="date"
              bind:value={timeRangeEnd}
            />
          </label>
        </div>
      </header>

      {#if timeGroups.length === 0}
        <p class="text-xs text-slate-400">No approved, uninvoiced logs for this client in range.</p>
      {:else}
        <div class="space-y-3">
          {#each timeGroups as group}
            {#if timeGroupSelections[timeGroupKey(group)]}
              <article class="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <label class="flex items-start gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      bind:checked={timeGroupSelections[timeGroupKey(group)].selected}
                    />
                    <div class="space-y-1">
                      <p class="font-semibold text-slate-100">
                        {timeGroupSelections[timeGroupKey(group)].description}
                      </p>
                      <p class="text-xs text-slate-400">
                        {group.logs.length} logs · {roundCurrency(group.minutes / 60)} hours
                      </p>
                    </div>
                  </label>
                  <label class="flex items-center gap-2 text-xs text-slate-300">
                    <span>Rate</span>
                    <input
                      class="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-slate-100"
                      type="number"
                      min="0"
                      step="1"
                      bind:value={timeGroupSelections[timeGroupKey(group)].rate}
                    />
                  </label>
                </div>
              </article>
            {/if}
          {/each}
        </div>
      {/if}
    </section>

    <section class="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <header class="flex items-center justify-between">
        <div>
          <h4 class="text-base font-semibold text-slate-100">Fixed-price lines</h4>
          <p class="text-xs text-slate-400">Add retainers, expenses, or adjustments.</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          on:click={addManualLine}
        >
          Add line
        </button>
      </header>

      {#if manualLines.length === 0}
        <p class="text-xs text-slate-400">No manual lines yet.</p>
      {:else}
        <div class="space-y-3">
          {#each manualLines as line}
            <article class="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Description</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={line.description}
                  />
                </label>
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Quantity</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="number"
                    min="0"
                    step="0.25"
                    bind:value={line.quantity}
                  />
                </label>
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Unit price</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="number"
                    min="0"
                    step="1"
                    bind:value={line.unitPrice}
                  />
                </label>
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Type</span>
                  <select
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={line.type}
                  >
                    <option value="other">Other</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                class="mt-3 rounded-lg border border-rose-700 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-900/40"
                on:click={() => removeManualLine(line.id)}
              >
                Remove
              </button>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <header class="flex items-center justify-between">
        <div>
          <h4 class="text-base font-semibold text-slate-100">Product sales</h4>
          <p class="text-xs text-slate-400">Pull items from the product catalog.</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          on:click={addProductLine}
        >
          Add product
        </button>
      </header>

      {#if productLines.length === 0}
        <p class="text-xs text-slate-400">No product lines selected.</p>
      {:else}
        <div class="space-y-3">
          {#each productLines as line}
            <article class="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Product</span>
                  <select
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={line.productId}
                    on:change={(event) => {
                      const product = products.find((entry) => entry.id === (event.currentTarget as HTMLSelectElement).value)
                      if (product) {
                        line.description = product.title
                        line.unitPrice = String(product.price ?? 0)
                      }
                    }}
                  >
                    {#each products as product}
                      <option value={product.id}>{product.title}</option>
                    {/each}
                  </select>
                </label>
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Description</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={line.description}
                  />
                </label>
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Quantity</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="number"
                    min="0"
                    step="1"
                    bind:value={line.quantity}
                  />
                </label>
                <label class="flex flex-col gap-2 text-xs text-slate-300">
                  <span>Unit price</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="number"
                    min="0"
                    step="1"
                    bind:value={line.unitPrice}
                  />
                </label>
              </div>
              <button
                type="button"
                class="mt-3 rounded-lg border border-rose-700 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-900/40"
                on:click={() => removeProductLine(line.id)}
              >
                Remove
              </button>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <header class="flex items-center justify-between">
        <h4 class="text-base font-semibold text-slate-100">Invoice preview</h4>
        <div class="text-right text-xs text-slate-400">
          <p>Subtotal: {formatCurrency(subtotal)}</p>
          <p>Tax: {formatCurrency(taxAmount)}</p>
          <p class="text-sm font-semibold text-slate-100">Total: {formatCurrency(totalAmount)}</p>
        </div>
      </header>

      <div class="mt-3 space-y-3">
        {#if selectedTimeItems.length}
          <div class="space-y-2">
            <h5 class="text-xs uppercase tracking-wide text-slate-400">Time entries</h5>
            {#each selectedTimeItems as item}
              <div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs">
                <span>{item.description}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if manualPreview.length}
          <div class="space-y-2">
            <h5 class="text-xs uppercase tracking-wide text-slate-400">Fixed lines</h5>
            {#each manualPreview as line}
              <div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs">
                <span>{line.description}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if productPreview.length}
          <div class="space-y-2">
            <h5 class="text-xs uppercase tracking-wide text-slate-400">Products</h5>
            {#each productPreview as line}
              <div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs">
                <span>{line.description}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if selectedTimeItems.length + manualPreview.length + productPreview.length === 0}
          <p class="text-xs text-slate-400">No line items selected yet.</p>
        {/if}
      </div>
    </section>

    <div class="flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        disabled={creating || !selectedClientId}
      >
        {creating ? 'Saving…' : 'Create invoice'}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        on:click={() => {
          notes = ''
          manualLines = []
          productLines = []
          timeGroupSelections = {}
        }}
        disabled={creating}
      >
        Reset form
      </button>
    </div>
  </form>

  {#if loading}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      Loading invoices…
    </article>
  {:else if invoices.length === 0}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      No invoices yet. Create one above to start billing.
    </article>
  {:else}
    <div class="space-y-4">
      {#each invoices as invoice}
        <article class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
          <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-slate-100">Invoice {invoice.id.slice(0, 8)}…</h3>
              <p class="text-xs text-slate-400">Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}</p>
              <p class="text-xs text-slate-400">Client: {state.clients.find((client) => client.id === invoice.clientId)?.name ?? 'Removed'}</p>
            </div>
            <div class="flex flex-col gap-2 text-xs text-slate-400">
              <span>Subtotal {formatCurrency(invoice.subtotal)}</span>
              <span>Tax {formatCurrency(invoice.tax)}</span>
              <span class="text-sm font-semibold text-slate-100">Total {formatCurrency(invoice.total)}</span>
              <span class={invoice.outstanding > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                Outstanding {formatCurrency(invoice.outstanding)}
              </span>
            </div>
          </header>

          <div class="flex flex-wrap gap-3 text-xs text-slate-300">
            <label class="flex items-center gap-2">
              <span>Status</span>
              <select
                class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-slate-100"
                value={invoice.status}
                on:change={(event) =>
                  handleStatusChange(
                    invoice,
                    (event.currentTarget as HTMLSelectElement).value as InvoiceRecord['status'],
                  )}
                disabled={savingStatus[invoice.id]}
              >
                {#each invoiceStatuses as status}
                  <option value={status}>{status}</option>
                {/each}
              </select>
            </label>
            <span>Payments {invoice.payments.length}</span>
          </div>

          {#if invoice.notes}
            <p class="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
              {invoice.notes}
            </p>
          {/if}

          <section class="space-y-2">
            <h4 class="text-xs uppercase tracking-wide text-slate-400">Line items</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-xs">
                <thead class="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th class="px-3 py-2 font-semibold">Description</th>
                    <th class="px-3 py-2 font-semibold">Type</th>
                    <th class="px-3 py-2 font-semibold text-right">Qty</th>
                    <th class="px-3 py-2 font-semibold text-right">Rate</th>
                    <th class="px-3 py-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-200">
                  {#each invoice.items as item}
                    <tr>
                      <td class="px-3 py-2">{item.description}</td>
                      <td class="px-3 py-2 capitalize">{item.type}</td>
                      <td class="px-3 py-2 text-right">{roundCurrency(item.quantity)}</td>
                      <td class="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td class="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>

          {#if invoice.payments.length}
            <section class="space-y-2">
              <h4 class="text-xs uppercase tracking-wide text-slate-400">Payments</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-xs">
                  <thead class="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th class="px-3 py-2 font-semibold">Received</th>
                      <th class="px-3 py-2 font-semibold">Method</th>
                      <th class="px-3 py-2 font-semibold">Reference</th>
                      <th class="px-3 py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-200">
                    {#each invoice.payments as payment}
                      <tr>
                        <td class="px-3 py-2">{formatDate(payment.receivedDate)}</td>
                        <td class="px-3 py-2">{payment.method ?? '—'}</td>
                        <td class="px-3 py-2">{payment.reference ?? payment.id.slice(0, 8)}</td>
                        <td class="px-3 py-2 text-right">{formatCurrency(payment.amount ?? 0)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>
