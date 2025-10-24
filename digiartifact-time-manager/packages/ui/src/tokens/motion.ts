/**
 * DigiArtifact Design Tokens - Motion & Animation
 * ND-friendly motion system with respect for reduced motion preferences
 */

export const motionTokens = {
  // ============================================================================
  // MOTION REDUCE FLAG - {Motion_Reduce}
  // Windows: Settings > Ease of Access > Display > Show animations
  // CSS: prefers-reduced-motion media query
  // ============================================================================
  reduce: {
    // CSS media query
    mediaQuery: '@media (prefers-reduced-motion: reduce)',
    
    // Tailwind class
    class: 'motion-reduce',
    
    // JavaScript detection
    isReduced: () => 
      typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  },

  // ============================================================================
  // ANIMATION DURATIONS - {Anim_DurationDefault}
  // Shorter durations feel more responsive
  // ============================================================================
  duration: {
    instant: '0ms',
    fast: '100ms',       // Micro-interactions
    default: '150ms',    // {Anim_DurationDefault} - Standard transitions
    moderate: '250ms',   // Emphasis animations
    slow: '350ms',       // Page transitions
    slower: '500ms',     // Complex animations
    
    // Reduced motion durations (cut to 1/3)
    reduced: {
      fast: '33ms',
      default: '50ms',
      moderate: '83ms',
      slow: '117ms',
      slower: '167ms',
    },
  },

  // ============================================================================
  // EASING FUNCTIONS - {Easing_Default}
  // Natural, physics-based easing
  // ============================================================================
  easing: {
    // Standard easing
    linear: 'linear',
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',      // {Easing_Default} - Smooth
    in: 'cubic-bezier(0.4, 0, 1, 1)',             // Accelerate
    out: 'cubic-bezier(0, 0, 0.2, 1)',            // Decelerate
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',        // Smooth both ends
    
    // Emphasis easing (more dramatic)
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    
    // Reduced motion (linear only)
    reduced: 'linear',
  },

  // ============================================================================
  // TRANSITION PRESETS
  // Common transition combinations
  // ============================================================================
  transition: {
    // Standard transitions
    all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Reduced motion (instant or very fast)
    reduced: {
      all: 'all 50ms linear',
      colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 50ms linear',
      opacity: 'opacity 50ms linear',
      shadow: 'none',  // No shadow transitions
      transform: 'none',  // No transform transitions
    },
  },

  // ============================================================================
  // ANIMATION PRESETS
  // Predefined animations for common UI patterns
  // ============================================================================
  animation: {
    // Fade animations
    fadeIn: {
      keyframes: 'fadeIn',
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    },
    fadeOut: {
      keyframes: 'fadeOut',
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    },

    // Slide animations
    slideInFromTop: {
      keyframes: 'slideInFromTop',
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    },
    slideOutToTop: {
      keyframes: 'slideOutToTop',
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    },

    // Scale animations
    scaleIn: {
      keyframes: 'scaleIn',
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    },
    scaleOut: {
      keyframes: 'scaleOut',
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    },

    // Pulse (gentle, for notifications)
    pulse: {
      keyframes: 'pulse',
      duration: '2000ms',
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      iteration: 'infinite',
    },

    // Spin (for loading indicators)
    spin: {
      keyframes: 'spin',
      duration: '1000ms',
      easing: 'linear',
      iteration: 'infinite',
    },
  },

  // ============================================================================
  // KEYFRAMES DEFINITIONS
  // CSS @keyframes for animations
  // ============================================================================
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    slideInFromTop: {
      from: { transform: 'translateY(-100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideOutToTop: {
      from: { transform: 'translateY(0)', opacity: 1 },
      to: { transform: 'translateY(-100%)', opacity: 0 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },

  // ============================================================================
  // ND-FRIENDLY GUIDELINES
  // Best practices for motion with neurodivergent users
  // ============================================================================
  guidelines: {
    // Avoid these patterns
    avoid: [
      'Parallax scrolling',
      'Auto-playing videos/GIFs',
      'Continuous animations (> 5 seconds)',
      'Large-scale movements',
      'Flashing or strobing effects',
      'Multiple simultaneous animations',
    ],

    // Preferred patterns
    prefer: [
      'Subtle opacity changes',
      'Small-scale transforms (< 10px movement)',
      'Short duration (< 300ms)',
      'User-initiated animations only',
      'Clear animation purpose (not decorative)',
      'Respect prefers-reduced-motion',
    ],

    // Implementation checklist
    checklist: [
      'Test with Windows "Show animations" disabled',
      'Provide static alternative for all animations',
      'Ensure content readable without animation',
      'No essential info conveyed by motion alone',
      'Allow users to pause/stop animations',
    ],
  },
} as const;

export type MotionTokens = typeof motionTokens;
