/**
 * Lightweight Debug Logger Utility
 * 
 * Provides targeted logging with levels (info, warn, error) that can be toggled
 * via query parameter `?debug=1` or Settings flag.
 * 
 * Usage:
 *   import { debugLog } from '../utils/debug'
 *   debugLog.time.info('Clock In', { start_ts, job_id, task_id })
 */

export type LogLevel = 'info' | 'warn' | 'error'

export type LogCategory = 'time' | 'db' | 'ui' | 'repo' | 'general'

interface LogEntry {
  category: LogCategory
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

class DebugLogger {
  private enabled = false
  private categories: Set<LogCategory> = new Set()

  constructor() {
    this.initFromURL()
    this.initFromSettings()
  }

  /**
   * Initialize debug mode from URL query parameter
   */
  private initFromURL() {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get('debug')
    
    if (debugParam === '1' || debugParam === 'true') {
      this.enabled = true
      this.categories.add('time')
      this.categories.add('db')
      this.categories.add('ui')
      this.categories.add('repo')
      this.categories.add('general')
      console.log('[debug] Debug mode enabled via URL parameter')
    }

    // Support category-specific debugging: ?debug=time,db
    if (debugParam && debugParam !== '1' && debugParam !== 'true') {
      this.enabled = true
      const cats = debugParam.split(',') as LogCategory[]
      cats.forEach(cat => this.categories.add(cat))
      console.log('[debug] Debug mode enabled for categories:', Array.from(this.categories))
    }
  }

  /**
   * Initialize debug mode from localStorage settings
   */
  private initFromSettings() {
    if (typeof window === 'undefined') return

    try {
      const settingsStr = localStorage.getItem('datm_settings')
      if (settingsStr) {
        const settings = JSON.parse(settingsStr)
        if (settings.debugMode === true) {
          this.enabled = true
          this.categories.add('time')
          this.categories.add('db')
          this.categories.add('ui')
          this.categories.add('repo')
          this.categories.add('general')
          console.log('[debug] Debug mode enabled via Settings')
        }
      }
    } catch (error) {
      // Ignore settings parsing errors
    }
  }

  /**
   * Enable debug logging
   */
  enable(categories?: LogCategory[]) {
    this.enabled = true
    if (categories) {
      categories.forEach(cat => this.categories.add(cat))
    } else {
      this.categories.add('time')
      this.categories.add('db')
      this.categories.add('ui')
      this.categories.add('repo')
      this.categories.add('general')
    }
    console.log('[debug] Debug logging enabled for:', Array.from(this.categories))
  }

  /**
   * Disable debug logging
   */
  disable() {
    this.enabled = false
    this.categories.clear()
    console.log('[debug] Debug logging disabled')
  }

  /**
   * Check if logging is enabled for a category
   */
  isEnabled(category: LogCategory): boolean {
    return this.enabled && this.categories.has(category)
  }

  /**
   * Log a message with data
   */
  private log(category: LogCategory, level: LogLevel, message: string, data?: unknown) {
    if (!this.isEnabled(category)) return

    const timestamp = new Date().toISOString()
    const prefix = `[${category}]`
    const formattedMessage = `${prefix} ${message}`

    const entry: LogEntry = {
      category,
      level,
      message,
      data,
      timestamp,
    }

    switch (level) {
      case 'info':
        if (data !== undefined) {
          console.log(formattedMessage, data)
        } else {
          console.log(formattedMessage)
        }
        break
      case 'warn':
        if (data !== undefined) {
          console.warn(formattedMessage, data)
        } else {
          console.warn(formattedMessage)
        }
        break
      case 'error':
        if (data !== undefined) {
          console.error(formattedMessage, data)
        } else {
          console.error(formattedMessage)
        }
        break
    }

    // Store in session for debugging
    this.storeLog(entry)
  }

  /**
   * Store log entry in sessionStorage for review
   */
  private storeLog(entry: LogEntry) {
    if (typeof window === 'undefined') return

    try {
      const logsKey = 'datm_debug_logs'
      const logsStr = sessionStorage.getItem(logsKey)
      const logs: LogEntry[] = logsStr ? JSON.parse(logsStr) : []
      
      logs.push(entry)
      
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.shift()
      }
      
      sessionStorage.setItem(logsKey, JSON.stringify(logs))
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Get stored logs
   */
  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return []

    try {
      const logsKey = 'datm_debug_logs'
      const logsStr = sessionStorage.getItem(logsKey)
      return logsStr ? JSON.parse(logsStr) : []
    } catch (error) {
      return []
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem('datm_debug_logs')
    console.log('[debug] Logs cleared')
  }

  /**
   * Create category-specific loggers
   */
  createCategoryLogger(category: LogCategory) {
    return {
      info: (message: string, data?: unknown) => this.log(category, 'info', message, data),
      warn: (message: string, data?: unknown) => this.log(category, 'warn', message, data),
      error: (message: string, data?: unknown) => this.log(category, 'error', message, data),
    }
  }
}

// Singleton instance
const debugLogger = new DebugLogger()

// Export category-specific loggers
export const debugLog = {
  time: debugLogger.createCategoryLogger('time'),
  db: debugLogger.createCategoryLogger('db'),
  ui: debugLogger.createCategoryLogger('ui'),
  repo: debugLogger.createCategoryLogger('repo'),
  general: debugLogger.createCategoryLogger('general'),
}

// Export logger instance for control
export const debugControl = {
  enable: (categories?: LogCategory[]) => debugLogger.enable(categories),
  disable: () => debugLogger.disable(),
  isEnabled: (category: LogCategory) => debugLogger.isEnabled(category),
  getLogs: () => debugLogger.getLogs(),
  clearLogs: () => debugLogger.clearLogs(),
}

// Make available globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).debugLog = debugLog
  (window as any).debugControl = debugControl
}
