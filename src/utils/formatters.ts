/**
 * Formatting utilities for Mecamocha Inventory System
 * Indonesian locale formatting with clean decimal output (hides trailing zeroes)
 */

/**
 * Formats numbers in Indonesian locale (e.g. 1500,5 -> 1.500,5)
 * Hides unnecessary trailing zeroes (e.g. 150.000 -> 150, 150.50 -> 150,5)
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return '0';
  }

  const num = Number(value);
  if (num === 0) return '0';

  // Format with Indonesian locale up to 3 decimal places
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(num);

  return formatted;
}

/**
 * Formats currency in Indonesian Rupiah (e.g. Rp 25.000)
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats date string to ID standard (DD MMM YYYY / DD/MM/YYYY HH:mm)
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };

  return d.toLocaleDateString('id-ID', options);
}

/**
 * Generates transaction reference number e.g. TRX-PUR-20260816-001 using local date
 */
export function generateRefNo(prefix: string, dateInput?: string | Date): string {
  let d: Date;
  if (dateInput) {
    if (typeof dateInput === 'string') {
      const match = dateInput.match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
      if (match) {
        const dateStr = `${match[1]}${match[2]}${match[3]}`;
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        return `TRX-${prefix}-${dateStr}-${randomSuffix}`;
      }
    }
    d = new Date(dateInput);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = new Date();
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `TRX-${prefix}-${dateStr}-${randomSuffix}`;
}
