import { invoicesRepo } from '../repos/invoicesRepo'
import { invoiceItemsRepo } from '../repos/invoiceItemsRepo'
import { paymentsRepo } from '../repos/paymentsRepo'
import { timeLogsRepo } from '../repos/timeLogsRepo'
import type { InvoiceItemRecord, InvoiceRecord, PaymentRecord } from '../types/entities'

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export type TimeLogInvoiceGroupInput = {
  jobId: string
  taskId?: string | null
  logIds: string[]
  minutes: number
  rate: number
  description: string
}

export type ManualInvoiceLineInput = {
  description: string
  quantity: number
  unitPrice: number
  type: 'other' | 'expense'
}

export type ProductInvoiceLineInput = {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
}

export type InvoiceDraftInput = {
  clientId: string
  issueDate: string
  dueDate: string
  status: InvoiceRecord['status']
  taxRate: number
  notes?: string
  currency?: string
  timeLogItems: TimeLogInvoiceGroupInput[]
  manualItems: ManualInvoiceLineInput[]
  productItems: ProductInvoiceLineInput[]
}

export type InvoiceCreationResult = {
  invoice: InvoiceRecord
  items: InvoiceItemRecord[]
}

function sanitizeCurrency(value: number) {
  if (!Number.isFinite(value)) return 0
  return roundCurrency(value)
}

function sanitizeQuantity(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

export async function createInvoiceFromDraft(draft: InvoiceDraftInput): Promise<InvoiceCreationResult> {
  if (!draft.timeLogItems.length && !draft.manualItems.length && !draft.productItems.length) {
    throw new Error('EMPTY_INVOICE')
  }

  const currency = draft.currency ?? 'USD'
  const itemsPayload: Array<Omit<InvoiceItemRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>> = []

  for (const group of draft.timeLogItems) {
    const hours = sanitizeQuantity(group.minutes / 60)
    const rate = sanitizeCurrency(group.rate)
    const amount = sanitizeCurrency(hours * rate)
    itemsPayload.push({
      invoiceId: '',
      type: 'time',
      jobId: group.jobId,
      description: group.description,
      quantity: hours,
      unitPrice: rate,
      amount,
    })
  }

  for (const manual of draft.manualItems) {
    const quantity = sanitizeQuantity(manual.quantity)
    const unitPrice = sanitizeCurrency(manual.unitPrice)
    const amount = sanitizeCurrency(quantity * unitPrice)
    itemsPayload.push({
      invoiceId: '',
      type: manual.type,
      description: manual.description,
      quantity,
      unitPrice,
      amount,
    })
  }

  for (const product of draft.productItems) {
    const quantity = sanitizeQuantity(product.quantity)
    const unitPrice = sanitizeCurrency(product.unitPrice)
    const amount = sanitizeCurrency(quantity * unitPrice)
    itemsPayload.push({
      invoiceId: '',
      type: 'product',
      description: product.description,
      quantity,
      unitPrice,
      amount,
      jobId: undefined,
    })
  }

  const subtotal = sanitizeCurrency(itemsPayload.reduce((sum, item) => sum + item.amount, 0))
  const tax = sanitizeCurrency(subtotal * draft.taxRate)
  const total = sanitizeCurrency(subtotal + tax)

  const invoice = await invoicesRepo.create({
    clientId: draft.clientId,
    issueDate: draft.issueDate,
    dueDate: draft.dueDate,
    status: draft.status,
    subtotal,
    tax,
    total,
    currency,
    notes: draft.notes?.trim() || undefined,
  })

  const createdItems: InvoiceItemRecord[] = []
  for (const payload of itemsPayload) {
    const created = await invoiceItemsRepo.create({
      ...payload,
      invoiceId: invoice.id,
    } as any)
    createdItems.push(created)
  }

  const timeLogIds = draft.timeLogItems.flatMap((item) => item.logIds)
  if (timeLogIds.length) {
    await Promise.all(timeLogIds.map((logId) => timeLogsRepo.update(logId, { invoiceId: invoice.id } as any)))
  }

  return { invoice, items: createdItems }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceRecord['status'],
): Promise<InvoiceRecord> {
  const invoice = await invoicesRepo.update(invoiceId, { status } as any)
  return invoice
}

function deriveStatusFromPayments(invoice: InvoiceRecord, payments: PaymentRecord[]): InvoiceRecord['status'] {
  const paidTotal = payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0)
  const outstanding = roundCurrency((invoice.total ?? 0) - paidTotal)
  if (outstanding <= 0.01) {
    return 'paid'
  }

  const dueDate = new Date(invoice.dueDate)
  const now = new Date()
  if (dueDate.getTime() < now.getTime() && outstanding > 0) {
    return 'overdue'
  }

  if (paidTotal > 0 && outstanding > 0) {
    return 'partial'
  }

  if (invoice.status === 'draft') {
    return 'draft'
  }

  return invoice.status === 'partial' ? 'partial' : invoice.status
}

export type RecordPaymentInput = {
  invoiceId: string
  amount: number
  receivedDate: string
  method?: string
  reference?: string
}

export async function recordPaymentForInvoice(input: RecordPaymentInput): Promise<PaymentRecord> {
  const invoice = await invoicesRepo.getById(input.invoiceId)
  if (!invoice) {
    throw new Error('INVOICE_NOT_FOUND')
  }

  const payment = await paymentsRepo.create({
    invoiceId: input.invoiceId,
    amount: sanitizeCurrency(input.amount),
    receivedDate: input.receivedDate,
    method: input.method?.trim() || undefined,
    reference: input.reference?.trim() || undefined,
  } as any)

  const payments = await paymentsRepo.listByInvoice(input.invoiceId)
  const nextStatus = deriveStatusFromPayments(invoice, payments)
  if (nextStatus !== invoice.status) {
    await invoicesRepo.update(invoice.id, { status: nextStatus } as any)
  } else if (nextStatus === 'paid') {
    await invoicesRepo.update(invoice.id, { status: nextStatus } as any)
  }

  return payment
}

export type StatementRow = {
  date: string
  type: 'Invoice' | 'Payment'
  reference: string
  description: string
  amount: number
  balance: number
  dueDate?: string
  status?: string
}

export function buildClientStatement(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  clientId: string,
): StatementRow[] {
  const relevantInvoices = invoices.filter((invoice) => invoice.clientId === clientId)
  const invoiceMap = new Map(relevantInvoices.map((invoice) => [invoice.id, invoice]))
  const relevantPayments = payments.filter((payment) => invoiceMap.has(payment.invoiceId))

  const events: StatementRow[] = []

  for (const invoice of relevantInvoices) {
    events.push({
      date: invoice.issueDate,
      type: 'Invoice',
      reference: invoice.id,
      description: `Invoice ${invoice.id.slice(0, 8)}`,
      amount: sanitizeCurrency(invoice.total ?? 0),
      balance: 0,
      dueDate: invoice.dueDate,
      status: invoice.status,
    })
  }

  for (const payment of relevantPayments) {
    const invoice = invoiceMap.get(payment.invoiceId)
    events.push({
      date: payment.receivedDate,
      type: 'Payment',
      reference: payment.reference || payment.id,
      description: invoice
        ? `Payment for Invoice ${invoice.id.slice(0, 8)}`
        : `Payment ${payment.id.slice(0, 8)}`,
      amount: -sanitizeCurrency(payment.amount ?? 0),
      balance: 0,
      dueDate: invoice?.dueDate,
      status: invoice?.status,
    })
  }

  events.sort((a, b) => a.date.localeCompare(b.date))

  let running = 0
  for (const row of events) {
    running = sanitizeCurrency(running + row.amount)
    row.balance = running
  }

  return events
}
