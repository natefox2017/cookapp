import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | Date) {
  const date =
    typeof value === 'string'
      ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
      : value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatMoney(value: number | null | undefined, currency = 'USD') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}
