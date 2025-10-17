import { getDB } from '../data/db'
import type { AuditRecord } from '../types/entities'

export const auditRepo = {
  async listAll(): Promise<AuditRecord[]> {
    const db = await getDB()
    return db.getAll('audit') as Promise<AuditRecord[]>
  },
  async listByEntity(entity: string) {
    const db = await getDB()
    return db.getAllFromIndex('audit', 'by_entity', entity) as Promise<AuditRecord[]>
  },
  async listByEntityAndAction(entity: string, action: AuditRecord['action']) {
    const db = await getDB()
    return db.getAllFromIndex('audit', 'by_entity_action', [entity, action]) as Promise<AuditRecord[]>
  },
}
