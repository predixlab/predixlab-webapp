import React from 'react'

import { cn } from '@/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'section' | 'article'
  interactive?: boolean
  padded?: boolean
}

/**
 * The base bordered surface. Hairline separation, no drop shadow: on a
 * near-white canvas the border already does the work, and stacked shadows
 * are what make dense dashboards feel muddy.
 */
export const Card: React.FC<CardProps> = ({
  as: Tag = 'div',
  interactive = false,
  padded = false,
  className,
  children,
  ...rest
}) => (
  <Tag
    className={cn(
      'min-w-0 rounded-lg border border-border bg-surface shadow-sm',
      interactive &&
        'transition-[border-color,background-color] duration-150 ease-out hover:border-border-strong hover:bg-surface-raised',
      padded && 'p-4 sm:p-5',
      className,
    )}
    {...rest}
  >
    {children}
  </Tag>
)

export const CardHeader: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    title?: React.ReactNode
    subtitle?: React.ReactNode
    actions?: React.ReactNode
  }
> = ({ title, subtitle, actions, className, children, ...rest }) => (
  <div
    className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5', className)}
    {...rest}
  >
    {children ?? (
      <div className="min-w-0">
        {title ? <h3 className="text-sm font-bold text-text-primary">{title}</h3> : null}
        {subtitle ? <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p> : null}
      </div>
    )}
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
)

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={cn('p-4 sm:p-5', className)} {...rest}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={cn('border-t border-border px-4 py-3.5 sm:px-5', className)} {...rest}>
    {children}
  </div>
)

export default Card
