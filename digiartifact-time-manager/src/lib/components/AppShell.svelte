<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import ToastHost from './ToastHost.svelte'
  import type { NavSection } from './appShell.types'
  import type { RouteKey } from '../../routes'
  import type { SessionState } from '../stores/sessionStore'

  export let sections: NavSection[] = []
  export let currentRoute: RouteKey
  export let onNavigate: (key: RouteKey) => void = () => {}
  export let onToggleLowEnd: (value: boolean) => void = () => {}
  export let loading = false
  export let sessionState: SessionState = {
    lowEndMode: false,
    isLoading: false,
    lastSyncedAt: null,
    performanceMonitorEnabled: false,
  }

  const dispatch = createEventDispatcher()
  let mobileNavOpen = false

  $: activeMeta = sections.flatMap((section) => section.items).find((item) => item.key === currentRoute)

  function handleNavigate(key: RouteKey) {
    onNavigate(key)
    mobileNavOpen = false
    dispatch('navigate', { key })
  }

  function toggleMobileNav() {
    mobileNavOpen = !mobileNavOpen
  }

  function handleKeyClose(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      mobileNavOpen = false
    }
  }
</script>

<svelte:window on:keydown={handleKeyClose} />

<div class="relative flex min-h-screen bg-slate-950 text-slate-100">
  <aside
    class={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-800 bg-slate-900/95 backdrop-blur transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
      mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
    }`}
    aria-label="Primary navigation"
  >
    <div class="flex items-center justify-between px-4 py-4 md:hidden">
      <span class="text-lg font-semibold">DigiArtifact</span>
      <button
        class="rounded-lg border border-slate-700 px-3 py-1 text-sm"
        type="button"
        on:click={toggleMobileNav}
        aria-label="Close menu"
      >
        Close
      </button>
    </div>
    <div class="hidden px-4 py-6 md:block">
      <span class="text-lg font-semibold">DigiArtifact</span>
      <p class="mt-1 text-xs uppercase text-slate-500">Time Manager</p>
    </div>
  <nav class="flex flex-col gap-6 px-4 pb-10">
      {#each sections as section}
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{section.label}</p>
          <ul class="mt-2 space-y-1">
            {#each section.items as item}
              <li>
                <button
                  type="button"
                  class={`w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                    item.key === currentRoute
                      ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/60'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                  on:click={() => handleNavigate(item.key)}
                  aria-current={item.key === currentRoute ? 'page' : undefined}
                >
                  <span class="block text-sm font-semibold">{item.title}</span>
                  <span class="block text-xs text-slate-400">{item.description}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>
  </aside>

  <div class="flex flex-1 flex-col">
    <header class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur md:px-8">
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-slate-800 px-3 py-2 text-sm md:hidden"
          type="button"
          on:click={toggleMobileNav}
          aria-label="Open menu"
        >
          Menu
        </button>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">Current View</p>
          <h1 class="text-lg font-semibold text-slate-100">{activeMeta?.title ?? 'DigiArtifact'}</h1>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs text-slate-300">
        <button
          class={`rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
            sessionState.lowEndMode ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-slate-800'
          }`}
          type="button"
          aria-pressed={sessionState.lowEndMode}
          on:click={() => onToggleLowEnd(!sessionState.lowEndMode)}
        >
          Low-End {sessionState.lowEndMode ? 'On' : 'Off'}
        </button>
        {#if loading}
          <span class="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2">
            <span class="h-2 w-2 animate-pulse rounded-full bg-brand-primary"></span>
            Loading…
          </span>
        {/if}
        {#if sessionState.lastSyncedAt}
          <span class="rounded-lg border border-slate-700 px-3 py-2">
            Synced {new Date(sessionState.lastSyncedAt).toLocaleTimeString()}
          </span>
        {/if}
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
      <slot />
    </main>
  </div>

  <ToastHost />
</div>
