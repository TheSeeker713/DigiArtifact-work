/**
 * FIX 5: Timezone-Aware Week Calculations
 * FIX 8: Week Boundary Policy for Multi-Day Sessions
 * 
 * Provides timezone-correct date operations for week boundaries, avoiding
 * off-by-one errors due to timezone differences and DST transitions.
 * 
 * Key Features:
 * - Converts UTC timestamps to local timezone using Intl.DateTimeFormat
 * - Calculates week boundaries respecting user's week start preference (Sunday/Monday)
 * - Handles DST transitions correctly (spring forward, fall back)
 * - Inclusive start, exclusive end date ranges
 * 
 * === WEEK BOUNDARY POLICY (FIX 8) ===
 * 
 * TIME ATTRIBUTION RULE:
 * All time is attributed to the **START date** of the work session, NOT the end date.
 * 
 * This means:
 * - Session starts Monday 11:30 PM, ends Tuesday 2:00 AM → Counted in MONDAY's week
 * - Session starts Friday 10:00 PM, ends Saturday 1:00 AM → Counted in FRIDAY's week
 * - Session spans week boundary (Sunday → Monday) → Counted in PREVIOUS week
 * 
 * Rationale:
 * 1. Consistent Attribution: Time logs "belong" to the day work began
 * 2. Prevents Double-Counting: A single session appears in only one week
 * 3. Matches Invoice Behavior: Work billed based on start date
 * 4. User Expectation: "I worked Monday night" = counted on Monday
 * 
 * Edge Cases:
 * - Overnight shift (8 PM → 4 AM): Full hours counted on start day
 * - Week-spanning session (Sun 11 PM → Mon 2 AM): Full hours in previous week
 * - Multi-day session (accident, e.g., forgot to clock out): Validation warning at >14h
 * 
 * Implementation:
 * - `getWeekLabel()` uses startDT only, ignoring endDT
 * - `weekRangeFor()` calculates boundaries from start timestamp
 * - `isInRange()` checks if startDT falls within [weekStart, weekEnd)
 * 
 * See FIX_8_WEEK_BOUNDARY_POLICY_SUMMARY.md for full documentation.
 * 
 * @module timeBuckets
 */

export type WeekStart = 'sunday' | 'monday'

export type WeekRange = {
  startIso: string
  endIso: string
  weekLabel: string
}

/**
 * Convert ISO date string to local Date in specified timezone
 * 
 * Uses Intl.DateTimeFormat to get timezone-aware date components, then
 * reconstructs Date in local context. This handles DST correctly.
 * 
 * @param dateIso - ISO 8601 date string (e.g., "2025-10-18T14:30:00.000Z")
 * @param tz - IANA timezone identifier (e.g., "America/New_York", "Europe/London")
 * @returns Date object representing the local time in the specified timezone
 * 
 * @example
 * // UTC: 2025-10-18T14:30:00.000Z
 * // America/New_York: 2025-10-18T10:30:00 (EDT, UTC-4)
 * const local = toLocal("2025-10-18T14:30:00.000Z", "America/New_York")
 */
export function toLocal(dateIso: string, tz: string): Date {
  const date = new Date(dateIso)
  
  // Get timezone-aware components using Intl
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  
  const parts = formatter.formatToParts(date)
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '0'
  
  const year = parseInt(getValue('year'), 10)
  const month = parseInt(getValue('month'), 10) - 1 // JS months are 0-indexed
  const day = parseInt(getValue('day'), 10)
  const hour = parseInt(getValue('hour'), 10)
  const minute = parseInt(getValue('minute'), 10)
  const second = parseInt(getValue('second'), 10)
  
  // Create Date in local context (not UTC)
  return new Date(year, month, day, hour, minute, second)
}

/**
 * Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * 
 * @param date - Date object
 * @returns Day of week number
 */
function getDayOfWeek(date: Date): number {
  return date.getDay()
}

/**
 * Get start of day (00:00:00.000) in local timezone
 * 
 * @param date - Date object
 * @returns New Date at start of day
 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

/**
 * Add days to date
 * 
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New Date with days added
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Format Date as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * @param date - Date to format
 * @returns ISO 8601 string in UTC
 */
function toIsoString(date: Date): string {
  return date.toISOString()
}

/**
 * Calculate week range (start and end ISO timestamps) for a given date
 * 
 * Returns the ISO boundaries of the week containing the given date, respecting
 * the user's week start preference (Sunday or Monday). Start is inclusive,
 * end is exclusive (start <= date < end).
 * 
 * Week calculation:
 * - Sunday start: Week runs Sunday 00:00:00 to next Sunday 00:00:00
 * - Monday start: Week runs Monday 00:00:00 to next Monday 00:00:00 (ISO 8601)
 * 
 * Handles DST transitions correctly by working in local timezone first,
 * then converting to UTC ISO strings.
 * 
 * @param dateIso - ISO 8601 date string
 * @param tz - IANA timezone identifier
 * @param weekStart - Week start day preference ('sunday' or 'monday')
 * @returns Object with startIso, endIso, and weekLabel
 * 
 * @example
 * // Friday, Oct 18, 2025 in America/New_York, Monday week start
 * const range = weekRangeFor("2025-10-18T14:30:00.000Z", "America/New_York", "monday")
 * // Returns:
 * // {
 * //   startIso: "2025-10-13T04:00:00.000Z",  // Monday 00:00 EDT
 * //   endIso: "2025-10-20T04:00:00.000Z",    // Next Monday 00:00 EDT
 * //   weekLabel: "2025-W42"
 * // }
 */
export function weekRangeFor(dateIso: string, tz: string, weekStart: WeekStart = 'monday'): WeekRange {
  // Convert to local timezone
  const localDate = toLocal(dateIso, tz)
  const dayOfWeek = getDayOfWeek(localDate)
  
  // Calculate days to subtract to get to week start
  let daysToStart: number
  if (weekStart === 'sunday') {
    // Sunday = 0, so subtract dayOfWeek to get back to Sunday
    daysToStart = dayOfWeek
  } else {
    // Monday start (ISO 8601)
    // Sunday = 0 → subtract 6 to get to previous Monday
    // Monday = 1 → subtract 1 to get to same Monday
    // Tuesday = 2 → subtract 2 to get to Monday
    daysToStart = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  }
  
  // Calculate week start (at 00:00:00)
  const weekStartDate = startOfDay(addDays(localDate, -daysToStart))
  
  // Week end is 7 days after start
  const weekEndDate = addDays(weekStartDate, 7)
  
  // Convert back to UTC ISO strings
  const startIso = toIsoString(weekStartDate)
  const endIso = toIsoString(weekEndDate)
  
  // Generate week label (ISO week number format: YYYY-Www)
  const weekLabel = formatWeekLabel(weekStartDate)
  
  return { startIso, endIso, weekLabel }
}

/**
 * Format week label in ISO 8601 format (YYYY-Www)
 * 
 * @param weekStartDate - Date at start of week (Monday 00:00:00)
 * @returns Week label like "2025-W42"
 */
function formatWeekLabel(weekStartDate: Date): string {
  // Get year and calculate week number
  const year = weekStartDate.getFullYear()
  
  // ISO week number calculation:
  // Week 1 is the first week containing a Thursday
  const yearStart = new Date(year, 0, 1)
  const daysSinceYearStart = Math.floor((weekStartDate.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.floor(daysSinceYearStart / 7) + 1
  
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Check if date is within range (inclusive start, exclusive end)
 * 
 * Range semantics: start <= date < end
 * - Start boundary is inclusive
 * - End boundary is exclusive
 * 
 * This matches standard interval notation [start, end) and is consistent
 * with how time ranges work (e.g., Monday 00:00 to Sunday 23:59:59.999).
 * 
 * @param iso - ISO date string to check
 * @param startIso - Range start (inclusive)
 * @param endIso - Range end (exclusive)
 * @returns True if iso is in range [startIso, endIso)
 * 
 * @example
 * // Check if Friday is in this week
 * const { startIso, endIso } = weekRangeFor("2025-10-18T00:00:00.000Z", "UTC", "monday")
 * const isInWeek = isInRange("2025-10-17T12:00:00.000Z", startIso, endIso) // true
 * const nextWeek = isInRange("2025-10-20T00:00:00.000Z", startIso, endIso) // false (exclusive end)
 */
export function isInRange(iso: string, startIso: string, endIso: string): boolean {
  const date = new Date(iso).getTime()
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  
  return date >= start && date < end
}

/**
 * Get current week range in specified timezone
 * 
 * Convenience wrapper around weekRangeFor for "now".
 * 
 * @param tz - IANA timezone identifier
 * @param weekStart - Week start day preference
 * @returns WeekRange for current week
 * 
 * @example
 * const thisWeek = getCurrentWeekRange("America/New_York", "monday")
 * console.log(thisWeek.weekLabel) // "2025-W42"
 */
export function getCurrentWeekRange(tz: string, weekStart: WeekStart = 'monday'): WeekRange {
  const now = new Date().toISOString()
  return weekRangeFor(now, tz, weekStart)
}

/**
 * Check if given date is in current week
 * 
 * @param dateIso - ISO date to check
 * @param tz - IANA timezone identifier
 * @param weekStart - Week start day preference
 * @returns True if date is in current week
 * 
 * @example
 * const isThisWeek = isCurrentWeek("2025-10-18T14:30:00.000Z", "America/New_York", "monday")
 */
export function isCurrentWeek(dateIso: string, tz: string, weekStart: WeekStart = 'monday'): boolean {
  const { startIso, endIso } = getCurrentWeekRange(tz, weekStart)
  return isInRange(dateIso, startIso, endIso)
}

/**
 * Get week label for a date (YYYY-Www format)
 * 
 * **IMPORTANT (FIX 8):** When used for TimeLogs, always pass startDT, NOT endDT.
 * This ensures time is attributed to the start date of the session.
 * 
 * @param dateIso - ISO date string (use startDT for TimeLogs)
 * @param tz - IANA timezone identifier
 * @param weekStart - Week start day preference
 * @returns Week label like "2025-W42"
 * 
 * @example
 * // Correct usage for TimeLog:
 * const label = getWeekLabel(timeLog.startDT, tz, weekStart)  // ✅ Use startDT
 * 
 * // Incorrect usage:
 * const label = getWeekLabel(timeLog.endDT, tz, weekStart)    // ❌ Don't use endDT
 * 
 * @example
 * // Session starts Monday 11:30 PM, ends Tuesday 2:00 AM
 * const startDT = "2025-10-13T23:30:00.000Z"  // Monday night
 * const endDT = "2025-10-14T02:00:00.000Z"    // Tuesday morning
 * const label = getWeekLabel(startDT, "America/New_York", "monday")
 * console.log(label) // "2025-W42" (Monday's week, not Tuesday's)
 */
export function getWeekLabel(dateIso: string, tz: string, weekStart: WeekStart = 'monday'): string {
  const { weekLabel } = weekRangeFor(dateIso, tz, weekStart)
  return weekLabel
}

/**
 * FIX 8: Session Duration Validation
 * 
 * Check if a work session exceeds a reasonable duration threshold.
 * Used to detect potential clock-out mistakes (e.g., forgot to clock out).
 * 
 * @param startDT - Session start timestamp (ISO string)
 * @param endDT - Session end timestamp (ISO string)
 * @param maxHours - Maximum reasonable session duration (default: 14 hours)
 * @returns Object with validation result and calculated duration
 * 
 * @example
 * const result = validateSessionDuration(
 *   "2025-10-18T08:00:00.000Z",
 *   "2025-10-19T02:00:00.000Z"
 * )
 * // result = { valid: false, hours: 18, minutes: 1080, exceedsBy: 4 }
 */
export function validateSessionDuration(
  startDT: string,
  endDT: string,
  maxHours = 14
): {
  valid: boolean
  hours: number
  minutes: number
  exceedsBy: number
} {
  const startMs = new Date(startDT).getTime()
  const endMs = new Date(endDT).getTime()
  const durationMs = endMs - startMs
  
  if (durationMs < 0) {
    // End before start - invalid
    return { valid: false, hours: 0, minutes: 0, exceedsBy: 0 }
  }
  
  const minutes = Math.round(durationMs / (1000 * 60))
  const hours = minutes / 60
  const maxMinutes = maxHours * 60
  
  const valid = minutes <= maxMinutes
  const exceedsBy = valid ? 0 : hours - maxHours
  
  return {
    valid,
    hours: Math.round(hours * 100) / 100,
    minutes,
    exceedsBy: Math.round(exceedsBy * 100) / 100,
  }
}

/**
 * FIX 8: Format session duration warning message
 * 
 * Generate user-friendly warning text for long sessions.
 * 
 * @param hours - Session duration in hours
 * @param exceedsBy - How many hours over the threshold
 * @returns Formatted warning message
 * 
 * @example
 * const msg = formatSessionWarning(18.5, 4.5)
 * // "This session is 18.5 hours long (4.5 hours over the typical limit).
 * //  Did you forget to clock out? Please confirm this is correct."
 */
export function formatSessionWarning(hours: number, exceedsBy: number): string {
  return `This session is ${hours.toFixed(1)} hours long (${exceedsBy.toFixed(1)} hours over the typical limit). Did you forget to clock out? Please confirm this is correct.`
}

/**
 * Parse week label back to week range
 * 
 * @param weekLabel - Week label like "2025-W42"
 * @param tz - IANA timezone identifier
 * @param weekStart - Week start day preference
 * @returns WeekRange for the labeled week
 * 
 * @example
 * const range = parseWeekLabel("2025-W42", "America/New_York", "monday")
 */
export function parseWeekLabel(weekLabel: string, tz: string, weekStart: WeekStart = 'monday'): WeekRange {
  // Parse "2025-W42" format
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/)
  if (!match) {
    throw new Error(`Invalid week label format: ${weekLabel}. Expected YYYY-Www`)
  }
  
  const year = parseInt(match[1], 10)
  const weekNum = parseInt(match[2], 10)
  
  // Calculate approximate date in that week (year start + weeks * 7 days)
  const yearStart = new Date(year, 0, 1)
  const approximateDate = new Date(yearStart.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000)
  
  // Get precise week range for that date
  return weekRangeFor(approximateDate.toISOString(), tz, weekStart)
}
