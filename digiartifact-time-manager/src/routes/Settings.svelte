<script lang="ts">
  import { get } from 'svelte/store'
  import { onMount } from 'svelte'

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
  import { backfillWeeklyTotals } from '../lib/services/statsAggregationService'
  import {
    exportAllData,
    importAllData,
    getDatabaseStats,
    purgeAllData,
    downloadBackup,
    parseBackupFile,
    type DatabaseBackup,
  } from '../lib/services/databaseService'
  import DataPurgeModal from '../lib/components/DataPurgeModal.svelte'

  type SaveState = 'idle' | 'saved'

  let form: Settings = cloneSettingsSnapshot(get(settingsStore))
  let saveState: SaveState = 'idle'
  let resettingJobs = false
  let loadingTestData = false
  let backfilling = false
  let backfillProgress = { current: 0, total: 0, weekBucket: '' }

  // Database management
  let dbStats: Record<string, number> = {}
  let exporting = false
  let importing = false
  let importProgress = { current: 0, total: 0, storeName: '' }
  let showPurgeModal = false
  let purgeModalRef: DataPurgeModal

  // Dev-only flag (can be toggled in browser console: window.__DEV_MODE__ = true)
  const isDev = typeof window !== 'undefined' && (window as any).__DEV_MODE__ === true

  onMount(async () => {
    await loadDatabaseStats()
  })

  $: jobKeys = Object.keys(form.jobTargets)
  $: totalRecords = Object.values(dbStats).reduce((sum, count) => sum + count, 0)

  async function loadDatabaseStats() {
    try {
      dbStats = await getDatabaseStats()
    } catch (error) {
      console.error('[Settings] Failed to load database stats:', error)
    }
  }

  async function handleExportData() {
    exporting = true
    toastInfo('Exporting all data...')

    try {
      const backup = await exportAllData((progress) => {
        console.log(`Exporting ${progress.storeName}: ${progress.current}/${progress.total}`)
      })

      downloadBackup(backup)
      toastSuccess(
        `Data exported successfully! ${backup.statistics.totalRecords} records saved.`
      )
    } catch (error) {
      console.error('[Settings] Export failed:', error)
      toastError('Failed to export data')
    } finally {
      exporting = false
    }
  }

  async function handleImportData(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    const confirmed = confirm(
      `Import data from ${file.name}? This will OVERWRITE existing data. Make sure you have a backup first!`
    )

    if (!confirmed) {
      input.value = ''
      return
    }

    importing = true
    toastInfo('Importing data...')

    try {
      const backup = await parseBackupFile(file)
      
      toastInfo(`Importing ${backup.statistics.totalRecords} records...`)

      const result = await importAllData(backup, (progress) => {
        importProgress = progress
      })

      if (result.errors.length > 0) {
        console.error('[Settings] Import errors:', result.errors)
        toastError(`Import completed with ${result.errors.length} errors. Check console.`)
      } else {
        toastSuccess(`Successfully imported ${result.imported} records!`)
      }

      // Reload stats
      await loadDatabaseStats()

      // Refresh stores
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('[Settings] Import failed:', error)
      toastError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      importing = false
      importProgress = { current: 0, total: 0, storeName: '' }
      input.value = ''
    }
  }

  function handleOpenPurgeModal() {
    showPurgeModal = true
  }

  function handleClosePurgeModal() {
    showPurgeModal = false
  }

  async function handlePurgeExport() {
    // Export data before purging
    await handleExportData()
  }

  async function handlePurgeData() {
    try {
      const result = await purgeAllData((progress) => {
        if (purgeModalRef) {
          purgeModalRef.setProgress(progress)
        }
      })

      if (purgeModalRef) {
        purgeModalRef.setComplete(result)
      }

      toastSuccess('All data purged successfully!')
    } catch (error) {
      console.error('[Settings] Purge failed:', error)
      toastError(`Purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showPurgeModal = false
    }
  }

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

  async function handleLoadTestData() {
    const confirmed = confirm(
      'Load demo data? This will generate 5k TimeLogs, 300 Clients, 500 Deals, 400 Invoices, 600 Payments, 1k Activities. This may take a minute.',
    )
    if (!confirmed) return

    loadingTestData = true
    toastInfo('Generating test data...')
    
    try {
      const testDataModule = await import('../lib/data/generateTestData')
      const data = await testDataModule.generateTestData()
      toastInfo('Loading test data into database...')
      await (testDataModule as any).loadTestDataToRepos(data)
      toastSuccess('Test data loaded successfully! Refresh the page to see the data.')
    } catch (error) {
      toastError('Failed to load test data')
      console.error(error)
    } finally {
      loadingTestData = false
    }
  }

  async function handleBackfillWeeklyTotals() {
    const confirmed = confirm(
      'Backfill weekly totals for the last 8 weeks? This will recompute all aggregates from TimeLogs and may take 10-30 seconds.',
    )
    if (!confirmed) return

    backfilling = true
    backfillProgress = { current: 0, total: 8, weekBucket: '' }
    toastInfo('Starting backfill for last 8 weeks...')

    try {
      const result = await backfillWeeklyTotals(8, (progress) => {
        backfillProgress = progress
      })

      // Show success with summary
      const totalHours = result.results.reduce((sum, week) => sum + week.hours, 0)
      const totalLogs = result.results.reduce((sum, week) => sum + week.logCount, 0)

      toastSuccess(
        `✅ Backfill complete! Processed ${result.successCount}/${result.totalWeeks} weeks: ${totalHours.toFixed(2)} hours from ${totalLogs} TimeLogs`
      )

      // Show detailed breakdown in console
      console.table(result.results)

      // Optional: Show top 3 weeks in toast
      const topWeeks = result.results
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 3)
        .map(w => `${w.weekBucket}: ${w.hours.toFixed(1)}h`)
        .join(', ')
      
      if (topWeeks) {
        toastInfo(`Top weeks: ${topWeeks}`, 6000)
      }
    } catch (error) {
      console.error('[Settings] Backfill failed:', error)
      toastError(`Backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      backfilling = false
      backfillProgress = { current: 0, total: 0, weekBucket: '' }
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
        Appearance
      </legend>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="flex flex-col gap-2 text-sm text-slate-200">
          <span class="font-semibold text-slate-100">Theme</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            bind:value={form.theme}
            on:change={() => sessionStore.setTheme(form.theme ?? 'light')}
          >
            <option value="light">Light Mode (Day)</option>
            <option value="dark">Dark Mode (Night)</option>
          </select>
        </label>
        <label class="flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            bind:checked={form.highContrast}
            aria-checked={form.highContrast}
            aria-label="Enable high-contrast theme"
            on:change={() => sessionStore.setHighContrast(form.highContrast ?? false)}
          />
          <span>High-contrast mode</span>
        </label>
      </div>
    </fieldset>

    <fieldset class="space-y-4">
      <legend class="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Performance & Low-End
      </legend>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            bind:checked={form.highContrast}
            aria-checked={form.highContrast}
            aria-label="Enable high-contrast theme"
            on:change={() => sessionStore.setHighContrast(form.highContrast ?? false)}
          />
          <span>High-contrast theme</span>
        </label>
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

  {#if isDev}
    <article class="space-y-4 rounded-xl border border-blue-900/60 bg-blue-950/30 p-6 text-sm">
      <header class="space-y-1">
        <h3 class="text-lg font-semibold text-blue-200">Load Demo Data (Dev Only)</h3>
        <p class="text-xs text-blue-300/80">
          Generate realistic test data for performance testing: 5k TimeLogs, 300 Clients, 500 Deals, 400 Invoices, 600 Payments, 1k Activities.
          This operation takes ~30-60 seconds and directly writes to IndexedDB.
        </p>
      </header>
      <button
        type="button"
        class="rounded-lg border border-blue-700 bg-blue-900/40 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-900/60 disabled:opacity-60"
        on:click={handleLoadTestData}
        disabled={loadingTestData}
      >
        {loadingTestData ? 'Loading test data…' : 'Load Demo Data'}
      </button>
    </article>
  {/if}

  <article class="space-y-4 rounded-xl border border-blue-900/60 bg-blue-950/30 p-6 text-sm">
    <header class="space-y-1">
      <h3 class="text-lg font-semibold text-blue-200">Backfill Weekly Totals</h3>
      <p class="text-xs text-blue-300/80">
        Recompute weekly aggregates for the last 8 weeks from TimeLogs. Use this to fix historical zeros,
        validate data integrity, or refresh stats after bulk imports. Takes 10-30 seconds depending on log count.
      </p>
    </header>
    {#if backfilling}
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-blue-200">
          <span>Processing week {backfillProgress.current} of {backfillProgress.total}...</span>
          <span class="font-mono">{backfillProgress.weekBucket}</span>
        </div>
        <div class="h-2 w-full rounded-lg bg-blue-900/40">
          <div
            class="h-2 rounded-lg bg-blue-400 transition-[width] duration-300"
            style={`width: ${(backfillProgress.current / backfillProgress.total) * 100}%;`}
          ></div>
        </div>
      </div>
    {/if}
    <button
      type="button"
      class="rounded-lg border border-blue-700 bg-blue-900/40 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-900/60 disabled:opacity-60"
      on:click={handleBackfillWeeklyTotals}
      disabled={backfilling}
    >
      {backfilling ? 'Backfilling...' : 'Backfill Last 8 Weeks'}
    </button>
  </article>

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

  <!-- Database Management Section -->
  <article class="space-y-4 rounded-xl border border-purple-900/60 bg-purple-950/30 p-6 text-sm">
    <header class="space-y-1">
      <h3 class="text-lg font-semibold text-purple-200">💾 Database Management</h3>
      <p class="text-xs text-purple-300/80">
        Backup, restore, and manage your application data. All operations work with your local IndexedDB database.
      </p>
    </header>

    <!-- Database Statistics -->
    <div class="rounded-lg border border-purple-800/50 bg-purple-900/20 p-4">
      <h4 class="mb-3 text-sm font-semibold text-purple-200">Database Statistics</h4>
      <div class="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <div>
          <p class="text-purple-400">Total Records</p>
          <p class="text-lg font-bold text-purple-100">{totalRecords.toLocaleString()}</p>
        </div>
        <div>
          <p class="text-purple-400">Time Logs</p>
          <p class="text-lg font-bold text-purple-100">{(dbStats.timelogs || 0).toLocaleString()}</p>
        </div>
        <div>
          <p class="text-purple-400">Clients</p>
          <p class="text-lg font-bold text-purple-100">{(dbStats.clients || 0).toLocaleString()}</p>
        </div>
        <div>
          <p class="text-purple-400">Invoices</p>
          <p class="text-lg font-bold text-purple-100">{(dbStats.invoices || 0).toLocaleString()}</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-3 text-xs text-purple-400 hover:text-purple-300"
        on:click={loadDatabaseStats}
      >
        🔄 Refresh Stats
      </button>
    </div>

    <!-- Export/Import -->
    <div class="space-y-3">
      <h4 class="text-sm font-semibold text-purple-200">Backup & Restore</h4>
      
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-lg border border-purple-700 bg-purple-900/40 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-900/60 disabled:opacity-60"
          on:click={handleExportData}
          disabled={exporting}
        >
          {exporting ? '⏳ Exporting...' : '💾 Export All Data'}
        </button>

        <label class="cursor-pointer">
          <input
            type="file"
            accept=".json"
            class="hidden"
            on:change={handleImportData}
            disabled={importing}
          />
          <span
            class="inline-block rounded-lg border border-purple-700 bg-purple-900/40 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-900/60 {importing ? 'opacity-60 cursor-not-allowed' : ''}"
          >
            {importing ? '⏳ Importing...' : '📥 Import Data'}
          </span>
        </label>
      </div>

      {#if importing && importProgress.total > 0}
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs text-purple-200">
            <span>Importing {importProgress.storeName}...</span>
            <span>{importProgress.current} / {importProgress.total}</span>
          </div>
          <div class="h-2 w-full rounded-lg bg-purple-900/40">
            <div
              class="h-2 rounded-lg bg-purple-400 transition-[width] duration-300"
              style={`width: ${(importProgress.current / importProgress.total) * 100}%;`}
            ></div>
          </div>
        </div>
      {/if}

      <p class="text-xs text-purple-300/70">
        💡 Export creates a JSON backup file. Import restores data from a backup. Archives are preserved.
      </p>
    </div>
  </article>

  <!-- Data Purge Section -->
  <article class="space-y-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-6 text-sm">
    <header class="space-y-1">
      <h3 class="text-lg font-semibold text-rose-200">🔥 Permanent Data Purge</h3>
      <p class="text-xs text-rose-300/80">
        <strong>⚠️ DANGER ZONE:</strong> Permanently delete ALL data including archives. This action cannot be undone.
      </p>
    </header>

    <div class="rounded-lg border border-amber-700 bg-amber-900/30 p-4">
      <p class="text-xs text-amber-200">
        <strong>What gets deleted:</strong> All records in all tables (clients, jobs, time logs, invoices, payments, deals, activities, expenses, products, and more), all localStorage settings, and all sessionStorage data. Archives will NOT be preserved.
      </p>
    </div>

    <div class="rounded-lg border border-rose-700 bg-rose-900/30 p-4">
      <p class="text-xs text-rose-200">
        <strong>Protection:</strong> You'll be prompted to export your data first, then required to type "THE PURGE" to confirm.
      </p>
    </div>

    <button
      type="button"
      class="rounded-lg border border-rose-700 bg-rose-900/40 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-800 disabled:opacity-60"
      on:click={handleOpenPurgeModal}
      disabled={exporting || importing}
    >
      🗑️ Purge All Data
    </button>
  </article>

  <footer class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
    Settings persist locally in `localStorage` so offline browsers reuse the cadence even without a
    network connection. Sync support is intentionally out-of-scope for the MVP.
  </footer>
</section>

<!-- Data Purge Modal -->
<DataPurgeModal
  bind:this={purgeModalRef}
  bind:isOpen={showPurgeModal}
  statistics={dbStats}
  on:close={handleClosePurgeModal}
  on:export={handlePurgeExport}
  on:purge={handlePurgeData}
/>
