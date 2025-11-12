import React, { useMemo, memo, useState } from 'react';
import { UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon, WhatsAppIcon, BellIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import OverdueActions from '../dashboard/OverdueActions';
import Modal from '../common/Modal';
import MobileStat from '../common/MobileStat';
import MobileListItem from '../common/MobileListItem';
import SkeletonStat from '../common/SkeletonStat';
import SkeletonList from '../common/SkeletonList';
import type { Customer, Order, Quote, Meeting, Product } from '../../types';

interface BestSellingProduct {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    customers: Array<{
        customerId: string;
        customerName: string;
        quantity: number;
        revenue: number;
    }>;
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
    /** Loading state */
    loading?: boolean;
}

/**
 * Dashboard component - Main dashboard page with statistics and widgets
 */
const Dashboard = memo<DashboardProps>(({ customers, orders, teklifler, gorusmeler, products, overdueItems, setActivePage, onMeetingSave, loading = false }) => {
    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<BestSellingProduct | null>(null);
    const openOrders = orders.filter(o => !o.isDeleted && ['Bekliyor', 'Hazırlanıyor'].includes(o.status));
    const today = new Date().toISOString().slice(0, 10);
    const upcomingActions = gorusmeler
        .filter(g => !g.isDeleted && g.next_action_date && g.next_action_date >= today)
        .sort((a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime())
        .slice(0, 5);

    // Calculate best selling products with customer details
    const bestSellingProducts = useMemo<BestSellingProduct[]>(() => {
        const productSales: Record<string, {
            quantity: number;
            revenue: number;
            customerData: Record<string, { quantity: number; revenue: number }>
        }> = {};

        orders.filter(o => !o.isDeleted).forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.productId;
                    const customerId = order.customerId;

                    if (!productSales[productId]) {
                        productSales[productId] = {
                            quantity: 0,
                            revenue: 0,
                            customerData: {}
                        };
                    }

                    if (!productSales[productId].customerData[customerId]) {
                        productSales[productId].customerData[customerId] = {
                            quantity: 0,
                            revenue: 0
                        };
                    }

                    const itemQuantity = item.quantity || 0;
                    const itemRevenue = itemQuantity * (item.unit_price || 0);

                    productSales[productId].quantity += itemQuantity;
                    productSales[productId].revenue += itemRevenue;
                    productSales[productId].customerData[customerId].quantity += itemQuantity;
                    productSales[productId].customerData[customerId].revenue += itemRevenue;
                });
            }
        });

        return Object.entries(productSales)
            .map(([productId, stats]) => {
                const product = products.find(p => p.id === productId && !p.isDeleted);

                // Convert customer data to array and sort by quantity
                const customersList = Object.entries(stats.customerData)
                    .map(([customerId, customerStats]) => {
                        const customer = customers.find(c => c.id === customerId && !c.isDeleted);
                        return {
                            customerId,
                            customerName: customer?.name || 'Bilinmeyen Müşteri',
                            quantity: customerStats.quantity,
                            revenue: customerStats.revenue
                        };
                    })
                    .sort((a, b) => b.quantity - a.quantity);

                return {
                    id: productId,
                    name: product?.name || 'Bilinmeyen Ürün',
                    quantity: stats.quantity,
                    revenue: stats.revenue,
                    customers: customersList
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [orders, products, customers]);

    // Calculate most inquired products from meetings
    const mostInquiredProducts = useMemo(() => {
        const productInquiries: Record<string, {
            count: number;
            totalQuantity: number;
            meetingsCount: number;
            lastInquiryDate: string;
        }> = {};

        gorusmeler
            .filter(m => !m.isDeleted && m.inquiredProducts && m.inquiredProducts.length > 0)
            .forEach(meeting => {
                meeting.inquiredProducts?.forEach(ip => {
                    if (!productInquiries[ip.productId]) {
                        productInquiries[ip.productId] = {
                            count: 0,
                            totalQuantity: 0,
                            meetingsCount: 0,
                            lastInquiryDate: meeting.meeting_date
                        };
                    }

                    productInquiries[ip.productId].count += 1;
                    productInquiries[ip.productId].totalQuantity += ip.quantity || 0;
                    productInquiries[ip.productId].meetingsCount += 1;

                    // Update last inquiry date if this meeting is more recent
                    if (meeting.meeting_date > productInquiries[ip.productId].lastInquiryDate) {
                        productInquiries[ip.productId].lastInquiryDate = meeting.meeting_date;
                    }
                });
            });

        return Object.entries(productInquiries)
            .map(([productId, stats]) => {
                const product = products.find(p => p.id === productId && !p.isDeleted);
                return {
                    id: productId,
                    name: product?.name || 'Bilinmeyen Ürün',
                    count: stats.count,
                    totalQuantity: stats.totalQuantity,
                    meetingsCount: stats.meetingsCount,
                    lastInquiryDate: stats.lastInquiryDate
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [gorusmeler, products]);

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

    // Show skeleton when loading
    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hoş Geldiniz!</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">İşletmenizin genel durumuna buradan göz atabilirsiniz.</p>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-8">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonStat key={index} />
                    ))}
                </div>

                {/* Widgets skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4 animate-pulse"></div>
                            <SkeletonList count={5} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
                    value={teklifler.filter(t => !t.isDeleted && t.status === 'Hazırlandı').length}
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

            {/* Product Customers Modal */}
            <Modal
                show={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                title={`${selectedProduct?.name || ''} - Alıcı Müşteriler`}
                maxWidth="max-w-2xl"
            >
                {selectedProduct && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Toplam Satış:</span>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProduct.quantity} Kg</p>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Toplam Gelir:</span>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProduct.revenue)}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                                Müşteri Listesi ({selectedProduct.customers.length})
                            </h4>
                            <div className="space-y-2">
                                {selectedProduct.customers.map((customer, index) => (
                                    <div
                                        key={customer.customerId}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{customer.customerName}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {customer.quantity} Kg • {formatCurrency(customer.revenue)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                %{((customer.quantity / selectedProduct.quantity) * 100).toFixed(1)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Pay
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
                                    subtitle={`${product.quantity} Kg satıldı • ${product.customers.length} müşteri`}
                                    rightContent={
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(product.revenue)}
                                        </span>
                                    }
                                    onClick={() => setSelectedProduct(product)}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Henüz satış bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
                        <span>🔥</span>
                        En Çok Sorulan Ürünler
                    </h3>
                    <div className="space-y-2 md:space-y-3">
                        {mostInquiredProducts.length > 0 ? (
                            mostInquiredProducts.map(product => (
                                <MobileListItem
                                    key={product.id}
                                    title={product.name}
                                    subtitle={`${product.meetingsCount} görüşmede soruldu${product.totalQuantity > 0 ? ` • ${product.totalQuantity} Kg` : ''}`}
                                    rightContent={
                                        <div className="text-right">
                                            <span className="block text-sm font-semibold text-purple-600 dark:text-purple-400">
                                                {product.count} kez
                                            </span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                Son: {formatDate(product.lastInquiryDate)}
                                            </span>
                                        </div>
                                    }
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Henüz ürün sorgusu bulunmuyor.</p>
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
