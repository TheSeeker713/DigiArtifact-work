# Performance Budget & Low-End Mode

## Overview
DigiArtifact Time Manager is built to run on constrained hardware (≤4 cores, limited GPU). Low-end mode automatically detects or can be manually toggled to optimize performance.

## Auto-Detection
- Triggers when `navigator.hardwareConcurrency <= 4`
- Can be overridden manually in **Settings**

## Low-End Optimizations

### Charts (uPlot)
- Disables cursor interactions and chart point rendering
- Removes fill gradients and animations
- Keeps bundle size minimal (~40 KB gzipped for uPlot)

### List Virtualization
- `VirtualList.svelte` component caps visible rows to 100 by default
- Only renders visible items for large datasets (Expenses, Payments, Time Logs)
- Reduces DOM nodes and paint overhead

### Visual Overhead
- In low-end mode, reduce or disable:
  - Heavy box-shadows (`shadow-lg` → `shadow-sm`)
  - CSS filters and backdrop-blur effects
  - Complex gradients
  - (Not yet applied globally; future enhancement)

## Performance Monitor
- **Dev Tool** accessible via Settings
- Displays:
  - FPS (frames per second)
  - Heap memory usage (if available via `performance.memory`)
  - Render time estimates
- Fixed bottom-right overlay, monospace font

## Budget Guidelines

### Bundle Size
- Main bundle: **< 250 KB gzipped**
- Chart library (uPlot): **~40 KB gzipped**
- Total JS: **< 300 KB gzipped**

### Runtime Performance
- First Contentful Paint (FCP): **< 1.8s** (4× CPU throttle)
- Time to Interactive (TTI): **< 3.5s** (4× CPU throttle)
- Cumulative Layout Shift (CLS): **< 0.1**

### Lighthouse Scoring (Mobile, 4× CPU Throttle)
- Performance: **≥ 85**
- Accessibility: **≥ 95**
- Best Practices: **≥ 90**
- SEO: **≥ 90**

## Verification with DevTools

### CPU Throttling
1. Open Chrome DevTools → **Performance** tab
2. Click gear icon (⚙️) → **CPU: 4× slowdown**
3. Record a session:
   - Navigate to Reports
   - Run a report with filters
   - Export CSV
   - Verify FPS and interaction latency

### Lighthouse Audit
1. Open DevTools → **Lighthouse** tab
2. Select **Mobile** + **Simulated Throttling**
3. Run audit for the following pages:
   - `/dashboard`
   - `/reports`
   - `/invoices`
4. Check scores against budgets above

### Memory Profiling
1. Open DevTools → **Memory** tab
2. Take heap snapshot before and after:
   - Loading 1000+ time logs
   - Rendering large reports
3. Ensure heap growth is < 50 MB for typical workflows

## Recommendations
- **Pre-render static content** where possible to reduce client-side compute
- **Debounce filters** in Reports to avoid redundant worker calls
- **Use IndexedDB indexes** efficiently (already in place)
- **Avoid re-mounting heavy components** unless data changes (use `{#key}` or reactive statements)

## Future Enhancements
- Global CSS class toggle (`.low-end-mode`) to reduce shadows/filters
- Progressive Web App (PWA) manifest for install + offline caching
- Service Worker for asset caching and faster repeat visits
- Further chunking/lazy-loading for non-critical routes

---
**Last Updated:** October 17, 2025  
**Tooling:** Vite (build), Lighthouse (audit), Chrome DevTools (profile)
