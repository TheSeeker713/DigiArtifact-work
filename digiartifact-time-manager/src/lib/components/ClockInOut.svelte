<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { workSessionsRepo } from '../repos/workSessionsRepo'
  import type { WorkSessionRecord, BreakPeriod } from '../types/entities'
  import { debugLog } from '../utils/debug'
  import { workSessionStore } from '../stores/workSessionStore'
  import { recomputeWeekAggregates } from '../services/statsAggregationService'
  import { toastStore } from '../stores/toastStore'
  import { offlineQueueStore } from '../stores/offlineQueueStore'
  import { statsStore } from '../stores/statsStore'
  import { settingsStore } from '../stores/settingsStore'
  import { getWeekLabel } from '../utils/timeBuckets'

  // FIX 9: Subscribe to global work session store instead of local state
  $: activeSession = $workSessionStore.activeSession
  $: storeLoading = $workSessionStore.loading
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

  // FIX 12: Real-time sync - Update elapsed time AND statsStore every second
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

      // FIX 12: CRITICAL - Sync Work Session "Total Time" with "Hours This Week" in real-time
      // Calculate net work minutes (excluding breaks)
      const work_ms = Math.max(0, elapsed_ms - break_ms_accum - (break_started_at ? (now - break_started_at) : 0))
      const workMinutes = Math.round(work_ms / 60000)
      
      // Update statsStore with live minutes so "Hours This Week" matches "Total Time"
      const settings = $settingsStore
      const weekBucket = getWeekLabel(activeSession.clockInTime, settings.timezone, settings.weekStart as any)
      const targetMinutes = settings.weekTargetHours * 60
      statsStore.updateLiveMinutes(weekBucket, workMinutes, targetMinutes)
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
      
      // FIX 9: Update global store instead of local state
      workSessionStore.setActiveSession(session ?? null)
      
      if (session) {
        // Initialize timer state from session
        start_wallclock = new Date(session.clockInTime).getTime()
        start_hrtime = performance.now() - (Date.now() - start_wallclock)
        break_ms_accum = (session.totalBreakMinutes || 0) * 60000
        
        currentBreak = workSessionsRepo.getCurrentBreak(session)
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
      workSessionStore.setError('Failed to load active session')
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
    workSessionStore.setLoading(true)
    
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
      
      // FIX 9: Update global store instead of local state
      workSessionStore.setActiveSession(created)
      
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
      workSessionStore.setError('Failed to clock in. Please try again.')
      toastStore.enqueue({
        message: 'Failed to clock in. Please try again.',
        tone: 'error',
        duration: 5000,
      })
      resetTimerState()
    } finally {
      loading = false
      workSessionStore.setLoading(false)
    }
  }

  async function clockOut() {
    if (!activeSession || start_wallclock === null) return

    loading = true
    try {
      console.log('[ClockInOut] Clock Out initiated for session:', activeSession.id)
      const now = Date.now()
      
      // FIX 11: Validate end_dt > start_dt (prevent time travel)
      const startDT = activeSession.clockInTime
      const endDT = new Date(now).toISOString()
      const startMs = new Date(startDT).getTime()
      const endMs = new Date(endDT).getTime()
      
      if (endMs <= startMs) {
        debugLog.time.error('Clock Out: Invalid time range', {
          start_dt: startDT,
          end_dt: endDT,
          start_ms: startMs,
          end_ms: endMs,
        })
        
        toastStore.enqueue({
          message: '⚠️ Clock out time must be after clock in time. Please check your system clock.',
          tone: 'error',
          duration: 8000,
        })
        
        loading = false
        return
      }
      
      // FIX 8: Validate session duration before proceeding
      // Import validation utilities
      const { validateSessionDuration, formatSessionWarning } = await import('../utils/timeBuckets')
      const validation = validateSessionDuration(startDT, endDT, 14)
      
      if (!validation.valid) {
        // Session exceeds 14 hours - warn and require confirmation
        const warningMsg = formatSessionWarning(validation.hours, validation.exceedsBy)
        const confirmed = confirm(warningMsg)
        
        if (!confirmed) {
          console.log('[ClockInOut] User cancelled clock out due to long session duration')
          debugLog.time.warn('Clock Out cancelled by user', {
            session_id: activeSession.id,
            duration_hours: validation.hours,
            exceeds_by: validation.exceedsBy
          })
          loading = false
          return
        }
        
        debugLog.time.warn('Clock Out confirmed for long session', {
          session_id: activeSession.id,
          duration_hours: validation.hours,
          exceeds_by: validation.exceedsBy,
          user_confirmed: true
        })
      }
      
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
      
      // FIX 11: Warn if duration is zero
      if (totalMinutes === 0) {
        debugLog.time.warn('Clock Out: Zero duration detected', {
          session_id: activeSession.id,
          clock_in: startDT,
          clock_out: endDT,
          elapsed_ms,
          break_ms: break_ms_accum,
        })
        
        const confirmed = confirm(
          'Warning: This session has 0 minutes of work time.\n\n' +
          `Clock In: ${new Date(startDT).toLocaleString()}\n` +
          `Clock Out: ${new Date(endDT).toLocaleString()}\n\n` +
          'This may be due to:\n' +
          '• Very short session (< 30 seconds)\n' +
          '• System clock changed during session\n' +
          '• All time spent on break\n\n' +
          'Do you want to save this 0-minute session?'
        )
        
        if (!confirmed) {
          debugLog.time.info('Clock Out: User cancelled zero-duration session')
          loading = false
          return
        }
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

      // FIX 11: Try to save, enqueue on failure
      try {
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
      } catch (saveError) {
        // FIX 11: Enqueue failed write to offline queue
        debugLog.time.error('Clock Out: IndexedDB save failed, enqueueing', { error: saveError })
        
        offlineQueueStore.enqueue({
          type: 'workSession',
          operation: 'update',
          data: {
            id: activeSession.id,
            clockOutTime: new Date().toISOString(),
            status: 'completed',
            totalMinutes,
            netMinutes,
          },
        })
        
        toastStore.enqueue({
          message: '⚠️ Clock out saved to local queue. Will sync when database is available.',
          tone: 'warning',
          duration: 5000,
        })
        
        // Continue with UI updates (optimistic update)
      }

      // FIX 9: Clear active session in global store (triggers header badge update)
      workSessionStore.clearActiveSession()
      
      // Reset timer state
      resetTimerState()
      elapsedTime = 0
      breakTime = 0
      currentBreak = null

      // Stop interval
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
      
      // FIX 9: Recompute week aggregates (updates "This Week" stats)
      try {
        await recomputeWeekAggregates()
        debugLog.time.info('Clock Out: Stats recomputed successfully')
      } catch (statsError) {
        console.error('[ClockInOut] Failed to recompute stats after clock out:', statsError)
        // Non-blocking: stats will sync later
      }
      
      console.log('[ClockInOut] Clock Out complete')
      toastStore.enqueue({
        message: '✅ Clocked out successfully',
        tone: 'success',
        duration: 3000,
      })
    } catch (error) {
      debugLog.time.error('Clock Out failed', { error })
      console.error('[ClockInOut] Failed to clock out:', error)
      
      // FIX 9: DO NOT clear timer state on error - preserve session
      workSessionStore.setError('Failed to clock out')
      
      // Show error recovery toast with actions
      showClockOutErrorToast()
    } finally {
      loading = false
    }
  }
  
  /**
   * FIX 9: Show error recovery toast with Retry/Save Locally options
   */
  function showClockOutErrorToast() {
    const errorHtml = `
      <div class="space-y-2">
        <p class="font-semibold">Failed to save clock out</p>
        <p class="text-sm">Your work session is still active. Choose an option:</p>
        <div class="flex gap-2 mt-2">
          <button 
            onclick="window.retryClockOut()" 
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
          >
            Retry Save
          </button>
          <button 
            onclick="window.saveLocallyAndClear()" 
            class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded text-sm font-medium transition-colors"
          >
            Save Locally
          </button>
        </div>
      </div>
    `
    
    toastStore.enqueue({
      message: errorHtml,
      tone: 'error',
      duration: 0, // Persistent until user acts
    })
    
    // Attach global handlers
    if (typeof window !== 'undefined') {
      ;(window as any).retryClockOut = () => {
        toastStore.clear()
        clockOut()
      }
      
      ;(window as any).saveLocallyAndClear = async () => {
        try {
          // Save session data to localStorage as backup
          const backupData = {
            session: activeSession,
            clockOutTime: new Date().toISOString(),
            timerState: { start_wallclock, break_ms_accum, elapsedTime },
          }
          localStorage.setItem('clockout_backup', JSON.stringify(backupData))
          
          // Clear UI state to let user continue
          workSessionStore.clearActiveSession()
          resetTimerState()
          elapsedTime = 0
          breakTime = 0
          currentBreak = null
          
          if (intervalId !== null) {
            clearInterval(intervalId)
            intervalId = null
          }
          
          toastStore.clear()
          toastStore.enqueue({
            message: '⚠️ Session saved locally. Please sync manually when online.',
            tone: 'warning',
            duration: 8000,
          })
          
          debugLog.time.warn('Clock Out: Saved locally due to error', { backupData })
        } catch (backupError) {
          console.error('[ClockInOut] Failed to save locally:', backupError)
          toastStore.enqueue({
            message: 'Failed to save locally. Please screenshot your session details.',
            tone: 'error',
            duration: 10000,
          })
        }
      }
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
      
      // FIX 9: Update global store
      workSessionStore.setActiveSession(updated)
      
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
      toastStore.enqueue({
        message: 'Failed to start break. Please try again.',
        tone: 'error',
        duration: 5000,
      })
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
      
      // FIX 9: Update global store
      workSessionStore.setActiveSession(updated)
      
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
      toastStore.enqueue({
        message: 'Failed to end break. Please try again.',
        tone: 'error',
        duration: 5000,
      })
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
    // FIX 9: Don't load active session - workSessionStore is already initialized
    // If activeSession exists (from store), initialize timer state
    if (activeSession) {
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
      console.log('[ClockInOut] Resumed active session from store')
      
      // Start interval
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
