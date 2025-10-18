<script lang="ts">
  import { onMount } from 'svelte'

  import { jobsRepo } from '../lib/repos/jobsRepo'
  import { tasksRepo } from '../lib/repos/tasksRepo'
  import { jobsTasksStore } from '../lib/stores/jobsTasksStore'
  import { toastError, toastSuccess, toastInfo } from '../lib/stores/toastStore'
  import ProfitabilityWidget from '../lib/components/ProfitabilityWidget.svelte'
  import type { JobRecord, TaskRecord } from '../lib/types/entities'

  type JobDraft = { title: string; description: string }
  type TaskDraft = { jobId: string; name: string; description: string }

  let loading = false
  let creating = false
  let editingJobId: string | null = null
  let jobDraft: JobDraft = { title: '', description: '' }
  let creatingTask: Record<string, boolean> = {}
  let taskDrafts: Record<string, { name: string; description: string }> = {}
  let editingTaskId: string | null = null
  let taskEditDraft: TaskDraft = { jobId: '', name: '', description: '' }

  let createForm = {
    title: '',
    description: '',
    taskName: '',
    taskDescription: '',
  }

  onMount(() => {
    void loadData()
  })

  async function loadData() {
    loading = true
    try {
      await jobsTasksStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Unable to load jobs right now. Please retry.')
    } finally {
      loading = false
    }
  }

  function resetCreateForm() {
    createForm = {
      title: '',
      description: '',
      taskName: '',
      taskDescription: '',
    }
  }

  async function handleCreateJob(event: Event) {
    event.preventDefault()
    const title = createForm.title.trim()
    if (!title) {
      toastError('Job name is required.')
      return
    }

    creating = true
    try {
      const job = await jobsRepo.create({
        title,
        description: createForm.description.trim() || undefined,
        status: 'active',
      })

      if (createForm.taskName.trim()) {
        await tasksRepo.create({
          jobId: job.id,
          name: createForm.taskName.trim(),
          description: createForm.taskDescription.trim() || undefined,
        })
      }

      toastSuccess('Job created.')
      resetCreateForm()
      await jobsTasksStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Could not create the job. Please try again.')
    } finally {
      creating = false
    }
  }

  function beginJobEdit(job: JobRecord) {
    editingJobId = job.id
    jobDraft = {
      title: job.title,
      description: job.description ?? '',
    }
  }

  function cancelJobEdit() {
    editingJobId = null
    jobDraft = { title: '', description: '' }
  }

  async function saveJobEdit(job: JobRecord) {
    if (!editingJobId) return
    const title = jobDraft.title.trim()
    if (!title) {
      toastError('Job name cannot be empty.')
      return
    }

    try {
      await jobsRepo.update(job.id, {
        title,
        description: jobDraft.description.trim() || undefined,
      })
      toastSuccess('Job updated.')
      await jobsTasksStore.refresh()
      cancelJobEdit()
    } catch (error) {
      console.error(error)
      toastError('Updating the job failed.')
    }
  }

  async function toggleJobStatus(job: JobRecord) {
    const nextStatus = (job.status ?? 'active') === 'inactive' ? 'active' : 'inactive'
    try {
      await jobsRepo.update(job.id, { status: nextStatus })
      toastInfo(nextStatus === 'active' ? 'Job reactivated.' : 'Job set to inactive.')
      await jobsTasksStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Could not change job status.')
    }
  }

  async function deleteJob(job: JobRecord & { tasks: TaskRecord[] }) {
    const confirmed = window.confirm('Move this job to archive? Tasks remain until reset.')
    if (!confirmed) return

    try {
      await Promise.all(job.tasks.map((task) => tasksRepo.softDelete(task.id)))
      await jobsRepo.softDelete(job.id)
      toastInfo('Job archived.')
      await jobsTasksStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Archiving the job failed.')
    }
  }

  function getTaskDraft(jobId: string) {
    return taskDrafts[jobId] ?? { name: '', description: '' }
  }

  function updateTaskDraft(jobId: string, field: 'name' | 'description', value: string) {
    taskDrafts = {
      ...taskDrafts,
      [jobId]: {
        ...getTaskDraft(jobId),
        [field]: value,
      },
    }
  }

  async function handleCreateTask(jobId: string) {
    const draft = getTaskDraft(jobId)
    const name = draft.name.trim()
    if (!name) {
      toastError('Task name is required.')
      return
    }

    creatingTask = { ...creatingTask, [jobId]: true }
    try {
      await tasksRepo.create({
        jobId,
        name,
        description: draft.description.trim() || undefined,
      })
      toastSuccess('Task added.')
      taskDrafts = { ...taskDrafts, [jobId]: { name: '', description: '' } }
      await jobsTasksStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Could not add the task.')
    } finally {
      creatingTask = { ...creatingTask, [jobId]: false }
    }
  }

  function beginTaskEdit(task: TaskRecord, jobId: string) {
    editingTaskId = task.id
    taskEditDraft = {
      jobId,
      name: task.name,
      description: task.description ?? '',
    }
  }

  function cancelTaskEdit() {
    editingTaskId = null
    taskEditDraft = { jobId: '', name: '', description: '' }
  }

  async function saveTaskEdit() {
    if (!editingTaskId) return
    const name = taskEditDraft.name.trim()
    if (!name) {
      toastError('Task name cannot be empty.')
      return
    }

    try {
      await tasksRepo.update(editingTaskId, {
        name,
        description: taskEditDraft.description.trim() || undefined,
      })
      toastSuccess('Task updated.')
      await jobsTasksStore.refresh()
      cancelTaskEdit()
    } catch (error) {
      console.error(error)
      toastError('Could not update the task.')
    }
  }

  async function deleteTask(task: TaskRecord) {
    const confirmed = window.confirm('Delete this task?')
    if (!confirmed) return

    try {
      await tasksRepo.softDelete(task.id)
      toastInfo('Task removed.')
      await jobsTasksStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Could not delete the task.')
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Jobs & Tasks</h2>
    <p class="text-sm text-slate-400">
      Create engagements, attach tasks, and keep everything offline-first. Jobs stay editable, tasks
      remain nested, and every action records to the audit trail.
    </p>
  </header>

  <form class="rounded-xl border border-slate-800 bg-slate-900/60 p-6" on:submit={handleCreateJob}>
    <fieldset class="grid gap-4 md:grid-cols-2">
      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Job name</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          placeholder="Editing Sprint"
          bind:value={createForm.title}
          required
        />
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Job description (optional)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          placeholder="Deliver finished reels, prep thumbnails"
          bind:value={createForm.description}
        />
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">First task (optional)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          placeholder="Cut raw footage"
          bind:value={createForm.taskName}
        />
      </label>

      <label class="flex flex-col gap-2 text-sm text-slate-200">
        <span class="font-semibold text-slate-100">Task description (optional)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          placeholder="Select best takes, assemble A-roll"
          bind:value={createForm.taskDescription}
        />
      </label>
    </fieldset>

    <div class="mt-4 flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow disabled:opacity-60"
        disabled={creating}
      >
        {creating ? 'Saving…' : 'Create job'}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        on:click={resetCreateForm}
        disabled={creating}
      >
        Clear form
      </button>
    </div>
  </form>

  {#if loading}
    <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
      Loading jobs…
    </div>
  {:else if !$jobsTasksStore.length}
    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
      No jobs yet. Create your first job above to start organizing tasks.
    </div>
  {:else}
    <div class="space-y-4">
      {#each $jobsTasksStore as job}
        <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-200">
          <header class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="space-y-1">
              {#if editingJobId === job.id}
                <input
                  class="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  bind:value={jobDraft.title}
                  placeholder="Job name"
                  required
                />
                <textarea
                  class="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  rows="2"
                  bind:value={jobDraft.description}
                  placeholder="Describe the scope"
                ></textarea>
              {:else}
                <h3 class="text-lg font-semibold text-slate-100">{job.title}</h3>
                {#if job.description}
                  <p class="text-xs text-slate-400">{job.description}</p>
                {/if}
              {/if}
            </div>

            <div class="flex flex-wrap gap-2 text-xs">
              <span
                class={`self-center rounded-full border px-2 py-1 uppercase tracking-wide ${
                  (job.status ?? 'active') === 'inactive'
                    ? 'border-amber-500/60 text-amber-400'
                    : 'border-emerald-500/60 text-emerald-300'
                }`}
              >
                {(job.status ?? 'active') === 'inactive' ? 'Inactive' : 'Active'}
              </span>

              {#if editingJobId === job.id}
                <button
                  type="button"
                  class="rounded-lg bg-brand-primary px-3 py-1 font-semibold text-slate-900"
                  on:click={() => saveJobEdit(job)}
                >
                  Save
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                  on:click={cancelJobEdit}
                >
                  Cancel
                </button>
              {:else}
                <button
                  type="button"
                  class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                  on:click={() => beginJobEdit(job)}
                >
                  Edit
                </button>
              {/if}

              <button
                type="button"
                class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                on:click={() => toggleJobStatus(job)}
              >
                {(job.status ?? 'active') === 'inactive' ? 'Activate' : 'Deactivate'}
              </button>

              <button
                type="button"
                class="rounded-lg border border-rose-700 px-3 py-1 text-rose-300 hover:bg-rose-900/50"
                on:click={() => deleteJob(job)}
              >
                Archive
              </button>
            </div>
          </header>

          <section class="mt-4 space-y-3">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Tasks</h4>

            {#if job.tasks.length === 0}
              <p class="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                No tasks yet. Add one below to guide weekly execution.
              </p>
            {:else}
              <ul class="space-y-2">
                {#each job.tasks as task}
                  <li class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    {#if editingTaskId === task.id}
                      <input
                        class="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        bind:value={taskEditDraft.name}
                        placeholder="Task name"
                        required
                      />
                      <textarea
                        class="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        rows="2"
                        bind:value={taskEditDraft.description}
                        placeholder="Describe the task"
                      ></textarea>
                      <div class="mt-3 flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          class="rounded-lg bg-brand-primary px-3 py-1 font-semibold text-slate-900"
                          on:click={saveTaskEdit}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                          on:click={cancelTaskEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    {:else}
                      <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p class="font-semibold text-slate-100">{task.name}</p>
                          {#if task.description}
                            <p class="text-xs text-slate-400">{task.description}</p>
                          {/if}
                        </div>
                        <div class="flex gap-2 text-xs">
                          <button
                            type="button"
                            class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                            on:click={() => beginTaskEdit(task, job.id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            class="rounded-lg border border-rose-700 px-3 py-1 text-rose-300 hover:bg-rose-900/50"
                            on:click={() => deleteTask(task)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}

            <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <h5 class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Add task
              </h5>
              <div class="mt-2 grid gap-2 md:grid-cols-2">
                <input
                  class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Task name"
                  value={getTaskDraft(job.id).name}
                  on:input={(event) => updateTaskDraft(job.id, 'name', event.currentTarget.value)}
                />
                <input
                  class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Task description (optional)"
                  value={getTaskDraft(job.id).description}
                  on:input={(event) => updateTaskDraft(job.id, 'description', event.currentTarget.value)}
                />
              </div>
              <button
                type="button"
                class="mt-3 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-60"
                on:click={() => handleCreateTask(job.id)}
                disabled={creatingTask[job.id]}
              >
                {creatingTask[job.id] ? 'Adding…' : 'Add task'}
              </button>
            </div>
          </section>

          <section class="mt-4">
            <ProfitabilityWidget jobId={job.id} defaultRate={job.rate ?? 0} />
          </section>
        </article>
      {/each}
    </div>
  {/if}
</section>
