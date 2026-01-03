import { Order, Quote, Customer, Meeting, OrderItem, Product } from '../types';
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
  relatedCustomerId?: string;
  relatedProductId?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  segment: 'Şampiyon' | 'Sadık' | 'Potansiyel' | 'Riskli' | 'Kaybedilmiş' | 'Yeni';
  score: number; // RFM Score (0-100)
  lastOrderDate?: string;
  totalSpent: number;
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
  segments: CustomerSegment[];
}

export const calculateIntelligence = (
  orders: Order[],
  quotes: Quote[],
  customers: Customer[],
  meetings: Meeting[],
  products: Product[] = []
): IntelligenceData => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

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

  // --- 2. MÜŞTERİ SEGMENTASYONU (RFM Analizi Basitleştirilmiş) ---
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

  // --- 3. INSIGHTS OLUŞTURMA ---
  const insights: SalesInsight[] = [];

  if (riskyCustomers.length > 0) {
    // Show top 3 risky customers individually
    const topRisks = riskyCustomers.sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);

    topRisks.forEach((risk) => {
      insights.push({
        type: 'risk',
        title: 'Müşteri Kayıp Riski',
        message: `${risk.customerName} normal sipariş döngüsünün dışına çıktı (${risk.lastOrderDays} gündür sessiz).`,
        actionLabel: 'Analizi İncele',
        priority: 'high',
        relatedCustomerId: risk.customerId,
      });
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

  // --- 4. STOK UYARILARI (Stock Alerts) ---
  // En çok satılan ürünleri bul
  const productSales: Record<string, number> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
    });
  });

  const topSellingProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  // Çok satan ama stoğu azalan ürünler
  topSellingProducts.forEach((product) => {
    // Kritik stok seviyesi: 50 (veya ürün bazlı dinamik olabilir)
    if (product.stockQuantity < 50) {
      insights.push({
        type: 'risk',
        title: 'Kritik Stok Uyarısı',
        message: `${product.name} çok satıyor ancak stokta sadece ${product.stockQuantity} adet kaldı.`,
        actionLabel: 'Stok Girişi Yap',
        priority: 'high',
        // actionPath: 'Depo' // İleride eklenebilir
      });
    }
  });

  // --- 5. ÇAPRAZ SATIŞ FIRSATI (Cross-Sell) ---
  // Şampiyon müşterilerden, en çok satan ürünü henüz almamış olanı bul
  const championCustomers = segments.filter((s) => s.segment === 'Şampiyon');
  if (championCustomers.length > 0 && topSellingProducts.length > 0) {
    const topProduct = topSellingProducts[0];

    // Rastgele bir şampiyon seç
    const targetCustomer = championCustomers.find((c) => {
      const customerOrders = orders.filter((o) => o.customerId === c.id);
      // Bu müşteri topProduct'ı hiç almış mı?
      const hasBought = customerOrders.some((o) =>
        o.items.some((i) => i.productId === topProduct.id)
      );
      return !hasBought;
    });

    if (targetCustomer) {
      insights.push({
        type: 'opportunity',
        title: 'Çapraz Satış Fırsatı',
        message: `${targetCustomer.name} en iyi müşterilerinizden ancak en çok satan "${topProduct.name}" ürününü hiç almadı.`,
        actionLabel: 'Teklif Hazırla',
        priority: 'medium',
        relatedCustomerId: targetCustomer.id,
        relatedProductId: topProduct.id,
      });
    }
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
  };
};
