import { addDays, addMonths, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

import Button from './Button'
import Modal from './Modal'

interface DatePickerModalProps {
  open: boolean
  onClose: () => void
  selectedDate?: string | null
  initialDate?: string | null
  onSelect: (date: string) => void
  onClear?: () => void
  isDateEnabled: (date: string, value: Date) => boolean
  hint?: React.ReactNode
  title?: React.ReactNode
}

const parseCalendarDate = (date?: string | null): Date | null => {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  open,
  onClose,
  selectedDate,
  initialDate,
  onSelect,
  onClear,
  isDateEnabled,
  hint,
  title,
}) => {
  const { t } = useTranslation()
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    () => parseCalendarDate(selectedDate ?? initialDate) ?? new Date(),
  )

  useEffect(() => {
    if (!open) return
    const focusDate = parseCalendarDate(selectedDate ?? initialDate)
    if (focusDate) setCalendarMonth(focusDate)
  }, [initialDate, open, selectedDate])

  const monthStart = startOfMonth(calendarMonth)
  const rows: React.ReactElement[] = []
  let day = startOfWeek(monthStart, { weekStartsOn: 0 })

  for (let week = 0; week < 6; week++) {
    const days: React.ReactElement[] = []
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = day
      const dateStr = format(date, 'yyyy-MM-dd')
      const isCurrentMonth = isSameMonth(date, monthStart)
      const isSelectable = isCurrentMonth && isDateEnabled(dateStr, date)
      const isSelected = selectedDate === dateStr

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={!isSelectable}
          aria-label={dateStr}
          aria-pressed={isSelected}
          aria-current={dateStr === format(new Date(), 'yyyy-MM-dd') ? 'date' : undefined}
          onClick={() => {
            if (!isSelectable) return
            onSelect(dateStr)
            onClose()
          }}
          className={cn(
            'num relative flex h-11 w-full items-center justify-center rounded-md text-sm transition-colors duration-150',
            isSelected
              ? 'bg-accent-500 font-semibold text-on-accent'
              : isSelectable
                ? 'font-medium text-text-primary hover:bg-surface-raised active:bg-surface-strong'
                : 'cursor-not-allowed text-text-muted opacity-40',
          )}
        >
          {format(date, 'd')}
          {isSelectable && !isSelected ? (
            <span
              className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent-500"
              aria-hidden
            />
          ) : null}
        </button>,
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div key={week} className="grid grid-cols-7 justify-items-center">
        {days}
      </div>,
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? t('stocks.selectDate')}
      icon={<CalendarDays className="h-4 w-4" />}
      size="sm"
      bodyClassName="px-1 sm:px-6"
      footer={
        <div className="flex justify-end gap-2">
          {selectedDate && onClear ? (
            <Button
              variant="ghost"
              onClick={() => {
                onClear()
                onClose()
              }}
            >
              {t('common.clear')}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-80">
        <div className="mb-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setCalendarMonth(month => addMonths(month, -1))}
            aria-label={t('common.previous')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="num text-sm font-semibold text-text-primary">
            {format(calendarMonth, 'yyyy-MM')}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setCalendarMonth(month => addMonths(month, 1))}
            aria-label={t('common.next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-1 grid grid-cols-7 justify-items-center text-2xs font-medium text-text-muted">
          {(t('calendar.weekdaysShort', { returnObjects: true }) as string[]).map(weekday => (
            <div key={weekday} className="w-full text-center">
              {weekday}
            </div>
          ))}
        </div>
        <div className="space-y-0.5">{rows}</div>
        {hint ? (
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-500" aria-hidden />
            <span>{hint}</span>
          </p>
        ) : null}
      </div>
    </Modal>
  )
}

export default DatePickerModal
