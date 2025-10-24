/**
 * DigiArtifact Design Tokens - Typography
 * System font stack with offline-first priority
 * 8-step modular scale (1.250 - Major Third) for harmonious sizing
 */

export const typographyTokens = {
  // ============================================================================
  // FONT FAMILIES - {Font_Family}
  // Offline-first: No CDN dependencies, all system fonts
  // ============================================================================
  fontFamily: {
    sans: [
      // Windows system fonts (priority)
      'Segoe UI',
      '-apple-system',
      'BlinkMacSystemFont',
      // Cross-platform fallbacks
      'system-ui',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
      // Emoji support
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
    ].join(', '),

    mono: [
      // Windows terminal fonts (priority)
      'Cascadia Code',
      'Consolas',
      // Cross-platform monospace
      'ui-monospace',
      'SFMono-Regular',
      'Monaco',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ].join(', '),

    // Display font (same as sans for consistency)
    display: [
      'Segoe UI',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'sans-serif',
    ].join(', '),
  },

  // ============================================================================
  // FONT SCALE - {Font_Scale}
  // 8-step modular scale (base: 16px, ratio: 1.250 - Major Third)
  // Accessible minimum: 14px (sm)
  // ============================================================================
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px - Captions, labels
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - Small text (WCAG min)
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px - Body text
    md: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - Emphasized body
    lg: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px - Subheadings
    xl: ['1.5rem', { lineHeight: '2rem' }],       // 24px - H3
    '2xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - H2
    '3xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - H1
  },

  // ============================================================================
  // FONT WEIGHTS
  // ============================================================================
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // ============================================================================
  // LINE HEIGHTS - {LineHeight}
  // Optimized for readability and scanability
  // ============================================================================
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',      // Default for body text
    relaxed: '1.625',
    loose: '2',
  },

  // ============================================================================
  // LETTER SPACING - {LetterSpacing}
  // Subtle adjustments for different text sizes
  // ============================================================================
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // ============================================================================
  // TEXT STYLES - Predefined Combinations
  // ============================================================================
  textStyles: {
    // Headings
    h1: {
      fontSize: '2.25rem',      // 36px
      lineHeight: '2.5rem',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',     // 30px
      lineHeight: '2.25rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',       // 24px
      lineHeight: '2rem',
      fontWeight: '600',
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.25rem',      // 20px
      lineHeight: '1.75rem',
      fontWeight: '600',
      letterSpacing: '0em',
    },

    // Body text
    bodyLarge: {
      fontSize: '1.125rem',     // 18px
      lineHeight: '1.75rem',
      fontWeight: '400',
      letterSpacing: '0em',
    },
    body: {
      fontSize: '1rem',         // 16px
      lineHeight: '1.5rem',
      fontWeight: '400',
      letterSpacing: '0em',
    },
    bodySmall: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.25rem',
      fontWeight: '400',
      letterSpacing: '0em',
    },

    // UI elements
    button: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.25rem',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem',      // 12px
      lineHeight: '1rem',
      fontWeight: '400',
      letterSpacing: '0.025em',
    },
    label: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.25rem',
      fontWeight: '500',
      letterSpacing: '0em',
    },

    // Code
    code: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.5rem',
      fontWeight: '400',
      fontFamily: 'mono',
    },
  },
} as const;

export type TypographyTokens = typeof typographyTokens;
