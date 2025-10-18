# DigiArtifact Time Manager - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Work Sessions & Clock In/Out](#work-sessions--clock-inout)
3. [Multi-Task Tracking](#multi-task-tracking)
4. [Setting Weekly Targets](#setting-weekly-targets)
5. [Creating & Managing Jobs](#creating--managing-jobs)
6. [Time Tracking](#time-tracking)
7. [Clients & Relationships](#clients--relationships)
8. [Deals & Pipeline](#deals--pipeline)
9. [Products & Sales](#products--sales)
10. [Invoicing](#invoicing)
11. [Recording Payments](#recording-payments)
12. [Expenses](#expenses)
13. [Reports & Analytics](#reports--analytics)
14. [Settings & Preferences](#settings--preferences)

---

## Getting Started

### First Launch
When you first open DigiArtifact Time Manager:
1. The app loads in **Light Mode** by default with a beautiful glassmorphism design
2. All data is stored locally in **IndexedDB** - no internet required
3. Navigate using the sidebar menu on the left

### Interface Overview
- **Sidebar**: Main navigation (Time Manager, Cadence Control, Relationships & Pipeline, Revenue & Costs, Oversight & System)
- **Header**: Current view title, LOW-END mode toggle, and theme toggle (sun/moon icon)
- **Main Content**: Active module/view
- **Cards**: Glass-effect cards display your data with smooth animations

---

## Work Sessions & Clock In/Out

### Clocking In
1. Go to **Weekly Dashboard** (default home page)
2. Find the **Work Session** card at the top
3. Click the green **"Clock In"** button
4. The card will show:
   - Current session duration (live timer)
   - Session start time
   - **"Clock Out"** button (red)

### Clocking Out
1. Click the red **"Clock Out"** button
2. Your session is automatically saved with:
   - Start time (ISO format)
   - End time (ISO format)
   - Duration in hours
   - Week number

### Session Rules
- Only **one active session** at a time
- Sessions persist across browser refreshes (stored in IndexedDB)
- If you close the app while clocked in, the session continues
- Session data feeds into your weekly hours automatically

---

## Multi-Task Tracking

### Starting a Task
1. While **clocked in**, find the **Active Tasks** section
2. Click **"+ Start New Task"** button
3. Enter a task description (e.g., "Designing logo for Client X")
4. Click **"Start"**
5. The task timer begins immediately

### Managing Multiple Tasks
- Track up to **4 simultaneous tasks**
- Each task shows:
  - Task description
  - Elapsed time (HH:MM:SS format)
  - Pause/Resume button
  - Stop button

### Pausing & Resuming Tasks
- Click **"Pause"** on any task to temporarily stop the timer
- Paused tasks show a **"Paused"** badge in yellow
- Click **"Resume"** to continue timing
- Pause states persist across app refreshes

### Stopping a Task
- Click **"Stop"** (red button) to end a task
- The task is saved to your time log with:
  - Description
  - Total duration
  - Timestamps
- Stopped tasks are removed from the active list

### Multi-Task Tips
- Use descriptive task names for better reporting
- Pause tasks when switching context
- Stop tasks when complete to keep your active list clean
- Maximum 4 active tasks ensures focus and performance

---

## Setting Weekly Targets

### Configuring Your Weekly Goal
1. Go to **Weekly Dashboard**
2. Find the **Hours This Week** card
3. Your default target is **60.00 hours** per week
4. To change the target:
   - Go to **Settings** (bottom of sidebar)
   - Modify the weekly hours target
   - Save changes

### Understanding the Progress Display
- **Large Number**: Hours logged this week (e.g., "0.00 hrs")
- **Week Range**: Week number and date range (e.g., "Week 42 (2025-10-13 → 2025-10-20)")
- **Target**: Your weekly goal (e.g., "Target: 60.00 hrs")
- **Percentage**: Progress toward goal (e.g., "0.0% of goal")

### Weekly Reset
- Week starts on **Monday** by default
- Progress resets automatically each week
- Historical data is preserved in the time log

---

## Creating & Managing Jobs

### What are Jobs?
Jobs are client engagements or projects you want to track. Examples:
- "Website Design for ABC Corp"
- "Logo Package - Startup XYZ"
- "Monthly Retainer - Social Media"

### Creating a New Job
1. Go to **Jobs & Tasks** (sidebar)
2. Click **"+ New Job"** button
3. Fill in the form:
   - **Title**: Job name (e.g., "Freelancing")
   - **Client**: Select from dropdown (optional)
   - **Target Hours**: Estimated hours for completion (e.g., 20.00)
   - **Rate**: Hourly rate in dollars (e.g., $75.00)
   - **Description**: Project details
   - **Tags**: Categorize (e.g., "design", "urgent")
4. Click **"Create Job"**

### Viewing Jobs
Jobs appear in the **Per-Job Progress** section on the Dashboard:
- **Job Name**: Title of the job
- **Hours Progress**: X.XX / XX.XX hrs
- **Target**: Total hours allocated

### Tracking Time to Jobs
Time is automatically linked when you:
1. Create a task with the job name
2. Or manually log time entries and select the job

### Editing Jobs
1. Go to **Jobs & Tasks**
2. Click on a job card
3. Click **"Edit"** button
4. Update fields
5. Save changes

### Job States
- **Active**: Currently accepting time entries
- **Completed**: Finished, no longer tracking
- **Archived**: Historical record

---

## Time Tracking

### Manual Time Entry
1. Go to **Time & Timers**
2. Click **"+ New Time Entry"** button
3. Fill in:
   - **Date**: When you did the work
   - **Start Time**: When you started
   - **End Time**: When you finished
   - **Job**: Select associated job
   - **Description**: What you did
   - **Billable**: Yes/No toggle
4. Click **"Save Entry"**

### Viewing Time Logs
1. Go to **Time & Timers**
2. Scroll to **"Time Log"** section
3. Filter by:
   - Date range
   - Job
   - Billable status
4. Export to CSV for external analysis

### Editing Time Entries
1. Find the entry in the time log
2. Click **"Edit"** icon
3. Modify fields
4. Save changes

### Deleting Time Entries
1. Find the entry
2. Click **"Delete"** icon
3. Confirm deletion
4. Entry is permanently removed

---

## Clients & Relationships

### Creating a Client
1. Go to **Clients** (sidebar under "Relationships & Pipeline")
2. Click **"+ New Client"**
3. Fill in:
   - **Name**: Client/company name
   - **Email**: Contact email
   - **Phone**: Contact number
   - **Address**: Physical/billing address
   - **Notes**: Additional info
4. Click **"Create Client"**

### Client Activities
Track interactions:
- **Meetings**: Date, notes, outcomes
- **Emails**: Log important correspondence
- **Calls**: Phone conversation summaries

### Adding Activities
1. Open a client record
2. Click **"+ New Activity"**
3. Select activity type
4. Add date and notes
5. Save

### Billing Addresses
- Each client can have a default billing address
- Used automatically when creating invoices
- Can override per-invoice if needed

---

## Deals & Pipeline

### What are Deals?
Deals are potential projects or sales opportunities. Track them through stages:
- **Lead**: Initial contact
- **Qualified**: Genuine interest confirmed
- **Proposal**: Quote/proposal sent
- **Negotiation**: Discussing terms
- **Won**: Deal closed successfully
- **Lost**: Opportunity didn't convert

### Creating a Deal
1. Go to **Deals & Pipeline**
2. Click **"+ New Deal"**
3. Fill in:
   - **Title**: Deal name
   - **Client**: Associated client
   - **Value**: Expected revenue ($)
   - **Stage**: Current pipeline stage
   - **Expected Close Date**: Target date
   - **Notes**: Additional context
4. Save

### Moving Deals Through Stages
1. Open a deal
2. Update the **Stage** dropdown
3. Save changes
4. Deal automatically appears in new column on Kanban board

### Deal Values
- Track expected revenue
- View total pipeline value
- Calculate win rates in Reports

---

## Products & Sales

### Creating Products
1. Go to **Products & Sales**
2. Click **"+ New Product"**
3. Fill in:
   - **Name**: Product/service name
   - **SKU**: Unique identifier
   - **Description**: What it is
   - **Price**: Cost in dollars
   - **Type**: Physical, Digital, Service
4. Save

### Product Types
- **Physical**: Shipped goods
- **Digital**: Downloads, files
- **Service**: Time-based offerings

### Using Products in Invoices
When creating an invoice:
1. Click **"+ Add Line Item"**
2. Select product from dropdown
3. Quantity auto-fills price
4. Modify if needed (custom pricing)

---

## Invoicing

### Creating an Invoice
1. Go to **Invoices** (sidebar under "Revenue & Costs")
2. Click **"+ New Invoice"**
3. Fill in:
   - **Client**: Select client (pulls their billing address)
   - **Invoice Number**: Auto-generated or custom
   - **Issue Date**: When invoice is created
   - **Due Date**: Payment deadline
   - **Terms**: Payment terms (Net 30, Due on Receipt, etc.)

### Adding Line Items
Two methods:

**Method 1: From Products**
1. Click **"+ Add Product"**
2. Select product
3. Enter quantity
4. Price auto-calculates

**Method 2: Custom Line Item**
1. Click **"+ Add Custom Item"**
2. Enter description
3. Enter quantity
4. Enter unit price
5. Total calculates automatically

### Invoice Sections
- **Subtotal**: Sum of all line items
- **Tax**: Add tax rate (%) - calculates automatically
- **Discount**: Optional discount ($ or %)
- **Total**: Final amount due

### Invoice States
- **Draft**: Not sent yet, editable
- **Sent**: Issued to client, awaiting payment
- **Paid**: Payment received in full
- **Partial**: Partially paid
- **Overdue**: Past due date, unpaid
- **Cancelled**: Voided

### Sending Invoices
1. Finalize invoice details
2. Click **"Mark as Sent"**
3. Status changes to "Sent"
4. Export PDF or email directly (future feature)

### Tracking Outstanding Balance
- Dashboard shows total outstanding invoices
- Each invoice displays amount due
- Payment tracking links invoices to payments

---

## Recording Payments

### Creating a Payment Record
1. Go to **Payments** (sidebar)
2. Click **"+ New Payment"**
3. Fill in:
   - **Invoice**: Select associated invoice
   - **Amount**: Payment amount ($)
   - **Date**: When payment received
   - **Method**: Cash, Check, Credit Card, Bank Transfer, PayPal, Stripe, etc.
   - **Reference**: Check number, transaction ID
   - **Notes**: Additional details
4. Save

### Payment Methods
- Cash
- Check
- Credit Card
- Debit Card
- Bank Transfer
- PayPal
- Stripe
- Other

### Partial Payments
- Record multiple payments for one invoice
- Each payment reduces outstanding balance
- Invoice status updates automatically:
  - **Partial**: Some paid, some outstanding
  - **Paid**: Fully paid

### Payment Tracking
- View all payments in chronological order
- Filter by:
  - Date range
  - Client
  - Payment method
- Export payment history to CSV

### Reconciliation
- Compare payments received vs. invoices issued
- Identify overdue invoices
- Track payment trends by client

---

## Expenses

### Recording Expenses
1. Go to **Expenses** (sidebar)
2. Click **"+ New Expense"**
3. Fill in:
   - **Description**: What you bought
   - **Amount**: Cost in dollars
   - **Date**: When expense occurred
   - **Category**: Software, Hardware, Travel, Office Supplies, etc.
   - **Vendor**: Who you paid
   - **Payment Method**: How you paid
   - **Billable**: Can you charge this to a client?
   - **Job**: If billable, which job?
   - **Receipt**: Attach image/PDF (future feature)
4. Save

### Expense Categories
- Software & Subscriptions
- Hardware & Equipment
- Travel
- Office Supplies
- Marketing & Advertising
- Professional Services
- Utilities
- Other

### Billable Expenses
- Mark expenses as billable
- Link to specific jobs
- Include in client invoices automatically
- Track reimbursement status

### Expense Reports
- View spending by category
- Filter by date range
- Compare to budget
- Export for accounting

---

## Reports & Analytics

### Available Reports
1. **Revenue Dashboard**
   - Total revenue this month/year
   - Revenue by client
   - Revenue trends over time

2. **Time Reports**
   - Hours logged by week
   - Hours by job
   - Billable vs. non-billable breakdown

3. **Client Analysis**
   - Top clients by revenue
   - Client lifetime value
   - Active vs. inactive clients

4. **Pipeline Health**
   - Total deal value by stage
   - Win rate
   - Average time to close

5. **Expense Analysis**
   - Spending by category
   - Monthly burn rate
   - Profit margins (revenue - expenses)

### Generating Reports
1. Go to **Reports** (sidebar)
2. Select report type
3. Set date range
4. Apply filters (client, job, category)
5. Click **"Generate Report"**
6. Export as PDF or CSV

### Dashboard Widgets
The **Weekly Dashboard** shows:
- Current week hours vs. target
- Per-job progress
- Outstanding invoices
- Recent activities

---

## Settings & Preferences

### Accessing Settings
1. Click **Settings** at bottom of sidebar
2. Tabs for different categories

### General Settings
- **App Name**: Customize title
- **Business Name**: Your company/freelancer name
- **Logo**: Upload logo image
- **Theme**: Light or Dark mode default

### Time Settings
- **Weekly Target**: Default hours per week
- **Week Start Day**: Monday, Sunday, etc.
- **Time Format**: 12-hour or 24-hour
- **Decimal Hours**: Show time as 1.5 or 1:30

### Invoice Settings
- **Invoice Number Prefix**: (e.g., "INV-")
- **Starting Number**: First invoice number
- **Default Terms**: Net 30, Net 15, Due on Receipt
- **Tax Rate**: Default tax percentage
- **Currency**: USD, EUR, GBP, etc.

### Performance Settings
- **LOW-END Mode**: Toggle for slower devices
  - Disables animations
  - Reduces visual effects
  - Improves responsiveness
- **Performance Monitor**: Show FPS/memory stats (dev mode)

### Backup & Export
- **Export All Data**: Download complete IndexedDB backup (JSON)
- **Import Data**: Restore from backup file
- **Clear All Data**: Factory reset (warning: irreversible)

### About
- Version number
- GitHub repository link
- License information
- Built with Svelte, Vite, Tailwind CSS

---

## Tips & Best Practices

### For Freelancers
1. **Set realistic weekly targets** based on your availability
2. **Clock in/out daily** to track actual working hours
3. **Use multi-task tracking** when juggling clients
4. **Create jobs upfront** with target hours and rates
5. **Invoice promptly** when milestones are reached
6. **Track expenses** immediately to avoid forgetting

### For Small Agencies
1. **Create separate jobs per client project**
2. **Use deals pipeline** to forecast revenue
3. **Track team time** if multiple people use the tool
4. **Generate weekly reports** for client updates
5. **Monitor billable vs. non-billable** time ratios

### For Contractors
1. **Link time entries to jobs** for accurate invoicing
2. **Use product catalog** for recurring deliverables
3. **Track billable expenses** to pass through to clients
4. **Set payment terms** clearly on invoices
5. **Follow up on overdue invoices** using the status tracker

### Data Hygiene
- **Review time logs weekly** for accuracy
- **Close completed jobs** to keep lists manageable
- **Archive old clients** to reduce clutter
- **Back up data monthly** using export feature
- **Update job targets** as scope changes

---

## Keyboard Shortcuts

### Navigation
- `Ctrl/Cmd + K`: Quick search (future feature)
- `Ctrl/Cmd + B`: Toggle sidebar
- `Ctrl/Cmd + T`: Toggle theme (light/dark)

### Time Tracking
- `Ctrl/Cmd + I`: Clock In
- `Ctrl/Cmd + O`: Clock Out
- `Ctrl/Cmd + N`: New time entry

### Quick Actions
- `Ctrl/Cmd + S`: Save current form
- `Esc`: Close modal/dialog
- `Enter`: Submit form (when focused)

---

## Troubleshooting

### Time Not Saving
- **Issue**: Clock in/out doesn't persist
- **Solution**: Check browser IndexedDB is enabled. Clear browser cache and try again.

### Jobs Not Appearing in Dashboard
- **Issue**: Created a job but it's not showing in Per-Job Progress
- **Solution**: Ensure the job has a target hours value set. Only jobs with targets appear on Dashboard.

### Invoice Total Incorrect
- **Issue**: Invoice total doesn't match line items
- **Solution**: Check for tax or discount settings. Recalculate by editing and saving the invoice.

### Performance Issues
- **Issue**: App is slow or laggy
- **Solution**: Enable LOW-END mode in header. This disables animations and improves performance on older devices.

### Data Lost After Closing Browser
- **Issue**: All data disappears when I close the app
- **Solution**: Ensure you're not in Private/Incognito mode. IndexedDB requires normal browsing mode to persist data.

### Theme Not Saving
- **Issue**: Theme resets to dark mode every time
- **Solution**: Clear browser storage (F12 → Application → IndexedDB → Delete "datm-settings"). Refresh and set theme again.

---

## FAQ

**Q: Is my data stored in the cloud?**  
A: No. All data is stored locally in your browser's IndexedDB. Nothing is sent to external servers.

**Q: Can I use this offline?**  
A: Yes! The app works completely offline once loaded. You can even install it as a desktop app (Electron builds available on GitHub).

**Q: Can multiple people use the same account?**  
A: Currently, this is a single-user app. Data is stored per browser. Multiple users would need separate browser profiles or devices.

**Q: How do I back up my data?**  
A: Go to Settings → Backup & Export → "Export All Data". Download the JSON file and store it safely.

**Q: Can I import data from other time tracking apps?**  
A: Not directly. You can manually create entries or use the Import feature if you format your data as JSON matching the app's schema.

**Q: What browsers are supported?**  
A: Modern browsers with IndexedDB support: Chrome, Firefox, Edge, Safari (latest versions).

**Q: Is there a mobile app?**  
A: Not yet, but the web app is responsive and works on mobile browsers.

**Q: How do I calculate taxes?**  
A: The app can apply a tax rate to invoices. For tax reporting, export your revenue and expense data and consult an accountant.

**Q: Can I customize invoice templates?**  
A: Currently, invoices use a default template. Custom templates are a planned feature.

**Q: Where can I report bugs or request features?**  
A: Visit the GitHub repository (link in Settings → About) and open an issue.

---

## Support & Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Share tips and ask questions
- **Contributing**: Pull requests welcome!
- **License**: MIT License - free to use and modify

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Built with**: Svelte 5, Vite 7, Tailwind CSS 4, IndexedDB
