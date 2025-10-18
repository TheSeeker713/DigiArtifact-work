<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import uPlot from 'uplot'
  import type { ProductRecord, ProductSaleRecord } from '../types/entities'

  export let products: ProductRecord[] = []
  export let sales: ProductSaleRecord[] = []
  export let lowEndMode = false

  let chartContainer: HTMLDivElement
  let chart: uPlot | null = null

  function buildChart() {
    if (!chartContainer) return
    if (chart) {
      chart.destroy()
      chart = null
    }

    const salesByProduct = sales.reduce(
      (acc, sale) => {
        const productId = sale.productId
        if (!acc[productId]) {
          acc[productId] = { quantity: 0, net: 0 }
        }
        acc[productId].quantity += sale.quantity ?? 0
        acc[productId].net += sale.net ?? 0
        return acc
      },
      {} as Record<string, { quantity: number; net: number }>,
    )

    const productEntries = products
      .map((product) => ({
        title: product.title,
        sku: product.sku,
        quantity: salesByProduct[product.id]?.quantity ?? 0,
        net: salesByProduct[product.id]?.net ?? 0,
      }))
      .filter((entry) => entry.quantity > 0)
      .sort((a, b) => b.net - a.net)
      .slice(0, 10)

    if (productEntries.length === 0) {
      return
    }

    const labels = productEntries.map((entry) => entry.sku)
    const netValues = productEntries.map((entry) => entry.net)

    const data = [
      labels.map((_, i) => i),
      netValues,
    ]

    const opts: uPlot.Options = {
      width: chartContainer.clientWidth,
      height: 300,
      legend: {
        show: false,
      },
      cursor: lowEndMode ? undefined : {},
      series: [
        {},
        {
          label: 'Net Revenue',
          stroke: '#10b981',
          fill: lowEndMode ? undefined : 'rgba(16, 185, 129, 0.1)',
          points: { show: false },
        },
      ],
      axes: [
        {
          values: (_self: any, ticks: number[]) => ticks.map((i) => labels[Math.floor(i)] || ''),
        },
        {
          values: (_self: any, ticks: number[]) =>
            ticks.map((val) =>
              new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(val),
            ),
        },
      ],
      scales: {
        x: {
          time: false,
        },
      },
    }

    chart = new uPlot(opts, data as any, chartContainer)
  }

  onMount(() => {
    buildChart()
  })

  onDestroy(() => {
    if (chart) {
      chart.destroy()
      chart = null
    }
  })

  $: if (products && sales && chartContainer) {
    buildChart()
  }
</script>

<div class="space-y-3">
  <header class="flex items-center justify-between text-sm">
    <h3 class="font-semibold text-slate-100">Sales by SKU (Top 10)</h3>
    <span class="text-xs text-slate-400">Net revenue after fees</span>
  </header>
  {#if products.length === 0 || sales.length === 0}
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
      No product sales data available. Record some sales to see the chart.
    </div>
  {:else}
    <div class="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <div bind:this={chartContainer}></div>
    </div>
  {/if}
</div>
