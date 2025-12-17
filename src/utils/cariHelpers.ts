import type { Order, Payment } from '../types';
import { EXCHANGE_RATES } from '../constants';

/**
 * Cari Hesap Yardımcı Fonksiyonları
 * Müşteri bazlı bakiye, ödeme geçmişi ve avans hesaplamaları
 */

export interface CariBalance {
  /** Toplam sipariş tutarı */
  totalOrders: number;
  /** Toplam yapılan ödemeler */
  totalPayments: number;
  /** Bakiye (pozitif: alacak, negatif: borç) */
  balance: number;
  /** Bekleyen avanslar */
  availableAdvance: number;
  /** Para birimi */
  currency: string;
}

export interface PaymentHistory {
  /** Ödeme ID */
  id: string;
  /** Tarih */
  date: string;
  /** Ödeme tipi */
  paymentType?: string;
  /** Tutar */
  amount: number;
  /** Para birimi */
  currency: string;
  /** Durum */
  status: string;
  /** İlişkili sipariş numarası */
  orderNumber?: string;
  /** Not */
  notes?: string;
}

/**
 * Müşterinin cari hesap bakiyesini hesaplar
 * @param customerId Müşteri ID
 * @param orders Siparişler listesi
 * @param payments Ödemeler listesi
 * @returns Cari bakiye bilgileri
 */
export const calculateCariBalance = (
  customerId: string,
  orders: Order[],
  payments: Payment[]
): CariBalance => {
  // Müşteriye ait siparişleri filtrele (silinmemişler)
  const customerOrders = orders.filter((o) => o.customerId === customerId && !o.isDeleted);

  // Müşteriye ait ödemeleri filtrele (silinmemişler)
  const customerPayments = payments.filter((p) => p.customerId === customerId && !p.isDeleted);

  // Toplam sipariş tutarı (TRY cinsinden)
  const totalOrders = customerOrders.reduce((sum, order) => {
    const amount = order.total_amount || 0;
    // Eğer dövizse basit bir dönüşüm yap (gerçek uygulamada kurları kullan)
    const inTRY =
      order.currency === 'USD'
        ? amount * EXCHANGE_RATES.USD
        : order.currency === 'EUR'
          ? amount * EXCHANGE_RATES.EUR
          : amount;
    return sum + inTRY;
  }, 0);

  // Toplam ödeme tutarı (Tahsil edilmiş veya Çek/Senet)
  const totalPayments = customerPayments.reduce((sum, payment) => {
    // İptal edilenleri sayma
    if (payment.status === 'İptal') return sum;

    // Çek ve Senetler "Bekliyor" olsa bile bakiyeden düşer (Evrak teslim alındığı için)
    // Diğer ödeme türleri (Nakit, Havale) sadece "Tahsil Edildi" ise düşer
    const isCheckOrPromissory =
      payment.paymentMethod === 'Çek' || payment.paymentMethod === 'Senet';
    const isCollected = payment.status === 'Tahsil Edildi';

    if (!isCollected && !isCheckOrPromissory) return sum;

    const amount = payment.amount || 0;
    // Döviz dönüşümü
    const inTRY =
      payment.currency === 'USD'
        ? amount * EXCHANGE_RATES.USD
        : payment.currency === 'EUR'
          ? amount * EXCHANGE_RATES.EUR
          : amount;
    return sum + inTRY;
  }, 0);

  // Bekleyen avanslar (Avans/Önödeme tipindeki tahsil edilmiş veya evraklı ödemeler)
  const availableAdvance = customerPayments.reduce((sum, payment) => {
    // Sadece avansları say
    if ((payment as any).paymentType !== 'Avans/Önödeme') return sum;
    if (payment.status === 'İptal') return sum;

    // Çek/Senet veya Tahsil Edilmiş
    const isCheckOrPromissory =
      payment.paymentMethod === 'Çek' || payment.paymentMethod === 'Senet';
    const isCollected = payment.status === 'Tahsil Edildi';

    if (!isCollected && !isCheckOrPromissory) return sum;

    const amount = payment.amount || 0;
    const inTRY =
      payment.currency === 'USD'
        ? amount * EXCHANGE_RATES.USD
        : payment.currency === 'EUR'
          ? amount * EXCHANGE_RATES.EUR
          : amount;
    return sum + inTRY;
  }, 0);

  // Bakiye hesapla (Ödeme - Sipariş = Pozitifse alacak, negatifse borç)
  const balance = totalPayments - totalOrders;

  return {
    totalOrders,
    totalPayments,
    balance,
    availableAdvance,
    currency: 'TRY', // Hepsi TRY'ye çevrildi
  };
};

/**
 * Müşterinin ödeme geçmişini tarih sıralı döndürür
 * @param customerId Müşteri ID
 * @param payments Ödemeler listesi
 * @param orders Siparişler listesi (sipariş numarası için)
 * @returns Ödeme geçmişi listesi
 */
export const getPaymentHistory = (
  customerId: string,
  payments: Payment[],
  orders: Order[]
): PaymentHistory[] => {
  // Müşteriye ait ödemeleri filtrele
  const customerPayments = payments.filter((p) => p.customerId === customerId && !p.isDeleted);

  // Ödeme geçmişini oluştur
  const history = customerPayments.map((payment) => {
    // İlişkili sipariş numarasını bul
    const order = payment.orderId ? orders.find((o) => o.id === payment.orderId) : undefined;

    return {
      id: payment.id,
      date: payment.dueDate, // veya paidDate varsa onu kullan
      paymentType: (payment as any).paymentType || 'Belirtilmemiş',
      amount: payment.amount,
      currency: payment.currency || 'TRY',
      status: payment.status,
      orderNumber: order?.orderNumber,
      notes: payment.notes,
    };
  });

  // Tarihe göre sırala (en yeni önce)
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Müşterinin kullanılabilir avansını hesaplar
 * @param customerId Müşteri ID
 * @param payments Ödemeler listesi
 * @returns Kullanılabilir avans tutarı (TRY)
 */
export const getAvailableAdvance = (customerId: string, payments: Payment[]): number => {
  const customerPayments = payments.filter((p) => p.customerId === customerId && !p.isDeleted);

  return customerPayments.reduce((sum, payment) => {
    // Sadece avansları ve tahsil edilmişleri/çekleri say
    if ((payment as any).paymentType !== 'Avans/Önödeme') return sum;
    if (payment.status === 'İptal') return sum;

    // Çek/Senet veya Tahsil Edilmiş
    const isCheckOrPromissory =
      payment.paymentMethod === 'Çek' || payment.paymentMethod === 'Senet';
    const isCollected = payment.status === 'Tahsil Edildi';

    if (!isCollected && !isCheckOrPromissory) return sum;

    const amount = payment.amount || 0;
    const inTRY =
      payment.currency === 'USD'
        ? amount * EXCHANGE_RATES.USD
        : payment.currency === 'EUR'
          ? amount * EXCHANGE_RATES.EUR
          : amount;
    return sum + inTRY;
  }, 0);
};

/**
 * Bakiye durumunu yorumlar
 * @param balance Bakiye tutarı
 * @returns Durum metni ve renk sınıfı
 */
export const getBalanceStatus = (
  balance: number
): {
  text: string;
  color: string;
  icon: string;
} => {
  if (balance > 1000) {
    return {
      text: 'Alacak Var',
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      icon: '💰',
    };
  } else if (balance > 0) {
    return {
      text: 'Hafif Alacak',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      icon: '💵',
    };
  } else if (balance === 0) {
    return {
      text: 'Hesap Dengede',
      color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
      icon: '⚖️',
    };
  } else if (balance > -5000) {
    return {
      text: 'Borç Var',
      color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
      icon: '⚠️',
    };
  } else {
    return {
      text: 'Yüksek Borç',
      color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      icon: '🚨',
    };
  }
};
