import React, { useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculatePaymentAnalytics, getRiskColor, getRiskStars } from '../../utils/paymentAnalytics';
import type { Payment, Order, Customer } from '../../types';

interface CustomerPaymentSummaryProps {
  customer: Customer;
  payments: Payment[];
  orders: Order[];
  onViewPayment?: (payment: Payment) => void;
}

const CustomerPaymentSummary: React.FC<CustomerPaymentSummaryProps> = ({
  customer,
  payments,
  orders,
  onViewPayment
}) => {
  // Analytics hesapla
  const analytics = useMemo(() => {
    return calculatePaymentAnalytics(customer.id, payments, orders);
  }, [customer.id, payments, orders]);

  const riskColorClass = getRiskColor(analytics.riskLevel);

  return (
    <div className="space-y-6">
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Borç */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Toplam Borç</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(analytics.totalDebt, 'TRY')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tüm siparişler</div>
        </div>

        {/* Tahsil Edilmiş */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">Tahsil Edilmiş</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">
            {formatCurrency(analytics.collectedAmount, 'TRY')}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {analytics.totalDebt > 0
              ? `%${Math.round((analytics.collectedAmount / analytics.totalDebt) * 100)} tamamlandı`
              : 'Henüz sipariş yok'
            }
          </div>
        </div>

        {/* Bekleyen */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">Bekleyen</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {formatCurrency(analytics.pendingAmount, 'TRY')}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {analytics.totalDebt > 0
              ? `%${Math.round((analytics.pendingAmount / analytics.totalDebt) * 100)} beklemede`
              : '-'
            }
          </div>
        </div>

        {/* Gecikmiş */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
          <div className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Gecikmiş</div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-300">
            {formatCurrency(analytics.overdueAmount, 'TRY')}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            {analytics.totalDebt > 0
              ? `%${Math.round((analytics.overdueAmount / analytics.totalDebt) * 100)} gecikmiş`
              : '-'
            }
          </div>
        </div>
      </div>

      {/* Ödeme Disiplin Skoru */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          💯 Ödeme Disiplin Skoru
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol: Skor Göstergesi */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {analytics.riskScore.toFixed(1)}
              <span className="text-3xl text-gray-500 dark:text-gray-400">/10</span>
            </div>
            <div className="text-xl mb-2">{getRiskStars(analytics.riskScore)}</div>
            <div className={`px-4 py-2 rounded-full font-semibold text-sm ${riskColorClass}`}>
              {analytics.riskLevel} RİSK
            </div>
          </div>

          {/* Sağ: Detaylar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Zamanında Ödeme Oranı</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                %{analytics.onTimePaymentRate}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">⏱️</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Ortalama Gecikme</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {analytics.avgDelayDays} gün
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Toplam Ödeme</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {analytics.timeline.length} adet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme Yöntemleri Dağılımı */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          💳 Ödeme Yöntemleri Dağılımı
        </h3>

        <div className="space-y-3">
          {Object.entries(analytics.paymentMethodDistribution).length > 0 ? (
            Object.entries(analytics.paymentMethodDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => {
                const percentage = analytics.collectedAmount > 0
                  ? Math.round((amount / analytics.collectedAmount) * 100)
                  : 0;

                return (
                  <div key={method} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {method}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full flex items-center justify-end pr-2 text-xs text-white font-semibold transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 15 && `${percentage}%`}
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(amount, 'TRY')}
                    </div>
                  </div>
                );
              })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">Henüz ödeme yok</p>
          )}
        </div>
      </div>

      {/* Aylık Trend */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📈 Aylık Ödeme Trendi (Son 6 Ay)
        </h3>

        <div className="space-y-2">
          {analytics.monthlyTrend.map((item, index) => {
            const maxAmount = Math.max(...analytics.monthlyTrend.map(m => m.amount), 1);
            const percentage = (item.amount / maxAmount) * 100;

            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {item.month}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-3 text-sm text-white font-semibold transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  >
                    {item.count > 0 && `${item.count} ödeme`}
                  </div>
                </div>
                <div className="w-28 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.amount, 'TRY')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ödeme Geçmişi Timeline */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🕐 Ödeme Geçmişi (Son 20 Ödeme)
        </h3>

        <div className="space-y-3">
          {analytics.timeline.length > 0 ? (
            analytics.timeline.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                onClick={() => {
                  const payment = payments.find(p =>
                    p.dueDate === item.date || p.paidDate === item.date
                  );
                  if (payment && onViewPayment) {
                    onViewPayment(payment);
                  }
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {item.status === 'Tahsil Edildi' ? (
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                  ) : item.status === 'Gecikti' ? (
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <span className="text-red-600 dark:text-red-400">!</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400">●</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.amount, 'TRY')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{item.paymentMethod}</span>
                    {item.status === 'Tahsil Edildi' && item.delayDays !== null && (
                      <span className={item.delayDays === 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                        {item.delayDays === 0 ? '✓ Zamanında' : `⏱️ ${item.delayDays} gün gecikmeli`}
                      </span>
                    )}
                    {item.status === 'Bekliyor' && <span className="text-blue-600 dark:text-blue-400">Bekliyor</span>}
                    {item.status === 'Gecikti' && <span className="text-red-600 dark:text-red-400">Gecikmiş</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Henüz ödeme geçmişi yok</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentSummary;
