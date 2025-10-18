<script lang="ts">
  import { onMount } from 'svelte'

  import { productsRepo } from '../lib/repos/productsRepo'
  import { productSalesRepo } from '../lib/repos/productSalesRepo'
  import ProductSalesBarChart from '../lib/components/ProductSalesBarChart.svelte'
  import Last30DaysNetChart from '../lib/components/Last30DaysNetChart.svelte'
  import { toastError } from '../lib/stores/toastStore'
  import type { ProductRecord, ProductSaleRecord } from '../lib/types/entities'

  let loading = false
  let products: ProductRecord[] = []
  let productSales: ProductSaleRecord[] = []

  onMount(async () => {
    await loadData()
  })

  async function loadData() {
    loading = true
    try {
      const [productsData, salesData] = await Promise.all([
        productsRepo.list(),
        productSalesRepo.list(),
      ])
      products = productsData
      productSales = salesData
    } catch (error) {
      console.error(error)
      toastError('Unable to load report data.')
    } finally {
      loading = false
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
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <ProductSalesBarChart {products} sales={productSales} />
      </article>

      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <Last30DaysNetChart sales={productSales} />
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
