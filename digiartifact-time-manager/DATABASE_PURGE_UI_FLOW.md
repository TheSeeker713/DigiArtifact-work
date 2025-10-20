# Data Purge UI Flow - Visual Guide

## Settings Page - New Sections

```
┌─────────────────────────────────────────────────────────────────┐
│ Settings                                                        │
│ Update the global cadence defaults...                          │
└─────────────────────────────────────────────────────────────────┘

... (existing settings sections) ...

┌─────────────────────────────────────────────────────────────────┐
│ 💾 Database Management                        [Purple Border]  │
│ Backup, restore, and manage your application data              │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Database Statistics                                       │  │
│ │ ┌──────────┬──────────┬──────────┬──────────┐           │  │
│ │ │ Total    │ Time Logs│ Clients  │ Invoices │           │  │
│ │ │ Records  │          │          │          │           │  │
│ │ │ 5,847    │ 5,000    │ 300      │ 400      │           │  │
│ │ └──────────┴──────────┴──────────┴──────────┘           │  │
│ │ 🔄 Refresh Stats                                          │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Backup & Restore                                                │
│ ┌─────────────────────┐ ┌─────────────────────┐              │
│ │ 💾 Export All Data  │ │ 📥 Import Data      │              │
│ └─────────────────────┘ └─────────────────────┘              │
│                                                                 │
│ 💡 Export creates a JSON backup file. Import restores data     │
│    from a backup. Archives are preserved.                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔥 Permanent Data Purge                         [Red Border]   │
│ ⚠️ DANGER ZONE: Permanently delete ALL data including archives │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ⚠️ What gets deleted:                                    │  │
│ │ All records in all tables, all localStorage settings,    │  │
│ │ and all sessionStorage data. Archives will NOT be        │  │
│ │ preserved.                                                │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🛡️ Protection:                                           │  │
│ │ You'll be prompted to export your data first, then        │  │
│ │ required to type "THE PURGE" to confirm.                  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─────────────────────┐                                        │
│ │ 🗑️ Purge All Data   │                                        │
│ └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Purge Modal - Step 1: Initial Warning

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Permanent Data Deletion                      [Red Header]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ⚠️ WARNING: This action is PERMANENT and IRREVERSIBLE    │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ You are about to permanently delete ALL data from the app:      │
│                                                                 │
│ • 300 Clients                                                   │
│ • 150 Jobs                                                      │
│ • 5,000 Time Logs                                              │
│ • 400 Invoices                                                  │
│ • 600 Payments                                                  │
│ • 500 Deals                                                     │
│ • 1,000 Activities                                             │
│ • 200 Expenses                                                  │
│ • ...and ALL other records                                      │
│                                                                 │
│ Total: 8,150 records will be permanently deleted.              │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Note: This includes archived data. Once deleted,      │  │
│ │    recovery is impossible.                                │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ This will also clear all localStorage and sessionStorage.       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                    ┌──────────┐ ┌──────────┐  │
│                                    │ Cancel   │ │ Continue │  │
│                                    └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Purge Modal - Step 2: Export Offer

```
┌─────────────────────────────────────────────────────────────────┐
│ 💾 Export Your Data First?                     [Red Header]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 💡 We recommend exporting your data before purging        │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Would you like to download a complete backup of all your data   │
│ before proceeding with the purge?                               │
│                                                                 │
│ • Backup will be saved as a JSON file                          │
│ • Can be imported later to restore your data                   │
│ • Includes all records, settings, and relationships            │
│ • Takes only a few seconds                                     │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Last chance: After this step, you won't be able to    │  │
│ │    export the data.                                        │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                  ┌────────────────┐ ┌──────────────────────┐  │
│                  │ Skip Export    │ │ Export Data First    │  │
│                  └────────────────┘ └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Purge Modal - Step 3: Final Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔥 Final Confirmation Required                  [Red Header]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🔥 THIS IS YOUR FINAL WARNING                            │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ To confirm the permanent deletion of all 8,150 records, type    │
│ the following phrase exactly:                                   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │                        THE PURGE                          │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Type 'THE PURGE' to confirm                               │  │
│ │                                                           │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ❌ Text doesn't match. Please type exactly: THE PURGE          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                            ┌──────────┐ ┌──────────────────┐  │
│                            │ Cancel   │ │ Purge All Data   │  │
│                            └──────────┘ └──────────────────┘  │
│                                         (disabled until text   │
│                                          matches)               │
└─────────────────────────────────────────────────────────────────┘
```

## Purge Modal - Step 4: Purging

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗑️ Purging Data...                             [Red Header]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌───────────────────┐                       │
│                    │                   │                       │
│                    │    ⏳ Spinner    │                       │
│                    │                   │                       │
│                    └───────────────────┘                       │
│                                                                 │
│                  Clearing data stores                           │
│                       15 / 20                                   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│        Please wait while all data is being permanently          │
│                        deleted...                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   Purging in progress...                        │
└─────────────────────────────────────────────────────────────────┘
```

## Purge Modal - Step 5: Complete

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Data Purged Successfully                    [Red Header]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │              ✅ Data Purge Complete                       │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Records deleted: 8,150                                         │
│ Stores cleared: 20                                             │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ℹ️ The page will reload automatically to complete the    │  │
│ │    reset.                                                  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                       ┌───────────────────┐   │
│                                       │ Close & Reload    │   │
│                                       └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Export Progress Indicator

When exporting data in Settings:

```
┌─────────────────────────────────────────────────────────────────┐
│ 💾 Database Management                                         │
│                                                                 │
│ ┌─────────────────────┐                                        │
│ │ ⏳ Exporting...     │                                        │
│ └─────────────────────┘                                        │
│                                                                 │
│ Toast: "Exporting all data..."                                 │
│                                                                 │
│ (After completion)                                              │
│ Toast: "Data exported successfully! 8,150 records saved."      │
│ File: datm-backup-2025-10-20.json (downloaded)                 │
└─────────────────────────────────────────────────────────────────┘
```

## Import Progress Indicator

When importing data in Settings:

```
┌─────────────────────────────────────────────────────────────────┐
│ 💾 Database Management                                         │
│                                                                 │
│ ┌─────────────────────┐                                        │
│ │ ⏳ Importing...     │                                        │
│ └─────────────────────┘                                        │
│                                                                 │
│ Importing timelogs... 15 / 20                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ (After completion)                                              │
│ Toast: "Successfully imported 8,150 records!"                  │
│ (Page reloads automatically)                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Color Coding

- **Purple Sections**: Database management, backup/restore (safe operations)
- **Red Sections**: Danger zones, permanent deletion warnings
- **Green**: Success states, completion messages
- **Blue**: Informational messages, recommendations
- **Amber/Yellow**: Warnings, important notes

## Interaction States

### Buttons

**Enabled:**
```
┌─────────────────────┐
│ 💾 Export All Data  │  ← Normal state
└─────────────────────┘
```

**Disabled (during operation):**
```
┌─────────────────────┐
│ ⏳ Exporting...     │  ← Grayed out, cursor not-allowed
└─────────────────────┘
```

**Disabled (text mismatch):**
```
┌──────────────────┐
│ Purge All Data   │  ← Grayed out, opacity 50%
└──────────────────┘
```

### Text Input (Final Confirmation)

**Empty:**
```
┌───────────────────────────────────────┐
│ Type 'THE PURGE' to confirm           │
└───────────────────────────────────────┘
```

**Invalid:**
```
┌───────────────────────────────────────┐
│ the purge                             │
└───────────────────────────────────────┘
❌ Text doesn't match. Please type exactly: THE PURGE
```

**Valid:**
```
┌───────────────────────────────────────┐
│ THE PURGE                             │
└───────────────────────────────────────┘
✅ Purge button enabled
```

## Toast Notifications

**Success:**
```
┌────────────────────────────────────────────────┐
│ ✅ Data exported successfully! 8,150 records  │
│    saved.                                      │
└────────────────────────────────────────────────┘
```

**Info:**
```
┌────────────────────────────────────────────────┐
│ ℹ️  Exporting all data...                     │
└────────────────────────────────────────────────┘
```

**Error:**
```
┌────────────────────────────────────────────────┐
│ ❌ Failed to export data                      │
└────────────────────────────────────────────────┘
```

## Responsive Design

### Desktop (> 768px)
- Statistics in 4-column grid
- Buttons side-by-side
- Full-width modal (max 2xl)

### Mobile (< 768px)
- Statistics in 2-column grid
- Buttons stacked vertically
- Full-screen modal with padding

---

**Visual Design Principles:**

1. **Progressive Disclosure:** Show warnings progressively, building severity
2. **Clear Hierarchy:** Visual weight increases with danger level
3. **Consistent Icons:** Emojis for quick recognition
4. **Color Psychology:** Red = danger, Purple = management, Green = success
5. **Accessibility:** High contrast, clear labels, proper ARIA roles
6. **Feedback:** Always show progress and completion states
7. **Reversibility:** Export option before purge (last chance)
8. **Confirmation:** Multiple confirmations for destructive actions
