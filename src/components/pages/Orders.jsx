import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import OrderForm from '../forms/OrderForm';
import ShipmentForm from '../forms/ShipmentForm';
import SearchBar from '../common/SearchBar';
import { PlusIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';

const Orders = ({ orders, onSave, onDelete, onShipment, customers, products }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [orderToShip, setOrderToShip] = useState(null);

    const handleOpenModal = (order = null) => {
        setCurrentOrder(order);
        setIsModalOpen(true);
    };

    const handleSave = (orderData) => {
        onSave(orderData);
        setIsModalOpen(false);
    };

    const handleDelete = (item) => {
        setDeleteConfirm({ isOpen: true, item });
    };

    const confirmDelete = () => {
        if (deleteConfirm.item) {
            if (deleteConfirm.item.id === 'batch') {
                confirmBatchDelete();
            } else {
                onDelete(deleteConfirm.item.id);
                setDeleteConfirm({ isOpen: false, item: null });
            }
        }
    };

    // Batch delete functions
    const handleSelectItem = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === filteredOrders.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredOrders.map(o => o.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            item: { id: 'batch', count: selectedItems.size }
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, item: null });
    };

    // Shipment functions
    const handleOpenShipmentModal = (order) => {
        setOrderToShip(order);
        setIsShipmentModalOpen(true);
    };

    const handleShipmentSave = (shipmentData) => {
        onShipment(shipmentData);
        setIsShipmentModalOpen(false);
        setOrderToShip(null);
    };

    const handlePrint = (order) => {
        const customer = customers.find(c => c.id === order.customerId);
        if (!customer) {
            alert('Müşteri bilgileri bulunamadı!');
            return;
        }

        // Şirket bilgileri
        const companyInfo = {
            name: "AKÇELİK METAL SANAYİ",
            address: "Organize Sanayi Bölgesi, Sanayi Cd. No:1, Bursa",
            phone: "0224 123 45 67",
            email: "info@akcelik.com.tr",
            logoUrl: "https://i.ibb.co/rGFcQ4GB/logo-Photoroom.png"
        };

        const itemsHtml = (order.items || []).map(item => {
            const product = products.find(p => p.id === item.productId);
            return `
                <tr class="border-b">
                    <td class="py-2 px-4">${product?.name || item.product_name || 'Bilinmeyen Ürün'}</td>
                    <td class="py-2 px-4 text-center">${item.quantity || 0} ${item.unit || 'Adet'}</td>
                    <td class="py-2 px-4 text-right">${formatCurrency(item.unit_price || 0, order.currency || 'TRY')}</td>
                    <td class="py-2 px-4 text-right">${formatCurrency((item.quantity || 0) * (item.unit_price || 0), order.currency || 'TRY')}</td>
                </tr>
            `;
        }).join('');

        const printContent = `
            <html>
            <head>
                <title>Sipariş #${order.id?.substring(0, 8) || 'XXXX'}</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body class="bg-gray-100 font-sans p-8">
                <div class="max-w-4xl mx-auto bg-white p-12 shadow-2xl rounded-lg">
                    <header class="flex justify-between items-start pb-8 border-b">
                        <div>
                            <img src="${companyInfo.logoUrl}" alt="${companyInfo.name} Logosu" class="h-20 mb-4"/>
                            <h1 class="text-2xl font-bold text-gray-800">${companyInfo.name}</h1>
                            <p class="text-sm text-gray-500">${companyInfo.address}</p>
                            <p class="text-sm text-gray-500">${companyInfo.phone} | ${companyInfo.email}</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-4xl font-bold uppercase text-green-600">Sipariş</h2>
                            <p class="text-sm text-gray-500 mt-2">Sipariş No: #${order.id?.substring(0, 8).toUpperCase() || 'XXXX'}</p>
                            <p class="text-sm text-gray-500">Sipariş Tarihi: ${formatDate(order.order_date)}</p>
                            <p class="text-sm text-gray-500">Teslim Tarihi: ${formatDate(order.delivery_date)}</p>
                        </div>
                    </header>

                    <section class="mt-8">
                        <h3 class="text-lg font-semibold text-gray-700">Müşteri Bilgileri</h3>
                        <div class="bg-gray-50 p-4 rounded-md mt-2 text-sm">
                            <p class="font-bold text-gray-800">${customer.name}</p>
                            <p>${customer.address || ''}, ${customer.sehir || ''}</p>
                            <p>${customer.phone || ''}</p>
                            <p>${customer.email || ''}</p>
                        </div>
                    </section>

                    <section class="mt-8">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="py-2 px-4 text-left font-semibold text-gray-600">Ürün/Hizmet</th>
                                    <th class="py-2 px-4 text-center font-semibold text-gray-600">Miktar</th>
                                    <th class="py-2 px-4 text-right font-semibold text-gray-600">Birim Fiyat</th>
                                    <th class="py-2 px-4 text-right font-semibold text-gray-600">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </section>

                    <section class="mt-8 flex justify-end">
                        <div class="w-1/2">
                            <div class="flex justify-between text-sm py-2 border-b">
                                <span class="font-semibold text-gray-600">Ara Toplam:</span>
                                <span>${formatCurrency(order.subtotal || 0, order.currency || 'TRY')}</span>
                            </div>
                            <div class="flex justify-between text-sm py-2 border-b">
                                <span class="font-semibold text-gray-600">KDV (%${order.vatRate || 10}):</span>
                                <span>${formatCurrency(order.vatAmount || 0, order.currency || 'TRY')}</span>
                            </div>
                            <div class="flex justify-between text-xl font-bold py-3 bg-gray-100 px-4 rounded-md">
                                <span class="text-gray-800">Genel Toplam:</span>
                                <span class="text-green-600">${formatCurrency(order.total_amount || 0, order.currency || 'TRY')}</span>
                            </div>
                        </div>
                    </section>

                    <section class="mt-8 bg-green-50 p-4 rounded-md">
                        <h3 class="text-md font-semibold text-gray-700 mb-2">Ödeme Koşulları</h3>
                        <div class="text-sm text-gray-600">
                            <p><strong>Ödeme Tipi:</strong> ${order.paymentType || 'Peşin'}</p>
                            ${order.paymentType === 'Vadeli' && order.paymentTerm ? `<p><strong>Vade Süresi:</strong> ${order.paymentTerm} gün</p>` : ''}
                            ${order.paymentType === 'Peşin' ? '<p class="mt-2 text-green-700 font-medium">✓ Peşin ödemede geçerlidir</p>' : ''}
                        </div>
                    </section>

                    <section class="border-t-2 border-gray-300 pt-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center">
                                <div class="h-28 border-b-2 border-gray-400 mb-3"></div>
                                <p class="text-sm font-semibold text-gray-700">${companyInfo.name}</p>
                                <p class="text-xs text-gray-500">Yetkili İmza ve Kaşe</p>
                            </div>
                            <div class="text-center">
                                <div class="h-28 border-b-2 border-gray-400 mb-3"></div>
                                <p class="text-sm font-semibold text-gray-700">${customer.name}</p>
                                <p class="text-xs text-gray-500">Müşteri İmza ve Kaşe</p>
                            </div>
                        </div>
                    </section>

                    <footer class="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                        <p>Siparişiniz için teşekkür ederiz.</p>
                        <p>Teslim tarihi: ${formatDate(order.delivery_date)}</p>
                    </footer>
                </div>
                <div class="text-center mt-8 no-print">
                    <button onclick="window.print()" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">Yazdır</button>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Filter orders based on search query and status
    const filteredOrders = useMemo(() => {
        let filtered = orders.filter(item => !item.isDeleted);

        // Status filter
        if (statusFilter !== 'Tümü') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                    customer?.name?.toLowerCase().includes(query) ||
                    order.order_date?.toLowerCase().includes(query) ||
                    order.total_amount?.toString().includes(query)
                );
            });
        }

        return filtered;
    }, [orders, searchQuery, statusFilter, customers]);

    const statusOptions = ['Tümü', 'Bekliyor', 'Hazırlanıyor', 'Tamamlandı'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sipariş Yönetimi</h1>
                <div className="flex gap-3">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Seçili {selectedItems.size} Siparişi Sil
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        Yeni Sipariş
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <SearchBar
                        placeholder="Sipariş ara (müşteri, tarih, tutar)..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {filteredOrders.length} sipariş gösteriliyor
                {(searchQuery || statusFilter !== 'Tümü') && ` (${orders.length} toplam)`}
            </div>

            <div className="overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={filteredOrders.length > 0 && selectedItems.size === filteredOrders.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            {['Müşteri', 'Sipariş Tarihi', 'Toplam Tutar', 'Durum', 'İşlemler'].map(h => (
                                <th key={h} className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(order.id)}
                                        onChange={() => handleSelectItem(order.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    {customers.find(c => c.id === order.customerId)?.name || 'Bilinmiyor'}
                                </td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(order.order_date)}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(order.total_amount, order.currency || 'TRY')}</td>
                                <td className="p-3 text-sm">
                                    <span
                                        className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(order.status)}`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex gap-3">
                                        {(order.status === 'Bekliyor' || order.status === 'Hazırlanıyor') && (
                                            <button
                                                onClick={() => handleOpenShipmentModal(order)}
                                                className="text-green-600 hover:underline dark:text-green-400"
                                            >
                                                Sevk Et
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenModal(order)}
                                            className="text-blue-500 hover:underline"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handlePrint(order)}
                                            className="text-purple-500 hover:underline dark:text-purple-400"
                                        >
                                            PDF
                                        </button>
                                        <button
                                            onClick={() => handleDelete(order)}
                                            className="text-red-500 hover:underline"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery || statusFilter !== 'Tümü' ? 'Arama kriterlerine uygun sipariş bulunamadı.' : 'Henüz sipariş eklenmemiş.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentOrder ? 'Sipariş Detayı' : 'Yeni Sipariş Oluştur'}
                maxWidth="max-w-4xl"
            >
                <OrderForm
                    order={currentOrder}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    customers={customers}
                    products={products}
                />
            </Modal>

            <Modal
                show={isShipmentModalOpen}
                onClose={() => setIsShipmentModalOpen(false)}
                title="Sipariş Sevk Et"
            >
                {orderToShip && (
                    <ShipmentForm
                        order={orderToShip}
                        products={products}
                        onSave={handleShipmentSave}
                        onCancel={() => setIsShipmentModalOpen(false)}
                    />
                )}
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title={deleteConfirm.item?.id === 'batch' ? 'Toplu Silme' : 'Siparişi Sil'}
                message={
                    deleteConfirm.item?.id === 'batch'
                        ? `Seçili ${deleteConfirm.item?.count} siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                        : `"${deleteConfirm.item?.id}" siparişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                }
            />
        </div>
    );
};

export default Orders;
