import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import TickerChartDrawer from '@/components/TickerChartDrawer'

interface TickerChartContextValue {
  openTicker: (symbol: string) => void
}

const TickerChartContext = createContext<TickerChartContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useTickerChart = (): TickerChartContextValue => {
  const context = useContext(TickerChartContext)
  if (!context) {
    throw new Error('useTickerChart must be used within a TickerChartProvider')
  }
  return context
}

/** Hosts one app-wide ticker chart drawer so any page can open it. */
export const TickerChartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const [symbol, setSymbol] = useState<string | null>(null)

  const openTicker = useCallback((next: string) => {
    const normalized = next.trim().toUpperCase()
    if (normalized) setSymbol(normalized)
  }, [])
  const close = useCallback(() => setSymbol(null), [])

  useEffect(() => {
    setSymbol(null)
  }, [location.pathname])

  const value = useMemo(() => ({ openTicker }), [openTicker])

  return (
    <TickerChartContext.Provider value={value}>
      {children}
      <TickerChartDrawer symbol={symbol} onClose={close} />
    </TickerChartContext.Provider>
  )
}
