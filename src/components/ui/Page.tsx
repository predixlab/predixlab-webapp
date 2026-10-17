import { CalendarDays } from 'lucide-react'
import React from 'react'

import { cn } from '@/utils'

interface PageProps {
  children: React.ReactNode
  /** Narrower measure for settings-style, mostly-prose screens. */
  width?: 'wide' | 'standard' | 'narrow'
  className?: string
}

/**
 * Every screen sits in the same box: one max width, one horizontal rhythm,
 * one vertical gap. Consistency across screens is the whole point of a shell.
 */
export const Page: React.FC<PageProps> = ({ children, width = 'wide', className }) => (
  <div
    className={cn(
      'pl-fade-in mx-auto flex w-full min-w-0 flex-col gap-5 px-4 pt-6 pb-8 sm:gap-7 sm:px-6 sm:pt-8 sm:pb-10 xl:px-8',
      width === 'wide' && 'max-w-[1600px]',
      width === 'standard' && 'max-w-6xl',
      width === 'narrow' && 'max-w-4xl',
      className,
    )}
  >
    {children}
  </div>
)

interface PageHeaderProps {
  title: React.ReactNode
  date?: React.ReactNode
  subtitle?: React.ReactNode
  /** Small status chips shown next to the title (date, count, live state). */
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  date,
  subtitle,
  meta,
  actions,
  className,
}) => (
  <header
    className={cn(
      'flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
      className,
    )}
  >
    <div className="min-w-0 max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold tracking-[-0.04em] text-text-primary sm:text-3xl">{title}</h1>
        {date ? (
          <span className="num inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {date}
          </span>
        ) : null}
      </div>
      {subtitle || meta ? (
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          {subtitle ? <p className="max-w-2xl text-sm leading-6 text-text-secondary">{subtitle}</p> : null}
          {meta ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              {meta}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
    {actions ? (
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:pt-0.5">
        {actions}
      </div>
    ) : null}
  </header>
)

export default Page
