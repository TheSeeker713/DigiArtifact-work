# 🚨 CRITICAL: DATABASE PURGE INSTRUCTIONS

## ⚠️ MANDATORY BEFORE EVERY DEBUG TASK

**YOU MUST PURGE THE DATABASE BEFORE TESTING ANY FIX!**

---

## Quick Purge (Console Method)

1. **Open Browser DevTools**  
   Press `F12` or right-click → "Inspect"

2. **Go to Console Tab**

3. **Run Command**:
   ```javascript
   resetDatabase()
   ```

4. **Confirm Warning**  
   Click "OK" when prompted

5. **Wait for Reload**  
   Page will automatically reload with clean database

---

## What Gets Purged?

✅ All IndexedDB databases (WorkSessions, TimeLogs, Jobs, Clients, etc.)  
✅ localStorage  
✅ sessionStorage  
✅ All cached statistics  
✅ All offline queue items  

**Result**: Fresh, zero-record database state

---

## After Purging - Testing Checklist

### Test 1: Work Session ↔ Hours This Week Sync

1. Navigate to **Dashboard** page
2. Clock in to any job
3. Observe **Work Session** card:
   - `Total Time` should count up (e.g., `0.00h`, `0.01h`, `0.02h`)
4. Observe **Hours This Week** card:
   - Should show SAME value as `Total Time`
   - Updates every second (real-time sync)
5. **CRITICAL CHECK**: Both values must match at all times
   - ❌ Work Session: `0.03h` | Hours This Week: `0.00h` = FAIL
   - ✅ Work Session: `0.03h` | Hours This Week: `0.03h` = PASS

### Test 2: Header "Today" Display

1. After clocking in, check top header banner
2. **Right side** should show: `Today: 0.01h` (or current minutes)
3. Should update in real-time as timer runs
4. **VERIFY**: Resets to `0.00h` after database purge

### Test 3: Break Time Sync

1. Clock in → Wait 1 minute → Take Break
2. While on break:
   - `Work Time` should pause (not counting)
   - `Hours This Week` should hold steady (not increase)
3. Resume Work
4. Verify `Work Time` resumes counting
5. Clock out
6. **VERIFY**: Break time excluded from totals

---

## Troubleshooting

### Issue: `resetDatabase` is not defined

**Solution**: Refresh the page to load the utility
```javascript
window.location.reload()
```

Then try again:
```javascript
resetDatabase()
```

### Issue: Purge seems stuck

**Solution**: Manually delete databases
1. DevTools → Application tab
2. Storage → IndexedDB
3. Right-click each database → Delete
4. Storage → Local Storage → Right-click → Clear
5. Refresh page (`Ctrl+R` / `Cmd+R`)

### Issue: Hours This Week not syncing

**Check Console Logs**:
```javascript
// Should see this every second when clocked in:
// [ClockInOut] Updating live stats: { weekBucket: "...", workMinutes: X }
```

If missing, file a bug report with screenshot.

---

## Development Workflow

### Every Time You Get a Task:

```
1. ✅ PURGE DATABASE (resetDatabase())
2. ✅ Implement fix
3. ✅ PURGE DATABASE (again!)
4. ✅ Test fix
5. ✅ Report results
```

### When User Says "Ready to Ship":

- **STOP purging databases** (debugging complete)
- **PRESERVE data** for production testing
- Continue normal development

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `resetDatabase()` | Purge all data + reload |
| `debugControl.enable()` | Enable debug mode |
| `debugControl.disable()` | Disable debug mode |
| Window → Application → IndexedDB | Manual database inspection |
| Console → Network tab | Check API calls (if backend exists) |

---

**Last Updated**: FIX 12 - Real-time sync implementation  
**Next Task**: Test that Work Session `Total Time` syncs with `Hours This Week` in real-time
