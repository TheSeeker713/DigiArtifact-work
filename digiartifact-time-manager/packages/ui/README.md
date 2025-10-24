# DigiArtifact UI Package

**Tokenized design system for DigiArtifact Time Manager**

## Features

- ✓ **WCAG AA compliant** color system with verified contrast ratios
- ✓ **Offline-first** using system fonts only (no CDN dependencies)
- ✓ **ND-friendly** motion system respecting reduced motion preferences
- ✓ **Tailwind + Radix + shadcn/ui** component architecture
- ✓ **Light/Dark themes** with bioluminescent dark mode
- ✓ **44×44px touch targets** for all interactive elements

## Installation

```bash
npm install @digiartifact/ui
```

## Peer Dependencies

```bash
npm install react react-dom @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

## Quick Start

```tsx
import { ThemeProvider, Button } from '@digiartifact/ui';
import '@digiartifact/ui/styles.css';

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Button variant="primary">Start Timer</Button>
    </ThemeProvider>
  );
}
```

## Documentation

See [Design System Documentation](../../docs/DesignSystem.md) for:
- Design tokens reference
- Component API
- Accessibility guidelines
- ASCII component blueprints
- WCAG AA contrast verification

## Design Tokens

```typescript
import { tokens } from '@digiartifact/ui/tokens';

// Colors
tokens.color.primary[400]        // #50C878
tokens.color.accent.biolume      // #64FFDA
tokens.color.surface.dark.base   // #0B1D16

// Typography
tokens.typography.fontFamily.sans
tokens.typography.fontSize.base  // 16px

// Spacing
tokens.layout.spacing[4]         // 1rem (16px)
tokens.layout.borderRadius.md    // 6px

// Motion
tokens.motion.duration.default   // 150ms
tokens.motion.easing.default     // cubic-bezier(0.4, 0, 0.2, 1)
```

## Tailwind Configuration

```javascript
// tailwind.config.js
import baseConfig from '@digiartifact/ui/tailwind.config';

export default {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@digiartifact/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

## Components

- `Button` - Accessible button with multiple variants
- `ThemeProvider` - Light/Dark theme management
- More components coming soon...

## License

Private - DigiArtifact Time Manager
