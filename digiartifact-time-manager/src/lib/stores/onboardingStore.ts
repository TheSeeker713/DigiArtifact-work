/**
 * Onboarding Store
 * 
 * Manages onboarding state and progress
 */

import { writable } from 'svelte/store'

const ONBOARDING_KEY = 'onboarding_completed'

export type OnboardingStep = {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DigiArtifact Time Manager',
    description: 'A fast, offline-first time & revenue manager for solo creators. Let\'s take a quick tour to get you started!',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Your command center shows weekly hours, active timers, and quick stats. Clock in/out directly from here.',
    target: '.dashboard-main',
    position: 'center',
  },
  {
    id: 'work-session',
    title: 'Work Session Card',
    description: 'See your active timer with Work Time and Break Time. The "Total Time" and "Hours This Week" sync in real-time.',
    target: '[data-onboarding="work-session"]',
    position: 'bottom',
  },
  {
    id: 'hours-this-week',
    title: 'Weekly Progress',
    description: 'Track your hours against your weekly target (default: 40 hours). Updates live as you work.',
    target: '[data-onboarding="hours-this-week"]',
    position: 'top',
  },
  {
    id: 'live-status',
    title: 'Live Status Header',
    description: 'The header shows active timers, current status, and today\'s hours. Always visible as you navigate.',
    target: '[data-onboarding="live-status"]',
    position: 'bottom',
  },
  {
    id: 'navigation',
    title: 'Navigation Sidebar',
    description: 'Access all features: Time tracking, Jobs, Clients, Deals, Reports, and Settings. Everything is organized by workflow.',
    target: 'nav.app-nav',
    position: 'right',
  },
  {
    id: 'time-page',
    title: 'Time Tracking Page',
    description: 'Use the Time page for detailed time tracking with job selection, notes, and billable toggles.',
    position: 'center',
  },
  {
    id: 'jobs',
    title: 'Jobs & Tasks',
    description: 'Create jobs, add tasks, and track time against them. Jobs link to clients for billing.',
    position: 'center',
  },
  {
    id: 'clients',
    title: 'Client Management',
    description: 'Manage clients, contacts, and activities. All your relationship data in one place.',
    position: 'center',
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'View detailed reports on hours worked, revenue, client activity, and more. Export to CSV anytime.',
    position: 'center',
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    description: 'Customize weekly targets, timezone, theme, and other preferences. Changes save automatically.',
    position: 'center',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start by clocking into a job or create your first client. All data is stored locally in your browser. Happy tracking!',
    position: 'center',
  },
]

export type OnboardingState = {
  active: boolean
  currentStepIndex: number
  dontShowAgain: boolean
}

const initialState: OnboardingState = {
  active: false,
  currentStepIndex: 0,
  dontShowAgain: false,
}

function createOnboardingStore() {
  const store = writable<OnboardingState>({ ...initialState })

  return {
    subscribe: store.subscribe,
    start() {
      store.update(state => ({
        ...state,
        active: true,
        currentStepIndex: 0,
      }))
    },
    next() {
      store.update(state => {
        const nextIndex = state.currentStepIndex + 1
        if (nextIndex >= onboardingSteps.length) {
          return {
            ...state,
            active: false,
            currentStepIndex: 0,
          }
        }
        return {
          ...state,
          currentStepIndex: nextIndex,
        }
      })
    },
    prev() {
      store.update(state => ({
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      }))
    },
    skip() {
      store.update(state => ({
        ...state,
        active: false,
        currentStepIndex: 0,
      }))
    },
    toggleDontShowAgain() {
      store.update(state => ({
        ...state,
        dontShowAgain: !state.dontShowAgain,
      }))
    },
    complete() {
      store.update(state => {
        if (state.dontShowAgain) {
          localStorage.setItem(ONBOARDING_KEY, 'true')
        }
        return {
          ...state,
          active: false,
          currentStepIndex: 0,
        }
      })
    },
    reset() {
      localStorage.removeItem(ONBOARDING_KEY)
      store.set({ ...initialState })
    },
  }
}

export const onboardingStore = createOnboardingStore()

/**
 * Check if onboarding should start automatically
 */
export function shouldShowOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) !== 'true'
}

/**
 * Expose onboarding control to window
 */
if (typeof window !== 'undefined') {
  (window as any).startOnboarding = () => onboardingStore.start();
  (window as any).resetOnboarding = () => onboardingStore.reset()
  
  console.log('👋 [Onboarding] Utilities loaded:')
  console.log('   - startOnboarding() : Start onboarding tour')
  console.log('   - resetOnboarding() : Reset onboarding state')
}
