import React, { useMemo, memo, useState } from 'react';
import { UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon, WhatsAppIcon, BellIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import OverdueActions from '../dashboard/OverdueActions';
import Modal from '../common/Modal';
import MobileStat from '../common/MobileStat';
import MobileListItem from '../common/MobileListItem';
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

            {/* Mobile-optimized stats grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-8">
                <MobileStat
                    label="Toplam Müşteri"
                    value={customers.filter(c => !c.isDeleted).length}
                    icon={<UsersIcon className="w-6 h-6" />}
                    color="blue"
                    onClick={() => setActivePage('Müşteriler')}
                />
                <MobileStat
                    label="Açık Siparişler"
                    value={openOrders.length}
                    icon={<ClipboardListIcon className="w-6 h-6" />}
                    color="yellow"
                    onClick={() => setActivePage('Siparişler')}
                />
                <MobileStat
                    label="Bekleyen Teklifler"
                    value={teklifler.filter(t => !t.isDeleted && t.status !== 'Onaylandı').length}
                    icon={<DocumentTextIcon className="w-6 h-6" />}
                    color="indigo"
                    onClick={() => setActivePage('Teklifler')}
                />
                <MobileStat
                    label="Planlanan Eylemler"
                    value={upcomingActions.length}
                    icon={<CalendarIcon className="w-6 h-6" />}
                    color="green"
                    onClick={() => setActivePage('Görüşmeler')}
                />
                <MobileStat
                    label="Gecikmiş Eylemler"
                    value={overdueItems.length}
                    icon={<BellIcon className="w-6 h-6" />}
                    color="red"
                    onClick={() => setIsOverdueModalOpen(true)}
                />
            </div>

            <Modal
                show={isOverdueModalOpen}
                onClose={() => setIsOverdueModalOpen(false)}
                title="Gecikmiş Eylemler"
                maxWidth="max-w-4xl"
            >
                <OverdueActions overdueItems={overdueItems} setActivePage={setActivePage} onMeetingUpdate={onMeetingSave} />
            </Modal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">Yaklaşan Eylemler & Görüşmeler</h3>
                    <div className="space-y-2 md:space-y-3">
                        {upcomingActions.length > 0 ? (
                            upcomingActions.map(gorusme => {
                                const customer = customers.find(c => c.id === gorusme.customerId && !c.isDeleted);
                                return (
                                    <MobileListItem
                                        key={gorusme.id}
                                        title={customer?.name || 'Bilinmeyen Müşteri'}
                                        subtitle={gorusme.next_action_notes}
                                        rightContent={
                                            <span className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                {formatDate(gorusme.next_action_date)}
                                            </span>
                                        }
                                        bottomContent={
                                            customer?.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <span>{customer.phone}</span>
                                                    <a
                                                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.phone)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                                        title="WhatsApp ile mesaj gönder"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <WhatsAppIcon className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            )
                                        }
                                    />
                                );
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Yaklaşan bir eylem bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">Son Bekleyen Siparişler</h3>
                    <div className="space-y-2 md:space-y-3">
                        {openOrders.length > 0 ? (
                            openOrders.slice(0, 5).map(order => {
                                const customer = customers.find(c => c.id === order.customerId && !c.isDeleted);
                                return (
                                    <MobileListItem
                                        key={order.id}
                                        title={customer?.name || 'Bilinmeyen Müşteri'}
                                        subtitle={`${formatDate(order.order_date)} - ${formatCurrency(order.total_amount)}`}
                                        rightContent={
                                            <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(order.status)}`}>
                                                {order.status}
                                            </span>
                                        }
                                    />
                                );
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Bekleyen sipariş bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">En Çok Satılan Ürünler</h3>
                    <div className="space-y-2 md:space-y-3">
                        {bestSellingProducts.length > 0 ? (
                            bestSellingProducts.map(product => (
                                <MobileListItem
                                    key={product.id}
                                    title={product.name}
                                    subtitle={`${product.quantity} Kg satıldı`}
                                    rightContent={
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(product.revenue)}
                                        </span>
                                    }
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Henüz satış bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">Yaklaşan Teslimatlar</h3>
                    <div className="space-y-2 md:space-y-3">
                        {upcomingDeliveries.length > 0 ? (
                            upcomingDeliveries.map(order => {
                                const customer = customers.find(c => c.id === order.customerId && !c.isDeleted);
                                const daysUntilDelivery = Math.ceil(
                                    (new Date(order.delivery_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                );
                                const urgencyText = daysUntilDelivery === 0 ? 'Bugün' : daysUntilDelivery === 1 ? 'Yarın' : `${daysUntilDelivery} gün sonra`;
                                return (
                                    <MobileListItem
                                        key={order.id}
                                        title={customer?.name || 'Bilinmeyen Müşteri'}
                                        subtitle={`${formatCurrency(order.total_amount)} - ${urgencyText}`}
                                        rightContent={
                                            <span className="text-xs md:text-sm font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                                {formatDate(order.delivery_date)}
                                            </span>
                                        }
                                    />
                                );
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Yaklaşan teslimat bulunmuyor.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
