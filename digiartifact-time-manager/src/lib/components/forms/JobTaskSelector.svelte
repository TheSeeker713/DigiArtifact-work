<script lang="ts">
  import { onMount } from 'svelte'

  import { jobsTasksStore } from '../../stores/jobsTasksStore'

  export let jobId: string | null = null
  export let taskId: string | null = null
  export let includeInactive = false
  export let jobLabel = 'Job'
  export let taskLabel = 'Task'
  export let jobRequired = false
  export let taskRequired = false
  export let disabled = false
  export let allowTaskSelection = true
  export let jobPlaceholder = 'Select job'
  export let taskPlaceholder = 'Select task'
  export let helperText: string | null = null

  let loading = false

  onMount(async () => {
    loading = true
    try {
      await jobsTasksStore.ensure()
    } finally {
      loading = false
    }
  })

  $: jobOptions = includeInactive
    ? $jobsTasksStore
    : $jobsTasksStore.filter((job) => (job.status ?? 'active') !== 'inactive')

  $: if (jobId && !jobOptions.some((job) => job.id === jobId)) {
    jobId = null
  }

  $: currentJob = jobOptions.find((job) => job.id === jobId) ?? null
  $: taskOptions = currentJob ? currentJob.tasks : []

  $: if (taskId && (!currentJob || !taskOptions.some((task) => task.id === taskId))) {
    taskId = null
  }
</script>

<div class="space-y-3">
  <label class="flex flex-col gap-1 text-sm text-slate-200">
    <span class="font-semibold text-slate-100">
      {jobLabel}
      {#if jobRequired}
        <span class="text-rose-400">*</span>
      {/if}
    </span>
    <select
      class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 disabled:opacity-60"
      value={jobId ?? ''}
      on:change={(event) => {
        const value = event.currentTarget.value
        jobId = value ? value : null
      }}
      disabled={disabled || loading || !jobOptions.length}
      required={jobRequired}
    >
      <option value="" disabled={jobRequired}>
        {#if loading}
          Loading jobs…
        {:else}
          {jobPlaceholder}
        {/if}
      </option>
      {#each jobOptions as job}
        <option value={job.id}>
          {job.title}
          {#if (job.status ?? 'active') === 'inactive'}
            (Inactive)
          {/if}
        </option>
      {/each}
    </select>
  </label>

  {#if helperText}
    <p class="text-xs text-slate-400">{helperText}</p>
  {/if}

  {#if allowTaskSelection}
    <label class="flex flex-col gap-1 text-sm text-slate-200">
      <span class="font-semibold text-slate-100">
        {taskLabel}
        {#if taskRequired}
          <span class="text-rose-400">*</span>
        {/if}
      </span>
      <select
        class="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 disabled:opacity-60"
        value={taskId ?? ''}
        on:change={(event) => {
          const value = event.currentTarget.value
          taskId = value ? value : null
        }}
        disabled={disabled || !currentJob || !taskOptions.length}
        required={taskRequired && !!currentJob}
      >
        <option value="" disabled={taskRequired && !!currentJob}>
          {#if !currentJob}
            Select a job first
          {:else if (!taskOptions.length)}
            No tasks yet
          {:else}
            {taskPlaceholder}
          {/if}
        </option>
        {#each taskOptions as task}
          <option value={task.id}>{task.name}</option>
        {/each}
      </select>
    </label>
  {/if}
</div>
