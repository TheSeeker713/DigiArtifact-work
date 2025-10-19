import { createRepository } from './baseRepo'
import type { TimeLogRecord } from '../types/entities'
import { toastError } from '../stores/toastStore'

const base = createRepository('timelogs', 'timelog')

// Validation helper for TimeLog required fields
function validateTimeLogFields(data: Partial<TimeLogRecord>): void {
  const errors: string[] = []

  if (!data.personId) errors.push('person_id is required')
  if (!data.jobId) errors.push('job_id is required')
  if (!data.startDT) errors.push('start_dt is required')
  if (!data.endDT) errors.push('end_dt is required')
  if (data.durationMinutes === undefined || data.durationMinutes === null) {
    errors.push('duration_min is required')
  }
  if (data.breakMs === undefined || data.breakMs === null) {
    errors.push('break_ms is required')
  }
  if (data.billable === undefined || data.billable === null) {
    errors.push('billable is required')
  }

  if (errors.length > 0) {
    const message = `TimeLog validation failed: ${errors.join(', ')}`
    toastError(message)
    throw new Error(message)
  }
}

export const timeLogsRepo = {
  ...base,

  // Override create with validation and verification
  async create(data: Omit<TimeLogRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    // Apply defaults
    const payload = {
      ...data,
      personId: data.personId || 'owner',
      taskId: data.taskId ?? null,
      breakMs: data.breakMs ?? 0,
      note: data.note ?? null,
      invoiceId: data.invoiceId ?? null,
    }

    // Validate required fields
    validateTimeLogFields(payload)

    // Create record
    const record = await base.create(payload as any)

    // Immediately verify by retrieving
    const verified = await base.getById(record.id)
    if (!verified) {
      const message = 'TimeLog created but verification failed - record not found in database'
      toastError(message)
      throw new Error(message)
    }

    return verified as TimeLogRecord
  },

  // Override update with validation and verification
  async update(id: string, updates: Partial<Omit<TimeLogRecord, keyof import('../types/entities').BaseRecord>>) {
    // If critical fields are being updated, validate them
    if (updates.personId !== undefined || updates.jobId !== undefined || 
        updates.startDT !== undefined || updates.endDT !== undefined ||
        updates.durationMinutes !== undefined || updates.breakMs !== undefined ||
        updates.billable !== undefined) {
      
      // Get existing to merge
      const existing = await base.getById(id)
      if (!existing) {
        const message = `TimeLog ${id} not found for update`
        toastError(message)
        throw new Error(message)
      }

      const merged = { ...existing, ...updates }
      validateTimeLogFields(merged)
    }

    // Update record
    const updated = await base.update(id, updates)

    // Immediately verify by retrieving
    const verified = await base.getById(id)
    if (!verified) {
      const message = 'TimeLog updated but verification failed - record not found in database'
      toastError(message)
      throw new Error(message)
    }

    return verified as TimeLogRecord
  },

  listByJob(jobId: string) {
    return base.queryByIndex('by_job', jobId)
  },
  listByWeek(weekBucket: string) {
    return base.queryByIndex('by_week', weekBucket)
  },
  listByJobWeek(jobId: string, weekBucket: string) {
    return base.queryByIndex('by_job_week', [jobId, weekBucket])
  },
  listByPerson(personId: string) {
    return base.queryByIndex('by_person', personId)
  },
  listByPersonStart(personId: string, startDT: string) {
    return base.queryByIndex('by_person_start', [personId, startDT])
  },
}
