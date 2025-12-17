// Turkey VAT Rates
export const turkeyVATRates = [
  { rate: 20, description: 'Genel KDV oranı' },
  { rate: 10, description: 'Gıda, konaklama vb.' },
  { rate: 1, description: 'Temel ihtiyaç kalemleri' },
  { rate: 0, description: "KDV'den istisna" },
];

// Product Unit Options
export const PRODUCT_UNITS = ['Adet', 'Kg', 'Mt', 'Litre', 'Koli', 'Set'];

// Currency Options
export const currencies = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'Amerikan Doları' },
];

// Default currency
// Sabit Döviz Kurları (İleride API'den çekilebilir)
export const EXCHANGE_RATES = {
  USD: 36.5,
  EUR: 38.2,
  TRY: 1.0,
};

export const DEFAULT_CURRENCY = 'TRY';

// Standard Rejection Reasons
export const REJECTION_REASONS = [
  { id: 'price_high', label: '💸 Fiyat Yüksek', requirePrice: true },
  { id: 'stock_issue', label: '📦 Stok/Termin Sorunu' },
  { id: 'competitor', label: '🤝 Rakip Tercih Edildi', requireCompetitor: true },
  { id: 'cancelled', label: '❌ Proje İptal' },
  { id: 'communication', label: '🤐 İletişim Kesildi' },
  { id: 'other', label: '📝 Diğer' },
];
