/**
 * Format a date string to Turkish locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date or 'Belirtilmedi' if empty
 */
export const formatDate = (dateString: string | undefined | null): string => {
  return dateString ? new Date(dateString).toLocaleDateString('tr-TR') : 'Belirtilmedi';
};

/**
 * Format a number as currency (TRY or USD)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code ('TRY' or 'USD'), defaults to 'TRY'
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency: string = 'TRY'
): string => {
  const locale = currency === 'USD' ? 'en-US' : 'tr-TR';
  return (amount || 0).toLocaleString(locale, { style: 'currency', currency });
};

/**
 * Get currency symbol from currency code
 * @param {string} currency - Currency code ('TRY' or 'USD')
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  return currency === 'USD' ? '$' : '₺';
};

/**
 * Format phone number for WhatsApp (Turkish format)
 * Converts phone numbers to international format for WhatsApp links
 * @param {string} phone - Phone number to format
 * @returns {string|null} Formatted phone number or null
 * @example
 * formatPhoneNumberForWhatsApp('0532 123 45 67') // returns '905321234567'
 * formatPhoneNumberForWhatsApp('532 123 45 67') // returns '905321234567'
 */
export const formatPhoneNumberForWhatsApp = (phone: string | undefined | null): string | null => {
  if (!phone) return null;

  // Remove all spaces, dashes, parentheses
  let formattedPhone = phone.replace(/[\s()-]/g, '');

  // If starts with 0, replace with 90 (Turkey country code)
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '90' + formattedPhone.substring(1);
  }
  // If doesn't start with 90, add it
  else if (!formattedPhone.startsWith('90')) {
    formattedPhone = '90' + formattedPhone;
  }

  return formattedPhone;
};

/**
 * Get CSS classes for status badges based on status text
 * @param {string} status - Status text
 * @returns {string} Tailwind CSS classes
 */
export const getStatusClass = (status: string | undefined | null): string => {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

  switch (status) {
    // Customer Status
    case 'Aktif Müşteri':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Potansiyel Müşteri':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

    // Order/Quote Status
    case 'Tamamlandı':
    case 'Teslim Edildi':
    case 'Onaylandı':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Hazırlanıyor':
    case 'Yolda':
    case 'Gönderildi':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Bekliyor':
    case 'Reddedildi':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'İptal Edildi':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

    // Meeting Status
    case 'İlgileniyor':
    case 'Teklif Bekliyor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';

    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

/**
 * Checks if a given date string is today.
 * @param {string} dateString - The date string to check.
 * @returns {boolean} True if the date is today, false otherwise.
 */
export const isToday = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};
