import React, { useMemo, memo, useState } from 'react';
import { UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon, WhatsAppIcon, BellIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import OverdueActions from '../dashboard/OverdueActions';
import Modal from '../common/Modal';
import type { Customer, Order, Quote, Meeting, Product } from '../../types';

interface BestSellingProduct {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
}

interface DashboardProps {
    /** List of customers */
    customers: Customer[];
    /** List of orders */
    orders: Order[];
    /** List of quotes (teklifler) */
    teklifler: Quote[];
    /** List of meetings (gorusmeler) */
    gorusmeler: Meeting[];
    /** List of products */
    products: Product[];
    /** List of overdue items */
    overdueItems: Meeting[];
    /** Callback to set active page */
    setActivePage: (page: string) => void;
    /** Callback when meeting is saved */
    onMeetingSave: (meeting: Partial<Meeting>) => void;
}

/**
 * Dashboard component - Main dashboard page with statistics and widgets
 */
const Dashboard = memo<DashboardProps>(({ customers, orders, teklifler, gorusmeler, products, overdueItems, setActivePage, onMeetingSave }) => {
    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const openOrders = orders.filter(o => !o.isDeleted && ['Bekliyor', 'Hazırlanıyor'].includes(o.status));
    const today = new Date().toISOString().slice(0, 10);
    const upcomingActions = gorusmeler
        .filter(g => !g.isDeleted && g.next_action_date && g.next_action_date >= today)
        .sort((a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime())
        .slice(0, 5);

    // Calculate best selling products
    const bestSellingProducts = useMemo<BestSellingProduct[]>(() => {
        const productSales: Record<string, { quantity: number; revenue: number }> = {};

        orders.filter(o => !o.isDeleted).forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.productId;
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[productId].quantity += item.quantity || 0;
                    productSales[productId].revenue += (item.quantity || 0) * (item.unit_price || 0);
                });
            }
        });

        return Object.entries(productSales)
            .map(([productId, stats]) => {
                const product = products.find(p => p.id === productId && !p.isDeleted);
                return {
                    id: productId,
                    name: product?.name || 'Bilinmeyen Ürün',
                    quantity: stats.quantity,
                    revenue: stats.revenue
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [orders, products]);

    // Calculate upcoming deliveries
    const upcomingDeliveries = useMemo(() => {
        const today = new Date();
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        return orders
            .filter(order => {
                if (order.isDeleted || !order.delivery_date) return false;
                const deliveryDate = new Date(order.delivery_date);
                return deliveryDate >= today && deliveryDate <= next7Days && order.status !== 'Tamamlandı';
            })
            .sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime())
            .slice(0, 5);
    }, [orders]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hoş Geldiniz!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">İşletmenizin genel durumuna buradan göz atabilirsiniz.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <button onClick={() => setActivePage('Müşteriler')} className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Toplam Müşteri</h3>
                        <p className="text-3xl font-bold text-blue-600">{customers.filter(c => !c.isDeleted).length}</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </button>
                <button onClick={() => setActivePage('Siparişler')} className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Açık Siparişler</h3>
                        <p className="text-3xl font-bold text-yellow-600">{openOrders.length}</p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                        <ClipboardListIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                </button>
                <button onClick={() => setActivePage('Teklifler')} className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Bekleyen Teklifler</h3>
                        <p className="text-3xl font-bold text-indigo-600">
                            {teklifler.filter(t => !t.isDeleted && t.status !== 'Onaylandı').length}
                        </p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                        <DocumentTextIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </button>
                <button onClick={() => setActivePage('Görüşmeler')} className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Planlanan Eylemler</h3>
                        <p className="text-3xl font-bold text-green-600">{upcomingActions.length}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                        <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </button>
                <div
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setIsOverdueModalOpen(true)}
                >
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Gecikmiş Eylemler</h3>
                        <p className="text-3xl font-bold text-red-600">{overdueItems.length}</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                        <BellIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>
            </div>

            <Modal
                show={isOverdueModalOpen}
                onClose={() => setIsOverdueModalOpen(false)}
                title="Gecikmiş Eylemler"
                maxWidth="max-w-4xl"
            >
                <OverdueActions overdueItems={overdueItems} setActivePage={setActivePage} onMeetingUpdate={onMeetingSave} />
            </Modal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Yaklaşan Eylemler & Görüşmeler</h3>
                    <div className="space-y-3">
                        {upcomingActions.length > 0 ? (
                            upcomingActions.map(gorusme => {
                                const customer = customers.find(c => c.id === gorusme.customerId && !c.isDeleted);
                                return (
                                    <div
                                        key={gorusme.id}
                                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                                {customer?.name || 'Bilinmeyen Müşteri'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {customer?.phone || 'Telefon yok'}
                                                </p>
                                                {customer?.phone && (
                                                    <a
                                                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.phone)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                                        title="WhatsApp ile mesaj gönder"
                                                    >
                                                        <WhatsAppIcon className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{gorusme.next_action_notes}</p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-4 flex-shrink-0">
                                            {formatDate(gorusme.next_action_date)}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Yaklaşan bir eylem bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Son Bekleyen Siparişler</h3>
                    <div className="space-y-3">
                        {openOrders.length > 0 ? (
                            openOrders.slice(0, 5).map(order => {
                                const customer = customers.find(c => c.id === order.customerId && !c.isDeleted);
                                return (
                                    <div
                                        key={order.id}
                                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                                {customer?.name || 'Bilinmeyen Müşteri'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(order.order_date)} - {formatCurrency(order.total_amount)}
                                            </p>
                                        </div>
                                        <span
                                            className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(order.status)}`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Bekleyen sipariş bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">En Çok Satılan Ürünler</h3>
                    <div className="space-y-3">
                        {bestSellingProducts.length > 0 ? (
                            bestSellingProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">
                                            {product.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {product.quantity} Kg satıldı
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-4">
                                        {formatCurrency(product.revenue)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Henüz satış bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Yaklaşan Teslimatlar</h3>
                    <div className="space-y-3">
                        {upcomingDeliveries.length > 0 ? (
                            upcomingDeliveries.map(order => {
                                const customer = customers.find(c => c.id === order.customerId && !c.isDeleted);
                                const daysUntilDelivery = Math.ceil(
                                    (new Date(order.delivery_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                );
                                return (
                                    <div
                                        key={order.id}
                                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                                {customer?.name || 'Bilinmeyen Müşteri'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {formatCurrency(order.total_amount)} -
                                                {daysUntilDelivery === 0 && ' Bugün'}
                                                {daysUntilDelivery === 1 && ' Yarın'}
                                                {daysUntilDelivery > 1 && ` ${daysUntilDelivery} gün sonra`}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400 ml-4 flex-shrink-0">
                                            {formatDate(order.delivery_date)}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Yaklaşan teslimat bulunmuyor.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
