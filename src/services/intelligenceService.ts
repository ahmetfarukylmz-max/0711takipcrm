import { Order, Quote, Customer, Meeting, OrderItem } from '../types';
import {
  differenceInDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
} from 'date-fns';

export interface SalesInsight {
  type: 'risk' | 'opportunity' | 'performance' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface IntelligenceData {
  monthlyForecast: {
    pessimistic: number;
    realistic: number;
    optimistic: number;
    currentTotal: number;
    targetTotal?: number;
    trend: 'up' | 'down' | 'stable';
    growthRate: number;
  };
  tonnageForecast: {
    current: number;
    projected: number;
    unit: string;
  };
  riskyCustomers: Array<{
    customerId: string;
    customerName: string;
    riskScore: number;
    reason: string;
    lastOrderDays: number;
  }>;
  insights: SalesInsight[];
  conversionRate: number;
}

export const calculateIntelligence = (
  orders: Order[],
  quotes: Quote[],
  customers: Customer[],
  meetings: Meeting[]
): IntelligenceData => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 1. Mevcut Ayın Satışları (Ciro ve Tonaj)
  const currentMonthOrders = orders.filter(
    (o) =>
      !o.isDeleted &&
      o.status !== 'İptal Edildi' &&
      isWithinInterval(parseISO(o.order_date), { start: monthStart, end: monthEnd })
  );

  const currentTotal = currentMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Tonaj hesabı (Biriminde 'kg' veya 'ton' geçen ürünler için)
  const calculateTonnage = (items: OrderItem[]) => {
    return items.reduce((sum, item) => {
      const unit = item.unit?.toLowerCase() || '';
      if (unit.includes('kg')) return sum + item.quantity / 1000;
      if (unit.includes('ton')) return sum + item.quantity;
      return sum;
    }, 0);
  };

  const currentTonnage = currentMonthOrders.reduce((sum, o) => sum + calculateTonnage(o.items), 0);

  // 2. Tahminleme (Run Rate)
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const elapsedDays = differenceInDays(now, monthStart) + 1;
  const runRate = currentTotal / elapsedDays;
  const projectedTotal = runRate * daysInMonth;

  // Geçen ay ile kıyaslama
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const lastMonthTotal = orders
    .filter(
      (o) =>
        !o.isDeleted &&
        o.status !== 'İptal Edildi' &&
        isWithinInterval(parseISO(o.order_date), { start: lastMonthStart, end: lastMonthEnd })
    )
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const growthRate =
    lastMonthTotal > 0 ? ((projectedTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // 3. Teklif Dönüşüm Oranı
  const last3Months = subMonths(now, 3);
  const recentQuotes = quotes.filter(
    (q) => !q.isDeleted && parseISO(q.teklif_tarihi) >= last3Months
  );
  const convertedQuotes = recentQuotes.filter((q) => q.status === 'Onaylandı' || q.orderId);
  const conversionRate =
    recentQuotes.length > 0 ? (convertedQuotes.length / recentQuotes.length) * 100 : 0;

  // 4. Müşteri Risk Analizi (Churn)
  const riskyCustomers: IntelligenceData['riskyCustomers'] = [];
  customers
    .filter((c) => !c.isDeleted)
    .forEach((customer) => {
      const customerOrders = orders
        .filter((o) => !o.isDeleted && o.customerId === customer.id)
        .sort((a, b) => parseISO(b.order_date).getTime() - parseISO(a.order_date).getTime());

      if (customerOrders.length >= 2) {
        // Ortalama sipariş aralığı
        let totalInterval = 0;
        for (let i = 0; i < customerOrders.length - 1; i++) {
          totalInterval += differenceInDays(
            parseISO(customerOrders[i].order_date),
            parseISO(customerOrders[i + 1].order_date)
          );
        }
        const avgInterval = totalInterval / (customerOrders.length - 1);
        const daysSinceLastOrder = differenceInDays(now, parseISO(customerOrders[0].order_date));

        if (daysSinceLastOrder > avgInterval * 1.5 && daysSinceLastOrder > 15) {
          riskyCustomers.push({
            customerId: customer.id,
            customerName: customer.name,
            riskScore: Math.min(Math.round((daysSinceLastOrder / avgInterval) * 20), 100),
            reason: `Normal sipariş aralığı (${Math.round(avgInterval)} gün) aşıldı.`,
            lastOrderDays: daysSinceLastOrder,
          });
        }
      }
    });

  // 5. Akıllı Öneriler (Insights)
  const insights: SalesInsight[] = [];

  // Riskli müşteriler için öneri
  if (riskyCustomers.length > 0) {
    const topRisk = riskyCustomers.sort((a, b) => b.riskScore - a.riskScore)[0];
    insights.push({
      type: 'risk',
      title: 'Müşteri Kayıp Riski',
      message: `${topRisk.customerName} normal sipariş döngüsünün dışına çıktı (${topRisk.lastOrderDays} gündür sessiz).`,
      actionLabel: 'Hemen Ara',
      priority: 'high',
    });
  }

  // Teklif takibi önerisi
  const pendingHighValueQuotes = quotes.filter(
    (q) =>
      q.status === 'Hazırlandı' &&
      q.total_amount > (currentTotal / 10 || 50000) &&
      differenceInDays(now, parseISO(q.teklif_tarihi)) > 3
  );

  if (pendingHighValueQuotes.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Yüksek Değerli Teklifler',
      message: `${pendingHighValueQuotes.length} adet yüksek tutarlı teklif 3 günden fazladır bekliyor.`,
      actionLabel: 'Teklifleri İncele',
      priority: 'medium',
    });
  }

  return {
    monthlyForecast: {
      pessimistic: projectedTotal * 0.9,
      realistic: projectedTotal,
      optimistic:
        runRate * daysInMonth +
        pendingHighValueQuotes.reduce((sum, q) => sum + q.total_amount, 0) * (conversionRate / 100),
      currentTotal,
      trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
      growthRate,
    },
    tonnageForecast: {
      current: currentTonnage,
      projected: (currentTonnage / elapsedDays) * daysInMonth,
      unit: 'Ton',
    },
    riskyCustomers: riskyCustomers.slice(0, 5),
    insights,
    conversionRate,
  };
};
