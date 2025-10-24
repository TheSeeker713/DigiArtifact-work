/**
 * DigiArtifact UI - Button Component
 * Accessible button with multiple variants following ND-friendly principles
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary-600 active:bg-primary-700',
        secondary:
          'bg-surface-elevated text-text-primary border border-border hover:bg-surface-hover active:bg-surface-pressed dark:bg-surface-dark-elevated dark:text-text-dark-primary dark:border-border-dark dark:hover:bg-surface-dark-hover',
        ghost:
          'hover:bg-surface-hover active:bg-surface-pressed text-text-primary dark:hover:bg-surface-dark-hover dark:text-text-dark-primary',
        destructive:
          'bg-error text-white hover:bg-error/90 active:bg-error/80',
        biolume:
          'bg-biolume text-surface-dark-base hover:bg-biolume-alt active:bg-biolume-dim font-semibold',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
