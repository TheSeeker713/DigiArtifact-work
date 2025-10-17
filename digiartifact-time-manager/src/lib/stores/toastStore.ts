import { writable } from 'svelte/store'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export type Toast = {
  id: string
  message: string
  tone: ToastTone
  duration?: number
}

const { subscribe, update, set } = writable<Toast[]>([])

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function enqueue(toast: Omit<Toast, 'id'> & { id?: string }) {
  const id = toast.id ?? randomId()
  const entry: Toast = { id, ...toast }

  update((toasts) => [...toasts.filter((item) => item.id !== id), entry])

  const ttl = toast.duration ?? 4000
  if (ttl > 0) {
    timers.set(
      id,
      setTimeout(() => {
        dismiss(id)
      }, ttl),
    )
  }

  return id
}

function dismiss(id: string) {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  update((toasts) => toasts.filter((item) => item.id !== id))
}

function clear() {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  set([])
}

function success(message: string, duration?: number) {
  return enqueue({ message, tone: 'success', duration })
}

function error(message: string, duration?: number) {
  return enqueue({ message, tone: 'error', duration: duration ?? 6000 })
}

function info(message: string, duration?: number) {
  return enqueue({ message, tone: 'info', duration })
}

function warning(message: string, duration?: number) {
  return enqueue({ message, tone: 'warning', duration })
}

export const toastStore = {
  subscribe,
  enqueue,
  dismiss,
  clear,
  success,
  error,
  info,
  warning,
}

export const dismissToast = dismiss
export const clearToasts = clear
export const pushToast = enqueue
export const toastSuccess = success
export const toastError = error
export const toastInfo = info
export const toastWarning = warning