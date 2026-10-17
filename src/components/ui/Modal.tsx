import { X } from 'lucide-react'
import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  icon?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  presentation?: 'dialog' | 'right-drawer'
  bodyClassName?: string
  children: React.ReactNode
}

/**
 * Centred dialog on pointer screens, bottom sheet on phones — the same
 * component, because a centred card on a 375px viewport is a scroll trap.
 * Locks background scroll, closes on Escape and on scrim press, and returns
 * focus to whatever opened it.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  icon,
  footer,
  size = 'md',
  presentation = 'dialog',
  bodyClassName,
  children,
}) => {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Callers pass an inline arrow, so `onClose` is a new function on every
  // render. Depending on it re-ran the whole effect on each keystroke: the
  // cleanup restored focus to the opener and the setup moved it to the first
  // focusable element, which is the close button. Holding it in a ref keeps
  // the effect keyed on `open` alone while still calling the current handler.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    returnFocusRef.current = document.activeElement as HTMLElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const modalRoot = panelRef.current?.parentElement
    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== modalRoot,
    )
    const backgroundState = backgroundElements.map(element => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }))
    backgroundElements.forEach(element => {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    })

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(selector),
      ).filter(element => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true')

      if (!focusable.length) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    // Do not open the mobile keyboard before the reader can see the sheet.
    const focusTarget = Array.from(
      bodyRef.current?.querySelectorAll<HTMLElement>(selector) ?? [],
    ).find(element => element.getClientRects().length > 0 && !element.matches('input, select, textarea'))
    ;(focusTarget ?? panelRef.current)?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      backgroundState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert
        if (ariaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', ariaHidden)
      })
      returnFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const isRightDrawer = presentation === 'right-drawer'

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex',
        isRightDrawer
          ? 'items-stretch justify-end'
          : 'items-end justify-center pt-[max(1rem,env(safe-area-inset-top,0px))] sm:items-center sm:p-6',
      )}
      style={{
        zIndex: 'var(--z-modal)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="pl-scrim-in absolute inset-0 cursor-pointer bg-[var(--pl-scrim)] backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex min-w-0 flex-col overflow-hidden border border-border bg-surface shadow-lg outline-none',
          isRightDrawer
            ? 'pl-right-drawer-in h-[var(--pl-viewport-h)] max-h-none w-full border-y-0 border-r-0 sm:w-[56vw] sm:min-w-[36rem] sm:max-w-[60rem]'
            : 'pl-sheet-in max-h-[min(94dvh,100%)] w-full rounded-t-2xl sm:pl-pop-in sm:max-h-[90dvh] sm:rounded-xl',
          !isRightDrawer && size === 'sm' && 'sm:max-w-md',
          !isRightDrawer && size === 'md' && 'sm:max-w-lg',
          !isRightDrawer && size === 'lg' && 'sm:max-w-2xl',
        )}
      >
        {!isRightDrawer ? <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden><span className="h-1 w-9 rounded-full bg-border-strong" /></div> : null}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6 sm:py-4">
            <h2
              id={titleId}
              className="flex min-w-0 items-center gap-2.5 text-base font-bold text-text-primary"
            >
              {icon}
              <span>{title}</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="pl-icon-button -mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

        <div
          ref={bodyRef}
          className={cn(
            'custom-scrollbar min-h-0 flex-1 overscroll-y-contain',
            isRightDrawer ? 'flex flex-col overflow-hidden px-4 py-5 sm:px-6' : 'overflow-y-auto px-4 py-5 sm:px-6 sm:py-6',
            bodyClassName,
          )}
        >
          {children}
        </div>

        {/* `pb-safe` *sets* padding-bottom, so pairing it with `py-3` collapsed
            the footer's bottom gap to zero and left the buttons on the border.
            Add the inset to the padding instead of replacing it. */}
        {footer ? (
          <footer className="shrink-0 border-t border-border bg-surface-raised/60 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6">
            {footer}
          </footer>
        ) : (
          !isRightDrawer ? <div className="pb-safe sm:hidden" /> : null
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
