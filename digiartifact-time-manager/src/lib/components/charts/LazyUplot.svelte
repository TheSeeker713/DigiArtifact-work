<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import type uPlot from 'uplot'

  export let data: uPlot.AlignedData
  export let options: uPlot.Options
  export let lowEndMode = false
  export let className = ''

  let container: HTMLDivElement | null = null
  let plot: uPlot | null = null
  let disposed = false
  let baseHeight = options.height ?? 160

  async function init() {
    if (lowEndMode || !container || disposed) return

    const [{ default: UPlot }] = await Promise.all([
      import('uplot'),
      import('uplot/dist/uPlot.min.css'),
    ])

    const width = container.clientWidth || options.width || 320
    const opts: uPlot.Options = {
      ...options,
      width,
      height: baseHeight,
    }

    plot = new UPlot(opts, data, container)

    if (typeof ResizeObserver !== 'undefined') {
      const handleResize = () => {
        if (!plot || !container) return
        const nextWidth = container.clientWidth || width
        plot.setSize({ width: nextWidth, height: baseHeight })
      }

      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)

      onDestroy(() => {
        resizeObserver.disconnect()
      })
    }
  }

  $: if (plot && data && !disposed) {
    plot.setData(data)
  }

  onMount(() => {
    void init()
    return () => {
      disposed = true
      if (plot) {
        plot.destroy()
        plot = null
      }
    }
  })
</script>

{#if lowEndMode}
  <div class={`rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400 ${className}`}>
    Charts disabled to preserve low-end mode performance.
  </div>
{:else}
  <div class={`relative ${className}`}>
    <div bind:this={container} class="h-full w-full"></div>
  </div>
{/if}
