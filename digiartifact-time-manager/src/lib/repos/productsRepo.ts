import { createRepository } from './baseRepo'

const base = createRepository('products', 'product')

export const productsRepo = {
  ...base,
  async getBySku(sku: string) {
    const matches = await base.queryByIndex('by_sku', sku)
    return matches[0]
  },
}
