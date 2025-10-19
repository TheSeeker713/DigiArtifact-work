# 🔧 Testing & Database Reset Guide

## 🗑️ How to Reset Database (Zero Records)

### Method 1: Browser Console (Recommended)

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Type: `resetDatabase()`
4. Confirm the warning dialog
5. Page will reload with clean database

### Method 2: Manual IndexedDB Reset

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Right-click each database → **Delete database**
5. Go to **Local Storage** → Right-click → **Clear**
6. Go to **Session Storage** → Right-click → **Clear**
7. Reload page (Ctrl+R / Cmd+R)

### Method 3: Hard Browser Reset

1. Close ALL tabs of the app
2. Clear browser data:
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cookies" and "Cached images"
   - Time range: "All time"
3. Reopen app

---

## ⚡ Live Updates - What Should Update Automatically

### ✅ Currently Working (Real-Time)

**1. Live Status Header (Top Bar)**
- **"1 Timer Active" badge** - Shows/hides when clock in/out
- **"Working"/"On Break" status** - Updates immediately
- **Elapsed time counter** - Updates every second (HH:MM:SS)

**2. Live Timer (Time Page)**
- **Timer display** - Updates every animation frame (~60 FPS)
- **Status indicators** - "Running", "Paused", "Stopped"
- **Start/Pause/Stop buttons** - Enable/disable based on state

**3. Dashboard Widgets**
- **Hours This Week** - Updates after clock out + stats recomputation
- **Per-Job Progress** - Updates when stats recompute
- **8-Week Sparkline** - Loads on mount

**4. Multi-Task Tracker**
- **Active tasks** - Updates when tasks start/pause/stop
- **Task timers** - Update every second for each running task

### ⚠️ Requires Manual Refresh

**Time Logs List:**
- New logs appear after page refresh
- Workaround: Navigate away and back to refresh

---

## 🧪 Testing Workflow (Clean Slate)

### Step 1: Reset Database
```javascript
// In browser console
resetDatabase()
```

### Step 2: Initial Setup
1. Navigate to **Jobs** page
2. Create a job: "Test Job Alpha"
3. Navigate to **Dashboard**

### Step 3: Test Clock In/Out
1. **Click "Clock In"** button
2. ✅ **Verify:** Header shows "1 Timer Active" immediately
3. ✅ **Verify:** Timer starts counting (00:00:01, 00:00:02...)
4. **Wait 30 seconds**
5. **Click "Clock Out"** button
6. ✅ **Verify:** Header clears "1 Timer Active"
7. ✅ **Verify:** "Hours This Week" updates to "0.01 hrs"

### Step 4: Test Break System
1. **Clock in** again
2. ✅ **Verify:** Timer counting
3. **Click "Start Break"**
4. ✅ **Verify:** Status changes to "On Break"
5. ✅ **Verify:** Timer pauses (shows break time separately)
6. **Wait 15 seconds**
7. **Click "End Break"**
8. ✅ **Verify:** Status back to "Working"
9. ✅ **Verify:** Timer resumes counting work time
10. **Clock out**
11. ✅ **Verify:** "Hours This Week" increases (excludes break time)

### Step 5: Test Live Timer (/time page)
1. Navigate to **Time** page
2. **Select job** from dropdown
3. **Click "Start"** button
4. ✅ **Verify:** Timer display updates live (not stuck at 00:00:00)
5. ✅ **Verify:** Console shows `[Timer] Starting timer` log
6. **Wait 1 minute**
7. **Click "Pause"**
8. ✅ **Verify:** Timer freezes
9. **Click "Resume"** (or "Start" again)
10. ✅ **Verify:** Timer continues from where it paused
11. **Click "Stop & save"**
12. ✅ **Verify:** Success toast appears
13. ✅ **Verify:** Timer resets to 00:00:00

### Step 6: Verify Stats Updates
1. Navigate to **Dashboard**
2. ✅ **Verify:** "Hours This Week" shows cumulative time
3. ✅ **Verify:** "Per-Job Progress" shows "Test Job Alpha" with hours
4. ✅ **Verify:** Progress bar fills based on target (default 60 hrs/week)

---

## 🐛 Troubleshooting

### Problem: Timer Stuck at 00:00:00

**Symptoms:**
- Timer shows 00:00:00 even when running
- Status shows "Running" but no count

**Solutions:**
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Check console for `[Timer] Starting timer` log
3. Check console for RAF (RequestAnimationFrame) errors
4. Verify `tickCount` is incrementing (should see in React DevTools)

**Debug in Console:**
```javascript
// Check if timer is running
window.location.href.includes('time') // Should be true if on /time page

// Force timer variables (if stuck)
// Note: This is a workaround, timer should work automatically
```

### Problem: Hours This Week Not Updating

**Symptoms:**
- Clock out succeeds but stats show 0.00 hrs
- Dashboard doesn't reflect new sessions

**Solutions:**
1. **Check you're on Dashboard page** (not Time page)
   - Hours This Week widget only on Dashboard
2. **Wait 1-2 seconds** after clock out for recomputation
3. **Check console** for `[StatsAggregator] Recomputed totals` log
4. **Manual trigger** (Debug mode only):
   - Add `?debug=1` to URL
   - Click "🔄 Recalc (Debug)" button under Hours This Week

**Debug in Console:**
```javascript
// Check stats store
import { statsStore } from './lib/stores/statsStore'
import { get } from 'svelte/store'
console.log('Current stats:', get(statsStore))

// Manual recompute
import { recomputeWeekAggregates } from './lib/services/statsAggregationService'
await recomputeWeekAggregates()
```

### Problem: Database Won't Reset

**Symptoms:**
- `resetDatabase()` errors or hangs
- Old data still appears after reset

**Solutions:**
1. **Close ALL tabs** of the app
2. **Wait 5 seconds** (allows IndexedDB connections to close)
3. **Reopen ONE tab** and run `resetDatabase()` again
4. If still blocked:
   - Close browser completely
   - Reopen and try again
5. Nuclear option:
   - Browser settings → Clear all data
   - Uninstall/reinstall browser (extreme)

---

## 📊 Expected Behavior Summary

| Action | What Updates | When | Where Visible |
|--------|--------------|------|---------------|
| Clock In | Header badge, Timer | Immediately | All pages |
| Timer Running | Elapsed time | Every ~16ms (60 FPS) | Dashboard, Header |
| Start Break | Status, Break timer | Immediately | Dashboard, Header |
| End Break | Status, Work timer resumes | Immediately | Dashboard, Header |
| Clock Out | Header clears, Stats recompute | 1-2 sec | Dashboard (Hours This Week) |
| Start Live Timer (/time) | Timer display | Every frame | Time page only |
| Stop Live Timer | Log saved, Timer resets | Immediately | Time page |

---

## 🎯 Key Points for Testing

### Real-Time Updates (No Refresh Needed)
✅ Header badge (1 Timer Active)  
✅ Status changes (Working/On Break)  
✅ Timer counts (every second)  
✅ Button states (enabled/disabled)  
✅ Stats after clock out (Dashboard)

### Requires Page Navigation
⚠️ Time logs list (navigate away and back)  
⚠️ Job list updates (refresh Jobs page)

### Performance Tips
- Use Chrome/Edge (better RAF support)
- Keep DevTools open for console logs
- Close other tabs to reduce memory pressure
- Use `?debug=1` for extra logging

---

## 🔍 Debug Mode Features

Add `?debug=1` to URL to enable:

1. **Stats Recalc Button** - Force recompute on Dashboard
2. **Diagnostics Panel** - Bottom-right, shows:
   - Timer state
   - Last 10 logs
   - Week aggregates
   - Copy JSON button for bug reports
3. **Extra Console Logs** - All categories enabled
4. **Window Objects**:
   - `window.debugControl.enable()` - Enable debug logging
   - `window.debugControl.getLogs()` - View stored logs
   - `window.resetDatabase()` - Reset all data

---

## 📝 Notes

- **Database Location:** IndexedDB in browser (not server)
- **Data Persistence:** Local only, not synced to cloud
- **Reset Frequency:** As needed for testing
- **Production Use:** DO NOT use `resetDatabase()` with real data!

---

**Last Updated:** 2025-10-19  
**Version:** FIX 12 + Live Updates Enhancement
