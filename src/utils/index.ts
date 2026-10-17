import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Parse a value into a Date, returning null when it is missing or invalid.
 *
 * The API returns an empty string for dates when no data is available (for
 * example a day with no picks), and `new Date('')` yields an Invalid Date that
 * makes `date-fns.format` throw a RangeError.
 */
export function toValidDate(date: string | Date | null | undefined): Date | null {
  if (date === null || date === undefined || date === '') return null
  const d = date instanceof Date ? date : new Date(date)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Format a date as `yyyy-MM-dd`, falling back when the value is invalid. */
export function formatDay(date: string | Date | null | undefined, fallback = '—'): string {
  const d = toValidDate(date)
  if (!d) return fallback
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function formatDate(date: string | Date | null | undefined, fallback = '—'): string {
  const d = toValidDate(date)
  if (!d) return fallback
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined, fallback = '—'): string {
  const d = toValidDate(date)
  if (!d) return fallback
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic debounce must accept any function signature
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/** Token-backed colour class for a signed market value. */
export function changeTone(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'val-flat'
  if (value > 0) return 'val-up'
  if (value < 0) return 'val-down'
  return 'val-flat'
}

export function getColorForChange(change: number): string {
  return changeTone(change)
}

export function getChangeIcon(change: number): string {
  if (change > 0) return '↗'
  if (change < 0) return '↘'
  return '→'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts arbitrary thrown error/response shapes
export function parseApiError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.detail) return error.detail
  if (error?.message) return error.message
  return 'An unexpected error occurred'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function downloadFile(content: string, filename: string, contentType = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
  return Promise.resolve()
}

export function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function sortArrayByKey<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}
