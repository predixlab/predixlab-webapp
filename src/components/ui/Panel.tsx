import React from 'react'

import { cn } from '@/utils'

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  /** Secondary row under the header: tabs, filter chips, range switches. */
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  /** Removes body padding, e.g. when embedding a full-bleed table. */
  flush?: boolean
  /** Fills the parent height and scrolls the body instead of the page. */
  fill?: boolean
  /** Surface role. Strong is focal, subtle is secondary, flat stays on the page plane. */
  variant?: 'default' | 'strong' | 'subtle' | 'flat'
  bodyClassName?: string
}

/**
 * The workhorse container: a titled region with a fixed-height header bar, an
 * optional toolbar rail and a body. Panels never nest — if a section needs
 * sub-structure it gets a labelled row or a divider, not a card inside a card.
 */
const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  icon,
  actions,
  toolbar,
  footer,
  flush = false,
  fill = false,
  variant = 'default',
  className,
  bodyClassName,
  children,
  ...rest
}) => (
  <section
    className={cn(
      'flex min-w-0 flex-col overflow-hidden',
      variant === 'default' && 'rounded-lg border border-border bg-surface shadow-sm',
      variant === 'strong' && 'rounded-xl border border-border-strong bg-surface shadow-sm',
      variant === 'subtle' && 'rounded-lg border border-border bg-surface-raised',
      variant === 'flat' && 'border-y border-border bg-transparent',
      fill && 'h-full min-h-0',
      className,
    )}
    {...rest}
  >
    {(title || actions) && (
      <header
        className={cn(
          'flex min-h-16 shrink-0 flex-col items-stretch justify-between gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5',
          variant === 'strong' && 'bg-surface-raised/50',
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          {icon ? <span className="mt-0.5 shrink-0 text-text-secondary sm:mt-0">{icon}</span> : null}
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-bold tracking-[-0.015em] text-text-primary">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-xs leading-5 text-text-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </header>
    )}

    {toolbar ? (
      <div className="scroll-rail shrink-0 border-b border-border bg-surface-raised/60 px-4 py-3 sm:px-5">
        {toolbar}
      </div>
    ) : null}

    <div className={cn('min-w-0', fill && 'min-h-0 flex-1', !flush && 'p-4 sm:p-5', bodyClassName)}>
      {children}
    </div>

    {footer ? (
      <div className="shrink-0 border-t border-border px-4 py-3.5 sm:px-5">{footer}</div>
    ) : null}
  </section>
)

export default Panel
