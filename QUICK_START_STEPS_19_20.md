# Quick Start Guide — Steps 19 & 20

## Step 19: Testing Accessibility Features

### 1. Test Keyboard Navigation
1. Start the dev server: `npm run dev`
2. Navigate to any page in the app
3. Press `Tab` repeatedly to cycle through interactive elements
4. Verify visible focus outlines (blue ring) on all buttons, inputs, and links
5. Press `Enter` or `Space` to activate focused elements

### 2. Test Global Hotkeys
Open the app and try these keyboard shortcuts:

| Hotkey | Expected Result |
|--------|----------------|
| `Ctrl/Cmd+K` | Toast: "Quick find activated" |
| `Alt+T` | Toast: "Timer hotkey pressed (Alt+T)" |
| `Alt+P` | Toast: "Pause hotkey pressed (Alt+P)" |
| `Alt+S` | Toast: "Stop hotkey pressed (Alt+S)" |
| `Alt+A` | Toast: "Quick add TimeLog hotkey pressed (Alt+A)" |
| `Esc` | Closes mobile navigation (if open) |

**Note**: Timer controls and quick add/find modals are placeholders (TODOs).

### 3. Test High-Contrast Theme
1. Navigate to **Settings**
2. Scroll to "Performance & Low-End" section
3. Check **"High-contrast theme"**
4. Verify:
   - Background turns black
   - Text turns white
   - Interactive elements have yellow borders/outlines
   - Theme persists after page reload

### 4. Test ARIA Attributes (Screen Reader)
If you have a screen reader installed (NVDA, JAWS, VoiceOver):
1. Enable the screen reader
2. Navigate through forms and interactive elements
3. Verify all inputs have proper labels
4. Verify toast notifications are announced
5. Verify hotkey feedback is announced

---

## Step 20: Testing Performance & Demo Data

### 1. Enable Dev Mode
Open the browser console (`F12`) and run:
```javascript
window.__DEV_MODE__ = true
```
Then refresh the page.

### 2. Load Demo Data
1. Navigate to **Settings**
2. Scroll to the blue "Load Demo Data (Dev Only)" section
3. Click **"Load Demo Data"** button
4. Confirm the prompt
5. Wait ~30-60 seconds for completion
6. **Refresh the page** when complete

You should now see:
- 5,000 TimeLogs on the **Time** page
- 300 Clients on the **Clients** page
- 500 Deals on the **Deals** page
- 400 Invoices on the **Invoices** page
- 600 Payments on the **Payments** page
- 1,000 Activities (visible in client details)
- 500 Expenses on the **Expenses** page

### 3. Test Memory Usage
1. Open Chrome DevTools (`F12`)
2. Press `Cmd/Ctrl+Shift+P` → type "Show Performance Monitor" → press Enter
3. Navigate to each page and note the "JS heap size"
4. Expected: ≤ 250 MB per page

**Routes to test:**
- Dashboard
- Time
- Clients
- Deals
- Invoices
- Payments
- Expenses
- Products
- Reports
- Settings

### 4. Test Scrolling Performance
1. Keep Performance Monitor open
2. Navigate to **Time** page (5k TimeLogs)
3. Scroll through the list rapidly
4. Monitor "Frames per second"
5. Expected: ≥ 50 FPS during scrolling

**Also test:**
- Clients → Activities tab (scroll activities)
- Invoices → Open/close invoice details
- Reports → Toggle date ranges

### 5. Test Low-End Mode
1. Navigate to **Settings**
2. Check **"Low-end mode"**
3. Navigate to **Reports** page
4. Verify charts have no animations
5. Navigate to **Time** page
6. Verify memory usage is reduced by ~20-30%

### 6. Test Export Performance (Advanced)
1. Open Chrome DevTools → Performance tab
2. Click ⚙️ gear icon → select "CPU: 4× slowdown"
3. Navigate to **Reports** page
4. Select "Last 12 months" date range
5. Click **"Export CSV"** button
6. Measure time from click to download completion
7. Expected: < 2s (even on 4× CPU throttle)

---

## Quick Validation Checklist

### Step 19 — Accessibility
- [ ] Tab key cycles through all interactive elements
- [ ] Focus outlines are visible and clear
- [ ] Global hotkeys trigger toast notifications
- [ ] High-contrast theme applies globally
- [ ] High-contrast theme persists after reload
- [ ] ARIA labels present on all form inputs

### Step 20 — Performance
- [ ] Dev mode enabled successfully
- [ ] Demo data loads within 60 seconds
- [ ] All 5k TimeLogs visible on Time page
- [ ] All 300 Clients visible on Clients page
- [ ] Memory usage ≤ 250 MB on all routes
- [ ] Scrolling FPS ≥ 50 on Time page
- [ ] Low-end mode reduces memory usage
- [ ] Export completes in < 2s (4× CPU throttle)

---

## Troubleshooting

### Dev Mode Not Working
- Ensure you typed `window.__DEV_MODE__ = true` exactly (case-sensitive)
- Refresh the page after setting the flag
- Check browser console for errors

### Demo Data Not Loading
- Check browser console for errors
- Verify IndexedDB is not disabled
- Try clearing browser cache and reloading
- Check available disk space

### Memory Exceeds 250 MB
- Enable Low-End Mode in Settings
- Close other browser tabs
- Clear browser cache
- Disable browser extensions

### FPS Below 50
- Enable Low-End Mode (disables chart animations)
- Reduce browser zoom level
- Close background applications
- Check CPU usage in Task Manager

### Export Takes Too Long
- Reduce date range in Reports filter
- Verify Worker implementation (if applicable)
- Check for CPU throttling in DevTools

---

## Next Steps

After validating all features:
1. Review `PERFORMANCE_TESTING.md` for detailed test procedures
2. Review `STEPS_19_20_IMPLEMENTATION_SUMMARY.md` for complete feature list
3. Report any issues or performance regressions
4. Consider implementing TODOs (Quick Find modal, Timer controls, etc.)

---

**Need Help?** Check the full documentation:
- `PERFORMANCE_TESTING.md` — Comprehensive performance testing guide
- `STEPS_19_20_IMPLEMENTATION_SUMMARY.md` — Complete implementation details
- `PERFORMANCE.md` — Performance budgets and optimization strategies

---

**Last Updated**: October 17, 2025
