import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  getCurrencySymbol,
  formatPhoneNumberForWhatsApp,
  getStatusClass,
  isToday
} from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date in Turkish format', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('15 Ocak 2024');
    });

    it('should return "Belirtilmemiş" for empty input', () => {
      expect(formatDate('')).toBe('Belirtilmemiş');
      expect(formatDate(null)).toBe('Belirtilmemiş');
      expect(formatDate(undefined)).toBe('Belirtilmemiş');
    });
  });

  describe('formatCurrency', () => {
    it('should format TRY currency', () => {
      const result = formatCurrency(1000, 'TRY');
      expect(result).toBe('1.000,00 ₺');
    });

    it('should format USD currency', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toBe('$1,000.00');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'TRY');
      expect(result).toBe('0,00 ₺');
    });

    it('should handle decimal amounts', () => {
      const result = formatCurrency(1234.56, 'TRY');
      expect(result).toBe('1.234,56 ₺');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return ₺ for TRY', () => {
      expect(getCurrencySymbol('TRY')).toBe('₺');
    });

    it('should return $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return € for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return empty string for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('');
    });
  });

  describe('formatPhoneNumberForWhatsApp', () => {
    it('should format Turkish mobile number', () => {
      const result = formatPhoneNumberForWhatsApp('05551234567');
      expect(result).toBe('905551234567');
    });

    it('should handle number with spaces', () => {
      const result = formatPhoneNumberForWhatsApp('0555 123 45 67');
      expect(result).toBe('905551234567');
    });

    it('should handle number with dashes', () => {
      const result = formatPhoneNumberForWhatsApp('0555-123-45-67');
      expect(result).toBe('905551234567');
    });

    it('should handle already formatted number', () => {
      const result = formatPhoneNumberForWhatsApp('905551234567');
      expect(result).toBe('905551234567');
    });
  });

  describe('getStatusClass', () => {
    it('should return success classes for completed status', () => {
      const result = getStatusClass('Tamamlandı');
      expect(result).toContain('bg-green-100');
      expect(result).toContain('text-green-800');
    });

    it('should return warning classes for pending status', () => {
      const result = getStatusClass('Bekliyor');
      expect(result).toContain('bg-yellow-100');
      expect(result).toContain('text-yellow-800');
    });

    it('should return default classes for unknown status', () => {
      const result = getStatusClass('Unknown');
      expect(result).toContain('bg-gray-100');
      expect(result).toContain('text-gray-800');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().slice(0, 10);
      expect(isToday(dateString)).toBe(false);
    });

    it('should return false for empty date', () => {
      expect(isToday('')).toBe(false);
      expect(isToday(null)).toBe(false);
      expect(isToday(undefined)).toBe(false);
    });
  });
});
