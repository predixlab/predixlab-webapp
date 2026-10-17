import React, { useCallback, useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/utils'

interface DropdownProps {
  /** Renders the button contents. */
  trigger: React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'start' | 'end'
  triggerClassName?: string
  menuClassName?: string
  label: string
}

/**
 * A menu anchored to its trigger. Closes on Escape, on outside pointer-down
 * and after any item runs, so it never strands the reader behind an overlay.
 */
const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'end',
  triggerClassName,
  menuClassName,
  label,
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        rootRef.current?.querySelector('button')?.focus()
      }
      if (event.key === 'Tab') close()
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
      )
      if (!items.length) return
      event.preventDefault()
      const current = items.findIndex(item => item === document.activeElement)
      const next = event.key === 'Home' ? 0
        : event.key === 'End' ? items.length - 1
          : event.key === 'ArrowDown' ? (current + 1) % items.length
            : (current - 1 + items.length) % items.length
      items[next].focus()
    }

    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen(o => !o)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={cn(
          'pl-button inline-flex items-center gap-1.5 rounded-md text-text-secondary transition-colors duration-150',
          'hover:bg-surface-raised hover:text-text-primary',
          'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
          open && 'bg-surface-raised text-text-primary',
          triggerClassName,
        )}
      >
        {trigger}
      </button>

      {open ? (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={{ zIndex: 'var(--z-dropdown)' }}
          className={cn(
            'pl-pop-in absolute mt-2 min-w-44 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-border bg-surface-overlay p-1.5 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  )
}

export const DropdownItem: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'danger' }
> = ({ tone = 'default', className, children, ...rest }) => (
  <button
    type="button"
    role="menuitem"
    className={cn(
      'flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-100',
      tone === 'danger'
        ? 'text-text-secondary hover:bg-bear-soft hover:text-bear'
        : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

export const DropdownLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-1 border-b border-border px-3 pt-2 pb-3">{children}</div>
)

export default Dropdown
