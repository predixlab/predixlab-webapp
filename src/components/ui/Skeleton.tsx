import React from 'react'

import { cn } from '@/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'block' | 'circle'
  width?: string | number
  height?: string | number
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'block',
  width,
  height,
  className,
  style,
  ...rest
}) => (
  <div
    className={cn(
      'pl-skeleton',
      variant === 'text' && 'h-3 rounded-xs',
      variant === 'block' && 'rounded-md',
      variant === 'circle' && 'rounded-full',
      className,
    )}
    style={{ width, height, ...style }}
    aria-hidden
    {...rest}
  />
)

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" style={{ width: i === lines - 1 ? '70%' : '100%' }} />
    ))}
  </div>
)

export default Skeleton
