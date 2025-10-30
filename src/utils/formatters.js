/**
 * Format a date string to Turkish locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date or 'Belirtilmedi' if empty
 */
export const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('tr-TR') : 'Belirtilmedi';
};

/**
 * Format a number as Turkish Lira currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
};

/**
 * Get CSS classes for status badges based on status text
 * @param {string} status - Status text
 * @returns {string} Tailwind CSS classes
 */
export const getStatusClass = (status) => {
    switch (status) {
        case 'Tamamlandı':
        case 'Teslim Edildi':
        case 'Onaylandı':
            return 'bg-green-100 text-green-800';
        case 'Hazırlanıyor':
        case 'Yolda':
        case 'Gönderildi':
            return 'bg-yellow-100 text-yellow-800';
        case 'Bekliyor':
        case 'Reddedildi':
            return 'bg-red-100 text-red-800';
        case 'İlgileniyor':
        case 'Teklif Bekliyor':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
