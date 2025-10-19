/**
 * FIX 11: Offline Queue Store - Unsynced Data Management
 * 
 * Maintains in-memory queue of failed IndexedDB writes for retry.
 * Shows "Unsynced (N)" badge until all items flushed successfully.
 * 
 * Use Cases:
 * - Network temporarily offline
 * - IndexedDB quota exceeded
 * - Browser storage corrupted
 * - Database locked by another tab
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Manual flush on user request
 * - Persistent queue across page refresh (localStorage backup)
 * - Type-safe queue items with metadata
 */

import { writable, get } from 'svelte/store'
import { debugLog } from '../utils/debug'

export type QueuedOperation = {
  id: string
  type: 'workSession' | 'timeLog' | 'statsCache' | 'other'
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: string
  attempts: number
  lastError: string | null
}

export type OfflineQueueState = {
  items: QueuedOperation[]
  syncing: boolean
  lastSyncAttempt: string | null
  lastSuccessfulSync: string | null
}

const STORAGE_KEY = 'digiartifact_offline_queue'
const MAX_RETRY_ATTEMPTS = 5
const INITIAL_BACKOFF_MS = 1000 // 1 second
const MAX_BACKOFF_MS = 60000 // 1 minute

const initialState: OfflineQueueState = {
  items: [],
  syncing: false,
  lastSyncAttempt: null,
  lastSuccessfulSync: null,
}

/**
 * Load queue from localStorage on startup (persists across refresh)
 */
function loadQueueFromStorage(): QueuedOperation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    
    debugLog.sync.info('Offline Queue: Loaded from localStorage', { count: parsed.length })
    return parsed
  } catch (error) {
    debugLog.sync.error('Offline Queue: Failed to load from localStorage', { error })
    return []
  }
}

/**
 * Save queue to localStorage (backup in case of page refresh)
 */
function saveQueueToStorage(items: QueuedOperation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    debugLog.sync.error('Offline Queue: Failed to save to localStorage', { error })
  }
}

function createOfflineQueueStore() {
  const store = writable<OfflineQueueState>({
    ...initialState,
    items: loadQueueFromStorage(), // Load persisted queue on init
  })

  let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

  return {
    subscribe: store.subscribe,
    
    /**
     * Add failed operation to queue
     */
    enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'attempts' | 'lastError'>) {
      const item: QueuedOperation = {
        ...operation,
        id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        attempts: 0,
        lastError: null,
      }
      
      store.update(state => {
        const newItems = [...state.items, item]
        saveQueueToStorage(newItems)
        
        debugLog.sync.warn('Offline Queue: Item enqueued', {
          id: item.id,
          type: item.type,
          operation: item.operation,
          queue_size: newItems.length,
        })
        
        return { ...state, items: newItems }
      })
      
      // Schedule automatic retry
      this.scheduleRetry()
    },
    
    /**
     * Remove item from queue (after successful sync)
     */
    dequeue(itemId: string) {
      store.update(state => {
        const newItems = state.items.filter(item => item.id !== itemId)
        saveQueueToStorage(newItems)
        
        debugLog.sync.info('Offline Queue: Item dequeued', {
          id: itemId,
          remaining: newItems.length,
        })
        
        return { ...state, items: newItems }
      })
    },
    
    /**
     * Update item after failed retry attempt
     */
    updateItem(itemId: string, updates: Partial<QueuedOperation>) {
      store.update(state => {
        const newItems = state.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
        saveQueueToStorage(newItems)
        return { ...state, items: newItems }
      })
    },
    
    /**
     * Attempt to sync all queued items
     */
    async flush(): Promise<{ success: number; failed: number }> {
      const state = get(store)
      
      if (state.syncing) {
        debugLog.sync.warn('Offline Queue: Flush already in progress')
        return { success: 0, failed: 0 }
      }
      
      if (state.items.length === 0) {
        debugLog.sync.info('Offline Queue: Nothing to flush')
        return { success: 0, failed: 0 }
      }
      
      store.update(s => ({
        ...s,
        syncing: true,
        lastSyncAttempt: new Date().toISOString(),
      }))
      
      debugLog.sync.info('Offline Queue: Flush started', {
        items_count: state.items.length,
      })
      
      let successCount = 0
      let failedCount = 0
      
      // Process items sequentially (to maintain order)
      for (const item of state.items) {
        try {
          await this.processItem(item)
          this.dequeue(item.id)
          successCount++
        } catch (error) {
          debugLog.sync.error('Offline Queue: Item sync failed', {
            id: item.id,
            type: item.type,
            error,
          })
          
          // Update item with error info
          this.updateItem(item.id, {
            attempts: item.attempts + 1,
            lastError: error instanceof Error ? error.message : String(error),
          })
          
          failedCount++
          
          // Stop if max attempts reached
          if (item.attempts + 1 >= MAX_RETRY_ATTEMPTS) {
            debugLog.sync.error('Offline Queue: Max retry attempts reached', {
              id: item.id,
              attempts: item.attempts + 1,
            })
          }
        }
      }
      
      store.update(s => ({
        ...s,
        syncing: false,
        lastSuccessfulSync: successCount > 0 ? new Date().toISOString() : s.lastSuccessfulSync,
      }))
      
      debugLog.sync.info('Offline Queue: Flush completed', {
        success: successCount,
        failed: failedCount,
        remaining: get(store).items.length,
      })
      
      return { success: successCount, failed: failedCount }
    },
    
    /**
     * Process a single queued item (write to IndexedDB)
     */
    async processItem(item: QueuedOperation): Promise<void> {
      debugLog.sync.info('Offline Queue: Processing item', {
        id: item.id,
        type: item.type,
        operation: item.operation,
      })
      
      // Dynamically import repo based on type
      switch (item.type) {
        case 'workSession': {
          const { workSessionsRepo } = await import('../repos/workSessionsRepo')
          if (item.operation === 'create') {
            await workSessionsRepo.create(item.data)
          } else if (item.operation === 'update') {
            await workSessionsRepo.update(item.data.id, item.data)
          }
          break
        }
        
        case 'timeLog': {
          const { timeLogsRepo } = await import('../repos/timeLogsRepo')
          if (item.operation === 'create') {
            await timeLogsRepo.create(item.data)
          } else if (item.operation === 'update') {
            await timeLogsRepo.update(item.data.id, item.data)
          }
          break
        }
        
        case 'statsCache': {
          const { recomputeWeekAggregates } = await import('../services/statsAggregationService')
          // Recompute stats from scratch
          await recomputeWeekAggregates()
          break
        }
        
        default:
          throw new Error(`Unknown queue item type: ${item.type}`)
      }
    },
    
    /**
     * Schedule automatic retry with exponential backoff
     */
    scheduleRetry(delayMs?: number) {
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
      }
      
      const state = get(store)
      if (state.items.length === 0) return
      
      // Calculate backoff based on first item's attempt count
      const firstItem = state.items[0]
      const backoff = delayMs ?? Math.min(
        INITIAL_BACKOFF_MS * Math.pow(2, firstItem.attempts),
        MAX_BACKOFF_MS
      )
      
      debugLog.sync.info('Offline Queue: Retry scheduled', {
        delay_ms: backoff,
        items_count: state.items.length,
      })
      
      retryTimeoutId = setTimeout(() => {
        this.flush()
      }, backoff)
    },
    
    /**
     * Clear all items from queue (use with caution)
     */
    clear() {
      store.set({
        ...initialState,
        items: [],
      })
      saveQueueToStorage([])
      
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
        retryTimeoutId = null
      }
      
      debugLog.sync.warn('Offline Queue: Cleared all items')
    },
    
    /**
     * Get current queue state (for debugging)
     */
    getState(): OfflineQueueState {
      return get(store)
    },
  }
}

export const offlineQueueStore = createOfflineQueueStore()

// Auto-retry on page load if queue has items
if (typeof window !== 'undefined') {
  const initialState = offlineQueueStore.getState()
  if (initialState.items.length > 0) {
    debugLog.sync.info('Offline Queue: Auto-retry on load', {
      items_count: initialState.items.length,
    })
    // Wait 2 seconds after page load before first retry
    offlineQueueStore.scheduleRetry(2000)
  }
}
