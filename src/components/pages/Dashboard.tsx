import React, { useMemo, memo, useState } from 'react';
import toast from 'react-hot-toast';
import { UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon, WhatsAppIcon, BellIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import OverdueActions from '../dashboard/OverdueActions';
import CriticalAlerts from '../dashboard/CriticalAlerts';
import InactiveCustomers from '../dashboard/InactiveCustomers';
import UpcomingActionsModal from '../dashboard/UpcomingActionsModal';
import OpenOrdersModal from '../dashboard/OpenOrdersModal';
import PendingQuotesModal from '../dashboard/PendingQuotesModal';
import Modal from '../common/Modal';
import MobileStat from '../common/MobileStat';
import MobileListItem from '../common/MobileListItem';
import SkeletonStat from '../common/SkeletonStat';
import SkeletonList from '../common/SkeletonList';
import useStore from '../../store/useStore';
import type { Customer, Order, Quote, Meeting, Product, CustomTask, Shipment } from '../../types';

interface BestSellingProduct {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    revenue: number;
    customers: Array<{
        customerId: string;
        customerName: string;
        quantity: number;
        revenue: number;
    }>;
}

interface TodayTask {
    id: string;
    type: 'call' | 'delivery' | 'meeting' | 'custom';
    title: string;
    subtitle: string;
    time?: string;
    completed: boolean;
    sourceType: 'meeting' | 'order' | 'customTask';
    sourceId: string;
    priority?: 'low' | 'medium' | 'high';
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
    /** List of shipments */
    shipments: Shipment[];
    /** List of overdue items */
    overdueItems: Meeting[];
    /** List of custom tasks */
    customTasks: CustomTask[];
    /** Callback to set active page */
    setActivePage: (page: string) => void;
    /** Callback when meeting is saved */
    onMeetingSave: (meeting: Partial<Meeting>) => void;
    /** Callback when custom task is saved */
    onCustomTaskSave: (task: Partial<CustomTask>) => void;
    /** Loading state */
    loading?: boolean;
}

/**
 * Dashboard component - Main dashboard page with statistics and widgets
 */
const Dashboard = memo<DashboardProps>(({
    customers,
    orders,
    teklifler,
    gorusmeler,
    products,
    shipments,
    overdueItems,
    customTasks,
    setActivePage,
    onMeetingSave,
    onCustomTaskSave,
    loading = false
}) => {
    // Zustand store actions
    const setSelectedProductId = useStore((state) => state.setSelectedProductId);

    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<BestSellingProduct | null>(null);
    const [isInactiveCustomersModalOpen, setIsInactiveCustomersModalOpen] = useState(false);
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);
    const [showOpenOrdersModal, setShowOpenOrdersModal] = useState(false);
    const [showPendingQuotesModal, setShowPendingQuotesModal] = useState(false);
    const [showCancelledOrdersModal, setShowCancelledOrdersModal] = useState(false);

    const openOrders = orders.filter(o => !o.isDeleted && ['Bekliyor', 'Hazırlanıyor'].includes(o.status));
    const cancelledOrders = orders?.filter(o => !o.isDeleted && o.status === 'İptal Edildi') || [];
    const today = new Date().toISOString().slice(0, 10);
    const upcomingActions = gorusmeler
        .filter(g => !g.isDeleted && g.next_action_date && g.next_action_date >= today)
        .sort((a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime())
        .slice(0, 5);

    // Calculate today's tasks
    const todayTasks = useMemo<TodayTask[]>(() => {
        const tasks: TodayTask[] = [];

        // Today's meetings
        gorusmeler
            .filter(m => !m.isDeleted && m.next_action_date === today)
            .forEach(meeting => {
                const customer = customers.find(c => c.id === meeting.customerId);
                tasks.push({
                    id: `meeting-${meeting.id}`,
                    type: 'meeting',
                    title: customer?.name || 'Bilinmeyen Müşteri',
                    subtitle: meeting.next_action_notes || 'Görüşme',
                    time: meeting.meeting_time,
                    completed: meeting.status === 'Tamamlandı',
                    sourceType: 'meeting',
                    sourceId: meeting.id
                });
            });

        // Today's deliveries
        orders
            .filter(o => !o.isDeleted && o.delivery_date === today && o.status !== 'Tamamlandı')
            .forEach(order => {
                const customer = customers.find(c => c.id === order.customerId);
                tasks.push({
                    id: `delivery-${order.id}`,
                    type: 'delivery',
                    title: customer?.name || 'Bilinmeyen Müşteri',
                    subtitle: `Teslimat - ${formatCurrency(order.total_amount)}`,
                    completed: order.status === 'Teslim Edildi',
                    sourceType: 'order',
                    sourceId: order.id
                });
            });

        // Today's custom tasks
        customTasks
            .filter(t => !t.isDeleted && t.date === today)
            .forEach(task => {
                const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡';
                tasks.push({
                    id: `custom-${task.id}`,
                    type: 'custom',
                    title: task.title,
                    subtitle: task.notes || '',
                    time: task.time,
                    completed: task.completed,
                    sourceType: 'customTask',
                    sourceId: task.id,
                    priority: task.priority
                });
            });

        return tasks.sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
        });
    }, [gorusmeler, orders, customers, customTasks, today]);

    // Calculate low stock products
    const lowStockProducts = useMemo(() => {
        return products
            .filter(p => !p.isDeleted && p.track_stock && p.stock_quantity !== undefined && p.minimum_stock !== undefined && p.stock_quantity <= p.minimum_stock)
            .sort((a, b) => {
                // Sort by how critical the stock level is (lower percentage = more critical)
                const aPercentage = a.minimum_stock ? (a.stock_quantity! / a.minimum_stock) : 1;
                const bPercentage = b.minimum_stock ? (b.stock_quantity! / b.minimum_stock) : 1;
                return aPercentage - bPercentage;
            })
            .slice(0, 5); // Show top 5 low stock items
    }, [products]);

    const toggleTask = async (task: TodayTask) => {
        const newCompleted = !task.completed;

        try {
            if (task.sourceType === 'meeting') {
                const meeting = gorusmeler.find(m => m.id === task.sourceId);
                if (meeting) {
                    await onMeetingSave({
                        ...meeting,
                        status: newCompleted ? 'Tamamlandı' : 'Planlandı'
                    });
                    toast.success(newCompleted ? 'Görüşme tamamlandı!' : 'Görüşme aktif duruma alındı');
                }
            } else if (task.sourceType === 'order') {
                const order = orders.find(o => o.id === task.sourceId);
                if (order) {
                    // Order status update will be handled by App.jsx handleOrderSave
                    toast.info('Teslimat durumu siparişler sayfasından güncellenebilir');
                }
            } else if (task.sourceType === 'customTask') {
                const customTask = customTasks.find(t => t.id === task.sourceId);
                if (customTask) {
                    await onCustomTaskSave({
                        ...customTask,
                        completed: newCompleted,
                        completedAt: newCompleted ? new Date().toISOString() : undefined
                    });
                }
            }
        } catch (error) {
            console.error('Task toggle error:', error);
            toast.error('Görev güncellenirken hata oluştu');
        }
    };

    const completedTasksCount = todayTasks.filter(t => t.completed).length;
    const totalTasksCount = todayTasks.length;
    const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

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
                    unit: product?.unit || 'Kg',
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
                    unit: product?.unit || 'Kg',
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
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hoş Geldiniz! 👋</h1>
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

    // Always use compact view
    const widgetGridClass = 'grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4';
    const widgetPadding = 'p-3 md:p-4';

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hoş Geldiniz! 👋</h1>
                <p className="text-gray-600 dark:text-gray-400">İşletmenizin genel durumuna buradan göz atabilirsiniz.</p>
            </div>

            {/* Critical Alerts */}
            <CriticalAlerts
                customers={customers}
                orders={orders}
                meetings={gorusmeler}
                quotes={teklifler}
                shipments={shipments}
                setActivePage={setActivePage}
                onShowInactiveCustomers={() => setIsInactiveCustomersModalOpen(true)}
            />

            {/* Mobile-optimized stats grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-8">
                <div className="animate-fadeIn">
                    <MobileStat
                        label="Açık Siparişler"
                        value={openOrders.length}
                        icon={<ClipboardListIcon className="w-6 h-6" />}
                        color="yellow"
                        onClick={() => setShowOpenOrdersModal(true)}
                    />
                </div>
                <div className="animate-fadeIn animate-delay-100">
                    <MobileStat
                        label="Bekleyen Teklifler"
                        value={teklifler.filter(t => !t.isDeleted && t.status === 'Hazırlandı').length}
                        icon={<DocumentTextIcon className="w-6 h-6" />}
                        color="indigo"
                        onClick={() => setShowPendingQuotesModal(true)}
                    />
                </div>
                <div className="animate-fadeIn animate-delay-200">
                    <MobileStat
                        label="Planlanan Eylemler"
                        value={upcomingActions.length}
                        icon={<CalendarIcon className="w-6 h-6" />}
                        color="green"
                        onClick={() => setShowUpcomingModal(true)}
                    />
                </div>
                <div className="animate-fadeIn animate-delay-300">
                    <MobileStat
                        label="Gecikmiş Eylemler"
                        value={overdueItems.length}
                        icon={<BellIcon className="w-6 h-6" />}
                        color="red"
                        onClick={() => setIsOverdueModalOpen(true)}
                    />
                </div>
                <div className="animate-fadeIn animate-delay-400">
                    <MobileStat
                        label="İptal Edilen"
                        value={cancelledOrders.length}
                        icon={<ClipboardListIcon className="w-6 h-6" />}
                        color="purple"
                        onClick={() => setShowCancelledOrdersModal(true)}
                    />
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

            {/* Inactive Customers Modal */}
            <Modal
                show={isInactiveCustomersModalOpen}
                onClose={() => setIsInactiveCustomersModalOpen(false)}
                title="İnaktif Müşteriler - İletişim Gerekli"
                maxWidth="max-w-4xl"
            >
                <InactiveCustomers
                    customers={customers}
                    meetings={gorusmeler}
                    orders={orders}
                    quotes={teklifler}
                    setActivePage={setActivePage}
                />
            </Modal>

            {/* Upcoming Actions Modal */}
            <Modal
                show={showUpcomingModal}
                onClose={() => setShowUpcomingModal(false)}
                title="Planlanan Eylemler"
                maxWidth="max-w-4xl"
            >
                <UpcomingActionsModal
                    meetings={upcomingActions}
                    customers={customers}
                    onViewAllMeetings={() => {
                        setShowUpcomingModal(false);
                        setActivePage('Görüşmeler');
                    }}
                />
            </Modal>

            {/* Open Orders Modal */}
            <Modal
                show={showOpenOrdersModal}
                onClose={() => setShowOpenOrdersModal(false)}
                title="Açık Siparişler"
                maxWidth="max-w-4xl"
            >
                <OpenOrdersModal
                    orders={openOrders}
                    customers={customers}
                    onViewAllOrders={() => {
                        setShowOpenOrdersModal(false);
                        setActivePage('Siparişler');
                    }}
                />
            </Modal>

            {/* Pending Quotes Modal */}
            <Modal
                show={showPendingQuotesModal}
                onClose={() => setShowPendingQuotesModal(false)}
                title="Bekleyen Teklifler"
                maxWidth="max-w-4xl"
            >
                <PendingQuotesModal
                    quotes={teklifler.filter(t => !t.isDeleted && t.status === 'Hazırlandı')}
                    customers={customers}
                    onViewAllQuotes={() => {
                        setShowPendingQuotesModal(false);
                        setActivePage('Teklifler');
                    }}
                />
            </Modal>

            {/* Cancelled Orders Modal */}
            <Modal
                show={showCancelledOrdersModal}
                onClose={() => setShowCancelledOrdersModal(false)}
                title="İptal Edilen Siparişler"
                maxWidth="max-w-5xl"
            >
                <div className="space-y-4">
                    {cancelledOrders.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            İptal edilen sipariş bulunmamaktadır.
                        </p>
                    ) : (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Toplam İptal:</span>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{cancelledOrders.length}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Toplam Tutar:</span>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(cancelledOrders.reduce((sum, o) => {
                                                const amount = typeof o.total_amount === 'number' ? o.total_amount : 0;
                                                return sum + amount;
                                            }, 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">İptal Oranı:</span>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {orders?.filter(o => !o.isDeleted).length > 0
                                                ? ((cancelledOrders.length / (orders?.filter(o => !o.isDeleted).length || 1)) * 100).toFixed(1)
                                                : 0}%
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Son 30 Gün:</span>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {cancelledOrders.filter(o => {
                                                if (!o.cancelledAt) return false;
                                                try {
                                                    const cancelDate = new Date(o.cancelledAt);
                                                    if (isNaN(cancelDate.getTime())) return false;
                                                    const thirtyDaysAgo = new Date();
                                                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                                    return cancelDate >= thirtyDaysAgo;
                                                } catch {
                                                    return false;
                                                }
                                            }).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Müşteri</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sipariş Tarihi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">İptal Tarihi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tutar</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">İptal Nedeni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {cancelledOrders.map(order => {
                                            const customer = customers.find(c => c.id === order.customerId);
                                            return (
                                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                        {customer?.name || 'Bilinmeyen'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {formatDate(order.order_date)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                                        {order.cancelledAt ? formatDate(order.cancelledAt) : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(order.total_amount || 0, order.currency || 'TRY')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {order.cancellationReason || 'Belirtilmemiş'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowCancelledOrdersModal(false);
                                        setActivePage('Siparişler');
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Tüm Siparişleri Görüntüle
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <div className={widgetGridClass}>
                {/* Today's Tasks Widget */}
                <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm animate-fadeIn`}>
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <span>✅</span>
                            Bugünün Görevleri
                        </h3>
                        {totalTasksCount > 0 && (
                            <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">{completedTasksCount}/{totalTasksCount}</span>
                                <span className="hidden sm:inline ml-1">({completionPercentage}%)</span>
                            </div>
                        )}
                    </div>

                    {totalTasksCount > 0 && (
                        <div className="mb-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 md:space-y-2">
                        {todayTasks.length > 0 ? (
                            todayTasks.map(task => {
                                const taskIcon = task.type === 'meeting' ? '📞' : task.type === 'delivery' ? '📦' : task.type === 'custom' ? '📋' : '📋';
                                const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : task.priority === 'medium' ? '🟡' : '';

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                            task.completed
                                                ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                                                : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 hover:shadow-sm'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleTask(task)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{taskIcon}</span>
                                                {priorityIcon && <span className="text-xs">{priorityIcon}</span>}
                                                <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {task.title}
                                                </p>
                                            </div>
                                            {task.subtitle && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                                                    {task.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        {task.time && (
                                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                {task.time}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-4xl mb-2">🎉</p>
                                <p className="text-gray-500 dark:text-gray-400">Bugün için görev yok!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm animate-fadeIn animate-delay-100`}>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
                        <span>📅</span>
                        Yaklaşan Eylemler
                    </h3>
                    <div className="space-y-2 md:space-y-2">
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

                {/* Low Stock Warnings */}
                {lowStockProducts.length > 0 && (
                    <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm border-2 border-yellow-200 dark:border-yellow-800 animate-fadeIn animate-delay-200`}>
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <span>⚠️</span>
                                Düşük Stok Uyarıları
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
                                {lowStockProducts.length} ürün
                            </span>
                        </div>
                        <div className="space-y-2 md:space-y-2">
                            {lowStockProducts.map(product => {
                                const stockPercentage = product.minimum_stock ? ((product.stock_quantity! / product.minimum_stock) * 100) : 0;
                                const isCritical = stockPercentage < 50;
                                return (
                                    <MobileListItem
                                        key={product.id}
                                        title={
                                            <div className="flex items-center gap-2">
                                                <span>{product.name}</span>
                                                {isCritical && <span className="text-red-500 text-xs">🔴 Kritik</span>}
                                            </div>
                                        }
                                        subtitle={product.code ? `Kod: ${product.code}` : undefined}
                                        rightContent={
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    isCritical
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                    {product.stock_quantity} {product.unit}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Min: {product.minimum_stock} {product.unit}
                                                </span>
                                            </div>
                                        }
                                        bottomContent={
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                Stok seviyesi: {stockPercentage.toFixed(0)}%
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActivePage('products')}
                                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Tüm Ürünleri Görüntüle →
                            </button>
                        </div>
                    </div>
                )}

                <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm animate-fadeIn animate-delay-200`}>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
                        <span>📋</span>
                        Bekleyen Siparişler
                    </h3>
                    <div className="space-y-2 md:space-y-2">
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

                <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm animate-fadeIn animate-delay-300`}>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
                        <span>🏆</span>
                        En Çok Satılan Ürünler
                    </h3>
                    <div className="space-y-2 md:space-y-2">
                        {bestSellingProducts.length > 0 ? (
                            bestSellingProducts.map(product => (
                                <MobileListItem
                                    key={product.id}
                                    title={product.name}
                                    subtitle={`${product.quantity} ${product.unit} satıldı • ${product.customers.length} müşteri`}
                                    rightContent={
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(product.revenue)}
                                        </span>
                                    }
                                    onClick={() => {
                                        setSelectedProductId(product.id);
                                        setActivePage('Ürünler');
                                    }}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Henüz satış bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm animate-fadeIn animate-delay-400`}>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
                        <span>🔥</span>
                        En Çok Sorulan Ürünler
                    </h3>
                    <div className="space-y-2 md:space-y-2">
                        {mostInquiredProducts.length > 0 ? (
                            mostInquiredProducts.map(product => (
                                <MobileListItem
                                    key={product.id}
                                    title={product.name}
                                    subtitle={`${product.meetingsCount} görüşmede soruldu${product.totalQuantity > 0 ? ` • ${product.totalQuantity} ${product.unit}` : ''}`}
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
                                    onClick={() => {
                                        setSelectedProductId(product.id);
                                        setActivePage('Ürünler');
                                    }}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Henüz ürün sorgusu bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className={`bg-white dark:bg-gray-800 ${widgetPadding} rounded-xl shadow-sm animate-fadeIn animate-delay-500`}>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
                        <span>🚚</span>
                        Yaklaşan Teslimatlar
                    </h3>
                    <div className="space-y-2 md:space-y-2">
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

                {/* Düşük Stok Uyarısı */}
                {lowStockProducts.length > 0 && (
                    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 ${widgetPadding} rounded-xl border-2 border-yellow-300 dark:border-yellow-700 shadow-sm animate-fadeIn animate-delay-600`}>
                        <h3 className="text-lg md:text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-3 md:mb-4 flex items-center gap-2">
                            <span>⚠️</span>
                            Düşük Stok Uyarısı
                        </h3>
                        <div className="space-y-2">
                            {lowStockProducts.map(product => {
                                const stockPercentage = product.minimum_stock
                                    ? ((product.stock_quantity! / product.minimum_stock) * 100).toFixed(0)
                                    : '0';
                                const isCritical = product.stock_quantity === 0;

                                return (
                                    <MobileListItem
                                        key={product.id}
                                        title={product.name}
                                        subtitle={`Min: ${product.minimum_stock || 0} ${product.unit} • Mevcut: ${product.stock_quantity || 0} ${product.unit}`}
                                        rightContent={
                                            <div className="text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    isCritical
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                    {isCritical ? '🚨 Tükendi' : `%${stockPercentage}`}
                                                </span>
                                            </div>
                                        }
                                        onClick={() => {
                                            setSelectedProductId(product.id);
                                            setActivePage('Ürünler');
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                💡 <strong>{lowStockProducts.length} ürün</strong> minimum stok seviyesinde veya altında. Stok yenilemeyi düşünün.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
