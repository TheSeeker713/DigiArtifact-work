/**
 * DigiArtifact UI - Utility Functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper override handling
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if user prefers reduced motion
 * Respects Windows "Show animations" setting
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark mode
 * Respects Windows theme preference
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if user prefers high contrast
 * Respects Windows high contrast mode
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? Math.max(duration / 3, 50) : duration;
}

/**
 * Get safe blur value based on performance
 * Lower blur on older devices for better performance
 */
export function getSafeBlurValue(preferred: number): number {
  if (typeof window === 'undefined') return preferred;
  
  // Check for reduced motion (often correlates with performance concerns)
  if (prefersReducedMotion()) return Math.min(preferred, 4);
  
  return preferred;
}
