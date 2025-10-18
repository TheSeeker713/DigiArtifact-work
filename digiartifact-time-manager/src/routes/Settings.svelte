<script lang="ts">
  import { get } from 'svelte/store'

  import {
    cloneSettingsSnapshot,
    defaultSettings,
    settingsStore,
    type Settings,
  } from '../lib/stores/settingsStore'
  import { sessionStore } from '../lib/stores/sessionStore'
  import { jobsTasksStore } from '../lib/stores/jobsTasksStore'
  import { resetJobsAndTasks } from '../lib/services/jobsTasksService'
  import { toastError, toastInfo, toastSuccess } from '../lib/stores/toastStore'
  import { eventBus } from '../lib/events/eventBus'

  type SaveState = 'idle' | 'saved'

  let form: Settings = cloneSettingsSnapshot(get(settingsStore))
  let saveState: SaveState = 'idle'
  let resettingJobs = false

  $: jobKeys = Object.keys(form.jobTargets)

  function handleSubmit(event: Event) {
    event.preventDefault()
    const sanitized = sanitizeForm(form)
    settingsStore.set(sanitized)
    eventBus.emit('settings:updated', undefined as void)
    form = cloneSettingsSnapshot(sanitized)
    
    // Sync lowEndMode and performanceMonitor to sessionStore
    if (typeof sanitized.lowEndMode === 'boolean') {
      sessionStore.setLowEndMode(sanitized.lowEndMode)
    }
    if (typeof sanitized.performanceMonitorEnabled === 'boolean') {
      sessionStore.setPerformanceMonitor(sanitized.performanceMonitorEnabled)
    }

    saveState = 'saved'
    setTimeout(() => {
      saveState = 'idle'
    }, 2000)
  }

  function handleReset() {
    settingsStore.reset()
    form = cloneSettingsSnapshot(get(settingsStore))
    saveState = 'idle'
    eventBus.emit('settings:updated', undefined as void)
  }

  async function handleResetJobs() {
    const firstCheck = window.confirm(
      'This will archive all jobs and tasks. Time logs stay intact. Continue?',
    )
    if (!firstCheck) {
      return
    }

    const typed = window.prompt('Type RESET to confirm the jobs/tasks reset.')
    if (!typed || typed.trim().toUpperCase() !== 'RESET') {
      toastInfo('Reset cancelled.')
      return
    }

    resettingJobs = true
    try {
      await resetJobsAndTasks()
      await jobsTasksStore.refresh()
      toastSuccess('Jobs and tasks reset complete.')
    } catch (error) {
      console.error(error)
      toastError('Could not reset jobs and tasks. Please retry.')
    } finally {
      resettingJobs = false
    }
  }

  function sanitizeForm(settings: Settings): Settings {
    const jobTargets: Record<string, number> = {}

    for (const [key, rawValue] of Object.entries(settings.jobTargets)) {
      const numeric = Number(rawValue)
      if (!Number.isFinite(numeric) || numeric < 0) continue
      jobTargets[key] = numeric
    }

    return {
      timezone: settings.timezone.trim() || defaultSettings.timezone,
      weekStart: settings.weekStart || defaultSettings.weekStart,
      weekTargetHours:
        Number.isFinite(Number(settings.weekTargetHours)) && Number(settings.weekTargetHours) >= 0
          ? Number(settings.weekTargetHours)
          : defaultSettings.weekTargetHours,
      jobTargets: Object.keys(jobTargets).length ? jobTargets : { ...defaultSettings.jobTargets },
      lowEndMode: typeof settings.lowEndMode === 'boolean' ? settings.lowEndMode : defaultSettings.lowEndMode,
      performanceMonitorEnabled: typeof settings.performanceMonitorEnabled === 'boolean' ? settings.performanceMonitorEnabled : defaultSettings.performanceMonitorEnabled,
    }
  }

  function updateJobTarget(role: string, value: string) {
    const numeric = Number(value)
    form = {
      ...form,
      jobTargets: {
        ...form.jobTargets,
        [role]: Number.isFinite(numeric) && numeric >= 0 ? numeric : 0,
      },
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Settings</h2>
    <p class="text-sm text-slate-400">
      Update the global cadence defaults used across dashboards, reports, and billing exports.
    </p>
  </header>

  <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
    <fieldset class="grid gap-4 md:grid-cols-2">
      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Timezone (IANA)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          placeholder="America/Los_Angeles"
          bind:value={form.timezone}
          required
        />
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Week Start</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          bind:value={form.weekStart}
        >
          <option value="Monday">Monday</option>
          <option value="Sunday">Sunday</option>
          <option value="Saturday">Saturday</option>
        </select>
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Weekly Target Hours</span>
        <input
          type="number"
          min="0"
          step="0.5"
          class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          bind:value={form.weekTargetHours}
          required
        />
      </label>
    </fieldset>

    <fieldset class="space-y-4">
      <legend class="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Performance & Low-End
      </legend>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="flex items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" class="h-4 w-4" bind:checked={form.lowEndMode} />
          <span>Enable low-end mode (disables chart animations, reduces shadows)</span>
        </label>
        <label class="flex items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" class="h-4 w-4" bind:checked={form.performanceMonitorEnabled} />
          <span>Show performance monitor (dev tool)</span>
        </label>
      </div>
    </fieldset>

    <fieldset class="space-y-4">
      <legend class="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Job Targets (hrs)
      </legend>

      <div class="grid gap-3 md:grid-cols-3">
        {#each jobKeys as job}
          <label class="flex flex-col gap-2 text-sm text-slate-200">
            <span class="font-semibold text-slate-100">{job}</span>
            <input
              type="number"
              min="0"
              step="0.5"
              class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
              value={form.jobTargets[job]}
              on:input={(event) => updateJobTarget(job, event.currentTarget.value)}
            />
          </label>
        {/each}
      </div>
    </fieldset>

    <div class="flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow"
      >
        Save Settings
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        on:click={handleReset}
      >
        Reset to Defaults
      </button>
      {#if saveState === 'saved'}
        <span class="self-center text-xs uppercase tracking-wide text-emerald-400">Saved</span>
      {/if}
    </div>
  </form>

  <article class="space-y-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-6 text-sm">
    <header class="space-y-1">
      <h3 class="text-lg font-semibold text-rose-200">Reset Jobs & Tasks</h3>
      <p class="text-xs text-rose-300/80">
        Double-confirm to archive every job and task. This keeps time logs intact while clearing the
        planner. A record writes to the audit log for traceability.
      </p>
    </header>
    <button
      type="button"
      class="rounded-lg border border-rose-700 bg-rose-900/40 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-900/60 disabled:opacity-60"
      on:click={handleResetJobs}
      disabled={resettingJobs}
    >
      {resettingJobs ? 'Resetting…' : 'Reset all jobs & tasks'}
    </button>
  </article>

  <footer class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
    Settings persist locally in `localStorage` so offline browsers reuse the cadence even without a
    network connection. Sync support is intentionally out-of-scope for the MVP.
  </footer>
</section>
