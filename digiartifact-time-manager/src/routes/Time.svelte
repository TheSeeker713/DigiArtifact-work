<script lang="ts">
  import { timeStore } from '../lib/stores/timeStore'
  import { eventBus } from '../lib/events/eventBus'

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  function broadcastPlaceholder() {
    eventBus.emit('timelog:created', {
      id: crypto.randomUUID(),
      jobId: 'demo-job',
      durationMinutes: 30,
      weekBucket: '2025-10-13',
    })
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Time Tracking</h2>
    <p class="text-sm text-slate-400">
      Low-latency timer that stays responsive without network or GPU support. Use this view to
      start/pause sessions, guard overlap, and sync with the weekly cadence.
    </p>
  </header>

  <article class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
    <h3 class="text-lg font-semibold text-slate-100">Active Timer</h3>
    <p class="mt-3 text-4xl font-mono text-slate-50">{formatDuration($timeStore.elapsedMs)}</p>
    <div class="mt-4 grid gap-2 text-sm text-slate-300">
      <div>Job ID: {$timeStore.jobId ?? '—'}</div>
      <div>Task ID: {$timeStore.taskId ?? '—'}</div>
      <div>Started: {$timeStore.startedAt ?? '—'}</div>
      <div>Manual Entry: {$timeStore.manualEntry ? 'Yes' : 'No'}</div>
    </div>
  </article>

  <article class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
    <h3 class="text-lg font-semibold text-slate-100">Integration Hooks</h3>
    <p class="text-sm text-slate-300">
      When a time log is saved, emit `timelog:created` so downstream aggregates refresh without full
      recomputation. The stub button below publishes a demo event to prove out the wiring.
    </p>
    <button
      class="mt-4 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow"
      type="button"
      on:click={broadcastPlaceholder}
    >
      Emit Demo TimeLog Event
    </button>
  </article>
</section>
