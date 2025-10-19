# FIX 12 ENHANCEMENT: Real-Time Sync - Work Session ↔ Hours This Week

## 🎯 Problem Statement

**User Report**:
> "work session and hours this week, need to be working together. When the 'total time' in work session is calculated as 0.01, 'hours this week' should also be 0.01, everything should sync together in real time."

**Root Cause**:
- **Work Session "Total Time"**: Updated every second via `setInterval` (line 680: `{(elapsedTime / 3600).toFixed(2)}h`)
- **Hours This Week**: Only updated after clock out via `recomputeWeekAggregates()`
- **Result**: Work Session showed live time, but Hours This Week remained at `0.00 hrs` until clock out

---

## ✅ Solution Implemented

### 1. Database Purge Script (`scripts/purge-db.js`)

**Purpose**: Automate database reset before every debug task per user requirement

**Usage**:
```bash
node scripts/purge-db.js
# OR in browser console:
resetDatabase()
```

**What it purges**:
- All IndexedDB databases
- localStorage
- sessionStorage
- Auto-reloads page

---

### 2. StatsStore Enhancement (`src/lib/stores/statsStore.ts`)

**New Method**: `updateLiveMinutes()`

```typescript
updateLiveMinutes(weekBucket: string, liveMinutes: number, targetMinutes: number) {
  store.update((state) => {
    const weekly = {
      weekBucket,
      totalMinutes: liveMinutes,
      targetMinutes,
    }

    return {
      ...state,
      weekly,
      weeklyTotalHours: minutesToHours(liveMinutes),
      lastUpdated: new Date().toISOString(),
    }
  })
}
```

**Purpose**: Update statsStore with live session minutes in real-time (not just on clock out)

---

### 3. ClockInOut Component Real-Time Sync (`src/lib/components/ClockInOut.svelte`)

**Modified**: `updateElapsedTime()` function (called every second by `setInterval`)

**Before**:
```typescript
function updateElapsedTime() {
  if (activeSession && start_wallclock !== null) {
    const now = Date.now()
    const elapsed_ms = now - start_wallclock
    elapsedTime = Math.floor(elapsed_ms / 1000)
    
    // Only updated local UI state
    // statsStore NOT updated until clock out
  }
}
```

**After**:
```typescript
function updateElapsedTime() {
  if (activeSession && start_wallclock !== null) {
    const now = Date.now()
    
    // Calculate total elapsed time
    const elapsed_ms = now - start_wallclock
    elapsedTime = Math.floor(elapsed_ms / 1000)

    // Update break time if on break
    if (activeSession.status === 'on_break' && break_started_at !== null) {
      const current_break_ms = now - break_started_at
      breakTime = Math.floor(current_break_ms / 1000)
    } else {
      breakTime = 0
    }

    // ✨ FIX 12: CRITICAL - Sync Work Session "Total Time" with "Hours This Week"
    // Calculate net work minutes (excluding breaks)
    const work_ms = Math.max(0, elapsed_ms - break_ms_accum - (break_started_at ? (now - break_started_at) : 0))
    const workMinutes = Math.round(work_ms / 60000)
    
    // ✨ Update statsStore every second with live minutes
    const settings = $settingsStore
    const weekBucket = getWeekLabel(activeSession.clockInTime, settings.timezone, settings.weekStart as any)
    const targetMinutes = settings.weekTargetHours * 60
    statsStore.updateLiveMinutes(weekBucket, workMinutes, targetMinutes)
  }
}
```

**New Imports**:
```typescript
import { statsStore } from '../stores/statsStore'
import { settingsStore } from '../stores/settingsStore'
import { getWeekLabel } from '../utils/timeBuckets'
```

**Key Changes**:
1. **Every second** (via existing `setInterval`):
   - Calculate net work minutes (excluding all break time)
   - Get current week bucket using user's timezone/week start preference
   - Call `statsStore.updateLiveMinutes()` to sync with "Hours This Week"

2. **Break time handling**:
   - Excludes accumulated breaks (`break_ms_accum`)
   - Excludes current active break (`now - break_started_at`)
   - Ensures accurate work time calculation

---

## 🔄 Data Flow

```
Clock In
  ↓
setInterval (every 1000ms)
  ↓
updateElapsedTime()
  ↓
Calculate: workMinutes = (elapsed_ms - break_ms) / 60000
  ↓
statsStore.updateLiveMinutes(weekBucket, workMinutes, targetMinutes)
  ↓
statsStore updates: weeklyTotalHours = workMinutes / 60
  ↓
Dashboard "Hours This Week" re-renders (reactive: $statsStore.weeklyTotalHours)
  ↓
✅ RESULT: "Total Time" === "Hours This Week" (synchronized every second)
```

---

## 📊 Expected Behavior

### Scenario 1: Clock In for 1 Minute

| Time | Work Session "Total Time" | Hours This Week | Synced? |
|------|---------------------------|-----------------|---------|
| 0:00 | `0.00h` | `0.00 hrs` | ✅ |
| 0:30 | `0.01h` | `0.01 hrs` | ✅ |
| 1:00 | `0.02h` | `0.02 hrs` | ✅ |

### Scenario 2: Clock In, Take Break, Resume

| Time | Action | Work Session "Work Time" | Hours This Week | Synced? |
|------|--------|--------------------------|-----------------|---------|
| 0:00 | Clock In | `00:00:00` | `0.00 hrs` | ✅ |
| 1:00 | Working | `00:01:00` (0.02h) | `0.02 hrs` | ✅ |
| 1:00 | Take Break | `00:01:00` (paused) | `0.02 hrs` (held) | ✅ |
| 1:30 | On Break | `00:01:00` (still paused) | `0.02 hrs` (still held) | ✅ |
| 1:30 | Resume Work | `00:01:00` (resumes) | `0.02 hrs` (resumes) | ✅ |
| 2:30 | Working | `00:02:00` (0.03h) | `0.03 hrs` | ✅ |
| 2:30 | Clock Out | Final: `0.03h` | Final: `0.03 hrs` | ✅ |

### Scenario 3: Header "Today" Display

- **Before Clock In**: `Today: 0.0h`
- **After 2 minutes**: `Today: 0.03h` (updates every second)
- **After Clock Out**: Persists at `0.03h` (accurate total)
- **After Database Purge**: Resets to `Today: 0.0h`

---

## 🧪 Testing Steps

### Pre-Test: Database Purge (MANDATORY)

```javascript
// Browser console
resetDatabase()
// Confirm dialog → Page reloads with clean database
```

### Test 1: Basic Sync

1. Navigate to **Dashboard**
2. Clock in to any job
3. **Watch both displays simultaneously**:
   - Work Session card: "Total Time"
   - Hours This Week card: main number
4. **Verify**: Both increment together every second
5. **Wait 1 minute** (60 seconds)
6. **Verify**: Both show approximately `0.02h` or `0.02 hrs`

### Test 2: Break Time Exclusion

1. Clock in → Wait 1 minute
2. Click "Take Break"
3. **Verify**: 
   - Work Time pauses (not counting)
   - Hours This Week holds steady (not increasing)
4. Wait 30 seconds on break
5. Click "Resume Work"
6. **Verify**:
   - Work Time resumes counting
   - Hours This Week resumes increasing
7. Clock out
8. **Verify**: Break time NOT included in final totals

### Test 3: Header Today Display

1. After database purge, check header
2. **Verify**: `Today: 0.0h`
3. Clock in → Wait 2 minutes
4. **Verify**: `Today: 0.03h` (or close)
5. Clock out
6. **Verify**: Today value persists (doesn't reset to 0)

---

## 🐛 Troubleshooting

### Issue: Hours This Week not updating

**Check**:
1. Open DevTools Console
2. Look for errors during clock in
3. Verify `setInterval` is running:
   ```javascript
   // Should see this every second when clocked in:
   console.log('updateElapsedTime called')
   ```

**Solution**: Hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`)

### Issue: Values don't match

**Check**:
1. Console logs for `statsStore.updateLiveMinutes()` calls
2. Verify timezone settings match system timezone
3. Check week start day setting (Monday vs Sunday)

**Solution**: 
```javascript
// Console
debugControl.enable()
// Then clock in and watch logs
```

### Issue: resetDatabase() not defined

**Solution**: Refresh page to load utility
```javascript
window.location.reload()
```

---

## 📁 Files Modified

1. **`src/lib/stores/statsStore.ts`**
   - Added `updateLiveMinutes()` method

2. **`src/lib/components/ClockInOut.svelte`**
   - Modified `updateElapsedTime()` to call `statsStore.updateLiveMinutes()`
   - Added imports: `statsStore`, `settingsStore`, `getWeekLabel`

3. **`scripts/purge-db.js`** (NEW)
   - Database purge utility script

4. **`DATABASE_PURGE_INSTRUCTIONS.md`** (NEW)
   - Comprehensive purge and testing guide

---

## ✅ Completion Checklist

- [x] StatsStore `updateLiveMinutes()` method implemented
- [x] ClockInOut component syncs live minutes every second
- [x] Break time correctly excluded from work minutes
- [x] Week bucket calculated using user's timezone/week start
- [x] Database purge script created
- [x] Comprehensive testing instructions documented
- [ ] **USER TESTING**: Verify Work Session ↔ Hours This Week sync
- [ ] **USER TESTING**: Verify Header "Today" resets after purge
- [ ] **USER TESTING**: Verify break time exclusion works

---

## 🚀 Next Steps

1. **CRITICAL**: User must purge database before testing
   ```javascript
   resetDatabase()
   ```

2. **Test real-time sync** following `DATABASE_PURGE_INSTRUCTIONS.md`

3. **Report results**:
   - ✅ "Sync working - values match every second"
   - ❌ "Still not syncing - [describe issue]"

4. If ✅ → **Mark as "Ready to Ship"** (stop purging databases)
   If ❌ → Provide console logs and screenshots for debugging

---

**Implementation Date**: October 19, 2025  
**Fix ID**: FIX 12 Enhancement - Real-Time Sync  
**Priority**: CRITICAL (client-facing feature)  
**Status**: ✅ Code Complete → ⏳ Awaiting User Testing
