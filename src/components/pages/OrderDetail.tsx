import React, { memo } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { Order, Customer, Product, Payment } from '../../types';

interface OrderDetailProps {
    /** Order data to display */
    order: Order | null;
    /** Customer associated with the order */
    customer?: Customer | null;
    /** List of products for lookup */
    products: Product[];
    /** Payment associated with this order */
    payment?: Payment | null;
    /** Callback when marking payment as paid */
    onMarkAsPaid?: (paymentId: string) => void;
    /** Callback to navigate to payment details */
    onGoToPayment?: (paymentId: string) => void;
}

/**
 * OrderDetail component - Displays detailed information about an order
 */
const OrderDetail = memo<OrderDetailProps>(({ order, customer, products, payment, onMarkAsPaid, onGoToPayment }) => {
    if (!order) return null;

    const getProductName = (productId: string): string => {
        const product = products.find(p => p.id === productId);
        return product?.name || 'Bilinmeyen Ürün';
    };

    // Payment status helpers
    const getPaymentStatusColor = (payment: Payment | null | undefined): string => {
        if (!payment) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        if (payment.status === 'Tahsil Edildi') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        if (payment.status === 'İptal') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        if (payment.status === 'Gecikti') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

        // Bekliyor durumu için vade kontrolü
        const today = new Date();
        const due = new Date(payment.dueDate);
        const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'; // Gecikmiş
        if (daysUntilDue <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'; // Yaklaşan
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'; // Normal
    };

    const getPaymentStatusText = (payment: Payment | null | undefined): string => {
        if (!payment) return 'Ödeme Bekleniyor';
        if (payment.status === 'Tahsil Edildi') return '✅ Tahsil Edildi';
        if (payment.status === 'İptal') return '❌ İptal';
        if (payment.status === 'Gecikti') return '⚠️ Gecikti';

        const today = new Date();
        const due = new Date(payment.dueDate);
        const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) return `⚠️ ${Math.abs(daysUntilDue)} gün gecikti`;
        if (daysUntilDue === 0) return '⏰ Bugün vade';
        if (daysUntilDue <= 7) return `⏰ ${daysUntilDue} gün kaldı`;
        return '📅 Bekliyor';
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

            {/* Payment Status Card */}
            <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">💰 Ödeme Durumu</h3>
                {payment ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Vade Tarihi</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatDate(payment.dueDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tutar</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount, payment.currency)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Ödeme Yöntemi</p>
                                <p className="text-base font-medium text-gray-900 dark:text-gray-100">{payment.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Durum</p>
                                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(payment)}`}>
                                    {getPaymentStatusText(payment)}
                                </span>
                            </div>
                        </div>

                        {payment.checkNumber && (
                            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Çek/Senet Bilgisi</p>
                                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                                    {payment.checkNumber} {payment.checkBank && `- ${payment.checkBank}`}
                                </p>
                            </div>
                        )}

                        {payment.notes && (
                            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Not</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{payment.notes}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-blue-200 dark:border-blue-700">
                            {payment.status !== 'Tahsil Edildi' && payment.status !== 'İptal' && onMarkAsPaid && (
                                <button
                                    onClick={() => onMarkAsPaid(payment.id)}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 active:scale-[0.98] transition-all font-medium"
                                >
                                    ✅ Tahsil Edildi İşaretle
                                </button>
                            )}
                            {onGoToPayment && (
                                <button
                                    onClick={() => onGoToPayment(payment.id)}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-[0.98] transition-all font-medium"
                                >
                                    📄 Ödeme Detayına Git
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Bu sipariş için henüz ödeme kaydı oluşturulmamış.
                        </p>
                    </div>
                )}
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
