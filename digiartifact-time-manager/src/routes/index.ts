import type { SvelteComponent } from 'svelte'

export type RouteKey =
  | 'dashboard'
  | 'time'
  | 'jobs'
  | 'clients'
  | 'deals'
  | 'invoices'
  | 'payments'
  | 'expenses'
  | 'products'
  | 'reports'
  | 'forms-intake'
  | 'settings'

export type RouteComponent = new (...args: any[]) => SvelteComponent

type RouteLoader = () => Promise<{ default: RouteComponent }>

export type RouteDefinition = {
  title: string
  description: string
  path: string
  load: RouteLoader
}

export const routes: Record<RouteKey, RouteDefinition> = {
  dashboard: {
    title: 'Weekly Dashboard',
    description: 'Log time, watch 60/20/20 targets, and manage the offline-first workweek.',
    path: '/dashboard',
    load: () => import('./Dashboard.svelte'),
  },
  time: {
    title: 'Time & Timers',
    description: 'Capture sessions, guard overlap, and respect offline persistence.',
    path: '/time',
    load: () => import('./Time.svelte'),
  },
  jobs: {
    title: 'Jobs & Tasks',
    description: 'Organize engagements, rates, and per-job targets.',
    path: '/jobs',
    load: () => import('./Jobs.svelte'),
  },
  clients: {
    title: 'Clients',
    description: 'Mini-CRM for contacts, activities, and billing addresses.',
    path: '/clients',
    load: () => import('./Clients.svelte'),
  },
  deals: {
    title: 'Deals & Pipeline',
    description: 'Track stages, values, and next actions for incoming work.',
    path: '/deals',
    load: () => import('./Deals.svelte'),
  },
  invoices: {
    title: 'Invoices',
    description: 'Draft, send, and monitor AR aging completely offline.',
    path: '/invoices',
    load: () => import('./Invoices.svelte'),
  },
  payments: {
    title: 'Payments',
    description: 'Reconcile payments and keep cashflow snapshots up to date.',
    path: '/payments',
    load: () => import('./Payments.svelte'),
  },
  expenses: {
    title: 'Expenses',
    description: 'Log vendor spend, categorize costs, and track profitability.',
    path: '/expenses',
    load: () => import('./Expenses.svelte'),
  },
  products: {
    title: 'Products & Sales',
    description: 'Manage SKUs and digital sales data for creator products.',
    path: '/products',
    load: () => import('./Products.svelte'),
  },
  reports: {
    title: 'Reports & Charts',
    description: 'Lazy-loaded analytics honoring the 40 KB gzipped chart bundle budget.',
    path: '/reports',
    load: () => import('./Reports.svelte'),
  },
  'forms-intake': {
    title: 'Intake Form',
    description: 'Configure public intake and auto-lead capture flows.',
    path: '/forms/intake',
    load: () => import('./FormsIntake.svelte'),
  },
  settings: {
    title: 'Settings',
    description: 'Tune the 60/20/20 targets, timezone, and cadence defaults.',
    path: '/settings',
    load: () => import('./Settings.svelte'),
  },
}

export const orderedRoutes: RouteKey[] = [
  'dashboard',
  'time',
  'jobs',
  'clients',
  'deals',
  'invoices',
  'payments',
  'expenses',
  'products',
  'reports',
  'forms-intake',
  'settings',
]

export function findRouteByPath(pathname: string): RouteKey | null {
  const normalized = pathname.replace(/\/?$/, '') || '/dashboard'
  const match = orderedRoutes.find((key) => routes[key].path === normalized)
  return match ?? null
}
