/**
 * Gamification System Types
 * 
 * Types for XP, Levels, Achievements, Milestones, Stickers, Rewards, and Chests.
 * Designed to make time tracking more engaging and rewarding.
 */

import type { BaseRecord, ISODate } from './entities'

/**
 * User Profile with gamification stats
 */
export type UserProfile = BaseRecord & {
  username: string
  displayName?: string
  avatar?: string // URL or emoji
  level: number
  currentXP: number
  totalXP: number
  xpToNextLevel: number
  streak: number // consecutive days worked
  longestStreak: number
  totalWorkHours: number
  totalPomodoros: number
  badges: string[] // Array of achievement IDs
  stickers: string[] // Array of sticker IDs
  title?: string // "Productivity Master", "Focus Champion", etc.
  joinedDate: ISODate
  lastActiveDate: ISODate
}

/**
 * XP Sources - how users earn experience points
 */
export type XPSource = 
  | 'clock_in'          // +5 XP
  | 'clock_out'         // +10 XP
  | 'pomodoro_complete' // +20 XP
  | 'task_complete'     // +30 XP
  | 'job_complete'      // +100 XP
  | 'invoice_sent'      // +50 XP
  | 'payment_received'  // +75 XP
  | 'daily_goal_met'    // +100 XP
  | 'weekly_goal_met'   // +300 XP
  | 'streak_milestone'  // Variable (50-500 XP)

/**
 * XP Transaction Record
 */
export type XPTransaction = BaseRecord & {
  userId?: string // For future multi-user
  source: XPSource
  amount: number
  reason: string
  relatedEntityId?: string // job ID, task ID, etc.
  timestamp: ISODate
}

/**
 * Achievement/Badge Definition
 */
export type Achievement = {
  id: string
  name: string
  description: string
  icon: string // emoji or icon name
  category: 'time' | 'productivity' | 'revenue' | 'streak' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xpReward: number
  condition: AchievementCondition
}

/**
 * Achievement Condition
 */
export type AchievementCondition = {
  type: 'hours_logged' | 'pomodoros_completed' | 'streak_days' | 'revenue_earned' | 'tasks_completed' | 'custom'
  threshold: number
  timeframe?: 'all_time' | 'daily' | 'weekly' | 'monthly'
}

/**
 * User's unlocked achievement
 */
export type UnlockedAchievement = BaseRecord & {
  userId?: string
  achievementId: string
  unlockedAt: ISODate
  progress?: number // For progressive achievements
  notified?: boolean // Whether user has been notified
}

/**
 * Milestone - Major progress markers
 */
export type Milestone = {
  id: string
  name: string
  description: string
  icon: string
  level: number // Level at which milestone is unlocked
  xpReward: number
  stickers?: string[] // Stickers unlocked at this milestone
}

/**
 * Sticker - Collectible decorative items
 */
export type Sticker = {
  id: string
  name: string
  image: string // emoji or image URL
  category: 'animals' | 'food' | 'objects' | 'emojis' | 'seasonal' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockCondition?: string // Description of how to unlock
}

/**
 * Reward Chest - Random rewards
 */
export type RewardChest = {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  contents: ChestContents
}

export type ChestContents = {
  xpMin: number
  xpMax: number
  stickers: { id: string; dropRate: number }[] // dropRate 0-1
  specialRewards?: string[] // Special one-time rewards
}

/**
 * User's chest inventory
 */
export type UserChest = BaseRecord & {
  userId?: string
  chestId: string
  opened: boolean
  earnedAt: ISODate
  openedAt?: ISODate
  contents?: {
    xp: number
    stickers: string[]
    specialRewards?: string[]
  }
}

/**
 * Daily Challenge
 */
export type DailyChallenge = BaseRecord & {
  date: string // YYYY-MM-DD
  challenges: Challenge[]
}

export type Challenge = {
  id: string
  name: string
  description: string
  type: 'time' | 'tasks' | 'pomodoros' | 'revenue'
  target: number
  progress: number
  completed: boolean
  xpReward: number
  chestReward?: string // chest ID
}

/**
 * Level-Up Rewards
 */
export type LevelReward = {
  level: number
  xp: number
  stickers?: string[]
  chests?: string[]
  title?: string
  specialUnlock?: string // "Dark mode theme", "Custom sounds", etc.
}

/**
 * Sound FX Configuration
 */
export type SoundFX = {
  id: string
  name: string
  category: 'notification' | 'achievement' | 'reward' | 'timer' | 'ambient'
  file: string // audio file path
  volume: number // 0-1
  enabled: boolean
}

export type SoundSettings = {
  masterVolume: number // 0-1
  enabled: boolean
  sounds: {
    clockIn: SoundFX
    clockOut: SoundFX
    breakStart: SoundFX
    breakEnd: SoundFX
    pomodoroComplete: SoundFX
    taskComplete: SoundFX
    levelUp: SoundFX
    achievementUnlocked: SoundFX
    chestOpened: SoundFX
    xpGain: SoundFX
  }
}

/**
 * Notification for gamification events
 */
export type GamificationNotification = {
  id: string
  type: 'xp_gain' | 'level_up' | 'achievement' | 'milestone' | 'reward' | 'streak'
  title: string
  message: string
  icon: string
  timestamp: ISODate
  read: boolean
  action?: {
    label: string
    callback: () => void
  }
}

/**
 * Predefined Achievements
 */
export const PREDEFINED_ACHIEVEMENTS: Achievement[] = [
  // Time-based
  {
    id: 'first_hour',
    name: 'First Hour',
    description: 'Log your first hour of work',
    icon: '⏱️',
    category: 'time',
    rarity: 'common',
    xpReward: 50,
    condition: { type: 'hours_logged', threshold: 1, timeframe: 'all_time' },
  },
  {
    id: 'ten_hours',
    name: 'Getting Started',
    description: 'Log 10 hours of work',
    icon: '🔟',
    category: 'time',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'hours_logged', threshold: 10, timeframe: 'all_time' },
  },
  {
    id: 'hundred_hours',
    name: 'Dedicated',
    description: 'Log 100 hours of work',
    icon: '💯',
    category: 'time',
    rarity: 'rare',
    xpReward: 500,
    condition: { type: 'hours_logged', threshold: 100, timeframe: 'all_time' },
  },
  {
    id: 'thousand_hours',
    name: 'Master of Time',
    description: 'Log 1,000 hours of work',
    icon: '👑',
    category: 'time',
    rarity: 'legendary',
    xpReward: 5000,
    condition: { type: 'hours_logged', threshold: 1000, timeframe: 'all_time' },
  },

  // Productivity
  {
    id: 'first_pomodoro',
    name: 'Focused Beginner',
    description: 'Complete your first Pomodoro',
    icon: '🍅',
    category: 'productivity',
    rarity: 'common',
    xpReward: 50,
    condition: { type: 'pomodoros_completed', threshold: 1, timeframe: 'all_time' },
  },
  {
    id: 'fifty_pomodoros',
    name: 'Focus Master',
    description: 'Complete 50 Pomodoros',
    icon: '🎯',
    category: 'productivity',
    rarity: 'rare',
    xpReward: 500,
    condition: { type: 'pomodoros_completed', threshold: 50, timeframe: 'all_time' },
  },
  {
    id: 'daily_goal',
    name: 'Daily Achiever',
    description: 'Meet your daily work goal',
    icon: '⭐',
    category: 'productivity',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'hours_logged', threshold: 8, timeframe: 'daily' },
  },

  // Streak
  {
    id: 'three_day_streak',
    name: 'On a Roll',
    description: 'Work 3 days in a row',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'streak_days', threshold: 3 },
  },
  {
    id: 'week_streak',
    name: 'Unstoppable',
    description: 'Work 7 days in a row',
    icon: '🚀',
    category: 'streak',
    rarity: 'rare',
    xpReward: 300,
    condition: { type: 'streak_days', threshold: 7 },
  },
  {
    id: 'month_streak',
    name: 'Legend',
    description: 'Work 30 days in a row',
    icon: '🏆',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 2000,
    condition: { type: 'streak_days', threshold: 30 },
  },

  // Revenue
  {
    id: 'first_invoice',
    name: 'First Sale',
    description: 'Send your first invoice',
    icon: '💰',
    category: 'revenue',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'custom', threshold: 1 },
  },
  {
    id: 'ten_k_revenue',
    name: 'Entrepreneur',
    description: 'Earn $10,000 in revenue',
    icon: '💵',
    category: 'revenue',
    rarity: 'epic',
    xpReward: 1000,
    condition: { type: 'revenue_earned', threshold: 10000, timeframe: 'all_time' },
  },
]

/**
 * Level-Up Table (XP required for each level)
 */
export function calculateXPForLevel(level: number): number {
  // Exponential growth: Level N requires N^2 * 100 XP
  // Level 1: 100 XP
  // Level 2: 400 XP
  // Level 3: 900 XP
  // Level 10: 10,000 XP
  return level * level * 100
}

export function calculateLevelFromXP(totalXP: number): number {
  let level = 1
  let xpRequired = calculateXPForLevel(level)
  
  while (totalXP >= xpRequired) {
    level++
    xpRequired += calculateXPForLevel(level)
  }
  
  return level - 1
}
