import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type {
  ActivityRecord,
  AuditRecord,
  ClientRecord,
  ContactRecord,
  DealRecord,
  ExpenseRecord,
  FormSubmissionRecord,
  InvoiceItemRecord,
  InvoiceRecord,
  JobRecord,
  PaymentRecord,
  PersonRecord,
  ProductRecord,
  ProductSaleRecord,
  ScheduleRecord,
  SettingRecord,
  TaskRecord,
  TimeLogRecord,
  WorkSessionRecord,
  ActiveTaskRecord,
} from '../types/entities'

export const DB_NAME = 'datm'
export const DB_VERSION = 2

export type EntityStore =
  | 'people'
  | 'clients'
  | 'contacts'
  | 'deals'
  | 'jobs'
  | 'tasks'
  | 'timelogs'
  | 'schedules'
  | 'invoices'
  | 'invoice_items'
  | 'payments'
  | 'expenses'
  | 'products'
  | 'product_sales'
  | 'activities'
  | 'form_submissions'
  | 'work_sessions'
  | 'active_tasks'
  | 'settings'
  | 'audit'

export interface DatmDB extends DBSchema {
  people: {
    key: string
    value: PersonRecord
    indexes: { by_role: string; by_deleted: string }
  }
  clients: {
    key: string
    value: ClientRecord
    indexes: { by_status: string; by_deleted: string }
  }
  contacts: {
    key: string
    value: ContactRecord
    indexes: { by_client: string; by_deleted: string }
  }
  deals: {
    key: string
    value: DealRecord
    indexes: { by_client: string; by_stage: string; by_deleted: string }
  }
  jobs: {
    key: string
    value: JobRecord
    indexes: { by_client: string; by_status: string; by_deleted: string }
  }
  tasks: {
    key: string
    value: TaskRecord
    indexes: { by_job: string; by_deleted: string }
  }
  timelogs: {
    key: string
    value: TimeLogRecord
    indexes: {
      by_job: string
      by_week: string
      by_job_week: [string, string]
      by_person: string
      by_deleted: string
    }
  }
  schedules: {
    key: string
    value: ScheduleRecord
    indexes: { by_person: string; by_job: string; by_deleted: string }
  }
  invoices: {
    key: string
    value: InvoiceRecord
    indexes: { by_client: string; by_status: string; by_deleted: string }
  }
  invoice_items: {
    key: string
    value: InvoiceItemRecord
    indexes: { by_invoice: string; by_job: string; by_deleted: string }
  }
  payments: {
    key: string
    value: PaymentRecord
    indexes: { by_invoice: string; by_deleted: string }
  }
  expenses: {
    key: string
    value: ExpenseRecord
    indexes: { by_job: string; by_client: string; by_deleted: string }
  }
  products: {
    key: string
    value: ProductRecord
    indexes: { by_sku: string; by_deleted: string }
  }
  product_sales: {
    key: string
    value: ProductSaleRecord
    indexes: { by_product: string; by_date: string; by_deleted: string }
  }
  activities: {
    key: string
    value: ActivityRecord
    indexes: {
      by_client: string
      by_client_date: [string, string]
      by_deleted: string
    }
  }
  form_submissions: {
    key: string
    value: FormSubmissionRecord
    indexes: { by_source: string; by_deleted: string }
  }
  work_sessions: {
    key: string
    value: WorkSessionRecord
    indexes: { by_status: string; by_deleted: string }
  }
  active_tasks: {
    key: string
    value: ActiveTaskRecord
    indexes: { by_job: string; by_status: string; by_deleted: string }
  }
  settings: {
    key: string
    value: SettingRecord
    indexes: { by_key: string }
  }
  audit: {
    key: string
    value: AuditRecord
    indexes: { by_entity: string; by_entity_action: [string, string] }
  }
}

let dbPromise: Promise<IDBPDatabase<DatmDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DatmDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const defaultOptions = { keyPath: 'id' }

          const peopleStore = db.createObjectStore('people', defaultOptions)
          peopleStore.createIndex('by_role', 'role', { unique: false })
          peopleStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const clientStore = db.createObjectStore('clients', defaultOptions)
          clientStore.createIndex('by_status', 'status', { unique: false })
          clientStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const contactsStore = db.createObjectStore('contacts', defaultOptions)
          contactsStore.createIndex('by_client', 'clientId', { unique: false })
          contactsStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const dealsStore = db.createObjectStore('deals', defaultOptions)
          dealsStore.createIndex('by_client', 'clientId', { unique: false })
          dealsStore.createIndex('by_stage', 'stage', { unique: false })
          dealsStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const jobsStore = db.createObjectStore('jobs', defaultOptions)
          jobsStore.createIndex('by_client', 'clientId', { unique: false })
          jobsStore.createIndex('by_status', 'status', { unique: false })
          jobsStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const tasksStore = db.createObjectStore('tasks', defaultOptions)
          tasksStore.createIndex('by_job', 'jobId', { unique: false })
          tasksStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const timelogStore = db.createObjectStore('timelogs', defaultOptions)
          timelogStore.createIndex('by_job', 'jobId', { unique: false })
          timelogStore.createIndex('by_week', 'weekBucket', { unique: false })
          timelogStore.createIndex('by_job_week', ['jobId', 'weekBucket'], { unique: false })
          timelogStore.createIndex('by_person', 'personId', { unique: false })
          timelogStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const scheduleStore = db.createObjectStore('schedules', defaultOptions)
          scheduleStore.createIndex('by_person', 'personId', { unique: false })
          scheduleStore.createIndex('by_job', 'jobId', { unique: false })
          scheduleStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const invoiceStore = db.createObjectStore('invoices', defaultOptions)
          invoiceStore.createIndex('by_client', 'clientId', { unique: false })
          invoiceStore.createIndex('by_status', 'status', { unique: false })
          invoiceStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const invoiceItemStore = db.createObjectStore('invoice_items', defaultOptions)
          invoiceItemStore.createIndex('by_invoice', 'invoiceId', { unique: false })
          invoiceItemStore.createIndex('by_job', 'jobId', { unique: false })
          invoiceItemStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const paymentStore = db.createObjectStore('payments', defaultOptions)
          paymentStore.createIndex('by_invoice', 'invoiceId', { unique: false })
          paymentStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const expenseStore = db.createObjectStore('expenses', defaultOptions)
          expenseStore.createIndex('by_job', 'jobId', { unique: false })
          expenseStore.createIndex('by_client', 'clientId', { unique: false })
          expenseStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const productStore = db.createObjectStore('products', defaultOptions)
          productStore.createIndex('by_sku', 'sku', { unique: true })
          productStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const productSalesStore = db.createObjectStore('product_sales', defaultOptions)
          productSalesStore.createIndex('by_product', 'productId', { unique: false })
          productSalesStore.createIndex('by_date', 'date', { unique: false })
          productSalesStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const activitiesStore = db.createObjectStore('activities', defaultOptions)
          activitiesStore.createIndex('by_client', 'clientId', { unique: false })
          activitiesStore.createIndex('by_client_date', ['clientId', 'date'], { unique: false })
          activitiesStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const formStore = db.createObjectStore('form_submissions', defaultOptions)
          formStore.createIndex('by_source', 'source', { unique: false })
          formStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const workSessionStore = db.createObjectStore('work_sessions', defaultOptions)
          workSessionStore.createIndex('by_status', 'status', { unique: false })
          workSessionStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const activeTasksStore = db.createObjectStore('active_tasks', defaultOptions)
          activeTasksStore.createIndex('by_job', 'jobId', { unique: false })
          activeTasksStore.createIndex('by_status', 'status', { unique: false })
          activeTasksStore.createIndex('by_deleted', 'deletedAt', { unique: false })

          const settingsStore = db.createObjectStore('settings', defaultOptions)
          settingsStore.createIndex('by_key', 'key', { unique: true })

          const auditStore = db.createObjectStore('audit', defaultOptions)
          auditStore.createIndex('by_entity', 'entity', { unique: false })
          auditStore.createIndex('by_entity_action', ['entity', 'action'], { unique: false })
        }
      },
    })
  }

  return dbPromise
}

export async function withDb<T>(callback: (db: IDBPDatabase<DatmDB>) => Promise<T>) {
  const db = await getDB()
  return callback(db)
}

// Helper functions for common operations
export const db = {
  async get<T extends EntityStore>(store: T, key: string) {
    return withDb((db) => db.get(store, key))
  },
  async put<T extends EntityStore>(store: T, value: DatmDB[T]['value']) {
    return withDb((db) => db.put(store, value))
  },
  async delete<T extends EntityStore>(store: T, key: string) {
    return withDb((db) => db.delete(store, key))
  },
  async getAll<T extends EntityStore>(store: T) {
    return withDb((db) => db.getAll(store))
  },
  async getAllFromIndex<T extends EntityStore>(
    store: T,
    indexName: string,
    query?: IDBKeyRange | string,
  ) {
    return withDb((db) => db.getAllFromIndex(store, indexName as any, query as any))
  },
}
