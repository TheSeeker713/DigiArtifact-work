# Database Management System - Implementation Guide

## Overview

The DigiArtifact Time Manager now includes a comprehensive database management system that allows users to:

- **Export all data** to a JSON backup file
- **Import data** from a backup file
- **Permanently purge all data** with multi-step confirmation
- **View database statistics** in real-time
- **Preserve or delete archives** based on user choice

## Features

### 1. Data Export (Backup)

**Location:** Settings → Database Management → Export All Data

**What it does:**
- Exports all records from all database tables to a JSON file
- Includes: clients, jobs, time logs, invoices, payments, deals, activities, expenses, products, people, contacts, schedules, work sessions, settings, audit logs, and more
- Preserves all relationships and IDs
- Downloads as `datm-backup-YYYY-MM-DD.json`

**Usage:**
```typescript
import { exportAllData, downloadBackup } from '../lib/services/databaseService'

const backup = await exportAllData((progress) => {
  console.log(`Exporting ${progress.storeName}: ${progress.current}/${progress.total}`)
})

downloadBackup(backup)
```

**Backup File Structure:**
```json
{
  "version": "1.0.0",
  "exportedAt": "2025-10-20T12:00:00.000Z",
  "appName": "DigiArtifact Time Manager",
  "data": {
    "clients": [...],
    "jobs": [...],
    "timelogs": [...],
    ...
  },
  "statistics": {
    "totalRecords": 5000,
    "recordsByStore": {
      "clients": 300,
      "timelogs": 5000,
      ...
    }
  }
}
```

### 2. Data Import (Restore)

**Location:** Settings → Database Management → Import Data

**What it does:**
- Restores data from a backup JSON file
- Overwrites existing records with matching IDs
- Preserves data relationships
- Shows import progress
- Reports any errors encountered

**Usage:**
```typescript
import { importAllData, parseBackupFile } from '../lib/services/databaseService'

// Parse the uploaded file
const backup = await parseBackupFile(file)

// Import the data
const result = await importAllData(backup, (progress) => {
  console.log(`Importing ${progress.storeName}: ${progress.current}/${progress.total}`)
})

console.log(`Imported ${result.imported} records with ${result.errors.length} errors`)
```

**Important Notes:**
- ⚠️ Import OVERWRITES existing data
- 💡 Create a backup before importing
- 🔄 Page reloads automatically after import

### 3. Database Statistics

**Location:** Settings → Database Management → Database Statistics

**What it displays:**
- Total record count across all tables
- Breakdown by entity type (Time Logs, Clients, Invoices, etc.)
- Real-time updates
- Refresh button to recalculate

**Usage:**
```typescript
import { getDatabaseStats } from '../lib/services/databaseService'

const stats = await getDatabaseStats()
console.log(stats)
// {
//   clients: 300,
//   timelogs: 5000,
//   invoices: 400,
//   ...
// }
```

### 4. Permanent Data Purge

**Location:** Settings → Permanent Data Purge → Purge All Data

**What it does:**
- **Permanently deletes ALL data** from the application
- Includes: all database records, localStorage, and sessionStorage
- **DOES NOT preserve archives** - everything is deleted
- Multi-step confirmation process for safety

**Confirmation Flow:**

#### Step 1: Initial Warning
Shows the scope of data to be deleted:
- Total record count
- Breakdown by entity type
- Warning that archives will be deleted

User clicks "Continue" to proceed.

#### Step 2: Export Offer
Prompts user to export data before purging:
- **"Export Data First"** - Downloads a backup, then proceeds
- **"Skip Export"** - Proceeds without backup (dangerous!)

#### Step 3: Final Confirmation
Requires typing the exact phrase:
```
THE PURGE
```

User must type this exactly (case-sensitive) to enable the purge button.

#### Step 4: Purging
Shows progress:
- Current operation (e.g., "Clearing data stores")
- Progress bar
- Store names as they're cleared

#### Step 5: Complete
Shows results:
- Total records deleted
- Total stores cleared
- "Close & Reload" button (reloads the page)

**What Gets Deleted:**

1. **All Database Records:**
   - people
   - clients
   - contacts
   - deals
   - jobs
   - tasks
   - timelogs
   - schedules
   - invoices
   - invoice_items
   - payments
   - expenses
   - products
   - product_sales
   - activities
   - form_submissions
   - work_sessions
   - active_tasks
   - settings
   - audit

2. **All localStorage items** starting with "datm" or "DATM"

3. **All sessionStorage data**

**Usage (Programmatic):**
```typescript
import { purgeAllData } from '../lib/services/databaseService'

const result = await purgeAllData((progress) => {
  console.log(`${progress.step}: ${progress.current}/${progress.total}`)
  if (progress.storeName) {
    console.log(`Clearing ${progress.storeName}`)
  }
})

console.log(`Deleted ${result.deletedRecords} records from ${result.clearedStores} stores`)
```

## Safety Features

### For Export/Import
- ✅ Progress indicators
- ✅ Error reporting
- ✅ Validation of backup file structure
- ✅ Confirmation before import

### For Purge
- ✅ Multi-step confirmation process
- ✅ Clear warnings about permanence
- ✅ Export offer before purge
- ✅ Exact text match requirement ("THE PURGE")
- ✅ Statistics displayed before purge
- ✅ Progress tracking during purge
- ✅ Automatic page reload after purge

## Technical Details

### Service Layer
**File:** `src/lib/services/databaseService.ts`

**Key Functions:**
- `exportAllData(onProgress?)` - Export all database records
- `importAllData(backup, onProgress?)` - Import from backup
- `purgeAllData(onProgress?)` - Delete all data permanently
- `getDatabaseStats()` - Get record counts
- `clearStore(storeName)` - Clear a specific table
- `downloadBackup(backup, filename?)` - Download backup file
- `parseBackupFile(file)` - Parse uploaded backup
- `verifyDataIntegrity()` - Check for data issues
- `destroyDatabase()` - Delete the entire IndexedDB (nuclear option)

### UI Components
**File:** `src/lib/components/DataPurgeModal.svelte`

**Features:**
- Multi-step modal dialog
- Progress tracking
- Text input validation
- Event dispatching (close, export, purge)
- Automatic state management

**Props:**
- `isOpen: boolean` - Modal visibility
- `statistics: Record<string, number>` - Database stats

**Events:**
- `close` - User cancelled
- `export` - User requested export
- `purge` - User confirmed purge

**Methods:**
- `setProgress(progress)` - Update progress during purge
- `setComplete(result)` - Show completion screen

### Settings Integration
**File:** `src/routes/Settings.svelte`

**New Sections:**
1. **Database Management** (purple card)
   - Database statistics
   - Export button
   - Import file picker
   - Import progress bar

2. **Permanent Data Purge** (red card)
   - Danger zone warnings
   - Protection explanations
   - Purge button

**State Variables:**
- `dbStats` - Database statistics
- `exporting` - Export in progress
- `importing` - Import in progress
- `importProgress` - Import progress tracker
- `showPurgeModal` - Modal visibility
- `purgeModalRef` - Reference to modal component

## User Guide

### How to Backup Your Data

1. Navigate to **Settings**
2. Scroll to **Database Management**
3. Click **💾 Export All Data**
4. Wait for export to complete
5. File will download automatically as `datm-backup-YYYY-MM-DD.json`

**Recommendation:** Export regularly, especially before major operations!

### How to Restore from Backup

1. Navigate to **Settings**
2. Scroll to **Database Management**
3. Click **📥 Import Data**
4. Select your backup JSON file
5. Confirm the import warning
6. Wait for import to complete
7. Page will reload automatically

**Warning:** This will overwrite your current data!

### How to Purge All Data

1. Navigate to **Settings**
2. Scroll to **Permanent Data Purge**
3. Read the warnings carefully
4. Click **🗑️ Purge All Data**
5. **Step 1:** Review what will be deleted, click "Continue"
6. **Step 2:** Choose to export first (recommended) or skip
7. **Step 3:** Type exactly `THE PURGE` in the text box
8. Click **Purge All Data**
9. Wait for purge to complete
10. Page will reload automatically

**This cannot be undone!** Export your data first if you might need it later.

## Archives

**Important:** The purge operation **DOES NOT** preserve archives.

If you want to keep archived data:
1. Export your data before purging
2. After purge, import the backup to restore archived records
3. OR manually filter the backup JSON to keep only archived records before importing

## Best Practices

### Regular Backups
- ✅ Export data weekly or before major changes
- ✅ Store backups in multiple locations (local drive, cloud storage, USB)
- ✅ Name backups with meaningful dates/versions
- ✅ Test restore process occasionally

### Before Purging
- ✅ **ALWAYS export your data first**
- ✅ Verify the export file downloaded successfully
- ✅ Open the JSON file to confirm it contains your data
- ✅ Store the backup in a safe location
- ✅ Consider making multiple backups

### Data Integrity
- ✅ Run "Refresh Stats" periodically to verify record counts
- ✅ Use "Backfill Weekly Totals" to validate time log aggregations
- ✅ Export data before running bulk operations
- ✅ Monitor browser console for any database errors

## Troubleshooting

### Export Issues

**Problem:** Export fails or downloads empty file
**Solution:**
- Check browser console for errors
- Try closing other tabs running the app
- Refresh the page and try again
- Check available disk space

### Import Issues

**Problem:** Import fails or shows errors
**Solution:**
- Verify the JSON file is valid (open in text editor)
- Check that it's a proper backup file (has `version` and `data` fields)
- Close other tabs running the app
- Try importing in smaller chunks (contact developer for help)

### Purge Issues

**Problem:** Purge gets stuck or fails
**Solution:**
- Close all other tabs running the app
- Refresh and try again
- If stuck, manually delete IndexedDB:
  1. Open DevTools (F12)
  2. Go to Application → IndexedDB
  3. Right-click "datm" → Delete database
  4. Refresh page

### General Database Issues

**Problem:** App seems slow or unresponsive
**Solution:**
- Check database statistics - large record counts may impact performance
- Export data and purge to start fresh
- Enable "Low-End Mode" in Performance settings
- Clear browser cache

## API Reference

### `exportAllData(onProgress?)`

Exports all database records to a structured backup object.

**Parameters:**
- `onProgress?: (progress: { current: number; total: number; storeName: string }) => void`

**Returns:** `Promise<DatabaseBackup>`

**Example:**
```typescript
const backup = await exportAllData((p) => {
  console.log(`${p.current}/${p.total}: ${p.storeName}`)
})
```

### `importAllData(backup, onProgress?)`

Imports data from a backup object into the database.

**Parameters:**
- `backup: DatabaseBackup` - The backup to import
- `onProgress?: (progress: { current: number; total: number; storeName: string }) => void`

**Returns:** `Promise<{ imported: number; errors: string[] }>`

**Example:**
```typescript
const result = await importAllData(backup, (p) => {
  console.log(`Importing: ${p.storeName}`)
})
```

### `purgeAllData(onProgress?)`

Permanently deletes all data from the database and storage.

**Parameters:**
- `onProgress?: (progress: PurgeProgress) => void`

**Returns:** `Promise<{ deletedRecords: number; clearedStores: number }>`

**Example:**
```typescript
const result = await purgeAllData((p) => {
  console.log(`${p.step}: ${p.current}/${p.total}`)
})
```

### `getDatabaseStats()`

Retrieves record counts for all database tables.

**Returns:** `Promise<Record<string, number>>`

**Example:**
```typescript
const stats = await getDatabaseStats()
// { clients: 300, timelogs: 5000, ... }
```

### `downloadBackup(backup, filename?)`

Downloads a backup object as a JSON file.

**Parameters:**
- `backup: DatabaseBackup` - The backup to download
- `filename?: string` - Optional custom filename

**Example:**
```typescript
downloadBackup(backup, 'my-backup-2025-10-20.json')
```

### `parseBackupFile(file)`

Parses an uploaded backup file into a backup object.

**Parameters:**
- `file: File` - The uploaded JSON file

**Returns:** `Promise<DatabaseBackup>`

**Example:**
```typescript
const backup = await parseBackupFile(uploadedFile)
```

## Security Considerations

### Data Privacy
- All data is stored locally in browser's IndexedDB
- No data is sent to external servers
- Backup files contain sensitive business data
- Store backup files securely
- Don't share backups publicly

### Purge Safety
- Multi-step confirmation prevents accidental deletion
- Exact text match required ("THE PURGE")
- Export option provided before purge
- No way to recover data after purge (by design)

### Browser Storage Limits
- IndexedDB has browser-specific limits (typically 50MB+)
- Large datasets may hit storage limits
- Export regularly to avoid data loss
- Monitor database statistics

## Future Enhancements

Potential improvements for future versions:

- 🔄 Automatic scheduled backups
- 🔐 Encrypted backup files
- ☁️ Cloud backup integration
- 🗜️ Compressed backup files
- 📊 Backup diff/merge tools
- 🔍 Selective export/import (by entity type)
- ⏱️ Backup history management
- 🔔 Low storage warnings
- 📧 Email backup option
- 🔗 Backup sharing/collaboration

## Support

For issues, questions, or feature requests:
- Check the browser console for detailed error messages
- Review this documentation
- Contact the development team
- Open an issue on the project repository

---

**Last Updated:** October 20, 2025  
**Version:** 1.0.0  
**Author:** DigiArtifact Time Manager Development Team
