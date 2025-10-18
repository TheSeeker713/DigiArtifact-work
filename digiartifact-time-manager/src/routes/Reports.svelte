<script lang="ts">
  import { onMount } from 'svelte'

  import { productsRepo } from '../lib/repos/productsRepo'
  import { productSalesRepo } from '../lib/repos/productSalesRepo'
  import ProductSalesBarChart from '../lib/components/ProductSalesBarChart.svelte'
  import Last30DaysNetChart from '../lib/components/Last30DaysNetChart.svelte'
  import { toastError } from '../lib/stores/toastStore'
  import type { ProductRecord, ProductSaleRecord, ClientRecord, JobRecord } from '../lib/types/entities'
  import { clientsRepo } from '../lib/repos/clientsRepo'
  import { jobsRepo } from '../lib/repos/jobsRepo'
  import type { ReportResult } from '../lib/types/reports'
  import { computeReports, exportData } from '../lib/services/reportsWorkerService'
  import { sessionStore } from '../lib/stores/sessionStore'

  let loading = false
  let products: ProductRecord[] = []
  let productSales: ProductSaleRecord[] = []
  let clients: ClientRecord[] = []
  let jobs: JobRecord[] = []

  // Filters
  let startDate: string = ''
  let endDate: string = ''
  let clientId: string = ''
  let jobId: string = ''
  let billable: 'all' | 'yes' | 'no' = 'all'

  // Results
  let result: ReportResult | null = null
  let computing = false

  $: lowEndMode = $sessionStore.lowEndMode

  onMount(async () => {
    await loadData()
    await runCompute()
  })

  async function loadData() {
    loading = true
    try {
      const [productsData, salesData, clientsData, jobsData] = await Promise.all([
        productsRepo.list(),
        productSalesRepo.list(),
        clientsRepo.list(),
        jobsRepo.list(),
      ])
      products = productsData
      productSales = salesData
      clients = clientsData
      jobs = jobsData
    } catch (error) {
      console.error(error)
      toastError('Unable to load report data.')
    } finally {
      loading = false
    }
  }

  function currentFilters() {
    return {
      startDate: startDate || null,
      endDate: endDate || null,
      clientId: clientId || null,
      jobId: jobId || null,
      billable,
    }
  }

  async function runCompute() {
    computing = true
    try {
      result = await computeReports(currentFilters())
    } catch (e) {
      console.error(e)
      toastError('Failed to compute reports')
    } finally {
      computing = false
    }
  }

  function onClientChange() {
    if (clientId && jobId) {
      const job = jobs.find((j) => j.id === jobId)
      if (!job || job.clientId !== clientId) {
        jobId = ''
      }
    }
  }

  let downloading = false
  let downloadName = ''
  let downloadMime = ''
  let downloadData = ''

  async function doExport(entity: 'timeLogs' | 'invoices' | 'payments' | 'expenses' | 'productSales' | 'deals', format: 'csv' | 'json') {
    downloading = true
    downloadName = ''
    downloadData = ''
    downloadMime = ''
    try {
      await exportData(entity, format, currentFilters(), {
        onMeta: (m) => { downloadName = m.filename; downloadMime = m.mime },
        onChunk: (chunk) => { downloadData += chunk },
        onEnd: () => {
          const blob = new Blob([downloadData], { type: downloadMime })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = downloadName || `export.${format}`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
          downloading = false
        },
        onError: (m) => {
          toastError(m)
          downloading = false
        },
      })
    } catch (e) {
      console.error(e)
      toastError('Export failed')
      downloading = false
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Reports & Charts</h2>
    <p class="text-sm text-slate-400">
      Visual insights into product sales performance. Charts are rendered client-side with uPlot for minimal bundle size.
    </p>
  </header>

  {#if loading}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      Loading chart data…
    </article>
  {:else}
    <div class="space-y-6">
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <label class="block text-xs text-slate-400">
              <span class="mb-1 block">Start</span>
              <input class="w-full rounded-md bg-slate-800 px-2 py-1 text-sm" type="date" bind:value={startDate} />
            </label>
          </div>
          <div>
            <label class="block text-xs text-slate-400">
              <span class="mb-1 block">End</span>
              <input class="w-full rounded-md bg-slate-800 px-2 py-1 text-sm" type="date" bind:value={endDate} />
            </label>
          </div>
          <div>
            <label class="block text-xs text-slate-400">
              <span class="mb-1 block">Client</span>
              <select class="w-full rounded-md bg-slate-800 px-2 py-1 text-sm" bind:value={clientId} on:change={onClientChange}>
                <option value="">All</option>
                {#each clients as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              </select>
            </label>
          </div>
          <div>
            <label class="block text-xs text-slate-400">
              <span class="mb-1 block">Job</span>
              <select class="w-full rounded-md bg-slate-800 px-2 py-1 text-sm" bind:value={jobId}>
                <option value="">All</option>
                {#each jobs.filter(j => !clientId || j.clientId === clientId) as j}
                  <option value={j.id}>{j.title}</option>
                {/each}
              </select>
            </label>
          </div>
          <div>
            <label class="block text-xs text-slate-400">
              <span class="mb-1 block">Billable</span>
              <select class="w-full rounded-md bg-slate-800 px-2 py-1 text-sm" bind:value={billable}>
                <option value="all">All</option>
                <option value="yes">Billable only</option>
                <option value="no">Non-billable only</option>
              </select>
            </label>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="rounded-md bg-brand-primary px-3 py-1 text-sm text-white" on:click={runCompute} disabled={computing}>
            {computing ? 'Computing…' : 'Run report'}
          </button>
          <div class="ml-auto flex items-center gap-2">
            <span class="text-xs text-slate-400">Export:</span>
            <button class="rounded-md bg-slate-800 px-2 py-1 text-xs" on:click={() => doExport('timeLogs','csv')} disabled={downloading}>Time CSV</button>
            <button class="rounded-md bg-slate-800 px-2 py-1 text-xs" on:click={() => doExport('invoices','csv')} disabled={downloading}>Invoices CSV</button>
            <button class="rounded-md bg-slate-800 px-2 py-1 text-xs" on:click={() => doExport('payments','csv')} disabled={downloading}>Payments CSV</button>
            <button class="rounded-md bg-slate-800 px-2 py-1 text-xs" on:click={() => doExport('expenses','csv')} disabled={downloading}>Expenses CSV</button>
            <button class="rounded-md bg-slate-800 px-2 py-1 text-xs" on:click={() => doExport('productSales','csv')} disabled={downloading}>Sales CSV</button>
          </div>
        </div>
      </article>

      {#if result}
        <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 class="mb-2 font-semibold">Summary</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Total minutes</div>
              <div class="text-lg">{result.time.totalMinutes}</div>
            </div>
            <div class="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Invoices</div>
              <div class="text-lg">${result.billing.invoicesTotal.toFixed(2)}</div>
            </div>
            <div class="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Payments</div>
              <div class="text-lg">${result.billing.paymentsTotal.toFixed(2)}</div>
            </div>
            <div class="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Profit</div>
              <div class="text-lg">${result.profit.profit.toFixed(2)}</div>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <h4 class="mb-1 text-sm text-slate-300">Top Jobs (by minutes)</h4>
              <ul class="list-disc pl-4 text-sm text-slate-300">
                {#each result.time.byJob.slice(0, 5) as j}
                  <li>{j.jobTitle} — {j.minutes} min</li>
                {/each}
              </ul>
            </div>
            <div>
              <h4 class="mb-1 text-sm text-slate-300">Pipeline by stage</h4>
              <ul class="list-disc pl-4 text-sm text-slate-300">
                {#each result.pipeline.byStage as s}
                  <li>{s.stage}: {s.count} (${s.estimatedValue.toFixed(2)})</li>
                {/each}
              </ul>
            </div>
          </div>
        </article>
      {/if}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <ProductSalesBarChart {products} sales={productSales} {lowEndMode} />
      </article>

      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <Last30DaysNetChart sales={productSales} {lowEndMode} />
      </article>

      <article class="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p class="text-sm text-slate-300">
          Additional planned visuals: hours vs target, revenue by month, per-job distribution, AR aging. 
          Each chart mounts on demand to protect low-end hardware.
        </p>
      </article>
    </div>
  {/if}
</section>
