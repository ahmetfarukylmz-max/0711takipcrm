import { Order, Quote, Customer, Meeting, OrderItem, Product } from '../types';
import {
  differenceInDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  format,
  getDay,
  getHours,
} from 'date-fns';
import { tr } from 'date-fns/locale';

export interface SalesInsight {
  type: 'risk' | 'opportunity' | 'performance' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
  priority: 'low' | 'medium' | 'high';
  relatedCustomerId?: string; // For smart actions
  relatedProductId?: string; // For smart actions
}

export interface CustomerSegment {
  id: string;
  name: string;
  segment: 'Şampiyon' | 'Sadık' | 'Potansiyel' | 'Riskli' | 'Kaybedilmiş' | 'Yeni';
  score: number; // RFM Score (0-100)
  lastOrderDate?: string;
  totalSpent: number;
}

export interface ProductRecommendation {
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  reason: string;
  confidenceScore: number; // 0-100
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
  segments: CustomerSegment[]; // NEW
  recommendations: ProductRecommendation[]; // NEW
  hotHours: { day: string; hour: string; count: number }; // NEW
}

export const calculateIntelligence = (
  orders: Order[],
  quotes: Quote[],
  customers: Customer[],
  meetings: Meeting[],
  products: Product[] = [] // Optional now, but recommended
): IntelligenceData => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const sixMonthsAgo = subMonths(now, 6);

  // --- 1. TEMEL METRİKLER ---
  const currentMonthOrders = orders.filter(
    (o) =>
      !o.isDeleted &&
      o.status !== 'İptal Edildi' &&
      isWithinInterval(parseISO(o.order_date), { start: monthStart, end: monthEnd })
  );

  const currentTotal = currentMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const calculateTonnage = (items: OrderItem[]) => {
    return items.reduce((sum, item) => {
      const unit = item.unit?.toLowerCase() || '';
      if (unit.includes('kg')) return sum + item.quantity / 1000;
      if (unit.includes('ton')) return sum + item.quantity;
      return sum;
    }, 0);
  };

  const currentTonnage = currentMonthOrders.reduce((sum, o) => sum + calculateTonnage(o.items), 0);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const elapsedDays = differenceInDays(now, monthStart) + 1;
  const runRate = currentTotal / elapsedDays;
  const projectedTotal = runRate * daysInMonth;

  // Geçen ay kıyaslama
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

  const last3Months = subMonths(now, 3);
  const recentQuotes = quotes.filter(
    (q) => !q.isDeleted && parseISO(q.teklif_tarihi) >= last3Months
  );
  const convertedQuotes = recentQuotes.filter((q) => q.status === 'Onaylandı' || q.orderId);
  const conversionRate =
    recentQuotes.length > 0 ? (convertedQuotes.length / recentQuotes.length) * 100 : 0;

  // --- 2. GELİŞMİŞ ANALİZLER ---

  // A. Müşteri Segmentasyonu (RFM Analizi Basitleştirilmiş)
  const segments: CustomerSegment[] = [];
  const riskyCustomers: IntelligenceData['riskyCustomers'] = [];

  customers
    .filter((c) => !c.isDeleted)
    .forEach((customer) => {
      const customerOrders = orders
        .filter((o) => !o.isDeleted && o.customerId === customer.id)
        .sort((a, b) => parseISO(b.order_date).getTime() - parseISO(a.order_date).getTime());

      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const lastOrderDate = customerOrders.length > 0 ? customerOrders[0].order_date : null;
      const orderCount = customerOrders.length;

      let segment: CustomerSegment['segment'] = 'Yeni';
      let score = 50;

      if (orderCount === 0) {
        segment = 'Potansiyel';
        score = 20;
      } else if (lastOrderDate) {
        const daysSinceLastOrder = differenceInDays(now, parseISO(lastOrderDate));

        // CHURN (Kayıp) Tespiti
        if (customerOrders.length >= 2) {
          let totalInterval = 0;
          for (let i = 0; i < customerOrders.length - 1; i++) {
            totalInterval += differenceInDays(
              parseISO(customerOrders[i].order_date),
              parseISO(customerOrders[i + 1].order_date)
            );
          }
          const avgInterval = totalInterval / (customerOrders.length - 1);

          if (daysSinceLastOrder > avgInterval * 2 && daysSinceLastOrder > 30) {
            segment = 'Riskli';
            score = 30;
            riskyCustomers.push({
              customerId: customer.id,
              customerName: customer.name,
              riskScore: Math.min(Math.round((daysSinceLastOrder / avgInterval) * 30), 100),
              reason: `Ortalama sipariş aralığı (${Math.round(avgInterval)} gün) ciddi şekilde aşıldı.`,
              lastOrderDays: daysSinceLastOrder,
            });
          } else if (daysSinceLastOrder > 180) {
            segment = 'Kaybedilmiş';
            score = 10;
          }
        }

        if (segment === 'Yeni' || segment === 'Potansiyel') {
          if (totalSpent > 100000 && daysSinceLastOrder < 30) {
            segment = 'Şampiyon';
            score = 95;
          } else if (orderCount > 5 && daysSinceLastOrder < 60) {
            segment = 'Sadık';
            score = 80;
          }
        }
      }

      segments.push({
        id: customer.id,
        name: customer.name,
        segment,
        score,
        lastOrderDate: lastOrderDate || undefined,
        totalSpent,
      });
    });

  // B. Çapraz Satış (Cross-Sell) Önerileri
  const recommendations: ProductRecommendation[] = [];

  // Market Basket Analysis (Basit Versiyon)
  // "Bu ürünü alanlar genelde şunu da aldı"
  const productPairs: Record<string, Record<string, number>> = {};

  orders.forEach((order) => {
    if (!order.items) return;
    const uniqueProducts = [...new Set(order.items.map((i) => i.productId))];

    uniqueProducts.forEach((p1) => {
      uniqueProducts.forEach((p2) => {
        if (p1 !== p2) {
          if (!productPairs[p1]) productPairs[p1] = {};
          if (!productPairs[p1][p2]) productPairs[p1][p2] = 0;
          productPairs[p1][p2]++;
        }
      });
    });
  });

  // Müşterilere öneri yap
  segments
    .filter((s) => s.segment === 'Sadık' || s.segment === 'Şampiyon')
    .slice(0, 5)
    .forEach((segment) => {
      const customerOrders = orders.filter((o) => o.customerId === segment.id);
      const purchasedProductIds = new Set<string>();
      customerOrders.forEach((o) => o.items?.forEach((i) => purchasedProductIds.add(i.productId)));

      // En çok aldığı ürünü bul
      let topProductId = '';
      let maxCount = 0;
      const productCounts: Record<string, number> = {};

      customerOrders.forEach((o) =>
        o.items?.forEach((i) => {
          productCounts[i.productId] = (productCounts[i.productId] || 0) + 1;
          if (productCounts[i.productId] > maxCount) {
            maxCount = productCounts[i.productId];
            topProductId = i.productId;
          }
        })
      );

      if (topProductId && productPairs[topProductId]) {
        // Bu ürünle en çok giden ama müşterinin almadığı ürünü bul
        const bestPair = Object.entries(productPairs[topProductId])
          .sort((a, b) => b[1] - a[1])
          .find(([pId]) => !purchasedProductIds.has(pId));

        if (bestPair) {
          const [suggestedProductId, score] = bestPair;
          const suggestedProduct = products.find((p) => p.id === suggestedProductId);
          const sourceProduct = products.find((p) => p.id === topProductId);

          if (suggestedProduct && sourceProduct) {
            recommendations.push({
              customerId: segment.id,
              customerName: segment.name,
              productId: suggestedProductId,
              productName: suggestedProduct.name,
              reason: `${sourceProduct.name} alan müşterilerin çoğu bunu da alıyor.`,
              confidenceScore: Math.min(score * 10, 95),
            });
          }
        }
      }
    });

  // C. Sıcak Saatler Analizi
  const hourCounts: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};

  orders.forEach((o) => {
    const date = parseISO(o.order_date); // Sipariş saati genelde order_date içinde tam tutulmazsa createAt kullanılabilir
    // Simülasyon için createdTime veya order_date kullanıyoruz.
    // Eğer order_date sadece YYYY-MM-DD ise saat hep 00:00 çıkar.
    // CreatedAt (timestamp) varsa onu kullanalım.
    const timeSource = o.createdAt ? parseISO(o.createdAt as unknown as string) : date;

    const hour = getHours(timeSource);
    const day = format(timeSource, 'EEEE', { locale: tr });

    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

  const hotHours = {
    day: bestDay ? bestDay[0] : 'Pazartesi',
    hour: bestHour ? `${bestHour[0]}:00 - ${parseInt(bestHour[0]) + 1}:00` : '09:00 - 10:00',
    count: bestHour ? bestHour[1] : 0,
  };

  // --- 3. INSIGHTS OLUŞTURMA ---
  const insights: SalesInsight[] = [];

  if (riskyCustomers.length > 0) {
    const topRisk = riskyCustomers.sort((a, b) => b.riskScore - a.riskScore)[0];
    insights.push({
      type: 'risk',
      title: 'Müşteri Kayıp Riski',
      message: `${topRisk.customerName} normal sipariş döngüsünün dışına çıktı (${topRisk.lastOrderDays} gündür sessiz).`,
      actionLabel: 'Hemen Ara',
      priority: 'high',
      relatedCustomerId: topRisk.customerId,
    });
  }

  if (recommendations.length > 0) {
    const topRec = recommendations[0];
    insights.push({
      type: 'opportunity',
      title: 'Çapraz Satış Fırsatı',
      message: `${topRec.customerName} için ${topRec.productName} teklifi hazırlayabilirsin. ${topRec.reason}`,
      actionLabel: 'Teklif Hazırla',
      priority: 'medium',
      relatedCustomerId: topRec.customerId,
      relatedProductId: topRec.productId,
    });
  }

  // Sıcak Saat Önerisi
  if (hotHours.count > 5) {
    insights.push({
      type: 'info',
      title: 'Altın Saatler',
      message: `En çok satışı ${hotHours.day} günü, ${hotHours.hour} saatleri arasında yapıyorsun. Zorlu aramaları bu aralığa sakla.`,
      priority: 'low',
    });
  }

  // Pending Quotes
  const pendingHighValueQuotes = quotes.filter(
    (q) =>
      q.status === 'Hazırlandı' &&
      q.total_amount > (currentTotal / 10 || 50000) &&
      differenceInDays(now, parseISO(q.teklif_tarihi)) > 3
  );

  if (pendingHighValueQuotes.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Unutulan Fırsatlar',
      message: `${pendingHighValueQuotes.length} adet yüksek tutarlı teklif 3 günden fazladır bekliyor.`,
      actionLabel: 'Teklifleri İncele',
      priority: 'medium',
      actionPath: 'Teklifler',
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
    segments,
    recommendations,
    hotHours,
  };
};
