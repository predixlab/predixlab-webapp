import { addMinutes } from 'date-fns'
import { useEffect, useState } from 'react'

const NEW_YORK = 'America/New_York'

export interface MarketClock {
  /** True while the US cash session is open (09:30-16:00 ET, Mon-Fri). */
  isOpen: boolean
  /** Wall-clock time in New York, refreshed every 30 seconds. */
  easternTime: string
  now: Date
}

const easternParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return {
    weekday: get('weekday'),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  }
}

const resolve = (now: Date): MarketClock => {
  const { weekday, hour, minute } = easternParts(now)
  const minutes = hour * 60 + minute
  const isWeekday = !['Sat', 'Sun'].includes(weekday)
  // Regular session only. Pre/post market is a different product surface.
  const isOpen = isWeekday && minutes >= 9 * 60 + 30 && minutes < 16 * 60

  return {
    isOpen,
    easternTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    now,
  }
}

/**
 * Live US market session state. The header claimed "market open" at 3am before
 * this existed; a market app that lies about the clock is worse than one that
 * shows nothing.
 */
export function useMarketClock(): MarketClock {
  const [clock, setClock] = useState<MarketClock>(() => resolve(new Date()))

  useEffect(() => {
    const tick = () => setClock(resolve(new Date()))
    const id = window.setInterval(tick, 30_000)
    tick()
    return () => window.clearInterval(id)
  }, [])

  return clock
}

/** Exported for tests and for callers that need a projection, not the clock. */
export const marketClockAt = (date: Date, offsetMinutes = 0): MarketClock =>
  resolve(addMinutes(date, offsetMinutes))
