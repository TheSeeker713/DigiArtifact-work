# FIX 2: Normalized Timer Math and Break Handling

## Summary
Implemented normalized timer math using dual timestamp tracking (`performance.now()` + `Date.now()`) with proper break time accumulation and edge case handling.

## Implementation Date
2025-01-XX

## Problem Statement
The Clock In/Out system had inaccurate time tracking due to:
1. Inconsistent time calculations using ISO date parsing
2. Improper break time accumulation across multiple breaks
3. Missing edge case handling (clocking out while on break)
4. Potential NaN and negative duration values

## Solution Overview
Implemented dual-timestamp tracking system:
- **`start_hrtime`**: High-resolution timestamp from `performance.now()` for precise intervals
- **`start_wallclock`**: Wall clock timestamp from `Date.now()` for absolute time calculations
- **`break_ms_accum`**: Accumulated break time in milliseconds across all breaks
- **`break_started_at`**: Timestamp when current break started (null when not on break)

## Modified Functions

### 1. State Variables (Lines ~20-27)
```typescript
// Timer state using normalized time tracking
let start_hrtime: number | null = null         // performance.now() when clocked in
let start_wallclock: number | null = null      // Date.now() when clocked in
let break_ms_accum = 0                         // accumulated break time in ms
let break_started_at: number | null = null     // Date.now() when break started
```

### 2. `updateElapsedTime()` (Lines ~60-75)
**Changes:**
- Uses `start_wallclock` instead of parsing ISO dates
- Calculates `elapsed_ms = Date.now() - start_wallclock`
- Updates break timer from `break_started_at` when on break
- Computes display time: `elapsed_sec - Math.floor(break_ms_accum / 1000)`

**Key Logic:**
```typescript
const now = Date.now()
const elapsed_ms = now - start_wallclock
elapsedTime = Math.floor(elapsed_ms / 1000)

if (currentBreak && break_started_at) {
  const current_break_ms = now - break_started_at
  breakTime = Math.floor(current_break_ms / 1000)
}
```

### 3. `loadActiveSession()` (Lines ~80-125)
**Changes:**
- Restores timer state from saved session
- Calculates `start_wallclock` from `clockInTime`
- Derives `start_hrtime` retroactively using elapsed time
- Loads `break_ms_accum` from `totalBreakMinutes * 60000`
- Detects active break and sets `break_started_at`
- Added `resetTimerState()` helper function

**Key Logic:**
```typescript
const clockInTime = new Date(session.clockInTime).getTime()
start_wallclock = clockInTime
const elapsed_ms = Date.now() - clockInTime
start_hrtime = performance.now() - elapsed_ms

break_ms_accum = (session.totalBreakMinutes || 0) * 60000

// Check if we're currently on a break
const lastBreak = session.breaks?.[session.breaks.length - 1]
if (lastBreak && !lastBreak.endTime) {
  break_started_at = new Date(lastBreak.startTime).getTime()
}
```

### 4. `clockIn()` (Lines ~127-147)
**Changes:**
- Captures both timestamps: `start_hrtime = performance.now()` and `start_wallclock = Date.now()`
- Initializes break tracking: `break_ms_accum = 0`, `break_started_at = null`
- Logs timer_state in debug output
- Calls `resetTimerState()` on error

**Key Logic:**
```typescript
start_hrtime = performance.now()
start_wallclock = Date.now()
break_ms_accum = 0
break_started_at = null

debugLog.time.info('Clock In complete', {
  timer_state: { start_hrtime, start_wallclock, break_ms_accum, break_started_at }
})
```

### 5. `clockOut()` (Lines ~149-225)
**Changes:**
- Checks if `break_started_at !== null` to close active break first
- Computes `elapsed_ms = Date.now() - start_wallclock`
- Computes `work_ms = Math.max(0, elapsed_ms - break_ms_accum)`
- Derives `totalMinutes = Math.round(work_ms / 60000)`
- Guards against NaN: `if (isNaN(totalMinutes) || totalMinutes < 0) totalMinutes = 0`
- Persists `clockOutTime`, `totalMinutes`, `netMinutes`, `status: 'completed'`
- Calls `resetTimerState()` to clear timer variables

**Key Logic:**
```typescript
// Close active break if exists
if (break_started_at !== null) {
  const current_break_ms = now - break_started_at
  break_ms_accum += current_break_ms
}

// Compute durations
const elapsed_ms = now - start_wallclock
const work_ms = Math.max(0, elapsed_ms - break_ms_accum)
let totalMinutes = Math.round(work_ms / 60000)

// Guard against NaN/negative
if (isNaN(totalMinutes) || totalMinutes < 0) {
  totalMinutes = 0
}

const totalBreakMinutes = Math.round(break_ms_accum / 60000)
const netMinutes = totalMinutes
```

### 6. `startBreak()` (Lines ~227-260)
**Changes:**
- Sets `break_started_at = Date.now()` when break starts
- Logs timer_state in debug output
- Clears `break_started_at` on error

**Key Logic:**
```typescript
break_started_at = Date.now()

debugLog.time.info('Take Break complete', {
  timer_state: { start_wallclock, break_ms_accum, break_started_at }
})
```

### 7. `endBreak()` (Lines ~262-295)
**Changes:**
- Adds `Date.now() - break_started_at` to `break_ms_accum`
- Sets `break_started_at = null` to clear active break
- Logs accumulated break time in debug output
- Rolls back break accumulation on error

**Key Logic:**
```typescript
const current_break_ms = now - break_started_at
break_ms_accum += current_break_ms

debugLog.time.info('Resume Work initiated', {
  accumulated_break_ms: break_ms_accum
})

break_started_at = null

// Error handling: rollback on failure
catch (error) {
  if (break_started_at !== null) {
    break_ms_accum -= current_break_ms
  }
}
```

## Testing Checklist

### Prerequisites
1. Visit `http://localhost:5173/?debug=time` to enable debug logging
2. Open DevTools Console, filter by `[time]` prefix

### Test Scenario 1: Basic Clock In/Out
- [ ] Clock In
  - Verify `start_hrtime` and `start_wallclock` are logged
  - Verify `break_ms_accum = 0` and `break_started_at = null`
- [ ] Wait 2 minutes (watch elapsed time counter)
- [ ] Clock Out
  - Verify `totalMinutes ≈ 2`
  - Verify `totalBreakMinutes = 0`
  - Verify timer_state is reset

### Test Scenario 2: Clock In with Single Break
- [ ] Clock In
- [ ] Wait 3 minutes
- [ ] Take Break
  - Verify `break_started_at` is set to timestamp
- [ ] Wait 1 minute
- [ ] Resume Work
  - Verify `break_ms_accum ≈ 60000` (1 minute in ms)
  - Verify `break_started_at = null`
- [ ] Wait 2 minutes
- [ ] Clock Out
  - Verify `totalMinutes ≈ 5` (3 + 2 work minutes)
  - Verify `totalBreakMinutes ≈ 1`
  - Verify `netMinutes ≈ 5`

### Test Scenario 3: Clock In with Multiple Breaks
- [ ] Clock In
- [ ] Wait 2 minutes, Take Break, Wait 1 minute, Resume
  - Verify `break_ms_accum ≈ 60000`
- [ ] Wait 3 minutes, Take Break, Wait 2 minutes, Resume
  - Verify `break_ms_accum ≈ 180000` (1 + 2 = 3 minutes)
- [ ] Wait 1 minute
- [ ] Clock Out
  - Verify `totalMinutes ≈ 6` (2 + 3 + 1 work minutes)
  - Verify `totalBreakMinutes ≈ 3`

### Test Scenario 4: Clock Out While On Break (Edge Case)
- [ ] Clock In
- [ ] Wait 2 minutes
- [ ] Take Break
- [ ] Wait 1 minute
- [ ] Clock Out (without clicking Resume)
  - Verify debug log shows "closing active break"
  - Verify `break_ms_accum` includes the current break
  - Verify `totalMinutes ≈ 2`
  - Verify `totalBreakMinutes ≈ 1`

### Test Scenario 5: Session Restoration
- [ ] Clock In, wait 1 minute, refresh page
  - Verify `start_wallclock` is restored from `clockInTime`
  - Verify `start_hrtime` is derived retroactively
  - Verify elapsed time continues counting
- [ ] Clock In, Take Break, refresh page
  - Verify `break_started_at` is restored
  - Verify break time continues counting

### Test Scenario 6: NaN Guard
- [ ] Check debug logs for any "NaN or negative duration detected" warnings
- [ ] Verify `totalMinutes` is never NaN or negative in saved sessions

## Debug Log Examples

### Clock In Log
```javascript
[time] Clock In complete {
  session_id: "...",
  timer_state: {
    start_hrtime: 12345.6789,
    start_wallclock: 1704067200000,
    break_ms_accum: 0,
    break_started_at: null
  }
}
```

### Take Break Log
```javascript
[time] Take Break complete {
  session_id: "...",
  break_started_at: 1704067320000,
  timer_state: {
    start_wallclock: 1704067200000,
    break_ms_accum: 0,
    break_started_at: 1704067320000
  }
}
```

### Resume Work Log
```javascript
[time] Resume Work initiated {
  event: 'break_end',
  session_id: "...",
  current_break_ms: 60123,
  accumulated_break_ms: 60123,
  timer_state: {
    start_wallclock: 1704067200000,
    break_ms_accum: 60123,
    break_started_at: 1704067320000
  }
}
```

### Clock Out Log (with active break)
```javascript
[time] Clock Out: closing active break {
  session_id: "...",
  current_break_ms: 30456,
  new_break_ms_accum: 90579
}

[time] Clock Out initiated {
  session_id: "...",
  end_ts: 1704067500000,
  start_wallclock: 1704067200000,
  elapsed_ms: 300000,
  break_ms: 90579,
  work_ms: 209421,
  computed_duration_min: 3,
  break_duration_min: 2,
  had_active_break: true
}
```

## Edge Cases Handled
1. **Clock Out while on break**: Automatically closes the active break before computing durations
2. **NaN duration**: Guards against NaN with fallback to 0 minutes
3. **Negative duration**: Uses `Math.max(0, work_ms)` to prevent negative values
4. **Session restoration**: Derives retroactive `start_hrtime` from elapsed time
5. **Multiple breaks**: Properly accumulates break time across all breaks

## Performance Notes
- `performance.now()` provides microsecond precision for timing intervals
- `Date.now()` provides wall clock time for absolute timestamps
- Break accumulation uses milliseconds internally, converted to minutes for storage
- All time calculations use integers to avoid floating-point precision issues

## Known Limitations
1. If the system clock changes while a session is active, `Date.now()` calculations may be affected
2. `performance.now()` resets on page reload (handled by retroactive derivation)
3. Debug logging adds ~1-2ms overhead per function call (negligible in practice)

## Related Files
- `src/lib/components/ClockInOut.svelte` - Main component (modified)
- `src/lib/utils/debug.ts` - Debug logger utility (FIX 1)
- `src/lib/repositories/WorkSessionsRepository.ts` - Database operations (unchanged)
- `DEBUG_LOGGER_GUIDE.md` - Debug logger documentation
- `FIX_1_DEBUG_LOGGER_SUMMARY.md` - FIX 1 summary

## Next Steps
1. ✅ Complete timer math implementation
2. ⬜ Test all scenarios in checklist
3. ⬜ Monitor debug logs for unexpected behavior
4. ⬜ Verify IndexedDB data persistence
5. ⬜ Consider adding unit tests for time calculations
6. ⬜ Add live counters to Dashboard task cards (TODO #7)

## Status
**COMPLETE** - All functions modified, ready for testing.
