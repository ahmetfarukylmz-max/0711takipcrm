import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import type { Order, Customer, Shipment } from '../../types';
import { logger } from '../../utils/logger';

interface OverdueOrdersModalProps {
  /** List of overdue orders */
  orders: Order[];
  /** List of customers */
  customers: Customer[];
  /** List of shipments to check partial delivery status */
  shipments: Shipment[];
  /** Callback to navigate to Orders page */
  onViewAllOrders: () => void;
  /** Callback to update order delivery date */
  onUpdateDeliveryDate?: (orderId: string, newDate: string) => Promise<void>;
}

/**
 * OverdueOrdersModal - Displays list of overdue orders with quick actions
 */
const OverdueOrdersModal: React.FC<OverdueOrdersModalProps> = ({
  orders,
  customers,
  shipments,
  onViewAllOrders,
  onUpdateDeliveryDate,
}) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingDate, setUpdatingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');

  /**
   * Calculate days overdue
   */
  const getDaysOverdue = (deliveryDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate);
    delivery.setHours(0, 0, 0, 0);
    return Math.ceil((today.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * Get overdue text with proper formatting
   */
  const getOverdueText = (days: number): string => {
    if (days === 0) return 'Bugün teslim';
    if (days === 1) return '1 gün gecikmiş';
    return `${days} gün gecikmiş`;
  };

  /**
   * Get urgency color based on days overdue
   */
  const getUrgencyColor = (days: number): string => {
    if (days >= 3) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
    if (days >= 1)
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
    return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
  };

  const getUrgencyTextColor = (days: number): string => {
    if (days >= 3) return 'text-red-700 dark:text-red-300';
    if (days >= 1) return 'text-orange-700 dark:text-orange-300';
    return 'text-yellow-700 dark:text-yellow-300';
  };

  const getUrgencyIcon = (days: number): string => {
    if (days >= 3) return '🔴';
    if (days >= 1) return '🟠';
    return '🟡';
  };

  /**
   * Sort orders by days overdue (most overdue first)
   */
  const sortedOrders = [...orders]
    .filter((o) => o.delivery_date)
    .sort((a, b) => {
      const daysA = getDaysOverdue(a.delivery_date!);
      const daysB = getDaysOverdue(b.delivery_date!);
      return daysB - daysA; // Descending order
    });

  /**
   * Handle date update
   */
  const handleUpdateDate = async (orderId: string) => {
    if (!newDate) {
      toast.error('Lütfen yeni tarih seçiniz!');
      return;
    }

    if (!onUpdateDeliveryDate) {
      toast.error('Tarih güncelleme özelliği mevcut değil!');
      return;
    }

    try {
      await onUpdateDeliveryDate(orderId, newDate);
      toast.success('Teslimat tarihi güncellendi!');
      setUpdatingDate(null);
      setNewDate('');
    } catch (error) {
      logger.error('Tarih güncellenemedi:', error);
      toast.error('Tarih güncellenemedi!');
    }
  };

  if (sortedOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🎉</p>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Teslim tarihi geçmiş sipariş bulunmuyor!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Toplam {sortedOrders.length} sipariş teslim tarihi geçti
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              En eski gecikme: {getOverdueText(getDaysOverdue(sortedOrders[0].delivery_date!))}
            </p>
          </div>
          <button
            onClick={onViewAllOrders}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Siparişlerde Görüntüle
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedOrders.map((order) => {
          const customer = customers.find((c) => c.id === order.customerId);
          const daysOverdue = getDaysOverdue(order.delivery_date!);
          const isExpanded = expandedOrder === order.id;
          const isUpdating = updatingDate === order.id;

          // Check for partial shipments
          const hasShipments = shipments.some((s) => s.orderId === order.id && !s.isDeleted);

          return (
            <div
              key={order.id}
              className={`border rounded-lg p-4 transition-all ${getUrgencyColor(daysOverdue)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getUrgencyIcon(daysOverdue)}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {customer?.name || 'Bilinmeyen Müşteri'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-sm mb-1">
                    <p className="text-gray-700 dark:text-gray-300">
                      {formatCurrency(order.total_amount, order.currency)} • Beklenen:{' '}
                      {formatDate(order.delivery_date)}
                    </p>
                    {hasShipments && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        📦 Kısmi Sevk
                      </span>
                    )}
                  </div>

                  <p className={`text-xs font-bold mt-1 ${getUrgencyTextColor(daysOverdue)}`}>
                    {getUrgencyIcon(daysOverdue)} {getOverdueText(daysOverdue).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>

              {/* Quick Actions */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  {/* Date Update */}
                  {onUpdateDeliveryDate && (
                    <div>
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <button
                            onClick={() => handleUpdateDate(order.id)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => {
                              setUpdatingDate(null);
                              setNewDate('');
                            }}
                            className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setUpdatingDate(order.id);
                            // Suggest new date: 7 days from now
                            const suggestedDate = new Date();
                            suggestedDate.setDate(suggestedDate.getDate() + 7);
                            setNewDate(suggestedDate.toISOString().split('T')[0]);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors"
                        >
                          📅 Teslimat Tarihini Güncelle
                        </button>
                      )}
                    </div>
                  )}

                  {/* Order Items Details (Copied from OpenOrdersModal) */}
                  {order.items && (
                    <div className="mt-2">
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
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p>
                      <span className="font-medium">Sipariş No:</span> #{order.id.substring(0, 8)}
                    </p>
                    <p>
                      <span className="font-medium">Sipariş Tarihi:</span>{' '}
                      {formatDate(order.order_date)}
                    </p>
                    <p>
                      <span className="font-medium">Durum:</span> {order.status}
                    </p>
                    {customer?.phone && (
                      <p>
                        <span className="font-medium">Telefon:</span> {customer.phone}
                      </p>
                    )}
                    {order.notes && (
                      <p>
                        <span className="font-medium">Not:</span> {order.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverdueOrdersModal;
