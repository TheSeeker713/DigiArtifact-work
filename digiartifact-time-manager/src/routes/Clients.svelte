<script lang="ts">
  import { onMount } from 'svelte'

  import { activitiesRepo } from '../lib/repos/activitiesRepo'
  import { clientsRepo } from '../lib/repos/clientsRepo'
  import { contactsRepo } from '../lib/repos/contactsRepo'
  import {
    clientsStore,
    buildClientsCache,
    getClientSummaries,
    getClientDetail,
    type ClientsState,
    type ClientDetail,
    type ClientSummary,
  } from '../lib/stores/clientsStore'
  import { toastError, toastInfo, toastSuccess } from '../lib/stores/toastStore'
  import ProfitabilityWidget from '../lib/components/ProfitabilityWidget.svelte'
  import type { ActivityRecord, ClientRecord, ContactRecord } from '../lib/types/entities'

  const tabs = ['Contacts', 'Deals', 'Invoices', 'Payments', 'Activities', 'Notes'] as const
  type TabKey = (typeof tabs)[number]

  const activityTypes = ['call', 'email', 'meet', 'note'] as const
  type ActivityType = (typeof activityTypes)[number]

  const clientStatuses = ['active', 'prospect', 'inactive'] as const

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const percentFormatter = new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  let loading = false
  let searchTerm = ''
  let activeClientId: string | null = null
  let activeTab: TabKey = 'Contacts'

  let state: ClientsState = {
    clients: [],
    contacts: [],
    deals: [],
    invoices: [],
    payments: [],
    activities: [],
  }

  let clientCreateForm = {
    name: '',
    billingEmail: '',
    phone: '',
    website: '',
    status: 'active',
    tags: '',
  }
  let clientEditDraft = {
    name: '',
    billingEmail: '',
    phone: '',
    website: '',
    status: 'active',
    tags: '',
  }
  let editingClient = false
  let savingClient = false

  let contactDraft = {
    name: '',
    email: '',
    phone: '',
    title: '',
  }
  let editingContactId: string | null = null
  let savingContact = false
  let deletingContactId: string | null = null

  let activityDraft = {
    type: 'call' as ActivityType,
    date: todayIso(),
    summary: '',
    nextActionDate: '',
    contactId: '',
  }
  let editingActivityId: string | null = null
  let savingActivity = false
  let deletingActivityId: string | null = null

  let notesDraft = ''
  let savingNotes = false

  let lastClientId: string | null = null
  let selectedDetail: ClientDetail | null = null
  let contactLookup = new Map<string, string>()

  $: state = $clientsStore
  $: cache = buildClientsCache(state)
  $: summaries = getClientSummaries(state, cache)
  $: filteredSummaries = summaries
    .filter((entry) => matchesSearch(entry, searchTerm))
    .sort((a, b) => a.client.name.localeCompare(b.client.name))
  $: {
    if (!filteredSummaries.length) {
      if (activeClientId !== null) {
        activeClientId = null
      }
    } else if (!activeClientId || !filteredSummaries.some((entry) => entry.client.id === activeClientId)) {
      activeClientId = filteredSummaries[0].client.id
    }
  }
  $: selectedDetail = activeClientId ? getClientDetail(activeClientId, state, cache) : null
  $: if (selectedDetail && selectedDetail.client.id !== lastClientId) {
    lastClientId = selectedDetail.client.id
    activeTab = 'Contacts'
    editingClient = false
    clientEditDraft = toClientDraft(selectedDetail.client)
    notesDraft = selectedDetail.client.notes ?? ''
    resetContactDraft()
    resetActivityDraft()
    editingContactId = null
    editingActivityId = null
  } else if (!selectedDetail) {
    lastClientId = null
  }
  $: contactLookup = selectedDetail
    ? new Map(selectedDetail.contacts.map((contact) => [contact.id, contact.name]))
    : new Map()

  onMount(async () => {
    loading = true
    try {
      await clientsStore.refresh()
    } catch (error) {
      console.error(error)
      toastError('Unable to load clients. Please retry.')
    } finally {
      loading = false
    }
  })

  function todayIso() {
    return new Date().toISOString().slice(0, 10)
  }

  function matchesSearch(summary: ClientSummary, query: string) {
    const term = query.trim().toLowerCase()
    if (!term) return true
    const { client, outstanding, nextActionDate } = summary
    const haystack = [
      client.name,
      client.status ?? '',
      client.billingEmail ?? '',
      client.phone ?? '',
      client.website ?? '',
      ...(client.tags ?? []),
      nextActionDate ?? '',
      outstanding ? outstanding.toFixed(2) : '',
    ]
    return haystack.some((value) => value && value.toLowerCase().includes(term))
  }

  function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0)
  }

  function formatProbability(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    if (value > 1) {
      return `${Math.round(value)}%`
    }
    return percentFormatter.format(value)
  }

  function formatDate(value?: string | null) {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return dateFormatter.format(parsed)
  }

  function formatActivityLabel(type: string) {
    if (!type) return 'Activity'
    return type.slice(0, 1).toUpperCase() + type.slice(1)
  }

  function parseTags(value: string) {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  function toClientDraft(client: ClientRecord) {
    return {
      name: client.name,
      billingEmail: client.billingEmail ?? '',
      phone: client.phone ?? '',
      website: client.website ?? '',
      status: client.status ?? 'active',
      tags: (client.tags ?? []).join(', '),
    }
  }

  function resetClientCreateForm() {
    clientCreateForm = {
      name: '',
      billingEmail: '',
      phone: '',
      website: '',
      status: 'active',
      tags: '',
    }
  }

  function resetContactDraft() {
    contactDraft = {
      name: '',
      email: '',
      phone: '',
      title: '',
    }
  }

  function resetActivityDraft() {
    activityDraft = {
      type: 'call' as ActivityType,
      date: todayIso(),
      summary: '',
      nextActionDate: '',
      contactId: '',
    }
  }

  async function handleCreateClient(event: Event) {
    event.preventDefault()
    const name = clientCreateForm.name.trim()
    if (!name) {
      toastError('Client name is required.')
      return
    }
    if (clientCreateForm.billingEmail.trim() && !emailRegex.test(clientCreateForm.billingEmail.trim())) {
      toastError('Enter a valid billing email.')
      return
    }

    savingClient = true
    try {
      const record = await clientsRepo.create({
        name,
        billingEmail: clientCreateForm.billingEmail.trim() || undefined,
        phone: clientCreateForm.phone.trim() || undefined,
        website: clientCreateForm.website.trim() || undefined,
        status: clientCreateForm.status.trim() || undefined,
        tags: parseTags(clientCreateForm.tags),
      })
      await clientsStore.refresh()
      toastSuccess('Client created.')
      resetClientCreateForm()
      activeClientId = record.id
    } catch (error) {
      console.error(error)
      toastError('Unable to create the client. Please try again.')
    } finally {
      savingClient = false
    }
  }

  function beginClientEdit() {
    if (!selectedDetail) return
    editingClient = true
    clientEditDraft = toClientDraft(selectedDetail.client)
  }

  function cancelClientEdit() {
    if (!selectedDetail) return
    editingClient = false
    clientEditDraft = toClientDraft(selectedDetail.client)
  }

  async function handleClientSave(event: Event) {
    event.preventDefault()
    if (!selectedDetail) return
    const name = clientEditDraft.name.trim()
    if (!name) {
      toastError('Client name cannot be empty.')
      return
    }
    if (clientEditDraft.billingEmail.trim() && !emailRegex.test(clientEditDraft.billingEmail.trim())) {
      toastError('Enter a valid billing email.')
      return
    }

    savingClient = true
    try {
      await clientsRepo.update(selectedDetail.client.id, {
        name,
        billingEmail: clientEditDraft.billingEmail.trim() || undefined,
        phone: clientEditDraft.phone.trim() || undefined,
        website: clientEditDraft.website.trim() || undefined,
        status: clientEditDraft.status.trim() || undefined,
        tags: parseTags(clientEditDraft.tags),
      })
      await clientsStore.refresh()
      toastSuccess('Client details updated.')
      editingClient = false
    } catch (error) {
      console.error(error)
      toastError('Failed to update client details.')
    } finally {
      savingClient = false
    }
  }

  async function handleNotesSave(event: Event) {
    event.preventDefault()
    if (!selectedDetail) return
    savingNotes = true
    try {
      await clientsRepo.update(selectedDetail.client.id, {
        notes: notesDraft.trim() || undefined,
      })
      await clientsStore.refresh()
      toastSuccess('Notes saved.')
    } catch (error) {
      console.error(error)
      toastError('Unable to save notes.')
    } finally {
      savingNotes = false
    }
  }

  function beginContactEdit(contact: ContactRecord) {
    editingContactId = contact.id
    contactDraft = {
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      title: contact.title ?? '',
    }
  }

  function cancelContactEdit() {
    editingContactId = null
    resetContactDraft()
  }

  async function handleContactSubmit(event: Event) {
    event.preventDefault()
    if (!selectedDetail) return

    const name = contactDraft.name.trim()
    const email = contactDraft.email.trim()
    const phone = contactDraft.phone.trim()
    const title = contactDraft.title.trim()

    if (!name) {
      toastError('Contact name is required.')
      return
    }
    if (email && !emailRegex.test(email)) {
      toastError('Enter a valid contact email.')
      return
    }

    savingContact = true
    try {
      if (editingContactId) {
        await contactsRepo.update(editingContactId, {
          name,
          email: email || undefined,
          phone: phone || undefined,
          title: title || undefined,
        })
        toastSuccess('Contact updated.')
      } else {
        await contactsRepo.create({
          clientId: selectedDetail.client.id,
          name,
          email: email || undefined,
          phone: phone || undefined,
          title: title || undefined,
        })
        toastSuccess('Contact added.')
      }

      await clientsStore.refresh()
      cancelContactEdit()
    } catch (error) {
      console.error(error)
      toastError('Unable to save the contact.')
    } finally {
      savingContact = false
    }
  }

  async function deleteContact(contact: ContactRecord) {
    if (!window.confirm('Delete this contact?')) return
    deletingContactId = contact.id
    try {
      await contactsRepo.softDelete(contact.id)
      await clientsStore.refresh()
      toastInfo('Contact removed.')
      if (editingContactId === contact.id) {
        cancelContactEdit()
      }
    } catch (error) {
      console.error(error)
      toastError('Unable to delete the contact.')
    } finally {
      deletingContactId = null
    }
  }

  function beginActivityEdit(activity: ActivityRecord) {
    editingActivityId = activity.id
    activityDraft = {
      type: (activity.type as ActivityType) ?? 'call',
      date: activity.date.slice(0, 10),
      summary: activity.summary ?? '',
      nextActionDate: activity.nextActionDate ? activity.nextActionDate.slice(0, 10) : '',
      contactId: activity.contactId ?? '',
    }
  }

  function cancelActivityEdit() {
    editingActivityId = null
    resetActivityDraft()
  }

  async function handleActivitySubmit(event: Event) {
    event.preventDefault()
    if (!selectedDetail) return

    const summary = activityDraft.summary.trim()
    if (!summary) {
      toastError('Activity summary is required.')
      return
    }

    if (!activityDraft.date) {
      toastError('Activity date is required.')
      return
    }

    savingActivity = true
    try {
      if (editingActivityId) {
        await activitiesRepo.update(editingActivityId, {
          type: activityDraft.type,
          date: activityDraft.date,
          summary,
          nextActionDate: activityDraft.nextActionDate || undefined,
          contactId: activityDraft.contactId || undefined,
        })
        toastSuccess('Activity updated.')
      } else {
        await activitiesRepo.create({
          clientId: selectedDetail.client.id,
          type: activityDraft.type,
          date: activityDraft.date,
          summary,
          nextActionDate: activityDraft.nextActionDate || undefined,
          contactId: activityDraft.contactId || undefined,
        })
        toastSuccess('Activity logged.')
      }

      await clientsStore.refresh()
      cancelActivityEdit()
    } catch (error) {
      console.error(error)
      toastError('Unable to save the activity.')
    } finally {
      savingActivity = false
    }
  }

  async function deleteActivity(activity: ActivityRecord) {
    if (!window.confirm('Delete this activity?')) return
    deletingActivityId = activity.id
    try {
      await activitiesRepo.softDelete(activity.id)
      await clientsStore.refresh()
      toastInfo('Activity removed.')
      if (editingActivityId === activity.id) {
        cancelActivityEdit()
      }
    } catch (error) {
      console.error(error)
      toastError('Unable to delete the activity.')
    } finally {
      deletingActivityId = null
    }
  }
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Clients & Contacts</h2>
    <p class="text-sm text-slate-400">
      Track billing details, contacts, deals, invoices, and activity without breaking offline mode.
      Search clients, tag segments, and watch outstanding AR at a glance.
    </p>
  </header>

  <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
    <aside class="space-y-4">
      <form class="rounded-xl border border-slate-800 bg-slate-900/70 p-4" on:submit={handleCreateClient}>
        <h3 class="text-sm font-semibold text-slate-200">Add client</h3>
        <div class="mt-3 space-y-3 text-sm">
          <label class="flex flex-col gap-2">
            <span class="text-slate-300">Name</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Acme Studios"
              bind:value={clientCreateForm.name}
              required
            />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-slate-300">Billing email</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="accounts@acme.com"
              type="email"
              bind:value={clientCreateForm.billingEmail}
            />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-slate-300">Phone</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="+1 555 0101"
              bind:value={clientCreateForm.phone}
            />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-slate-300">Website</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="https://acme.studio"
              bind:value={clientCreateForm.website}
            />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-slate-300">Status</span>
            <select
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              bind:value={clientCreateForm.status}
            >
              {#each clientStatuses as status}
                <option value={status}>{status}</option>
              {/each}
            </select>
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-slate-300">Tags (comma separated)</span>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="retainer, video"
              bind:value={clientCreateForm.tags}
            />
          </label>
        </div>
        <div class="mt-4 flex gap-2">
          <button
            type="submit"
            class="flex-1 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
            disabled={savingClient}
          >
            {savingClient ? 'Saving…' : 'Create'}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            on:click={resetClientCreateForm}
            disabled={savingClient}
          >
            Clear
          </button>
        </div>
      </form>

      <div class="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Search</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            placeholder="Search by name, tag, or email"
            bind:value={searchTerm}
          />
        </label>
      </div>

      <div class="rounded-xl border border-slate-800 bg-slate-900/70">
        <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
          <span>Clients</span>
          <span>{$clientsStore.clients.length}</span>
        </header>
        {#if filteredSummaries.length === 0}
          <p class="px-4 py-5 text-sm text-slate-400">
            No clients match the search. Create one above to get started.
          </p>
        {:else}
          <ul class="divide-y divide-slate-800">
            {#each filteredSummaries as summary}
              <li>
                <button
                  type="button"
                  class={`w-full px-4 py-4 text-left text-sm transition hover:bg-slate-800/60 ${
                    summary.client.id === activeClientId
                      ? 'bg-slate-800/80 text-slate-100'
                      : 'text-slate-300'
                  }`}
                  on:click={() => (activeClientId = summary.client.id)}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <p class="font-semibold text-slate-100">{summary.client.name}</p>
                      <div class="flex flex-wrap gap-1 text-xs text-slate-400">
                        {#if summary.client.status}
                          <span class="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-wide">
                            {summary.client.status}
                          </span>
                        {/if}
                        {#each summary.client.tags ?? [] as tag}
                          <span class="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{tag}</span>
                        {/each}
                      </div>
                      <div class="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>{summary.contactCount} contacts</span>
                        {#if summary.nextActionDate}
                          <span>Next action: {formatDate(summary.nextActionDate)}</span>
                        {/if}
                      </div>
                    </div>
                    <span
                      class={`rounded-full px-3 py-1 text-xs font-semibold ${
                        summary.outstanding > 0
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {summary.outstanding > 0
                        ? `AR ${formatCurrency(summary.outstanding)}`
                        : 'Settled'}
                    </span>
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </aside>

    <div class="space-y-6">
      {#if loading}
        <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading clients…
        </article>
      {:else if !selectedDetail}
        <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Select a client to view contacts, deals, invoices, and activities.
        </article>
      {:else}
        <article class="space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
          <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-2">
              <h3 class="text-xl font-semibold text-slate-100">{selectedDetail.client.name}</h3>
              <div class="flex flex-wrap gap-2 text-xs text-slate-400">
                {#if selectedDetail.client.status}
                  <span class="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-wide">
                    {selectedDetail.client.status}
                  </span>
                {/if}
                {#each selectedDetail.client.tags ?? [] as tag}
                  <span class="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{tag}</span>
                {/each}
              </div>
              <div class="grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                <span>Outstanding: <strong class="text-slate-100">{formatCurrency(selectedDetail.outstanding)}</strong></span>
                <span>
                  Next action: <strong class="text-slate-100">{formatDate(selectedDetail.nextActionDate)}</strong>
                </span>
              </div>
            </div>
            <div class="flex flex-col items-start gap-2 text-xs text-slate-400">
              <span>Created {formatDate(selectedDetail.client.createdAt)}</span>
              <span>Updated {formatDate(selectedDetail.client.updatedAt)}</span>
            </div>
          </header>

          {#if editingClient}
            <form class="space-y-4" on:submit={handleClientSave}>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col gap-2 text-sm">
                  <span class="text-slate-300">Client name</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={clientEditDraft.name}
                    required
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm">
                  <span class="text-slate-300">Billing email</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="email"
                    bind:value={clientEditDraft.billingEmail}
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm">
                  <span class="text-slate-300">Phone</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={clientEditDraft.phone}
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm">
                  <span class="text-slate-300">Website</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={clientEditDraft.website}
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm">
                  <span class="text-slate-300">Status</span>
                  <select
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={clientEditDraft.status}
                  >
                    {#each clientStatuses as status}
                      <option value={status}>{status}</option>
                    {/each}
                  </select>
                </label>
                <label class="flex flex-col gap-2 text-sm">
                  <span class="text-slate-300">Tags (comma separated)</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={clientEditDraft.tags}
                  />
                </label>
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                  disabled={savingClient}
                >
                  {savingClient ? 'Saving…' : 'Save details'}
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                  on:click={cancelClientEdit}
                  disabled={savingClient}
                >
                  Cancel
                </button>
              </div>
            </form>
          {:else}
            <div class="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div class="space-y-1">
                <span class="text-xs uppercase tracking-wide text-slate-500">Billing email</span>
                <p>{selectedDetail.client.billingEmail ?? '—'}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs uppercase tracking-wide text-slate-500">Phone</span>
                <p>{selectedDetail.client.phone ?? '—'}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs uppercase tracking-wide text-slate-500">Website</span>
                <p>{selectedDetail.client.website ?? '—'}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs uppercase tracking-wide text-slate-500">Contacts</span>
                <p>{selectedDetail.contacts.length}</p>
              </div>
            </div>
            <button
              type="button"
              class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              on:click={beginClientEdit}
            >
              Edit details
            </button>
          {/if}
        </article>

        <ProfitabilityWidget clientId={selectedDetail.client.id} defaultRate={75} />

        <nav class="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
          {#each tabs as tab}
            <button
              type="button"
              class={`rounded-full border px-4 py-2 transition ${
                activeTab === tab
                  ? 'border-brand-primary bg-brand-primary text-slate-900'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              on:click={() => (activeTab = tab)}
            >
              {tab}
            </button>
          {/each}
        </nav>

        {#if activeTab === 'Contacts'}
          <section class="space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <form class="space-y-4" on:submit={handleContactSubmit}>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Contact name</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={contactDraft.name}
                    required
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Email</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="email"
                    bind:value={contactDraft.email}
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Phone</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={contactDraft.phone}
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Title</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={contactDraft.title}
                  />
                </label>
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                  disabled={savingContact}
                >
                  {savingContact
                    ? 'Saving…'
                    : editingContactId
                      ? 'Update contact'
                      : 'Add contact'}
                </button>
                {#if editingContactId}
                  <button
                    type="button"
                    class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                    on:click={cancelContactEdit}
                    disabled={savingContact}
                  >
                    Cancel
                  </button>
                {/if}
              </div>
            </form>

            {#if selectedDetail.contacts.length === 0}
              <p class="text-sm text-slate-400">No contacts yet. Add the first one above.</p>
            {:else}
              <div class="grid gap-3">
                {#each selectedDetail.contacts as contact}
                  <article class="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div class="space-y-1">
                        <h4 class="text-base font-semibold text-slate-100">{contact.name}</h4>
                        <div class="flex flex-wrap gap-3 text-xs text-slate-400">
                          {#if contact.title}
                            <span>{contact.title}</span>
                          {/if}
                          {#if contact.email}
                            <span>{contact.email}</span>
                          {/if}
                          {#if contact.phone}
                            <span>{contact.phone}</span>
                          {/if}
                        </div>
                      </div>
                      <div class="flex gap-2 text-xs">
                        <button
                          type="button"
                          class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                          on:click={() => beginContactEdit(contact)}
                          disabled={savingContact}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-rose-700 px-3 py-1 text-rose-300 hover:bg-rose-900/40 disabled:opacity-60"
                          on:click={() => deleteContact(contact)}
                          disabled={deletingContactId === contact.id}
                        >
                          {deletingContactId === contact.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </article>
                {/each}
              </div>
            {/if}
          </section>
        {:else if activeTab === 'Deals'}
          <section class="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
            {#if selectedDetail.deals.length === 0}
              <p class="text-slate-400">No deals linked to this client yet.</p>
            {:else}
              <div class="grid gap-3">
                {#each selectedDetail.deals as deal}
                  <article class="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 class="text-base font-semibold text-slate-100">{deal.title}</h4>
                        <p class="text-xs uppercase tracking-wide text-slate-400">Stage: {deal.stage ?? 'Unknown'}</p>
                      </div>
                      <div class="text-right text-xs text-slate-400">
                        <p>Value {formatCurrency(deal.valueEstimate ?? 0)}</p>
                        <p>Win probability {formatProbability(deal.probability)}</p>
                      </div>
                    </div>
                  </article>
                {/each}
              </div>
            {/if}
          </section>
        {:else if activeTab === 'Invoices'}
          <section class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
            {#if selectedDetail.invoices.length === 0}
              <p class="text-slate-400">No invoices found for this client.</p>
            {:else}
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-xs">
                  <thead class="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th class="px-3 py-2 font-semibold">Invoice</th>
                      <th class="px-3 py-2 font-semibold">Issued</th>
                      <th class="px-3 py-2 font-semibold">Due</th>
                      <th class="px-3 py-2 font-semibold">Status</th>
                      <th class="px-3 py-2 font-semibold text-right">Total</th>
                      <th class="px-3 py-2 font-semibold text-right">Paid</th>
                      <th class="px-3 py-2 font-semibold text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-200">
                    {#each selectedDetail.invoices as invoice}
                      <tr>
                        <td class="px-3 py-2">{invoice.id.slice(0, 8)}…</td>
                        <td class="px-3 py-2">{formatDate(invoice.issueDate)}</td>
                        <td class="px-3 py-2">{formatDate(invoice.dueDate)}</td>
                        <td class="px-3 py-2 capitalize">{invoice.status}</td>
                        <td class="px-3 py-2 text-right">{formatCurrency(invoice.total ?? 0)}</td>
                        <td class="px-3 py-2 text-right">{formatCurrency(invoice.paidTotal)}</td>
                        <td class="px-3 py-2 text-right">{formatCurrency(invoice.outstanding)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </section>
        {:else if activeTab === 'Payments'}
          <section class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
            {#if selectedDetail.payments.length === 0}
              <p class="text-slate-400">No payments recorded for this client.</p>
            {:else}
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-xs">
                  <thead class="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th class="px-3 py-2 font-semibold">Payment</th>
                      <th class="px-3 py-2 font-semibold">Received</th>
                      <th class="px-3 py-2 font-semibold">Method</th>
                      <th class="px-3 py-2 font-semibold">Reference</th>
                      <th class="px-3 py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-200">
                    {#each selectedDetail.payments as payment}
                      <tr>
                        <td class="px-3 py-2">{payment.id.slice(0, 8)}…</td>
                        <td class="px-3 py-2">{formatDate(payment.receivedDate)}</td>
                        <td class="px-3 py-2">{payment.method ?? '—'}</td>
                        <td class="px-3 py-2">{payment.reference ?? '—'}</td>
                        <td class="px-3 py-2 text-right">{formatCurrency(payment.amount ?? 0)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </section>
        {:else if activeTab === 'Activities'}
          <section class="space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <form class="space-y-4" on:submit={handleActivitySubmit}>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Type</span>
                  <select
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={activityDraft.type}
                  >
                    {#each activityTypes as type}
                      <option value={type}>{formatActivityLabel(type)}</option>
                    {/each}
                  </select>
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Date</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="date"
                    bind:value={activityDraft.date}
                    required
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Related contact</span>
                  <select
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    bind:value={activityDraft.contactId}
                  >
                    <option value="">None</option>
                    {#each selectedDetail.contacts as contact}
                      <option value={contact.id}>{contact.name}</option>
                    {/each}
                  </select>
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Next action date</span>
                  <input
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                    type="date"
                    bind:value={activityDraft.nextActionDate}
                  />
                </label>
              </div>
              <label class="flex flex-col gap-2 text-sm text-slate-300">
                <span>Summary</span>
                <textarea
                  class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                  rows={3}
                  bind:value={activityDraft.summary}
                  required
                ></textarea>
              </label>
              <div class="flex flex-wrap gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                  disabled={savingActivity}
                >
                  {savingActivity
                    ? 'Saving…'
                    : editingActivityId
                      ? 'Update activity'
                      : 'Log activity'}
                </button>
                {#if editingActivityId}
                  <button
                    type="button"
                    class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                    on:click={cancelActivityEdit}
                    disabled={savingActivity}
                  >
                    Cancel
                  </button>
                {/if}
              </div>
            </form>

            {#if selectedDetail.activities.length === 0}
              <p class="text-sm text-slate-400">No activities yet. Log one above to capture next steps.</p>
            {:else}
              <div class="space-y-3">
                {#each selectedDetail.activities as activity}
                  <article class="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="space-y-2">
                        <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                          <span class="rounded-full border border-slate-700 px-2 py-0.5">{formatActivityLabel(activity.type)}</span>
                          <span>{formatDate(activity.date)}</span>
                          {#if activity.contactId}
                            <span>With {contactLookup.get(activity.contactId) ?? 'Contact removed'}</span>
                          {/if}
                          {#if activity.nextActionDate}
                            <span>Next action {formatDate(activity.nextActionDate)}</span>
                          {/if}
                        </div>
                        <p>{activity.summary}</p>
                      </div>
                      <div class="flex gap-2 text-xs">
                        <button
                          type="button"
                          class="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
                          on:click={() => beginActivityEdit(activity)}
                          disabled={savingActivity}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-rose-700 px-3 py-1 text-rose-300 hover:bg-rose-900/40 disabled:opacity-60"
                          on:click={() => deleteActivity(activity)}
                          disabled={deletingActivityId === activity.id}
                        >
                          {deletingActivityId === activity.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </article>
                {/each}
              </div>
            {/if}
          </section>
        {:else if activeTab === 'Notes'}
          <section class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
            <form class="space-y-4" on:submit={handleNotesSave}>
              <label class="flex flex-col gap-2">
                <span class="text-slate-300">Internal notes</span>
                <textarea
                  class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                  rows={6}
                  bind:value={notesDraft}
                ></textarea>
              </label>
              <div class="flex gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving…' : 'Save notes'}
                </button>
              </div>
            </form>
          </section>
        {/if}
      {/if}
    </div>
  </div>
</section>
