/**
 * Database Reset Utility
 * 
 * Drops all IndexedDB databases and clears localStorage for a clean slate.
 * Use this for testing to ensure zero records.
 */

export async function resetAllDatabases(): Promise<void> {
  console.log('[DB Reset] Starting complete database reset...')
  
  try {
    // 1. Close any open database connections
    if (typeof window === 'undefined') {
      console.warn('[DB Reset] Not in browser environment')
      return
    }

    // 2. Get all database names
    const databases = await window.indexedDB.databases()
    console.log('[DB Reset] Found databases:', databases.map(db => db.name))

    // 3. Delete each database
    for (const db of databases) {
      if (db.name) {
        await new Promise<void>((resolve, reject) => {
          const request = window.indexedDB.deleteDatabase(db.name!)
          request.onsuccess = () => {
            console.log(`[DB Reset] Deleted database: ${db.name}`)
            resolve()
          }
          request.onerror = () => {
            console.error(`[DB Reset] Failed to delete database: ${db.name}`)
            reject(request.error)
          }
          request.onblocked = () => {
            console.warn(`[DB Reset] Delete blocked for: ${db.name}. Close all tabs and retry.`)
            reject(new Error('Delete blocked'))
          }
        })
      }
    }

    // 4. Clear localStorage
    console.log('[DB Reset] Clearing localStorage...')
    window.localStorage.clear()

    // 5. Clear sessionStorage
    console.log('[DB Reset] Clearing sessionStorage...')
    window.sessionStorage.clear()

    console.log('[DB Reset] ✅ Complete! All databases and storage cleared.')
    
  } catch (error) {
    console.error('[DB Reset] ❌ Failed:', error)
    throw error
  }
}

/**
 * Add reset button to console for easy access
 */
if (typeof window !== 'undefined') {
  (window as any).resetDatabase = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will DELETE ALL DATA!\n\n' +
      'This includes:\n' +
      '• All work sessions\n' +
      '• All time logs\n' +
      '• All jobs and tasks\n' +
      '• All settings\n' +
      '• All cached stats\n\n' +
      'Are you sure you want to continue?'
    )
    
    if (!confirmed) {
      console.log('[DB Reset] Cancelled by user')
      return
    }

    try {
      await resetAllDatabases()
      alert('✅ Database reset complete! The page will now reload.')
      window.location.reload()
    } catch (error) {
      alert('❌ Reset failed. Check console for details.')
      console.error('[DB Reset] Error:', error)
    }
  }

  console.log(
    '%c💾 Database Reset Available',
    'background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    '\n\nTo reset all data, run: resetDatabase()'
  )
}
