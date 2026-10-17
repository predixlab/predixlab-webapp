import React, { useEffect, useRef } from 'react'

import { cn } from '@/utils'

export interface TabItem<T extends string = string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  count?: number
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  variant?: 'segmented' | 'underline'
  fullWidth?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Two shapes for the same idea. `segmented` is a compact switch for a value
 * (range, side, category); `underline` reads as navigation between views.
 */
function Tabs<T extends string>({
  items,
  value,
  onChange,
  size = 'md',
  variant = 'segmented',
  fullWidth = false,
  className,
  'aria-label': ariaLabel,
}: TabsProps<T>) {
  const activeRef = useRef<HTMLButtonElement | null>(null)
  const railRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const active = activeRef.current
    const rail = railRef.current
    if (!active || !rail) return

    const activeRect = active.getBoundingClientRect()
    const railRect = rail.getBoundingClientRect()
    let nextLeft = rail.scrollLeft

    if (activeRect.left < railRect.left) {
      nextLeft -= railRect.left - activeRect.left
    } else if (activeRect.right > railRect.right) {
      nextLeft += activeRect.right - railRect.right
    } else {
      return
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.scrollTo({ left: nextLeft, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % items.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    onChange(items[next].value)
    event.currentTarget.closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  if (variant === 'underline') {
    return (
      <div
        ref={railRef}
        role="tablist"
        aria-label={ariaLabel}
        className={cn('scroll-rail flex min-w-0 items-center gap-2 border-b border-border', className)}
      >
        {items.map((item, index) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              ref={active ? activeRef : undefined}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              type="button"
              onClick={() => onChange(item.value)}
              onKeyDown={event => handleKeyDown(event, index)}
              className={cn(
                'pl-tab inline-flex shrink-0 items-center justify-center gap-2 border-b-2 px-3 font-semibold whitespace-nowrap transition-colors duration-150',
                fullWidth && 'flex-1',
                size === 'sm' ? 'min-h-10 py-2 text-xs' : 'min-h-12 py-3 text-sm',
                active
                  ? 'border-accent-500 text-accent-400'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {item.icon}
              {item.label}
              {typeof item.count === 'number' ? (
                <span className="num rounded-full bg-surface-sunken px-1.5 py-0.5 text-2xs text-text-muted">{item.count}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={railRef}
      className={cn('scroll-rail min-w-0 max-w-full overflow-x-auto', fullWidth && 'w-full', className)}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex min-w-max items-center gap-1 rounded-lg bg-surface-sunken p-1',
          fullWidth && 'flex w-full min-w-full',
        )}
      >
        {items.map((item, index) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              ref={active ? activeRef : undefined}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              type="button"
              onClick={() => onChange(item.value)}
              onKeyDown={event => handleKeyDown(event, index)}
              className={cn(
                'pl-tab inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150',
                'shrink-0 whitespace-nowrap',
                'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500',
                size === 'sm' ? 'min-h-8 px-2.5 text-xs' : 'min-h-10 px-3.5 text-sm',
                fullWidth && 'flex-1',
                active
                  ? 'bg-surface text-accent-400 shadow-sm'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              {item.icon}
              {item.label}
              {typeof item.count === 'number' ? (
                <span
                  className={cn(
                    'num rounded-full px-1.5 py-0.5 text-2xs',
                    active ? 'bg-accent-soft text-accent-400' : 'bg-surface-overlay text-text-muted',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Tabs
