import React, { useMemo, useState, memo } from 'react';
import Modal from '../common/Modal';
import QuoteForm from '../forms/QuoteForm';
import OrderForm from '../forms/OrderForm';
import { WhatsAppIcon } from '../icons';
import { formatDate, formatCurrency, formatPhoneNumberForWhatsApp, getStatusClass } from '../../utils/formatters';
import type { Customer, Order, Quote, Meeting, Shipment, Product } from '../../types';

interface ProductStats {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    orderCount: number;
}

interface Stats {
    totalOrders: number;
    totalOrderAmount: number;
    totalQuotes: number;
    totalQuoteAmount: number;
    totalMeetings: number;
    completedOrders: number;
    pendingQuotes: number;
}

interface Activity {
    type: 'order' | 'quote' | 'meeting' | 'shipment';
    date: string;
    title: string;
    description: string;
    status: string;
    id: string;
    data: Order | Quote | Meeting | Shipment;
}

type TabId = 'overview' | 'timeline' | 'orders' | 'quotes' | 'top-products';

interface CustomerDetailProps {
    /** Customer to display */
    customer: Customer;
    /** List of all orders */
    orders?: Order[];
    /** List of all quotes */
    quotes?: Quote[];
    /** List of all meetings */
    meetings?: Meeting[];
    /** List of all shipments */
    shipments?: Shipment[];
    /** Handler for editing customer */
    onEdit: () => void;
    /** Handler for deleting customer */
    onDelete: () => void;
    /** Handler for creating a quote */
    onCreateQuote?: () => void;
    /** Handler for creating an order */
    onCreateOrder?: () => void;
    /** Handler for viewing an order */
    onViewOrder?: (order: Order) => void;
    /** Handler for viewing a quote */
    onViewQuote?: (quote: Quote) => void;
    /** Handler for viewing a shipment */
    onViewShipment?: (shipment: Shipment) => void;
    /** Handler for saving a quote */
    onQuoteSave: (quote: Partial<Quote>) => void;
    /** Handler for saving an order */
    onOrderSave: (order: Partial<Order>) => void;
    /** List of products for forms */
    products: Product[];
}

/**
 * CustomerDetail component - Displays detailed information about a customer
 * including orders, quotes, meetings, and statistics
 */
const CustomerDetail = memo<CustomerDetailProps>(({
    customer,
    orders = [],
    quotes = [],
    meetings = [],
    shipments = [],
    onEdit,
    onDelete,
    onCreateQuote,
    onCreateOrder,
    onViewOrder,
    onViewQuote,
    onViewShipment,
    onQuoteSave,
    onOrderSave,
    products,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

    const handleOpenQuoteModal = () => setIsQuoteModalOpen(true);
    const handleOpenOrderModal = () => setIsOrderModalOpen(true);

    const handleQuoteSave = (quoteData: Partial<Quote>) => {
        const finalQuoteData = { ...quoteData, customerId: customer.id };
        onQuoteSave(finalQuoteData);
        setIsQuoteModalOpen(false);
    };

    const handleOrderSave = (orderData: Partial<Order>) => {
        const finalOrderData = { ...orderData, customerId: customer.id };
        onOrderSave(finalOrderData);
        setIsOrderModalOpen(false);
    };

    const handleItemClick = (activity: Activity) => {
        if (activity.type === 'order') {
            onViewOrder && onViewOrder(activity.data as Order);
        } else if (activity.type === 'quote') {
            onViewQuote && onViewQuote(activity.data as Quote);
        } else if (activity.type === 'shipment') {
            onViewShipment && onViewShipment(activity.data as Shipment);
        }
    };

    // Calculate statistics
    const stats = useMemo<Stats>(() => {
        const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
        const customerQuotes = quotes.filter(q => q.customerId === customer.id && !q.isDeleted);
        const customerMeetings = meetings.filter(m => m.customerId === customer.id && !m.isDeleted);

        const totalOrderAmount = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const totalQuoteAmount = customerQuotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0);
        const completedOrders = customerOrders.filter(o => o.status === 'Tamamlandı').length;
        const pendingQuotes = customerQuotes.filter(q => q.status === 'Bekliyor').length;

        return {
            totalOrders: customerOrders.length,
            totalOrderAmount,
            totalQuotes: customerQuotes.length,
            totalQuoteAmount,
            totalMeetings: customerMeetings.length,
            completedOrders,
            pendingQuotes
        };
    }, [customer.id, orders, quotes, meetings]);

    // Calculate top products for this customer
    const topProducts = useMemo<ProductStats[]>(() => {
        const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
        const productStats: Record<string, { quantity: number; revenue: number; orderCount: number }> = {};

        customerOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.productId;
                    if (!productStats[productId]) {
                        productStats[productId] = {
                            quantity: 0,
                            revenue: 0,
                            orderCount: 0
                        };
                    }
                    productStats[productId].quantity += item.quantity || 0;
                    productStats[productId].revenue += (item.quantity || 0) * (item.unit_price || 0);
                    productStats[productId].orderCount += 1;
                });
            }
        });

        return Object.entries(productStats)
            .map(([productId, stats]) => {
                const product = products?.find(p => p.id === productId && !p.isDeleted);
                return {
                    id: productId,
                    name: product?.name || 'Bilinmeyen Ürün',
                    quantity: stats.quantity,
                    revenue: stats.revenue,
                    orderCount: stats.orderCount
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [customer.id, orders, products]);

    // Create timeline of all activities
    const timeline = useMemo<Activity[]>(() => {
        const activities: Activity[] = [];

        // Add orders
        orders
            .filter(o => o.customerId === customer.id && !o.isDeleted)
            .forEach(order => {
                activities.push({
                    type: 'order',
                    date: order.order_date,
                    title: 'Sipariş',
                    description: `${formatCurrency(order.total_amount)} tutarında sipariş`,
                    status: order.status,
                    id: order.id,
                    data: order
                });
            });

        // Add quotes
        quotes
            .filter(q => q.customerId === customer.id && !q.isDeleted)
            .forEach(quote => {
                activities.push({
                    type: 'quote',
                    date: quote.teklif_tarihi,
                    title: 'Teklif',
                    description: `${formatCurrency(quote.total_amount)} tutarında teklif`,
                    status: quote.status,
                    id: quote.id,
                    data: quote
                });
            });

        // Add meetings
        meetings
            .filter(m => m.customerId === customer.id && !m.isDeleted)
            .forEach(meeting => {
                activities.push({
                    type: 'meeting',
                    date: meeting.meeting_date,
                    title: 'Görüşme',
                    description: meeting.notes || 'Görüşme yapıldı',
                    status: meeting.meeting_type,
                    id: meeting.id,
                    data: meeting
                });
            });

        // Add shipments
        shipments
            .forEach(shipment => {
                const order = orders.find(o => o.id === shipment.orderId);
                if (order && order.customerId === customer.id && !order.isDeleted) {
                    activities.push({
                        type: 'shipment',
                        date: shipment.shipment_date,
                        title: 'Sevkiyat',
                        description: `${shipment.transporter} ile gönderildi`,
                        status: shipment.status,
                        id: shipment.id,
                        data: shipment
                    });
                }
            });

        // Sort by date descending
        return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customer.id, orders, quotes, meetings, shipments]);

    const getActivityIcon = (type: Activity['type']): JSX.Element | null => {
        switch (type) {
            case 'order':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                );
            case 'quote':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'meeting':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'shipment':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getActivityColor = (type: Activity['type']): string => {
        switch (type) {
            case 'order':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
            case 'quote':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
            case 'meeting':
                return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
            case 'shipment':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {customer.name}
                    </h2>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {customer.contact_person && (
                            <p><span className="font-semibold">Yetkili:</span> {customer.contact_person}</p>
                        )}
                        {customer.phone && (
                            <p className="flex items-center gap-2">
                                <span className="font-semibold">Telefon:</span> {customer.phone}
                                <a
                                    href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                    title="WhatsApp ile mesaj gönder"
                                >
                                    <WhatsAppIcon className="w-4 h-4" />
                                </a>
                            </p>
                        )}
                        {customer.email && (
                            <p><span className="font-semibold">E-posta:</span> {customer.email}</p>
                        )}
                        {customer.address && (
                            <p><span className="font-semibold">Adres:</span> {customer.address}</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleOpenQuoteModal}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Teklif
                    </button>
                    <button
                        onClick={handleOpenOrderModal}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Sipariş
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Düzenle
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Sil
                    </button>
                </div>
            </div>

            {/* Modals for Quote and Order Forms */}
            <Modal show={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Yeni Teklif Oluştur" maxWidth="max-w-4xl">
                <QuoteForm
                    quote={{ customerId: customer.id } as Partial<Quote>}
                    onSave={handleQuoteSave}
                    onCancel={() => setIsQuoteModalOpen(false)}
                    customers={[customer]}
                    products={products}
                />
            </Modal>

            <Modal show={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Yeni Sipariş Oluştur" maxWidth="max-w-4xl">
                <OrderForm
                    order={{ customerId: customer.id } as Partial<Order>}
                    onSave={handleOrderSave}
                    onCancel={() => setIsOrderModalOpen(false)}
                    customers={[customer]}
                    products={products}
                />
            </Modal>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Toplam Sipariş</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalOrders}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(stats.totalOrderAmount)}</div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-1">Toplam Teklif</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalQuotes}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{formatCurrency(stats.totalQuoteAmount)}</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">Tamamlanan</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completedOrders}</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">Sipariş</div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-semibold mb-1">Toplam Görüşme</div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.totalMeetings}</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Kayıt</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex gap-6">
                    {[
                        { id: 'overview' as TabId, label: 'Özet' },
                        { id: 'timeline' as TabId, label: 'Aktiviteler' },
                        { id: 'orders' as TabId, label: `Siparişler (${stats.totalOrders})` },
                        { id: 'quotes' as TabId, label: `Teklifler (${stats.totalQuotes})` },
                        { id: 'top-products' as TabId, label: 'Çok Satanlar' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Son Aktiviteler</h3>
                            <div className="space-y-2">
                                {timeline.slice(0, 5).map((activity, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleItemClick(activity)}
                                        className={`flex items-center gap-3 text-sm p-2 rounded-lg transition-colors ${
                                            (activity.type === 'order' || activity.type === 'quote' || activity.type === 'shipment')
                                                ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                                                : ''
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">{activity.title}</div>
                                            <div className="text-gray-600 dark:text-gray-400">{activity.description}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.date)}</div>
                                    </div>
                                ))}
                                {timeline.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Henüz aktivite bulunmuyor</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {timeline.map((activity, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`p-3 rounded-full ${getActivityColor(activity.type)}`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    {index < timeline.length - 1 && (
                                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-8">
                                    <div
                                        onClick={() => handleItemClick(activity)}
                                        className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors ${
                                            (activity.type === 'order' || activity.type === 'quote' || activity.type === 'shipment')
                                                ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{activity.title}</h4>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.date)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{activity.description}</p>
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusClass(activity.status)}`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {timeline.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                Henüz aktivite bulunmuyor
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tarih</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tutar</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {orders
                                    .filter(o => o.customerId === customer.id && !o.isDeleted)
                                    .map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => onViewOrder && onViewOrder(order)}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                        >
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(order.order_date)}</td>
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(order.total_amount)}</td>
                                            <td className="p-3 text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                {orders.filter(o => o.customerId === customer.id && !o.isDeleted).length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Henüz sipariş bulunmuyor
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'quotes' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tarih</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tutar</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {quotes
                                    .filter(q => q.customerId === customer.id && !q.isDeleted)
                                    .map(quote => (
                                        <tr
                                            key={quote.id}
                                            onClick={() => onViewQuote && onViewQuote(quote)}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                        >
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(quote.teklif_tarihi)}</td>
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(quote.total_amount)}</td>
                                            <td className="p-3 text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(quote.status)}`}>
                                                    {quote.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                {quotes.filter(q => q.customerId === customer.id && !q.isDeleted).length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Henüz teklif bulunmuyor
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'top-products' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Ürün Adı</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Miktar</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Gelir</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Sipariş Sayısı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {topProducts.length > 0 ? (
                                    topProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{product.name}</td>
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{product.quantity} adet</td>
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(product.revenue)}</td>
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{product.orderCount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Bu müşteriye ait ürün satışı bulunmuyor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
});

CustomerDetail.displayName = 'CustomerDetail';

export default CustomerDetail;
