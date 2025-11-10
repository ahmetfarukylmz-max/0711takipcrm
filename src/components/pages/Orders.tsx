import React, { useState, useMemo, memo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import OrderForm from '../forms/OrderForm';
import OrderDetail from './OrderDetail';
import ShipmentForm from '../forms/ShipmentForm';
import SearchBar from '../common/SearchBar';
import ActionsDropdown from '../common/ActionsDropdown';
import { PlusIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';
import { exportOrders, exportOrdersDetailed } from '../../utils/excelExport';
import type { Order, Customer, Product, Shipment } from '../../types';

interface DeleteConfirmState {
    isOpen: boolean;
    item: (Order & { count?: number }) | null;
}

interface OrdersProps {
    /** List of orders */
    orders: Order[];
    /** Callback when order is saved */
    onSave: (order: Partial<Order>) => void;
    /** Callback when order is deleted */
    onDelete: (id: string) => void;
    /** Callback when shipment is created */
    onShipment: (shipment: Partial<Shipment>) => void;
    /** List of customers */
    customers: Customer[];
    /** List of products */
    products: Product[];
    /** Callback to generate custom PDF */
    onGeneratePdf: (order: Order) => void;
}

/**
 * Orders component - Order management page
 */
const Orders = memo<OrdersProps>(({ orders, onSave, onDelete, onShipment, customers, products, onGeneratePdf }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, item: null });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [orderToShip, setOrderToShip] = useState<Order | null>(null);

    const handleOpenModal = (order: Order | null = null) => {
        setCurrentOrder(order);
        setIsModalOpen(true);
        setIsDetailModalOpen(false);
    };

    const handleOpenDetailModal = (order: Order) => {
        setCurrentOrder(order);
        setIsDetailModalOpen(true);
        setIsModalOpen(false);
    };

    const handleSave = (orderData: Partial<Order>) => {
        onSave(orderData);
        setIsModalOpen(false);
    };

    const handleDelete = (item: Order) => {
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

    // Excel Export handler
    const handleExport = () => {
        try {
            exportOrders(orders, customers, {
                filename: `siparisler-${new Date().toISOString().split('T')[0]}.xlsx`,
                includeDeleted: false
            });
            toast.success('Siparişler Excel dosyasına aktarıldı');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export işlemi başarısız');
        }
    };

    const handleExportDetailed = () => {
        try {
            exportOrdersDetailed(orders, customers, products, {
                filename: `siparis-detayli-${new Date().toISOString().split('T')[0]}.xlsx`,
                includeDeleted: false
            });
            toast.success('Detaylı sipariş raporu Excel\'e aktarıldı');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export işlemi başarısız');
        }
    };

    // Batch delete functions
    const handleSelectItem = (id: string) => {
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
            item: { id: 'batch', count: selectedItems.size } as any
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, item: null });
    };

    // Shipment functions
    const handleOpenShipmentModal = (order: Order) => {
        setOrderToShip(order);
        setIsShipmentModalOpen(true);
    };

    const handleShipmentSave = (shipmentData: Partial<Shipment>) => {
        onShipment(shipmentData);
        setIsShipmentModalOpen(false);
        setOrderToShip(null);
    };

    const handlePrint = (order: Order) => {
        const customer = customers.find(c => c.id === order.customerId);
        if (!customer) {
            toast.error('Müşteri bilgileri bulunamadı!');
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

        const itemsHtml = (order.items || []).map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const isEven = index % 2 === 0;
            return `
                <tr class="border-b border-gray-200 ${isEven ? 'bg-gray-50' : 'bg-white'}">
                    <td class="py-2 px-3 text-center text-gray-500 text-xs">${index + 1}</td>
                    <td class="py-2 px-3 text-sm text-gray-900">${product?.name || 'Bilinmeyen Ürün'}</td>
                    <td class="py-2 px-3 text-center text-sm text-gray-700">${item.quantity || 0} Kg</td>
                    <td class="py-2 px-3 text-right text-sm text-gray-700">${formatCurrency(item.unit_price || 0, order.currency || 'TRY')}</td>
                    <td class="py-2 px-3 text-right text-sm font-semibold text-gray-900">${formatCurrency((item.quantity || 0) * (item.unit_price || 0), order.currency || 'TRY')}</td>
                </tr>
            `;
        }).join('');

        const printContent = `
            <html>
            <head>
                <title>Sipariş #${order.id?.substring(0, 8) || 'XXXX'}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                        @page { margin: 1cm; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        thead { display: table-header-group; }
                    }
                </style>
            </head>
            <body class="bg-white p-8">
                <div class="max-w-4xl mx-auto bg-white">
                    <div class="p-8">
                    <header class="flex justify-between items-start pb-6 border-b-2 border-gray-900">
                        <div>
                            <img src="${companyInfo.logoUrl}" alt="${companyInfo.name} Logosu" class="h-16 mb-3"/>
                            <h1 class="text-xl font-bold text-gray-900">${companyInfo.name}</h1>
                            <p class="text-xs text-gray-600 mt-1">${companyInfo.address}</p>
                            <p class="text-xs text-gray-600">${companyInfo.phone} | ${companyInfo.email}</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-3xl font-bold text-gray-900 mb-3">SİPARİŞ</h2>
                            <div class="text-xs text-gray-600 space-y-1">
                                <p><span class="font-semibold">No:</span> #${order.id?.substring(0, 8).toUpperCase() || 'XXXX'}</p>
                                <p><span class="font-semibold">Sipariş Tarihi:</span> ${formatDate(order.order_date)}</p>
                                <p><span class="font-semibold">Teslim Tarihi:</span> ${formatDate(order.delivery_date)}</p>
                            </div>
                        </div>
                    </header>

                    <section class="mt-6">
                        <h3 class="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Müşteri Bilgileri</h3>
                        <div class="border border-gray-300 p-3 text-xs">
                            <p class="font-bold text-gray-900">${customer.name}</p>
                            <p class="text-gray-600">${customer.address || ''}, ${customer.city || ''}</p>
                            <p class="text-gray-600">${customer.phone || ''}</p>
                            <p class="text-gray-600">${customer.email || ''}</p>
                        </div>
                    </section>

                    <section class="mt-6">
                        <table class="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr class="bg-gray-900 text-white">
                                    <th class="py-2 px-3 text-center text-xs font-semibold border-r border-gray-700">#</th>
                                    <th class="py-2 px-3 text-left text-xs font-semibold border-r border-gray-700">Ürün/Hizmet</th>
                                    <th class="py-2 px-3 text-center text-xs font-semibold border-r border-gray-700">Miktar</th>
                                    <th class="py-2 px-3 text-right text-xs font-semibold border-r border-gray-700">Birim Fiyat</th>
                                    <th class="py-2 px-3 text-right text-xs font-semibold">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </section>

                    <section class="mt-6 flex justify-end">
                        <div class="w-80 border border-gray-300">
                            <div class="flex justify-between text-xs py-1.5 px-3 border-b border-gray-200">
                                <span class="text-gray-700">Ara Toplam:</span>
                                <span class="font-semibold text-gray-900">${formatCurrency(order.subtotal || 0, order.currency || 'TRY')}</span>
                            </div>
                            <div class="flex justify-between text-xs py-1.5 px-3 border-b border-gray-200">
                                <span class="text-gray-700">KDV (%${order.vatRate || 10}):</span>
                                <span class="font-semibold text-gray-900">${formatCurrency(order.vatAmount || 0, order.currency || 'TRY')}</span>
                            </div>
                            <div class="flex justify-between bg-gray-900 text-white py-2 px-3">
                                <span class="text-sm font-bold">GENEL TOPLAM</span>
                                <span class="text-sm font-bold">${formatCurrency(order.total_amount || 0, order.currency || 'TRY')}</span>
                            </div>
                        </div>
                    </section>

                    <section class="mt-6 border border-gray-300 p-3">
                        <h3 class="text-xs font-semibold text-gray-900 mb-2 uppercase">Ödeme Koşulları</h3>
                        <div class="text-xs text-gray-600">
                            <p><strong>Ödeme Tipi:</strong> ${order.paymentType || 'Peşin'}</p>
                            ${order.paymentType === 'Vadeli' && order.paymentTerm ? `<p><strong>Vade Süresi:</strong> ${order.paymentTerm} gün</p>` : ''}
                        </div>
                    </section>

                    ${order.notes ? `
                    <section class="mt-6 border border-gray-300 p-3">
                        <h3 class="text-xs font-semibold text-gray-900 mb-2 uppercase">Özel Notlar</h3>
                        <p class="text-xs text-gray-600 whitespace-pre-wrap">${order.notes}</p>
                    </section>
                    ` : ''}

                    <section class="mt-8 border-t border-gray-300 pt-6">
                        <div class="grid grid-cols-2 gap-8">
                            <div class="text-center">
                                <div class="h-20 border-b border-gray-400 mb-2"></div>
                                <p class="text-xs font-semibold text-gray-900">${companyInfo.name}</p>
                                <p class="text-xs text-gray-500">Yetkili İmza ve Kaşe</p>
                            </div>
                            <div class="text-center">
                                <div class="h-20 border-b border-gray-400 mb-2"></div>
                                <p class="text-xs font-semibold text-gray-900">${customer.name}</p>
                                <p class="text-xs text-gray-500">Müşteri İmza ve Kaşe</p>
                            </div>
                        </div>
                    </section>

                    <footer class="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                        <p>Siparişiniz için teşekkür ederiz.</p>
                        <p class="mt-1">Teslim tarihi: ${formatDate(order.delivery_date)}</p>
                    </footer>
                    </div>
                </div>
                <div class="text-center mt-6 no-print">
                    <button onclick="window.print()" class="bg-gray-900 text-white px-6 py-2 hover:bg-gray-800 text-sm font-medium">
                        Yazdır / PDF Kaydet
                    </button>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Sipariş Yönetimi</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center flex-1 sm:flex-none bg-red-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Seçili {selectedItems.size} Siparişi Sil</span>
                            <span className="sm:hidden">Sil ({selectedItems.size})</span>
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center flex-1 sm:flex-none bg-green-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-green-600"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden md:inline">Excel</span>
                    </button>
                    <button
                        onClick={handleExportDetailed}
                        className="flex items-center flex-1 sm:flex-none bg-teal-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-teal-600"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden md:inline">Detaylı</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        data-action="add-order"
                        className="flex items-center flex-1 sm:flex-none bg-blue-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        <span className="hidden sm:inline">Yeni Sipariş</span>
                        <span className="sm:hidden">Yeni</span>
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
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 hidden md:table-header-group">
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
                                <th key={h} className={`p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 ${h === 'İşlemler' ? 'text-right' : ''}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y md:divide-none divide-gray-100 dark:divide-gray-700">
                        {filteredOrders.length > 0 ? filteredOrders.map(order => {
                            const orderActions = [
                                { label: 'Detay', onClick: () => handleOpenDetailModal(order) },
                                { label: 'Düzenle', onClick: () => handleOpenModal(order) },
                                { label: 'PDF', onClick: () => handlePrint(order) },
                                { label: 'Özelleştir', onClick: () => onGeneratePdf(order) },
                            ];

                            if (order.status === 'Bekliyor' || order.status === 'Hazırlanıyor') {
                                orderActions.unshift({ label: 'Sevk Et', onClick: () => handleOpenShipmentModal(order) });
                            }

                            orderActions.push({ label: 'Sil', onClick: () => handleDelete(order), destructive: true });

                            return (
                            <tr key={order.id} className="block md:table-row mb-4 md:mb-0 rounded-lg md:rounded-none shadow md:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Seç:{' '}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(order.id)}
                                        onChange={() => handleSelectItem(order.id)}
                                        className="w-5 h-5 md:w-4 md:h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Müşteri:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300 font-bold">
                                        {customers.find(c => c.id === order.customerId)?.name || 'Bilinmiyor'}
                                    </span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Sipariş Tarihi:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">{formatDate(order.order_date)}</span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Toplam:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">{formatCurrency(order.total_amount, order.currency || 'TRY')}</span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Durum:{' '}
                                    </span>
                                    <span
                                        className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(order.status)}`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        İşlemler:{' '}
                                    </span>
                                    <div className="flex justify-end md:justify-end min-h-[44px] items-center">
                                        <ActionsDropdown actions={orderActions} />
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
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
                title={currentOrder ? 'Sipariş Düzenle' : 'Yeni Sipariş Oluştur'}
                maxWidth="max-w-4xl"
            >
                <OrderForm
                    order={currentOrder || undefined}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    customers={customers}
                    products={products}
                />
            </Modal>

            <Modal
                show={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Sipariş Detayı"
                maxWidth="max-w-4xl"
            >
                <OrderDetail
                    order={currentOrder}
                    customer={customers.find(c => c.id === currentOrder?.customerId)}
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
});

Orders.displayName = 'Orders';

export default Orders;
