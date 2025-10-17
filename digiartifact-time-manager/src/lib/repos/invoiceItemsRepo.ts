import { createRepository } from './baseRepo'

const base = createRepository('invoice_items', 'invoice_item')

export const invoiceItemsRepo = {
  ...base,
  listByInvoice(invoiceId: string) {
    return base.queryByIndex('by_invoice', invoiceId)
  },
  listByJob(jobId: string) {
    return base.queryByIndex('by_job', jobId)
  },
}
