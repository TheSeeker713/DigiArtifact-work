import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ========================================================================
      // COLORS - From Design Tokens
      // ========================================================================
      colors: {
        // Primary palette (Emerald)
        primary: {
          50: '#E8F7F0',
          100: '#D1EFE1',
          200: '#A3DFC3',
          300: '#75CFA5',
          400: '#50C878',
          500: '#3DAB63',
          600: '#2E8F4E',
          700: '#1F7339',
          800: '#145726',
          900: '#0A3B17',
          950: '#051F0C',
          DEFAULT: '#50C878',
        },

        // Accent colors
        biolume: {
          DEFAULT: '#64FFDA',
          alt: '#7DFFEA',
          dim: '#3FD4B8',
        },

        // Semantic colors
        info: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',

        // Surface colors (light theme)
        surface: {
          base: '#FFFFFF',
          elevated: '#FAFAFA',
          overlay: '#F5F5F5',
          hover: '#F0F0F0',
          pressed: '#E8E8E8',
        },

        // Dark surface colors
        'surface-dark': {
          base: '#0B1D16',
          elevated: '#0F2B20',
          overlay: '#14362A',
          hover: '#1A4335',
          pressed: '#205040',
        },

        // Text colors (light theme)
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          tertiary: '#64748B',
          disabled: '#94A3B8',
          inverse: '#FFFFFF',
        },

        // Dark text colors
        'text-dark': {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          tertiary: '#94A3B8',
          disabled: '#64748B',
          inverse: '#0F172A',
        },

        // Border colors (light theme)
        border: {
          DEFAULT: '#E2E8F0',
          hover: '#CBD5E1',
          focus: '#50C878',
          divider: '#F1F5F9',
        },

        // Dark border colors
        'border-dark': {
          DEFAULT: '#1E3A30',
          hover: '#2A5246',
          focus: '#64FFDA',
          divider: '#142B22',
        },
      },

      // ========================================================================
      // TYPOGRAPHY - From Design Tokens
      // ========================================================================
      fontFamily: {
        sans: [
          'Segoe UI',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
        ],
        mono: [
          'Cascadia Code',
          'Consolas',
          'ui-monospace',
          'SFMono-Regular',
          'Monaco',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        md: ['1.125rem', { lineHeight: '1.75rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem' }],
        xl: ['1.5rem', { lineHeight: '2rem' }],
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },

      // ========================================================================
      // SPACING - 8px Base Unit
      // ========================================================================
      spacing: {
        0.5: '0.125rem',
        1.5: '0.375rem',
        2.5: '0.625rem',
        3.5: '0.875rem',
      },

      // ========================================================================
      // BORDER RADIUS
      // ========================================================================
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ========================================================================
      // BOX SHADOW - Elevation System
      // ========================================================================
      boxShadow: {
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        
        // Dark theme shadows
        'elevation-1-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'elevation-2-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
        'elevation-3-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)',
        'elevation-4-dark': '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)',
      },

      // ========================================================================
      // BACKDROP BLUR - Glass Morphism
      // ========================================================================
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },

      // ========================================================================
      // ANIMATION & TRANSITIONS
      // ========================================================================
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        moderate: '250ms',
        slow: '350ms',
        slower: '500ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideInFromTop: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutToTop: {
          from: { transform: 'translateY(0)', opacity: '1' },
          to: { transform: 'translateY(-100%)', opacity: '0' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },

      animation: {
        'fade-in': 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideInFromTop 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-out': 'slideOutToTop 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-out': 'scaleOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },

      // ========================================================================
      // Z-INDEX LAYERS
      // ========================================================================
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        notification: '1080',
        'system-tray': '1090',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Custom plugin for touch targets
    function ({ addUtilities }: any) {
      const newUtilities = {
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
        '.touch-target-comfortable': {
          minWidth: '48px',
          minHeight: '48px',
        },
        '.touch-target-large': {
          minWidth: '56px',
          minHeight: '56px',
        },
        // Glass morphism utilities
        '.glass-light': {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        },
        '.glass-light-strong': {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
        '.glass-dark': {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(11, 29, 22, 0.8)',
        },
        '.glass-dark-strong': {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(11, 29, 22, 0.9)',
        },
        '.glass-biolume': {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(11, 29, 22, 0.8)',
          borderWidth: '1px',
          borderColor: 'rgba(100, 255, 218, 0.2)',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};

export default config;
