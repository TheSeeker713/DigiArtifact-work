<script lang="ts">
  import { onMount } from 'svelte'

  import { expensesRepo } from '../lib/repos/expensesRepo'
  import { clientsRepo } from '../lib/repos/clientsRepo'
  import { jobsRepo } from '../lib/repos/jobsRepo'
  import { toastError, toastSuccess } from '../lib/stores/toastStore'
  import type { ExpenseRecord, ClientRecord, JobRecord } from '../lib/types/entities'

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  let loading = false
  let saving = false
  let expenses: ExpenseRecord[] = []
  let clients: ClientRecord[] = []
  let jobs: JobRecord[] = []
  let editingId: string | null = null

  const todayIso = new Date().toISOString().slice(0, 10)

  type ExpenseForm = {
    jobId: string
    clientId: string
    category: string
    vendor: string
    amount: string
    date: string
    note: string
  }

  let expenseForm: ExpenseForm = {
    jobId: '',
    clientId: '',
    category: '',
    vendor: '',
    amount: '',
    date: todayIso,
    note: '',
  }

  const commonCategories = [
    'Materials',
    'Equipment',
    'Software',
    'Travel',
    'Meals',
    'Marketing',
    'Subcontractor',
    'Utilities',
    'Office',
    'Other',
  ]

  onMount(async () => {
    await loadData()
  })

  async function loadData() {
    loading = true
    try {
      const [expensesData, clientsData, jobsData] = await Promise.all([
        expensesRepo.list(),
        clientsRepo.list(),
        jobsRepo.list(),
      ])
      expenses = expensesData.sort((a, b) => b.date.localeCompare(a.date))
      clients = clientsData.sort((a, b) => a.name.localeCompare(b.name))
      jobs = jobsData.sort((a, b) => a.title.localeCompare(b.title))
    } catch (error) {
      console.error(error)
      toastError('Unable to load expenses.')
    } finally {
      loading = false
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

  function resetForm() {
    expenseForm = {
      jobId: '',
      clientId: '',
      category: '',
      vendor: '',
      amount: '',
      date: todayIso,
      note: '',
    }
    editingId = null
  }

  function startEdit(expense: ExpenseRecord) {
    editingId = expense.id
    expenseForm = {
      jobId: expense.jobId ?? '',
      clientId: expense.clientId ?? '',
      category: expense.category ?? '',
      vendor: expense.vendor ?? '',
      amount: String(expense.amount ?? 0),
      date: expense.date,
      note: expense.note ?? '',
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault()

    const amount = parseAmount(expenseForm.amount)
    if (amount <= 0) {
      toastError('Enter an amount greater than zero.')
      return
    }

    if (!expenseForm.jobId && !expenseForm.clientId) {
      toastError('Attach the expense to a job or client.')
      return
    }

    saving = true
    try {
      const payload = {
        jobId: expenseForm.jobId || undefined,
        clientId: expenseForm.clientId || undefined,
        category: expenseForm.category || undefined,
        vendor: expenseForm.vendor || undefined,
        amount,
        date: expenseForm.date,
        note: expenseForm.note || undefined,
      }

      if (editingId) {
        await expensesRepo.update(editingId, payload as any)
        toastSuccess('Expense updated.')
      } else {
        await expensesRepo.create(payload as any)
        toastSuccess('Expense created.')
      }

      await loadData()
      resetForm()
    } catch (error) {
      console.error(error)
      toastError('Unable to save expense.')
    } finally {
      saving = false
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this expense? This cannot be undone.')) {
      return
    }

    try {
      await expensesRepo.softDelete(id)
      toastSuccess('Expense deleted.')
      await loadData()
      if (editingId === id) {
        resetForm()
      }
    } catch (error) {
      console.error(error)
      toastError('Unable to delete expense.')
    }
  }

  $: totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
  $: expensesByCategory = expenses.reduce(
    (acc, expense) => {
      const cat = expense.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + (expense.amount ?? 0)
      return acc
    },
    {} as Record<string, number>,
  )
  $: topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  $: clientLookup = new Map(clients.map((client) => [client.id, client]))
  $: jobLookup = new Map(jobs.map((job) => [job.id, job]))
  $: jobsByClient = jobs.reduce(
    (acc, job) => {
      if (job.clientId) {
        const list = acc[job.clientId]
        if (list) {
          list.push(job)
        } else {
          acc[job.clientId] = [job]
        }
      }
      return acc
    },
    {} as Record<string, JobRecord[]>,
  )

  $: availableJobs = expenseForm.clientId
    ? jobsByClient[expenseForm.clientId] ?? []
    : jobs
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Expenses</h2>
    <p class="text-sm text-slate-400">
      Track operating costs, attach them to jobs or clients, and see profitability insights in real time.
    </p>
  </header>

  <article class="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Total expenses</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{formatCurrency(totalExpenses)}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Expense count</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{expenses.length}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Categories tracked</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{Object.keys(expensesByCategory).length}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Top category</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">
        {topCategories[0] ? topCategories[0][0] : '—'}
      </p>
    </div>
  </article>

  <form class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200" on:submit={handleSubmit}>
    <header class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-slate-100">
        {editingId ? 'Edit expense' : 'Add expense'}
      </h3>
      <p class="text-xs text-slate-400">
        Attach to a job or client to enable profitability tracking.
      </p>
    </header>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Client (optional)</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={expenseForm.clientId}
        >
          <option value="">None</option>
          {#each clients as client}
            <option value={client.id}>{client.name}</option>
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Job (optional)</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={expenseForm.jobId}
        >
          <option value="">None</option>
          {#each availableJobs as job}
            <option value={job.id}>{job.title}</option>
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Category</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={expenseForm.category}
        >
          <option value="">Select category</option>
          {#each commonCategories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Vendor</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          placeholder="Supplier name"
          bind:value={expenseForm.vendor}
        />
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Amount</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="number"
          min="0"
          step="0.01"
          bind:value={expenseForm.amount}
          required
        />
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span>Date</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="date"
          bind:value={expenseForm.date}
          required
        />
      </label>

      <label class="col-span-full flex flex-col gap-2 text-sm text-slate-300">
        <span>Note</span>
        <textarea
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          rows="2"
          placeholder="Additional details"
          bind:value={expenseForm.note}
        ></textarea>
      </label>
    </div>

    <div class="flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        disabled={saving}
      >
        {saving ? 'Saving…' : editingId ? 'Update expense' : 'Add expense'}
      </button>
      {#if editingId}
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          on:click={resetForm}
          disabled={saving}
        >
          Cancel edit
        </button>
      {/if}
      <button
        type="button"
        class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        on:click={resetForm}
        disabled={saving}
      >
        Clear form
      </button>
    </div>
  </form>

  {#if loading}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      Loading expenses…
    </article>
  {:else if expenses.length === 0}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      No expenses logged yet.
    </article>
  {:else}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
      <header class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>All expenses</span>
        <span>{expenses.length}</span>
      </header>
      <div class="mt-3 overflow-x-auto">
        <table class="min-w-full text-left text-xs">
          <thead class="border-b border-slate-800 text-slate-400">
            <tr>
              <th class="px-3 py-2 font-semibold">Date</th>
              <th class="px-3 py-2 font-semibold">Category</th>
              <th class="px-3 py-2 font-semibold">Vendor</th>
              <th class="px-3 py-2 font-semibold">Client</th>
              <th class="px-3 py-2 font-semibold">Job</th>
              <th class="px-3 py-2 font-semibold">Note</th>
              <th class="px-3 py-2 font-semibold text-right">Amount</th>
              <th class="px-3 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-200">
            {#each expenses as expense}
              <tr>
                <td class="px-3 py-2">{formatDate(expense.date)}</td>
                <td class="px-3 py-2">{expense.category || '—'}</td>
                <td class="px-3 py-2">{expense.vendor || '—'}</td>
                <td class="px-3 py-2">
                  {expense.clientId ? clientLookup.get(expense.clientId)?.name ?? 'Unknown' : '—'}
                </td>
                <td class="px-3 py-2">
                  {expense.jobId ? jobLookup.get(expense.jobId)?.title ?? 'Unknown' : '—'}
                </td>
                <td class="px-3 py-2 max-w-xs truncate">{expense.note || '—'}</td>
                <td class="px-3 py-2 text-right">{formatCurrency(expense.amount ?? 0)}</td>
                <td class="px-3 py-2 text-right">
                  <button
                    type="button"
                    class="text-brand-primary hover:underline"
                    on:click={() => startEdit(expense)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="ml-2 text-red-400 hover:underline"
                    on:click={() => handleDelete(expense.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </article>
  {/if}
</section>
