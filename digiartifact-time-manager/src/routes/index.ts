import type { SvelteComponent } from 'svelte'

export type RouteKey = 'dashboard' | 'reports'

type RouteComponent = new (...args: any[]) => SvelteComponent

type RouteLoader = () => Promise<{ default: RouteComponent }>

type RouteDefinition = {
  title: string
  description: string
  load: RouteLoader
}

export const routes: Record<RouteKey, RouteDefinition> = {
  dashboard: {
    title: 'Weekly Dashboard',
    description: 'Log time, watch 60/20/20 targets, and manage the offline-first workweek.',
    load: () => import('./Dashboard.svelte'),
  },
  reports: {
    title: 'Reports & Charts',
    description: 'Lazy-loaded analytics honoring the 40 KB gzipped chart bundle budget.',
    load: () => import('./Reports.svelte'),
  },
}
