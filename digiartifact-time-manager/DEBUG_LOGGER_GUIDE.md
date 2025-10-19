# Debug Logger Utility - Usage Guide

## Overview

The debug logger provides targeted, filterable logging for DigiArtifact Time Manager without cluttering the console with spam. Logs are prefixed by category (`[time]`, `[db]`, `[ui]`, etc.) for easy filtering in DevTools.

---

## Activation

### Method 1: URL Query Parameter (Recommended)
Add `?debug=1` to the URL:
```
http://localhost:5173/?debug=1
```

Enable specific categories only:
```
http://localhost:5173/?debug=time,db
```

### Method 2: Settings Flag (Future)
Toggle "Debug Mode" in Settings page (once implemented).

### Method 3: Browser Console
```javascript
// Enable all categories
debugControl.enable()

// Enable specific categories
debugControl.enable(['time', 'db'])

// Disable
debugControl.disable()

// Check if enabled
debugControl.isEnabled('time') // true/false
```

---

## Categories

- **`time`** - Time tracking (Clock In/Out, breaks, Pomodoro)
- **`db`** - Database operations (IndexedDB transactions)
- **`ui`** - UI events and state changes
- **`repo`** - Repository layer operations (CRUD)
- **`general`** - Miscellaneous debug info

---

## Instrumented Points

### Clock In
**Trigger**: User clicks "Clock In" button

**Log Output**:
```
[time] Clock In initiated {
  start_ts: 1697654400000,
  start_time: "2025-10-18T14:00:00.000Z",
  job_id: null,
  task_id: null,
  timer_id: null
}

[time] Clock In complete {
  session_id: "abc123",
  created_at: "2025-10-18T14:00:00.123Z"
}
```

### Take Break
**Trigger**: User clicks "Take Break" button

**Log Output**:
```
[time] Take Break initiated {
  event: "break_start",
  session_id: "abc123",
  now: 1697658000000,
  now_time: "2025-10-18T15:00:00.000Z",
  accumulated_break_ms: 0,
  previous_breaks_count: 0
}

[time] Take Break complete {
  session_id: "abc123",
  break_id: "break-xyz",
  status: "on_break"
}
```

### Resume Work
**Trigger**: User clicks "Resume Work" button

**Log Output**:
```
[time] Resume Work initiated {
  event: "break_end",
  session_id: "abc123",
  now: 1697659800000,
  now_time: "2025-10-18T15:30:00.000Z",
  current_break_ms: 1800000,
  accumulated_break_ms: 1800000,
  break_id: "break-xyz"
}

[time] Resume Work complete {
  session_id: "abc123",
  status: "active",
  total_break_minutes: 30,
  breaks_count: 1
}
```

### Clock Out
**Trigger**: User clicks "Clock Out" button

**Log Output**:
```
[time] Clock Out initiated {
  session_id: "abc123",
  end_ts: 1697672400000,
  end_time: "2025-10-18T18:30:00.000Z",
  total_elapsed_ms: 16200000,
  break_ms: 1800000,
  computed_duration_min: 270,
  break_duration_min: 30,
  net_duration_min: 240
}

[time] Clock Out complete - saved session verified {
  session_id: "abc123",
  clock_in: "2025-10-18T14:00:00.000Z",
  clock_out: "2025-10-18T18:30:00.000Z",
  total_minutes: 270,
  break_minutes: 30,
  net_minutes: 240,
  status: "completed",
  breaks_count: 1
}
```

---

## Filtering in DevTools

### Filter by Category
In Chrome/Edge/Firefox DevTools Console, use the filter box:
- Type `[time]` to see only time tracking logs
- Type `[db]` to see only database logs
- Type `[ui]` to see only UI logs

### Filter by Event
- Type `Clock In` to see clock in events
- Type `Break` to see break-related events
- Type `Clock Out` to see clock out events

---

## Viewing Stored Logs

Logs are stored in `sessionStorage` (max 100 entries) for review:

```javascript
// Get all logs
const logs = debugControl.getLogs()
console.table(logs)

// Clear logs
debugControl.clearLogs()
```

---

## Adding New Instrumentation

To add debug logging to a new component:

1. Import the logger:
```typescript
import { debugLog } from '../utils/debug'
```

2. Add logs at key points:
```typescript
debugLog.time.info('Event name', { data })
debugLog.time.warn('Warning message', { context })
debugLog.time.error('Error occurred', { error })
```

3. Choose appropriate category:
- `debugLog.time` - Time tracking
- `debugLog.db` - Database ops
- `debugLog.ui` - UI events
- `debugLog.repo` - Repository layer
- `debugLog.general` - Other

---

## Example Debugging Session

### Scenario: Clock In/Out not saving data

1. **Open app with debug enabled**:
   ```
   http://localhost:5173/?debug=time,db
   ```

2. **Open DevTools Console** (F12)

3. **Filter for time logs**:
   - Type `[time]` in filter box

4. **Clock In**:
   - Look for `Clock In initiated` log
   - Check `start_ts` is valid timestamp
   - Look for `Clock In complete` log
   - Check `session_id` is created

5. **Clock Out**:
   - Look for `Clock Out initiated` log
   - Verify `total_elapsed_ms`, `break_ms`, `computed_duration_min`
   - Look for `Clock Out complete - saved session verified` log
   - **Important**: Check saved session data matches computed values

6. **Identify Issue**:
   - If `Clock In complete` shows `session_id`, but `Clock Out complete` shows `null` → Database save failed
   - If `computed_duration_min` is wrong → Time calculation bug
   - If `saved session verified` data is missing → IndexedDB transaction error

---

## Performance Impact

- **Disabled**: Zero overhead (all checks short-circuit)
- **Enabled**: Minimal overhead (~1-2ms per log)
- **Storage**: Max 100 logs in sessionStorage (~50KB)

---

## Tips

1. **Enable only needed categories** to reduce noise:
   ```
   ?debug=time  // Only time tracking logs
   ```

2. **Use console filter** liberally:
   ```
   [time] Clock  // Only clock-related time logs
   ```

3. **Check stored logs** after reproducing bug:
   ```javascript
   debugControl.getLogs().filter(l => l.category === 'time')
   ```

4. **Clear logs** between test runs:
   ```javascript
   debugControl.clearLogs()
   ```

5. **Export logs** for bug reports:
   ```javascript
   JSON.stringify(debugControl.getLogs(), null, 2)
   ```

---

## Future Enhancements

- [ ] Settings UI toggle for debug mode
- [ ] Export logs as JSON file
- [ ] Performance timing instrumentation
- [ ] Network request logging
- [ ] State change logging (Svelte stores)
- [ ] Error boundary integration

---

**Version**: 1.0.0  
**Author**: GitHub Copilot  
**Date**: October 18, 2025
