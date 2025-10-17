<script lang="ts">
  import { get } from 'svelte/store'

  import {
    cloneSettingsSnapshot,
    defaultSettings,
    settingsStore,
    type Settings,
  } from '../lib/stores/settingsStore'

  type SaveState = 'idle' | 'saved'

  let form: Settings = cloneSettingsSnapshot(get(settingsStore))
  let saveState: SaveState = 'idle'

  $: jobKeys = Object.keys(form.jobTargets)

  function handleSubmit(event: Event) {
    event.preventDefault()
    const sanitized = sanitizeForm(form)
    settingsStore.set(sanitized)
    form = cloneSettingsSnapshot(sanitized)
    saveState = 'saved'
    setTimeout(() => {
      saveState = 'idle'
    }, 2000)
  }

  function handleReset() {
    settingsStore.reset()
    form = cloneSettingsSnapshot(get(settingsStore))
    saveState = 'idle'
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

  <footer class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
    Settings persist locally in `localStorage` so offline browsers reuse the cadence even without a
    network connection. Sync support is intentionally out-of-scope for the MVP.
  </footer>
</section>
