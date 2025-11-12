import React, { memo } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { Order, Customer, Product } from '../../types';

interface OrderDetailProps {
    /** Order data to display */
    order: Order | null;
    /** Customer associated with the order */
    customer?: Customer | null;
    /** List of products for lookup */
    products: Product[];
}

/**
 * OrderDetail component - Displays detailed information about an order
 */
const OrderDetail = memo<OrderDetailProps>(({ order, customer, products }) => {
    if (!order) return null;

    const getProductName = (productId: string): string => {
        const product = products.find(p => p.id === productId);
        return product?.name || 'Bilinmeyen Ürün';
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Müşteri Bilgileri</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p><span className="font-semibold">Adı:</span> {customer?.name || 'N/A'}</p>
                        <p><span className="font-semibold">Email:</span> {customer?.email || 'N/A'}</p>
                        <p><span className="font-semibold">Telefon:</span> {customer?.phone || 'N/A'}</p>
                        <p><span className="font-semibold">Adres:</span> {`${customer?.address || ''}, ${customer?.city || ''}`}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Sipariş Bilgileri</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p><span className="font-semibold">Sipariş No:</span> #{order.id.substring(0, 8)}</p>
                        <p><span className="font-semibold">Sipariş Tarihi:</span> {formatDate(order.order_date)}</p>
                        <p><span className="font-semibold">Teslim Tarihi:</span> {formatDate(order.delivery_date)}</p>
                        <p><span className="font-semibold">Durum:</span> <span className="font-bold">{order.status}</span></p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Sipariş Kalemleri</h3>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ürün</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Miktar</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Birim Fiyat</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Toplam</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {order.items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{getProductName(item.productId)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{item.quantity} {item.unit || 'Kg'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{formatCurrency(item.unit_price, order.currency)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">{formatCurrency(item.quantity * item.unit_price, order.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-3">
                {order.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{getProductName(item.productId)}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Miktar:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{item.quantity} {item.unit || 'Kg'}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-600 dark:text-gray-400">Birim Fiyat:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.unit_price, order.currency)}</span>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">Toplam:</span>
                                <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(item.quantity * item.unit_price, order.currency)}</span>
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

            {order.notes && (
                <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Notlar</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">{order.notes}</p>
                </div>
            )}
        </div>
    );
});

OrderDetail.displayName = 'OrderDetail';

export default OrderDetail;
