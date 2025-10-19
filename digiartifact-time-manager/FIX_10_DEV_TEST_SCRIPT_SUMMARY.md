# FIX 10: Dev Test Script & Acceptance Steps

## Summary
Created comprehensive manual testing script (`scripts/dev-test-timeflow.md`) for validating end-to-end time tracking flow with detailed acceptance criteria and known pitfalls documentation.

## Implementation Date
October 19, 2025

## Deliverable

**File:** `scripts/dev-test-timeflow.md`

**Purpose:** Provide developers with step-by-step manual testing instructions to validate the complete time flow system from Clock In → Break → Clock Out → Stats Update → UI Refresh.

## Script Contents

### Test Coverage

**3 Main Test Scenarios:**
1. **Test 1: Basic Time Flow (Freelancing Job)**
   - Clock in → Wait 2 min → Break 10s → Resume → Wait 1 min → Clock out
   - Verify TimeLog creation with non-null timestamps
   - Verify duration ≈ 3 minutes
   - Verify stats update without page refresh

2. **Test 2: Content Job (Per-Job Tracking)**
   - Clock in → Wait 2 min → Clock out
   - Verify per-job hours increase
   - Verify other jobs unchanged
   - Verify job bars update proportionally

3. **Test 3: Digital Job (Third Job Verification)**
   - Clock in → Wait 1.5 min → Clock out
   - Verify all 3 jobs tracked correctly
   - Verify weekly total = sum of all jobs
   - Verify per-job stats accurate

### Validation Points

**Each Test Validates:**
- ✅ Work session created with correct timestamps
- ✅ Timer runs accurately in real-time
- ✅ Break start/end recorded correctly (Test 1 only)
- ✅ Clock out creates TimeLog with:
  - Non-null `startDT`
  - Non-null `endDT`
  - Correct `durationMinutes`
  - Correct `weekBucket`
- ✅ `weeklyTotalHours` increased by expected amount
- ✅ Dashboard stats update **without page refresh** (FIX 9)
- ✅ Header badge clears to "No Active Timers" (FIX 9)
- ✅ Success toast displayed
- ✅ No console errors

### Known Pitfalls Documented

**8 Common Pitfalls with Solutions:**

1. **🔴 System Clock Changes During Session**
   - Problem: Manual clock change affects duration calculation
   - Detection: Check for NaN or negative duration warnings
   - Prevention: Avoid changing system clock during tests
   - Note: `performance.now()` mitigates this (FIX 2)

2. **🔴 Browser Tab Sleep/Throttling**
   - Problem: Inactive tabs throttle `setInterval()` → timer display lags
   - Detection: Timer updates slowly, sudden "jump" on focus
   - Important: **Clock out time always accurate** (uses `Date.now()`)
   - Prevention: Keep Dashboard tab active during tests

3. **🔴 Network Disconnection During Clock Out**
   - Problem: IndexedDB write fails when offline
   - Expected: FIX 9 error recovery activates
   - Features: Retry Save / Save Locally options
   - Verification: Check localStorage for backup data

4. **🔴 Multiple Dashboard Tabs Open**
   - Problem: `workSessionStore` not shared across tabs
   - Current Behavior: Each tab has separate store instance
   - Workaround: Refresh second tab to reload from IndexedDB
   - Future: BroadcastChannel API for cross-tab sync

5. **🔴 Break Time Not Excluded from Total**
   - Problem: Break duration incorrectly added to work time
   - Verification: Check `netMinutes = totalMinutes - breaks`
   - FIX 2 should handle this correctly

6. **🔴 Stats Not Updating After Clock Out**
   - Problem: `recomputeWeekAggregates()` not called
   - Detection: Check console for stats recompute log
   - Manual Fix: Run `recomputeWeekAggregates()` in console
   - FIX 9 should call this automatically

7. **🔴 Week Boundary Crossing**
   - Problem: Session starts Sunday night, ends Monday morning
   - Expected: Time attributed to **START date** (Sunday) - FIX 8
   - Verification: Check `weekBucket` matches Sunday's week
   - Important: Use `startDT` for week calculation, not `endDT`

8. **🟡 Timezone Confusion**
   - Problem: UTC storage vs local display
   - System Design:
     - Storage: UTC timestamps (ISO 8601)
     - Display: User's local timezone
     - Week Calculation: User's timezone (FIX 5)
   - Verification: Check Settings → Week Start Day

## Step-by-Step Example (Test 1)

### Setup
```
1. Open Dashboard (no active session)
2. Note current "Hours This Week" (e.g., 12.45 hrs)
3. Check header badge shows "No Active Timers"
```

### Step 1: Clock In
```
Action: Click "Clock In"
Expected:
  - Header badge → "1 Timer Active" ✅
  - Work Session card → "Active" with green badge ✅
  - Timer starts counting (00:00:05) ✅
  - Console: "[ClockInOut] Clock In complete" ✅
```

### Step 2-5: Wait, Break, Resume, Wait
```
Action: Let timer run 2 min → Break 10s → Resume → Wait 1 min
Expected:
  - Timer displays: 00:03:00 (±5s) ✅
  - Break recorded in IndexedDB ✅
  - Total work time ≈ 3 minutes ✅
```

### Step 6: Clock Out
```
Action: Click "Clock Out"
Expected:
  - Header badge → "No Active Timers" immediately ✅
  - Work Session card → "Not clocked in" ✅
  - Success toast: "✅ Clocked out successfully" ✅
  - Console: "[ClockInOut] Clock Out complete" ✅
```

### Step 7: Verify Stats (NO PAGE REFRESH)
```
Expected:
  - "Hours This Week": 12.45 hrs → 12.50 hrs (+0.05h) ✅
  - Progress bar animates to new width ✅
  - Per-job "Freelancing" increases ✅
  - NO manual refresh required (FIX 9) ✅
```

### Verify in IndexedDB
```json
// workSessions table
{
  "clockInTime": "2025-10-19T14:30:00.000Z",
  "clockOutTime": "2025-10-19T14:33:10.000Z",
  "status": "completed",
  "totalMinutes": 3,
  "netMinutes": 3
}

// timeLogs table
{
  "startDT": "2025-10-19T14:30:00.000Z",  // ✅ NOT NULL
  "endDT": "2025-10-19T14:33:10.000Z",    // ✅ NOT NULL
  "durationMinutes": 3,                   // ✅ ≈ 3 minutes
  "weekBucket": "2025-W42",
  "breakMs": 10000
}

// statsCache table
{
  "weekBucket": "2025-W42",
  "totalMinutes": 750,  // 12.5 hours * 60 (increased)
  "lastUpdated": "2025-10-19T14:33:11.000Z"
}
```

## Acceptance Criteria Summary

| Criteria | Test 1 | Test 2 | Test 3 |
|----------|--------|--------|--------|
| Work session created | ✅ | ✅ | ✅ |
| Timer accurate | ✅ | ✅ | ✅ |
| Break tracked | ✅ | N/A | N/A |
| TimeLog non-null timestamps | ✅ | ✅ | ✅ |
| Duration correct | ✅ | ✅ | ✅ |
| Weekly total increased | ✅ | ✅ | ✅ |
| Stats update without refresh | ✅ | ✅ | ✅ |
| Header badge cleared | ✅ | ✅ | ✅ |
| Per-job tracking | ✅ | ✅ | ✅ |
| Multiple jobs tracked | N/A | ✅ | ✅ |

## Success Checklist

**After all 3 tests:**
- [ ] 3 `workSessions` in IndexedDB (all "completed")
- [ ] 3 `timeLogs` with valid data
- [ ] `statsCache` updated correctly
- [ ] Header badge works correctly (FIX 9)
- [ ] Stats refresh automatically (FIX 9)
- [ ] No console errors
- [ ] Per-job bars show all 3 jobs
- [ ] Weekly total = sum of individual sessions

## Issue Reporting Template

```
Test Number & Step: Test 1, Step 6: Clock Out
Expected Behavior: Header badge clears to "No Active Timers"
Actual Behavior: Badge still shows "1 Timer Active"
Console Errors: [paste error messages]
IndexedDB State: [screenshot or JSON]
Browser & Version: Chrome 118.0.5993
Reproducible: Yes/No
Workaround: [if any]
```

## Related Fixes Validated

- **FIX 2:** Timer Math Normalization (break exclusion)
- **FIX 3:** IndexedDB Persistence Validation (data storage)
- **FIX 5:** Timezone-Aware Week Calculations (week buckets)
- **FIX 6:** Dashboard Subscription Pattern (reactive stats)
- **FIX 8:** Week Boundary Policy (start date attribution)
- **FIX 9:** UI State Resets (auto stats refresh, badge clearing)

## Advanced Testing (Optional)

**Additional Scenarios:**
- Long session validation (>14 hours) - FIX 8
- Multi-day session (Friday night → Saturday) - FIX 8
- Concurrent timers (Work Session + Pomodoro)
- Offline clock out (Retry/Save Locally) - FIX 9
- Multi-tab synchronization

## Future Enhancements

- [ ] Automated Playwright tests based on manual steps
- [ ] Visual regression tests for stat updates
- [ ] Performance benchmarks (stats computation)
- [ ] Load testing (1000+ TimeLogs)
- [ ] Multi-user testing (if applicable)

## Files Created

**New File:**
- `scripts/dev-test-timeflow.md` - Comprehensive manual test script

**Contains:**
- Prerequisites and setup instructions
- 3 detailed test scenarios
- Step-by-step acceptance criteria
- IndexedDB validation queries
- 8 known pitfalls with solutions
- Success checklist
- Issue reporting template
- Browser DevTools usage guide

## Benefits

1. **Standardized Testing:**
   - Consistent test process across developers
   - Clear acceptance criteria for each step
   - Repeatable test scenarios

2. **Quality Assurance:**
   - Validates entire time flow system
   - Catches integration issues
   - Verifies FIX 8 and FIX 9 implementations

3. **Documentation:**
   - Known pitfalls prevent common mistakes
   - Troubleshooting guide for failures
   - Reference for future automated tests

4. **Developer Onboarding:**
   - New developers can validate setup
   - Learn system behavior through testing
   - Understand expected vs actual behavior

## Status
**COMPLETE** - Comprehensive dev test script created with 3 test scenarios, detailed acceptance criteria, and 8 known pitfalls documented.
