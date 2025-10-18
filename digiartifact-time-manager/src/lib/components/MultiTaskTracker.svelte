<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { activeTasksRepo } from '../repos/activeTasksRepo'
  import { jobsTasksStore } from '../stores/jobsTasksStore'
  import { toastError, toastSuccess, toastInfo } from '../stores/toastStore'
  import { loadAllTimeLogs } from '../services/timeLogsService'
  import type { ActiveTaskRecord } from '../types/entities'
  import JobTaskSelector from './forms/JobTaskSelector.svelte'

  const MAX_TASKS = 4

  let runningTasks: ActiveTaskRecord[] = []
  let intervalId: number | null = null
  let loading = false

  // New task form
  let showNewTaskForm = false
  let newTaskJobId: string | null = null
  let newTaskTaskId: string | null = null
  let newTaskName = ''
  let newTaskBillable = true

  // Task completion modal
  let completingTask: ActiveTaskRecord | null = null
  let completionNote = ''
  let completionBillable = true

  function formatElapsedTime(startTime: string, elapsedMinutes: number, isRunning: boolean): string {
    const startMs = new Date(startTime).getTime()
    const baseMs = elapsedMinutes * 60000
    
    let totalSeconds: number
    if (isRunning) {
      const now = Date.now()
      totalSeconds = Math.floor((now - startMs + baseMs) / 1000)
    } else {
      totalSeconds = Math.floor(baseMs / 1000)
    }
    
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  function updateElapsedTimes() {
    // Trigger reactivity by reassigning the array
    runningTasks = [...runningTasks]
  }

  async function loadRunningTasks() {
    try {
      const tasks = await activeTasksRepo.getRunningTasks()
      runningTasks = tasks || []
    } catch (error) {
      console.error('Failed to load running tasks:', error)
    }
  }

  async function startNewTask() {
    if (!newTaskJobId) {
      toastError('Please select a job for the task.')
      return
    }

    if (!newTaskName.trim()) {
      toastError('Please enter a task name.')
      return
    }

    if (runningTasks.length >= MAX_TASKS) {
      toastError(`Maximum of ${MAX_TASKS} simultaneous tasks reached.`)
      return
    }

    loading = true
    try {
      const newTask: Partial<ActiveTaskRecord> = {
        jobId: newTaskJobId,
        taskId: newTaskTaskId ?? undefined,
        taskName: newTaskName.trim(),
        startTime: new Date().toISOString(),
        status: 'running',
        elapsedMinutes: 0,
        billable: newTaskBillable,
      }

      const created = await activeTasksRepo.create(newTask as any)
      runningTasks = [...runningTasks, created]

      // Reset form
      newTaskJobId = null
      newTaskTaskId = null
      newTaskName = ''
      newTaskBillable = true
      showNewTaskForm = false

      toastSuccess(`Started tracking: ${created.taskName}`)
    } catch (error) {
      console.error('Failed to start task:', error)
      toastError('Failed to start task. Please try again.')
    } finally {
      loading = false
    }
  }

  async function pauseTask(task: ActiveTaskRecord) {
    loading = true
    try {
      const now = Date.now()
      const startMs = new Date(task.startTime).getTime()
      const additionalMinutes = Math.floor((now - startMs) / 60000)

      await activeTasksRepo.update(task.id, {
        status: 'paused',
        elapsedMinutes: task.elapsedMinutes + additionalMinutes,
        startTime: new Date().toISOString(), // Reset start time for when it resumes
      })

      await loadRunningTasks()
      toastInfo(`Paused: ${task.taskName}`)
    } catch (error) {
      console.error('Failed to pause task:', error)
      toastError('Failed to pause task.')
    } finally {
      loading = false
    }
  }

  async function resumeTask(task: ActiveTaskRecord) {
    loading = true
    try {
      await activeTasksRepo.update(task.id, {
        status: 'running',
        startTime: new Date().toISOString(),
      })

      await loadRunningTasks()
      toastInfo(`Resumed: ${task.taskName}`)
    } catch (error) {
      console.error('Failed to resume task:', error)
      toastError('Failed to resume task.')
    } finally {
      loading = false
    }
  }

  function openCompletionModal(task: ActiveTaskRecord) {
    completingTask = task
    completionNote = ''
    completionBillable = task.billable ?? true
  }

  function closeCompletionModal() {
    completingTask = null
    completionNote = ''
    completionBillable = true
  }

  async function completeTask() {
    if (!completingTask) return

    loading = true
    try {
      const task = completingTask
      const now = Date.now()

      // Calculate total time
      let totalMinutes = task.elapsedMinutes
      if (task.status === 'running') {
        const startMs = new Date(task.startTime).getTime()
        totalMinutes += Math.floor((now - startMs) / 60000)
      }

      // Calculate start and end times
      const endedAt = new Date(now).toISOString()
      const startedAt = new Date(now - totalMinutes * 60000).toISOString()

      // Save to time logs
      const { createTimerLog } = await import('../services/timeLogsService')
      await createTimerLog({
        jobId: task.jobId,
        taskId: task.taskId,
        startedAt,
        endedAt,
        durationMinutes: totalMinutes,
        note: completionNote || undefined,
        billable: completionBillable,
      })

      // Reload time logs to update the store
      await loadAllTimeLogs()

      // Soft delete the task
      await activeTasksRepo.softDelete(task.id)

      runningTasks = runningTasks.filter((t) => t.id !== task.id)

      toastSuccess(`Completed: ${task.taskName} (${totalMinutes} min)`)

      // Check if there are other running tasks
      const stillRunning = runningTasks.filter((t) => t.status === 'running')
      if (stillRunning.length > 0) {
        const taskNames = stillRunning.map((t) => t.taskName).join(', ')
        toastInfo(`Reminder: ${stillRunning.length} task(s) still running: ${taskNames}`)
      }

      closeCompletionModal()
    } catch (error) {
      console.error('Failed to complete task:', error)
      toastError('Failed to complete task. Please try again.')
    } finally {
      loading = false
    }
  }

  async function deleteTask(task: ActiveTaskRecord) {
    if (!confirm(`Delete task "${task.taskName}"? This cannot be undone.`)) {
      return
    }

    loading = true
    try {
      await activeTasksRepo.softDelete(task.id)
      runningTasks = runningTasks.filter((t) => t.id !== task.id)
      toastSuccess(`Deleted: ${task.taskName}`)
    } catch (error) {
      console.error('Failed to delete task:', error)
      toastError('Failed to delete task.')
    } finally {
      loading = false
    }
  }

  onMount(async () => {
    await jobsTasksStore.ensure()
    await loadRunningTasks()

    // Update elapsed times every second
    intervalId = window.setInterval(updateElapsedTimes, 1000)
  })

  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })

  $: canAddTask = runningTasks.length < MAX_TASKS
</script>

<section class="space-y-4">
  <header class="flex items-center justify-between">
    <div>
      <h3 class="text-xl font-semibold text-slate-100">Active Tasks</h3>
      <p class="text-xs text-slate-400 mt-1">
        Track up to {MAX_TASKS} tasks simultaneously ({runningTasks.length}/{MAX_TASKS} active)
      </p>
    </div>
    {#if canAddTask}
      <button
        on:click={() => (showNewTaskForm = !showNewTaskForm)}
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
      >
        {showNewTaskForm ? 'Cancel' : '+ New Task'}
      </button>
    {:else}
      <span class="text-sm text-amber-400">Max tasks reached</span>
    {/if}
  </header>

  <!-- New Task Form -->
  {#if showNewTaskForm}
    <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
      <h4 class="text-sm font-semibold text-slate-200">Start New Task</h4>

      <JobTaskSelector
        bind:jobId={newTaskJobId}
        bind:taskId={newTaskTaskId}
      />

      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-300">
          Task Name
          <input
            type="text"
            bind:value={newTaskName}
            placeholder="e.g., Create homepage mockup"
            class="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-brand-primary focus:outline-none"
          />
        </label>
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" bind:checked={newTaskBillable} class="rounded" />
        Billable
      </label>

      <button
        on:click={startNewTask}
        disabled={loading}
        class="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Starting...' : 'Start Task'}
      </button>
    </div>
  {/if}

  <!-- Running Tasks -->
  {#if runningTasks.length === 0}
    <div class="rounded-xl border border-slate-700 bg-slate-800/30 p-8 text-center">
      <p class="text-slate-400">No active tasks. Click "+ New Task" to begin tracking.</p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2">
      {#each runningTasks as task (task.id)}
        {@const job = $jobsTasksStore.find((j) => j.id === task.jobId)}
        {@const taskDef = job?.tasks.find((t) => t.id === task.taskId)}
        <div class="rounded-xl border border-slate-700 bg-slate-800/70 p-4 space-y-3">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-slate-100">{task.taskName}</h4>
              <p class="text-xs text-slate-400 mt-1">
                {job?.title ?? 'Unknown Job'}
                {taskDef ? ` • ${taskDef.name}` : ''}
              </p>
            </div>
            {#if task.status === 'running'}
              <span class="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Running
              </span>
            {:else}
              <span class="text-xs font-medium text-amber-400">Paused</span>
            {/if}
          </div>

          <div class="text-center py-2">
            <p class="font-mono text-3xl font-bold text-slate-50">
              {formatElapsedTime(task.startTime, task.elapsedMinutes, task.status === 'running')}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              {task.billable ? 'Billable' : 'Non-billable'}
            </p>
          </div>

          <div class="flex gap-2">
            {#if task.status === 'running'}
              <button
                on:click={() => pauseTask(task)}
                disabled={loading}
                class="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                Pause
              </button>
            {:else}
              <button
                on:click={() => resumeTask(task)}
                disabled={loading}
                class="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Resume
              </button>
            {/if}
            <button
              on:click={() => openCompletionModal(task)}
              disabled={loading}
              class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Complete
            </button>
            <button
              on:click={() => deleteTask(task)}
              disabled={loading}
              class="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<!-- Task Completion Modal -->
{#if completingTask}
  {@const totalMins = completingTask.elapsedMinutes + (completingTask.status === 'running' ? Math.floor((Date.now() - new Date(completingTask.startTime).getTime()) / 60000) : 0)}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div class="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
      <header>
        <h3 class="text-lg font-semibold text-slate-100">Complete Task</h3>
        <p class="text-sm text-slate-400 mt-1">{completingTask.taskName}</p>
      </header>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-slate-300">
          Notes (optional)
          <textarea
            bind:value={completionNote}
            rows="3"
            placeholder="Add any notes about this task..."
            class="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-brand-primary focus:outline-none"
          ></textarea>
        </label>

        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" bind:checked={completionBillable} class="rounded" />
          Billable
        </label>

        <div class="text-sm text-slate-300">
          <p>
            Total Time: <span class="font-semibold">{totalMins} minutes</span>
          </p>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          on:click={closeCompletionModal}
          disabled={loading}
          class="flex-1 rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={completeTask}
          disabled={loading}
          class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Completing...' : 'Complete & Save'}
        </button>
      </div>
    </div>
  </div>
{/if}
