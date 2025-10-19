/**
 * Unit Tests for timeBuckets.ts
 * 
 * Tests timezone-aware week calculations including:
 * - Sunday vs Monday week start
 * - DST transitions (spring forward, fall back)
 * - Midnight boundaries
 * - Cross-timezone consistency
 * - Edge cases (year boundaries, leap years)
 */

import { describe, it, expect } from 'vitest'
import {
  toLocal,
  weekRangeFor,
  isInRange,
  getCurrentWeekRange,
  isCurrentWeek,
  getWeekLabel,
  parseWeekLabel,
  type WeekStart,
} from './timeBuckets'

describe('timeBuckets', () => {
  describe('toLocal', () => {
    it('converts UTC to America/New_York correctly', () => {
      // UTC: 2025-10-18T14:30:00.000Z
      // EDT (UTC-4): 2025-10-18T10:30:00
      const local = toLocal('2025-10-18T14:30:00.000Z', 'America/New_York')
      
      expect(local.getFullYear()).toBe(2025)
      expect(local.getMonth()).toBe(9) // October = 9 (0-indexed)
      expect(local.getDate()).toBe(18)
      expect(local.getHours()).toBe(10)
      expect(local.getMinutes()).toBe(30)
    })

    it('converts UTC to Europe/London correctly', () => {
      // UTC: 2025-10-18T14:30:00.000Z
      // BST (UTC+1): 2025-10-18T15:30:00
      const local = toLocal('2025-10-18T14:30:00.000Z', 'Europe/London')
      
      expect(local.getFullYear()).toBe(2025)
      expect(local.getMonth()).toBe(9)
      expect(local.getDate()).toBe(18)
      expect(local.getHours()).toBe(15)
      expect(local.getMinutes()).toBe(30)
    })

    it('handles date crossing midnight correctly', () => {
      // UTC: 2025-10-18T03:30:00.000Z
      // PDT (UTC-7): 2025-10-17T20:30:00 (previous day!)
      const local = toLocal('2025-10-18T03:30:00.000Z', 'America/Los_Angeles')
      
      expect(local.getFullYear()).toBe(2025)
      expect(local.getMonth()).toBe(9)
      expect(local.getDate()).toBe(17) // Previous day
      expect(local.getHours()).toBe(20)
    })
  })

  describe('weekRangeFor - Monday start (ISO 8601)', () => {
    it('calculates week range for Friday correctly', () => {
      // Friday, Oct 17, 2025 at noon EDT
      const range = weekRangeFor('2025-10-17T16:00:00.000Z', 'America/New_York', 'monday')
      
      // Week should be Monday Oct 13 - Monday Oct 20
      expect(range.startIso).toBe('2025-10-13T04:00:00.000Z') // Monday 00:00 EDT
      expect(range.endIso).toBe('2025-10-20T04:00:00.000Z') // Next Monday 00:00 EDT
      expect(range.weekLabel).toMatch(/2025-W\d{2}/)
    })

    it('handles Monday itself correctly', () => {
      // Monday, Oct 13, 2025 at 10:00 EDT
      const range = weekRangeFor('2025-10-13T14:00:00.000Z', 'America/New_York', 'monday')
      
      // Should still be same week (Monday Oct 13 - Monday Oct 20)
      expect(range.startIso).toBe('2025-10-13T04:00:00.000Z')
      expect(range.endIso).toBe('2025-10-20T04:00:00.000Z')
    })

    it('handles Sunday correctly (end of week)', () => {
      // Sunday, Oct 19, 2025 at 10:00 EDT
      const range = weekRangeFor('2025-10-19T14:00:00.000Z', 'America/New_York', 'monday')
      
      // Should still be same week (Monday Oct 13 - Monday Oct 20)
      expect(range.startIso).toBe('2025-10-13T04:00:00.000Z')
      expect(range.endIso).toBe('2025-10-20T04:00:00.000Z')
    })

    it('handles midnight on Monday correctly', () => {
      // Monday, Oct 13, 2025 at 00:00:00 EDT
      const range = weekRangeFor('2025-10-13T04:00:00.000Z', 'America/New_York', 'monday')
      
      // Should be start of week
      expect(range.startIso).toBe('2025-10-13T04:00:00.000Z')
      expect(range.endIso).toBe('2025-10-20T04:00:00.000Z')
    })
  })

  describe('weekRangeFor - Sunday start (US convention)', () => {
    it('calculates week range for Friday correctly', () => {
      // Friday, Oct 17, 2025 at noon EDT
      const range = weekRangeFor('2025-10-17T16:00:00.000Z', 'America/New_York', 'sunday')
      
      // Week should be Sunday Oct 12 - Sunday Oct 19
      expect(range.startIso).toBe('2025-10-12T04:00:00.000Z') // Sunday 00:00 EDT
      expect(range.endIso).toBe('2025-10-19T04:00:00.000Z') // Next Sunday 00:00 EDT
    })

    it('handles Sunday correctly (start of week)', () => {
      // Sunday, Oct 12, 2025 at 10:00 EDT
      const range = weekRangeFor('2025-10-12T14:00:00.000Z', 'America/New_York', 'sunday')
      
      // Should be start of week (Sunday Oct 12 - Sunday Oct 19)
      expect(range.startIso).toBe('2025-10-12T04:00:00.000Z')
      expect(range.endIso).toBe('2025-10-19T04:00:00.000Z')
    })

    it('handles Saturday correctly (end of week)', () => {
      // Saturday, Oct 18, 2025 at 10:00 EDT
      const range = weekRangeFor('2025-10-18T14:00:00.000Z', 'America/New_York', 'sunday')
      
      // Should still be same week (Sunday Oct 12 - Sunday Oct 19)
      expect(range.startIso).toBe('2025-10-12T04:00:00.000Z')
      expect(range.endIso).toBe('2025-10-19T04:00:00.000Z')
    })
  })

  describe('DST Transitions', () => {
    it('handles DST spring forward (clocks ahead) in America/New_York', () => {
      // DST starts March 9, 2025 at 2:00 AM → 3:00 AM
      // Friday, March 7, 2025 (before DST)
      const beforeDST = weekRangeFor('2025-03-07T12:00:00.000Z', 'America/New_York', 'monday')
      
      // Week: Monday Mar 3 - Monday Mar 10
      // Before DST: EST (UTC-5), so Monday 00:00 = 05:00:00.000Z
      // After DST: EDT (UTC-4), so Monday 00:00 = 04:00:00.000Z
      expect(beforeDST.startIso).toBe('2025-03-03T05:00:00.000Z') // Monday 00:00 EST
      expect(beforeDST.endIso).toBe('2025-03-10T04:00:00.000Z') // Monday 00:00 EDT (hour difference!)
    })

    it('handles DST fall back (clocks back) in America/New_York', () => {
      // DST ends November 2, 2025 at 2:00 AM → 1:00 AM
      // Friday, October 31, 2025 (before fall back)
      const beforeFallBack = weekRangeFor('2025-10-31T16:00:00.000Z', 'America/New_York', 'monday')
      
      // Week: Monday Oct 27 - Monday Nov 3
      // Before fall back: EDT (UTC-4)
      // After fall back: EST (UTC-5)
      expect(beforeFallBack.startIso).toBe('2025-10-27T04:00:00.000Z') // Monday 00:00 EDT
      expect(beforeFallBack.endIso).toBe('2025-11-03T05:00:00.000Z') // Monday 00:00 EST
    })
  })

  describe('isInRange', () => {
    const startIso = '2025-10-13T04:00:00.000Z' // Monday 00:00 EDT
    const endIso = '2025-10-20T04:00:00.000Z' // Next Monday 00:00 EDT

    it('returns true for date in middle of range', () => {
      const inRange = isInRange('2025-10-17T16:00:00.000Z', startIso, endIso)
      expect(inRange).toBe(true)
    })

    it('returns true for start boundary (inclusive)', () => {
      const onStart = isInRange(startIso, startIso, endIso)
      expect(onStart).toBe(true)
    })

    it('returns false for end boundary (exclusive)', () => {
      const onEnd = isInRange(endIso, startIso, endIso)
      expect(onEnd).toBe(false)
    })

    it('returns false for date before range', () => {
      const before = isInRange('2025-10-12T16:00:00.000Z', startIso, endIso)
      expect(before).toBe(false)
    })

    it('returns false for date after range', () => {
      const after = isInRange('2025-10-21T16:00:00.000Z', startIso, endIso)
      expect(after).toBe(false)
    })

    it('handles millisecond before end correctly', () => {
      const almostEnd = '2025-10-20T03:59:59.999Z'
      const inRange = isInRange(almostEnd, startIso, endIso)
      expect(inRange).toBe(true)
    })
  })

  describe('getCurrentWeekRange', () => {
    it('returns a valid week range for current time', () => {
      const range = getCurrentWeekRange('America/New_York', 'monday')
      
      expect(range.startIso).toBeDefined()
      expect(range.endIso).toBeDefined()
      expect(range.weekLabel).toMatch(/^\d{4}-W\d{2}$/)
      
      // End should be 7 days after start
      const start = new Date(range.startIso).getTime()
      const end = new Date(range.endIso).getTime()
      const diffDays = (end - start) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBe(7)
    })
  })

  describe('isCurrentWeek', () => {
    it('returns true for a date in current week', () => {
      // Use a date we know is in current week (today)
      const today = new Date().toISOString()
      const result = isCurrentWeek(today, 'America/New_York', 'monday')
      expect(result).toBe(true)
    })

    it('returns false for a date far in the past', () => {
      const pastDate = '2020-01-01T00:00:00.000Z'
      const result = isCurrentWeek(pastDate, 'America/New_York', 'monday')
      expect(result).toBe(false)
    })
  })

  describe('getWeekLabel', () => {
    it('generates consistent week labels', () => {
      const label1 = getWeekLabel('2025-10-13T14:00:00.000Z', 'America/New_York', 'monday')
      const label2 = getWeekLabel('2025-10-17T14:00:00.000Z', 'America/New_York', 'monday')
      
      // Both dates are in same week (Monday Oct 13 - Sunday Oct 19)
      expect(label1).toBe(label2)
      expect(label1).toMatch(/2025-W\d{2}/)
    })

    it('generates different labels for different weeks', () => {
      const thisWeek = getWeekLabel('2025-10-17T14:00:00.000Z', 'America/New_York', 'monday')
      const nextWeek = getWeekLabel('2025-10-24T14:00:00.000Z', 'America/New_York', 'monday')
      
      expect(thisWeek).not.toBe(nextWeek)
    })
  })

  describe('parseWeekLabel', () => {
    it('parses valid week label correctly', () => {
      const range = parseWeekLabel('2025-W42', 'America/New_York', 'monday')
      
      expect(range.startIso).toBeDefined()
      expect(range.endIso).toBeDefined()
      expect(range.weekLabel).toBe('2025-W42')
    })

    it('throws error for invalid week label format', () => {
      expect(() => parseWeekLabel('2025W42', 'America/New_York', 'monday')).toThrow()
      expect(() => parseWeekLabel('2025-42', 'America/New_York', 'monday')).toThrow()
      expect(() => parseWeekLabel('W42-2025', 'America/New_York', 'monday')).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('handles year boundary correctly (Dec 31 → Jan 1)', () => {
      // New Year's Eve 2025, Tuesday
      const nye = weekRangeFor('2025-12-31T16:00:00.000Z', 'America/New_York', 'monday')
      
      // Week should span year boundary: Monday Dec 29, 2025 - Monday Jan 5, 2026
      expect(nye.startIso).toBe('2025-12-29T05:00:00.000Z')
      expect(nye.endIso).toBe('2026-01-05T05:00:00.000Z')
    })

    it('handles leap year correctly (Feb 29, 2024)', () => {
      // Leap day 2024, Thursday
      const leapDay = weekRangeFor('2024-02-29T16:00:00.000Z', 'America/New_York', 'monday')
      
      // Week: Monday Feb 26 - Monday Mar 4
      expect(leapDay.startIso).toBe('2024-02-26T05:00:00.000Z')
      expect(leapDay.endIso).toBe('2024-03-04T05:00:00.000Z')
    })

    it('handles different timezones consistently for same UTC moment', () => {
      const utcMoment = '2025-10-18T12:00:00.000Z'
      
      const nyRange = weekRangeFor(utcMoment, 'America/New_York', 'monday')
      const londonRange = weekRangeFor(utcMoment, 'Europe/London', 'monday')
      const tokyoRange = weekRangeFor(utcMoment, 'Asia/Tokyo', 'monday')
      
      // All should have valid ranges
      expect(nyRange.startIso).toBeDefined()
      expect(londonRange.startIso).toBeDefined()
      expect(tokyoRange.startIso).toBeDefined()
      
      // Ranges might differ due to timezone (e.g., Tokyo might be next day)
      // But each should be self-consistent (7 days apart)
      const nyDiff = (new Date(nyRange.endIso).getTime() - new Date(nyRange.startIso).getTime()) / (1000 * 60 * 60 * 24)
      const londonDiff = (new Date(londonRange.endIso).getTime() - new Date(londonRange.startIso).getTime()) / (1000 * 60 * 60 * 24)
      const tokyoDiff = (new Date(tokyoRange.endIso).getTime() - new Date(tokyoRange.startIso).getTime()) / (1000 * 60 * 60 * 24)
      
      expect(nyDiff).toBe(7)
      expect(londonDiff).toBe(7)
      expect(tokyoDiff).toBe(7)
    })

    it('handles midnight edge cases correctly', () => {
      // Exactly midnight on Monday in America/New_York
      const midnight = weekRangeFor('2025-10-13T04:00:00.000Z', 'America/New_York', 'monday')
      
      // Should be start of week
      expect(midnight.startIso).toBe('2025-10-13T04:00:00.000Z')
      expect(midnight.endIso).toBe('2025-10-20T04:00:00.000Z')
    })

    it('week ranges are always exactly 7 days', () => {
      // Test 10 random dates
      const testDates = [
        '2025-01-15T16:00:00.000Z',
        '2025-03-10T16:00:00.000Z', // DST transition
        '2025-06-21T16:00:00.000Z', // Summer solstice
        '2025-09-23T16:00:00.000Z', // Fall equinox
        '2025-11-02T16:00:00.000Z', // DST transition
        '2025-12-31T16:00:00.000Z', // Year boundary
        '2024-02-29T16:00:00.000Z', // Leap day
        '2025-04-01T16:00:00.000Z',
        '2025-07-04T16:00:00.000Z',
        '2025-10-31T16:00:00.000Z', // Halloween
      ]
      
      testDates.forEach(dateIso => {
        const range = weekRangeFor(dateIso, 'America/New_York', 'monday')
        const start = new Date(range.startIso).getTime()
        const end = new Date(range.endIso).getTime()
        const diffDays = (end - start) / (1000 * 60 * 60 * 24)
        
        expect(diffDays).toBe(7)
      })
    })
  })

  describe('Sunday vs Monday week start comparison', () => {
    it('produces different week boundaries for Sunday vs Monday start', () => {
      // Friday, Oct 17, 2025
      const fridayIso = '2025-10-17T16:00:00.000Z'
      
      const mondayRange = weekRangeFor(fridayIso, 'America/New_York', 'monday')
      const sundayRange = weekRangeFor(fridayIso, 'America/New_York', 'sunday')
      
      // Monday week: Oct 13 (Mon) - Oct 20 (Mon)
      // Sunday week: Oct 12 (Sun) - Oct 19 (Sun)
      expect(mondayRange.startIso).not.toBe(sundayRange.startIso)
      expect(mondayRange.endIso).not.toBe(sundayRange.endIso)
      
      // Monday start should be 1 day later than Sunday start
      const mondayStart = new Date(mondayRange.startIso).getTime()
      const sundayStart = new Date(sundayRange.startIso).getTime()
      const diffMs = mondayStart - sundayStart
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      
      expect(diffDays).toBe(1)
    })
  })
})
