<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { workSessionsRepo } from '../repos/workSessionsRepo'
  import { activeTasksRepo } from '../repos/activeTasksRepo'
  import type { WorkSessionRecord, ActiveTaskRecord } from '../types/entities'

  let activeSession: WorkSessionRecord | null = null
  let activeTasks: ActiveTaskRecord[] = []
  let elapsedTime = 0
  let totalTimeToday = 0
  let intervalId: number | null = null

  // Format seconds to HH:MM:SS
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Format task elapsed time
  function formatTaskTime(task: ActiveTaskRecord): string {
    const now = Date.now()
    const start = new Date(task.startTime).getTime()
    const elapsed = Math.floor((now - start) / 1000)
    const minutes = Math.floor(elapsed / 60)
    
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  function updateTimers() {
    // Update work session elapsed time
    if (activeSession && activeSession.clockInTime) {
      const now = Date.now()
      const clockIn = new Date(activeSession.clockInTime).getTime()
      const elapsed = Math.floor((now - clockIn) / 1000)
      elapsedTime = elapsed
    }

    // Force re-render for active tasks (triggers reactivity)
    activeTasks = activeTasks
  }

  async function loadActiveSession() {
    try {
      const session = await workSessionsRepo.getActiveSession()
      activeSession = session ?? null
      
      if (activeSession) {
        updateTimers()
      }
    } catch (error) {
      console.error('[LiveStatus] Failed to load active session:', error)
    }
  }

  async function loadActiveTasks() {
    try {
      const tasks = await activeTasksRepo.getRunningTasks()
      activeTasks = tasks
    } catch (error) {
      console.error('[LiveStatus] Failed to load active tasks:', error)
    }
  }

  async function calculateTodayTime() {
    try {
      const allSessions = await workSessionsRepo.getAllSessions()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todaySessions = allSessions.filter(s => {
        const sessionDate = new Date(s.clockInTime)
        return sessionDate >= today && s.totalMinutes !== undefined
      })

      totalTimeToday = todaySessions.reduce((sum, s) => sum + (s.netMinutes || s.totalMinutes || 0), 0)
    } catch (error) {
      console.error('[LiveStatus] Failed to calculate today time:', error)
    }
  }

  onMount(() => {
    loadActiveSession()
    loadActiveTasks()
    calculateTodayTime()

    // Update every second
    intervalId = window.setInterval(() => {
      updateTimers()
    }, 1000)

    // Refresh data every 30 seconds
    const refreshId = window.setInterval(() => {
      loadActiveSession()
      loadActiveTasks()
      calculateTodayTime()
    }, 30000)

    return () => {
      if (refreshId) clearInterval(refreshId)
    }
  })

  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })

  // Calculate active timers count
  $: activeTimerCount = (activeSession ? 1 : 0) + activeTasks.length
</script>

<header class="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-14 gap-4">
      <!-- Left: Active Timers Badge -->
      <div class="flex items-center gap-3">
        {#if activeTimerCount > 0}
          <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-600/30 rounded-full">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-xs font-semibold text-emerald-300">
              {activeTimerCount} {activeTimerCount === 1 ? 'Timer' : 'Timers'} Active
            </span>
          </div>
        {:else}
          <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full">
            <span class="text-xs font-medium text-slate-400">No Active Timers</span>
          </div>
        {/if}
      </div>

      <!-- Center: Active Work Session -->
      {#if activeSession}
        <div class="hidden sm:flex items-center gap-4 px-4 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg">
          <div class="flex items-center gap-2">
            {#if activeSession.status === 'on_break'}
              <span class="text-xs text-amber-400">☕ On Break</span>
            {:else}
              <span class="text-xs text-emerald-400">🍅 Working</span>
            {/if}
          </div>
          <div class="h-4 w-px bg-slate-700"></div>
          <div class="font-mono text-sm font-semibold text-slate-200">
            {formatTime(elapsedTime)}
          </div>
        </div>
      {/if}

      <!-- Right: Running Tasks -->
      <div class="flex items-center gap-2 overflow-x-auto max-w-md">
        {#if activeTasks.length > 0}
          <span class="text-xs text-slate-400 whitespace-nowrap">Tasks:</span>
          {#each activeTasks.slice(0, 3) as task}
            <div class="flex items-center gap-1.5 px-2 py-1 bg-blue-600/20 border border-blue-600/30 rounded-md">
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span class="text-xs font-medium text-blue-300 truncate max-w-[120px]">
                {task.taskName}
              </span>
              <span class="text-xs text-blue-400/70 font-mono">
                {formatTaskTime(task)}
              </span>
            </div>
          {/each}
          {#if activeTasks.length > 3}
            <span class="text-xs text-slate-400">+{activeTasks.length - 3} more</span>
          {/if}
        {/if}
      </div>

      <!-- Far Right: Today's Total -->
      <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg">
        <span class="text-xs text-slate-400">Today:</span>
        <span class="text-sm font-semibold text-slate-200">
          {(totalTimeToday / 60).toFixed(1)}h
        </span>
      </div>
    </div>
  </div>
</header>

<style>
  /* Hide scrollbar but keep functionality */
  .overflow-x-auto::-webkit-scrollbar {
    display: none;
  }
  .overflow-x-auto {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
