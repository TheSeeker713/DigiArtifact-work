import type { RouteKey } from '../../routes'

export type NavItem = {
  key: RouteKey
  title: string
  description: string
}

export type NavSection = {
  label: string
  items: NavItem[]
}
