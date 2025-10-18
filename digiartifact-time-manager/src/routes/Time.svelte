<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import JobTaskSelector from '../lib/components/forms/JobTaskSelector.svelte'
  import {
    createManualLog,
    createTimerLog,
    deleteTimeLog,
    loadAllTimeLogs,
    updateTimeLogNote,
  } from '../lib/services/timeLogsService'
  import { jobsTasksStore } from '../lib/stores/jobsTasksStore'
  import { timeLogsStore } from '../lib/stores/timeLogsStore'
  import { toastError, toastInfo, toastSuccess } from '../lib/stores/toastStore'
  import type { TimeLogRecord } from '../lib/types/entities'
  import { combineDateAndTime, diffMinutes, formatDurationMs } from '../lib/utils/time'

  const ROW_HEIGHT = 120
  const BUFFER_ROWS = 6

  let timerJobId: string | null = null
  let timerTaskId: string | null = null
  let timerNote = ''
  let timerBillable = true
  let timerRunning = false
  let timerPaused = false
  let startedAtIso: string | null = null
  let accumulatedMs = 0
  let elapsedMs = 0
  let startPerf = 0
  let rafHandle: number | null = null

  let manualJobId: string | null = null
  let manualTaskId: string | null = null
  let manualDate = new Date().toISOString().slice(0, 10)
  let manualStart = '09:00'
  let manualEnd = '10:00'
  let manualNote = ''
  let manualBillable = true
  let manualError: string | null = null

  let filterJobId: string | null = null
  let filterTaskId: string | null = null
  let filterFrom = ''
  let filterTo = ''

  let loadingTimerSave = false
  let loadingManualSave = false
  let loadingLogs = false

  let listScrollTop = 0
  let listHeight = 520

  let editingNoteId: string | null = null
  let noteDraft = ''

  const visibilityHandler = () => {
    syncElapsed()
  }

  onMount(async () => {
    document.addEventListener('visibilitychange', visibilityHandler)
    loadingLogs = true
    try {
      await Promise.all([jobsTasksStore.ensure(), loadAllTimeLogs()])
    } catch (error) {
      console.error(error)
      toastError('Unable to load time logs. Please retry.')
    } finally {
      loadingLogs = false
    }
  })

  onDestroy(() => {
    document.removeEventListener('visibilitychange', visibilityHandler)
    cancelAnimation()
  })

  function cancelAnimation() {
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
  }

  function tick() {
    if (!timerRunning || timerPaused) return
    elapsedMs = accumulatedMs + (performance.now() - startPerf)
    rafHandle = requestAnimationFrame(tick)
  }

  function syncElapsed() {
    if (!timerRunning || timerPaused) return
    elapsedMs = accumulatedMs + (performance.now() - startPerf)
  }

  function resetTimerState() {
    cancelAnimation()
    timerRunning = false
    timerPaused = false
    startedAtIso = null
    accumulatedMs = 0
    elapsedMs = 0
    startPerf = 0
    timerNote = ''
    timerBillable = true
  }

  function startTimer() {
    if (!timerJobId) {
      toastError('Select a job before starting the timer.')
      return
    }
    if (timerRunning && !timerPaused) {
      toastInfo('Timer already running.')
      return
    }

    const now = new Date()
    startedAtIso = startedAtIso ?? now.toISOString()
    startPerf = performance.now()
    timerRunning = true
    timerPaused = false
    elapsedMs = accumulatedMs
    rafHandle = requestAnimationFrame(tick)
  }

  function pauseTimer() {
    if (!timerRunning || timerPaused) return
    accumulatedMs += performance.now() - startPerf
    timerPaused = true
    syncElapsed()
    cancelAnimation()
  }

  function resumeTimer() {
    if (!timerRunning || !timerPaused) return
    startPerf = performance.now()
    timerPaused = false
    rafHandle = requestAnimationFrame(tick)
  }

  async function stopTimer() {
    if (!timerRunning) return
    pauseTimer()

    if (!startedAtIso) {
      resetTimerState()
      return
    }

    const totalMs = accumulatedMs
    const durationMinutes = Math.max(1, Math.round(totalMs / 60000))
    const endIso = new Date().toISOString()

    loadingTimerSave = true
    try {
      await createTimerLog({
        jobId: timerJobId!,
        taskId: timerTaskId,
        startedAt: startedAtIso,
        endedAt: endIso,
        durationMinutes,
        note: timerNote,
        billable: timerBillable,
      })
      toastSuccess('Time log saved.')
      resetTimerState()
      timerTaskId = null
    } catch (error) {
      console.error(error)
      const message = (error as Error).message === 'OVERLAP'
        ? 'Timer overlaps with an existing entry. Adjust and retry.'
        : 'Unable to save the time log. Please try again.'
      toastError(message)
    } finally {
      loadingTimerSave = false
    }
  }

  function handleTimerReset() {
    resetTimerState()
  }

  function computeManualDurationMinutes() {
    if (!manualDate || !manualStart || !manualEnd) return 0
    try {
      const start = combineDateAndTime(manualDate, manualStart)
      const end = combineDateAndTime(manualDate, manualEnd)
      return diffMinutes(start, end)
    } catch (error) {
      console.warn('Manual duration error', error)
      return 0
    }
  }

  $: manualDurationMinutes = computeManualDurationMinutes()

  async function handleManualSubmit(event: Event) {
    event.preventDefault()
    manualError = null

    if (!manualJobId) {
      manualError = 'Job is required.'
      return
    }

    let start: Date
    let end: Date
    try {
      start = combineDateAndTime(manualDate, manualStart)
      end = combineDateAndTime(manualDate, manualEnd)
    } catch (error) {
      manualError = 'Provide a valid date and time range.'
      return
    }

    if (end <= start) {
      manualError = 'End time must be after start time.'
      return
    }

    if (manualDurationMinutes <= 0) {
      manualError = 'Duration must be at least one minute.'
      return
    }

    loadingManualSave = true
    try {
      await createManualLog({
        jobId: manualJobId,
        taskId: manualTaskId,
        start,
        end,
        note: manualNote,
        billable: manualBillable,
      })
      toastSuccess('Manual time log saved.')
      manualNote = ''
      manualBillable = true
    } catch (error) {
      console.error(error)
      const code = (error as Error).message
      if (code === 'OVERLAP') {
        manualError = 'This entry overlaps with existing time. Adjust the range.'
      } else if (code === 'INVALID_RANGE') {
        manualError = 'Provide a valid date and time range.'
      } else {
        manualError = 'Could not save the entry. Please try again.'
      }
      toastError(manualError)
    } finally {
      loadingManualSave = false
    }
  }

  function handleListScroll(event: Event) {
    const target = event.currentTarget as HTMLElement
    listScrollTop = target.scrollTop
    listHeight = target.clientHeight
  }

  $: jobLookup = new Map($jobsTasksStore.map((job) => [job.id, job]))
  $: taskLookup = new Map(
    $jobsTasksStore.map((job) => [job.id, new Map(job.tasks.map((task) => [task.id, task]))]),
  )

  function jobTitle(jobId: string) {
    return jobLookup.get(jobId)?.title ?? `Job ${jobId}`
  }

  function taskName(jobId: string, taskId: string | null | undefined) {
    if (!taskId) return '—'
    return taskLookup.get(jobId)?.get(taskId)?.name ?? `Task ${taskId}`
  }

  function matchesFilters(log: TimeLogRecord) {
    if (filterJobId && log.jobId !== filterJobId) return false
    if (filterTaskId && log.taskId !== filterTaskId) return false

    const logDate = log.startDT.slice(0, 10)
    if (filterFrom && logDate < filterFrom) return false
    if (filterTo && logDate > filterTo) return false
    return true
  }

  $: filteredLogs = $timeLogsStore.filter((log) => matchesFilters(log))
  $: totalRows = filteredLogs.length
  $: startIndex = Math.max(0, Math.floor(listScrollTop / ROW_HEIGHT) - BUFFER_ROWS)
  $: endIndex = Math.min(
    totalRows,
    startIndex + Math.ceil(listHeight / ROW_HEIGHT) + BUFFER_ROWS * 2,
  )
  $: visibleLogs = filteredLogs.slice(startIndex, endIndex)
  $: topSpacerHeight = startIndex * ROW_HEIGHT
  $: bottomSpacerHeight = (totalRows - endIndex) * ROW_HEIGHT

  function beginNoteEdit(log: TimeLogRecord) {
    editingNoteId = log.id
    noteDraft = log.note ?? ''
  }

  function cancelNoteEdit() {
    editingNoteId = null
    noteDraft = ''
  }

  async function saveNoteEdit(id: string) {
    try {
      await updateTimeLogNote(id, noteDraft)
      toastSuccess('Note updated.')
      cancelNoteEdit()
    } catch (error) {
      console.error(error)
      toastError('Unable to update note. Please retry.')
    }
  }

  async function removeLog(log: TimeLogRecord) {
    const confirmed = window.confirm('Delete this time entry?')
    if (!confirmed) return

    try {
      await deleteTimeLog(log.id)
      toastInfo('Time entry removed.')
    } catch (error) {
      console.error(error)
      toastError('Failed to delete time entry.')
    }
  }

  $: filterTasks = filterJobId ? jobLookup.get(filterJobId)?.tasks ?? [] : []
  $: if (!filterJobId && filterTaskId) {
    filterTaskId = null
  }

  const displayedDuration = () => formatDurationMs(elapsedMs)
</script>

<section class="space-y-8">
  <header class="space-y-2">
    <h2 class="text-2xl font-semibold text-brand-primary">Time Tracking</h2>
    <p class="text-sm text-slate-400">
      Run a precise timer backed by <code>performance.now()</code>, add manual entries with overlap
      guards, and manage historical logs without leaving the offline shell.
    </p>
  </header>

  <div class="grid gap-6 lg:grid-cols-2">
    <article class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
      <header class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-100">Live Timer</h3>
        <span class="font-mono text-3xl text-slate-50">{displayedDuration()}</span>
      </header>

      <JobTaskSelector
        bind:jobId={timerJobId}
        bind:taskId={timerTaskId}
        helperText="Jobs marked inactive stay hidden here to keep selections lean."
        disabled={timerRunning}
      />

      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Notes (optional)</span>
        <textarea
          class="min-h-[90px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          bind:value={timerNote}
          placeholder="Where did this session focus?"
        ></textarea>
      </label>

      <label class="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" bind:checked={timerBillable} />
        Billable session
      </label>

      <div class="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          class="rounded-lg bg-brand-primary px-4 py-2 font-semibold text-slate-900 shadow disabled:opacity-60"
          on:click={startTimer}
          disabled={loadingTimerSave}
        >
          {timerRunning && timerPaused ? 'Resume' : 'Start'}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          on:click={timerPaused ? resumeTimer : pauseTimer}
          disabled={!timerRunning || loadingTimerSave}
        >
          {timerPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          class="rounded-lg border border-emerald-600 px-4 py-2 text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-60"
          on:click={stopTimer}
          disabled={!timerRunning || loadingTimerSave}
        >
          Stop &amp; save
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          on:click={handleTimerReset}
          disabled={loadingTimerSave}
        >
          Reset
        </button>
      </div>

      <dl class="grid gap-2 text-xs text-slate-400">
        <div class="flex items-center justify-between">
          <dt>Started</dt>
          <dd>{startedAtIso ?? '—'}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt>Status</dt>
          <dd>{timerRunning ? (timerPaused ? 'Paused' : 'Running') : 'Idle'}</dd>
        </div>
      </dl>
    </article>

    <article class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
      <header>
        <h3 class="text-lg font-semibold text-slate-100">Manual Entry</h3>
        <p class="text-xs text-slate-400">
          Enter historical sessions with overlap checks. Duration calculates automatically.
        </p>
      </header>

      <form class="space-y-4" on:submit={handleManualSubmit}>
        <div class="grid gap-3 md:grid-cols-2">
          <JobTaskSelector bind:jobId={manualJobId} bind:taskId={manualTaskId} jobLabel="Job" taskLabel="Task" helperText={manualJobId ? null : 'Pick a job to reveal its tasks.'} />

          <label class="flex flex-col gap-2 text-sm text-slate-200">
            <span class="font-semibold text-slate-100">Session date</span>
            <input
              type="date"
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              bind:value={manualDate}
              required
            />
          </label>

          <label class="flex flex-col gap-2 text-sm text-slate-200">
            <span class="font-semibold text-slate-100">Start time</span>
            <input
              type="time"
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              bind:value={manualStart}
              required
            />
          </label>

          <label class="flex flex-col gap-2 text-sm text-slate-200">
            <span class="font-semibold text-slate-100">End time</span>
            <input
              type="time"
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              bind:value={manualEnd}
              required
            />
          </label>
        </div>

        <label class="flex flex-col gap-2 text-sm text-slate-200">
          <span class="font-semibold text-slate-100" id="manual-note-label">Notes (optional)</span>
          <textarea
            class="min-h-[90px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            bind:value={manualNote}
            placeholder="What happened during this block?"
            aria-labelledby="manual-note-label"
          ></textarea>
        </label>

        <label class="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" bind:checked={manualBillable} aria-checked={manualBillable} aria-label="Billable session" />
          Billable session
        </label>

        <div class="flex items-center justify-between text-xs text-slate-300">
          <span>Duration: {manualDurationMinutes} minutes</span>
          <span class={manualError ? 'text-rose-400' : ''}>{manualError ?? ''}</span>
        </div>

        <button
          type="submit"
          class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow disabled:opacity-60"
          disabled={loadingManualSave}
        >
          {loadingManualSave ? 'Saving…' : 'Save manual entry'}
        </button>
      </form>
    </article>
  </div>

  <section class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-100">Time Log History</h3>
        <p class="text-xs text-slate-400">
          Filters apply instantly; the virtualized list keeps scroll silky even after months of
          offline capture.
        </p>
      </div>

      <div class="flex flex-wrap gap-3 text-xs text-slate-200">
        <label class="flex flex-col gap-1">
          <span class="font-semibold text-slate-300">Job filter</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            bind:value={filterJobId}
          >
            <option value="">All jobs</option>
            {#each $jobsTasksStore as job}
              <option value={job.id}>{job.title}</option>
            {/each}
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="font-semibold text-slate-300">Task filter</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            bind:value={filterTaskId}
            disabled={!filterJobId || !filterTasks.length}
          >
            <option value="">All tasks</option>
            {#each filterTasks as task}
              <option value={task.id}>{task.name}</option>
            {/each}
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="font-semibold text-slate-300">From</span>
          <input
            type="date"
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            bind:value={filterFrom}
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="font-semibold text-slate-300">To</span>
          <input
            type="date"
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            bind:value={filterTo}
          />
        </label>
      </div>
    </header>

    {#if loadingLogs}
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
        Loading logs…
      </div>
    {:else if !filteredLogs.length}
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
        No time entries match the current filters.
      </div>
    {:else}
      <div
        class="max-h-[480px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/30"
        on:scroll={handleListScroll}
        bind:clientHeight={listHeight}
      >
        <div style={`height: ${topSpacerHeight}px;`}></div>
        {#each visibleLogs as log (log.id)}
          <article
            class="mx-3 mb-3 rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200"
            style={`min-height: ${ROW_HEIGHT - 24}px;`}
          >
            <header class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-sm font-semibold text-slate-100">{jobTitle(log.jobId)}</p>
                <p class="text-xs text-slate-400">{taskName(log.jobId, log.taskId)}</p>
              </div>
              <div class="text-xs text-slate-400">
                <p>{new Date(log.startDT).toLocaleString()}</p>
                <p>{log.durationMinutes} minutes · {log.billable ? 'Billable' : 'Non-billable'}</p>
              </div>
            </header>

            <div class="mt-3 text-xs text-slate-300">
              {#if editingNoteId === log.id}
                <textarea
                  class="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  rows="3"
                  bind:value={noteDraft}
                ></textarea>
                <div class="mt-2 flex gap-2">
                  <button
                    type="button"
                    class="rounded-lg bg-brand-primary px-3 py-1 text-xs font-semibold text-slate-900"
                    on:click={() => saveNoteEdit(log.id)}
                  >
                    Save note
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    on:click={cancelNoteEdit}
                  >
                    Cancel
                  </button>
                </div>
              {:else}
                <p class={log.note ? '' : 'italic text-slate-500'}>
                  {log.note ?? 'No notes yet.'}
                </p>
                <div class="mt-2 flex gap-2 text-xs">
                  <button
                    type="button"
                    class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                    on:click={() => beginNoteEdit(log)}
                  >
                    Edit note
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-rose-700 px-3 py-1 text-rose-300 hover:bg-rose-900/50"
                    on:click={() => removeLog(log)}
                  >
                    Delete
                  </button>
                </div>
              {/if}
            </div>
          </article>
        {/each}
        <div style={`height: ${bottomSpacerHeight}px;`}></div>
      </div>
    {/if}
  </section>
</section>
