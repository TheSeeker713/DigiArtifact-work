<script lang="ts">
  import { onMount } from 'svelte'

  import { productsRepo } from '../lib/repos/productsRepo'
  import { productSalesRepo } from '../lib/repos/productSalesRepo'
  import { toastError, toastSuccess } from '../lib/stores/toastStore'
  import type { ProductRecord, ProductSaleRecord } from '../lib/types/entities'

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  let loading = false
  let saving = false
  let products: ProductRecord[] = []
  let productSales: ProductSaleRecord[] = []
  let editingProductId: string | null = null
  let editingSaleId: string | null = null

  const todayIso = new Date().toISOString().slice(0, 10)

  type ProductForm = {
    sku: string
    title: string
    price: string
    channel: string
    tags: string
  }

  type SaleForm = {
    productId: string
    date: string
    quantity: string
    gross: string
    fees: string
    channelRef: string
  }

  let productForm: ProductForm = {
    sku: '',
    title: '',
    price: '',
    channel: '',
    tags: '',
  }

  let saleForm: SaleForm = {
    productId: '',
    date: todayIso,
    quantity: '',
    gross: '',
    fees: '',
    channelRef: '',
  }

  const commonChannels = [
    'Gumroad',
    'Etsy',
    'Shopify',
    'Amazon',
    'eBay',
    'Stripe',
    'PayPal',
    'Direct',
    'Other',
  ]

  let activeTab: 'products' | 'sales' = 'products'

  onMount(async () => {
    await loadData()
  })

  async function loadData() {
    loading = true
    try {
      const [productsData, salesData] = await Promise.all([
        productsRepo.list(),
        productSalesRepo.list(),
      ])
      products = productsData.sort((a, b) => a.title.localeCompare(b.title))
      productSales = salesData.sort((a, b) => b.date.localeCompare(a.date))
    } catch (error) {
      console.error(error)
      toastError('Unable to load products.')
    } finally {
      loading = false
    }
  }

  function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0)
  }

  function formatDate(value: string | undefined) {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return dateFormatter.format(parsed)
  }

  function parseAmount(value: string) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.round(numeric * 100) / 100)
  }

  function parseQuantity(value: string) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.floor(numeric))
  }

  function resetProductForm() {
    productForm = {
      sku: '',
      title: '',
      price: '',
      channel: '',
      tags: '',
    }
    editingProductId = null
  }

  function resetSaleForm() {
    saleForm = {
      productId: '',
      date: todayIso,
      quantity: '',
      gross: '',
      fees: '',
      channelRef: '',
    }
    editingSaleId = null
  }

  function startEditProduct(product: ProductRecord) {
    editingProductId = product.id
    productForm = {
      sku: product.sku,
      title: product.title,
      price: String(product.price ?? 0),
      channel: product.channel ?? '',
      tags: '', // Tags not in ProductRecord yet, placeholder
    }
    activeTab = 'products'
  }

  function startEditSale(sale: ProductSaleRecord) {
    editingSaleId = sale.id
    saleForm = {
      productId: sale.productId,
      date: sale.date,
      quantity: String(sale.quantity ?? 0),
      gross: String(sale.gross ?? 0),
      fees: String(sale.fees ?? 0),
      channelRef: sale.channelRef ?? '',
    }
    activeTab = 'sales'
  }

  async function handleProductSubmit(event: Event) {
    event.preventDefault()

    const price = parseAmount(productForm.price)
    if (price <= 0) {
      toastError('Enter a price greater than zero.')
      return
    }

    if (!productForm.sku.trim()) {
      toastError('SKU is required.')
      return
    }

    if (!productForm.title.trim()) {
      toastError('Product title is required.')
      return
    }

    saving = true
    try {
      const payload = {
        sku: productForm.sku.trim(),
        title: productForm.title.trim(),
        price,
        channel: productForm.channel || undefined,
      }

      if (editingProductId) {
        await productsRepo.update(editingProductId, payload as any)
        toastSuccess('Product updated.')
      } else {
        const existing = await productsRepo.getBySku(payload.sku)
        if (existing) {
          toastError('SKU already exists.')
          saving = false
          return
        }
        await productsRepo.create(payload as any)
        toastSuccess('Product created.')
      }

      await loadData()
      resetProductForm()
    } catch (error) {
      console.error(error)
      toastError('Unable to save product.')
    } finally {
      saving = false
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!window.confirm('Delete this product? Sales records will remain but lose the link.')) {
      return
    }

    try {
      await productsRepo.softDelete(id)
      toastSuccess('Product deleted.')
      await loadData()
      if (editingProductId === id) {
        resetProductForm()
      }
    } catch (error) {
      console.error(error)
      toastError('Unable to delete product.')
    }
  }

  async function handleSaleSubmit(event: Event) {
    event.preventDefault()

    if (!saleForm.productId) {
      toastError('Select a product.')
      return
    }

    const quantity = parseQuantity(saleForm.quantity)
    if (quantity <= 0) {
      toastError('Enter a quantity greater than zero.')
      return
    }

    const gross = parseAmount(saleForm.gross)
    const fees = parseAmount(saleForm.fees)
    const net = Math.max(0, gross - fees)

    saving = true
    try {
      const payload = {
        productId: saleForm.productId,
        date: saleForm.date,
        quantity,
        gross,
        fees,
        net,
        channelRef: saleForm.channelRef || undefined,
      }

      if (editingSaleId) {
        await productSalesRepo.update(editingSaleId, payload as any)
        toastSuccess('Sale updated.')
      } else {
        await productSalesRepo.create(payload as any)
        toastSuccess('Sale recorded.')
      }

      await loadData()
      resetSaleForm()
    } catch (error) {
      console.error(error)
      toastError('Unable to save sale.')
    } finally {
      saving = false
    }
  }

  async function handleDeleteSale(id: string) {
    if (!window.confirm('Delete this sale record? This cannot be undone.')) {
      return
    }

    try {
      await productSalesRepo.softDelete(id)
      toastSuccess('Sale deleted.')
      await loadData()
      if (editingSaleId === id) {
        resetSaleForm()
      }
    } catch (error) {
      console.error(error)
      toastError('Unable to delete sale.')
    }
  }

  $: productLookup = new Map(products.map((product) => [product.id, product]))
  $: totalRevenue = productSales.reduce((sum, sale) => sum + (sale.net ?? 0), 0)
  $: totalFees = productSales.reduce((sum, sale) => sum + (sale.fees ?? 0), 0)
  $: totalGross = productSales.reduce((sum, sale) => sum + (sale.gross ?? 0), 0)
  $: totalSales = productSales.length
  $: netAmount = saleForm.gross && saleForm.fees
    ? parseAmount(saleForm.gross) - parseAmount(saleForm.fees)
    : 0
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Products & Sales</h2>
    <p class="text-sm text-slate-400">
      Track SKUs, list prices, and channel performance. Record sales to analyze revenue streams.
    </p>
  </header>

  <article class="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Products</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{products.length}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Sales recorded</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{totalSales}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Gross revenue</span>
      <p class="mt-1 text-xl font-semibold text-slate-100">{formatCurrency(totalGross)}</p>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <span class="text-xs uppercase tracking-wide text-slate-500">Net revenue</span>
      <p class="mt-1 text-xl font-semibold text-green-400">{formatCurrency(totalRevenue)}</p>
      <p class="text-xs text-slate-400">Fees: {formatCurrency(totalFees)}</p>
    </div>
  </article>

  <nav class="flex gap-2 text-sm font-semibold">
    <button
      type="button"
      class={`rounded-lg px-4 py-2 transition ${
        activeTab === 'products'
          ? 'bg-brand-primary text-slate-900'
          : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
      }`}
      on:click={() => (activeTab = 'products')}
    >
      Products
    </button>
    <button
      type="button"
      class={`rounded-lg px-4 py-2 transition ${
        activeTab === 'sales'
          ? 'bg-brand-primary text-slate-900'
          : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
      }`}
      on:click={() => (activeTab = 'sales')}
    >
      Sales
    </button>
  </nav>

  {#if activeTab === 'products'}
    <form class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200" on:submit={handleProductSubmit}>
      <header class="flex flex-col gap-2">
        <h3 class="text-lg font-semibold text-slate-100">
          {editingProductId ? 'Edit product' : 'Add product'}
        </h3>
        <p class="text-xs text-slate-400">
          SKU must be unique. Price is the list price before fees.
        </p>
      </header>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>SKU</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            placeholder="PROD-001"
            bind:value={productForm.sku}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Title</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            placeholder="Product name"
            bind:value={productForm.title}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Price</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            type="number"
            min="0"
            step="0.01"
            bind:value={productForm.price}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Channel</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            bind:value={productForm.channel}
          >
            <option value="">Select channel</option>
            {#each commonChannels as channel}
              <option value={channel}>{channel}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="submit"
          class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : editingProductId ? 'Update product' : 'Add product'}
        </button>
        {#if editingProductId}
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            on:click={resetProductForm}
            disabled={saving}
          >
            Cancel edit
          </button>
        {/if}
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          on:click={resetProductForm}
          disabled={saving}
        >
          Clear form
        </button>
      </div>
    </form>

    {#if loading}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        Loading products…
      </article>
    {:else if products.length === 0}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        No products yet. Add your first product above.
      </article>
    {:else}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
        <header class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span>All products</span>
          <span>{products.length}</span>
        </header>
        <div class="mt-3 overflow-x-auto">
          <table class="min-w-full text-left text-xs">
            <thead class="border-b border-slate-800 text-slate-400">
              <tr>
                <th class="px-3 py-2 font-semibold">SKU</th>
                <th class="px-3 py-2 font-semibold">Title</th>
                <th class="px-3 py-2 font-semibold">Channel</th>
                <th class="px-3 py-2 font-semibold text-right">Price</th>
                <th class="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              {#each products as product}
                <tr>
                  <td class="px-3 py-2 font-mono text-xs">{product.sku}</td>
                  <td class="px-3 py-2">{product.title}</td>
                  <td class="px-3 py-2">{product.channel || '—'}</td>
                  <td class="px-3 py-2 text-right">{formatCurrency(product.price ?? 0)}</td>
                  <td class="px-3 py-2 text-right">
                    <button
                      type="button"
                      class="text-brand-primary hover:underline"
                      on:click={() => startEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="ml-2 text-red-400 hover:underline"
                      on:click={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </article>
    {/if}
  {:else}
    <form class="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200" on:submit={handleSaleSubmit}>
      <header class="flex flex-col gap-2">
        <h3 class="text-lg font-semibold text-slate-100">
          {editingSaleId ? 'Edit sale' : 'Record sale'}
        </h3>
        <p class="text-xs text-slate-400">
          Net revenue = Gross - Fees. Channel reference is optional (invoice ID, order number, etc).
        </p>
      </header>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Product</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            bind:value={saleForm.productId}
            required
          >
            <option value="">Select product</option>
            {#each products as product}
              <option value={product.id}>{product.title} ({product.sku})</option>
            {/each}
          </select>
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Date</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            type="date"
            bind:value={saleForm.date}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Quantity</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            type="number"
            min="1"
            step="1"
            bind:value={saleForm.quantity}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Gross</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            type="number"
            min="0"
            step="0.01"
            bind:value={saleForm.gross}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Fees</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            type="number"
            min="0"
            step="0.01"
            bind:value={saleForm.fees}
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span>Channel Reference</span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            placeholder="Order ID"
            bind:value={saleForm.channelRef}
          />
        </label>
      </div>

      {#if saleForm.gross && saleForm.fees}
        <div class="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm">
          <span class="text-slate-400">Net revenue:</span>
          <span class="ml-2 font-semibold text-green-400">{formatCurrency(netAmount)}</span>
        </div>
      {/if}

      <div class="flex flex-wrap gap-3">
        <button
          type="submit"
          class="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : editingSaleId ? 'Update sale' : 'Record sale'}
        </button>
        {#if editingSaleId}
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            on:click={resetSaleForm}
            disabled={saving}
          >
            Cancel edit
          </button>
        {/if}
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          on:click={resetSaleForm}
          disabled={saving}
        >
          Clear form
        </button>
      </div>
    </form>

    {#if loading}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        Loading sales…
      </article>
    {:else if productSales.length === 0}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        No sales recorded yet.
      </article>
    {:else}
      <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
        <header class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span>All sales</span>
          <span>{productSales.length}</span>
        </header>
        <div class="mt-3 overflow-x-auto">
          <table class="min-w-full text-left text-xs">
            <thead class="border-b border-slate-800 text-slate-400">
              <tr>
                <th class="px-3 py-2 font-semibold">Date</th>
                <th class="px-3 py-2 font-semibold">Product</th>
                <th class="px-3 py-2 font-semibold">Qty</th>
                <th class="px-3 py-2 font-semibold text-right">Gross</th>
                <th class="px-3 py-2 font-semibold text-right">Fees</th>
                <th class="px-3 py-2 font-semibold text-right">Net</th>
                <th class="px-3 py-2 font-semibold">Ref</th>
                <th class="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              {#each productSales as sale}
                <tr>
                  <td class="px-3 py-2">{formatDate(sale.date)}</td>
                  <td class="px-3 py-2">
                    {productLookup.get(sale.productId)?.title ?? 'Unknown'}
                  </td>
                  <td class="px-3 py-2">{sale.quantity ?? 0}</td>
                  <td class="px-3 py-2 text-right">{formatCurrency(sale.gross ?? 0)}</td>
                  <td class="px-3 py-2 text-right">{formatCurrency(sale.fees ?? 0)}</td>
                  <td class="px-3 py-2 text-right font-semibold text-green-400">
                    {formatCurrency(sale.net ?? 0)}
                  </td>
                  <td class="px-3 py-2 text-xs text-slate-400">{sale.channelRef ?? '—'}</td>
                  <td class="px-3 py-2 text-right">
                    <button
                      type="button"
                      class="text-brand-primary hover:underline"
                      on:click={() => startEditSale(sale)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="ml-2 text-red-400 hover:underline"
                      on:click={() => handleDeleteSale(sale.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </article>
    {/if}
  {/if}
</section>
