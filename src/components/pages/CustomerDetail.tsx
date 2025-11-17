import React, { useMemo, useState, memo, useCallback } from 'react';
import Modal from '../common/Modal';
import QuoteForm from '../forms/QuoteForm';
import OrderForm from '../forms/OrderForm';
import MeetingForm from '../forms/MeetingForm';
import { WhatsAppIcon } from '../icons';
import { formatDate, formatCurrency, formatPhoneNumberForWhatsApp, getStatusClass } from '../../utils/formatters';
import type { Customer, Order, Quote, Meeting, Shipment, Product, Payment } from '../../types';

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
    totalPayments: number;
    totalPaymentAmount: number;
    pendingPayments: number;
}

interface Activity {
    type: 'order' | 'quote' | 'meeting' | 'shipment' | 'payment';
    date: string;
    title: string;
    description: string;
    status: string;
    id: string;
    data: Order | Quote | Meeting | Shipment | Payment;
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
    /** List of all payments */
    payments?: Payment[];
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
    /** Handler for saving a meeting */
    onMeetingSave?: (meeting: Partial<Meeting>) => void;
    /** Handler for saving a customer (for MeetingForm) */
    onCustomerSave?: (customer: Partial<Customer>) => Promise<string | void>;
    /** Handler for saving a product (for MeetingForm) */
    onProductSave?: (product: Partial<Product>) => Promise<string | void>;
    /** Handler for navigating to another page */
    onNavigate?: (page: string) => void;
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
    payments = [],
    onEdit,
    onDelete,
    onCreateQuote,
    onCreateOrder,
    onViewOrder,
    onViewQuote,
    onViewShipment,
    onQuoteSave,
    onOrderSave,
    onMeetingSave,
    onCustomerSave,
    onProductSave,
    onNavigate,
    products,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState<boolean>(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState<boolean>(false);
    const [balanceDetailTab, setBalanceDetailTab] = useState<'orders' | 'payments'>('orders');

    const handleOpenQuoteModal = useCallback(() => setIsQuoteModalOpen(true), []);
    const handleOpenOrderModal = useCallback(() => setIsOrderModalOpen(true), []);
    const handleOpenMeetingModal = useCallback(() => setIsMeetingModalOpen(true), []);

    const handleQuoteSave = useCallback((quoteData: Partial<Quote>) => {
        const finalQuoteData = { ...quoteData, customerId: customer.id };
        onQuoteSave(finalQuoteData);
        setIsQuoteModalOpen(false);
    }, [customer.id, onQuoteSave]);

    const handleOrderSave = useCallback((orderData: Partial<Order>) => {
        const finalOrderData = { ...orderData, customerId: customer.id };
        onOrderSave(finalOrderData);
        setIsOrderModalOpen(false);
    }, [customer.id, onOrderSave]);

    const handleMeetingSave = useCallback((meetingData: Partial<Meeting>) => {
        const finalMeetingData = { ...meetingData, customerId: customer.id };
        if (onMeetingSave) {
            onMeetingSave(finalMeetingData);
        }
        setIsMeetingModalOpen(false);
    }, [customer.id, onMeetingSave]);

    const handleItemClick = useCallback((activity: Activity) => {
        if (activity.type === 'order') {
            onViewOrder && onViewOrder(activity.data as Order);
        } else if (activity.type === 'quote') {
            onViewQuote && onViewQuote(activity.data as Quote);
        } else if (activity.type === 'shipment') {
            onViewShipment && onViewShipment(activity.data as Shipment);
        }
    }, [onViewOrder, onViewQuote, onViewShipment]);

    // Calculate statistics
    const stats = useMemo<Stats>(() => {
        const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
        const customerQuotes = quotes.filter(q => q.customerId === customer.id && !q.isDeleted);
        const customerMeetings = meetings.filter(m => m.customerId === customer.id && !m.isDeleted);
        const customerPayments = payments.filter(p => p.customerId === customer.id && !p.isDeleted);

        const totalOrderAmount = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const totalQuoteAmount = customerQuotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0);
        const completedOrders = customerOrders.filter(o => o.status === 'Tamamlandı').length;
        const pendingQuotes = customerQuotes.filter(q => q.status === 'Bekliyor').length;

        const totalPaymentAmount = customerPayments.reduce((sum, payment) => {
            const amount = payment.amount || 0;
            const inTRY = payment.currency === 'USD' ? amount * 35 :
                         payment.currency === 'EUR' ? amount * 38 :
                         amount;
            return sum + inTRY;
        }, 0);
        const pendingPayments = customerPayments.filter(p => p.status === 'Bekliyor').length;

        return {
            totalOrders: customerOrders.length,
            totalOrderAmount,
            totalQuotes: customerQuotes.length,
            totalQuoteAmount,
            totalMeetings: customerMeetings.length,
            completedOrders,
            pendingQuotes,
            totalPayments: customerPayments.length,
            totalPaymentAmount,
            pendingPayments
        };
    }, [customer.id, orders, quotes, meetings, payments]);

    // Calculate balance (simple: total payments - total orders)
    const balance = useMemo(() => {
        const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
        const customerPayments = payments.filter(p => p.customerId === customer.id && !p.isDeleted && p.status === 'Tahsil Edildi');

        const totalOrders = customerOrders.reduce((sum, order) => {
            const amount = order.total_amount || 0;
            // Convert to TRY if needed
            const inTRY = order.currency === 'USD' ? amount * 35 :
                         order.currency === 'EUR' ? amount * 38 :
                         amount;
            return sum + inTRY;
        }, 0);

        const totalPayments = customerPayments.reduce((sum, payment) => {
            const amount = payment.amount || 0;
            // Convert to TRY if needed
            const inTRY = payment.currency === 'USD' ? amount * 35 :
                         payment.currency === 'EUR' ? amount * 38 :
                         amount;
            return sum + inTRY;
        }, 0);

        const balanceAmount = totalPayments - totalOrders;

        // Determine status
        let status = '';
        let color = '';
        let icon = '';

        if (Math.abs(balanceAmount) < 100) {
            status = 'Hesap Dengede';
            color = 'border-gray-300 dark:border-gray-600';
            icon = '⚖️';
        } else if (balanceAmount > 0) {
            status = 'Alacak Var';
            color = 'border-green-300 dark:border-green-600';
            icon = '💰';
        } else {
            status = 'Borç Var';
            color = 'border-red-300 dark:border-red-600';
            icon = '⚠️';
        }

        return {
            totalOrders,
            totalPayments,
            balance: balanceAmount,
            status,
            color,
            icon
        };
    }, [customer.id, orders, payments]);

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

        // Add payments
        payments
            .filter(p => p.customerId === customer.id && !p.isDeleted)
            .forEach(payment => {
                const amount = payment.amount || 0;
                const currency = payment.currency || 'TRY';
                const inTRY = currency === 'USD' ? amount * 35 :
                             currency === 'EUR' ? amount * 38 :
                             amount;

                activities.push({
                    type: 'payment',
                    date: payment.paidDate || payment.dueDate || '',
                    title: payment.status === 'Tahsil Edildi' ? 'Ödeme Tahsil Edildi' : 'Ödeme Planlandı',
                    description: `${formatCurrency(inTRY)} ${payment.paymentMethod ? `- ${payment.paymentMethod}` : ''}`,
                    status: payment.status,
                    id: payment.id,
                    data: payment
                });
            });

        // Sort by date descending
        return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customer.id, orders, quotes, meetings, shipments, payments]);

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
            case 'payment':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            case 'payment':
                return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
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
                        {customer.city && (
                            <p><span className="font-semibold">Şehir:</span> {customer.city}</p>
                        )}
                        {customer.taxOffice && (
                            <p><span className="font-semibold">Vergi Dairesi:</span> {customer.taxOffice}</p>
                        )}
                        {customer.taxNumber && (
                            <p><span className="font-semibold">Vergi No:</span> {customer.taxNumber}</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={handleOpenMeetingModal}
                        className="px-3 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Yeni</span> Görüşme
                    </button>
                    <button
                        onClick={handleOpenQuoteModal}
                        className="px-3 py-2.5 min-h-[44px] bg-purple-500 text-white rounded-lg hover:bg-purple-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Yeni</span> Teklif
                    </button>
                    <button
                        onClick={handleOpenOrderModal}
                        className="px-3 py-2.5 min-h-[44px] bg-green-500 text-white rounded-lg hover:bg-green-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Yeni</span> Sipariş
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-3 py-2.5 min-h-[44px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-transform text-sm"
                    >
                        Düzenle
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-3 py-2.5 min-h-[44px] bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-[0.98] transition-transform text-sm"
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

            <Modal show={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} title="Yeni Görüşme Kaydı" maxWidth="max-w-4xl">
                <MeetingForm
                    meeting={{ customerId: customer.id } as Partial<Meeting>}
                    onSave={handleMeetingSave}
                    onCancel={() => setIsMeetingModalOpen(false)}
                    customers={[customer]}
                    products={products}
                    onCustomerSave={onCustomerSave || (async () => {})}
                    onProductSave={onProductSave || (async () => {})}
                />
            </Modal>

            {/* Balance Detail Modal */}
            <Modal
                show={isBalanceModalOpen}
                onClose={() => setIsBalanceModalOpen(false)}
                title={`Cari Hesap - ${customer.name}`}
                maxWidth="max-w-5xl"
            >
                <div className="space-y-6">
                    {/* Balance Summary */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Sipariş</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {formatCurrency(balance.totalOrders, 'TRY')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Tahsilat</div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {formatCurrency(balance.totalPayments, 'TRY')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Bakiye</div>
                                <div className={`text-2xl font-bold mt-1 ${
                                    balance.balance > 0 ? 'text-green-600 dark:text-green-400' :
                                    balance.balance < 0 ? 'text-red-600 dark:text-red-400' :
                                    'text-gray-600 dark:text-gray-400'
                                }`}>
                                    {formatCurrency(balance.balance, 'TRY')}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{balance.status}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setBalanceDetailTab('orders')}
                            className={`px-4 py-2 font-medium text-sm ${
                                balanceDetailTab === 'orders'
                                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Siparişler ({stats.totalOrders})
                        </button>
                        <button
                            onClick={() => setBalanceDetailTab('payments')}
                            className={`px-4 py-2 font-medium text-sm ${
                                balanceDetailTab === 'payments'
                                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Ödemeler ({stats.totalPayments})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {balanceDetailTab === 'orders' ? (
                            <div className="space-y-2">
                                {orders.filter(o => o.customerId === customer.id && !o.isDeleted).length > 0 ? (
                                    orders.filter(o => o.customerId === customer.id && !o.isDeleted).map(order => (
                                        <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    Sipariş #{order.orderNumber || order.id.slice(0, 8)}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(order.order_date)} • {order.status}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(order.total_amount)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.currency || 'TRY'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sipariş bulunmuyor</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {payments.filter(p => p.customerId === customer.id && !p.isDeleted).length > 0 ? (
                                    payments.filter(p => p.customerId === customer.id && !p.isDeleted).map(payment => (
                                        <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {payment.paymentMethod || 'Ödeme'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(payment.paidDate || payment.dueDate)} • {payment.status}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {payment.currency || 'TRY'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Ödeme bulunmuyor</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Statistics Cards - Compact Version */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {/* Sipariş */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sipariş</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.totalOrders}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{formatCurrency(stats.totalOrderAmount)}</div>
                    </div>

                    {/* Teklif */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Teklif</div>
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.totalQuotes}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{formatCurrency(stats.totalQuoteAmount)}</div>
                    </div>

                    {/* Tamamlanan */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tamamlanan</div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completedOrders}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">sipariş</div>
                    </div>

                    {/* Görüşme */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Görüşme</div>
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.totalMeetings}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">kayıt</div>
                    </div>

                    {/* Bakiye */}
                    <div
                        className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => setIsBalanceModalOpen(true)}
                        role="button"
                        tabIndex={0}
                        title="Bakiye detaylarını göster"
                    >
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                            Bakiye {balance.icon}
                        </div>
                        <div className={`text-xl font-bold ${
                            balance.balance > 0 ? 'text-green-600 dark:text-green-400' :
                            balance.balance < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                        }`}>
                            {formatCurrency(balance.balance, 'TRY')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{balance.status}</div>
                    </div>

                    {/* Tahsilat */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tahsilat</div>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalPayments}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{formatCurrency(stats.totalPaymentAmount)}</div>
                    </div>

                    {/* Bekleyen */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bekleyen</div>
                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingPayments}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">ödeme</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <nav className="-mb-px flex gap-4 md:gap-6 min-w-min">
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
                    <>
                        {/* Desktop: Table View */}
                        <div className="hidden md:block overflow-x-auto">
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

                        {/* Mobile: Card View */}
                        <div className="md:hidden space-y-3">
                            {orders
                                .filter(o => o.customerId === customer.id && !o.isDeleted)
                                .map(order => (
                                    <div
                                        key={order.id}
                                        onClick={() => onViewOrder && onViewOrder(order)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.order_date)}</div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total_amount)}</div>
                                    </div>
                                ))}
                            {orders.filter(o => o.customerId === customer.id && !o.isDeleted).length === 0 && (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    Henüz sipariş bulunmuyor
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'quotes' && (
                    <>
                        {/* Desktop: Table View */}
                        <div className="hidden md:block overflow-x-auto">
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

                        {/* Mobile: Card View */}
                        <div className="md:hidden space-y-3">
                            {quotes
                                .filter(q => q.customerId === customer.id && !q.isDeleted)
                                .map(quote => (
                                    <div
                                        key={quote.id}
                                        onClick={() => onViewQuote && onViewQuote(quote)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(quote.teklif_tarihi)}</div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(quote.status)}`}>
                                                {quote.status}
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(quote.total_amount)}</div>
                                    </div>
                                ))}
                            {quotes.filter(q => q.customerId === customer.id && !q.isDeleted).length === 0 && (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    Henüz teklif bulunmuyor
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'top-products' && (
                    <>
                        {/* Desktop: Table View */}
                        <div className="hidden md:block overflow-x-auto">
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

                        {/* Mobile: Card View */}
                        <div className="md:hidden space-y-3">
                            {topProducts.length > 0 ? (
                                topProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{product.name}</div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Miktar:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{product.quantity} adet</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Sipariş:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{product.orderCount}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-600 dark:text-gray-400">Gelir:</span>
                                                <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.revenue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    Bu müşteriye ait ürün satışı bulunmuyor.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

CustomerDetail.displayName = 'CustomerDetail';

export default CustomerDetail;
