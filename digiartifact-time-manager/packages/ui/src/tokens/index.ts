/**
 * DigiArtifact Design Tokens - Central Export
 */

import { colorTokens } from './colors';
import { typographyTokens } from './typography';
import { layoutTokens } from './layout';
import { motionTokens } from './motion';

export { colorTokens } from './colors';
export type { ColorTokens } from './colors';

export { typographyTokens } from './typography';
export type { TypographyTokens } from './typography';

export { layoutTokens } from './layout';
export type { LayoutTokens } from './layout';

export { motionTokens } from './motion';
export type { MotionTokens } from './motion';

// Combined token export
export const tokens = {
  color: colorTokens,
  typography: typographyTokens,
  layout: layoutTokens,
  motion: motionTokens,
} as const;

export type DesignTokens = typeof tokens;
