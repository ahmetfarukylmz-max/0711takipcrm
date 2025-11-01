import React, { useMemo } from 'react';
import { UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon, WhatsAppIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import SalesChart from '../charts/SalesChart';
import OrderStatusChart from '../charts/OrderStatusChart';

const Dashboard = ({ customers, orders, teklifler, gorusmeler }) => {
    const openOrders = orders.filter(o => ['Bekliyor', 'Hazırlanıyor'].includes(o.status));
    const today = new Date().toISOString().slice(0, 10);
    const upcomingActions = gorusmeler
        .filter(g => g.next_action_date >= today)
        .sort((a, b) => new Date(a.next_action_date) - new Date(b.next_action_date))
        .slice(0, 5);

    // Calculate sales trend data (last 7 days)
    const salesTrendData = useMemo(() => {
        const now = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now);
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().slice(0, 10);
        });

        const salesByDate = {};
        last7Days.forEach(date => {
            salesByDate[date] = 0;
        });

        orders.forEach(order => {
            if (salesByDate.hasOwnProperty(order.order_date)) {
                salesByDate[order.order_date] += order.total_amount || 0;
            }
        });

        return last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
            sales: Math.round(salesByDate[date])
        }));
    }, [orders]);

    // Calculate order status data
    const orderStatusData = useMemo(() => {
        const statusCounts = {};
        orders.forEach(order => {
            const status = order.status || 'Bilinmiyor';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value
        }));
    }, [orders]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hoş Geldiniz!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">İşletmenizin genel durumuna buradan göz atabilirsiniz.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Toplam Müşteri</h3>
                        <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Açık Siparişler</h3>
                        <p className="text-3xl font-bold text-yellow-600">{openOrders.length}</p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                        <ClipboardListIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Bekleyen Teklifler</h3>
                        <p className="text-3xl font-bold text-indigo-600">
                            {teklifler.filter(t => t.status !== 'Onaylandı').length}
                        </p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                        <DocumentTextIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Planlanan Eylemler</h3>
                        <p className="text-3xl font-bold text-green-600">{upcomingActions.length}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                        <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <SalesChart data={salesTrendData} title="Satış Trendi (Son 7 Gün)" />
                <OrderStatusChart data={orderStatusData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Yaklaşan Eylemler & Görüşmeler</h3>
                    <div className="space-y-3">
                        {upcomingActions.length > 0 ? (
                            upcomingActions.map(gorusme => {
                                const customer = customers.find(c => c.id === gorusme.customerId);
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
                                const customer = customers.find(c => c.id === order.customerId);
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
            </div>
        </div>
    );
};

export default Dashboard;
