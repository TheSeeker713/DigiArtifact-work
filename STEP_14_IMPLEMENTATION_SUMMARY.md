# Step 14 — Expenses & Profitability Implementation

## Overview
Implemented a comprehensive expense tracking system with CRUD operations and profitability analytics that show revenue (invoiced + forecast) minus expenses across selectable date ranges.

## Components Created/Modified

### 1. Expenses Route (`src/routes/Expenses.svelte`)
**Features:**
- ✅ Full CRUD operations for expenses
- ✅ Attach expenses to jobs and/or clients
- ✅ Category-based organization (10 common categories)
- ✅ Vendor tracking
- ✅ Amount, date, and note fields
- ✅ Smart job filtering (shows only jobs for selected client)
- ✅ Real-time metrics dashboard:
  - Total expenses
  - Expense count
  - Categories tracked
  - Top category by spend
- ✅ Comprehensive expense table with inline edit/delete
- ✅ Edit mode with pre-populated form
- ✅ Validation requiring job or client attachment

**Categories Supported:**
- Materials
- Equipment
- Software
- Travel
- Meals
- Marketing
- Subcontractor
- Utilities
- Office
- Other

### 2. Profitability Widget (`src/lib/components/ProfitabilityWidget.svelte`)
**Features:**
- ✅ Reusable component for job or client profitability analysis
- ✅ Configurable date range selector (defaults to last 90 days)
- ✅ Four key metrics:
  1. **Invoiced Revenue**: Sum of invoice items within date range
  2. **Forecast Revenue**: Unbilled time logs × hourly rate
  3. **Expenses**: Total expenses within date range
  4. **Net Profit**: (Invoiced + Forecast) - Expenses
- ✅ Profit margin percentage calculation
- ✅ Color-coded profit display (green for positive, red for negative)
- ✅ Breakdown showing unbilled hours and rate
- ✅ Loads data dynamically based on jobId or clientId prop

**Props:**
- `jobId?: string` - Show profitability for a specific job
- `clientId?: string` - Show profitability for a client (all jobs)
- `defaultRate: number` - Hourly rate for forecasting unbilled time

### 3. Jobs Page Enhancement (`src/routes/Jobs.svelte`)
**Changes:**
- ✅ Added `ProfitabilityWidget` import
- ✅ Embedded profitability widget at the bottom of each job card
- ✅ Uses job-specific rate for forecast calculations
- ✅ Shows real-time profit/loss for each job

### 4. Clients Page Enhancement (`src/routes/Clients.svelte`)
**Changes:**
- ✅ Added `ProfitabilityWidget` import
- ✅ Embedded profitability widget between client details and tabs
- ✅ Shows aggregate profitability across all client jobs
- ✅ Uses default rate of $75/hour for forecast calculations

## Data Flow

### Expense Tracking
```
User Input → ExpenseForm → expensesRepo.create/update
                                ↓
                          IndexedDB Storage
                                ↓
                    Expense List (sorted by date)
```

### Profitability Calculation
```
Date Range Selection
        ↓
Load Data (Expenses, Invoices, InvoiceItems, TimeLogs)
        ↓
Filter by Date Range
        ↓
Calculate:
  • Invoiced = Σ(InvoiceItem.amount)
  • Forecast = Σ(TimeLog.hours × rate) for unbilled logs
  • Expenses = Σ(Expense.amount)
  • Profit = (Invoiced + Forecast) - Expenses
  • Margin = (Profit / TotalRevenue) × 100
        ↓
Display Metrics
```

## Repository Integration

### Existing Repos Used
- `expensesRepo` - CRUD operations with job/client indexes
- `invoicesRepo` - Fetch invoices by client
- `invoiceItemsRepo` - Fetch line items for revenue calculation
- `timeLogsRepo` - Fetch unbilled time for forecast
- `clientsRepo` - Client dropdown data
- `jobsRepo` - Job dropdown data

### Index Queries
- `expensesRepo.listByJob(jobId)` - Get expenses for a job
- `expensesRepo.listByClient(clientId)` - Get expenses for a client
- `invoicesRepo.listByClient(clientId)` - Get client invoices

## Validation & Error Handling

### Expenses Form
- ✅ Amount must be > 0
- ✅ Must attach to either job or client
- ✅ Date required
- ✅ Edit mode cancel/reset
- ✅ Confirmation dialog for delete

### Profitability Widget
- ✅ Handles missing data gracefully
- ✅ Loading state during data fetch
- ✅ Date validation
- ✅ Zero-division protection for margin calculation
- ✅ Filters out deleted/soft-deleted records

## UI/UX Features

### Responsive Design
- ✅ Grid layouts adapt to screen size
- ✅ Mobile-friendly forms
- ✅ Horizontal scroll for large tables
- ✅ Collapsible sections

### Visual Feedback
- ✅ Loading states
- ✅ Toast notifications for success/error
- ✅ Color-coded metrics (green profit, red loss)
- ✅ Disabled states during save operations
- ✅ Inline edit mode visual distinction

### Accessibility
- ✅ Semantic HTML
- ✅ Label associations
- ✅ Keyboard navigation
- ✅ Clear button states
- ✅ Confirmation dialogs for destructive actions

## Testing Checklist

### Expenses CRUD
- [x] Create expense with job attachment
- [x] Create expense with client attachment
- [x] Edit existing expense
- [x] Delete expense with confirmation
- [x] Validate amount > 0
- [x] Validate job or client required
- [x] Job list filters by selected client

### Profitability Widget
- [x] Shows invoiced revenue correctly
- [x] Calculates forecast from unbilled time
- [x] Sums expenses in date range
- [x] Computes net profit accurately
- [x] Displays profit margin percentage
- [x] Updates on date range change
- [x] Handles empty data gracefully

### Integration
- [x] Widget displays on job cards
- [x] Widget displays on client detail page
- [x] Uses correct rates per job
- [x] Aggregates client data properly
- [x] No TypeScript errors
- [x] No Svelte compile errors
- [x] Passes `npm run check`

## Performance Considerations

### Optimization
- ✅ Indexed queries for expense lookups
- ✅ Client-side filtering for date ranges
- ✅ Reactive computations for real-time updates
- ✅ Minimal re-renders with targeted bindings

### Scalability
- ✅ Handles large expense lists with pagination-ready table
- ✅ Efficient date-based filtering
- ✅ Cached lookups (clientLookup, jobLookup)
- ✅ Async loading with error boundaries

## Future Enhancements (Not Implemented)
- Export expenses to CSV
- Expense receipt attachments
- Budget tracking and alerts
- Category-based expense limits
- Multi-currency support
- Expense approval workflows
- Profitability charts/graphs
- Historical trend analysis
- Expense vs. budget comparison
- Tax category mapping

## Files Modified
1. `src/routes/Expenses.svelte` - Complete rewrite with full CRUD
2. `src/lib/components/ProfitabilityWidget.svelte` - New component
3. `src/routes/Jobs.svelte` - Added profitability widget
4. `src/routes/Clients.svelte` - Added profitability widget

## Files Unchanged (Already Existed)
- `src/lib/repos/expensesRepo.ts` - Repository with job/client indexes
- `src/lib/types/entities.ts` - ExpenseRecord type definition

## Build Status
✅ All TypeScript checks pass
✅ All Svelte checks pass
✅ No compilation errors
✅ Ready for production build
