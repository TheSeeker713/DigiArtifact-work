<script lang="ts"></script>
  import { onMount } from 'svelte'
  import { workSessionsRepo } from '../repos/workSessionsRepo'
  import type { WorkSessionRecord } from '../types/entities'

  export let selectedDate: Date = new Date()

  let sessions: WorkSessionRecord[] = []
  let loading = true
  let error: string | null = null

  $: dayKey = formatDateKey(selectedDate)
  $: totalWorkMinutes = sessions.reduce((sum, session) => sum + (session.netMinutes || 0), 0)
  $: totalBreakMinutes = sessions.reduce((sum, session) => sum + (session.totalBreakMinutes || 0), 0)
  $: totalSessions = sessions.length

  function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0] /* YYYY-MM-DD */
  }

  function formatTimeHM(date: string | null | undefined): string {
    if (!date) return '--:--'
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  function formatMinutesToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  function formatMinutesToDecimal(minutes: number): string {
    return (minutes / 60).toFixed(2) + 'h'
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-400'
      case 'completed': return 'text-slate-300'
      case 'on_break': return 'text-amber-400'
      default: return 'text-slate-500'
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return '▶️'
      case 'completed': return '✅'
      case 'on_break': return '⏸️'
      default: return '❓'
    }
  }

  function formatBreakSummary(session: WorkSessionRecord): string {
    if (!session.breaks || session.breaks.length === 0) {
      return 'No breaks'
    }

    const breakCount = session.breaks.length
    const totalBreakMins = session.totalBreakMinutes || 0
    
    if (breakCount === 1) {
      return `1 break (${totalBreakMins}m)`
    }
    
    return `${breakCount} breaks (${totalBreakMins}m total)`
  }

  async function loadDailySessions() {
    loading = true
    error = null

    try {
      console.log('[DailyWorkLog] Loading sessions for date:', dayKey)
      
      // Get all completed sessions
      const allSessions = await workSessionsRepo.getAllSessions()
      
      // Filter sessions for the selected date
      const dailySessions = allSessions.filter(session => {
        if (!session.clockInTime) return false
        
        const sessionDate = new Date(session.clockInTime).toISOString().split('T')[0]
        return sessionDate === dayKey
      })

      // Sort by clock in time (newest first)
      sessions = dailySessions.sort((a, b) => {
        const timeA = new Date(a.clockInTime).getTime()
        const timeB = new Date(b.clockInTime).getTime()
        return timeB - timeA
      })

      console.log(`[DailyWorkLog] Found ${sessions.length} sessions for ${dayKey}`)
    } catch (err) {
      console.error('[DailyWorkLog] Failed to load daily sessions:', err)
      error = err instanceof Error ? err.message : 'Failed to load sessions'
    } finally {
      loading = false
    }
  }

  function goToPreviousDay() {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    selectedDate = prev
  }

  function goToNextDay() {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    selectedDate = next
  }

  function goToToday() {
    selectedDate = new Date()
  }

  // Reload when date changes
  $: if (dayKey) {
    loadDailySessions()
  }

  onMount(() => {
    loadDailySessions()
  })
</script>

<article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
  <!-- Header with Date Navigation -->
  <header class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-100">📋 Daily Work Log</h3>
      
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          on:click={goToPreviousDay}
        >
          ← Prev
        </button>
        
        <button
          type="button"
          class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          on:click={goToToday}
        >
          Today
        </button>
        
        <button
          type="button"
          class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          on:click={goToNextDay}
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Selected Date Display -->
    <div class="text-center">
      <h4 class="text-xl font-bold text-slate-100">
        {selectedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </h4>
      <p class="text-sm text-slate-400">{dayKey}</p>
    </div>

    <!-- Daily Summary -->
    {#if !loading && sessions.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-lg border border-slate-800 bg-slate-800/50 p-4">
        <div class="text-center">
          <p class="text-xs text-slate-400">Sessions</p>
          <p class="text-lg font-bold text-slate-100">{totalSessions}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-slate-400">Work Time</p>
          <p class="text-lg font-bold text-emerald-400">{formatMinutesToDecimal(totalWorkMinutes)}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-slate-400">Break Time</p>
          <p class="text-lg font-bold text-amber-400">{formatMinutesToDecimal(totalBreakMinutes)}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-slate-400">Efficiency</p>
          <p class="text-lg font-bold text-slate-100">
            {totalWorkMinutes + totalBreakMinutes > 0 
              ? Math.round((totalWorkMinutes / (totalWorkMinutes + totalBreakMinutes)) * 100) 
              : 0}%
          </p>
        </div>
      </div>
    {/if}
  </header>

  <!-- Content -->
  <div class="space-y-4">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
        <span class="ml-3 text-slate-400">Loading sessions...</span>
      </div>
    {:else if error}
      <div class="rounded-lg border border-red-800 bg-red-900/30 p-4 text-center">
        <p class="text-red-300">❌ {error}</p>
        <button
          type="button"
          class="mt-2 text-sm text-red-400 hover:text-red-300"
          on:click={loadDailySessions}
        >
          Try again
        </button>
      </div>
    {:else if sessions.length === 0}
      <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
        <p class="text-slate-400">📭 No work sessions logged for this date</p>
        {#if dayKey === formatDateKey(new Date())}
          <p class="mt-2 text-sm text-slate-500">Clock in to start tracking your work time!</p>
        {/if}
      </div>
    {:else}
      <!-- Sessions List -->
      <div class="space-y-3">
        {#each sessions as session, index}
          <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div class="flex items-start justify-between">
              <!-- Session Header -->
              <div class="flex items-center gap-3">
                <span class="text-lg">
                  {getStatusIcon(session.status)}
                </span>
                
                <div>
                  <div class="flex items-center gap-2">
                    <h5 class="font-semibold text-slate-100">Session #{sessions.length - index}</h5>
                    <span class="text-xs px-2 py-1 rounded-full bg-slate-700 {getStatusColor(session.status)}">
                      {session.status}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4 text-sm text-slate-400 mt-1">
                    <span>
                      🕐 {formatTimeHM(session.clockInTime)} - {formatTimeHM(session.clockOutTime)}
                    </span>
                    {#if session.totalMinutes}
                      <span>
                        ⏱️ {formatMinutesToDecimal(session.totalMinutes)} total
                      </span>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Work Time -->
              <div class="text-right">
                <p class="text-lg font-bold text-emerald-400">
                  {formatMinutesToDecimal(session.netMinutes || 0)}
                </p>
                <p class="text-xs text-slate-500">work time</p>
              </div>
            </div>

            <!-- Session Details -->
            <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div class="space-y-1">
                <p class="text-xs text-slate-400">Break Summary</p>
                <p class="text-slate-300">{formatBreakSummary(session)}</p>
              </div>
              
              <div class="space-y-1">
                <p class="text-xs text-slate-400">Duration</p>
                <p class="text-slate-300">
                  {session.totalMinutes ? formatMinutesToHours(session.totalMinutes) : 'Unknown'}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-xs text-slate-400">Net Work</p>
                <p class="text-emerald-400 font-semibold">
                  {session.netMinutes ? formatMinutesToHours(session.netMinutes) : 'Unknown'}
                </p>
              </div>
            </div>

            <!-- Break Details -->
            {#if session.breaks && session.breaks.length > 0}
              <details class="mt-3">
                <summary class="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                  View break details ({session.breaks.length} breaks)
                </summary>
                <div class="mt-2 space-y-2">
                  {#each session.breaks as breakPeriod, breakIndex}
                    <div class="rounded border border-slate-600 bg-slate-700/50 p-3 text-sm">
                      <div class="flex items-center justify-between">
                        <span class="text-slate-300">Break #{breakIndex + 1}</span>
                        <span class="text-amber-400 font-semibold">
                          {breakPeriod.durationMinutes || 0}m
                        </span>
                      </div>
                      <div class="text-xs text-slate-400 mt-1">
                        {formatTimeHM(breakPeriod.startTime)} - {formatTimeHM(breakPeriod.endTime)}
                      </div>
                    </div>
                  {/each}
                </div>
              </details>
            {/if}

            <!-- Notes -->
            {#if session.note}
              <div class="mt-3 rounded border border-slate-600 bg-slate-700/50 p-3">
                <p class="text-xs text-slate-400 mb-1">Notes</p>
                <p class="text-sm text-slate-300">{session.note}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</article>