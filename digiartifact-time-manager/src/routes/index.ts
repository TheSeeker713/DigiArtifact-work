import type { SvelteComponent } from 'svelte'

export type RouteKey = 'dashboard' | 'reports' | 'settings'

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
  settings: {
    title: 'Settings',
    description: 'Tune the 60/20/20 targets, timezone, and cadence defaults.',
    load: () => import('./Settings.svelte'),
  },
}
