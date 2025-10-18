<script lang="ts">
  import { onMount } from 'svelte'
  import type { AlignedData, Options } from 'uplot'

  import LazyUplot from '../lib/components/charts/LazyUplot.svelte'
  import {
    fetchEightWeekHours,
    fetchRevenueByMonth,
    fetchPipelineTotals,
    fetchAgingBuckets,
    type WeekSeriesPoint,
    type MonthSeriesPoint,
    type PipelineStagePoint,
    type AgingBucketPoint,
  } from '../lib/services/dashboardDataService'
  import {
    weeklySummarySelector,
    targetJobProgressSelector,
  } from '../lib/selectors/statsSelectors'
  import { sessionStore } from '../lib/stores/sessionStore'

  type ChartConfig = {
    data: AlignedData
    options: Options
  }

  let loadingCharts = true
  let chartError: string | null = null

  let hoursSparkline: ChartConfig | null = null
  let revenueChart: ChartConfig | null = null
  let pipelineChart: ChartConfig | null = null
  let agingChart: ChartConfig | null = null

  $: weeklySummary = $weeklySummarySelector
  $: jobProgress = $targetJobProgressSelector
  $: lowEndMode = $sessionStore.lowEndMode

  function buildSparkline(points: WeekSeriesPoint[]): ChartConfig | null {
    if (!points.length) return null
    const x = points.map((point) => Date.parse(point.week) / 1000)
    const hours = points.map((point) => Math.round((point.minutes / 60) * 100) / 100)

    const options: Options = {
      title: '8-Week Hours',
      width: 320,
      height: 190,
      scales: {
        x: { time: true },
        y: { auto: true },
      },
      axes: [
        {
          stroke: '#94a3b8',
          grid: { show: false },
          values: (_, ticks) =>
            ticks.map((tick) =>
              new Date(tick * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              }),
            ),
        },
        {
          stroke: '#94a3b8',
          grid: { show: true },
        },
      ],
      legend: { show: false },
      series: [
        {},
        {
          label: 'Hours',
          stroke: '#38bdf8',
          width: 2,
          fill: 'rgba(56, 189, 248, 0.18)',
        },
      ],
    }

    return {
      data: [x, hours],
      options,
    }
  }

  function buildSequentialChart(
    title: string,
    points: { label: string; total: number }[],
    color: string,
  ): ChartConfig | null {
    if (!points.length) return null
    const x = points.map((_, index) => index)
    const totals = points.map((point) => Math.round(point.total * 100) / 100)

    const labels = points.map((point) => point.label)

    const options: Options = {
      title,
      width: 320,
      height: 200,
      scales: {
        x: { time: false },
        y: { auto: true },
      },
      axes: [
        {
          stroke: '#94a3b8',
          grid: { show: false },
          ticks: { show: false },
          values: () => labels,
        },
        {
          stroke: '#94a3b8',
          grid: { show: true },
        },
      ],
      legend: { show: false },
      series: [
        {},
        {
          label: title,
          stroke: color,
          width: 2,
          fill: `${color}33`,
          spanGaps: true,
        },
      ],
    }

    return {
      data: [x, totals],
      options,
    }
  }

  function reshapePipeline(points: PipelineStagePoint[]): { label: string; total: number }[] {
    if (!points.length) return []
    return points
      .slice()
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .map((point) => ({ label: point.stage, total: point.total }))
  }

  onMount(async () => {
    loadingCharts = true
    chartError = null

    try {
      const [weeks, revenue, pipeline, aging] = await Promise.all([
        fetchEightWeekHours(),
        fetchRevenueByMonth(),
        fetchPipelineTotals(),
        fetchAgingBuckets(),
      ])

      hoursSparkline = buildSparkline(weeks)
      revenueChart = buildSequentialChart('Revenue (last months)', revenue, '#34d399')
      pipelineChart = buildSequentialChart('Pipeline by Stage', reshapePipeline(pipeline), '#fbbf24')
      agingChart = buildSequentialChart(
        'A/R Aging',
        aging.map((point) => ({ label: point.bucket, total: point.total })),
        '#f472b6',
      )
    } catch (error) {
      console.error(error)
      chartError = 'Unable to load chart data right now.'
    } finally {
      loadingCharts = false
    }
  })
</script>

<section class="space-y-6">
  <header class="space-y-2">
    <h2 class="text-2xl font-semibold text-brand-primary">Weekly Overview</h2>
    <p class="text-sm text-slate-400">
      Track logged hours against the 60/20/20 cadence. Charts stream from IndexedDB data so nothing
      relies on the network.
    </p>
  </header>

  <div class="grid gap-4 md:grid-cols-2">
    <article class="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <header class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-100">Hours This Week</h3>
        <span class="font-mono text-xl text-slate-50">{weeklySummary.totalHours.toFixed(2)} hrs</span>
      </header>
      <p class="text-xs text-slate-400">
        {weeklySummary.weekRange.label}
      </p>
      <div class="h-3 w-full rounded-lg bg-slate-800">
        <div
          class="h-3 rounded-lg bg-brand-primary transition-[width] duration-300"
          style={`width: ${Math.min(100, weeklySummary.progressRatio * 100).toFixed(1)}%;`}
        ></div>
      </div>
      <div class="flex justify-between text-xs text-slate-400">
        <span>Target: {weeklySummary.targetHours.toFixed(2)} hrs</span>
        <span>{(weeklySummary.progressRatio * 100).toFixed(1)}% of goal</span>
      </div>
    </article>

    <article class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 class="text-lg font-semibold text-slate-100">Per-Job Progress</h3>
      {#if jobProgress.length}
        <ul class="space-y-3 text-sm text-slate-300">
          {#each jobProgress as job}
            <li class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-slate-100">{job.title}</span>
                <span>{job.hours.toFixed(2)} / {job.targetHours.toFixed(2)} hrs</span>
              </div>
              <div class="h-2 w-full rounded-lg bg-slate-800">
                <div
                  class="h-2 rounded-lg bg-emerald-400"
                  style={`width: ${Math.min(100, job.ratio * 100).toFixed(1)}%;`}
                ></div>
              </div>
              {#if !job.jobId}
                <p class="text-[11px] text-amber-300/80">
                  No job named “{job.title}” yet. Add one in Jobs to track this target.
                </p>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-slate-400">No job targets configured yet.</p>
      {/if}
    </article>
  </div>

  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-100">Trends & Financials</h3>
      {#if chartError}
        <span class="text-xs text-rose-400">{chartError}</span>
      {/if}
    </header>

    {#if loadingCharts}
      <div class="grid gap-4 lg:grid-cols-2">
        {#each Array(4) as _, index}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Loading chart {index + 1}…
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid gap-4 lg:grid-cols-2">
        {#if hoursSparkline}
          <LazyUplot
            {lowEndMode}
            data={hoursSparkline.data}
            options={hoursSparkline.options}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          />
        {:else}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Log time to populate the 8-week sparkline.
          </div>
        {/if}

        {#if revenueChart}
          <LazyUplot
            {lowEndMode}
            data={revenueChart.data}
            options={revenueChart.options}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          />
        {:else}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Add invoices or payments to chart revenue trends.
          </div>
        {/if}

        {#if pipelineChart}
          <LazyUplot
            {lowEndMode}
            data={pipelineChart.data}
            options={pipelineChart.options}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          />
        {:else}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Pipeline stages will appear once deals are tracked.
          </div>
        {/if}

        {#if agingChart}
          <LazyUplot
            {lowEndMode}
            data={agingChart.data}
            options={agingChart.options}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          />
        {:else}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Outstanding invoices feed the A/R aging chart.
          </div>
        {/if}
      </div>
    {/if}
  </section>
</section>
