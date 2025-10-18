# Performance Testing Guide — STEP 20

This document provides instructions for validating performance guardrails in the DigiArtifact Time Manager after loading demo data.

## Objectives

1. **Memory Steady-State**: Ensure memory usage ≤ 250 MB across all routes
2. **Responsive Interactions**: Validate smooth list scrolling, chart rendering, and navigation
3. **Export Performance**: Verify 10k row exports complete < 2s on CPU-throttled environment

## Prerequisites

### 1. Enable Dev Mode

Open the browser console and run:
```javascript
window.__DEV_MODE__ = true
```

Then refresh the page. This will enable the "Load Demo Data" button in Settings.

### 2. Load Demo Data

1. Navigate to **Settings**
2. Click **"Load Demo Data"** button
3. Confirm the prompt
4. Wait 30-60 seconds for data generation and loading
5. Refresh the page after completion

**Generated Data:**
- 5,000 TimeLogs (distributed across jobs, past year)
- 300 Clients (with billing info, tags, notes)
- ~600 Jobs (1-3 per client)
- ~500 Deals (distributed across clients)
- 400 Invoices (distributed across clients)
- ~600 Payments (1-2 per invoice)
- ~1,000 Activities (2-5 per client)
- 500 Expenses (distributed across jobs)

## Performance Test Suite

### Test 1: Memory Steady-State

**Goal**: Memory usage ≤ 250 MB per route after stabilization

**Steps:**
1. Open Chrome DevTools → Performance Monitor (Cmd/Ctrl+Shift+P → "Show Performance Monitor")
2. Navigate to each main route:
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
3. For each route, wait 5 seconds for initial render
4. Scroll through lists if present
5. Note the "JS heap size" after stabilization

**Expected Results:**
- Each route should stabilize at ≤ 250 MB
- No memory leaks (heap size should not continuously grow)
- Low-end mode should reduce memory footprint by ~20-30%

**Troubleshooting:**
- If memory exceeds 250 MB, enable Low-End Mode in Settings
- Check VirtualList is rendering for TimeLogs, Payments, Expenses
- Verify chart animations are disabled in Low-End Mode

---

### Test 2: Responsive Interactions

**Goal**: Smooth 60 FPS scrolling, chart rendering, and navigation

**Steps:**
1. Open Chrome DevTools → Performance Monitor
2. Monitor "Frames per second" metric
3. Test each interaction:
   - **Time page**: Scroll through 5k TimeLogs (virtualized)
   - **Clients page**: Navigate between client tabs, scroll activities
   - **Invoices page**: Open/close invoice details
   - **Reports page**: Toggle between date ranges, view charts
   - **Products page**: Switch between Products/Sales tabs
4. Navigate between routes rapidly (5-10 times)

**Expected Results:**
- FPS should maintain ≥ 50 FPS during scrolling
- FPS should stabilize at 60 FPS when idle
- No janky animations or delayed interactions
- VirtualList should render only visible rows (~20-30 at a time)

**Troubleshooting:**
- Enable Low-End Mode to disable chart animations
- Verify Performance Monitor overlay is functioning
- Check for console errors or warnings

---

### Test 3: Export Performance (CPU-Throttled)

**Goal**: 10k row exports complete < 2s on 4× CPU throttled environment

**Setup:**
1. Open Chrome DevTools → Performance tab
2. Click ⚙️ gear icon → "CPU: 4× slowdown"
3. Navigate to **Reports** page

**Steps:**
1. Select "Last 12 months" date range
2. Ensure 5k+ TimeLogs are visible
3. Click **"Export CSV"** button
4. Measure time from click to download completion
5. Verify CSV file contains all data

**Expected Results:**
- Export completes in < 2s on 4× CPU throttle
- CSV file is well-formed and complete
- No UI blocking during export (should use Web Worker)
- Progress indicator or toast notification on completion

**Troubleshooting:**
- If export takes > 2s, check Worker implementation
- Verify data is batched and streamed
- Check for unnecessary processing or data transformations

---

### Test 4: Low-End Mode Validation

**Goal**: Verify low-end mode optimizations reduce memory and improve FPS

**Steps:**
1. Navigate to **Settings**
2. Toggle **"Low-end mode"** on
3. Repeat Tests 1 and 2 above
4. Compare memory and FPS metrics

**Expected Results:**
- Memory usage reduced by ~20-30%
- FPS maintained at ≥ 50 during scrolling
- Chart animations disabled
- VirtualList rendering visible rows only

---

### Test 5: High-Contrast Theme (Accessibility)

**Goal**: Verify high-contrast theme applies globally and improves accessibility

**Steps:**
1. Navigate to **Settings**
2. Toggle **"High-contrast theme"** on
3. Navigate through all routes
4. Verify contrast ratios meet WCAG AA standards

**Expected Results:**
- All text and interactive elements have sufficient contrast
- Focus outlines are visible and clear
- Theme persists across page reloads

---

## Performance Budgets

| Metric | Target | Critical |
|--------|--------|----------|
| Memory per route | ≤ 250 MB | ≤ 350 MB |
| FPS (scrolling) | ≥ 50 FPS | ≥ 30 FPS |
| FPS (idle) | 60 FPS | ≥ 50 FPS |
| Export 10k rows (4× CPU) | < 2s | < 4s |
| Time to Interactive (TTI) | < 3s | < 5s |
| First Contentful Paint (FCP) | < 1.5s | < 2.5s |

## Automated Testing (Optional)

### Lighthouse CI

Run Lighthouse in DevTools:
1. Open DevTools → Lighthouse tab
2. Select "Performance" and "Accessibility"
3. Click "Generate report"
4. Verify scores:
   - Performance: ≥ 85
   - Accessibility: ≥ 90

### Profiling Memory Leaks

1. Open DevTools → Memory tab
2. Take heap snapshot before navigation
3. Navigate through all routes
4. Take heap snapshot after navigation
5. Compare snapshots for retained objects

---

## Verification Checklist

- [ ] Memory steady-state ≤ 250 MB on all routes
- [ ] FPS ≥ 50 during scrolling on all routes
- [ ] Export 10k rows < 2s on 4× CPU throttle
- [ ] Low-end mode reduces memory by ~20-30%
- [ ] High-contrast theme applies globally
- [ ] VirtualList renders only visible rows
- [ ] No memory leaks detected
- [ ] Lighthouse Performance score ≥ 85
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Global hotkeys functional (Alt+T/P/S/A, Ctrl/Cmd+K)

---

## Known Limitations

1. **Web Worker Export**: Not yet implemented (TODO in STEP 20)
2. **Quick Find Modal**: Hotkey registered but modal not implemented (TODO)
3. **Timer Global Controls**: Hotkeys registered but timer control from global scope not implemented (TODO)
4. **VirtualList Integration**: Currently applied to Time page only; not yet integrated into Payments/Expenses tables (Optional)

---

## Troubleshooting

### Memory Exceeds 250 MB
- Enable Low-End Mode
- Clear browser cache and reload
- Check for console errors or warnings
- Verify IndexedDB is not corrupted

### FPS Below 50
- Enable Low-End Mode (disables chart animations)
- Reduce browser zoom level
- Close other tabs/applications
- Check for CPU throttling in DevTools

### Export Takes > 2s
- Verify Web Worker implementation (if implemented)
- Check for excessive data transformations
- Reduce date range to test with smaller dataset
- Verify CSV generation is optimized

---

## Next Steps

After validating all performance metrics:
1. Document any regressions or issues
2. Optimize bottlenecks as needed
3. Consider implementing Web Worker for exports (if not done)
4. Integrate VirtualList into Payments/Expenses tables (optional)
5. Implement Quick Find modal and Timer global controls (optional)

---

**Last Updated**: Step 20 — Test Data & Performance Tests
