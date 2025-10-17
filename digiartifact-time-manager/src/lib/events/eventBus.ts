type Callback<T> = (payload: T) => void

export type EventMap = {
  'timelog:created': { id: string; jobId: string; durationMinutes: number; weekBucket: string }
  'timelog:updated': { id: string; jobId: string; durationMinutes: number; weekBucket: string }
  'timelog:deleted': { id: string }
  'stats:refresh': void
  'settings:updated': void
}

class EventBus {
  private listeners = new Map<string, Set<Callback<any>>>()

  on<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>) {
    const set = this.listeners.get(event as string) ?? new Set()
    set.add(callback as Callback<any>)
    this.listeners.set(event as string, set)

    return () => this.off(event, callback)
  }

  once<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>) {
    const off = this.on(event, (payload) => {
      off()
      callback(payload)
    })
    return off
  }

  off<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>) {
    const set = this.listeners.get(event as string)
    if (!set) return
    set.delete(callback as Callback<any>)
    if (set.size === 0) {
      this.listeners.delete(event as string)
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const set = this.listeners.get(event as string)
    if (!set) return
    for (const cb of set) {
      try {
        cb(payload)
      } catch (error) {
        console.error(`eventBus: error in ${String(event)} handler`, error)
      }
    }
  }

  clear() {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
