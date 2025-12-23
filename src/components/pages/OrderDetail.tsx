import React, { memo, useMemo } from 'react';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';
import { formatCancellationReason } from '../../utils/orderHelpers';
import { formatOrderNumber } from '../../utils/numberFormatters';
import type { Order, Customer, Product, Payment, Shipment, ReturnInvoice } from '../../types';

interface OrderDetailProps {
  /** Order data to display */
  order: Order | null;
  /** Customer associated with the order */
  customer?: Customer | null;
  /** List of products for lookup */
  products: Product[];
  /** All payments for checking order-related payments */
  payments?: Payment[];
  /** Related shipments */
  shipments?: Shipment[];
  /** Related returns */
  returns?: ReturnInvoice[];
}

/**
 * OrderDetail component - Displays detailed information about an order
 */
const OrderDetail = memo<OrderDetailProps>(
  ({ order, customer, products, payments = [], shipments = [], returns = [] }) => {
    if (!order) return null;

    const getProductName = (productId: string): string => {
      const product = products.find((p) => p.id === productId);
      return product?.name || 'Bilinmeyen Ürün';
    };

    // Find related shipments
    const relatedShipments = useMemo(() => {
      return shipments.filter((s) => s.orderId === order.id && !s.isDeleted);
    }, [shipments, order.id]);

    // Find related returns
    const relatedReturns = useMemo(() => {
      return returns.filter((r) => r.orderId === order.id && !r.isDeleted);
    }, [returns, order.id]);

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
              Müşteri Bilgileri
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p>
                <span className="font-semibold">Adı:</span> {customer?.name || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {customer?.email || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Telefon:</span> {customer?.phone || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Adres:</span>{' '}
                {`${customer?.address || ''}, ${customer?.city || ''}`}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
              Sipariş Bilgileri
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p>
                <span className="font-semibold">Sipariş No:</span> {formatOrderNumber(order)}
              </p>
              <p>
                <span className="font-semibold">Sipariş Tarihi:</span>{' '}
                {formatDate(order.order_date)}
              </p>
              <p>
                <span className="font-semibold">Teslim Tarihi:</span>{' '}
                {formatDate(order.delivery_date)}
              </p>
              <p>
                <span className="font-semibold">Durum:</span>{' '}
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusClass(order.status)}`}
                >
                  {order.status}
                </span>
              </p>
              {order.status === 'İptal Edildi' && (
                <>
                  <p className="pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      İptal Tarihi:
                    </span>{' '}
                    {order.cancelledAt ? formatDate(order.cancelledAt) : 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      İptal Nedeni:
                    </span>{' '}
                    {order.cancellationReason
                      ? formatCancellationReason(order.cancellationReason)
                      : 'Belirtilmemiş'}
                  </p>
                  {order.cancellationNotes && (
                    <p>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        İptal Açıklaması:
                      </span>{' '}
                      <span className="italic">{order.cancellationNotes}</span>
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      İptal Eden:
                    </span>{' '}
                    {order.cancelledByEmail || 'N/A'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
          Sipariş Kalemleri
        </h3>

        {/* Desktop: Table View */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Miktar
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Birim Fiyat
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getProductName(item.productId)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                    {item.quantity} {item.unit || 'Kg'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                    {formatCurrency(item.unit_price, order.currency)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                    {formatCurrency(item.quantity * item.unit_price, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-3">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {getProductName(item.productId)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Miktar:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {item.quantity} {item.unit || 'Kg'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600 dark:text-gray-400">Birim Fiyat:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.unit_price, order.currency)}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">Toplam:</span>
                  <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(item.quantity * item.unit_price, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Ara Toplam:</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>KDV (%{order.vatRate}):</span>
              <span>{formatCurrency(order.vatAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Genel Toplam:</span>
              <span>{formatCurrency(order.total_amount, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment Plan Card REMOVED */}

        {/* Shipment History Card */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
            🚛 Sevkiyat Geçmişi
          </h3>
          {relatedShipments.length > 0 ? (
            <div className="space-y-3">
              {relatedShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-900 dark:text-purple-100">
                          {formatDate(shipment.shipment_date)}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            shipment.status === 'Teslim Edildi'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {shipment.status}
                        </span>
                        {shipment.isInvoiced && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            🧾 Faturalı
                          </span>
                        )}
                      </div>
                      {shipment.items && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <ul className="list-disc list-inside">
                            {shipment.items.map((item, idx) => (
                              <li key={idx}>
                                {item.quantity} {item.unit} - {getProductName(item.productId)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {shipment.tracking_number && (
                        <p className="text-xs text-gray-500 mt-1">
                          Takip No: {shipment.tracking_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Teslim Tarihi</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {shipment.delivery_date ? formatDate(shipment.delivery_date) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
              <p className="text-gray-600 dark:text-gray-400">📦 Henüz sevkiyat yapılmamış.</p>
            </div>
          )}
        </div>

        {/* Related Payments Card REMOVED */}

        {/* Return History Card */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
            ↩️ İade Geçmişi
          </h3>
          {relatedReturns.length > 0 ? (
            <div className="space-y-3">
              {relatedReturns.map((returnInv) => (
                <div
                  key={returnInv.id}
                  className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-900 dark:text-red-100">
                          {formatDate(returnInv.invoiceDate)}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-800">
                          {returnInv.status}
                        </span>
                        {returnInv.invoiceNumber && (
                          <span className="text-xs text-gray-500">
                            Fatura No: {returnInv.invoiceNumber}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <ul className="list-disc list-inside">
                          {returnInv.items.map((item, idx) => (
                            <li key={idx}>
                              {item.quantity} {item.unit} - {item.productName}{' '}
                              <span className="text-xs italic">({item.condition})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Toplam İade Tutarı</p>
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(returnInv.totalAmount, order.currency)}
                      </p>
                    </div>
                  </div>
                  {returnInv.notes && (
                    <p className="mt-2 text-xs text-gray-500 italic">Not: {returnInv.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-500">Bu sipariş için henüz iade kaydı yok.</p>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Notlar</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {order.notes}
            </p>
          </div>
        )}
      </div>
    );
  }
);

OrderDetail.displayName = 'OrderDetail';

export default OrderDetail;
