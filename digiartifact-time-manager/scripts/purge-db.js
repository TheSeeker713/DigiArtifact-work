#!/usr/bin/env node

/**
 * Database Purge Script
 * 
 * CRITICAL: Run this before EVERY debug task.
 * Purges all IndexedDB databases, localStorage, and sessionStorage.
 * 
 * Usage:
 *   node scripts/purge-db.js
 *   OR add to package.json: npm run purge
 */

console.log('\n🗑️  DATABASE PURGE SCRIPT\n')
console.log('⚠️  WARNING: This script requires manual execution in the browser console.\n')
console.log('Copy and paste this code into your browser DevTools console:\n')
console.log('─'.repeat(80))
console.log(`
;(async () => {
  console.log('🗑️ Starting database purge...')
  
  // 1. Delete all IndexedDB databases
  const databases = await window.indexedDB.databases()
  console.log('📊 Found', databases.length, 'IndexedDB databases:', databases.map(db => db.name))
  
  for (const db of databases) {
    const dbName = db.name
    try {
      await new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase(dbName)
        request.onsuccess = () => {
          console.log('✅ Deleted database:', dbName)
          resolve()
        }
        request.onerror = () => {
          console.error('❌ Failed to delete:', dbName, request.error)
          reject(request.error)
        }
        request.onblocked = () => {
          console.warn('⚠️ Delete blocked for:', dbName)
          setTimeout(() => reject(new Error('Blocked')), 5000)
        }
      })
    } catch (error) {
      console.error('Error deleting', dbName, error)
    }
  }
  
  // 2. Clear localStorage
  const localStorageKeys = Object.keys(localStorage)
  console.log('🗄️ Clearing', localStorageKeys.length, 'localStorage items')
  localStorage.clear()
  console.log('✅ localStorage cleared')
  
  // 3. Clear sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage)
  console.log('📦 Clearing', sessionStorageKeys.length, 'sessionStorage items')
  sessionStorage.clear()
  console.log('✅ sessionStorage cleared')
  
  console.log('\\n✅ DATABASE PURGE COMPLETE!')
  console.log('🔄 Reloading page in 2 seconds...')
  
  setTimeout(() => {
    window.location.reload()
  }, 2000)
})()
`)
console.log('─'.repeat(80))
console.log('\n💡 Alternative: Use the built-in function:')
console.log('   resetDatabase()\n')
console.log('🚨 REMEMBER: Purge database before EVERY debug task!\n')
