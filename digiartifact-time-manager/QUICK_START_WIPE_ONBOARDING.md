# ⚡ QUICK START - Database Wipe + Onboarding

## 🗑️ STEP 1: WIPE DATABASE

Open browser console (`F12`) and run:

```javascript
wipeDatabase()
```

**What happens**:
- All 20 IndexedDB stores cleared
- localStorage cleared
- sessionStorage cleared  
- Page reloads automatically

---

## 👋 STEP 2: TEST ONBOARDING

After page reloads:

1. **Onboarding tour starts automatically** (1 second delay)
2. **Welcome screen appears** in center
3. **Click "Next →"** or press `→` arrow key
4. **Step 2**: Dashboard Overview (highlights dashboard area)
5. **Step 3**: Work Session Card (blue pulsing border)
6. **Step 4**: Hours This Week (highlights widget)
7. **Step 5**: Live Status Header (top bar)
8. **Step 6**: Navigation Sidebar (left nav)
9. **Steps 7-12**: Feature overviews
10. **Final step**: "Get Started" button

### Controls

| Action | Method |
|--------|--------|
| Next Step | "Next →" button or `→` key |
| Previous Step | "← Previous" button or `←` key |
| Skip Tour | "Skip Tour" button or `Escape` key |
| Don't Show Again | Check checkbox before completing |

---

## 🧪 VERIFY CLEAN DATABASE

```javascript
getDatabaseStats()
```

**Expected** (all zeros):
```json
{
  "people": 0,
  "clients": 0,
  "jobs": 0,
  "timelogs": 0,
  "work_sessions": 0,
  "settings": 0
  ...
}
```

---

## 🔄 RE-TEST ONBOARDING

```javascript
resetOnboarding()
```

Then reload page (`Ctrl+R` / `Cmd+R`) - tour starts again

---

## ✅ SUCCESS CRITERIA

✅ `wipeDatabase()` clears all data  
✅ Page reloads with clean database  
✅ Onboarding starts automatically  
✅ Can navigate with mouse/keyboard  
✅ Highlighting works on Dashboard elements  
✅ "Skip Tour" works  
✅ "Don't show again" persists  
✅ Tour can be restarted with `resetOnboarding()`

---

## 📚 Full Documentation

See `DATABASE_WIPE_AND_ONBOARDING.md` for:
- Complete onboarding step list
- Troubleshooting guide
- Testing checklist
- Technical details

---

**🚀 Ready to test!**
