import React from 'react';
import { UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';

const Dashboard = ({ customers, orders, teklifler, gorusmeler }) => {
    const openOrders = orders.filter(o => ['Bekliyor', 'Hazırlanıyor'].includes(o.status));
    const today = new Date().toISOString().slice(0, 10);
    const upcomingActions = gorusmeler
        .filter(g => g.next_action_date >= today)
        .sort((a, b) => new Date(a.next_action_date) - new Date(b.next_action_date))
        .slice(0, 5);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hoş Geldiniz!</h1>
            <p className="text-gray-600 mb-6">İşletmenizin genel durumuna buradan göz atabilirsiniz.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600">Toplam Müşteri</h3>
                        <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                        <UsersIcon className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600">Açık Siparişler</h3>
                        <p className="text-3xl font-bold text-yellow-600">{openOrders.length}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <ClipboardListIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600">Bekleyen Teklifler</h3>
                        <p className="text-3xl font-bold text-indigo-600">
                            {teklifler.filter(t => t.status !== 'Onaylandı').length}
                        </p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-full">
                        <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600">Planlanan Eylemler</h3>
                        <p className="text-3xl font-bold text-green-600">{upcomingActions.length}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                        <CalendarIcon className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Yaklaşan Eylemler & Görüşmeler</h3>
                    <div className="space-y-3">
                        {upcomingActions.length > 0 ? (
                            upcomingActions.map(gorusme => {
                                const customer = customers.find(c => c.id === gorusme.customerId);
                                return (
                                    <div
                                        key={gorusme.id}
                                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-700">
                                                {customer?.name || 'Bilinmeyen Müşteri'}
                                            </p>
                                            <p className="text-sm text-gray-500">{gorusme.next_action_notes}</p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">
                                            {formatDate(gorusme.next_action_date)}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500">Yaklaşan bir eylem bulunmuyor.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Son Bekleyen Siparişler</h3>
                    <div className="space-y-3">
                        {openOrders.length > 0 ? (
                            openOrders.slice(0, 5).map(order => {
                                const customer = customers.find(c => c.id === order.customerId);
                                return (
                                    <div
                                        key={order.id}
                                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-700">
                                                {customer?.name || 'Bilinmeyen Müşteri'}
                                            </p>
                                            <p className="text-sm text-gray-500">
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
                            <p className="text-gray-500">Bekleyen sipariş bulunmuyor.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
