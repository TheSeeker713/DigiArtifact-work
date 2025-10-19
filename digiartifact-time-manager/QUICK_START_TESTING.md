# ⚡ QUICK START - Real-Time Sync Testing

## 🚨 STEP 1: PURGE DATABASE (MANDATORY)

Open browser console (`F12`) and paste:

```javascript
resetDatabase()
```

Click "OK" when prompted. Page will reload automatically.

---

## ✅ STEP 2: TEST REAL-TIME SYNC

1. **Navigate to Dashboard** page
2. **Clock in** to any job
3. **Watch both displays**:
   - Work Session → "Total Time"
   - Hours This Week → main number
4. **Verify**: Both values update every second and match exactly

### Expected Result:

| Time Elapsed | Work Session | Hours This Week | Status |
|--------------|--------------|-----------------|--------|
| 30 seconds | `0.01h` | `0.01 hrs` | ✅ PASS |
| 1 minute | `0.02h` | `0.02 hrs` | ✅ PASS |
| 2 minutes | `0.03h` | `0.03 hrs` | ✅ PASS |

---

## 🔍 WHAT TO VERIFY

✅ **Work Session "Total Time"** counts up: `0.00h → 0.01h → 0.02h...`  
✅ **Hours This Week** counts up: `0.00 hrs → 0.01 hrs → 0.02 hrs...`  
✅ **Both values match** at all times (synchronized every second)  
✅ **Header "Today"** shows same value as Total Time  
✅ **Break time excluded** (if you take a break, numbers pause)

---

## ❌ FAIL CONDITIONS

❌ Work Session shows `0.03h` but Hours This Week shows `0.00 hrs`  
❌ Hours This Week only updates after clock out  
❌ Need to refresh page to see updates  
❌ Break time included in totals

---

## 🐛 IF SOMETHING BREAKS

1. **Check console for errors** (`F12` → Console tab)
2. **Take screenshot** of both cards showing mismatch
3. **Copy console logs** (right-click → "Save as...")
4. **Report issue** with screenshots + logs

---

## 📚 DOCUMENTATION

- **Full Testing Guide**: `DATABASE_PURGE_INSTRUCTIONS.md`
- **Technical Summary**: `FIX_12_REALTIME_SYNC_SUMMARY.md`
- **Auto-Purge Script**: `scripts/auto-purge-console.js`

---

## 🎯 SUCCESS CRITERIA

✅ Work Session "Total Time" === Hours This Week (every second)  
✅ No refresh needed to see updates  
✅ Break time properly excluded  
✅ Header "Today" syncs with totals  
✅ Database purge resets all values to 0

---

**When all tests pass, report**: "Ready to Ship" 🚀

**If any test fails, report**: Issue description + console logs + screenshots
