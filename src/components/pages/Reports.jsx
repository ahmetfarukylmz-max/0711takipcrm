import React, { useMemo, useState, memo } from 'react';
import SalesChart from '../charts/SalesChart';
import OrderStatusChart from '../charts/OrderStatusChart';
import CustomerAnalyticsChart from '../charts/CustomerAnalyticsChart';
import EnhancedDailyReportWithDetails from '../reports/EnhancedDailyReportWithDetails';
import Modal from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { ChartBarIcon } from '../icons';

const Reports = memo(({ orders, customers, teklifler, gorusmeler, shipments, products }) => {
    const [dateRange, setDateRange] = useState('30'); // days
    const [showDailyReportModal, setShowDailyReportModal] = useState(false);

    const salesTrendData = useMemo(() => {
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const filteredOrders = orders.filter(order => {
            if (order.isDeleted) return false;
            const orderDate = new Date(order.order_date);
            return orderDate >= startDate;
        });

        // Group by date
        const salesByDate = {};
        filteredOrders.forEach(order => {
            const date = order.order_date;
            if (!salesByDate[date]) {
                salesByDate[date] = 0;
            }
            salesByDate[date] += order.total_amount || 0;
        });

        // Convert to array and sort by actual date
        return Object.entries(salesByDate)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-15) // Last 15 data points
            .map(([date, sales]) => ({
                date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
                sales: Math.round(sales)
            }));
    }, [orders, dateRange]);

    const orderStatusData = useMemo(() => {
        const statusCounts = {};
        orders.filter(order => !order.isDeleted).forEach(order => {
            const status = order.status || 'Bilinmiyor';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value
        }));
    }, [orders]);

    const customerAnalytics = useMemo(() => {
        const customerStats = {};

        orders.filter(order => !order.isDeleted).forEach(order => {
            const customerId = order.customerId;
            if (!customerStats[customerId]) {
                customerStats[customerId] = {
                    total: 0,
                    count: 0
                };
            }
            customerStats[customerId].total += order.total_amount || 0;
            customerStats[customerId].count += 1;
        });

        // Get top 10 customers
        return Object.entries(customerStats)
            .map(([customerId, stats]) => {
                const customer = customers.find(c => c.id === customerId && !c.isDeleted);
                return {
                    name: customer?.name || 'Bilinmiyor',
                    total: Math.round(stats.total),
                    count: stats.count
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [orders, customers]);

    const stats = useMemo(() => {
        const activeOrders = orders.filter(o => !o.isDeleted);
        const activeCustomers = customers.filter(c => !c.isDeleted);
        const activeTeklifler = teklifler.filter(t => !t.isDeleted);
        const activeGorusmeler = gorusmeler.filter(g => !g.isDeleted);

        const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
        const totalCustomers = activeCustomers.length;
        const customersWithOrders = new Set(activeOrders.map(o => o.customerId)).size;
        const conversionRate = activeTeklifler.length > 0
            ? (activeTeklifler.filter(t => t.status === 'Onaylandı').length / activeTeklifler.length) * 100
            : 0;

        return {
            totalRevenue,
            avgOrderValue,
            totalCustomers,
            activeCustomers: customersWithOrders,
            conversionRate,
            totalOrders: activeOrders.length,
            totalQuotes: activeTeklifler.length,
            totalMeetings: activeGorusmeler.length
        };
    }, [orders, customers, teklifler, gorusmeler]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Raporlar ve Analizler</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">İşletmenizin performansını ve günlük aktivitelerinizi izleyin.</p>
                </div>
                {/* Tarih Aralığı Seçici */}
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                    <option value="7">Son 7 Gün</option>
                    <option value="30">Son 30 Gün</option>
                    <option value="90">Son 90 Gün</option>
                    <option value="365">Son 1 Yıl</option>
                </select>
            </div>

            {/* Modal: Günlük Performans Raporu */}
            <Modal
                show={showDailyReportModal}
                onClose={() => setShowDailyReportModal(false)}
                title=""
                maxWidth="max-w-7xl"
            >
                <EnhancedDailyReportWithDetails
                    orders={orders}
                    quotes={teklifler}
                    meetings={gorusmeler}
                    shipments={shipments}
                    customers={customers}
                    products={products}
                />
            </Modal>

            {/* Quick Access Card for Daily Report */}
            <div
                onClick={() => setShowDailyReportModal(true)}
                className="mb-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] group"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <ChartBarIcon className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-white">
                            <h3 className="text-2xl font-bold mb-2">Günlük Performans Raporu</h3>
                            <p className="text-white/90 text-sm md:text-base">
                                Bugünün detaylı satış, teklif ve operasyon metriklerini görüntüleyin.
                                Önceki günlerle karşılaştırın ve performansınızı takip edin.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-white font-semibold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg group-hover:bg-white/30 transition-colors whitespace-nowrap">
                        <span>Raporu Görüntüle</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 mt-8">Genel Bakış</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Toplam Gelir</h3>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm mt-2 opacity-75">{stats.totalOrders} sipariş</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Ortalama Sipariş</h3>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(stats.avgOrderValue)}</p>
                    <p className="text-sm mt-2 opacity-75">Sipariş başına</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Aktif Müşteriler</h3>
                    <p className="text-3xl font-bold mt-2">{stats.activeCustomers}</p>
                    <p className="text-sm mt-2 opacity-75">{stats.totalCustomers} toplam</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Dönüşüm Oranı</h3>
                    <p className="text-3xl font-bold mt-2">{stats.conversionRate.toFixed(1)}%</p>
                    <p className="text-sm mt-2 opacity-75">Teklif → Sipariş</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <SalesChart data={salesTrendData} title={`Satış Trendi (Son ${dateRange} Gün)`} />
                <OrderStatusChart data={orderStatusData} />
            </div>

            <div className="mb-8">
                <CustomerAnalyticsChart data={customerAnalytics} title="En İyi 10 Müşteri" />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Sipariş İstatistikleri
                    </h3>
                    <div className="space-y-3">
                        {orderStatusData.map(stat => (
                            <div key={stat.name} className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">{stat.name}</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Teklif Durumu
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Toplam Teklif</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {stats.totalQuotes}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Onaylanan</span>
                            <span className="font-semibold text-green-600">
                                {teklifler.filter(t => !t.isDeleted && t.status === 'Onaylandı').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Bekleyen</span>
                            <span className="font-semibold text-yellow-600">
                                {teklifler.filter(t => !t.isDeleted && t.status === 'Hazırlandı').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Reddedilen</span>
                            <span className="font-semibold text-red-600">
                                {teklifler.filter(t => !t.isDeleted && t.status === 'Reddedildi').length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Görüşme Aktivitesi
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Toplam Görüşme</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {stats.totalMeetings}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">İlgileniyor</span>
                            <span className="font-semibold text-blue-600">
                                {gorusmeler.filter(g => !g.isDeleted && g.outcome === 'İlgileniyor').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Teklif Bekliyor</span>
                            <span className="font-semibold text-purple-600">
                                {gorusmeler.filter(g => !g.isDeleted && g.outcome === 'Teklif Bekliyor').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">İlgilenmiyor</span>
                            <span className="font-semibold text-gray-600">
                                {gorusmeler.filter(g => !g.isDeleted && g.outcome === 'İlgilenmiyor').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

Reports.displayName = 'Reports';

export default Reports;
