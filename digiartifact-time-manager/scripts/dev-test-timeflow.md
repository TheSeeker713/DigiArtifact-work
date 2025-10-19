# Dev Test Script: Time Flow System

**Purpose:** Manually verify end-to-end time tracking flow from Clock In → Break → Clock Out → Stats Update → UI Refresh.

**Prerequisites:**
- App running locally (`npm run dev`)
- Browser DevTools open (Console + Application tabs)
- At least 3 jobs created: "Freelancing", "Content", "Digital"
- Dashboard open and visible

**Test Environment:**
- Date: October 19, 2025
- Browser: Chrome/Edge (recommended for IndexedDB inspection)
- Network: Online (to test normal flow)

---

## Test 1: Basic Time Flow (Freelancing Job)

### Setup
1. **Open Dashboard**
   - Navigate to `http://localhost:5173` (or your dev port)
   - Ensure no active work session (clock out if needed)
   - Note current "Hours This Week" value (e.g., `12.45 hrs`)

2. **Check Initial State**
   - Header badge shows: **"No Active Timers"** ✅
   - Work Session card shows: **"Not clocked in"** ✅
   - Console has no errors ✅

### Step 1: Clock In
**Action:**
1. Click **"Clock In"** button in Work Session card
2. Immediately check header badge

**Expected Results:**
- ✅ Button shows "Clocking In..." briefly
- ✅ Header badge updates to **"1 Timer Active"** with green pulsing dot
- ✅ Work Session card shows:
  - Status: **"Active"** with green badge
  - Timer starts counting (e.g., `00:00:05`)
  - "Clocked In" time displays (e.g., `2:30 PM`)
- ✅ Console logs: `[ClockInOut] Clock In complete, timer started`
- ✅ Debug log entry: `Clock In initiated` with session details

**Verify in DevTools:**
1. Application → IndexedDB → `DigiArtifact-TimeManager` → `workSessions`
2. Find newest record (highest ID)
3. Check fields:
   ```json
   {
     "id": "ws-...",
     "clockInTime": "2025-10-19T14:30:00.000Z",
     "clockOutTime": null,
     "status": "active",
     "totalMinutes": undefined,
     "breaks": [],
     "totalBreakMinutes": 0
   }
   ```

### Step 2: Wait ~2 Minutes
**Action:**
1. Let timer run for approximately **2 minutes** (120 seconds)
2. Watch timer increment in real-time

**Expected Results:**
- ✅ Timer displays: `00:02:00` (± a few seconds)
- ✅ "Total Time" shows: `0.03h` (approximately)
- ✅ Header badge still shows "1 Timer Active"
- ✅ Work Session card status remains "Active"

**Tip:** Use browser console to check elapsed time:
```javascript
// Check timer state
document.querySelector('[data-testid="work-time"]')?.textContent
// Expected: "00:02:XX"
```

### Step 3: Take Break
**Action:**
1. Click **"Take Break"** button
2. Wait **10 seconds** (count slowly or use a timer)

**Expected Results:**
- ✅ Button shows "Starting..." briefly
- ✅ Work Session card shows:
  - Status: **"On Break"** with amber badge
  - Break timer starts counting (e.g., `00:00:01`, `00:00:02`, ...)
  - "Break Time" label appears
- ✅ Header badge shows **"☕ On Break"**
- ✅ Console logs: `[ClockInOut] Break started successfully`

**Verify in DevTools:**
1. Refresh IndexedDB view
2. Find your work session
3. Check `breaks` array:
   ```json
   {
     "breaks": [
       {
         "id": "break-...",
         "startTime": "2025-10-19T14:32:00.000Z",
         "endTime": null
       }
     ],
     "status": "on_break"
   }
   ```

### Step 4: Resume Work
**Action:**
1. After **10 seconds**, click **"Resume Work"** button
2. Watch status change

**Expected Results:**
- ✅ Button shows "Resuming..." briefly
- ✅ Work Session card shows:
  - Status: **"Active"** with green badge again
  - Work timer resumes (continues from ~2 minutes)
  - "Break Time" shows: `0m` (current break cleared)
  - Total break time accumulates (displays in "Break Time" summary)
- ✅ Header badge shows **"🍅 Working"**
- ✅ Console logs: `[ClockInOut] Break ended successfully`

**Verify in DevTools:**
1. Refresh IndexedDB view
2. Check `breaks` array:
   ```json
   {
     "breaks": [
       {
         "id": "break-...",
         "startTime": "2025-10-19T14:32:00.000Z",
         "endTime": "2025-10-19T14:32:10.000Z"
       }
     ],
     "status": "active",
     "totalBreakMinutes": 0  // Will update on clock out
   }
   ```

### Step 5: Wait ~1 Minute
**Action:**
1. Let timer run for approximately **1 more minute** (60 seconds)
2. Total work time should be ~3 minutes (2 min + 1 min)

**Expected Results:**
- ✅ Timer displays: `00:03:00` (± a few seconds, excluding 10s break)
- ✅ "Total Time" shows: `0.05h` (approximately 3 minutes ÷ 60)
- ✅ Work Session card still shows "Active"

### Step 6: Clock Out
**Action:**
1. Click **"Clock Out"** button
2. Observe state changes

**Expected Results:**
- ✅ Button shows "Clocking Out..." briefly
- ✅ **FIX 8 Validation:**
  - Session duration < 14 hours → No warning dialog ✅
  - If duration > 14 hours → Warning appears (not expected in this test)
- ✅ **FIX 9 State Reset:**
  - Header badge immediately updates to **"No Active Timers"** ✅
  - Work Session card shows **"Not clocked in"** ✅
  - Timer stops and resets ✅
- ✅ Success toast appears: **"✅ Clocked out successfully"** (green, 3 seconds)
- ✅ Console logs: `[ClockInOut] Clock Out complete`

**Verify in DevTools:**
1. Refresh IndexedDB view → `workSessions`
2. Find your session (status should be "completed"):
   ```json
   {
     "id": "ws-...",
     "clockInTime": "2025-10-19T14:30:00.000Z",
     "clockOutTime": "2025-10-19T14:33:10.000Z",
     "status": "completed",
     "totalMinutes": 3,
     "netMinutes": 3,
     "totalBreakMinutes": 0,
     "breaks": [{ "id": "break-...", "startTime": "...", "endTime": "..." }]
   }
   ```

3. Check `timeLogs` table:
   ```json
   {
     "id": "tl-...",
     "startDT": "2025-10-19T14:30:00.000Z",
     "endDT": "2025-10-19T14:33:10.000Z",
     "durationMinutes": 3,
     "breakMs": 10000,  // 10 seconds in milliseconds
     "weekBucket": "2025-W42",
     "jobId": "freelancing",
     "taskId": "test",
     "source": "timer"
   }
   ```

**Critical Checks:**
- ✅ `startDT` is **NOT NULL**
- ✅ `endDT` is **NOT NULL**
- ✅ `durationMinutes` ≈ **3** (±1 depending on exact timing)
- ✅ `weekBucket` matches current week (e.g., `2025-W42`)

### Step 7: Verify Stats Update (Without Page Refresh)

**Action:**
1. **DO NOT REFRESH THE PAGE**
2. Look at Dashboard cards immediately after clock out

**Expected Results (FIX 9 - Auto Stats Refresh):**

**"Hours This Week" Card:**
- ✅ Previous value: `12.45 hrs` (from setup)
- ✅ New value: `12.50 hrs` (increased by ~0.05h = 3 minutes)
- ✅ Progress bar animates to new width
- ✅ Percentage updates (e.g., `31.2%` → `31.3%`)
- ✅ **NO PAGE REFRESH REQUIRED** ✅

**"Per-Job Progress" Card (if visible):**
- ✅ "Freelancing" job shows increased hours
- ✅ Job bar grows slightly (animated transition)
- ✅ Hour count updates (e.g., `4.2h` → `4.25h`)

**Verify in Console:**
```javascript
// Check statsStore update
window.$statsStore?.weeklyTotalHours
// Expected: ~12.50 (or your new total)

window.$statsStore?.perJob?.['freelancing']
// Expected: Increased by ~3 minutes
```

**Verify in DevTools:**
1. Application → IndexedDB → `statsCache`
2. Check `weeklyTotals` record:
   ```json
   {
     "weekBucket": "2025-W42",
     "totalMinutes": 750,  // 12.5 hours * 60
     "targetMinutes": 2400,
     "lastUpdated": "2025-10-19T14:33:11.000Z"
   }
   ```

### Acceptance Criteria Summary

| Criteria | Status |
|----------|--------|
| Work session created with correct timestamps | ✅ |
| Timer runs accurately in real-time | ✅ |
| Break start/end recorded correctly | ✅ |
| Clock out creates TimeLog with non-null start_dt/end_dt | ✅ |
| TimeLog duration ≈ 3 minutes (±10%) | ✅ |
| `weeklyTotalHours` increased by ~0.05h | ✅ |
| Dashboard stats update **without page refresh** | ✅ |
| Header badge clears to "No Active Timers" | ✅ |
| Success toast displayed | ✅ |
| No console errors | ✅ |

---

## Test 2: Content Job (Verify Per-Job Tracking)

### Objective
Verify that per-job tracking works correctly and multiple jobs can be tracked independently.

### Steps

1. **Clock In on "Content" Job**
   - Select Job: **Content**
   - Task: **"Blog Post"** (or any task)
   - Click "Clock In"

2. **Wait 2 Minutes**
   - Let timer run to `00:02:00`

3. **Clock Out**
   - Click "Clock Out"
   - Verify success toast

4. **Verify Stats Update**
   - Check "Hours This Week" increased by ~0.03h (2 min ÷ 60)
   - Check "Per-Job Progress":
     - **"Content"** job shows new hours (e.g., `2.0h` → `2.03h`)
     - **"Freelancing"** job unchanged from Test 1 (still `4.25h`)
     - Job bars reflect correct proportions

5. **Verify in IndexedDB**
   - `timeLogs`: New record with `jobId: "content"`
   - `statsCache` → `perJobTotals`:
     ```json
     {
       "freelancing": 255,  // 4.25h * 60 (from Test 1)
       "content": 122,      // 2.03h * 60 (new)
       // ...
     }
     ```

### Acceptance Criteria

| Criteria | Status |
|----------|--------|
| TimeLog created for "Content" job | ✅ |
| Content job hours increased | ✅ |
| Freelancing job hours unchanged | ✅ |
| Weekly total increased by ~0.03h | ✅ |
| Per-job bars show correct proportions | ✅ |

---

## Test 3: Digital Job (Third Job Verification)

### Objective
Confirm system handles multiple jobs correctly and stats aggregate properly.

### Steps

1. **Clock In on "Digital" Job**
   - Select Job: **Digital**
   - Task: **"Website Tweaks"**
   - Click "Clock In"

2. **Wait 1.5 Minutes**
   - Let timer run to `00:01:30` (90 seconds)

3. **Clock Out**
   - Click "Clock Out"
   - Verify success toast

4. **Verify All Jobs Tracked**
   - Check "Hours This Week":
     - Test 1: +0.05h (Freelancing, 3 min)
     - Test 2: +0.03h (Content, 2 min)
     - Test 3: +0.025h (Digital, 1.5 min)
     - **Total increase: ~0.105h** (6.5 minutes ÷ 60)
   - Check "Per-Job Progress":
     - **Freelancing**: `4.25h` (unchanged)
     - **Content**: `2.03h` (unchanged)
     - **Digital**: New entry, `0.025h` (1.5 min)
   - Verify all job bars visible and proportional

5. **Verify in IndexedDB**
   - `timeLogs`: 3 total records (one per test)
   - `statsCache` → `perJobTotals`:
     ```json
     {
       "freelancing": 255,  // 4.25h * 60
       "content": 122,      // 2.03h * 60
       "digital": 1.5       // 0.025h * 60 = 1.5 min
     }
     ```

### Acceptance Criteria

| Criteria | Status |
|----------|--------|
| TimeLog created for "Digital" job | ✅ |
| Digital job appears in per-job stats | ✅ |
| Previous jobs unchanged | ✅ |
| Weekly total reflects all 3 sessions | ✅ |
| Per-job bars show all 3 jobs | ✅ |

---

## Known Pitfalls & Troubleshooting

### 🔴 Pitfall 1: System Clock Changes During Session

**Scenario:**
- User clocks in at 2:30 PM
- System clock manually changed to 3:00 PM
- User clocks out
- **Result:** Duration calculated as 30 minutes instead of actual elapsed time

**Why It Happens:**
- `Date.now()` uses system clock (wall clock time)
- Clock changes affect timestamp-based calculations

**How to Detect:**
- Check console for warnings: `Clock Out: NaN or negative duration detected`
- TimeLog `durationMinutes` is 0, negative, or unexpectedly large

**How to Prevent:**
- Use `performance.now()` for high-resolution timing (already implemented in FIX 2)
- Avoid changing system clock during testing
- If testing clock changes, note expected vs actual duration

**Workaround (if it happens):**
1. Check DevTools → Application → IndexedDB → `workSessions`
2. Manually calculate correct duration from `clockInTime` and `clockOutTime`
3. If needed, delete bad TimeLog and recreate manually

---

### 🔴 Pitfall 2: Browser Tab Sleep/Throttling

**Scenario:**
- User clocks in
- Browser tab becomes inactive (user switches to another app)
- Browser throttles JavaScript timers
- Timer appears to "freeze" or run slowly
- User returns after 5 minutes, but timer shows only 2 minutes

**Why It Happens:**
- Browsers throttle `setInterval()` in inactive tabs (runs ~1/minute instead of 1/second)
- Timer display lags, but database timestamps remain accurate

**How to Detect:**
- Timer display updates slowly when tab regains focus
- Sudden "jump" in elapsed time when tab becomes active
- Console logs show timer update intervals > 1 second

**How to Prevent:**
- Keep Dashboard tab active during short test sessions
- Use browser setting to prevent tab suspension (Chrome: `chrome://flags/#intensive-throttling-non-current-tabs`)
- Pin the tab to reduce throttling risk

**Important:**
- **Clock out time is ALWAYS accurate** (uses `Date.now()` at the moment of click)
- **Timer display may lag, but stored duration is correct**
- Verify final `totalMinutes` in IndexedDB, not timer display

**Example:**
```
Timer Display: 00:02:15 (lagged due to throttling)
Actual Elapsed: 5 minutes (from clockInTime to clockOutTime)
Stored Duration: 5 minutes ✅ (correct)
```

---

### 🔴 Pitfall 3: Network Disconnection During Clock Out

**Scenario:**
- User clicks "Clock Out"
- Network is offline or IndexedDB write fails
- **FIX 9 Error Recovery** should activate

**Expected Behavior:**
- ⚠️ Error toast appears: **"Failed to save clock out"**
- Two action buttons:
  - **"Retry Save"** - Attempts clock out again
  - **"Save Locally"** - Backs up to localStorage
- Timer state preserved (user still clocked in)

**How to Test:**
1. Clock in normally
2. Open DevTools → Network → Set throttle to "Offline"
3. Click "Clock Out"
4. Verify error toast with action buttons
5. Click "Retry Save" → Should fail again (still offline)
6. Set network back to "Online"
7. Click "Retry Save" → Should succeed ✅

**Verify Backup:**
1. After clicking "Save Locally":
   - Check DevTools → Application → Local Storage
   - Find key: `clockout_backup`
   - Value should be JSON with session data:
     ```json
     {
       "session": { "id": "ws-...", "clockInTime": "...", ... },
       "clockOutTime": "2025-10-19T14:35:00.000Z",
       "timerState": { "start_wallclock": 1729..., "break_ms_accum": 0, "elapsedTime": 180 }
     }
     ```

---

### 🔴 Pitfall 4: Multiple Dashboard Tabs Open

**Scenario:**
- User opens Dashboard in two browser tabs
- Clocks in from Tab 1
- Tab 2 still shows "Not clocked in"

**Why It Happens:**
- `workSessionStore` is not shared across tabs (in-memory state)
- Each tab maintains separate store instance

**Current Behavior:**
- Tab 1: Shows active session ✅
- Tab 2: Shows "Not clocked in" until refresh ⚠️

**Workaround:**
- Refresh Tab 2 (F5) to reload from IndexedDB
- Use only one tab for active development/testing

**Future Enhancement (not implemented yet):**
- BroadcastChannel API to sync state across tabs
- Service Worker to manage global state
- WebSocket for real-time updates

---

### 🔴 Pitfall 5: Break Time Not Excluded from Total

**Scenario:**
- User clocks in, works 2 minutes
- Takes 10-second break
- Resumes, works 1 minute
- Clocks out
- Expected: 3 minutes total (2 + 1, excluding 10s break)
- Actual: Shows 3 minutes 10 seconds ❌

**Why It Happens (if it occurs):**
- FIX 2 Timer Math should handle this correctly
- If bug exists, check `break_ms_accum` calculation

**How to Verify:**
1. Check IndexedDB → `workSessions`:
   ```json
   {
     "totalMinutes": 3,
     "totalBreakMinutes": 0,  // Should show break duration
     "netMinutes": 3          // Should equal totalMinutes - breaks
   }
   ```

2. Check `timeLogs`:
   ```json
   {
     "durationMinutes": 3,
     "breakMs": 10000  // 10 seconds = 10,000 ms
   }
   ```

**Expected:**
- `totalMinutes` = work time only (excludes breaks)
- `breakMs` = total break duration in milliseconds
- Duration calculation: `work_ms = elapsed_ms - break_ms_accum`

---

### 🔴 Pitfall 6: Stats Not Updating After Clock Out

**Scenario:**
- User clocks out successfully
- "Hours This Week" doesn't change
- Page refresh shows correct updated hours

**Why It Happens:**
- FIX 9 should call `recomputeWeekAggregates()` automatically
- If stats don't update, check for errors in console

**How to Debug:**
1. Open Console
2. Look for: `[ClockInOut] Clock Out complete`
3. Look for: `Dashboard: Stats recomputed successfully`
4. If missing, check for errors in `recomputeWeekAggregates()`

**Manual Fix:**
1. Open browser console
2. Run:
   ```javascript
   const { recomputeWeekAggregates } = await import('./lib/services/statsAggregationService.js')
   await recomputeWeekAggregates()
   console.log('Stats manually recomputed')
   ```

**Verify Fix:**
- "Hours This Week" should update immediately
- If still broken, refresh page (F5)

---

### 🔴 Pitfall 7: Week Boundary Crossing

**Scenario:**
- Current time: Sunday 11:59 PM
- User clocks in
- Works for 5 minutes (crosses into Monday 12:04 AM)
- User clocks out
- **Question:** Which week does the time belong to?

**Expected Behavior (FIX 8):**
- Time attributed to **START date** (Sunday)
- TimeLog `weekBucket` = Sunday's week (e.g., `2025-W42`)
- Even though clock out is Monday, hours count for previous week

**How to Verify:**
1. Check TimeLog in IndexedDB:
   ```json
   {
     "startDT": "2025-10-19T23:59:00.000Z",  // Sunday
     "endDT": "2025-10-20T00:04:00.000Z",    // Monday
     "weekBucket": "2025-W42",               // Sunday's week
     "durationMinutes": 5
   }
   ```

2. Check stats:
   - Hours added to **Week 42** (Sunday's week)
   - **NOT** added to Week 43 (Monday's week)

**If Wrong:**
- Check `timeBuckets.ts` → `getWeekLabel()` is called with `startDT`, not `endDT`
- Verify FIX 8 implementation

---

### 🟡 Pitfall 8: Timezone Confusion

**Scenario:**
- Developer in New York (EST)
- Database stores UTC timestamps
- UI shows local time
- Confusion about which hours count for "today"

**How System Works (FIX 5):**
- **Storage:** All timestamps in UTC (ISO 8601 format)
- **Display:** Converted to user's local timezone
- **Week Calculation:** Uses user's timezone for week boundaries

**Example:**
```
User in New York (EST = UTC-5)
Clocks in at 8:00 AM EST
Stored as: "2025-10-19T13:00:00.000Z" (UTC)
Displayed as: "8:00 AM" (local)

Week Bucket Calculation:
- Uses local timezone to determine week start
- Monday 12:00 AM EST = Week boundary
- NOT Monday 12:00 AM UTC
```

**How to Verify:**
1. Check Settings → Week Start Day
2. Verify timezone detected correctly (browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`)
3. Check `timeLogs` → `weekBucket` matches expected week for local time

---

## Success Checklist

After completing all 3 tests, verify:

- [ ] **Test 1 (Freelancing):**
  - [ ] Clock in/out works
  - [ ] Break tracking works
  - [ ] Timer displays correctly
  - [ ] TimeLog created with valid data
  - [ ] Stats updated without refresh
  - [ ] Header badge cleared

- [ ] **Test 2 (Content):**
  - [ ] Per-job tracking works
  - [ ] Content job hours increased
  - [ ] Freelancing job hours unchanged
  - [ ] Weekly total correct

- [ ] **Test 3 (Digital):**
  - [ ] Third job tracked correctly
  - [ ] All 3 jobs visible in stats
  - [ ] Per-job bars proportional
  - [ ] Total hours = sum of all jobs

- [ ] **IndexedDB Validation:**
  - [ ] 3 `workSessions` (all status: "completed")
  - [ ] 3 `timeLogs` (all with non-null start_dt, end_dt)
  - [ ] `statsCache` contains updated weekly and per-job totals

- [ ] **UI State Validation (FIX 9):**
  - [ ] Header badge updates immediately
  - [ ] Work Session card resets to "Not clocked in"
  - [ ] Stats refresh without page reload
  - [ ] No ghost "1 Timer Active" badge

- [ ] **Error Recovery Validation:**
  - [ ] Offline clock out shows Retry/Save Locally
  - [ ] Retry mechanism works
  - [ ] Save Locally backs up to localStorage

- [ ] **No Console Errors:**
  - [ ] No red errors in console
  - [ ] No "Cannot find name" TypeScript errors
  - [ ] No "Uncaught" exceptions

---

## Reporting Issues

If any test fails, report with:

1. **Test Number & Step:** (e.g., "Test 1, Step 6: Clock Out")
2. **Expected Behavior:** (from this script)
3. **Actual Behavior:** (what you observed)
4. **Console Errors:** (copy full error message)
5. **IndexedDB State:** (screenshot or JSON export)
6. **Browser & Version:** (e.g., "Chrome 118.0.5993")
7. **Reproducible Steps:** (can you make it happen again?)

**Example Issue Report:**
```
Test 1, Step 7: Stats Not Updating

Expected: "Hours This Week" increases by ~0.05h without page refresh
Actual: "Hours This Week" unchanged (still shows 12.45 hrs)

Console Error:
  [ClockInOut] Failed to recompute stats after clock out: TypeError: ...

IndexedDB:
  - workSessions: status "completed" ✅
  - timeLogs: Record created ✅
  - statsCache: weeklyTotals NOT updated ❌

Browser: Chrome 118.0.5993.89
Reproducible: Yes, happens every time

Workaround: Manual page refresh shows correct hours
```

---

## Advanced Testing (Optional)

### Test Long Session Validation (FIX 8)

1. **Manually Set Clock In Time (Past):**
   - Use browser console to manipulate DB
   - Set `clockInTime` to 20 hours ago
   - Click "Clock Out"
   - **Expected:** Warning dialog appears (session > 14 hours)
   - User must confirm or cancel

### Test Multi-Day Session

1. Clock in Friday 11:00 PM
2. Clock out Saturday 1:00 AM (2 hours later)
3. Verify `weekBucket` = Friday's week (FIX 8)
4. Hours attributed to Friday, not Saturday

### Test Concurrent Timers

1. Clock in (Work Session)
2. Start Pomodoro Timer
3. Both timers run simultaneously
4. Header badge shows "2 Timers Active"
5. Clock out Work Session
6. Header badge shows "1 Timer Active" (Pomodoro only)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-19 | 1.0 | Initial dev test script created |
| | | FIX 8, 9 validation steps added |
| | | Known pitfalls documented |

---

## Notes for Future Enhancements

- [ ] Add automated Playwright tests based on these manual steps
- [ ] Create visual regression tests for stat updates
- [ ] Add performance benchmarks for stats computation
- [ ] Test with 1000+ TimeLogs (load testing)
- [ ] Test with multiple concurrent users (if multi-user support added)

---

**Happy Testing!** 🧪✅
