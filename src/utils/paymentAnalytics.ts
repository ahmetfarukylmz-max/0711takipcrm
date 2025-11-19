/**
 * Payment Analytics Utilities
 *
 * Müşteri bazlı ödeme analizi ve risk skorlama fonksiyonları
 */

import type { Payment, Order, PaymentAnalytics } from '../types';

/**
 * Müşteri için detaylı ödeme analizi hesaplar
 */
export const calculatePaymentAnalytics = (
  customerId: string,
  payments: Payment[],
  orders: Order[]
): PaymentAnalytics => {
  // Müşteriye ait ödemeler
  const customerPayments = payments.filter(
    p => p.customerId === customerId && !p.isDeleted
  );

  // Tahsil edilmiş ödemeler
  const collectedPayments = customerPayments.filter(
    p => p.status === 'Tahsil Edildi'
  );

  // Bekleyen ödemeler
  const pendingPayments = customerPayments.filter(
    p => p.status === 'Bekliyor'
  );

  // Bugünün tarihi
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Gecikmiş ödemeler
  const overduePayments = customerPayments.filter(p => {
    if (p.status === 'Tahsil Edildi' || p.status === 'İptal') return false;
    const dueDate = new Date(p.dueDate);
    return dueDate < today;
  });

  // Toplam borç (siparişlerden)
  const totalDebt = orders
    .filter(o => o.customerId === customerId && !o.isDeleted)
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Tutarlar
  const collectedAmount = collectedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  // Zamanında ödeme oranı
  const onTimePayments = collectedPayments.filter(p => {
    if (!p.paidDate) return false;
    const paid = new Date(p.paidDate);
    const due = new Date(p.dueDate);
    return paid <= due;
  });

  const onTimePaymentRate = collectedPayments.length > 0
    ? Math.round((onTimePayments.length / collectedPayments.length) * 100)
    : 0;

  // Ortalama gecikme süresi
  const delayDays = collectedPayments
    .filter(p => p.paidDate)
    .map(p => {
      const due = new Date(p.dueDate);
      const paid = new Date(p.paidDate!);
      const diff = Math.floor((paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    });

  const avgDelayDays = delayDays.length > 0
    ? Math.round(delayDays.reduce((sum, d) => sum + d, 0) / delayDays.length)
    : 0;

  // Risk skoru hesaplama (0-10)
  let riskScore = 10;

  // Zamanında ödeme oranı düşükse risk artar
  if (onTimePaymentRate < 50) riskScore -= 4;
  else if (onTimePaymentRate < 75) riskScore -= 2;
  else if (onTimePaymentRate < 90) riskScore -= 1;

  // Ortalama gecikme fazlaysa risk artar
  if (avgDelayDays > 30) riskScore -= 3;
  else if (avgDelayDays > 15) riskScore -= 2;
  else if (avgDelayDays > 7) riskScore -= 1;

  // Gecikmiş ödeme oranı yüksekse risk artar
  const overdueRatio = totalDebt > 0 ? (overdueAmount / totalDebt) * 100 : 0;
  if (overdueRatio > 30) riskScore -= 3;
  else if (overdueRatio > 15) riskScore -= 2;
  else if (overdueRatio > 5) riskScore -= 1;

  // Risk seviyesi
  const riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' =
    riskScore >= 7 ? 'DÜŞÜK' :
    riskScore >= 4 ? 'ORTA' : 'YÜKSEK';

  // Ödeme yöntemi dağılımı
  const paymentMethodDistribution: Record<string, number> = {};
  customerPayments.forEach(p => {
    const method = p.paymentMethod || 'Belirtilmemiş';
    paymentMethodDistribution[method] = (paymentMethodDistribution[method] || 0) + p.amount;
  });

  // Aylık trend (son 6 ay)
  const monthlyTrend = calculateMonthlyTrend(customerPayments, 6);

  // Timeline
  const timeline = customerPayments
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 20) // Son 20 ödeme
    .map(p => {
      const delayDays = p.paidDate
        ? Math.floor((new Date(p.paidDate).getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        date: p.paidDate || p.dueDate,
        amount: p.amount,
        status: p.status,
        delayDays,
        paymentMethod: p.paymentMethod
      };
    });

  return {
    totalDebt,
    collectedAmount,
    pendingAmount,
    overdueAmount,
    onTimePaymentRate,
    avgDelayDays,
    riskScore,
    riskLevel,
    paymentMethodDistribution,
    monthlyTrend,
    timeline
  };
};

/**
 * Son N ay için aylık ödeme trendini hesaplar
 */
const calculateMonthlyTrend = (
  payments: Payment[],
  months: number
): Array<{ month: string; amount: number; count: number }> => {
  const result: Array<{ month: string; amount: number; count: number }> = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const monthPayments = payments.filter(p => {
      if (p.status !== 'Tahsil Edildi' || !p.paidDate) return false;
      const paidDate = new Date(p.paidDate);
      return paidDate >= monthStart && paidDate <= monthEnd;
    });

    const monthName = targetDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
    const amount = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    result.push({
      month: monthName,
      amount,
      count: monthPayments.length
    });
  }

  return result;
};

/**
 * Risk seviyesi için renk kodunu döndürür
 */
export const getRiskColor = (riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK'): string => {
  switch (riskLevel) {
    case 'DÜŞÜK':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
    case 'ORTA':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
    case 'YÜKSEK':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
  }
};

/**
 * Risk skoru için yıldız sayısını döndürür
 */
export const getRiskStars = (riskScore: number): string => {
  const stars = Math.round(riskScore);
  return '⭐'.repeat(stars) + '☆'.repeat(10 - stars);
};
