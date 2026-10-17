import React from 'react'

import type { PivotAction } from '@/types/picks'
import { cn } from '@/utils'

import Badge, { type BadgeTone } from './Badge'

interface ActionBadgeProps {
  action: PivotAction
  size?: 'sm' | 'md'
  label?: string
  className?: string
}

const actionTone: Record<PivotAction, BadgeTone> = {
  STRONG_BUY: 'bull',
  BUY: 'bull',
  HOLD: 'neutral',
  SELL: 'bear',
  STRONG_SELL: 'bear',
}

const defaultLabel: Record<PivotAction, string> = {
  STRONG_BUY: 'Strong Buy',
  BUY: 'Buy',
  HOLD: 'Hold',
  SELL: 'Sell',
  STRONG_SELL: 'Strong Sell',
}

/** Emphasise STRONG_* variants with a heavier weight while keeping tone. */
const ActionBadge: React.FC<ActionBadgeProps> = ({ action, size = 'md', label, className }) => {
  const strong = action === 'STRONG_BUY' || action === 'STRONG_SELL'
  return (
    <Badge tone={actionTone[action]} size={size} dot className={cn(strong && 'font-semibold', className)}>
      {label ?? defaultLabel[action]}
    </Badge>
  )
}

export default ActionBadge
