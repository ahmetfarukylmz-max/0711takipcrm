import React, { useState, useMemo } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { Order, Customer, Shipment } from '../../types';

interface OpenOrdersModalProps {
  /** List of open orders (Bekliyor, Hazırlanıyor) */
  orders: Order[];
  /** List of customers */
  customers: Customer[];
  /** List of shipments to check partial delivery status */
  shipments: Shipment[];
  /** Callback to navigate to Orders page */
  onViewAllOrders: () => void;
}

/**
 * OpenOrdersModal - Displays list of open orders with status and delivery info
 */
const OpenOrdersModal: React.FC<OpenOrdersModalProps> = ({
  orders,
  customers,
  shipments,
  onViewAllOrders,
}) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'orders' | 'products'>('orders');

  /**
   * Calculate days until delivery
   */
  const getDaysUntilDelivery = (deliveryDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate);
    delivery.setHours(0, 0, 0, 0);
    return Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * Get delivery urgency color based on days until delivery
   */
  const getUrgencyColor = (days: number): string => {
    if (days < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'; // Overdue
    if (days === 0)
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'; // Today
    if (days <= 2)
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'; // Soon
    return 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700'; // Normal
  };

  const getUrgencyTextColor = (days: number): string => {
    if (days < 0) return 'text-red-700 dark:text-red-300';
    if (days === 0) return 'text-orange-700 dark:text-orange-300';
    if (days <= 2) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-gray-700 dark:text-gray-300';
  };

  const getUrgencyIcon = (days: number): string => {
    if (days < 0) return '🔴';
    if (days === 0) return '🟠';
    if (days <= 2) return '🟡';
    return '🟢';
  };

  const getDeliveryText = (days: number): string => {
    if (days < 0) return `${Math.abs(days)} gün gecikmiş`;
    if (days === 0) return 'Bugün teslim';
    if (days === 1) return 'Yarın teslim';
    return `${days} gün sonra`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Bekliyor':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Hazırlanıyor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  /**
   * Sort orders by delivery date (soonest first)
   */
  const sortedOrders = [...orders]
    .filter((o) => o.delivery_date)
    .sort((a, b) => {
      const daysA = getDaysUntilDelivery(a.delivery_date!);
      const daysB = getDaysUntilDelivery(b.delivery_date!);
      return daysA - daysB; // Ascending order (soonest first)
    });

  // Orders without delivery date at the end
  const ordersWithoutDate = orders.filter((o) => !o.delivery_date);
  const allSortedOrders = [...sortedOrders, ...ordersWithoutDate];

  // Aggregation Logic for Products
  const productRequirements = useMemo(() => {
    const requirements = new Map<
      string,
      {
        productId: string;
        productName: string;
        unit: string;
        totalNeeded: number;
        totalOrders: number;
        relatedOrders: {
          orderId: string;
          customerName: string;
          quantity: number;
          deliveryDate?: string;
        }[];
      }
    >();

    allSortedOrders.forEach((order) => {
      order.items?.forEach((item, idx) => {
        // Calculate shipped count
        const totalShipped = shipments
          .filter((s) => s.orderId === order.id && !s.isDeleted)
          .reduce((sum, s) => {
            const sItem = s.items?.find(
              (si) =>
                si.productId === item.productId &&
                (si.orderItemIndex !== undefined ? si.orderItemIndex === idx : true)
            );
            return sum + (sItem?.quantity || 0);
          }, 0);

        const remaining = (item.quantity || 0) - totalShipped;

        if (remaining > 0) {
          const existing = requirements.get(item.productId) || {
            productId: item.productId,
            productName: item.productName || 'Bilinmeyen Ürün',
            unit: item.unit || 'Adet',
            totalNeeded: 0,
            totalOrders: 0,
            relatedOrders: [],
          };

          existing.totalNeeded += remaining;
          existing.totalOrders += 1;
          const customer = customers.find((c) => c.id === order.customerId);
          existing.relatedOrders.push({
            orderId: order.id,
            customerName: customer?.name || 'Bilinmeyen Müşteri',
            quantity: remaining,
            deliveryDate: order.delivery_date,
          });

          requirements.set(item.productId, existing);
        }
      });
    });

    return Array.from(requirements.values()).sort((a, b) => b.totalNeeded - a.totalNeeded);
  }, [allSortedOrders, shipments, customers]);

  return (
    <div className="max-h-[70vh] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 shrink-0">
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'orders'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setViewMode('orders')}
        >
          Sipariş Listesi ({allSortedOrders.length})
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'products'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setViewMode('products')}
        >
          Ürün İhtiyaçları ({productRequirements.length})
        </button>
      </div>

      <div className="overflow-y-auto flex-1 pr-1">
        {viewMode === 'orders' ? (
          allSortedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-lg">🎉 Harika! Açık sipariş yok.</p>
              <p className="text-sm mt-2">Tüm siparişler tamamlanmış veya teslim edilmiş.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allSortedOrders.map((order) => {
                const customer = customers.find((c) => c.id === order.customerId);
                const daysUntil = order.delivery_date
                  ? getDaysUntilDelivery(order.delivery_date)
                  : null;
                const isExpanded = expandedOrder === order.id;

                // Check for partial shipments
                const hasShipments = shipments.some((s) => s.orderId === order.id && !s.isDeleted);

                return (
                  <div
                    key={order.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      daysUntil !== null
                        ? getUrgencyColor(daysUntil)
                        : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {daysUntil !== null && (
                            <span className="text-xl">{getUrgencyIcon(daysUntil)}</span>
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {customer?.name || 'Bilinmeyen Müşteri'}
                          </h3>
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Sipariş:</span>{' '}
                            <span className="font-mono text-blue-600 dark:text-blue-400">
                              #{order.id.slice(-6)}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              Durum:
                            </span>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                            {hasShipments && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                📦 Kısmi Sevk
                              </span>
                            )}
                          </div>
                          {order.delivery_date && daysUntil !== null && (
                            <p className={`font-medium ${getUrgencyTextColor(daysUntil)}`}>
                              <span className="font-medium">Teslim:</span>{' '}
                              {formatDate(order.delivery_date)} ({getDeliveryText(daysUntil)})
                            </p>
                          )}
                          {!order.delivery_date && (
                            <p className="text-gray-500 dark:text-gray-400 italic">
                              Teslim tarihi belirtilmemiş
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(order.total_amount, order.currency)}
                        </p>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {isExpanded ? 'Gizle ▲' : 'Detaylar ▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && order.items && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Sipariş Ürünleri:
                        </h4>
                        <div className="space-y-1.5">
                          {order.items.map((item, idx) => {
                            // Calculate shipped qty for this item
                            const totalShipped = shipments
                              .filter((s) => s.orderId === order.id && !s.isDeleted)
                              .reduce((sum, s) => {
                                const sItem = s.items?.find(
                                  (si) =>
                                    si.productId === item.productId &&
                                    (si.orderItemIndex !== undefined
                                      ? si.orderItemIndex === idx
                                      : true)
                                );
                                return sum + (sItem?.quantity || 0);
                              }, 0);

                            const remaining = (item.quantity || 0) - totalShipped;
                            const isFullyShipped = remaining <= 0;

                            return (
                              <div
                                key={idx}
                                className={`flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm rounded p-2 border ${
                                  isFullyShipped
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                }`}
                              >
                                <span className="text-gray-900 dark:text-gray-100 font-medium mb-1 sm:mb-0">
                                  {item.productName || 'Ürün'}
                                </span>
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                  <span title="Sipariş Miktarı">
                                    Sipariş: <strong>{item.quantity}</strong>
                                  </span>
                                  <span title="Sevk Edilen">
                                    Sevk: <strong>{totalShipped}</strong>
                                  </span>
                                  <span
                                    title="Kalan Miktar"
                                    className={`font-bold ${remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}
                                  >
                                    Kalan: {remaining}
                                  </span>
                                  <span className="text-gray-400">({item.unit || 'Adet'})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {order.notes && (
                          <div className="mt-3 text-sm">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Not:
                            </span>{' '}
                            <span className="text-gray-600 dark:text-gray-400">{order.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : // Product Requirements View
        productRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-lg">✅ İhtiyaç listesi boş.</p>
            <p className="text-sm mt-2">Tüm açık siparişlerdeki ürünler sevk edilmiş.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {productRequirements.map((req, idx) => (
              <div
                key={req.productId || idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {req.productName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {req.totalOrders} farklı siparişte bekleniyor
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {req.totalNeeded.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500 ml-1">{req.unit}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Toplam İhtiyaç</div>
                  </div>
                </div>

                {/* Related Orders Breakdown (Always visible or toggleable? Let's make it a simple list) */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    İlgili Siparişler
                  </div>
                  <div className="space-y-2">
                    {req.relatedOrders.map((ro, roIdx) => (
                      <div key={roIdx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {ro.customerName}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                            #{ro.orderId.slice(-6)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {ro.deliveryDate && (
                            <span className="text-xs text-gray-500">
                              {formatDate(ro.deliveryDate)}
                            </span>
                          )}
                          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {ro.quantity} {req.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <button
          onClick={onViewAllOrders}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Tüm Siparişleri Görüntüle ({orders.length})
        </button>
      </div>
    </div>
  );
};

export default OpenOrdersModal;
