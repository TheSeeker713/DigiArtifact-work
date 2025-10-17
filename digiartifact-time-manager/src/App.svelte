<script lang="ts">
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'

  import { routes, type RouteKey } from './routes'

  let currentRoute: RouteKey = 'dashboard'
  let ActiveRoute: ComponentType | null = null
  let loading = false

  const navItems = Object.entries(routes) as [RouteKey, (typeof routes)[RouteKey]][]

  async function loadRoute(route: RouteKey) {
    loading = true
    const module = await routes[route].load()
    ActiveRoute = module.default
    currentRoute = route
    loading = false
  }

  function buttonClasses(route: RouteKey) {
    return [
      'rounded-lg border border-slate-800 px-4 py-2 text-sm font-medium transition-colors',
      currentRoute === route
        ? 'bg-brand-primary text-slate-900 shadow'
        : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800',
      loading && currentRoute === route ? 'cursor-wait opacity-70' : '',
    ].join(' ')
  }

  onMount(() => {
    loadRoute(currentRoute)
  })
</script>

<main class="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
  <header class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
    <h1 class="text-3xl font-semibold text-slate-100">DigiArtifact Time Manager</h1>
    <p class="mt-2 text-sm text-slate-400">
      Offline-first control center for the 60/20/20 production cadence on low-end hardware.
    </p>
    <nav class="mt-4 flex flex-wrap gap-2">
      {#each navItems as [key, meta]}
        <button class={buttonClasses(key)} on:click={() => loadRoute(key)} disabled={loading && currentRoute === key}>
          <span class="block text-left text-sm font-semibold text-slate-100">{meta.title}</span>
          <span class="block text-xs text-slate-300">{meta.description}</span>
        </button>
      {/each}
    </nav>
  </header>

  <section class="flex flex-1 flex-col gap-4">
    <article class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      {#if loading && !ActiveRoute}
        <p class="text-sm text-slate-300">Loading module…</p>
      {:else if ActiveRoute}
        <svelte:component this={ActiveRoute} />
      {:else}
        <p class="text-sm text-slate-300">Select a module to load its view.</p>
      {/if}
    </article>

    <aside class="rounded-xl border border-teal-800/60 bg-teal-900/30 p-6 text-sm text-teal-100">
      <h2 class="text-lg font-semibold text-teal-100">Offline-first guarantee</h2>
      <p class="mt-2">
        IndexedDB mirrors every record locally; GitHub release builds ship installers so creators can
        run the manager without connectivity or GPU resources.
      </p>
    </aside>
  </section>
</main>
