import React, { useMemo, useState } from 'react';
import SalesChart from '../charts/SalesChart';
import OrderStatusChart from '../charts/OrderStatusChart';
import CustomerAnalyticsChart from '../charts/CustomerAnalyticsChart';
import { formatCurrency } from '../../utils/formatters';

const Reports = ({ orders, customers, teklifler, gorusmeler }) => {
    const [dateRange, setDateRange] = useState('30'); // days

    // Calculate sales trend data
    const salesTrendData = useMemo(() => {
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const filteredOrders = orders.filter(order => {
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

        // Convert to array and sort
        return Object.entries(salesByDate)
            .map(([date, sales]) => ({
                date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
                sales: Math.round(sales)
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-15); // Last 15 data points
    }, [orders, dateRange]);

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

    // Calculate customer analytics
    const customerAnalytics = useMemo(() => {
        const customerStats = {};

        orders.forEach(order => {
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
                const customer = customers.find(c => c.id === customerId);
                return {
                    name: customer?.name || 'Bilinmiyor',
                    total: Math.round(stats.total),
                    count: stats.count
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [orders, customers]);

    // Calculate summary statistics
    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        const totalCustomers = customers.length;
        const activeCustomers = new Set(orders.map(o => o.customerId)).size;
        const conversionRate = teklifler.length > 0
            ? (teklifler.filter(t => t.status === 'Onaylandı').length / teklifler.length) * 100
            : 0;

        return {
            totalRevenue,
            avgOrderValue,
            totalCustomers,
            activeCustomers,
            conversionRate,
            totalOrders: orders.length,
            totalQuotes: teklifler.length,
            totalMeetings: gorusmeler.length
        };
    }, [orders, customers, teklifler, gorusmeler]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Raporlar ve Analizler</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">İşletmenizin detaylı performans raporları</p>
                </div>
                <div>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="7">Son 7 Gün</option>
                        <option value="30">Son 30 Gün</option>
                        <option value="90">Son 90 Gün</option>
                        <option value="365">Son 1 Yıl</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
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
                                {teklifler.filter(t => t.status === 'Onaylandı').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Bekleyen</span>
                            <span className="font-semibold text-yellow-600">
                                {teklifler.filter(t => t.status !== 'Onaylandı').length}
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
                                {gorusmeler.filter(g => g.outcome === 'İlgileniyor').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Teklif Bekliyor</span>
                            <span className="font-semibold text-purple-600">
                                {gorusmeler.filter(g => g.outcome === 'Teklif Bekliyor').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
