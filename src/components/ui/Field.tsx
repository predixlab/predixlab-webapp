import React, { useId } from 'react'

import { cn } from '@/utils'

interface FieldProps {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Icon rendered inside the control, on the leading edge. */
  icon?: React.ReactNode
  required?: boolean
  hideLabel?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode
}

/**
 * One labelled-control layout for the whole app: label, control, then either
 * a hint or an error in the same slot so nothing shifts when validation fires.
 */
const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  icon,
  required,
  hideLabel = false,
  className,
  children,
}) => {
  const id = useId()
  const messageId = `${id}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className={cn('min-w-0', className)}>
      <label
        htmlFor={id}
        className={cn(
          hideLabel ? 'sr-only' : 'mb-1.5 block text-xs font-medium text-text-secondary',
        )}
      >
        {label}
        {required ? <span className="ml-0.5 text-bear">*</span> : null}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-text-muted">
            {icon}
          </span>
        ) : null}
        {children({
          id,
          'aria-invalid': Boolean(error),
          'aria-describedby': hasMessage ? messageId : undefined,
        })}
      </div>
      {hasMessage ? (
        <p
          id={messageId}
          className={cn('mt-1.5 text-xs', error ? 'text-bear' : 'text-text-muted')}
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  )
}

export default Field
