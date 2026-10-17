import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils'

type Side = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: Side
  className?: string
}

const GAP = 8

/**
 * Shown on hover and on keyboard focus. Positioned `fixed` from the trigger's
 * measured rect and rendered in a portal, because the collapsed nav rail is a
 * scroll container and an absolutely positioned label would be clipped by it.
 */
const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', className }) => {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const tooltipId = useId()
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const show = useCallback(() => {
    // The wrapper is `display: contents`, so it has no box of its own; measure
    // the element it wraps.
    const anchor = triggerRef.current?.firstElementChild ?? triggerRef.current
    const rect = anchor?.getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) return
    setAnchorRect(rect)
  }, [])

  const hide = useCallback(() => setAnchorRect(null), [])

  useLayoutEffect(() => {
    if (!anchorRect || !tooltipRef.current) return
    const { width, height } = tooltipRef.current.getBoundingClientRect()
    let top = anchorRect.top - height - GAP
    let left = anchorRect.left + (anchorRect.width - width) / 2
    if (side === 'bottom' || (side === 'top' && top < GAP)) top = anchorRect.bottom + GAP
    if (side === 'left' || side === 'right') {
      top = anchorRect.top + (anchorRect.height - height) / 2
      left = side === 'left' ? anchorRect.left - width - GAP : anchorRect.right + GAP
    }
    setPos({
      top: Math.max(GAP, Math.min(top, window.innerHeight - height - GAP)),
      left: Math.max(GAP, Math.min(left, window.innerWidth - width - GAP)),
    })
  }, [anchorRect, side, content])

  useEffect(() => {
    if (!anchorRect) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') hide() }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [anchorRect, hide])

  const trigger = React.isValidElement<{ 'aria-describedby'?: string }>(children)
    ? React.cloneElement(children, {
      'aria-describedby': [children.props['aria-describedby'], anchorRect ? tooltipId : undefined].filter(Boolean).join(' ') || undefined,
    })
    : children

  return (
    <>
      <span
        ref={triggerRef}
        className="contents"
        onPointerEnter={event => { if (event.pointerType !== 'touch') show() }}
        onPointerLeave={hide}
        onFocusCapture={show}
        onBlurCapture={hide}
      >
        {trigger}
      </span>
      {anchorRect && typeof document !== 'undefined'
        ? createPortal(
            <span
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                zIndex: 'var(--z-tooltip)',
              }}
              className={cn(
                'pointer-events-none w-max max-w-[min(20rem,calc(100vw-1rem))] rounded-md border border-border bg-surface-overlay px-3 py-2 text-xs leading-5 whitespace-normal text-text-primary shadow-md',
                className,
              )}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  )
}

export default Tooltip
