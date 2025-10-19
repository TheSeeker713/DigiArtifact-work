# DigiArtifact Time Manager - QA Checklist

## STEP 23 — FINAL QA VERIFICATION

This checklist ensures all critical features and edge cases are tested before release.

---

## ✅ Core Functionality

### Offline-First Architecture
- [ ] **No External API Calls**: Verify app loads and functions with network disabled
  - Open DevTools → Network tab → Set to "Offline"
  - Refresh page and test all features
  - Check Console for any failed fetch/XHR requests
  - Expected: Zero network requests after initial load
- [ ] **IndexedDB Persistence**: All data survives browser restart
  - Create records (job, client, invoice, time entry)
  - Close browser completely
  - Reopen and verify data is intact
- [ ] **Service Worker** (if implemented): Works offline after first visit
- [ ] **No Cloud Dependencies**: No authentication, no external storage, no analytics

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ CRUD Operations with Audit & Soft Delete

### All Entity Types
Test the following for each entity type:

**Entity Types to Test**:
- [ ] Clients
- [ ] Jobs
- [ ] Time Logs
- [ ] Invoices
- [ ] Payments
- [ ] Expenses
- [ ] Products
- [ ] Deals
- [ ] Work Sessions
- [ ] Active Tasks

**For Each Entity**:
1. **Create**
   - [ ] Record created with auto-generated UUID
   - [ ] `createdAt` timestamp populated (ISO 8601)
   - [ ] `updatedAt` timestamp populated (ISO 8601)
   - [ ] `deletedAt` is null
   - [ ] Audit log entry created with action='create'
   - [ ] Record appears in list view immediately

2. **Read**
   - [ ] `getById()` returns correct record
   - [ ] `list()` excludes soft-deleted records by default
   - [ ] `list(true)` includes soft-deleted records
   - [ ] Indexes query correctly (by status, by client, by job, etc.)

3. **Update**
   - [ ] Record updates successfully
   - [ ] `updatedAt` timestamp changes
   - [ ] `createdAt` timestamp unchanged
   - [ ] Audit log entry created with action='update', before/after values
   - [ ] UI reflects changes immediately

4. **Soft Delete**
   - [ ] `softDelete()` sets `deletedAt` timestamp
   - [ ] Record disappears from default list views
   - [ ] Record still exists in database (check IndexedDB directly)
   - [ ] Audit log entry created with action='delete'
   - [ ] Related records handle deletion gracefully (orphaned references)

5. **Audit Trail**
   - [ ] Every create/update/delete generates audit record
   - [ ] Audit record has: entity, entityId, action, timestamp, before, after
   - [ ] Audit logs queryable by entity type
   - [ ] Audit logs queryable by entity + action

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ Time Tracking Features

### Clock In/Out System
- [ ] **Clock In**
  - Creates WorkSessionRecord with status='active'
  - `clockInTime` set to current ISO timestamp
  - `clockOutTime` is null
  - Timer starts immediately
  - UI shows "Active" badge with pulsing green dot
  - Elapsed time updates every second
- [ ] **Clock Out**
  - Updates WorkSessionRecord with status='completed'
  - `clockOutTime` set to current ISO timestamp
  - `totalMinutes` calculated correctly
  - Timer stops
  - UI reverts to "Not clocked in" state
  - Session data saved to IndexedDB
- [ ] **Persistence**
  - Active session resumes after page refresh
  - Timer continues from correct elapsed time
  - Clock out works correctly after refresh
- [ ] **Edge Cases**
  - Only one active session allowed at a time
  - Cannot clock in while already clocked in
  - Cannot clock out when not clocked in
  - Session survives browser close/reopen
  - Session survives 24+ hours (multi-day work)

### Multi-Task Tracking
- [ ] **Start Task**
  - Creates ActiveTaskRecord with status='running'
  - Timer starts immediately
  - Task appears in active list
  - Up to 4 tasks can run simultaneously
- [ ] **Pause/Resume Task**
  - Pause sets status='paused', stops timer
  - Resume sets status='running', continues timer
  - Elapsed minutes accumulate correctly
  - UI shows "Paused" badge
- [ ] **Stop Task**
  - Sets status='completed'
  - Saves total elapsed minutes
  - Creates TimeLogRecord if job linked
  - Removes from active task list
- [ ] **Max Tasks**
  - Cannot start 5th task when 4 are active
  - UI shows "Max tasks reached" message
  - Can start new task after stopping one
- [ ] **Persistence**
  - Active tasks resume after page refresh
  - Paused tasks remain paused
  - Timers continue from correct elapsed time

### Time Log Overlap Guard
- [ ] **Overlap Detection**
  - Detects overlapping time entries for same person
  - Warns user before saving overlapping entry
  - Allows user to adjust times or force save
  - Example: Cannot log 2-4pm if 3-5pm already exists
- [ ] **Edge Cases**
  - Adjacent entries (4:00pm and 4:01pm) allowed
  - Same start/end time detected
  - Overnight shifts handled (11pm - 1am next day)
  - Multiple people can have same time slots (no conflict)

**Overlap Guard Implementation**:
```typescript
async function detectOverlap(personId: string, start: Date, end: Date, excludeId?: string): Promise<TimeLogRecord[]> {
  const entries = await timeLogRepo.queryByIndex('by_person', personId)
  return entries.filter(entry => {
    if (entry.id === excludeId) return false // Exclude current entry when editing
    const entryStart = new Date(entry.startTime)
    const entryEnd = new Date(entry.endTime)
    // Overlap: (start < entryEnd) AND (end > entryStart)
    return start < entryEnd && end > entryStart
  })
}
```

**Test Cases**:
- [ ] Log 2-4pm, then try 3-5pm → Overlap detected
- [ ] Log 2-4pm, then try 4-6pm → No overlap (adjacent OK)
- [ ] Log 2-4pm, then try 1-3pm → Overlap detected
- [ ] Log 2-4pm, then try 2-4pm → Overlap detected (exact match)
- [ ] Edit existing entry to create overlap → Detected

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ Financial Features

### AR Aging Buckets
Accounts Receivable aging categorizes outstanding invoices by how overdue they are.

**Buckets**:
1. **Current**: Due date in future or today
2. **1-30 Days**: 1-30 days past due
3. **31-60 Days**: 31-60 days past due
4. **61-90 Days**: 61-90 days past due
5. **90+ Days**: More than 90 days past due

**Test Data Setup**:
```typescript
const today = new Date()
const testInvoices = [
  { dueDate: addDays(today, 10), amount: 1000 },  // Current
  { dueDate: addDays(today, -15), amount: 500 },  // 1-30 days
  { dueDate: addDays(today, -45), amount: 300 },  // 31-60 days
  { dueDate: addDays(today, -75), amount: 200 },  // 61-90 days
  { dueDate: addDays(today, -120), amount: 100 }, // 90+ days
]
```

**Aging Calculation**:
```typescript
function getAgingBucket(dueDate: Date): string {
  const today = new Date()
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysOverdue < 0) return 'Current'
  if (daysOverdue <= 30) return '1-30 Days'
  if (daysOverdue <= 60) return '31-60 Days'
  if (daysOverdue <= 90) return '61-90 Days'
  return '90+ Days'
}
```

**Test Cases**:
- [ ] Invoice due tomorrow → Current bucket
- [ ] Invoice due today → Current bucket
- [ ] Invoice due yesterday → 1-30 Days bucket
- [ ] Invoice 30 days overdue → 1-30 Days bucket
- [ ] Invoice 31 days overdue → 31-60 Days bucket
- [ ] Invoice 60 days overdue → 31-60 Days bucket
- [ ] Invoice 61 days overdue → 61-90 Days bucket
- [ ] Invoice 90 days overdue → 61-90 Days bucket
- [ ] Invoice 91 days overdue → 90+ Days bucket
- [ ] Invoice 365 days overdue → 90+ Days bucket

**Dashboard Display**:
- [ ] AR Aging report shows all 5 buckets
- [ ] Total amounts per bucket calculated correctly
- [ ] Buckets sorted by urgency (Current → 90+)
- [ ] Click bucket to filter invoices
- [ ] Percentages of total AR calculated correctly

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ Pipeline & Deal Management

### Weighted Pipeline Values
Deals in different stages have different probabilities of closing.

**Stage Weights** (standard sales methodology):
- **Lead**: 10% (just discovered, low qualification)
- **Qualified**: 20% (interest confirmed, budget exists)
- **Proposal**: 50% (quote sent, active negotiation)
- **Negotiation**: 75% (terms being finalized)
- **Won**: 100% (deal closed, revenue secured)
- **Lost**: 0% (opportunity lost)

**Test Data**:
```typescript
const testDeals = [
  { stage: 'Lead', value: 10000 },        // Weighted: $1,000
  { stage: 'Qualified', value: 20000 },   // Weighted: $4,000
  { stage: 'Proposal', value: 15000 },    // Weighted: $7,500
  { stage: 'Negotiation', value: 30000 }, // Weighted: $22,500
  { stage: 'Won', value: 5000 },          // Weighted: $5,000
  { stage: 'Lost', value: 8000 },         // Weighted: $0
]
// Total Pipeline Value: $88,000
// Weighted Pipeline Value: $40,000
```

**Calculation**:
```typescript
const stageWeights = {
  Lead: 0.10,
  Qualified: 0.20,
  Proposal: 0.50,
  Negotiation: 0.75,
  Won: 1.00,
  Lost: 0.00
}

function calculateWeightedPipeline(deals: Deal[]): number {
  return deals.reduce((sum, deal) => {
    const weight = stageWeights[deal.stage] || 0
    return sum + (deal.value * weight)
  }, 0)
}
```

**Test Cases**:
- [ ] 1 Lead @ $10k → Weighted: $1k (10%)
- [ ] 1 Qualified @ $20k → Weighted: $4k (20%)
- [ ] 1 Proposal @ $15k → Weighted: $7.5k (50%)
- [ ] 1 Negotiation @ $30k → Weighted: $22.5k (75%)
- [ ] 1 Won @ $5k → Weighted: $5k (100%)
- [ ] 1 Lost @ $8k → Weighted: $0 (0%)
- [ ] Mixed pipeline → Correctly sums all weighted values
- [ ] Empty pipeline → $0
- [ ] Null/undefined values handled gracefully

**Dashboard Display**:
- [ ] Total pipeline value shown (unweighted sum)
- [ ] Weighted pipeline value shown separately
- [ ] Per-stage breakdown with counts and values
- [ ] Visual indicator (pipeline funnel or bar chart)
- [ ] Moving deal to new stage updates weighted value immediately

**Business Logic**:
- [ ] Won deals counted in revenue, not pipeline
- [ ] Lost deals removed from pipeline calculations
- [ ] Expected close date factors into forecast (future feature)

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ Performance & Optimization

### Web Worker Exports
Heavy operations like exporting large datasets should run in a Web Worker to avoid blocking the UI.

**Test with Large Datasets**:
- [ ] **1,000 Records**
  - Export completes without UI freeze
  - Progress indicator updates smoothly
  - Memory usage stays under 200MB
- [ ] **10,000 Records**
  - Export completes within 5 seconds
  - UI remains responsive (can scroll, click)
  - No browser "Page Unresponsive" warning
- [ ] **50,000 Records**
  - Export completes (may take 10-30 seconds)
  - UI fully responsive throughout
  - Browser doesn't crash or hang

**Worker Implementation Check**:
```typescript
// src/workers/data.worker.ts
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data

  if (type === 'EXPORT_DATA') {
    const { records, format } = payload
    const exported = await exportToFormat(records, format) // Heavy operation
    self.postMessage({ type: 'EXPORT_COMPLETE', data: exported })
  }
})
```

**Test Cases**:
- [ ] CSV export of all time logs (10k+ entries)
- [ ] JSON export of entire database
- [ ] PDF invoice generation (if implemented)
- [ ] Report generation with complex calculations
- [ ] Data transformation/aggregation operations

**Performance Metrics**:
- [ ] Main thread FPS stays above 50 during export
- [ ] UI interactions respond within 100ms
- [ ] Worker completes in reasonable time:
  - 1k records: < 1 second
  - 10k records: < 5 seconds
  - 50k records: < 30 seconds

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ LOW-END Mode

### Visual Reduction of Effects
LOW-END mode disables performance-heavy visual features.

**What Should Be Disabled**:
- [ ] **Animations**
  - CSS transitions removed (instant state changes)
  - Hover effects simplified (no transform/translateY)
  - Card lift animations removed
- [ ] **Backdrop Filters**
  - Glassmorphism blur effects removed
  - Solid backgrounds instead of semi-transparent
- [ ] **Shadows**
  - box-shadow removed from cards
  - Flat UI instead of layered depth
- [ ] **Gradients**
  - Linear gradients replaced with solid colors
  - Background simplified to single color

**Test Cases**:
- [ ] Toggle LOW-END mode ON
  - Header button changes to "LOW-END ON"
  - Page refreshes with optimizations applied
- [ ] **Visual Verification**
  - Cards are solid white (no glass effect)
  - No animations on hover or click
  - No shadows on any elements
  - Background is solid color (no gradient)
- [ ] **Performance Verification**
  - CPU usage decreases by 20-40%
  - RAM usage decreases by 20-50MB
  - FPS improves from 30-50 to 50-60
  - Battery life improves on laptops
- [ ] Toggle LOW-END mode OFF
  - All visual effects restored
  - Glassmorphism, animations, shadows return
  - Performance characteristics return to normal

**CSS Verification**:
```css
/* Normal mode */
.card {
  background: linear-gradient(...);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(...);
  transition: all 0.3s ease;
}

/* LOW-END mode (via body class or CSS variable) */
body.low-end .card {
  background: rgb(255, 255, 255);
  backdrop-filter: none;
  box-shadow: none;
  transition: none;
}
```

**Measurement Tools**:
- [ ] Chrome DevTools Performance tab (record 10s interaction)
  - Compare FPS: Normal mode vs. LOW-END mode
  - Compare CPU usage: Normal vs. LOW-END
- [ ] Chrome Task Manager (Shift+Esc)
  - Compare memory: Normal mode vs. LOW-END mode
- [ ] Firefox about:performance
  - Compare energy impact: Normal vs. LOW-END

**Target Metrics**:
| Metric | Normal Mode | LOW-END Mode | Improvement |
|--------|-------------|--------------|-------------|
| FPS | 40-60 | 55-60 | +15-30% |
| CPU Usage | 40-60% | 20-40% | -33% |
| Memory | 120-150MB | 80-100MB | -33% |
| Battery Impact | Medium | Low | Significant |

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ Edge Cases & Error Handling

### Data Integrity
- [ ] **UUID Uniqueness**: No duplicate IDs across entities
- [ ] **Foreign Key Integrity**: Deleting a client doesn't break jobs/invoices
- [ ] **Circular References**: Handled gracefully (e.g., job → client → contact)
- [ ] **Null/Undefined Values**: All optional fields handle null/undefined
- [ ] **Empty Strings**: Validation prevents empty required fields

### Concurrency
- [ ] **Multiple Tabs**: Changes in one tab reflect in other tabs
- [ ] **Race Conditions**: Simultaneous updates don't corrupt data
- [ ] **Transaction Conflicts**: IndexedDB transactions handle conflicts

### Browser Compatibility
- [ ] **Chrome**: All features work
- [ ] **Firefox**: All features work
- [ ] **Edge**: All features work
- [ ] **Safari**: All features work (IndexedDB quirks handled)

### Data Size Limits
- [ ] **Large Text Fields**: 10k+ character descriptions don't break UI
- [ ] **Many Records**: 10k+ entities in one store don't slow queries
- [ ] **Large Numbers**: Currency values > $1M display correctly

### Date/Time Edge Cases
- [ ] **Timezone Handling**: ISO timestamps preserve timezone
- [ ] **Daylight Saving**: Clock changes don't corrupt time logs
- [ ] **Leap Years**: Feb 29th handled correctly
- [ ] **Midnight Boundary**: 11:59pm → 12:00am transitions work

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## ✅ User Experience

### Loading States
- [ ] Skeleton screens for slow operations
- [ ] Spinners for async actions (save, delete, export)
- [ ] Disabled buttons during operations
- [ ] Progress bars for long tasks (exports, reports)

### Error Messages
- [ ] User-friendly error text (not stack traces)
- [ ] Toast notifications for success/error
- [ ] Validation errors highlighted on forms
- [ ] Graceful degradation on failures

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader tested (basic support)

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## 📊 Final QA Summary

### Test Coverage
- **Total Test Cases**: ~150
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___
- **Not Tested**: ___

### Critical Issues Found
1. 
2. 
3. 

### Known Limitations
1. **Browser Private Mode**: IndexedDB may have reduced storage limits
2. **Safari < 14**: Limited IndexedDB support
3. **Large Datasets**: >100k records may slow down queries

### Recommended Pre-Release Fixes
- [ ] Fix Clock In/Out data persistence (CRITICAL)
- [ ] Verify AR aging calculations with real dates
- [ ] Test weighted pipeline with complex scenarios
- [ ] Benchmark LOW-END mode on actual low-end device (2015 laptop)

---

## 🚀 Release Readiness

- [ ] All CRITICAL issues resolved
- [ ] All HIGH priority issues resolved
- [ ] Performance benchmarks met
- [ ] Documentation complete (user guide, dev guide, performance guide)
- [ ] README updated with screenshots
- [ ] License and attribution verified

**Ready for Release**: ⬜ Yes | ⬜ No (see issues above)

**QA Sign-Off Date**: ___________________
**QA Engineer**: ___________________

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintained by**: TheSeeker713 / DigiArtifact
