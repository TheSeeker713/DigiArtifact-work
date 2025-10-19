<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { workSessionsRepo } from '../repos/workSessionsRepo'
  import type { WorkSessionRecord, BreakPeriod } from '../types/entities'
  import { debugLog } from '../utils/debug'

  let activeSession: WorkSessionRecord | null = null
  let elapsedTime = 0
  let breakTime = 0
  let currentBreak: BreakPeriod | null = null
  let intervalId: number | null = null
  let loading = false

  // Timer state for accurate time tracking
  let start_hrtime: number | null = null // performance.now() for high-resolution timing
  let start_wallclock: number | null = null // Date.now() for absolute time
  let break_ms_accum = 0 // Accumulated break time in milliseconds
  let break_started_at: number | null = null // Date.now() when break started, null when not on break

  // Update elapsed time every second when clocked in
  function updateElapsedTime() {
    if (activeSession && start_wallclock !== null) {
      const now = Date.now()
      
      // Calculate total elapsed time
      const elapsed_ms = now - start_wallclock
      elapsedTime = Math.floor(elapsed_ms / 1000)

      // Update break time if on break
      if (activeSession.status === 'on_break' && break_started_at !== null) {
        const current_break_ms = now - break_started_at
        breakTime = Math.floor(current_break_ms / 1000)
      } else {
        breakTime = 0
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
        // Initialize timer state from session
        start_wallclock = new Date(activeSession.clockInTime).getTime()
        start_hrtime = performance.now() - (Date.now() - start_wallclock)
        break_ms_accum = (activeSession.totalBreakMinutes || 0) * 60000
        
        currentBreak = workSessionsRepo.getCurrentBreak(activeSession)
        if (currentBreak && currentBreak.startTime) {
          break_started_at = new Date(currentBreak.startTime).getTime()
        } else {
          break_started_at = null
        }
        
        updateElapsedTime()
        console.log('[ClockInOut] Resumed active session, elapsed time:', elapsedTime, 'seconds')
        console.log('[ClockInOut] Current break:', currentBreak)
        console.log('[ClockInOut] Timer state:', { start_wallclock, break_ms_accum, break_started_at })
      } else {
        console.log('[ClockInOut] No active session found')
        resetTimerState()
      }
    } catch (error) {
      console.error('[ClockInOut] Failed to load active session:', error)
    }
  }

  function resetTimerState() {
    start_hrtime = null
    start_wallclock = null
    break_ms_accum = 0
    break_started_at = null
  }

  async function clockIn() {
    loading = true
    try {
      // Initialize timer state with both high-resolution and wall clock time
      start_hrtime = performance.now()
      start_wallclock = Date.now()
      break_ms_accum = 0
      break_started_at = null
      
      const startTime = new Date(start_wallclock).toISOString()
      
      debugLog.time.info('Clock In initiated', {
        start_ts: start_wallclock,
        start_hrtime,
        start_time: startTime,
        job_id: null, // Future: link to active job
        task_id: null, // Future: link to active task
        timer_id: null, // Future: if using timer system
      })
      
      console.log('[ClockInOut] Clock In initiated')
      const newSession: Partial<WorkSessionRecord> = {
        clockInTime: startTime,
        clockOutTime: null,
        status: 'active',
        totalMinutes: undefined,
        breaks: [],
        totalBreakMinutes: 0,
      }

      console.log('[ClockInOut] Creating session:', newSession)
      const created = await workSessionsRepo.create(newSession as any)
      console.log('[ClockInOut] Session created successfully:', created)
      
      debugLog.time.info('Clock In complete', {
        session_id: created.id,
        created_at: created.createdAt,
        timer_state: { start_hrtime, start_wallclock, break_ms_accum, break_started_at }
      })
      
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
      debugLog.time.error('Clock In failed', { error })
      console.error('[ClockInOut] Failed to clock in:', error)
      alert('Failed to clock in. Please try again.')
      resetTimerState()
    } finally {
      loading = false
    }
  }

  async function clockOut() {
    if (!activeSession || start_wallclock === null) return

    loading = true
    try {
      console.log('[ClockInOut] Clock Out initiated for session:', activeSession.id)
      const now = Date.now()
      
      // Close active break first if exists
      if (break_started_at !== null) {
        const current_break_ms = now - break_started_at
        break_ms_accum += current_break_ms
        debugLog.time.info('Clock Out: closing active break', {
          session_id: activeSession.id,
          current_break_ms,
          new_break_ms_accum: break_ms_accum
        })
      }
      
      // Compute durations using new timer math
      const end_ts = now
      const elapsed_ms = now - start_wallclock
      const work_ms = Math.max(0, elapsed_ms - break_ms_accum)
      let totalMinutes = Math.round(work_ms / 60000)
      
      // Guard against NaN/negative values
      if (isNaN(totalMinutes) || totalMinutes < 0) {
        debugLog.time.warn('Clock Out: NaN or negative duration detected', {
          totalMinutes,
          elapsed_ms,
          break_ms: break_ms_accum,
          work_ms
        })
        totalMinutes = 0
      }
      
      const totalBreakMinutes = Math.round(break_ms_accum / 60000)
      const netMinutes = totalMinutes // work_ms already excludes breaks

      debugLog.time.info('Clock Out initiated', {
        session_id: activeSession.id,
        end_ts,
        end_time: new Date(end_ts).toISOString(),
        start_wallclock,
        start_time: new Date(start_wallclock).toISOString(),
        elapsed_ms,
        break_ms: break_ms_accum,
        work_ms,
        computed_duration_min: totalMinutes,
        break_duration_min: totalBreakMinutes,
        net_duration_min: netMinutes,
        had_active_break: break_started_at !== null,
        breaks_count: activeSession.breaks?.length || 0,
        timer_state: { start_hrtime, start_wallclock, break_ms_accum, break_started_at }
      })

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
      
      debugLog.time.info('Clock Out complete - saved session verified', {
        session_id: savedSession?.id,
        clock_in: savedSession?.clockInTime,
        clock_out: savedSession?.clockOutTime,
        total_minutes: savedSession?.totalMinutes,
        break_minutes: savedSession?.totalBreakMinutes,
        net_minutes: savedSession?.netMinutes,
        status: savedSession?.status,
        breaks_count: savedSession?.breaks?.length || 0,
      })

      // Reset timer state
      resetTimerState()
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
      debugLog.time.error('Clock Out failed', { error })
      console.error('[ClockInOut] Failed to clock out:', error)
      alert('Failed to clock out. Please try again.')
    } finally {
      loading = false
    }
  }

  async function startBreak() {
    if (!activeSession || start_wallclock === null) return
    
    loading = true
    try {
      // Record when break started
      break_started_at = Date.now()
      
      debugLog.time.info('Take Break initiated', {
        event: 'break_start',
        session_id: activeSession.id,
        now: break_started_at,
        now_time: new Date(break_started_at).toISOString(),
        accumulated_break_ms: break_ms_accum,
        previous_breaks_count: activeSession.breaks?.length || 0,
        timer_state: { start_wallclock, break_ms_accum, break_started_at }
      })
      
      console.log('[ClockInOut] Starting break')
      const updated = await workSessionsRepo.startBreak(activeSession.id)
      activeSession = updated
      currentBreak = workSessionsRepo.getCurrentBreak(updated)
      breakTime = 0
      
      debugLog.time.info('Take Break complete', {
        session_id: updated.id,
        break_id: currentBreak?.id,
        status: updated.status,
      })
      
      console.log('[ClockInOut] Break started successfully')
    } catch (error) {
      debugLog.time.error('Take Break failed', { error })
      console.error('[ClockInOut] Failed to start break:', error)
      alert('Failed to start break. Please try again.')
      break_started_at = null
    } finally {
      loading = false
    }
  }

  async function endBreak() {
    if (!activeSession || break_started_at === null) return
    
    loading = true
    try {
      const now = Date.now()
      
      // Add this break's duration to accumulated break time
      const current_break_ms = now - break_started_at
      break_ms_accum += current_break_ms
      
      debugLog.time.info('Resume Work initiated', {
        event: 'break_end',
        session_id: activeSession.id,
        now,
        now_time: new Date(now).toISOString(),
        current_break_ms,
        accumulated_break_ms: break_ms_accum,
        break_id: currentBreak?.id,
        timer_state: { start_wallclock, break_ms_accum, break_started_at }
      })
      
      console.log('[ClockInOut] Ending break')
      const updated = await workSessionsRepo.endBreak(activeSession.id)
      activeSession = updated
      currentBreak = null
      breakTime = 0
      
      // Clear break_started_at since we're no longer on break
      break_started_at = null
      
      debugLog.time.info('Resume Work complete', {
        session_id: updated.id,
        status: updated.status,
        total_break_minutes: updated.totalBreakMinutes,
        breaks_count: updated.breaks?.length || 0,
        new_break_ms_accum: break_ms_accum
      })
      
      console.log('[ClockInOut] Break ended successfully')
    } catch (error) {
      debugLog.time.error('Resume Work failed', { error })
      console.error('[ClockInOut] Failed to end break:', error)
      alert('Failed to end break. Please try again.')
      // Rollback the break accumulation on error
      if (break_started_at !== null) {
        const current_break_ms = Date.now() - break_started_at
        break_ms_accum -= current_break_ms
      }
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
