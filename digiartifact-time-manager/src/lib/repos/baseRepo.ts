import { getDB, type DatmDB, type EntityStore } from '../data/db'
import type { AuditRecord, BaseRecord } from '../types/entities'

export type WritableStore = Exclude<EntityStore, 'audit'>
export type AuditAction = AuditRecord['action']

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

async function logAudit(
  entity: string,
  entityId: string,
  action: AuditAction,
  before: unknown,
  after: unknown,
) {
  const db = await getDB()
  const record: AuditRecord = {
    id: randomId(),
    entity,
    entityId,
    action,
    timestamp: nowIso(),
    before,
    after,
  }

  await db.add('audit', record)
}

export function createRepository<Store extends WritableStore>(storeName: Store, entityName: string) {
  type StoreValue = DatmDB[Store]['value']
  type EntityRecord = StoreValue & BaseRecord

  async function list(includeDeleted = false): Promise<EntityRecord[]> {
    const db = await getDB()
    const tx = db.transaction(storeName, 'readonly')
    const all = (await tx.store.getAll()) as EntityRecord[]
    return includeDeleted ? all : all.filter((item) => !item.deletedAt)
  }

  async function getById(id: string): Promise<EntityRecord | undefined> {
    const db = await getDB()
    const record = (await db.get(storeName, id)) as EntityRecord | undefined
    if (!record || record.deletedAt) return undefined
    return record
  }

  async function create(data: Omit<EntityRecord, keyof BaseRecord>): Promise<EntityRecord> {
    try {
      const db = await getDB()
      const timestamp = nowIso()
      const record = {
        id: randomId(),
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        ...(data as Record<string, unknown>),
      } as EntityRecord

      console.log(`[${entityName}] Creating record:`, record)
      await db.add(storeName, record)
      console.log(`[${entityName}] Record added to IndexedDB successfully`)
      
      await logAudit(entityName, record.id, 'create', null, record)
      console.log(`[${entityName}] Audit log created`)
      
      return record
    } catch (error) {
      console.error(`[${entityName}] Failed to create record:`, error)
      throw error
    }
  }

  async function update(
    id: string,
    updates: Partial<Omit<EntityRecord, keyof BaseRecord>>,
  ): Promise<EntityRecord> {
    try {
      const db = await getDB()
      const existing = (await db.get(storeName, id)) as EntityRecord | undefined
      if (!existing || existing.deletedAt) {
        throw new Error(`${entityName} ${id} not found`)
      }

      const timestamp = nowIso()
      const updated = {
        ...existing,
        ...updates,
        updatedAt: timestamp,
      } as EntityRecord

      console.log(`[${entityName}] Updating record ${id}:`, updates)
      await db.put(storeName, updated)
      console.log(`[${entityName}] Record updated in IndexedDB successfully`)
      
      await logAudit(entityName, id, 'update', existing, updated)
      console.log(`[${entityName}] Audit log created`)
      
      return updated
    } catch (error) {
      console.error(`[${entityName}] Failed to update record ${id}:`, error)
      throw error
    }
  }

  async function softDelete(id: string): Promise<void> {
    const db = await getDB()
    const existing = (await db.get(storeName, id)) as EntityRecord | undefined
    if (!existing || existing.deletedAt) return

    const timestamp = nowIso()
    const updated = { ...existing, deletedAt: timestamp, updatedAt: timestamp } as EntityRecord
    await db.put(storeName, updated)
    await logAudit(entityName, id, 'delete', existing, updated)
  }

  async function queryByIndex<IndexName extends keyof DatmDB[Store]['indexes'] & string>(
    indexName: IndexName,
    key: unknown,
    includeDeleted = false,
  ): Promise<EntityRecord[]> {
    const db = await getDB()
    const tx = db.transaction(storeName, 'readonly')
    const index = tx.store.index(indexName) as any
    const results = (await index.getAll(key)) as EntityRecord[]
    return includeDeleted ? results : results.filter((item) => !item.deletedAt)
  }

  return {
    list,
    getById,
    create,
    update,
    softDelete,
    queryByIndex,
  }
}
