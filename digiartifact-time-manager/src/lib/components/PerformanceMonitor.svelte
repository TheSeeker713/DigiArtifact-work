<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let fps = 0
  let memory = '—'
  let renderTime = '—'
  let frameTimes: number[] = []
  let lastFrame = performance.now()
  let rafId: number

  function updateMetrics() {
    const now = performance.now()
    const delta = now - lastFrame
    frameTimes.push(delta)
    if (frameTimes.length > 60) {
      frameTimes.shift()
    }
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    fps = Math.round(1000 / avgFrameTime)
    lastFrame = now

    // Memory (if available)
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory
      const usedMB = (mem.usedJSHeapSize / 1024 / 1024).toFixed(1)
      const limitMB = (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1)
      memory = `${usedMB} / ${limitMB} MB`
    }

    rafId = requestAnimationFrame(updateMetrics)
  }

  onMount(() => {
    rafId = requestAnimationFrame(updateMetrics)
  })

  onDestroy(() => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
  })
</script>

<aside class="fixed bottom-4 right-4 z-50 rounded-lg border border-teal-700 bg-teal-950/90 p-3 text-xs backdrop-blur" style="font-family: monospace;">
  <div class="mb-1 font-semibold text-teal-100">Performance Monitor</div>
  <div class="space-y-1 text-teal-200">
    <div>FPS: <span class="font-semibold">{fps}</span></div>
    <div>Heap: <span class="font-semibold">{memory}</span></div>
    <div>Render: <span class="font-semibold">{renderTime}</span></div>
  </div>
</aside>
