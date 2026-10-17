import React from 'react'

import { cn } from '@/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-accent-500 text-on-accent shadow-sm hover:bg-accent-600 active:bg-accent-700',
  secondary:
    'border border-border bg-surface text-text-primary hover:border-border-strong hover:bg-surface-raised active:bg-surface-overlay',
  outline:
    'border border-border bg-transparent text-text-secondary hover:border-border-strong hover:bg-surface-raised hover:text-text-primary',
  ghost:
    'border border-transparent bg-transparent text-text-secondary hover:bg-surface-raised hover:text-text-primary',
  subtle:
    'border border-transparent bg-accent-soft text-accent-400 hover:bg-accent-500 hover:text-on-accent',
  danger: 'border border-transparent bg-danger text-white hover:brightness-110 active:brightness-95',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'min-h-7 gap-1 rounded-sm px-2 text-2xs',
  sm: 'min-h-9 gap-1.5 rounded-md px-3 text-xs',
  md: 'min-h-[2.625rem] gap-2 rounded-md px-4 text-sm',
  lg: 'min-h-12 gap-2 rounded-md px-5 text-sm',
  icon: 'pl-icon-button h-10 w-10 justify-center rounded-md',
  'icon-sm': 'pl-icon-button h-9 w-9 justify-center rounded-md',
}

/**
 * The single button vocabulary for the whole surface. Every state a user can
 * reach — hover, active, focus, disabled, loading — is defined here so no
 * screen has to invent one.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'pl-button inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,color,opacity] duration-150 ease-out',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        'disabled:cursor-not-allowed disabled:opacity-45',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <span className="spinner h-3.5 w-3.5" aria-hidden /> : leftIcon}
      {children}
      {!loading ? rightIcon : null}
    </button>
  ),
)

Button.displayName = 'Button'

export default Button
