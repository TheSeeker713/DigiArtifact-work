<script lang="ts">
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'

  import AppShell from './lib/components/AppShell.svelte'
  import LiveStatusHeader from './lib/components/LiveStatusHeader.svelte'
  import PerformanceMonitor from './lib/components/PerformanceMonitor.svelte'
  import type { NavSection } from './lib/components/appShell.types'
  import { routes, findRouteByPath, type RouteKey } from './routes'
  import { sessionStore } from './lib/stores/sessionStore'
  import { toastError, toastInfo } from './lib/stores/toastStore'

  const defaultRoute: RouteKey = 'dashboard'

  const navSections: NavSection[] = [
    {
      label: 'Cadence Control',
      items: [
        {
          key: 'dashboard',
          title: routes.dashboard.title,
          description: routes.dashboard.description,
        },
        {
          key: 'time',
          title: routes.time.title,
          description: routes.time.description,
        },
        {
          key: 'jobs',
          title: routes.jobs.title,
          description: routes.jobs.description,
        },
      ],
    },
    {
      label: 'Relationships & Pipeline',
      items: [
        {
          key: 'clients',
          title: routes.clients.title,
          description: routes.clients.description,
        },
        {
          key: 'deals',
          title: routes.deals.title,
          description: routes.deals.description,
        },
        {
          key: 'forms-intake',
          title: routes['forms-intake'].title,
          description: routes['forms-intake'].description,
        },
      ],
    },
    {
      label: 'Revenue & Costs',
      items: [
        {
          key: 'products',
          title: routes.products.title,
          description: routes.products.description,
        },
        {
          key: 'invoices',
          title: routes.invoices.title,
          description: routes.invoices.description,
        },
        {
          key: 'payments',
          title: routes.payments.title,
          description: routes.payments.description,
        },
        {
          key: 'expenses',
          title: routes.expenses.title,
          description: routes.expenses.description,
        },
      ],
    },
    {
      label: 'Oversight & System',
      items: [
        {
          key: 'reports',
          title: routes.reports.title,
          description: routes.reports.description,
        },
        {
          key: 'help',
          title: routes.help.title,
          description: routes.help.description,
        },
        {
          key: 'settings',
          title: routes.settings.title,
          description: routes.settings.description,
        },
      ],
    },
  ]

  let currentRoute: RouteKey = defaultRoute
  let ActiveRoute: ComponentType | null = null
  let loading = false
  let loadToken = 0

  type LoadRouteOptions = {
    updateHistory?: boolean
    replace?: boolean
    force?: boolean
  }

  async function loadRoute(route: RouteKey, options: LoadRouteOptions = {}) {
    const { updateHistory = false, replace = false, force = false } = options

    if (!force && route === currentRoute && ActiveRoute) {
      if (updateHistory) {
        updateHistoryForRoute(route, replace)
      }
      return
    }

    const token = ++loadToken
    loading = true
    sessionStore.setLoading(true)

    try {
      const module = await routes[route].load()
      if (token !== loadToken) {
        return
      }

      ActiveRoute = module.default
      currentRoute = route

      if (updateHistory) {
        updateHistoryForRoute(route, replace)
      }
    } catch (error) {
      console.error('Failed to load route', error)
      if (token === loadToken) {
        ActiveRoute = null
        toastError('Failed to load view. Please try again.')
      }
    } finally {
      if (token === loadToken) {
        loading = false
        sessionStore.setLoading(false)
      }
    }
  }

  function updateHistoryForRoute(route: RouteKey, replace = false) {
    if (typeof window === 'undefined') {
      return
    }

    const path = routes[route].path
    const state = { route }

    if (replace) {
      window.history.replaceState(state, '', path)
    } else {
      window.history.pushState(state, '', path)
    }
  }

  function handleNavigate(route: RouteKey) {
    void loadRoute(route, { updateHistory: true })
  }

  function handleToggleLowEnd(enabled: boolean) {
    sessionStore.setLowEndMode(enabled)
    toastInfo(enabled ? 'Low-end mode enabled for constrained hardware.' : 'Low-end mode disabled.')
  }

  onMount(() => {
    if (typeof window === 'undefined') {
      return
    }

    const initialRoute = (window.history.state?.route as RouteKey | undefined) ?? findRouteByPath(window.location.pathname) ?? defaultRoute
    void loadRoute(initialRoute, { updateHistory: true, replace: true, force: true })

    const handlePopState = (event: PopStateEvent) => {
      const route = (event.state?.route as RouteKey | undefined) ?? findRouteByPath(window.location.pathname) ?? defaultRoute
      void loadRoute(route, { updateHistory: false, force: true })
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  })
</script>

<LiveStatusHeader />

<AppShell
  sections={navSections}
  {currentRoute}
  {loading}
  sessionState={$sessionStore}
  onNavigate={handleNavigate}
  onToggleLowEnd={handleToggleLowEnd}
>
  <div class="flex flex-col gap-6">
    {#if loading && !ActiveRoute}
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">Loading view…</section>
    {:else if ActiveRoute}
      <svelte:component this={ActiveRoute} />
    {:else}
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">Select a module to load its view.</section>
    {/if}

    <aside class="rounded-xl border border-teal-500/40 bg-teal-50/80 p-6 text-sm text-teal-900">
      <h2 class="text-lg font-semibold text-teal-800">Offline-first guarantee</h2>
      <p class="mt-2 text-teal-700">
        IndexedDB mirrors every record locally; GitHub release builds ship installers so creators can
        run the manager without connectivity or GPU resources.
      </p>
    </aside>
  </div>
</AppShell>

{#if $sessionStore.performanceMonitorEnabled}
  <PerformanceMonitor />
{/if}
