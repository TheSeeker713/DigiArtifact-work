export type ISODate = string

export type BaseRecord = {
  id: string
  createdAt: ISODate
  updatedAt: ISODate
  deletedAt?: ISODate | null
}

export type PersonRecord = BaseRecord & {
  name: string
  role: 'Owner' | 'Manager' | 'Worker' | 'Contractor'
  email?: string
}

export type ClientRecord = BaseRecord & {
  name: string
  billingEmail?: string
  phone?: string
  website?: string
  status?: string
  tags?: string[]
  notes?: string
}

export type ContactRecord = BaseRecord & {
  clientId: string
  name: string
  email?: string
  phone?: string
  title?: string
}

export type DealRecord = BaseRecord & {
  clientId: string
  title: string
  stage: string
  valueEstimate?: number
  probability?: number
  jobType?: string
  jobId?: string
  tags?: string[]
  stageChangedAt?: ISODate
}

export type JobRecord = BaseRecord & {
  title: string
  clientId?: string
  rate?: number
  status?: string
  description?: string
}

export type TaskRecord = BaseRecord & {
  jobId: string
  name: string
  description?: string
}

export type TimeLogRecord = BaseRecord & {
  personId: string
  jobId: string
  taskId?: string | null
  startDT: ISODate
  endDT: ISODate
  durationMinutes: number
  breakMs: number
  note?: string | null
  billable: boolean
  weekBucket: string
  approved?: boolean
  invoiceId?: string | null
}

export type ScheduleRecord = BaseRecord & {
  personId: string
  jobId: string
  scheduledStart: ISODate
  scheduledEnd: ISODate
}

export type InvoiceRecord = BaseRecord & {
  clientId: string
  issueDate: ISODate
  dueDate: ISODate
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue'
  subtotal: number
  tax: number
  total: number
  currency: string
  notes?: string
}

export type InvoiceItemRecord = BaseRecord & {
  invoiceId: string
  type: 'time' | 'product' | 'expense' | 'other'
  jobId?: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type PaymentRecord = BaseRecord & {
  invoiceId: string
  receivedDate: ISODate
  method?: string
  amount: number
  reference?: string
}

export type ExpenseRecord = BaseRecord & {
  jobId?: string
  clientId?: string
  category?: string
  vendor?: string
  amount: number
  date: ISODate
  note?: string
}

export type ProductRecord = BaseRecord & {
  sku: string
  title: string
  price: number
  channel?: string
}

export type ProductSaleRecord = BaseRecord & {
  productId: string
  date: ISODate
  quantity: number
  gross: number
  fees: number
  net: number
  channelRef?: string
}

export type ActivityRecord = BaseRecord & {
  clientId: string
  contactId?: string
  dealId?: string
  type: string
  date: ISODate
  summary: string
  nextActionDate?: ISODate
}

export type FormSubmissionRecord = BaseRecord & {
  source: string
  payload: Record<string, unknown>
  createdDate: ISODate
  consent: boolean
}

export type BreakPeriod = {
  id: string
  startTime: ISODate
  endTime?: ISODate | null
  durationMinutes?: number
}

export type WorkSessionRecord = BaseRecord & {
  clockInTime: ISODate
  clockOutTime?: ISODate | null
  status: 'active' | 'completed' | 'on_break'
  totalMinutes?: number
  breaks?: BreakPeriod[]
  totalBreakMinutes?: number
  netMinutes?: number // totalMinutes - totalBreakMinutes
  note?: string
}

export type ActiveTaskRecord = BaseRecord & {
  jobId: string
  taskId?: string | null
  taskName: string
  startTime: ISODate
  status: 'running' | 'paused' | 'stopped' | 'completed'
  elapsedMinutes: number
  billable?: boolean
  note?: string
}

export type PomodoroSettings = {
  workDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  longBreakInterval: number // every N pomodoros
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean // for future sound FX
}

export type PomodoroSession = {
  id: string
  startTime: ISODate
  endTime?: ISODate | null
  type: 'work' | 'short_break' | 'long_break'
  completed: boolean
  pomodoroCount?: number // which pomodoro cycle (1, 2, 3, 4...)
}


export type SettingRecord = BaseRecord & {
  key: string
  value: unknown
}

export type AuditRecord = {
  id: string
  entity: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  timestamp: ISODate
  before?: unknown
  after?: unknown
}
