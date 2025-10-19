import type {
  ClientRecord,
  DealRecord,
  JobRecord,
  TimeLogRecord,
  InvoiceRecord,
  PaymentRecord,
  ActivityRecord,
  PersonRecord,
  ExpenseRecord,
} from '../types/entities'

/**
 * Generates realistic test data for performance testing and demos.
 * Targets:
 * - 5,000 TimeLogs
 * - 300 Clients
 * - 500 Deals
 * - 400 Invoices
 * - 600 Payments
 * - 1,000 Activities
 */

const clientNames = [
  'Acme Corp', 'TechStart Inc', 'Global Ventures', 'Digital Dynamics', 'Future Systems',
  'Nova Solutions', 'Bright Ideas LLC', 'Quantum Labs', 'Zenith Partners', 'Apex Technologies',
  'Horizon Media', 'Velocity Studios', 'Precision Analytics', 'Crystal Clear Consulting',
  'Summit Strategies', 'Cascade Creative', 'Vertex Ventures', 'Nexus Networks',
  'Elevate Enterprises', 'Fusion Financial', 'Catalyst Capital', 'Momentum Marketing',
  'Synergy Solutions', 'Pioneer Productions', 'Infinite Innovations',
]

const dealStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
const activityTypes = ['Call', 'Email', 'Meeting', 'Note', 'Task']
const jobTitles = [
  'Website Redesign', 'Mobile App Development', 'Brand Identity', 'Marketing Campaign',
  'SEO Optimization', 'E-commerce Platform', 'Data Migration', 'Cloud Infrastructure',
  'UI/UX Design', 'API Integration', 'Custom Software', 'Video Production',
]

function randomDate(startDays: number, endDays: number): string {
  const now = new Date()
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000)
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return new Date(timestamp).toISOString()
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getWeekBucket(date: string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export type GeneratedTestData = {
  clients: ClientRecord[]
  jobs: JobRecord[]
  deals: DealRecord[]
  timeLogs: TimeLogRecord[]
  invoices: InvoiceRecord[]
  payments: PaymentRecord[]
  activities: ActivityRecord[]
  expenses: ExpenseRecord[]
}

export async function generateTestData(): Promise<GeneratedTestData> {
  const clients: ClientRecord[] = []
  const jobs: JobRecord[] = []
  const deals: DealRecord[] = []
  const timeLogs: TimeLogRecord[] = []
  const invoices: InvoiceRecord[] = []
  const payments: PaymentRecord[] = []
  const activities: ActivityRecord[] = []
  const expenses: ExpenseRecord[] = []

  const now = new Date().toISOString()

  // Generate 300 Clients
  for (let i = 0; i < 300; i++) {
    const clientId = randomId()
    const clientName = `${randomChoice(clientNames)} ${i + 1}`
    const createdAt = randomDate(720, 30) // 2 years to 1 month ago

    clients.push({
      id: clientId,
      name: clientName,
      billingEmail: `billing@${clientName.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `+1-555-${String(randomInt(1000, 9999))}`,
      website: `https://${clientName.toLowerCase().replace(/\s+/g, '')}.com`,
      status: randomChoice(['Active', 'Inactive', 'Prospect']),
      tags: [randomChoice(['Enterprise', 'SMB', 'Startup', 'Agency'])],
      notes: `Demo client ${i + 1}`,
      createdAt,
      updatedAt: createdAt,
    })

    // Generate 1-3 jobs per client (avg ~2 = 600 jobs)
    const numJobs = randomInt(1, 3)
    for (let j = 0; j < numJobs; j++) {
      const jobId = randomId()
      jobs.push({
        id: jobId,
        title: `${randomChoice(jobTitles)} - ${clientName}`,
        clientId,
        rate: randomInt(50, 250),
        status: randomChoice(['Active', 'Completed', 'On Hold']),
        description: `Demo job for ${clientName}`,
        createdAt,
        updatedAt: createdAt,
      })
    }

    // Generate 0-2 deals per client (avg ~1.67 = 500 deals)
    const numDeals = Math.random() < 0.33 ? 0 : Math.random() < 0.5 ? 1 : 2
    for (let d = 0; d < numDeals; d++) {
      deals.push({
        id: randomId(),
        clientId,
        title: `${randomChoice(jobTitles)} Deal - ${clientName}`,
        stage: randomChoice(dealStages),
        valueEstimate: randomInt(5000, 100000),
        probability: randomInt(10, 90),
        jobType: randomChoice(['Retainer', 'Project', 'Hourly']),
        tags: [randomChoice(['Q1', 'Q2', 'Q3', 'Q4', 'Priority', 'Standard'])],
        stageChangedAt: randomDate(90, 0),
        createdAt,
        updatedAt: createdAt,
      })
    }

    // Generate 2-5 activities per client (avg ~3.3 = 1000 activities)
    const numActivities = randomInt(2, 5)
    for (let a = 0; a < numActivities; a++) {
      activities.push({
        id: randomId(),
        clientId,
        type: randomChoice(activityTypes),
        date: randomDate(180, 0),
        summary: `${randomChoice(activityTypes)} with ${clientName} regarding demo data`,
        createdAt,
        updatedAt: createdAt,
      })
    }
  }

  // Generate 5000 TimeLogs across jobs
  for (let i = 0; i < 5000; i++) {
    const job = randomChoice(jobs)
    const startDT = randomDate(365, 0) // Past year
    const durationMinutes = randomInt(15, 480) // 15 min to 8 hours
    const endDT = new Date(new Date(startDT).getTime() + durationMinutes * 60 * 1000).toISOString()

    timeLogs.push({
      id: randomId(),
      personId: 'owner', // Default person_id
      jobId: job.id,
      taskId: null,
      startDT,
      endDT,
      durationMinutes,
      breakMs: 0, // Test data has no breaks
      note: `Demo time log ${i + 1}`,
      billable: Math.random() > 0.2, // 80% billable
      weekBucket: getWeekBucket(startDT),
      approved: Math.random() > 0.1, // 90% approved
      invoiceId: null,
      createdAt: startDT,
      updatedAt: startDT,
      deletedAt: null,
    })
  }

  // Generate 400 Invoices (distributed across clients)
  const clientsWithJobs = clients.filter(c => jobs.some(j => j.clientId === c.id))
  for (let i = 0; i < 400; i++) {
    const client = randomChoice(clientsWithJobs)
    const issueDate = randomDate(365, 0)
    const dueDate = new Date(new Date(issueDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const subtotal = randomInt(1000, 50000)
    const tax = Math.round(subtotal * 0.08)
    const total = subtotal + tax

    const invoiceId = randomId()
    invoices.push({
      id: invoiceId,
      clientId: client.id,
      issueDate,
      dueDate,
      status: randomChoice(['draft', 'sent', 'partial', 'paid', 'overdue']),
      subtotal,
      tax,
      total,
      currency: 'USD',
      notes: `Demo invoice ${i + 1}`,
      createdAt: issueDate,
      updatedAt: issueDate,
    })

    // Generate 1-2 payments per invoice (avg ~1.5 = 600 payments)
    if (Math.random() > 0.25) {
      const numPayments = Math.random() > 0.5 ? 1 : 2
      const paymentAmount = numPayments === 1 ? total : Math.round(total / 2)
      
      for (let p = 0; p < numPayments; p++) {
        const receivedDate = new Date(new Date(issueDate).getTime() + (p + 1) * 15 * 24 * 60 * 60 * 1000).toISOString()
        payments.push({
          id: randomId(),
          invoiceId,
          receivedDate,
          method: randomChoice(['Wire', 'ACH', 'Check', 'Credit Card', 'PayPal']),
          amount: paymentAmount,
          reference: `REF-${randomId().substring(0, 8)}`,
          createdAt: receivedDate,
          updatedAt: receivedDate,
        })
      }
    }
  }

  // Generate 500 Expenses
  for (let i = 0; i < 500; i++) {
    const job = randomChoice(jobs)
    const date = randomDate(365, 0)

    expenses.push({
      id: randomId(),
      jobId: job.id,
      clientId: job.clientId,
      category: randomChoice(['Software', 'Hardware', 'Travel', 'Marketing', 'Office', 'Other']),
      vendor: `Vendor ${randomInt(1, 50)}`,
      amount: randomInt(10, 5000),
      date,
      note: `Demo expense ${i + 1}`,
      createdAt: date,
      updatedAt: date,
    })
  }

  return {
    clients,
    jobs,
    deals,
    timeLogs,
    invoices,
    payments,
    activities,
    expenses,
  }
}

/**
 * Loads generated test data into IndexedDB repositories.
 * This is a heavy operation and should only be used in dev/demo environments.
 * Uses direct DB access to preserve IDs and relationships.
 */
export async function loadTestDataToRepos(data: GeneratedTestData): Promise<void> {
  const { getDB } = await import('../data/db')
  const db = await getDB()

  console.log('[Test Data] Loading clients...')
  for (const client of data.clients) {
    await db.put('clients', client)
  }

  console.log('[Test Data] Loading jobs...')
  for (const job of data.jobs) {
    await db.put('jobs', job)
  }

  console.log('[Test Data] Loading deals...')
  for (const deal of data.deals) {
    await db.put('deals', deal)
  }

  console.log('[Test Data] Loading time logs...')
  for (const log of data.timeLogs) {
    await db.put('timelogs', log)
  }

  console.log('[Test Data] Loading invoices...')
  for (const invoice of data.invoices) {
    await db.put('invoices', invoice)
  }

  console.log('[Test Data] Loading payments...')
  for (const payment of data.payments) {
    await db.put('payments', payment)
  }

  console.log('[Test Data] Loading activities...')
  for (const activity of data.activities) {
    await db.put('activities', activity)
  }

  console.log('[Test Data] Loading expenses...')
  for (const expense of data.expenses) {
    await db.put('expenses', expense)
  }

  console.log('[Test Data] All test data loaded successfully!')
}
