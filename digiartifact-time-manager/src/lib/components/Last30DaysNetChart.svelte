<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import uPlot from 'uplot'
  import type { ProductSaleRecord } from '../types/entities'

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

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const filteredSales = sales
      .filter((sale) => {
        const saleDate = new Date(sale.date)
        return saleDate >= thirtyDaysAgo && saleDate <= now
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    if (filteredSales.length === 0) {
      return
    }

    const dailyNet = new Map<string, number>()
    for (const sale of filteredSales) {
      const dateKey = sale.date.slice(0, 10)
      dailyNet.set(dateKey, (dailyNet.get(dateKey) ?? 0) + (sale.net ?? 0))
    }

    const sortedDates = Array.from(dailyNet.keys()).sort()
    const timestamps = sortedDates.map((date) => new Date(date).getTime() / 1000)
    const netValues = sortedDates.map((date) => dailyNet.get(date) ?? 0)

    const data = [timestamps, netValues]

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
          width: 2,
          points: { show: !lowEndMode, size: 5 },
        },
      ],
      axes: [
        {
          values: (_self: any, ticks: number[]) =>
            ticks.map((timestamp) =>
              new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
                new Date(timestamp * 1000),
              ),
            ),
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
          time: true,
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

  $: if (sales && chartContainer) {
    buildChart()
  }
</script>

<div class="space-y-3">
  <header class="flex items-center justify-between text-sm">
    <h3 class="font-semibold text-slate-100">Last 30 Days Net Revenue</h3>
    <span class="text-xs text-slate-400">Daily aggregated net revenue</span>
  </header>
  {#if sales.length === 0}
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
      No sales data in the last 30 days.
    </div>
  {:else}
    <div class="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <div bind:this={chartContainer}></div>
    </div>
  {/if}
</div>
