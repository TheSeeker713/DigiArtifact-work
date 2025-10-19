<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { workSessionsRepo } from '../repos/workSessionsRepo'
  import type { WorkSessionRecord, BreakPeriod } from '../types/entities'

  let activeSession: WorkSessionRecord | null = null
  let elapsedTime = 0
  let breakTime = 0
  let currentBreak: BreakPeriod | null = null
  let intervalId: number | null = null
  let loading = false

  // Update elapsed time every second when clocked in
  function updateElapsedTime() {
    if (activeSession && activeSession.clockInTime) {
      const now = Date.now()
      const clockIn = new Date(activeSession.clockInTime).getTime()
      const elapsed = Math.floor((now - clockIn) / 1000)
      elapsedTime = elapsed

      // Update break time if on break
      if (activeSession.status === 'on_break' && currentBreak && currentBreak.startTime) {
        const breakStart = new Date(currentBreak.startTime).getTime()
        const breakElapsed = Math.floor((now - breakStart) / 1000)
        breakTime = breakElapsed
      }
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
      console.log('[ClockInOut] Loading active session...')
      const session = await workSessionsRepo.getActiveSession()
      console.log('[ClockInOut] Active session found:', session)
      
      activeSession = session ?? null
      if (activeSession) {
        currentBreak = workSessionsRepo.getCurrentBreak(activeSession)
        updateElapsedTime()
        console.log('[ClockInOut] Resumed active session, elapsed time:', elapsedTime, 'seconds')
        console.log('[ClockInOut] Current break:', currentBreak)
      } else {
        console.log('[ClockInOut] No active session found')
      }
    } catch (error) {
      console.error('[ClockInOut] Failed to load active session:', error)
    }
  }

  async function clockIn() {
    loading = true
    try {
      console.log('[ClockInOut] Clock In initiated')
      const newSession: Partial<WorkSessionRecord> = {
        clockInTime: new Date().toISOString(),
        clockOutTime: null,
        status: 'active',
        totalMinutes: undefined,
        breaks: [],
        totalBreakMinutes: 0,
      }

      console.log('[ClockInOut] Creating session:', newSession)
      const created = await workSessionsRepo.create(newSession as any)
      console.log('[ClockInOut] Session created successfully:', created)
      
      activeSession = created
      elapsedTime = 0
      breakTime = 0
      currentBreak = null

      // Start interval
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
      intervalId = window.setInterval(updateElapsedTime, 1000)
      
      console.log('[ClockInOut] Clock In complete, timer started')
    } catch (error) {
      console.error('[ClockInOut] Failed to clock in:', error)
      alert('Failed to clock in. Please try again.')
    } finally {
      loading = false
    }
  }

  async function clockOut() {
    if (!activeSession) return

    loading = true
    try {
      console.log('[ClockInOut] Clock Out initiated for session:', activeSession.id)
      const now = Date.now()
      const clockIn = new Date(activeSession.clockInTime).getTime()
      const totalMinutes = Math.floor((now - clockIn) / 60000)
      const totalBreakMinutes = activeSession.totalBreakMinutes || 0
      const netMinutes = Math.max(0, totalMinutes - totalBreakMinutes)

      console.log('[ClockInOut] Clocked in at:', activeSession.clockInTime)
      console.log('[ClockInOut] Clocking out at:', new Date().toISOString())
      console.log('[ClockInOut] Total minutes:', totalMinutes)
      console.log('[ClockInOut] Break minutes:', totalBreakMinutes)
      console.log('[ClockInOut] Net minutes:', netMinutes)

      await workSessionsRepo.update(activeSession.id, {
        clockOutTime: new Date().toISOString(),
        status: 'completed',
        totalMinutes,
        netMinutes,
      })

      console.log('[ClockInOut] Session updated successfully')

      // Verify the data was saved
      const savedSession = await workSessionsRepo.getById(activeSession.id)
      console.log('[ClockInOut] Verified saved session:', savedSession)

      activeSession = null
      elapsedTime = 0
      breakTime = 0
      currentBreak = null

      // Stop interval
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
      
      console.log('[ClockInOut] Clock Out complete')
    } catch (error) {
      console.error('[ClockInOut] Failed to clock out:', error)
      alert('Failed to clock out. Please try again.')
    } finally {
      loading = false
    }
  }

  async function startBreak() {
    if (!activeSession) return
    
    loading = true
    try {
      console.log('[ClockInOut] Starting break')
      const updated = await workSessionsRepo.startBreak(activeSession.id)
      activeSession = updated
      currentBreak = workSessionsRepo.getCurrentBreak(updated)
      breakTime = 0
      console.log('[ClockInOut] Break started successfully')
    } catch (error) {
      console.error('[ClockInOut] Failed to start break:', error)
      alert('Failed to start break. Please try again.')
    } finally {
      loading = false
    }
  }

  async function endBreak() {
    if (!activeSession) return
    
    loading = true
    try {
      console.log('[ClockInOut] Ending break')
      const updated = await workSessionsRepo.endBreak(activeSession.id)
      activeSession = updated
      currentBreak = null
      breakTime = 0
      console.log('[ClockInOut] Break ended successfully')
    } catch (error) {
      console.error('[ClockInOut] Failed to end break:', error)
      alert('Failed to end break. Please try again.')
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
      {#if activeSession.status === 'on_break'}
        <span class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span class="text-sm font-semibold text-amber-400">On Break</span>
        </span>
      {:else}
        <span class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span class="text-sm font-semibold text-emerald-400">Active</span>
        </span>
      {/if}
    {:else}
      <span class="text-sm text-slate-400">Not clocked in</span>
    {/if}
  </header>

  {#if activeSession}
    <div class="space-y-3">
      <div class="text-center space-y-1">
        <p class="text-xs text-slate-400">
          {activeSession.status === 'on_break' ? 'Break Time' : 'Work Time'}
        </p>
        <p class="font-mono text-4xl font-bold text-slate-50">
          {formatTime(activeSession.status === 'on_break' ? breakTime : elapsedTime)}
        </p>
      </div>

      <div class="grid grid-cols-3 gap-3 text-sm">
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
          <p class="text-xs text-slate-400">Total Time</p>
          <p class="font-medium text-slate-200">{(elapsedTime / 3600).toFixed(2)}h</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-slate-400">Break Time</p>
          <p class="font-medium text-slate-200">
            {Math.floor((activeSession.totalBreakMinutes || 0) + (breakTime / 60))}m
          </p>
        </div>
      </div>

      {#if activeSession.status === 'on_break'}
        <button
          on:click={endBreak}
          disabled={loading}
          class="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Resuming...' : 'Resume Work'}
        </button>
      {:else}
        <div class="grid grid-cols-2 gap-3">
          <button
            on:click={startBreak}
            disabled={loading}
            class="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Starting...' : 'Take Break'}
          </button>
          <button
            on:click={clockOut}
            disabled={loading}
            class="rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Clocking Out...' : 'Clock Out'}
          </button>
        </div>
      {/if}
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
