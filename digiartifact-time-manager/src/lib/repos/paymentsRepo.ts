import { createRepository } from './baseRepo'

const base = createRepository('payments', 'payment')

export const paymentsRepo = {
  ...base,
  listByInvoice(invoiceId: string) {
    return base.queryByIndex('by_invoice', invoiceId)
  },
}
