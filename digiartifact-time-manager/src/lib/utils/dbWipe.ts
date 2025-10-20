/**
 * Database Wipe Utility
 * 
 * Completely wipes all IndexedDB stores and resets to empty state.
 * Used for testing to ensure fresh database on each debug session.
 */

import { getDB, type EntityStore } from '../data/db'

const STORE_NAMES: EntityStore[] = [
  'people',
  'clients',
  'contacts',
  'deals',
  'jobs',
  'tasks',
  'timelogs',
  'schedules',
  'invoices',
  'invoice_items',
  'payments',
  'expenses',
  'products',
  'product_sales',
  'activities',
  'form_submissions',
  'work_sessions',
  'active_tasks',
  'settings',
  'audit',
]

/**
 * Wipe all data from all stores
 */
export async function wipeAllStores(): Promise<void> {
  console.log('🗑️ [DB Wipe] Starting database wipe...')
  
  try {
    const db = await getDB()
    
    for (const storeName of STORE_NAMES) {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        
        // Get count before clearing
        const countBefore = await store.count()
        
        // Clear all records
        await store.clear()
        
        await tx.done
        
        console.log(`✅ [DB Wipe] Cleared ${storeName}: ${countBefore} records deleted`)
      } catch (error) {
        console.error(`❌ [DB Wipe] Failed to clear ${storeName}:`, error)
      }
    }
    
    console.log('✅ [DB Wipe] Database wipe complete!')
    
  } catch (error) {
    console.error('❌ [DB Wipe] Failed to wipe database:', error)
    throw error
  }
}

/**
 * Wipe database and reload page
 */
export async function wipeAndReload(): Promise<void> {
  await wipeAllStores()
  
  // Clear localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()
  
  console.log('🔄 [DB Wipe] Reloading page...')
  
  setTimeout(() => {
    window.location.reload()
  }, 500)
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  const db = await getDB()
  const stats: Record<string, number> = {}
  
  for (const storeName of STORE_NAMES) {
    try {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const count = await store.count()
      stats[storeName] = count
      await tx.done
    } catch (error) {
      stats[storeName] = -1
    }
  }
  
  return stats
}

// Expose wipe functions to window for console access
if (typeof window !== 'undefined') {
  (window as any).wipeDatabase = wipeAndReload;
  (window as any).wipeAllStores = wipeAllStores;
  (window as any).getDatabaseStats = getDatabaseStats
  
  console.log('💾 [DB Wipe] Utilities loaded:')
  console.log('   - wipeDatabase() : Wipe all data and reload')
  console.log('   - wipeAllStores() : Wipe all data (no reload)')
  console.log('   - getDatabaseStats() : Get record counts')
}
