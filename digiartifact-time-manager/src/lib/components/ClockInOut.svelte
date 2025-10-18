<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { workSessionsRepo } from '../repos/workSessionsRepo'
  import type { WorkSessionRecord } from '../types/entities'

  let activeSession: WorkSessionRecord | null = null
  let elapsedTime = 0
  let intervalId: number | null = null
  let loading = false

  // Update elapsed time every second when clocked in
  function updateElapsedTime() {
    if (activeSession && activeSession.clockInTime) {
      const now = Date.now()
      const clockIn = new Date(activeSession.clockInTime).getTime()
      const elapsed = Math.floor((now - clockIn) / 1000)
      elapsedTime = elapsed
    }
  }

  // Format seconds to HH:MM:SS
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  async function loadActiveSession() {
    try {
      const session = await workSessionsRepo.getActiveSession()
      activeSession = session ?? null
      if (activeSession) {
        updateElapsedTime()
      }
    } catch (error) {
      console.error('Failed to load active session:', error)
    }
  }

  async function clockIn() {
    loading = true
    try {
      const newSession: Partial<WorkSessionRecord> = {
        clockInTime: new Date().toISOString(),
        clockOutTime: null,
        status: 'active',
        totalMinutes: undefined,
      }

      const created = await workSessionsRepo.create(newSession as any)
      activeSession = created
      elapsedTime = 0

      // Start interval
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
      intervalId = window.setInterval(updateElapsedTime, 1000)
    } catch (error) {
      console.error('Failed to clock in:', error)
      alert('Failed to clock in. Please try again.')
    } finally {
      loading = false
    }
  }

  async function clockOut() {
    if (!activeSession) return

    loading = true
    try {
      const now = Date.now()
      const clockIn = new Date(activeSession.clockInTime).getTime()
      const totalMinutes = Math.floor((now - clockIn) / 60000)

      await workSessionsRepo.update(activeSession.id, {
        clockOutTime: new Date().toISOString(),
        status: 'completed',
        totalMinutes,
      })

      activeSession = null
      elapsedTime = 0

      // Stop interval
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    } catch (error) {
      console.error('Failed to clock out:', error)
      alert('Failed to clock out. Please try again.')
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadActiveSession()

    // Start interval if there's an active session
    if (activeSession) {
      intervalId = window.setInterval(updateElapsedTime, 1000)
    }
  })

  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })

  // Reactive statement to manage interval
  $: if (activeSession && intervalId === null) {
    intervalId = window.setInterval(updateElapsedTime, 1000)
  } else if (!activeSession && intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
</script>

<article class="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
  <header class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-slate-100">Work Session</h3>
    {#if activeSession}
      <span class="flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span class="text-sm font-semibold text-emerald-400">Active</span>
      </span>
    {:else}
      <span class="text-sm text-slate-400">Not clocked in</span>
    {/if}
  </header>

  {#if activeSession}
    <div class="space-y-3">
      <div class="text-center space-y-1">
        <p class="text-xs text-slate-400">Elapsed Time</p>
        <p class="font-mono text-4xl font-bold text-slate-50">{formatTime(elapsedTime)}</p>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="space-y-1">
          <p class="text-xs text-slate-400">Clocked In</p>
          <p class="font-medium text-slate-200">
            {new Date(activeSession.clockInTime).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-slate-400">Hours Today</p>
          <p class="font-medium text-slate-200">{(elapsedTime / 3600).toFixed(2)}</p>
        </div>
      </div>

      <button
        on:click={clockOut}
        disabled={loading}
        class="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Clocking Out...' : 'Clock Out'}
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      <p class="text-sm text-slate-300">
        Start tracking your work session for DigiArtifact. Clock in to begin logging your time.
      </p>
      <button
        on:click={clockIn}
        disabled={loading}
        class="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Clocking In...' : 'Clock In'}
      </button>
    </div>
  {/if}
</article>
