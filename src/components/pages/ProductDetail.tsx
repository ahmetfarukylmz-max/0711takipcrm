import React, { useMemo, useState, memo } from 'react';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';
import { getCategoryWithIcon } from '../../utils/categories';
import type { Product, Order, Quote, Customer } from '../../types';

interface SalesStats {
  id: string;
  customerName: string;
  quantity: number;
  revenue: number;
  profit: number;
  orderCount: number;
}

interface SaleHistory {
  orderId: string;
  orderNumber: string;
  customerName: string;
  date: string;
  quantity: number;
  unitPrice: number;
  revenue: number;
  profit: number;
  status: string;
}

type TabId = 'overview' | 'sales-history' | 'customers' | 'profit-analysis';

interface ProductDetailProps {
  product: Product;
  orders: Order[];
  quotes: Quote[];
  customers: Customer[];
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const ProductDetail = memo<ProductDetailProps>(({
  product,
  orders,
  quotes,
  customers,
  onEdit,
  onDelete,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Tüm satışları hesapla
  const salesData = useMemo(() => {
    const productOrders = orders.filter(o =>
      !o.isDeleted &&
      o.items?.some(item => item.productId === product.id)
    );

    let totalQuantity = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    const customerSales: Record<string, SalesStats> = {};

    productOrders.forEach(order => {
      const item = order.items?.find(i => i.productId === product.id);
      if (!item) return;

      const quantity = item.quantity || 0;
      const unitPrice = item.unit_price || 0;
      const revenue = quantity * unitPrice;
      const cost = quantity * (product.cost_price || 0);
      const profit = revenue - cost;

      totalQuantity += quantity;
      totalRevenue += revenue;
      totalProfit += profit;

      // Müşteri bazlı satış
      const customerId = order.customerId;
      if (!customerSales[customerId]) {
        customerSales[customerId] = {
          id: customerId,
          customerName: order.customerName || 'Bilinmeyen Müşteri',
          quantity: 0,
          revenue: 0,
          profit: 0,
          orderCount: 0
        };
      }

      customerSales[customerId].quantity += quantity;
      customerSales[customerId].revenue += revenue;
      customerSales[customerId].profit += profit;
      customerSales[customerId].orderCount += 1;
    });

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalOrders: productOrders.length,
      totalQuantity,
      totalRevenue,
      totalProfit,
      profitMargin,
      customerSales: Object.values(customerSales).sort((a, b) => b.revenue - a.revenue),
      lastSaleDate: productOrders.length > 0
        ? productOrders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date
        : null
    };
  }, [product.id, orders, product.cost_price]);

  // Satış geçmişi
  const salesHistory = useMemo<SaleHistory[]>(() => {
    const history: SaleHistory[] = [];

    orders
      .filter(o => !o.isDeleted && o.items?.some(item => item.productId === product.id))
      .forEach(order => {
        const item = order.items?.find(i => i.productId === product.id);
        if (!item) return;

        const quantity = item.quantity || 0;
        const unitPrice = item.unit_price || 0;
        const revenue = quantity * unitPrice;
        const cost = quantity * (product.cost_price || 0);
        const profit = revenue - cost;

        history.push({
          orderId: order.id,
          orderNumber: order.orderNumber || order.id.slice(0, 8),
          customerName: order.customerName || 'Bilinmeyen Müşteri',
          date: order.order_date,
          quantity,
          unitPrice,
          revenue,
          profit,
          status: order.status
        });
      });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [product.id, orders, product.cost_price]);

  // Teklif sayısı
  const quoteCount = useMemo(() => {
    return quotes.filter(q =>
      !q.isDeleted &&
      q.items?.some(item => item.productId === product.id)
    ).length;
  }, [product.id, quotes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <button
            onClick={onBack}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 text-sm flex items-center gap-1"
          >
            ← Ürünlere Dön
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {product.name}
          </h2>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {product.code && (
              <p><span className="font-semibold">Ürün Kodu:</span> {product.code}</p>
            )}
            {product.category && (
              <p>
                <span className="font-semibold">Kategori:</span> {getCategoryWithIcon(product.category)}
                {product.subcategory && ` → ${product.subcategory}`}
              </p>
            )}
            <p><span className="font-semibold">Maliyet:</span> {formatCurrency(product.cost_price, product.currency)}</p>
            <p><span className="font-semibold">Satış Fiyatı:</span> {formatCurrency(product.selling_price, product.currency)}</p>
            <p><span className="font-semibold">Birim:</span> {product.unit}</p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-semibold">Etiketler:</span>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {product.description && (
              <p><span className="font-semibold">Açıklama:</span> {product.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 min-h-[44px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-transform text-sm"
          >
            Düzenle
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 min-h-[44px] bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-[0.98] transition-transform text-sm"
          >
            Sil
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Toplam Satış */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">Toplam Satış</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {salesData.totalQuantity} {product.unit}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {salesData.totalOrders} siparişte
          </div>
        </div>

        {/* Toplam Gelir */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">Toplam Gelir</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">
            {formatCurrency(salesData.totalRevenue, product.currency)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Satışlardan
          </div>
        </div>

        {/* Toplam Kar */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-1">Toplam Kar</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
            {formatCurrency(salesData.totalProfit, product.currency)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Net kar
          </div>
        </div>

        {/* Kar Marjı */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-sm text-orange-700 dark:text-orange-400 font-medium mb-1">Kar Marjı</div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
            %{salesData.profitMargin.toFixed(1)}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Ortalama
          </div>
        </div>

        {/* Müşteri Sayısı */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-700 dark:text-gray-400 font-medium mb-1">Müşteri Sayısı</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {salesData.customerSales.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {quoteCount} teklif
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex gap-4 md:gap-6 min-w-min">
          {[
            { id: 'overview' as TabId, label: 'Özet' },
            { id: 'sales-history' as TabId, label: `Satış Geçmişi (${salesHistory.length})` },
            { id: 'customers' as TabId, label: `Müşteriler (${salesData.customerSales.length})` },
            { id: 'profit-analysis' as TabId, label: 'Kar Analizi' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3 border-b-2 font-medium text-sm whitespace-nowrap min-h-[44px] ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab İçerikleri */}
      <div className="mt-4">
        {/* Özet */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Son Satışlar</h3>
              <div className="space-y-3">
                {salesHistory.slice(0, 5).map((sale, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{sale.customerName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(sale.date)} • {sale.quantity} {product.unit} • {formatCurrency(sale.unitPrice, product.currency)}/{product.unit}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(sale.revenue, product.currency)}
                      </div>
                      <div className={`text-xs font-semibold ${
                        sale.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        Kar: {formatCurrency(sale.profit, product.currency)}
                      </div>
                    </div>
                  </div>
                ))}
                {salesHistory.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Henüz satış yok</p>
                )}
              </div>
            </div>

            {salesData.lastSaleDate && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  📅 <strong>Son Satış:</strong> {formatDate(salesData.lastSaleDate)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Satış Geçmişi */}
        {activeTab === 'sales-history' && (
          <>
            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tarih</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Sipariş No</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Müşteri</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Miktar</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Birim Fiyat</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Gelir</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Kar</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salesHistory.map((sale, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(sale.date)}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{sale.orderNumber}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{sale.customerName}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{sale.quantity} {product.unit}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(sale.unitPrice, product.currency)}</td>
                      <td className="p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(sale.revenue, product.currency)}</td>
                      <td className={`p-3 text-sm font-semibold ${
                        sale.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(sale.profit, product.currency)}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {salesHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Henüz satış geçmişi bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-3">
              {salesHistory.map((sale, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{sale.customerName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(sale.date)}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(sale.status)}`}>
                      {sale.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Miktar:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{sale.quantity} {product.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Birim:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(sale.unitPrice, product.currency)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Gelir:</span>
                      <span className="ml-2 font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.revenue, product.currency)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Kar:</span>
                      <span className={`ml-2 font-bold ${
                        sale.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(sale.profit, product.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {salesHistory.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg">
                  Henüz satış geçmişi bulunmuyor
                </div>
              )}
            </div>
          </>
        )}

        {/* Müşteriler */}
        {activeTab === 'customers' && (
          <>
            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Müşteri</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Miktar</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Gelir</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Kar</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Sipariş Sayısı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salesData.customerSales.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-sm font-medium text-gray-900 dark:text-gray-100">{customer.customerName}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{customer.quantity} {product.unit}</td>
                      <td className="p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(customer.revenue, product.currency)}</td>
                      <td className={`p-3 text-sm font-semibold ${
                        customer.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(customer.profit, product.currency)}
                      </td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{customer.orderCount}</td>
                    </tr>
                  ))}
                  {salesData.customerSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Henüz müşteri bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-3">
              {salesData.customerSales.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{customer.customerName}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Miktar:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{customer.quantity} {product.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sipariş:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{customer.orderCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Gelir:</span>
                      <span className="ml-2 font-bold text-green-600 dark:text-green-400">{formatCurrency(customer.revenue, product.currency)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Kar:</span>
                      <span className={`ml-2 font-bold ${
                        customer.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(customer.profit, product.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {salesData.customerSales.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg">
                  Henüz müşteri bulunmuyor
                </div>
              )}
            </div>
          </>
        )}

        {/* Kar Analizi */}
        {activeTab === 'profit-analysis' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Kar/Zarar Özeti</h3>

              <div className="space-y-4">
                {/* Genel Kar Marjı */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ortalama Kar Marjı</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      %{salesData.profitMargin.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Birim Başına Kar</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency((product.selling_price || 0) - (product.cost_price || 0), product.currency)}
                    </div>
                  </div>
                </div>

                {/* Detaylı Kar Analizi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Maliyet</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(salesData.totalQuantity * (product.cost_price || 0), product.currency)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatCurrency(product.cost_price || 0, product.currency)} x {salesData.totalQuantity}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Gelir</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(salesData.totalRevenue, product.currency)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Satışlardan
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Kar</div>
                    <div className={`text-xl font-bold ${
                      salesData.totalProfit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(salesData.totalProfit, product.currency)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {salesData.totalProfit > 0 ? 'Pozitif' : 'Negatif'}
                    </div>
                  </div>
                </div>

                {/* Uyarılar */}
                {salesData.profitMargin < 10 && salesData.totalOrders > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      ⚠️ <strong>Düşük Kar Marjı:</strong> Bu ürünün kar marjı %10'un altında. Fiyatlandırmayı gözden geçirmeyi düşünün.
                    </p>
                  </div>
                )}

                {salesData.totalProfit < 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      🚨 <strong>Zarar:</strong> Bu ürün toplam zararda. Satış fiyatının maliyet fiyatından düşük olup olmadığını kontrol edin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ProductDetail.displayName = 'ProductDetail';

export default ProductDetail;
