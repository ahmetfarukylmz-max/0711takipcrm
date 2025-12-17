import { Order, Quote } from '../types';

/**
 * NUMBER FORMATTERS
 * Utility functions for formatting order/quote numbers
 */

/**
 * Format order number for display
 * Handles both new format (SIP-2025-1001) and legacy format (Firebase ID)
 * @param {Order | null | undefined} order - Order object
 * @returns {string} Formatted order number
 */
export const formatOrderNumber = (order: Partial<Order> | null | undefined): string => {
  if (!order) return 'N/A';

  // If order has orderNumber field, use it
  if (order.orderNumber) {
    return order.orderNumber;
  }

  // Fallback to legacy format (first 8 chars of ID)
  if (order.id) {
    return `#${order.id.substring(0, 8).toUpperCase()}`;
  }

  return 'N/A';
};

/**
 * Format quote number for display
 * Handles both new format (TEK-2025-0523) and legacy format (Firebase ID)
 * @param {Quote | null | undefined} quote - Quote object
 * @returns {string} Formatted quote number
 */
export const formatQuoteNumber = (quote: Partial<Quote> | null | undefined): string => {
  if (!quote) return 'N/A';

  // If quote has quoteNumber field, use it
  if (quote.quoteNumber) {
    return quote.quoteNumber;
  }

  // Fallback to legacy format (first 8 chars of ID)
  if (quote.id) {
    return `#${quote.id.substring(0, 8).toUpperCase()}`;
  }

  return 'N/A';
};

/**
 * Get short order number (for lists/cards)
 * @param {Order | null | undefined} order - Order object
 * @returns {string} Short order number
 */
export const getShortOrderNumber = (order: Partial<Order> | null | undefined): string => {
  if (!order) return 'N/A';

  if (order.orderNumber) {
    // For SIP-2025-1001, return SIP-1001
    const parts = order.orderNumber.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[2]}`;
    }
    return order.orderNumber;
  }

  // Fallback: last 6 chars
  if (order.id) {
    return `#${order.id.slice(-6)}`;
  }

  return 'N/A';
};

/**
 * Get short quote number (for lists/cards)
 * @param {Quote | null | undefined} quote - Quote object
 * @returns {string} Short quote number
 */
export const getShortQuoteNumber = (quote: Partial<Quote> | null | undefined): string => {
  if (!quote) return 'N/A';

  if (quote.quoteNumber) {
    // For TEK-2025-0523, return TEK-0523
    const parts = quote.quoteNumber.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[2]}`;
    }
    return quote.quoteNumber;
  }

  // Fallback: last 6 chars
  if (quote.id) {
    return `#${quote.id.slice(-6)}`;
  }

  return 'N/A';
};

/**
 * Check if number is legacy format
 * @param {string} number - Order/Quote number
 * @returns {boolean} True if legacy format
 */
export const isLegacyFormat = (number: string | undefined | null): boolean => {
  if (!number) return false;
  return number.startsWith('#') && !number.includes('-');
};

/**
 * Parse order/quote number to get components
 * @param {string} number - Formatted number (e.g., "SIP-2025-1001")
 * @returns {Object} { prefix, year, sequence }
 */
export const parseFormattedNumber = (
  number: string | undefined | null
): {
  prefix: string | null;
  year: number | null;
  sequence: number | null;
  isLegacy: boolean;
} => {
  if (!number || isLegacyFormat(number)) {
    return { prefix: null, year: null, sequence: null, isLegacy: true };
  }

  const parts = number.split('-');
  if (parts.length === 3) {
    return {
      prefix: parts[0], // SIP or TEK
      year: parseInt(parts[1]),
      sequence: parseInt(parts[2]),
      isLegacy: false,
    };
  }

  return { prefix: null, year: null, sequence: null, isLegacy: false };
};
