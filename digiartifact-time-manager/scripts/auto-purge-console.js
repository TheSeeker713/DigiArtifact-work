/**
 * 🗑️ AUTO-PURGE SCRIPT
 * 
 * Copy/paste this ENTIRE script into browser console for instant database purge.
 * No need to type resetDatabase() - this runs automatically.
 */

;(async () => {
  console.log('\n🗑️ AUTO-PURGE SCRIPT STARTING...\n')
  console.log('⚠️ WARNING: This will DELETE ALL DATA in 3 seconds!')
  console.log('Close this tab NOW if you want to cancel.\n')
  
  // 3 second countdown
  for (let i = 3; i > 0; i--) {
    console.log(`Purging in ${i}...`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n🗑️ PURGING NOW...\n')
  
  try {
    // 1. Delete all IndexedDB databases
    const databases = await window.indexedDB.databases()
    console.log(`📊 Found ${databases.length} IndexedDB database(s):`, databases.map(db => db.name))
    
    for (const db of databases) {
      const dbName = db.name
      try {
        await new Promise((resolve, reject) => {
          const request = window.indexedDB.deleteDatabase(dbName)
          request.onsuccess = () => {
            console.log(`✅ Deleted: ${dbName}`)
            resolve()
          }
          request.onerror = () => {
            console.error(`❌ Failed to delete: ${dbName}`, request.error)
            reject(request.error)
          }
          request.onblocked = () => {
            console.warn(`⚠️ Delete blocked for: ${dbName} (waiting 5s...)`)
            setTimeout(() => reject(new Error('Blocked')), 5000)
          }
        })
      } catch (error) {
        console.error(`Error deleting ${dbName}:`, error)
      }
    }
    
    // 2. Clear localStorage
    const localStorageKeys = Object.keys(localStorage)
    console.log(`\n🗄️ Clearing ${localStorageKeys.length} localStorage item(s)`)
    localStorage.clear()
    console.log('✅ localStorage cleared')
    
    // 3. Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage)
    console.log(`\n📦 Clearing ${sessionStorageKeys.length} sessionStorage item(s)`)
    sessionStorage.clear()
    console.log('✅ sessionStorage cleared')
    
    console.log('\n✅ DATABASE PURGE COMPLETE!')
    console.log('🔄 Reloading page in 2 seconds...\n')
    
    setTimeout(() => {
      window.location.reload()
    }, 2000)
    
  } catch (error) {
    console.error('\n❌ PURGE FAILED:', error)
    console.log('\n💡 Try manual purge:')
    console.log('   1. DevTools → Application → Storage')
    console.log('   2. Right-click IndexedDB → Delete')
    console.log('   3. Right-click Local Storage → Clear')
    console.log('   4. Refresh page\n')
  }
})()
