export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'SOS') {
    return `${amount.toLocaleString()} SOS`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string | Date, includeTime: boolean = false): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(val)
}

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${timestamp}-${random}`
}

export function generateBarcode(): string {
  // Generate valid 12-digit UPC or EAN-13 style code
  const random = Math.floor(100000000000 + Math.random() * 900000000000)
  return `${random}`
}
