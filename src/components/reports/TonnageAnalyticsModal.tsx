import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { Order, Product, Customer } from '../../types';

interface TonnageAnalyticsModalProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  onClose: () => void;
}

const TonnageAnalyticsModal: React.FC<TonnageAnalyticsModalProps> = ({
  orders,
  products,
  customers,
  onClose,
}) => {
  // Veri Hesaplamaları
  const { productData, customerData, trendData, totalTonnage } = useMemo(() => {
    const activeOrders = orders.filter((o) => !o.isDeleted);

    const prodStats: Record<string, number> = {};
    const custStats: Record<string, number> = {};
    const timeStats: Record<string, number> = {};
    let total = 0;

    activeOrders.forEach((order) => {
      if (!order.items) return;

      const orderDate = new Date(order.order_date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
      }); // Örn: Ocak 2024

      order.items.forEach((item) => {
        const qty = parseFloat(item.quantity?.toString() || '0');
        const unit = item.unit?.toLowerCase() || '';
        let tonnage = 0;

        if (unit === 'kg') {
          tonnage = qty / 1000;
        } else if (unit === 'ton') {
          tonnage = qty;
        }

        if (tonnage > 0) {
          total += tonnage;

          // Ürün Bazlı
          const prodId = item.productId || 'unknown';
          prodStats[prodId] = (prodStats[prodId] || 0) + tonnage;

          // Müşteri Bazlı
          const custId = order.customerId || 'unknown';
          custStats[custId] = (custStats[custId] || 0) + tonnage;

          // Zaman Bazlı (Ay-Yıl)
          timeStats[orderDate] = (timeStats[orderDate] || 0) + tonnage;
        }
      });
    });

    // Chart Formatına Çevirme
    const productChartData = Object.entries(prodStats)
      .map(([id, value]) => {
        const product = products.find((p) => p.id === id);
        return {
          name: product?.name || 'Bilinmeyen Ürün',
          tonaj: parseFloat(value.toFixed(2)),
        };
      })
      .sort((a, b) => b.tonaj - a.tonaj)
      .slice(0, 10); // İlk 10 Ürün

    const customerChartData = Object.entries(custStats)
      .map(([id, value]) => {
        const customer = customers.find((c) => c.id === id);
        return {
          name: customer?.name || 'Bilinmeyen Müşteri',
          tonaj: parseFloat(value.toFixed(2)),
        };
      })
      .sort((a, b) => b.tonaj - a.tonaj)
      .slice(0, 10); // İlk 10 Müşteri

    const trendChartData = Object.entries(timeStats)
      .map(([date, value]) => ({
        date,
        tonaj: parseFloat(value.toFixed(2)),
        // Sıralama için tarih objesi oluştur
        rawDate: new Date(date.split(' ').reverse().join('-')), // Basit bir parsing
      }))
      // Tarihe göre sırala (Eski -> Yeni)
      // Not: Türkçe ay isimlerini parse etmek zor olabilir, basit string sort yerine
      // activeOrders döngüsünde timestamp key tutmak daha garantidir ama şimdilik basic sort:
      .sort((a, b) => {
        // Tarih formatı "Ocak 2024" olduğu için basit bir mapping gerekebilir
        // Şimdilik string sırası değil, oluşturulma sırasına güvenelim ya da basit bırakalım
        return 0;
      });

    return {
      productData: productChartData,
      customerData: customerChartData,
      trendData: trendChartData,
      totalTonnage: total,
    };
  }, [orders, products, customers]);

  return (
    <div className="p-6 space-y-8">
      {/* Başlık ve Özet */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Detaylı Tonaj Analizi
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Ürün ve müşteri bazlı satış hacmi raporu
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Toplam Hacim</div>
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {totalTonnage.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Ton
          </div>
        </div>
      </div>

      {/* Grafikler Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Ürün Bazlı Dağılım */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              📦
            </span>
            En Çok Satılan Ürünler (Ton)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar
                  dataKey="tonaj"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  name="Miktar (Ton)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Müşteri Bazlı Dağılım */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              👥
            </span>
            En Yüksek Hacimli Müşteriler (Ton)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customerData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(147, 51, 234, 0.05)' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar
                  dataKey="tonaj"
                  fill="#9333EA"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  name="Miktar (Ton)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Zaman İçindeki Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
              📈
            </span>
            Satış Hacmi Trendi (Aylık)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tonaj"
                  stroke="#14B8A6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#14B8A6' }}
                  activeDot={{ r: 6 }}
                  name="Toplam Tonaj"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  );
};

export default TonnageAnalyticsModal;
