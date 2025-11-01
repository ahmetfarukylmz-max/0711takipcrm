// Turkey VAT Rates
export const turkeyVATRates = [
    { rate: 20, description: "Genel KDV oranı" },
    { rate: 10, description: "Gıda, konaklama vb." },
    { rate: 1, description: "Temel ihtiyaç kalemleri" },
    { rate: 0, description: "KDV'den istisna" }
];

// Currency Options
export const currencies = [
    { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
    { code: 'USD', symbol: '$', name: 'Amerikan Doları' }
];

// Default currency
export const DEFAULT_CURRENCY = 'TRY';
