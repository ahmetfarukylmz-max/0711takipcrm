import { Order, Quote, Customer, Meeting, Product, Payment } from '../types';
import {
  differenceInDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  addDays,
  format,
} from 'date-fns';
import { tr } from 'date-fns/locale';

export interface SmartAction {
  id: string;
  type: 'financial' | 'sales' | 'relationship' | 'stock';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  customerId?: string;
  customerName?: string;
  actionLabel: string;
  actionPath?: string;
  score?: number; // Sorting score
}

export interface CustomerHealthProfile {
  customerId: string;
  customerName: string;
  segment: string;

  // Financial
  totalDebt: number;
  avgPaymentDelay: number; // days
  lastPaymentDate?: string;
  financialRiskScore: number; // 0-100 (100 = High Risk)

  // Engagement
  lastContactDate?: string;
  contactFrequency: number; // days between contacts
  engagementScore: number; // 0-100 (100 = Highly Engaged)

  // Consumption
  lastOrderDate?: string;
  orderFrequency: number; // days between orders
  predictedNextOrderDate?: string;
}

export interface IntelligenceData {
  dailyActions: SmartAction[];
  customerProfiles: CustomerHealthProfile[];
  monthlyForecast: {
    realistic: number;
    optimistic: number;
    currentTotal: number;
  };
}

export const calculateIntelligence = (
  orders: Order[],
  quotes: Quote[],
  customers: Customer[],
  meetings: Meeting[],
  products: Product[],
  payments: Payment[]
): IntelligenceData => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const actions: SmartAction[] = [];
  const profiles: CustomerHealthProfile[] = [];

  const USD_TO_TRY_RATE = 35;
  const EUR_TO_TRY_RATE = 38;

  const convertToTRY = (amount: number, currency?: string) => {
    if (currency === 'USD') return amount * USD_TO_TRY_RATE;
    if (currency === 'EUR') return amount * EUR_TO_TRY_RATE;
    return amount;
  };

  // --- 1. MÜŞTERİ PROFİL ANALİZİ ---
  customers
    .filter((c) => !c.isDeleted)
    .forEach((customer) => {
      // A. Finansal Analiz
      const customerOrders = orders.filter(
        (o) => o.customerId === customer.id && !o.isDeleted && o.status !== 'İptal Edildi'
      );
      const customerPayments = payments.filter(
        (p) => p.customerId === customer.id && !p.isDeleted && p.status !== 'İptal'
      );

      const totalInvoiced = customerOrders.reduce(
        (sum, o) => sum + convertToTRY(o.total_amount, o.currency),
        0
      );
      const totalPaid = customerPayments.reduce(
        (sum, p) => sum + convertToTRY(p.amount, p.currency),
        0
      );
      const currentDebt = totalInvoiced - totalPaid;

      const lastPayment = customerPayments.sort(
        (a, b) =>
          parseISO(b.paidDate || b.createdAt).getTime() -
          parseISO(a.paidDate || a.createdAt).getTime()
      )[0];
      const daysSinceLastPayment = lastPayment
        ? differenceInDays(now, parseISO(lastPayment.paidDate || lastPayment.createdAt))
        : 999;

      // B. İletişim Analizi
      const customerMeetings = meetings.filter((m) => m.customerId === customer.id && !m.isDeleted);
      const lastMeeting = customerMeetings.sort(
        (a, b) => parseISO(b.meeting_date).getTime() - parseISO(a.meeting_date).getTime()
      )[0];
      const daysSinceLastContact = lastMeeting
        ? differenceInDays(now, parseISO(lastMeeting.meeting_date))
        : 999;

      // C. Sipariş Frekansı
      const sortedOrders = customerOrders.sort(
        (a, b) => parseISO(b.order_date).getTime() - parseISO(a.order_date).getTime()
      );
      const lastOrder = sortedOrders[0];
      const daysSinceLastOrder = lastOrder
        ? differenceInDays(now, parseISO(lastOrder.order_date))
        : 999;

      let avgOrderInterval = 30;
      if (customerOrders.length >= 2) {
        const firstOrder = sortedOrders[sortedOrders.length - 1];
        const totalDays = differenceInDays(
          parseISO(lastOrder.order_date),
          parseISO(firstOrder.order_date)
        );
        avgOrderInterval = Math.round(totalDays / (customerOrders.length - 1));
      }

      // --- SKORLAMA ---
      // Finansal Risk Skoru (Yüksek Borç & Gecikme = Yüksek Risk)
      let finRisk = 0;
      if (currentDebt > 50000) finRisk += 30;
      if (currentDebt > 200000) finRisk += 20;
      if (daysSinceLastPayment > 60 && currentDebt > 0) finRisk += 40;
      else if (daysSinceLastPayment > 45 && currentDebt > 0) finRisk += 20;

      // İlişki Skoru (Sık İletişim = Yüksek Skor)
      let engScore = 0;
      if (daysSinceLastContact < 15) engScore = 100;
      else if (daysSinceLastContact < 30) engScore = 70;
      else if (daysSinceLastContact < 60) engScore = 40;
      else engScore = 10;

      const profile: CustomerHealthProfile = {
        customerId: customer.id,
        customerName: customer.name,
        segment: 'Standart', // Basitleştirildi
        totalDebt: currentDebt,
        avgPaymentDelay: 0, // TODO: Vade tarihi implementasyonu sonrası
        lastPaymentDate: lastPayment?.paidDate,
        financialRiskScore: finRisk,
        lastContactDate: lastMeeting?.meeting_date,
        contactFrequency: 30, // Basitleştirildi
        engagementScore: engScore,
        lastOrderDate: lastOrder?.order_date,
        orderFrequency: avgOrderInterval,
        predictedNextOrderDate: lastOrder
          ? format(addDays(parseISO(lastOrder.order_date), avgOrderInterval), 'yyyy-MM-dd')
          : undefined,
      };

      profiles.push(profile);

      // --- AKSİYON ÜRETİMİ ---

      // 1. Tahsilat Uyarısı
      if (finRisk >= 70) {
        actions.push({
          id: `fin-${customer.id}`,
          type: 'financial',
          title: 'Kritik Tahsilat Riski',
          message: `${customer.name} bakiyesi ${currentDebt.toLocaleString('tr-TR')} TL'ye ulaştı ve uzun süredir ödeme yok.`,
          priority: 'high',
          actionLabel: 'Tahsilat İste',
          customerId: customer.id,
          customerName: customer.name,
          score: 90,
        });
      } else if (currentDebt > 0 && daysSinceLastPayment > 45) {
        actions.push({
          id: `fin-med-${customer.id}`,
          type: 'financial',
          title: 'Ödeme Hatırlatması',
          message: `${customer.name} bakiyesi açıkta bekliyor. Son ödeme üzerinden ${daysSinceLastPayment} gün geçti.`,
          priority: 'medium',
          actionLabel: 'Hatırlat',
          customerId: customer.id,
          customerName: customer.name,
          score: 60,
        });
      }

      // 2. İhmal Uyarısı (Relationship)
      // Eğer müşterinin borcu yoksa ve düzenli alıyorsa ama aranmıyorsa
      if (customerOrders.length > 3 && daysSinceLastContact > 45 && finRisk < 50) {
        actions.push({
          id: `rel-${customer.id}`,
          type: 'relationship',
          title: 'Müşteri İhmal Ediliyor',
          message: `${customer.name} ile en son ${daysSinceLastContact} gün önce görüşüldü. Rakibe kaptırma riski var.`,
          priority: 'medium',
          actionLabel: 'Arama Planla',
          customerId: customer.id,
          customerName: customer.name,
          score: 70,
        });
      }

      // 3. Sipariş Zamanı (Stock Prediction)
      if (
        lastOrder &&
        daysSinceLastOrder > avgOrderInterval * 1.1 &&
        daysSinceLastOrder < avgOrderInterval * 1.5
      ) {
        actions.push({
          id: `sales-${customer.id}`,
          type: 'sales',
          title: 'Sipariş Zamanı Geldi',
          message: `${customer.name} normal döngüsüne göre (${avgOrderInterval} gün) yeniden sipariş vermeliydi.`,
          priority: 'medium',
          actionLabel: 'Teklif Ver',
          customerId: customer.id,
          customerName: customer.name,
          score: 50,
        });
      }
    });

  // --- 4. STOK UYARILARI ---
  // En çok satan ürünlerin stok kontrolü
  const productSales: Record<string, number> = {};
  orders.forEach((o) =>
    o.items.forEach(
      (i) => (productSales[i.productId] = (productSales[i.productId] || 0) + i.quantity)
    )
  );

  products.forEach((product) => {
    if (productSales[product.id] > 0) {
      // Sadece satılan ürünler
      // Kritik stok: Son 30 günlük satışın %20'si kalmışsa veya sabit 50
      const criticalLevel = 50;
      if ((product.stockQuantity || 0) <= criticalLevel) {
        actions.push({
          id: `stock-${product.id}`,
          type: 'stock',
          title: 'Kritik Stok Seviyesi',
          message: `${product.name} ürününden sadece ${product.stockQuantity} adet kaldı. Acil sipariş geçilmeli.`,
          priority: 'high',
          actionLabel: 'Satınalma Talebi',
          actionPath: 'Depo',
          score: 85,
        });
      }
    }
  });

  // --- 5. TAHMİNLEME (FORECAST) ---
  const currentTotal = orders
    .filter(
      (o) =>
        !o.isDeleted &&
        o.status !== 'İptal Edildi' &&
        isWithinInterval(parseISO(o.order_date), { start: monthStart, end: monthEnd })
    )
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Bekleyen "Sıcak" Teklifler
  const pendingHotQuotes = quotes
    .filter(
      (q) =>
        !q.isDeleted &&
        q.status === 'Hazırlandı' &&
        differenceInDays(now, parseISO(q.teklif_tarihi)) < 15
    )
    .reduce((sum, q) => sum + q.total_amount, 0);

  const daysElapsed = differenceInDays(now, monthStart) + 1;
  const daysTotal = differenceInDays(monthEnd, monthStart) + 1;
  const runRate = currentTotal / daysElapsed;

  return {
    dailyActions: actions.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10), // En önemli 10 aksiyon
    customerProfiles: profiles,
    monthlyForecast: {
      currentTotal,
      realistic: runRate * daysTotal + pendingHotQuotes * 0.3, // %30 kapanma oranı tahmini
      optimistic: runRate * daysTotal + pendingHotQuotes * 0.6, // %60 kapanma oranı tahmini
    },
  };
};
