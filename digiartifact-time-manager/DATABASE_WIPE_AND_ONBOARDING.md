# 🗑️ DATABASE WIPE + ONBOARDING GUIDE

## ✅ COMPLETED: Database Wipe System

### New Database Utilities Available

Open browser console (`F12`) to access:

```javascript
// Wipe all data and reload page
wipeDatabase()

// Wipe all data (no reload)
wipeAllStores()

// Get record counts for all stores
getDatabaseStats()
```

---

## 🎯 MANUAL DATABASE WIPE PROCESS

### Option 1: Console Command (Recommended)

1. **Open Browser DevTools** (`F12` or right-click → Inspect)
2. **Go to Console tab**
3. **Run**:
   ```javascript
   wipeDatabase()
   ```
4. **Page reloads automatically** with empty database

### Option 2: Check Database Stats

```javascript
getDatabaseStats()
```

**Expected Output (after wipe)**:
```json
{
  "people": 0,
  "clients": 0,
  "contacts": 0,
  "deals": 0,
  "jobs": 0,
  "tasks": 0,
  "timelogs": 0,
  "schedules": 0,
  "invoices": 0,
  "invoice_items": 0,
  "payments": 0,
  "expenses": 0,
  "products": 0,
  "product_sales": 0,
  "activities": 0,
  "form_submissions": 0,
  "work_sessions": 0,
  "active_tasks": 0,
  "settings": 0,
  "audit": 0
}
```

---

## 👋 NEW: ONBOARDING SYSTEM

### Features

✅ **Interactive Tour**: 12-step walkthrough of the app  
✅ **Smart Highlighting**: Highlights UI elements during tour  
✅ **Skip Option**: Click "Skip Tour" button or press `Escape`  
✅ **Don't Show Again**: Checkbox to disable onboarding  
✅ **Keyboard Navigation**: `←` Previous, `→` Next, `Esc` Skip  
✅ **Auto-Start**: Shows automatically for first-time users

### Onboarding Steps

1. **Welcome** - Introduction
2. **Dashboard Overview** - Command center
3. **Work Session Card** - Active timer display
4. **Hours This Week** - Weekly progress tracking
5. **Live Status Header** - Always-visible status bar
6. **Navigation Sidebar** - App navigation
7. **Time Tracking Page** - Detailed time logging
8. **Jobs & Tasks** - Project management
9. **Client Management** - Relationship tracking
10. **Reports & Analytics** - Data insights
11. **Settings & Preferences** - Customization
12. **Complete** - Ready to use!

### Manual Controls

```javascript
// Start onboarding tour manually
startOnboarding()

// Reset onboarding (will show again on next load)
resetOnboarding()
```

---

## 🧪 TESTING WORKFLOW

### Every Debug Session:

1. **Wipe Database**:
   ```javascript
   wipeDatabase()
   ```

2. **Wait for Reload** (automatic)

3. **Onboarding Starts** (first-time only)
   - Test tour by clicking through steps
   - Or skip with `Escape` key or "Skip Tour" button

4. **Test Feature** with clean database

5. **Verify**:
   ```javascript
   getDatabaseStats()
   ```

### Test Onboarding:

1. **Reset Onboarding**:
   ```javascript
   resetOnboarding()
   ```

2. **Reload Page** (`Ctrl+R` / `Cmd+R`)

3. **Tour Starts Automatically** after 1 second

4. **Navigate Through Steps**:
   - Click "Next →" button
   - Or press `→` arrow key
   - Click "← Previous" to go back
   - Press `Escape` to skip

5. **Test Highlighting**:
   - Steps 2-6 highlight specific UI elements
   - Blue pulsing border around targets
   - Tooltip positions dynamically

6. **Complete Tour**:
   - Click "Get Started" on final step
   - Check "Don't show again" if desired

---

## 📊 Database Stores

All stores wiped on `wipeDatabase()`:

- `people` - Team members
- `clients` - Client records
- `contacts` - Client contacts
- `deals` - Pipeline deals
- `jobs` - Projects/jobs
- `tasks` - Job tasks
- `timelogs` - Time entries
- `schedules` - Work schedules
- `invoices` - Invoices
- `invoice_items` - Invoice line items
- `payments` - Payment records
- `expenses` - Expense tracking
- `products` - Digital products
- `product_sales` - Product sales
- `activities` - Activity log
- `form_submissions` - Intake form submissions
- `work_sessions` - Active work sessions
- `active_tasks` - Running task timers
- `settings` - App settings
- `audit` - Audit trail

---

## 🐛 Troubleshooting

### Issue: wipeDatabase() not defined

**Solution**: Refresh page to load utility
```javascript
window.location.reload()
```

### Issue: Onboarding not showing

**Check if disabled**:
```javascript
localStorage.getItem('onboarding_completed')
// If returns 'true', onboarding is disabled
```

**Re-enable**:
```javascript
resetOnboarding()
// Then reload page
```

### Issue: Database not actually wiped

**Manual verification**:
1. DevTools → Application tab
2. Storage → IndexedDB
3. Expand "datm" database
4. Check each store - should show 0 records

**Force wipe**:
```javascript
// Delete entire database
await window.indexedDB.deleteDatabase('datm')
window.location.reload()
```

---

## 🎨 Onboarding Customization

### Position Options

Steps can be positioned:
- `center` - Center of screen (modal-style)
- `top` - Above highlighted element
- `bottom` - Below highlighted element
- `left` - Left of highlighted element
- `right` - Right of highlighted element

### Styling

- **Dark theme support** - Automatically adapts
- **Responsive** - Works on all screen sizes
- **Animations** - Smooth transitions and pulsing borders
- **Progress bar** - Visual indication of tour progress

---

## ✅ Testing Checklist

### Database Wipe

- [ ] Open console
- [ ] Run `wipeDatabase()`
- [ ] Page reloads automatically
- [ ] All stores show 0 records (`getDatabaseStats()`)
- [ ] localStorage cleared
- [ ] sessionStorage cleared

### Onboarding System

- [ ] First load shows onboarding automatically
- [ ] Can navigate with Next/Previous buttons
- [ ] Can navigate with arrow keys
- [ ] Escape key skips tour
- [ ] "Skip Tour" button works
- [ ] Highlighting shows on steps 2-6
- [ ] Tooltip positions correctly
- [ ] Progress bar updates
- [ ] "Don't show again" checkbox works
- [ ] Final step says "Get Started"
- [ ] Tour can be restarted with `startOnboarding()`

---

## 🚀 Ready for Production

When you say **"Ready to Ship"**:

1. ✅ Onboarding system is complete
2. ✅ Database wipe utilities work
3. ✅ All features tested with clean database
4. ✅ No console errors

**Then**: Stop wiping database between sessions. Users will see onboarding once, then work with persistent data.

---

**Implementation Date**: October 19, 2025  
**Features**: Database Wipe + Interactive Onboarding  
**Status**: ✅ Complete - Ready for Testing
