<script lang="ts">
  import { onMount } from 'svelte'

  import { nowIso } from '../lib/repos/baseRepo'
  import { dealsRepo } from '../lib/repos/dealsRepo'
  import {
    dealsPipelineStore,
    type DealsPipelineState,
  } from '../lib/stores/dealsPipelineStore'
  import { toastError, toastInfo, toastSuccess } from '../lib/stores/toastStore'
  import type { DealRecord } from '../lib/types/entities'

  const STAGES = ['Lead', 'Qualified', 'In Progress', 'Delivered', 'Won', 'Lost'] as const
  type StageKey = (typeof STAGES)[number]

  type DealDraft = {
    clientId: string
    title: string
    stage: StageKey
    valueEstimate: string
    probability: string
    jobType: string
    tags: string
    jobId: string
  }

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const percentFormatter = new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  let loading = false
  let creating = false
  let savingEdit = false
  let pipelineState: DealsPipelineState = { deals: [], clients: [], jobs: [] }
  let editingDealId: string | null = null
  let stageUpdating: Record<string, boolean> = {}
  let linkingJob: Record<string, boolean> = {}
  let dragDealId: string | null = null
  let hoverStage: StageKey | null = null
  let seededCreateClient = false

  let createForm: DealDraft = {
    clientId: '',
    title: '',
    stage: 'Lead',
    valueEstimate: '',
    probability: '50',
    jobType: '',
    tags: '',
    jobId: '',
  }

  let editDraft: DealDraft = {
    clientId: '',
    title: '',
    stage: 'Lead',
    valueEstimate: '',
    probability: '0',
    jobType: '',
    tags: '',
    jobId: '',
  }

  type StageColumn = {
    stage: StageKey
    deals: DealRecord[]
    totalValue: number
    weightedValue: number
  }

  $: pipelineState = $dealsPipelineStore
  $: clientOptions = [...pipelineState.clients].sort((a, b) => a.name.localeCompare(b.name))
  $: jobOptions = [...pipelineState.jobs].sort((a, b) => a.title.localeCompare(b.title))
  $: clientLookup = new Map(pipelineState.clients.map((client) => [client.id, client.name]))
  $: jobLookup = new Map(pipelineState.jobs.map((job) => [job.id, job.title]))

  $: {
    if (!seededCreateClient && clientOptions.length) {
      createForm = { ...createForm, clientId: clientOptions[0].id }
      seededCreateClient = true
    }
  }

  $: stageColumns = buildStageColumns(pipelineState.deals)
  $: weightedPipeline = stageColumns.reduce((sum, column) => sum + column.weightedValue, 0)
  $: openPipeline = stageColumns
    .filter((column) => column.stage !== 'Won' && column.stage !== 'Lost')
    .reduce((sum, column) => sum + column.totalValue, 0)
  $: totalDeals = pipelineState.deals.length
  $: lastUpdatedIso = pipelineState.deals.reduce((latest, deal) => {
    const stamp = deal.updatedAt ?? ''
    if (!stamp) return latest
    if (!latest || stamp > latest) return stamp
    return latest
  }, '')

  onMount(async () => {
    loading = true
    try {
      await dealsPipelineStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Unable to load pipeline data. Please retry.')
    } finally {
      loading = false
    }
  })

  function coerceStage(value: string | null | undefined): StageKey {
    return STAGES.includes(value as StageKey) ? (value as StageKey) : 'Lead'
  }

  function normalizeProbability(probability: number | null | undefined) {
    if (probability === null || probability === undefined || Number.isNaN(probability)) return 0
    if (probability <= 0) return 0
    if (probability > 1 && probability <= 100) {
      return Math.min(Math.max(probability / 100, 0), 1)
    }
    return Math.min(Math.max(probability, 0), 1)
  }

  function probabilityInputValue(probability: number | null | undefined) {
    return String(Math.round(normalizeProbability(probability) * 100))
  }

  function parseProbabilityInput(value: string) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return Math.min(Math.max(numeric, 0), 100) / 100
  }

  function parseTags(value: string) {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  function buildStageColumns(deals: DealRecord[]): StageColumn[] {
    return STAGES.map((stage) => {
      const scoped = deals
        .filter((deal) => coerceStage(deal.stage) === stage)
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
      const totalValue = scoped.reduce((sum, deal) => sum + (deal.valueEstimate ?? 0), 0)
      const weightedValue = scoped.reduce(
        (sum, deal) => sum + (deal.valueEstimate ?? 0) * normalizeProbability(deal.probability),
        0,
      )
      return { stage, deals: scoped, totalValue, weightedValue }
    })
  }

  function formatCurrency(value: number) {
    return currencyFormatter.format(Math.round(value || 0))
  }

  function formatProbability(probability: number | null | undefined) {
    return percentFormatter.format(normalizeProbability(probability))
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return dateFormatter.format(parsed)
  }

  function resetCreateForm() {
    createForm = {
      clientId: clientOptions[0]?.id ?? '',
      title: '',
      stage: 'Lead',
      valueEstimate: '',
      probability: '50',
      jobType: '',
      tags: '',
      jobId: '',
    }
  }

  function beginEdit(deal: DealRecord) {
    editingDealId = deal.id
    editDraft = {
      clientId: deal.clientId,
      title: deal.title,
      stage: coerceStage(deal.stage),
      valueEstimate: deal.valueEstimate ? String(deal.valueEstimate) : '',
      probability: probabilityInputValue(deal.probability),
      jobType: deal.jobType ?? '',
      tags: (deal.tags ?? []).join(', '),
      jobId: deal.jobId ?? '',
    }
  }

  function cancelEdit() {
    editingDealId = null
    editDraft = {
      clientId: '',
      title: '',
      stage: 'Lead',
      valueEstimate: '',
      probability: '0',
      jobType: '',
      tags: '',
      jobId: '',
    }
  }

  async function handleCreate(event: Event) {
    event.preventDefault()
    if (!createForm.clientId) {
      toastError('Select a client for this deal.')
      return
    }
    const title = createForm.title.trim()
    if (!title) {
      toastError('Deal title is required.')
      return
    }

    const valueEstimate = Number(createForm.valueEstimate)
    const probability = parseProbabilityInput(createForm.probability)
    creating = true
    try {
      await dealsRepo.create({
        clientId: createForm.clientId,
        title,
        stage: createForm.stage,
        valueEstimate: Number.isFinite(valueEstimate) ? valueEstimate : undefined,
        probability,
        jobType: createForm.jobType.trim() || undefined,
        tags: parseTags(createForm.tags),
        jobId: createForm.jobId || undefined,
        stageChangedAt: nowIso(),
      })
      await dealsPipelineStore.refresh()
      toastSuccess('Deal added to the pipeline.')
      resetCreateForm()
    } catch (error) {
      console.error(error)
      toastError('Unable to create the deal. Please retry.')
    } finally {
      creating = false
    }
  }

  async function handleEditSubmit(event: Event) {
    event.preventDefault()
    if (!editingDealId) return

    if (!editDraft.clientId) {
      toastError('Select a client for this deal.')
      return
    }

    const title = editDraft.title.trim()
    if (!title) {
      toastError('Deal title cannot be empty.')
      return
    }

    const valueEstimate = Number(editDraft.valueEstimate)
    const probability = parseProbabilityInput(editDraft.probability)
    const existing = pipelineState.deals.find((deal) => deal.id === editingDealId)
    const stageChanged = existing ? coerceStage(existing.stage) !== editDraft.stage : false

    savingEdit = true
    try {
      await dealsRepo.update(editingDealId, {
        clientId: editDraft.clientId,
        title,
        stage: editDraft.stage,
        valueEstimate: Number.isFinite(valueEstimate) ? valueEstimate : undefined,
        probability,
        jobType: editDraft.jobType.trim() || undefined,
        tags: parseTags(editDraft.tags),
        jobId: editDraft.jobId || undefined,
        stageChangedAt: stageChanged ? nowIso() : existing?.stageChangedAt,
      })
      await dealsPipelineStore.refresh()
      toastSuccess('Deal updated.')
      cancelEdit()
    } catch (error) {
      console.error(error)
      toastError('Unable to update the deal.')
    } finally {
      savingEdit = false
    }
  }

  function handleDragStart(event: DragEvent, dealId: string) {
    if (editingDealId === dealId) return
    dragDealId = dealId
    event.dataTransfer?.setData('text/plain', dealId)
    event.dataTransfer?.setDragImage(event.currentTarget as Element, 20, 20)
    event.dataTransfer?.setData('application/x-deal', dealId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragEnd() {
    dragDealId = null
    hoverStage = null
  }

  function handleDragEnter(stage: StageKey) {
    if (!dragDealId) return
    hoverStage = stage
  }

  function handleDragOver(event: DragEvent, stage: StageKey) {
    if (!dragDealId) return
    event.preventDefault()
    hoverStage = stage
  }

  async function handleDrop(event: DragEvent, stage: StageKey) {
    event.preventDefault()
    if (!dragDealId) return
    await moveDealToStage(dragDealId, stage)
    dragDealId = null
    hoverStage = null
  }

  async function moveDealToStage(dealId: string, stage: StageKey) {
    const deal = pipelineState.deals.find((entry) => entry.id === dealId)
    if (!deal || coerceStage(deal.stage) === stage) return

    stageUpdating = { ...stageUpdating, [dealId]: true }
    try {
      await dealsRepo.update(dealId, {
        stage,
        stageChangedAt: nowIso(),
      })
      await dealsPipelineStore.refresh()
      toastInfo(`Moved to ${stage}.`)
    } catch (error) {
      console.error(error)
      toastError('Unable to move the deal right now.')
    } finally {
      stageUpdating = { ...stageUpdating, [dealId]: false }
    }
  }

  async function handleJobLinkChange(deal: DealRecord, jobId: string) {
    if ((deal.jobId ?? '') === jobId) return
    linkingJob = { ...linkingJob, [deal.id]: true }
    try {
      await dealsRepo.update(deal.id, {
        jobId: jobId || undefined,
      })
      await dealsPipelineStore.refresh()
      toastSuccess(jobId ? 'Deal linked to job.' : 'Deal unlinked from job.')
    } catch (error) {
      console.error(error)
      toastError('Unable to update the job link.')
    } finally {
      linkingJob = { ...linkingJob, [deal.id]: false }
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Deals & Pipeline</h2>
    <p class="text-sm text-slate-400">
      Track every opportunity from first touch to close. Drag cards between stages to keep the forecast
      accurate and let weighted totals update automatically.
    </p>
  </header>

  <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <span class="text-xs uppercase tracking-wide text-slate-500">Weighted pipeline</span>
        <p class="mt-1 text-xl font-semibold text-slate-100">{formatCurrency(weightedPipeline)}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <span class="text-xs uppercase tracking-wide text-slate-500">Open pipeline</span>
        <p class="mt-1 text-xl font-semibold text-slate-100">{formatCurrency(openPipeline)}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <span class="text-xs uppercase tracking-wide text-slate-500">Active deals</span>
        <p class="mt-1 text-xl font-semibold text-slate-100">{totalDeals}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <span class="text-xs uppercase tracking-wide text-slate-500">Last refreshed</span>
        <p class="mt-1 text-xl font-semibold text-slate-100">{formatDate(lastUpdatedIso || undefined)}</p>
      </div>
    </div>
  </article>

  <form class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200" on:submit={handleCreate}>
    <h3 class="text-base font-semibold text-slate-100">New deal</h3>
    <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label class="flex flex-col gap-2">
        <span class="text-xs uppercase tracking-wide text-slate-500">Client</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={createForm.clientId}
          required
        >
          {#if clientOptions.length === 0}
            <option value="">No clients yet</option>
          {:else}
            {#each clientOptions as client}
              <option value={client.id}>{client.name}</option>
            {/each}
          {/if}
        </select>
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-xs uppercase tracking-wide text-slate-500">Title</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          placeholder="Brand refresh retainer"
          bind:value={createForm.title}
          required
        />
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-xs uppercase tracking-wide text-slate-500">Stage</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={createForm.stage}
        >
          {#each STAGES as stage}
            <option value={stage}>{stage}</option>
          {/each}
        </select>
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-xs uppercase tracking-wide text-slate-500">Value (est)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="number"
          min="0"
          step="100"
          bind:value={createForm.valueEstimate}
        />
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-xs uppercase tracking-wide text-slate-500">Win probability %</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          type="number"
          min="0"
          max="100"
          step="5"
          bind:value={createForm.probability}
        />
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-xs uppercase tracking-wide text-slate-500">Job type</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          placeholder="Retainer"
          bind:value={createForm.jobType}
        />
      </label>
      <label class="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
        <span class="text-xs uppercase tracking-wide text-slate-500">Tags (comma separated)</span>
        <input
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          placeholder="priority, q4"
          bind:value={createForm.tags}
        />
      </label>
      <label class="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
        <span class="text-xs uppercase tracking-wide text-slate-500">Linked job (optional)</span>
        <select
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          bind:value={createForm.jobId}
        >
          <option value="">No linked job</option>
          {#each jobOptions as job}
            <option value={job.id}>{job.title}</option>
          {/each}
        </select>
      </label>
    </div>
    <div class="mt-4 flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        disabled={creating}
      >
        {creating ? 'Saving…' : 'Add deal'}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        on:click={resetCreateForm}
        disabled={creating}
      >
        Clear
      </button>
    </div>
  </form>

  {#if loading}
    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
      Loading pipeline…
    </article>
  {:else}
    <div class="overflow-x-auto pb-4">
      <div class="flex min-w-[1120px] gap-4">
        {#each stageColumns as column}
          <div
            class={`flex w-72 flex-shrink-0 flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition ${
              hoverStage === column.stage ? 'border-brand-primary/70 ring-2 ring-brand-primary/30' : ''
            }`}
            role="list"
            aria-label={`Stage ${column.stage}`}
            on:dragenter={() => handleDragEnter(column.stage)}
            on:dragover={(event) => handleDragOver(event, column.stage)}
            on:drop={(event) => handleDrop(event, column.stage)}
          >
            <header class="flex items-start justify-between text-xs uppercase tracking-wide text-slate-400">
              <div>
                <p class="font-semibold text-slate-100">{column.stage}</p>
                <p>{column.deals.length} deals</p>
              </div>
              <div class="text-right">
                <p>{formatCurrency(column.totalValue)}</p>
                <p class="text-slate-500">{formatCurrency(column.weightedValue)}</p>
              </div>
            </header>

            {#if column.deals.length === 0}
              <p class="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-500">
                Drop deals here
              </p>
            {:else}
              <div class="space-y-3">
                {#each column.deals as deal}
                  <article
                    class={`rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-sm transition ${
                      stageUpdating[deal.id] ? 'opacity-70' : ''
                    }`}
                    draggable={editingDealId !== deal.id}
                    on:dragstart={(event) => handleDragStart(event, deal.id)}
                    on:dragend={handleDragEnd}
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-xs uppercase tracking-wide text-slate-500">
                          {clientLookup.get(deal.clientId) ?? 'Client removed'}
                        </p>
                        <h4 class="text-base font-semibold text-slate-100">{deal.title}</h4>
                      </div>
                      <div class="text-right text-xs text-slate-400">
                        <p>{formatCurrency(deal.valueEstimate ?? 0)}</p>
                        <p>{formatProbability(deal.probability)}</p>
                      </div>
                    </div>

                    <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                      {#if deal.jobType}
                        <span class="rounded-full border border-slate-700 px-2 py-0.5">{deal.jobType}</span>
                      {/if}
                      <span>Created {formatDate(deal.createdAt)}</span>
                      <span>Updated {formatDate(deal.updatedAt)}</span>
                      <span>Stage since {formatDate(deal.stageChangedAt ?? deal.updatedAt)}</span>
                    </div>

                    {#if deal.tags && deal.tags.length}
                      <div class="mt-2 flex flex-wrap gap-1">
                        {#each deal.tags as tag}
                          <span class="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{tag}</span>
                        {/each}
                      </div>
                    {/if}

                    <label class="mt-3 flex flex-col gap-2 text-xs text-slate-400">
                      <span>Linked job</span>
                      <select
                        class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                        value={deal.jobId ?? ''}
                        on:change={(event) =>
                          handleJobLinkChange(
                            deal,
                            (event.currentTarget as HTMLSelectElement).value,
                          )}
                        disabled={linkingJob[deal.id]}
                      >
                        <option value="">No linked job</option>
                        {#each jobOptions as job}
                          <option value={job.id}>{job.title}</option>
                        {/each}
                      </select>
                    </label>

                    <div class="mt-3 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-200 hover:bg-slate-800"
                        on:click={() => beginEdit(deal)}
                        disabled={editingDealId === deal.id}
                      >
                        Edit
                      </button>
                    </div>

                    {#if editingDealId === deal.id}
                      <form class="mt-4 space-y-3 border-t border-slate-800 pt-4" on:submit={handleEditSubmit}>
                        <div class="grid gap-3">
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Client</span>
                            <select
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              bind:value={editDraft.clientId}
                              required
                            >
                              {#each clientOptions as client}
                                <option value={client.id}>{client.name}</option>
                              {/each}
                            </select>
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Title</span>
                            <input
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              bind:value={editDraft.title}
                              required
                            />
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Stage</span>
                            <select
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              bind:value={editDraft.stage}
                            >
                              {#each STAGES as stage}
                                <option value={stage}>{stage}</option>
                              {/each}
                            </select>
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Value (est)</span>
                            <input
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              type="number"
                              min="0"
                              step="100"
                              bind:value={editDraft.valueEstimate}
                            />
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Win probability %</span>
                            <input
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              type="number"
                              min="0"
                              max="100"
                              step="5"
                              bind:value={editDraft.probability}
                            />
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Job type</span>
                            <input
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              bind:value={editDraft.jobType}
                            />
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Tags (comma separated)</span>
                            <input
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              bind:value={editDraft.tags}
                            />
                          </label>
                          <label class="flex flex-col gap-2 text-xs text-slate-400">
                            <span>Linked job</span>
                            <select
                              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                              bind:value={editDraft.jobId}
                            >
                              <option value="">No linked job</option>
                              {#each jobOptions as job}
                                <option value={job.id}>{job.title}</option>
                              {/each}
                            </select>
                          </label>
                        </div>
                        <div class="flex flex-wrap gap-2 text-xs">
                          <button
                            type="submit"
                            class="rounded-lg bg-brand-primary px-3 py-2 font-semibold text-slate-900 disabled:opacity-60"
                            disabled={savingEdit}
                          >
                            {savingEdit ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            class="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:bg-slate-800"
                            on:click={cancelEdit}
                            disabled={savingEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    {/if}
                  </article>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>
