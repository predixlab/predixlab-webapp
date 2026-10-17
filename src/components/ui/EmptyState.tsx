import React from 'react'

import { cn } from '@/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  tone?: 'default' | 'error'
  size?: 'sm' | 'md'
}

/**
 * Empty states teach the surface: what this region shows, and what to do to
 * fill it. "No data" on its own would leave the reader guessing.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  tone = 'default',
  size = 'md',
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center px-6 text-center',
      size === 'sm' ? 'py-8' : 'py-14',
      className,
    )}
  >
    {icon ? (
      <div
        className={cn(
          'mb-4 flex items-center justify-center rounded-xl border',
          size === 'sm' ? 'h-11 w-11' : 'h-14 w-14',
          tone === 'error'
            ? 'border-bear-line bg-bear-soft text-bear'
            : 'border-border bg-surface-raised text-text-muted',
        )}
      >
        {icon}
      </div>
    ) : null}
    <p className="text-sm font-bold text-text-primary">{title}</p>
    {description ? (
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{description}</p>
    ) : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
)

export default EmptyState
