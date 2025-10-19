<script lang="ts">
  import { onMount } from 'svelte'
  import { workSessionStore } from '../stores/workSessionStore'
  import { timeLogsRepo } from '../repos/timeLogsRepo'
  import { debugControl } from '../utils/debug'
  import { toastStore } from '../stores/toastStore'
  import type { TimeLogRecord } from '../types/entities'

  // Reactive state subscriptions
  $: activeSession = $workSessionStore.activeSession
  $: timerState = {
    isClocked: !!activeSession,
    isOnBreak: activeSession?.status === 'on_break',
    clockInTime: activeSession?.clockInTime || null,
    breakStartTime: activeSession?.breaks && activeSession.breaks.length > 0 
      ? activeSession.breaks[activeSession.breaks.length - 1].startTime 
      : null,
    sessionId: activeSession?.id || null,
    status: activeSession?.status || null,
    totalMinutes: activeSession?.totalMinutes || 0,
    netMinutes: activeSession?.netMinutes || 0,
    breakCount: activeSession?.breaks?.length || 0,
  }

  // Data stores
  let recentTimeLogs: TimeLogRecord[] = []
  let weekTotals: { totalMinutes: number; totalSessions: number; perJobBreakdown: Record<string, number> } | null = null
  let loading = false
  let error: string | null = null
  let isPanelExpanded = true

  /**
   * Load recent TimeLogs (last 10 entries)
   */
  async function loadRecentTimeLogs() {
    try {
      const allLogs = await timeLogsRepo.list()
      // Sort by startDT descending, take last 10
      recentTimeLogs = allLogs
        .sort((a: TimeLogRecord, b: TimeLogRecord) => new Date(b.startDT).getTime() - new Date(a.startDT).getTime())
        .slice(0, 10)
    } catch (err) {
      console.error('[DiagnosticsPanel] Failed to load recent TimeLogs:', err)
      error = `Failed to load TimeLogs: ${err}`
    }
  }

  /**
   * Compute current week aggregates from TimeLogs
   */
  async function loadWeekAggregates() {
    try {
      // Get current week's Monday
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      monday.setHours(0, 0, 0, 0)
      
      // Get all logs for this week
      const allLogs = await timeLogsRepo.list()
      const weekLogs = allLogs.filter((log: TimeLogRecord) => {
        const logDate = new Date(log.startDT)
        return logDate >= monday
      })
      
      // Aggregate by job
      const perJobBreakdown: Record<string, number> = {}
      let totalMinutes = 0
      
      weekLogs.forEach((log: TimeLogRecord) => {
        totalMinutes += log.durationMinutes
        perJobBreakdown[log.jobId] = (perJobBreakdown[log.jobId] || 0) + log.durationMinutes
      })
      
      weekTotals = {
        totalMinutes,
        totalSessions: weekLogs.length,
        perJobBreakdown,
      }
    } catch (err) {
      console.error('[DiagnosticsPanel] Failed to load week aggregates:', err)
      error = `Failed to load week aggregates: ${err}`
    }
  }

  /**
   * Refresh all diagnostic data
   */
  async function refreshData() {
    loading = true
    error = null
    
    try {
      await Promise.all([
        loadRecentTimeLogs(),
        loadWeekAggregates()
      ])
    } finally {
      loading = false
    }
  }

  /**
   * Generate diagnostics bundle as JSON
   */
  function generateDiagnostics() {
    return {
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0', // TODO: Pull from package.json
      
      // Timer State
      timerState: {
        isClocked: timerState.isClocked,
        isOnBreak: timerState.isOnBreak,
        clockInTime: timerState.clockInTime,
        breakStartTime: timerState.breakStartTime,
        sessionId: timerState.sessionId,
        status: timerState.status,
        totalMinutes: timerState.totalMinutes,
        netMinutes: timerState.netMinutes,
        breakCount: timerState.breakCount,
        elapsedMs: timerState.isClocked && timerState.clockInTime
          ? Date.now() - new Date(timerState.clockInTime).getTime()
          : 0,
      },
      
      // Recent TimeLogs
      recentTimeLogs: recentTimeLogs.map(log => ({
        id: log.id,
        personId: log.personId,
        jobId: log.jobId,
        taskId: log.taskId,
        startDT: log.startDT,
        endDT: log.endDT,
        durationMinutes: log.durationMinutes,
        breakMs: log.breakMs,
        billable: log.billable,
        weekBucket: log.weekBucket,
      })),
      
      // Week Aggregates
      weekAggregates: weekTotals,
      
      // Debug Logs (last 20)
      debugLogs: debugControl.getLogs().slice(-20),
      
      // Browser Info
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        storageAvailable: typeof(Storage) !== 'undefined',
      }
    }
  }

  /**
   * Copy diagnostics to clipboard
   */
  async function copyDiagnosticsToClipboard() {
    try {
      const diagnostics = generateDiagnostics()
      const json = JSON.stringify(diagnostics, null, 2)
      
      await navigator.clipboard.writeText(json)
      
      toastStore.enqueue({
        message: '✅ Diagnostics copied to clipboard!',
        tone: 'success',
        duration: 3000,
      })
    } catch (err) {
      console.error('[DiagnosticsPanel] Failed to copy diagnostics:', err)
      toastStore.enqueue({
        message: '❌ Failed to copy diagnostics to clipboard',
        tone: 'error',
        duration: 5000,
      })
    }
  }

  /**
   * Toggle panel expansion
   */
  function togglePanel() {
    isPanelExpanded = !isPanelExpanded
  }

  // Load data on mount
  onMount(() => {
    refreshData()
  })

  // Format duration for display
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Format timestamp for display
  function formatTimestamp(isoString: string | null): string {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
</script>

<!-- Diagnostics Panel (Debug Mode Only) -->
<div class="diagnostics-panel border border-purple-500/30 rounded-lg bg-gray-900/50 backdrop-blur-sm overflow-hidden">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 bg-purple-600/10 border-b border-purple-500/30">
    <div class="flex items-center gap-3">
      <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-semibold text-purple-300">Diagnostics Panel</h3>
      <span class="px-2 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300 rounded">DEBUG MODE</span>
    </div>
    
    <div class="flex items-center gap-2">
      <button
        on:click={refreshData}
        disabled={loading}
        class="px-3 py-1 text-sm font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded transition-colors disabled:opacity-50"
        title="Refresh diagnostic data"
      >
        {#if loading}
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          ↻ Refresh
        {/if}
      </button>
      
      <button
        on:click={togglePanel}
        class="px-2 py-1 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded transition-colors"
        title={isPanelExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        {isPanelExpanded ? '▼' : '▶'}
      </button>
    </div>
  </div>

  {#if isPanelExpanded}
    <div class="p-4 space-y-6">
      {#if error}
        <div class="px-4 py-3 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
          ⚠️ {error}
        </div>
      {/if}

      <!-- Timer State -->
      <section>
        <h4 class="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timer State
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Status</div>
            <div class="text-sm font-mono">
              {#if timerState.isClocked}
                <span class="text-green-400">● Clocked In</span>
              {:else}
                <span class="text-gray-500">○ Clocked Out</span>
              {/if}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Break Status</div>
            <div class="text-sm font-mono">
              {#if timerState.isOnBreak}
                <span class="text-yellow-400">● On Break</span>
              {:else}
                <span class="text-gray-500">○ Working</span>
              {/if}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Clock In Time</div>
            <div class="text-sm font-mono text-gray-200">
              {formatTimestamp(timerState.clockInTime)}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Break Start</div>
            <div class="text-sm font-mono text-gray-200">
              {formatTimestamp(timerState.breakStartTime)}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Session ID</div>
            <div class="text-xs font-mono text-gray-300 truncate">
              {timerState.sessionId || 'N/A'}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Breaks Taken</div>
            <div class="text-sm font-mono text-gray-200">
              {timerState.breakCount}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Total Minutes</div>
            <div class="text-sm font-mono text-gray-200">
              {timerState.totalMinutes}
            </div>
          </div>
          
          <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
            <div class="text-xs text-gray-400 mb-1">Net Minutes</div>
            <div class="text-sm font-mono text-gray-200">
              {timerState.netMinutes}
            </div>
          </div>
        </div>
      </section>

      <!-- Recent TimeLogs -->
      <section>
        <h4 class="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Recent TimeLogs (Last 10)
        </h4>
        {#if recentTimeLogs.length === 0}
          <div class="px-4 py-3 bg-gray-800/30 rounded border border-gray-700/50 text-sm text-gray-400 text-center">
            No TimeLogs found
          </div>
        {:else}
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each recentTimeLogs as log}
              <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-mono text-gray-400 truncate mb-1">
                      ID: {log.id}
                    </div>
                    <div class="text-sm text-gray-200">
                      <span class="text-xs text-gray-400">Billable:</span>
                      <span class="font-mono ml-1">{log.billable ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      {formatTimestamp(log.startDT)} → {formatTimestamp(log.endDT)}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-purple-300">
                      {formatDuration(log.durationMinutes)}
                    </div>
                    {#if log.jobId}
                      <div class="text-xs text-gray-500 font-mono mt-1 truncate max-w-24">
                        {log.jobId}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Week Aggregates -->
      <section>
        <h4 class="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Current Week Aggregates
        </h4>
        {#if !weekTotals}
          <div class="px-4 py-3 bg-gray-800/30 rounded border border-gray-700/50 text-sm text-gray-400 text-center">
            No logs found for current week
          </div>
        {:else}
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
                <div class="text-xs text-gray-400 mb-1">Total Time</div>
                <div class="text-sm font-semibold text-purple-300">
                  {formatDuration(weekTotals.totalMinutes)}
                </div>
              </div>
              
              <div class="px-3 py-2 bg-gray-800/50 rounded border border-gray-700/50">
                <div class="text-xs text-gray-400 mb-1">Sessions</div>
                <div class="text-sm font-semibold text-purple-300">
                  {weekTotals.totalSessions}
                </div>
              </div>
            </div>
            
            {#if weekTotals.perJobBreakdown && Object.keys(weekTotals.perJobBreakdown).length > 0}
              <div>
                <div class="text-xs text-gray-400 mb-2">Per-Job Breakdown</div>
                <div class="space-y-1">
                  {#each Object.entries(weekTotals.perJobBreakdown) as [jobId, minutes]}
                    <div class="flex items-center justify-between px-3 py-1.5 bg-gray-800/30 rounded text-sm">
                      <span class="font-mono text-gray-300 text-xs truncate flex-1">{jobId}</span>
                      <span class="font-semibold text-purple-300 ml-3">{formatDuration(Number(minutes))}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Copy Diagnostics Button -->
      <section class="pt-4 border-t border-purple-500/30">
        <button
          on:click={copyDiagnosticsToClipboard}
          class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy Diagnostics to Clipboard
        </button>
        <div class="text-xs text-gray-400 text-center mt-2">
          Copies timer state, logs, and aggregates as JSON for issue reporting
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .diagnostics-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
  
  /* Custom scrollbar for TimeLogs */
  .diagnostics-panel ::-webkit-scrollbar {
    width: 6px;
  }
  
  .diagnostics-panel ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  .diagnostics-panel ::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 3px;
  }
  
  .diagnostics-panel ::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.5);
  }
</style>
