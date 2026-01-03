import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import Modal from '../common/Modal';
import {
  TrendingDownIcon,
  CalendarIcon,
  ShoppingBagIcon,
  PhoneIcon,
  DocumentTextIcon,
  ClockIcon,
} from '../icons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { differenceInDays, parseISO } from 'date-fns';

interface CustomerRiskAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onCreateQuote: () => void;
  onWhatsApp: () => void;
}

const CustomerRiskAnalysisModal: React.FC<CustomerRiskAnalysisModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onCreateQuote,
  onWhatsApp,
}) => {
  const { collections } = useStore();
  const { customers, orders } = collections;

  const customer = customers.find((c) => c.id === customerId);

  const analysis = useMemo(() => {
    if (!customer) return null;

    const customerOrders = orders
      .filter((o) => o.customerId === customerId && !o.isDeleted && o.status !== 'İptal Edildi')
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

    if (customerOrders.length === 0) return null;

    const lastOrder = customerOrders[0];
    const daysSinceLastOrder = differenceInDays(new Date(), parseISO(lastOrder.order_date));

    // Ortalama sipariş aralığı
    let totalGap = 0;
    if (customerOrders.length > 1) {
      for (let i = 0; i < customerOrders.length - 1; i++) {
        totalGap += differenceInDays(
          parseISO(customerOrders[i].order_date),
          parseISO(customerOrders[i + 1].order_date)
        );
      }
    }
    const avgInterval =
      customerOrders.length > 1 ? Math.round(totalGap / (customerOrders.length - 1)) : 0;

    // En çok alınan ürünler (Favori ürünler)
    const productCounts: Record<string, { name: string; count: number; lastDate: string }> = {};
    customerOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = {
            name: item.productName,
            count: 0,
            lastDate: order.order_date,
          };
        }
        productCounts[item.productId].count += item.quantity;
        if (order.order_date > productCounts[item.productId].lastDate) {
          productCounts[item.productId].lastDate = order.order_date;
        }
      });
    });

    // "Terk edilen" ürünleri bul (Son siparişte olmayan favori ürünler)
    const abandonedProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        daysSince: differenceInDays(new Date(), parseISO(p.lastDate)),
      }));

    return {
      customer,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, o) => sum + o.total_amount, 0),
      lastOrderDate: lastOrder.order_date,
      daysSinceLastOrder,
      avgInterval,
      abandonedProducts,
    };
  }, [customerId, customers, orders]);

  if (!analysis) return null;

  return (
    <Modal title="Müşteri Risk Analizi" isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Üst Bilgi Kartı */}
        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800 flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm text-rose-500">
            <TrendingDownIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {analysis.customer?.name}
              <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-xs rounded-full">
                Riskli
              </span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
              Bu müşteri normalde her{' '}
              <span className="font-bold">{analysis.avgInterval} günde</span> bir sipariş verirdi.
              Ancak{' '}
              <span className="font-bold text-rose-600">{analysis.daysSinceLastOrder} gündür</span>{' '}
              sipariş vermiyor.
            </p>
          </div>
        </div>

        {/* İstatistikler Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> Son Sipariş
            </div>
            <div className="font-semibold text-slate-800 dark:text-white">
              {formatDate(analysis.lastOrderDate)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" /> Sessizlik
            </div>
            <div className="font-semibold text-rose-600">{analysis.daysSinceLastOrder} Gün</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <ShoppingBagIcon className="w-3 h-3" /> Toplam Sipariş
            </div>
            <div className="font-semibold text-slate-800 dark:text-white">
              {analysis.orderCount} Adet
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <TrendingDownIcon className="w-3 h-3" /> Toplam Ciro
            </div>
            <div className="font-semibold text-slate-800 dark:text-white">
              {formatCurrency(analysis.totalSpent)}
            </div>
          </div>
        </div>

        {/* Ürün Analizi */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <ShoppingBagIcon className="w-4 h-4" />
            Eskiden Aldığı Ürünler
          </h4>
          <div className="space-y-2">
            {analysis.abandonedProducts.map((prod, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-800 dark:text-white text-sm">
                    {prod.name}
                  </div>
                  <div className="text-xs text-slate-400">Toplam {prod.count} adet alındı</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-rose-600">
                    {prod.daysSince} gündür almıyor
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
          <button
            onClick={onWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-medium transition-colors"
          >
            <PhoneIcon className="w-4 h-4" />
            WhatsApp ile Sor
          </button>
          <button
            onClick={onCreateQuote}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" />
            Özel Teklif Hazırla
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerRiskAnalysisModal;
