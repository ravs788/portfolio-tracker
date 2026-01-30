export function formatCurrencyIndian(
  value: number,
  currencyCode: string = 'INR',
  maximumFractionDigits: number = 2
): string {
  if (value === undefined || value === null || Number.isNaN(value as number)) return '';
  try {
    // Use en-IN locale to enforce Indian grouping (e.g., 1,00,000)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits,
    }).format(value);
  } catch {
    // Fallback: manual Indian grouping with symbol
    const symbol = currencyCode === 'INR' ? '₹' : `${currencyCode} `;
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const fixed = absVal.toFixed(maximumFractionDigits);
    const [intPart, fracPart] = fixed.split('.');
    // Indian grouping: last 3 digits, then groups of 2
    const lastThree = intPart.slice(-3);
    const other = intPart.slice(0, -3);
    const grouped =
      other.length > 0
        ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return `${sign}${symbol}${grouped}${maximumFractionDigits > 0 ? '.' + fracPart : ''}`;
  }
}

export function formatNumberIndian(value: number, maximumFractionDigits: number = 2): string {
  if (value === undefined || value === null || Number.isNaN(value as number)) return '';
  try {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits,
    }).format(value);
  } catch {
    // Manual grouping without currency symbol
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const fixed = absVal.toFixed(maximumFractionDigits);
    const [intPart, fracPart] = fixed.split('.');
    const lastThree = intPart.slice(-3);
    const other = intPart.slice(0, -3);
    const grouped =
      other.length > 0
        ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return `${sign}${grouped}${maximumFractionDigits > 0 ? '.' + fracPart : ''}`;
  }
}

export function formatIntegerIndian(value: number): string {
  return formatNumberIndian(value, 0);
}

/**
 * Parses an Indian-formatted numeric string (with possible currency symbol, commas, spaces, or %)
 * into a number. Returns null if it cannot be parsed.
 * Examples:
 *  - "₹1,23,456.78" -> 123456.78
 *  - "INR 50,000" -> 50000
 *  - "7.5%" -> 7.5
 *  - "" -> null
 */
export function parseNumberIndian(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isNaN(input) ? null : input;

  const trimmed = input.trim();
  if (trimmed === '') return null;

  // Remove group separators, currency symbols/letters, spaces, and percent signs.
  // Keep only digits, a single leading "-", and a single "." for decimals.
  const cleaned = trimmed.replace(/[,₹\sA-Za-z%]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;

  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

/**
 * Convenience: parse to number, defaulting to 0 if unparsable.
 */
export function parseNumberIndianOrZero(input: string | number | null | undefined): number {
  const n = parseNumberIndian(input);
  return n ?? 0;
}

/**
 * Formats a plain number with Indian grouping for percent-style display (no % sign).
 */
export function formatPercent(value: number, maximumFractionDigits: number = 2): string {
  if (value === undefined || value === null || Number.isNaN(value as number)) return '';
  try {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits,
    }).format(value);
  } catch {
    return String(value);
  }
}
