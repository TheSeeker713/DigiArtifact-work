import type {
  ClientRecord,
  DealRecord,
  ExpenseRecord,
  InvoiceRecord,
  PaymentRecord,
  PersonRecord,
  ProductRecord,
  ProductSaleRecord,
  TaskRecord,
  TimeLogRecord,
  JobRecord,
} from './entities'

export type ReportFilters = {
  startDate?: string | null
  endDate?: string | null
  clientId?: string | null
  jobId?: string | null
  billable?: 'all' | 'yes' | 'no'
}

export type DataSnapshot = {
  people: PersonRecord[]
  clients: ClientRecord[]
  jobs: JobRecord[]
  tasks: TaskRecord[]
  timeLogs: TimeLogRecord[]
  invoices: InvoiceRecord[]
  payments: PaymentRecord[]
  expenses: ExpenseRecord[]
  products: ProductRecord[]
  productSales: ProductSaleRecord[]
  deals: DealRecord[]
}

export type TimeSummary = {
  totalMinutes: number
  byJob: Array<{
    jobId: string
    jobTitle: string
    minutes: number
  }>
  byPerson: Array<{
    personId: string | undefined
    personName: string
    minutes: number
  }>
}

export type BillingSummary = {
  invoicesTotal: number
  paymentsTotal: number
  outstandingTotal: number
}

export type ProfitSummary = {
  revenue: number
  expenses: number
  profit: number
}

export type PipelineSummary = {
  byStage: Array<{
    stage: string
    count: number
    estimatedValue: number
  }>
}

export type ProductSalesSummary = {
  byProduct: Array<{
    productId: string
    sku: string
    title: string
    net: number
    qty: number
  }>
}

export type ReportResult = {
  time: TimeSummary
  billing: BillingSummary
  profit: ProfitSummary
  pipeline: PipelineSummary
  productSales: ProductSalesSummary
}

export type ExportEntity =
  | 'timeLogs'
  | 'invoices'
  | 'payments'
  | 'expenses'
  | 'productSales'
  | 'deals'
