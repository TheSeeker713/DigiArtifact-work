/**
 * Database Management Service
 * 
 * Provides comprehensive database operations including:
 * - Data export (full backup)
 * - Data import (restore from backup)
 * - Complete data purge (permanent deletion)
 * - Archive data management
 * - Data integrity verification
 */

import { getDB, DB_NAME, type EntityStore } from '../data/db'
import type {
  ClientRecord,
  JobRecord,
  TaskRecord,
  TimeLogRecord,
  InvoiceRecord,
  PaymentRecord,
  DealRecord,
  ActivityRecord,
  ExpenseRecord,
  ProductRecord,
  ProductSaleRecord,
  PersonRecord,
  ContactRecord,
  ScheduleRecord,
  WorkSessionRecord,
  ActiveTaskRecord,
  InvoiceItemRecord,
  FormSubmissionRecord,
  SettingRecord,
  AuditRecord,
} from '../types/entities'

// All entity stores in the database
const ALL_STORES: EntityStore[] = [
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

export type DatabaseBackup = {
  version: string
  exportedAt: string
  appName: string
  data: {
    people: PersonRecord[]
    clients: ClientRecord[]
    contacts: ContactRecord[]
    deals: DealRecord[]
    jobs: JobRecord[]
    tasks: TaskRecord[]
    timelogs: TimeLogRecord[]
    schedules: ScheduleRecord[]
    invoices: InvoiceRecord[]
    invoice_items: InvoiceItemRecord[]
    payments: PaymentRecord[]
    expenses: ExpenseRecord[]
    products: ProductRecord[]
    product_sales: ProductSaleRecord[]
    activities: ActivityRecord[]
    form_submissions: FormSubmissionRecord[]
    work_sessions: WorkSessionRecord[]
    active_tasks: ActiveTaskRecord[]
    settings: SettingRecord[]
    audit: AuditRecord[]
  }
  statistics: {
    totalRecords: number
    recordsByStore: Record<string, number>
  }
}

export type PurgeProgress = {
  step: string
  current: number
  total: number
  storeName?: string
}

/**
 * Export all data from the database as a JSON backup
 */
export async function exportAllData(
  onProgress?: (progress: { current: number; total: number; storeName: string }) => void,
): Promise<DatabaseBackup> {
  const db = await getDB()
  const exportData: any = {}
  let totalRecords = 0
  const recordsByStore: Record<string, number> = {}

  for (let i = 0; i < ALL_STORES.length; i++) {
    const storeName = ALL_STORES[i]
    
    if (onProgress) {
      onProgress({ current: i + 1, total: ALL_STORES.length, storeName })
    }

    try {
      const records = await db.getAll(storeName)
      exportData[storeName] = records
      recordsByStore[storeName] = records.length
      totalRecords += records.length
    } catch (error) {
      console.error(`[DatabaseService] Failed to export store ${storeName}:`, error)
      exportData[storeName] = []
      recordsByStore[storeName] = 0
    }
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'DigiArtifact Time Manager',
    data: exportData,
    statistics: {
      totalRecords,
      recordsByStore,
    },
  }
}

/**
 * Import data from a backup file
 * Warning: This will overwrite existing data
 */
export async function importAllData(
  backup: DatabaseBackup,
  onProgress?: (progress: { current: number; total: number; storeName: string }) => void,
): Promise<{ imported: number; errors: string[] }> {
  const db = await getDB()
  let imported = 0
  const errors: string[] = []

  const storesToImport = Object.keys(backup.data) as EntityStore[]

  for (let i = 0; i < storesToImport.length; i++) {
    const storeName = storesToImport[i]
    const records = backup.data[storeName as keyof typeof backup.data] || []

    if (onProgress) {
      onProgress({ current: i + 1, total: storesToImport.length, storeName })
    }

    try {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)

      for (const record of records as any[]) {
        try {
          await store.put(record)
          imported++
        } catch (err) {
          errors.push(`Failed to import record in ${storeName}: ${err}`)
        }
      }

      await tx.done
    } catch (error) {
      errors.push(`Failed to import store ${storeName}: ${error}`)
    }
  }

  return { imported, errors }
}

/**
 * Clear a specific store
 */
export async function clearStore(storeName: EntityStore): Promise<number> {
  const db = await getDB()
  
  try {
    const allRecords = await db.getAll(storeName)
    const count = allRecords.length
    
    const tx = db.transaction(storeName, 'readwrite')
    await tx.objectStore(storeName).clear()
    await tx.done
    
    return count
  } catch (error) {
    console.error(`[DatabaseService] Failed to clear store ${storeName}:`, error)
    throw error
  }
}

/**
 * Get count of records in all stores
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  const db = await getDB()
  const stats: Record<string, number> = {}

  for (const storeName of ALL_STORES) {
    try {
      const records = await db.getAll(storeName)
      stats[storeName] = records.length
    } catch (error) {
      console.error(`[DatabaseService] Failed to get stats for ${storeName}:`, error)
      stats[storeName] = 0
    }
  }

  return stats
}

/**
 * Purge all data from the database
 * This is a destructive operation that cannot be undone
 */
export async function purgeAllData(
  onProgress?: (progress: PurgeProgress) => void,
): Promise<{ deletedRecords: number; clearedStores: number }> {
  const db = await getDB()
  let totalDeleted = 0
  let clearedStores = 0

  // Step 1: Clear all object stores
  for (let i = 0; i < ALL_STORES.length; i++) {
    const storeName = ALL_STORES[i]

    if (onProgress) {
      onProgress({
        step: 'Clearing data stores',
        current: i + 1,
        total: ALL_STORES.length,
        storeName,
      })
    }

    try {
      const recordCount = await clearStore(storeName)
      totalDeleted += recordCount
      clearedStores++
    } catch (error) {
      console.error(`[DatabaseService] Failed to clear ${storeName}:`, error)
    }
  }

  // Step 2: Clear localStorage
  if (onProgress) {
    onProgress({
      step: 'Clearing localStorage',
      current: 1,
      total: 1,
    })
  }

  try {
    // Clear all datm-related localStorage items
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('datm') || key.startsWith('DATM'))) {
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('[DatabaseService] Failed to clear localStorage:', error)
  }

  // Step 3: Clear sessionStorage
  if (onProgress) {
    onProgress({
      step: 'Clearing sessionStorage',
      current: 1,
      total: 1,
    })
  }

  try {
    sessionStorage.clear()
  } catch (error) {
    console.error('[DatabaseService] Failed to clear sessionStorage:', error)
  }

  return {
    deletedRecords: totalDeleted,
    clearedStores,
  }
}

/**
 * Delete the entire IndexedDB database
 * This is the nuclear option - complete destruction
 */
export async function destroyDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)

    request.onsuccess = () => {
      console.log('[DatabaseService] Database destroyed successfully')
      resolve()
    }

    request.onerror = () => {
      console.error('[DatabaseService] Failed to destroy database:', request.error)
      reject(request.error)
    }

    request.onblocked = () => {
      console.warn('[DatabaseService] Database deletion blocked - close all tabs and retry')
    }
  })
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup: DatabaseBackup, filename?: string): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `datm-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse uploaded backup file
 */
export async function parseBackupFile(file: File): Promise<DatabaseBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const backup = JSON.parse(json) as DatabaseBackup
        
        // Validate backup structure
        if (!backup.data || !backup.version) {
          throw new Error('Invalid backup file format')
        }

        resolve(backup)
      } catch (error) {
        reject(new Error(`Failed to parse backup file: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read backup file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Verify data integrity
 */
export async function verifyDataIntegrity(): Promise<{
  valid: boolean
  issues: string[]
}> {
  const issues: string[] = []
  const db = await getDB()

  try {
    // Check for orphaned records
    const [jobs, timeLogs, invoiceItems] = await Promise.all([
      db.getAll('jobs'),
      db.getAll('timelogs'),
      db.getAll('invoice_items'),
    ])

    const jobIds = new Set(jobs.map((j) => j.id))

    // Check TimeLogs reference valid jobs
    for (const log of timeLogs) {
      if (log.jobId && !jobIds.has(log.jobId)) {
        issues.push(`TimeLog ${log.id} references non-existent job ${log.jobId}`)
      }
    }

    // Check InvoiceItems reference valid jobs
    for (const item of invoiceItems) {
      if (item.jobId && !jobIds.has(item.jobId)) {
        issues.push(`InvoiceItem ${item.id} references non-existent job ${item.jobId}`)
      }
    }
  } catch (error) {
    issues.push(`Data integrity check failed: ${error}`)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
