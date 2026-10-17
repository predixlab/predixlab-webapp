import { useController } from 'react-hook-form'
import type { Control, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form'

import { cn } from '@/utils'

interface VerificationCodeInputProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  length?: number
  rules?: UseControllerProps<TFieldValues>['rules']
  id?: string
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

const VerificationCodeInput = <TFieldValues extends FieldValues,>({
  name,
  control,
  length = 6,
  rules,
  id,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: VerificationCodeInputProps<TFieldValues>) => {
  const { field, fieldState } = useController({ name, control, rules })

  // A single native field keeps SMS/email autofill, selection and middle-digit
  // corrections intact instead of moving digits between separate inputs.
  return (
    <input
      {...field}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={length}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || fieldState.invalid}
      aria-required={Boolean(rules?.required)}
      value={String(field.value ?? '')}
      onChange={event => field.onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
      onPaste={event => {
        event.preventDefault()
        field.onChange(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length))
      }}
      className={cn(
        'input num h-14 text-center text-[1.5rem] font-semibold tracking-[0.45em]',
        'disabled:opacity-60',
      )}
    />
  )
}

export default VerificationCodeInput
