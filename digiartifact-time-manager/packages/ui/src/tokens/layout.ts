/**
 * DigiArtifact Design Tokens - Spacing, Radii, Shadows, and Layout
 * Consistent spacing system and visual hierarchy
 */

export const layoutTokens = {
  // ============================================================================
  // SPACING SCALE - {Space_xs..xl}
  // 8px base unit for consistent rhythm
  // ============================================================================
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px - Base unit
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
  },

  // Named spacing for semantic use
  spacingNamed: {
    xs: '0.5rem',     // 8px
    sm: '0.75rem',    // 12px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // ============================================================================
  // BORDER RADIUS - {Radius_sm..2xl}
  // Subtle curves for modern, calm aesthetic
  // ============================================================================
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px - Buttons, inputs
    md: '0.375rem',   // 6px - Cards, small panels
    lg: '0.5rem',     // 8px - Large panels
    xl: '0.75rem',    // 12px - Modals
    '2xl': '1rem',    // 16px - Large containers
    '3xl': '1.5rem',  // 24px - Hero elements
    full: '9999px',   // Pills, avatars
  },

  // ============================================================================
  // SHADOWS - {Shadow_elev1..4}
  // Subtle elevation for depth without distraction
  // ============================================================================
  boxShadow: {
    // Light theme shadows
    light: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    },

    // Dark theme shadows (deeper, more prominent)
    dark: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    },

    // Elevation semantic names
    elevation: {
      1: 'sm',  // Buttons, inputs
      2: 'md',  // Cards, panels
      3: 'lg',  // Dropdowns, popovers
      4: 'xl',  // Modals, dialogs
    },
  },

  // ============================================================================
  // GLASS MORPHISM - {Glass_Light}, {Glass_Dark}
  // Frosted glass effects with safe blur levels
  // ============================================================================
  glass: {
    light: {
      // Subtle glass for light theme
      default: 'backdrop-blur-sm bg-white/80',
      strong: 'backdrop-blur-md bg-white/90',
      subtle: 'backdrop-blur-sm bg-white/60',
      css: {
        default: 'backdrop-filter: blur(4px); background-color: rgba(255, 255, 255, 0.8);',
        strong: 'backdrop-filter: blur(8px); background-color: rgba(255, 255, 255, 0.9);',
        subtle: 'backdrop-filter: blur(4px); background-color: rgba(255, 255, 255, 0.6);',
      },
    },
    dark: {
      // Bioluminescent glass for dark theme
      default: 'backdrop-blur-sm bg-[#0B1D16]/80',
      strong: 'backdrop-blur-md bg-[#0B1D16]/90',
      subtle: 'backdrop-blur-sm bg-[#0B1D16]/60',
      biolume: 'backdrop-blur-md bg-[#0B1D16]/80 border border-[#64FFDA]/20',
      css: {
        default: 'backdrop-filter: blur(4px); background-color: rgba(11, 29, 22, 0.8);',
        strong: 'backdrop-filter: blur(8px); background-color: rgba(11, 29, 22, 0.9);',
        subtle: 'backdrop-filter: blur(4px); background-color: rgba(11, 29, 22, 0.6);',
        biolume: 'backdrop-filter: blur(8px); background-color: rgba(11, 29, 22, 0.8); border: 1px solid rgba(100, 255, 218, 0.2);',
      },
    },
  },

  // ============================================================================
  // Z-INDEX LAYERS
  // Consistent stacking context
  // ============================================================================
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
    systemTray: 1090,
  },

  // ============================================================================
  // TOUCH TARGETS - Accessibility Requirement
  // Minimum 44x44px for ND-friendly interaction
  // ============================================================================
  touchTarget: {
    min: '44px',      // WCAG 2.5.5 minimum
    comfortable: '48px',
    large: '56px',
  },

  // ============================================================================
  // CONTAINER WIDTHS
  // Max widths for content areas
  // ============================================================================
  container: {
    xs: '20rem',      // 320px
    sm: '24rem',      // 384px
    md: '28rem',      // 448px
    lg: '32rem',      // 512px
    xl: '36rem',      // 576px
    '2xl': '42rem',   // 672px
    '3xl': '48rem',   // 768px
    '4xl': '56rem',   // 896px
    '5xl': '64rem',   // 1024px
    '6xl': '72rem',   // 1152px
    '7xl': '80rem',   // 1280px
    full: '100%',
  },
} as const;

export type LayoutTokens = typeof layoutTokens;
