import React, { useMemo, useState, memo, ChangeEvent } from 'react';
import SalesChart from '../charts/SalesChart';
import OrderStatusChart from '../charts/OrderStatusChart';
import CustomerAnalyticsChart from '../charts/CustomerAnalyticsChart';
import LossReasonChart from '../charts/LossReasonChart'; // NEW
import CompetitorChart from '../charts/CompetitorChart'; // NEW
import EnhancedDailyReportWithDetails from '../reports/EnhancedDailyReportWithDetails';
import Modal from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { ChartBarIcon } from '../icons';
import { REJECTION_REASONS } from '../../constants'; // NEW
import type { Order, Customer, Quote, Meeting, Shipment, Product, Payment } from '../../types';

interface CustomerStats {
  name: string;
  total: number;
  count: number;
}

interface ChartDataPoint {
  date?: string;
  sales?: number;
  name?: string;
  value?: number;
}

interface Stats {
  totalRevenue: number;
  avgOrderValue: number;
  totalCustomers: number;
  activeCustomers: number;
  conversionRate: number;
  totalOrders: number;
  totalQuotes: number;
  totalMeetings: number;
}

interface ReportsProps {
  /** List of orders */
  orders: Order[];
  /** List of customers */
  customers: Customer[];
  /** List of quotes (teklifler) */
  teklifler: Quote[];
  /** List of meetings (gorusmeler) */
  gorusmeler: Meeting[];
  /** List of shipments */
  shipments: Shipment[];
  /** List of products */
  products: Product[];
  /** List of payments */
  payments: Payment[];
  /** Callback to open user guide */
  onGuideClick?: () => void;
}

/**
 * Reports component - Analytics and reporting page
 */
const Reports = memo<ReportsProps>(
  ({ orders, customers, teklifler, gorusmeler, shipments, products, payments, onGuideClick }) => {
    const [dateRange, setDateRange] = useState<string>('30'); // days
    const [showDailyReportModal, setShowDailyReportModal] = useState<boolean>(false);

    const salesTrendData = useMemo<ChartDataPoint[]>(() => {
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const filteredOrders = orders.filter((order) => {
        if (order.isDeleted) return false;
        const orderDate = new Date(order.order_date);
        return orderDate >= startDate;
      });

      // Group by date
      const salesByDate: Record<string, number> = {};
      filteredOrders.forEach((order) => {
        const date = order.order_date;
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += order.total_amount || 0;
      });

      // Convert to array and sort by actual date
      return Object.entries(salesByDate)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-15) // Last 15 data points
        .map(([date, sales]) => ({
          date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
          sales: Math.round(sales),
        }));
    }, [orders, dateRange]);

    const orderStatusData = useMemo<ChartDataPoint[]>(() => {
      const statusCounts: Record<string, number> = {};
      orders
        .filter((order) => !order.isDeleted)
        .forEach((order) => {
          const status = order.status || 'Bilinmiyor';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

      return Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
    }, [orders]);

    const customerAnalytics = useMemo<CustomerStats[]>(() => {
      const customerStats: Record<string, { total: number; count: number }> = {};

      orders
        .filter((order) => !order.isDeleted)
        .forEach((order) => {
          const customerId = order.customerId;
          if (!customerStats[customerId]) {
            customerStats[customerId] = {
              total: 0,
              count: 0,
            };
          }
          customerStats[customerId].total += order.total_amount || 0;
          customerStats[customerId].count += 1;
        });

      // Get top 10 customers
      return Object.entries(customerStats)
        .map(([customerId, stats]) => {
          const customer = customers.find((c) => c.id === customerId && !c.isDeleted);
          return {
            name: customer?.name || 'Bilinmiyor',
            total: Math.round(stats.total),
            count: stats.count,
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    }, [orders, customers]);

    const stats = useMemo<Stats>(() => {
      const activeOrders = orders.filter((o) => !o.isDeleted);
      const activeCustomers = customers.filter((c) => !c.isDeleted);
      const activeTeklifler = teklifler.filter((t) => !t.isDeleted);
      const activeGorusmeler = gorusmeler.filter((g) => !g.isDeleted);

      const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
      const totalCustomers = activeCustomers.length;
      const customersWithOrders = new Set(activeOrders.map((o) => o.customerId)).size;
      const conversionRate =
        activeTeklifler.length > 0
          ? (activeTeklifler.filter((t) => t.status === 'Onaylandı').length /
              activeTeklifler.length) *
            100
          : 0;

      return {
        totalRevenue,
        avgOrderValue,
        totalCustomers,
        activeCustomers: customersWithOrders,
        conversionRate,
        totalOrders: activeOrders.length,
        totalQuotes: activeTeklifler.length,
        totalMeetings: activeGorusmeler.length,
      };
    }, [orders, customers, teklifler, gorusmeler]);

    // KAYIP ANALİZİ (Loss Analysis) - NEW
    const lossAnalysis = useMemo(() => {
      const rejectedQuotes = teklifler.filter((q) => !q.isDeleted && q.status === 'Reddedildi');

      // 1. Red Sebepleri Dağılımı
      const reasonsCount: Record<string, number> = {};

      // 2. Rakip Analizi
      const competitorCount: Record<string, number> = {};

      // 3. Fiyat Farkı Analizi
      let totalPriceGap = 0;
      let gapCount = 0;

      rejectedQuotes.forEach((q) => {
        // Sebepler
        const reasonId = q.rejectionReasonId || 'other';
        // Find label from constants or use raw ID
        const reasonLabel =
          REJECTION_REASONS.find((r) => r.id === reasonId)?.label ||
          (q.rejection_reason ? '📝 Diğer' : 'Belirtilmemiş');
        reasonsCount[reasonLabel] = (reasonsCount[reasonLabel] || 0) + 1;

        // Rakipler
        if (q.competitorName) {
          competitorCount[q.competitorName] = (competitorCount[q.competitorName] || 0) + 1;
        }

        // Fiyat Farkı
        if (q.targetPrice && q.total_amount > 0) {
          // (Bizim Fiyat - Hedef Fiyat) / Hedef Fiyat
          // Örn: Biz 100, Hedef 90. Fark 10. Oran %11.
          const gap = ((q.total_amount - q.targetPrice) / q.targetPrice) * 100;
          totalPriceGap += gap;
          gapCount++;
        }
      });

      const reasonData = Object.entries(reasonsCount)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      const competitorData = Object.entries(competitorCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 competitors

      const avgPriceGap = gapCount > 0 ? totalPriceGap / gapCount : 0;

      return {
        totalLost: rejectedQuotes.length,
        totalLostValue: rejectedQuotes.reduce((sum, q) => sum + q.total_amount, 0),
        reasonData,
        competitorData,
        avgPriceGap,
      };
    }, [teklifler]);

    // Cari Hesap Özeti
    const cariHesapSummary = useMemo(() => {
      const activeCustomers = customers.filter((c) => !c.isDeleted);

      let totalAlacak = 0;
      let totalBorc = 0;
      let dengedeCount = 0;
      let alacakCount = 0;
      let borcCount = 0;

      activeCustomers.forEach((customer) => {
        const customerOrders = orders.filter((o) => o.customerId === customer.id && !o.isDeleted);
        // Include all payments except cancelled ones (Bekliyor status payments like checks are counted)
        const customerPayments = payments.filter(
          (p) => p.customerId === customer.id && !p.isDeleted && p.status !== 'İptal'
        );

        const totalOrders = customerOrders.reduce((sum, order) => {
          const amount = order.total_amount || 0;
          const inTRY =
            order.currency === 'USD'
              ? amount * 35
              : order.currency === 'EUR'
                ? amount * 38
                : amount;
          return sum + inTRY;
        }, 0);

        const totalPayments = customerPayments.reduce((sum, payment) => {
          const amount = payment.amount || 0;
          const inTRY =
            payment.currency === 'USD'
              ? amount * 35
              : payment.currency === 'EUR'
                ? amount * 38
                : amount;
          return sum + inTRY;
        }, 0);

        const balance = totalPayments - totalOrders;

        if (Math.abs(balance) < 100) {
          dengedeCount++;
        } else if (balance > 0) {
          totalAlacak += balance;
          alacakCount++;
        } else {
          totalBorc += Math.abs(balance);
          borcCount++;
        }
      });

      return {
        totalAlacak,
        totalBorc,
        netBalance: totalAlacak - totalBorc,
        dengedeCount,
        alacakCount,
        borcCount,
      };
    }, [customers, orders, payments]);

    // Ödeme İstatistikleri
    const paymentStats = useMemo(() => {
      const activePayments = payments.filter((p) => !p.isDeleted);
      const tahsilEdilen = activePayments.filter((p) => p.status === 'Tahsil Edildi');
      const bekleyen = activePayments.filter((p) => p.status === 'Bekliyor');

      const tahsilEdilenTutar = tahsilEdilen.reduce((sum, p) => {
        const amount = p.amount || 0;
        const inTRY =
          p.currency === 'USD' ? amount * 35 : p.currency === 'EUR' ? amount * 38 : amount;
        return sum + inTRY;
      }, 0);

      const bekleyenTutar = bekleyen.reduce((sum, p) => {
        const amount = p.amount || 0;
        const inTRY =
          p.currency === 'USD' ? amount * 35 : p.currency === 'EUR' ? amount * 38 : amount;
        return sum + inTRY;
      }, 0);

      // Çek bilgileri - siparişlerden çek ödeme tipindekileri say
      const cekOrders = orders.filter((o) => !o.isDeleted && o.paymentType === 'Çek');
      const today = new Date();
      const vadesiYaklasanCekler = cekOrders.filter((o) => {
        if (o.checkDate) {
          const checkDate = new Date(o.checkDate);
          const daysUntilDue = Math.ceil(
            (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntilDue >= 0 && daysUntilDue <= 30;
        }
        return false;
      });

      const vadesiGecmisCekler = cekOrders.filter((o) => {
        if (o.checkDate) {
          const checkDate = new Date(o.checkDate);
          return checkDate < today;
        }
        return false;
      });

      return {
        tahsilEdilenCount: tahsilEdilen.length,
        tahsilEdilenTutar,
        bekleyenCount: bekleyen.length,
        bekleyenTutar,
        toplamCekSayisi: cekOrders.length,
        vadesiYaklasanCekler: vadesiYaklasanCekler.length,
        vadesiGecmisCekler: vadesiGecmisCekler.length,
      };
    }, [payments, orders]);

    const handleDateRangeChange = (e: ChangeEvent<HTMLSelectElement>) => {
      setDateRange(e.target.value);
    };

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Raporlar ve Analizler
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              İşletmenizin performansını ve günlük aktivitelerinizi izleyin.
            </p>
          </div>
          {/* Tarih Aralığı Seçici */}
          <select
            value={dateRange}
            onChange={handleDateRangeChange}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <option value="7">Son 7 Gün</option>
            <option value="30">Son 30 Gün</option>
            <option value="90">Son 90 Gün</option>
            <option value="365">Son 1 Yıl</option>
          </select>
        </div>

        {/* Modal: Günlük Performans Raporu */}
        <Modal
          show={showDailyReportModal}
          onClose={() => setShowDailyReportModal(false)}
          title=""
          maxWidth="max-w-7xl"
        >
          <EnhancedDailyReportWithDetails
            orders={orders}
            quotes={teklifler}
            meetings={gorusmeler}
            shipments={shipments}
            customers={customers}
            products={products}
            payments={payments}
          />
        </Modal>

        {/* Quick Access Card for Daily Report */}
        <div
          onClick={() => setShowDailyReportModal(true)}
          className="mb-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.99] group"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                <ChartBarIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="text-white text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Günlük Performans Raporu</h3>
                <p className="text-white/90 text-sm md:text-base">
                  Bugünün detaylı satış, teklif ve operasyon metriklerini görüntüleyin. Önceki
                  günlerle karşılaştırın ve performansınızı takip edin.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white font-semibold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg group-hover:bg-white/30 transition-colors whitespace-nowrap min-h-[44px]">
              <span>Raporu Görüntüle</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 mt-8">
          Genel Bakış
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Toplam Gelir</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm mt-2 opacity-75">{stats.totalOrders} sipariş</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Ortalama Sipariş</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(stats.avgOrderValue)}</p>
            <p className="text-sm mt-2 opacity-75">Sipariş başına</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Aktif Müşteriler</h3>
            <p className="text-3xl font-bold mt-2">{stats.activeCustomers}</p>
            <p className="text-sm mt-2 opacity-75">{stats.totalCustomers} toplam</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Dönüşüm Oranı</h3>
            <p className="text-3xl font-bold mt-2">{stats.conversionRate.toFixed(1)}%</p>
            <p className="text-sm mt-2 opacity-75">Teklif → Sipariş</p>
          </div>
        </div>

        {/* KAYIP ANALİZİ (New Section) */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 mt-8 flex items-center gap-2">
          <span className="text-red-500">📉</span> Kayıp Analizi (Loss Analysis)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 1. Özet Kartları */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Toplam Kayıp Tutar
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                {formatCurrency(lossAnalysis.totalLostValue)}
              </p>
              <p className="text-xs text-red-500 mt-1">
                {lossAnalysis.totalLost} adet reddedilen teklif
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ortalama Fiyat Farkı
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                %{lossAnalysis.avgPriceGap.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Piyasadan ortalama bu kadar pahalıyız</p>
            </div>
          </div>

          {/* 2. Red Sebepleri Grafiği */}
          <div className="lg:col-span-1">
            <LossReasonChart data={lossAnalysis.reasonData} />
          </div>

          {/* 3. Rakip Analizi Grafiği */}
          <div className="lg:col-span-1">
            <CompetitorChart data={lossAnalysis.competitorData} />
          </div>
        </div>

        {/* Cari Hesap Özeti */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 mt-8">
          Cari Hesap Özeti
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Toplam Alacak</h3>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(cariHesapSummary.totalAlacak)}
            </p>
            <p className="text-sm mt-2 opacity-75">{cariHesapSummary.alacakCount} müşteri</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Toplam Borç</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(cariHesapSummary.totalBorc)}</p>
            <p className="text-sm mt-2 opacity-75">{cariHesapSummary.borcCount} müşteri</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Net Bakiye</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(cariHesapSummary.netBalance)}</p>
            <p className="text-sm mt-2 opacity-75">Alacak - Borç</p>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Dengede</h3>
            <p className="text-3xl font-bold mt-2">{cariHesapSummary.dengedeCount}</p>
            <p className="text-sm mt-2 opacity-75">Müşteri hesabı dengede</p>
          </div>
        </div>

        {/* Ödeme & Tahsilat */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 mt-8">
          Ödeme & Tahsilat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Tahsil Edilen</h3>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(paymentStats.tahsilEdilenTutar)}
            </p>
            <p className="text-sm mt-2 opacity-75">{paymentStats.tahsilEdilenCount} ödeme</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Bekleyen Tahsilat</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(paymentStats.bekleyenTutar)}</p>
            <p className="text-sm mt-2 opacity-75">{paymentStats.bekleyenCount} ödeme</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Vadesi Yaklaşan Çekler</h3>
            <p className="text-3xl font-bold mt-2">{paymentStats.vadesiYaklasanCekler}</p>
            <p className="text-sm mt-2 opacity-75">30 gün içinde</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Vadesi Geçmiş Çekler</h3>
            <p className="text-3xl font-bold mt-2">{paymentStats.vadesiGecmisCekler}</p>
            <p className="text-sm mt-2 opacity-75">{paymentStats.toplamCekSayisi} toplam çek</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SalesChart data={salesTrendData} title={`Satış Trendi (Son ${dateRange} Gün)`} />
          <OrderStatusChart data={orderStatusData} />
        </div>

        <div className="mb-8">
          <CustomerAnalyticsChart data={customerAnalytics} title="En İyi 10 Müşteri" />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Sipariş İstatistikleri
            </h3>
            <div className="space-y-3">
              {orderStatusData.map((stat) => (
                <div key={stat.name} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{stat.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Teklif Durumu
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Toplam Teklif</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalQuotes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Onaylanan</span>
                <span className="font-semibold text-green-600">
                  {teklifler.filter((t) => !t.isDeleted && t.status === 'Onaylandı').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Bekleyen</span>
                <span className="font-semibold text-yellow-600">
                  {teklifler.filter((t) => !t.isDeleted && t.status === 'Hazırlandı').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Reddedilen</span>
                <span className="font-semibold text-red-600">
                  {teklifler.filter((t) => !t.isDeleted && t.status === 'Reddedildi').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Görüşme Aktivitesi
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Toplam Görüşme</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalMeetings}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">İlgileniyor</span>
                <span className="font-semibold text-blue-600">
                  {gorusmeler.filter((g) => !g.isDeleted && g.outcome === 'İlgileniyor').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Teklif Bekliyor</span>
                <span className="font-semibold text-purple-600">
                  {gorusmeler.filter((g) => !g.isDeleted && g.outcome === 'Teklif Bekliyor').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">İlgilenmiyor</span>
                <span className="font-semibold text-gray-600">
                  {gorusmeler.filter((g) => !g.isDeleted && g.outcome === 'İlgilenmiyor').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Guide Section */}
        {onGuideClick && (
          <div className="mt-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 rounded-xl shadow-lg">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-full">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      📚 Kullanıcı Rehberi
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Takip CRM'in tüm özelliklerini keşfedin. Adım adım talimatlar, mobil kullanım
                      ipuçları, klavye kısayolları ve daha fazlası için kapsamlı rehberimizi
                      inceleyin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onGuideClick}
                  className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 whitespace-nowrap min-h-[52px]"
                >
                  <span>Rehberi Aç</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { icon: '🔐', text: 'Giriş' },
                  { icon: '👥', text: 'Müşteriler' },
                  { icon: '📦', text: 'Siparişler' },
                  { icon: '📱', text: 'Mobil' },
                  { icon: '💡', text: 'İpuçları' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg text-center border border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-2xl block mb-1">{item.icon}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Reports.displayName = 'Reports';

export default Reports;
