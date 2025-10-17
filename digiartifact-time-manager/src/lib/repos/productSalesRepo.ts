import { createRepository } from './baseRepo'

const base = createRepository('product_sales', 'product_sale')

export const productSalesRepo = {
  ...base,
  listByProduct(productId: string) {
    return base.queryByIndex('by_product', productId)
  },
  listByDate(dateKey: string) {
    return base.queryByIndex('by_date', dateKey)
  },
}
