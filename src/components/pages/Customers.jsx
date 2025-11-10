import React, { useState, useMemo, memo, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomerForm from '../forms/CustomerForm';
import CustomerDetail from './CustomerDetail';
import QuoteForm from '../forms/QuoteForm';
import OrderForm from '../forms/OrderForm';
import ShipmentDetail from './ShipmentDetail';
import SearchBar from '../common/SearchBar';
import ActionsDropdown from '../common/ActionsDropdown';
import { PlusIcon, WhatsAppIcon } from '../icons';
import { getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import { exportCustomers } from '../../utils/excelExport';
import { importCustomers, downloadCustomerTemplate } from '../../utils/excelImport';

const Customers = memo(({
    customers,
    onSave,
    onDelete,
    orders = [],
    quotes = [],
    meetings = [],
    shipments = [],
    products = [],
    onQuoteSave,
    onOrderSave,
    onShipmentUpdate
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isQuoteViewModalOpen, setIsQuoteViewModalOpen] = useState(false);
    const [isOrderViewModalOpen, setIsOrderViewModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [currentShipment, setCurrentShipment] = useState(null);
    const [isShipmentViewModalOpen, setIsShipmentViewModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [cityFilter, setCityFilter] = useState('Tümü');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, customer: null });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    const handleOpenModal = (customer = null) => {
        setCurrentCustomer(customer);
        setIsModalOpen(true);
    };

    const handleOpenDetailModal = (customer) => {
        setCurrentCustomer(customer);
        setIsDetailModalOpen(true);
    };

    const handleEditFromDetail = () => {
        setIsDetailModalOpen(false);
        setIsModalOpen(true);
    };

    const handleDeleteFromDetail = () => {
        setIsDetailModalOpen(false);
        handleDelete(currentCustomer);
    };



    const handleSave = (customerData) => {
        onSave(customerData);
        setIsModalOpen(false);
    };



    const handleViewOrder = (order) => {
        setCurrentOrder(order);
        setIsDetailModalOpen(false);
        setIsOrderViewModalOpen(true);
    };

    const handleViewQuote = (quote) => {
        setCurrentQuote(quote);
        setIsDetailModalOpen(false);
        setIsQuoteViewModalOpen(true);
    };

    const handleCloseOrderView = () => {
        setIsOrderViewModalOpen(false);
        setIsDetailModalOpen(true);
    };

    const handleCloseQuoteView = () => {
        setIsQuoteViewModalOpen(false);
        setIsDetailModalOpen(true);
    };

    const handleViewShipment = (shipment) => {
        setCurrentShipment(shipment);
        setIsDetailModalOpen(false);
        setIsShipmentViewModalOpen(true);
    };

    const handleCloseShipmentView = () => {
        setIsShipmentViewModalOpen(false);
        setIsDetailModalOpen(true);
    };

    const handleDelete = (customer) => {
        setDeleteConfirm({ isOpen: true, customer });
    };

    const confirmDelete = () => {
        if (deleteConfirm.customer) {
            if (deleteConfirm.customer.id === 'batch') {
                confirmBatchDelete();
            } else {
                onDelete(deleteConfirm.customer.id);
                setDeleteConfirm({ isOpen: false, customer: null });
            }
        }
    };

    // Excel Export/Import handlers
    const handleExport = () => {
        try {
            exportCustomers(customers, {
                filename: `musteriler-${new Date().toISOString().split('T')[0]}.xlsx`,
                includeDeleted: false
            });
            toast.success('Müşteriler Excel dosyasına aktarıldı');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export işlemi başarısız');
        }
    };

    const handleDownloadTemplate = () => {
        try {
            downloadCustomerTemplate();
            toast.success('Şablon dosyası indirildi');
        } catch (error) {
            console.error('Template download error:', error);
            toast.error('Şablon indirme başarısız');
        }
    };

    const handleImportClick = () => {
        setIsImportModalOpen(true);
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Dosya tipi kontrolü
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('Geçersiz dosya formatı. Lütfen Excel veya CSV dosyası seçin.');
            return;
        }

        setIsImporting(true);

        try {
            const { customers: importedCustomers, result } = await importCustomers(file);

            if (result.success) {
                // Başarılı olan müşterileri kaydet
                for (const customer of importedCustomers) {
                    await onSave(customer);
                }

                toast.success(`${result.imported} müşteri başarıyla içe aktarıldı!`);
                setIsImportModalOpen(false);
            } else {
                // Hata varsa göster
                const errorMessage = result.errors.slice(0, 5).map(e => e.message).join('\n');
                toast.error(
                    `Import başarısız:\n${errorMessage}${result.errors.length > 5 ? '\n...' : ''}`,
                    { duration: 6000 }
                );
            }

            // Partial success durumu
            if (result.imported > 0 && result.failed > 0) {
                toast.success(`${result.imported} müşteri eklendi, ${result.failed} hata oluştu`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Import işlemi başarısız: ' + error.message);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
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
        if (selectedItems.size === filteredCustomers.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            customer: { id: 'batch', count: selectedItems.size }
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, customer: null });
    };

    // Determine customer status based on activity
    const getCustomerStatus = (customerId) => {
        const hasActivity = orders.some(o => o.customerId === customerId && !o.isDeleted) ||
                            shipments.some(s => {
                                const order = orders.find(o => o.id === s.orderId);
                                return order && order.customerId === customerId && !order.isDeleted;
                            });
        return hasActivity ? 'Aktif Müşteri' : 'Potansiyel Müşteri';
    };

    const customerStatuses = ['Tümü', 'Aktif Müşteri', 'Potansiyel Müşteri'];
    const cities = ['Tümü', ...new Set(customers.map(c => c.city).filter(Boolean))];

    // Filter customers based on search query, status, and exclude deleted ones
    const filteredCustomers = useMemo(() => {
        const activeCustomers = customers.filter(c => !c.isDeleted);

        return activeCustomers.filter(customer => {
            const query = searchQuery.toLowerCase();
            const status = getCustomerStatus(customer.id);

            const matchesSearch = !searchQuery.trim() ||
                customer.name?.toLowerCase().includes(query) ||
                customer.contact_person?.toLowerCase().includes(query) ||
                customer.phone?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'Tümü' || status === statusFilter;
            const matchesCity = cityFilter === 'Tümü' || customer.city === cityFilter;

            return matchesSearch && matchesStatus && matchesCity;
        });
    }, [customers, searchQuery, statusFilter, cityFilter, orders, quotes, meetings, shipments, getCustomerStatus]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Müşteri Yönetimi</h1>
                <div className="flex gap-3">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Seçili {selectedItems.size} Müşteriyi Sil
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden md:inline">Excel İndir</span>
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="hidden md:inline">Excel Yükle</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        data-action="add-customer"
                        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        Yeni Müşteri
                    </button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <SearchBar
                        placeholder="Müşteri ara (ad, yetkili, telefon, e-posta)..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {customerStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {filteredCustomers.length} müşteri gösteriliyor
                {searchQuery && ` (${customers.filter(c => !c.isDeleted).length} toplam)`}
            </div>

            <div className="overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 hidden md:table-header-group">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={filteredCustomers.length > 0 && selectedItems.size === filteredCustomers.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            {['Müşteri Adı', 'Yetkili Kişi', 'Telefon', 'Şehir', 'Durum', 'İşlemler'].map(head => (
                                <th key={head} className={`p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 ${head === 'İşlemler' ? 'text-right' : ''}`}>
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 md:divide-none">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => {
                                const status = getCustomerStatus(customer.id);
                                const customerActions = [
                                    { label: 'Düzenle', onClick: () => handleOpenModal(customer) },
                                    { label: 'Sil', onClick: () => handleDelete(customer), destructive: true },
                                ];

                                return (
                                    <tr
                                        key={customer.id}
                                        className="block md:table-row border-b md:border-none mb-4 md:mb-0 rounded-lg md:rounded-none shadow md:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <td className="p-3 text-sm block md:table-cell text-center border-b md:border-none">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(customer.id)}
                                                onChange={() => handleSelectItem(customer.id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 font-bold block md:table-cell text-right md:text-left border-b md:border-none">
                                            <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                                Müşteri Adı:{' '}
                                            </span>
                                            <button
                                                onClick={() => handleOpenDetailModal(customer)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-bold"
                                            >
                                                {customer.name}
                                            </button>
                                        </td>
                                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                            <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                                Yetkili Kişi:{' '}
                                            </span>
                                            {customer.contact_person}
                                        </td>
                                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                            <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                                Telefon:{' '}
                                            </span>
                                            <div className="flex items-center gap-2 justify-end md:justify-start">
                                                <span>{customer.phone}</span>
                                                {customer.phone && (
                                                    <a
                                                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.phone)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                                        title="WhatsApp ile mesaj gönder"
                                                    >
                                                        <WhatsAppIcon className="w-5 h-5" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                            <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                                Şehir:{' '}
                                            </span>
                                            {customer.city}
                                        </td>
                                        <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                            <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                                Durum:{' '}
                                            </span>
                                            <span className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(status)}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                            <div className="flex justify-end">
                                                <ActionsDropdown actions={customerActions} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery || statusFilter !== 'Tümü' || cityFilter !== 'Tümü'
                                        ? 'Arama kriterlerine uygun müşteri bulunamadı.'
                                        : 'Henüz müşteri eklenmemiş.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
            >
                <CustomerForm
                    customer={currentCustomer}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <Modal
                show={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Müşteri Detayları"
                maxWidth="max-w-6xl"
            >
                {currentCustomer && (
                    <CustomerDetail
                        customer={currentCustomer}
                        orders={orders}
                        quotes={quotes}
                        meetings={meetings}
                        shipments={shipments}
                        onEdit={handleEditFromDetail}
                        onDelete={handleDeleteFromDetail}
                        onClose={() => setIsDetailModalOpen(false)}
                        onQuoteSave={onQuoteSave}
                        onOrderSave={onOrderSave}
                        products={products}
                        onViewOrder={handleViewOrder}
                        onViewQuote={handleViewQuote}
                        onViewShipment={handleViewShipment}
                    />
                )}
            </Modal>



            <Modal
                show={isOrderViewModalOpen}
                onClose={handleCloseOrderView}
                title="Sipariş Detayı"
                maxWidth="max-w-4xl"
            >
                {currentOrder && (
                    <OrderForm
                        order={currentOrder}
                        onSave={(orderData) => {
                            onOrderSave(orderData);
                            handleCloseOrderView();
                        }}
                        onCancel={handleCloseOrderView}
                        customers={customers}
                        products={products}
                    />
                )}
            </Modal>

            <Modal
                show={isQuoteViewModalOpen}
                onClose={handleCloseQuoteView}
                title="Teklif Detayı"
                maxWidth="max-w-4xl"
            >
                {currentQuote && (
                    <QuoteForm
                        quote={currentQuote}
                        onSave={(quoteData) => {
                            onQuoteSave(quoteData);
                            handleCloseQuoteView();
                        }}
                        onCancel={handleCloseQuoteView}
                        customers={customers}
                        products={products}
                    />
                )}
            </Modal>

            <Modal
                show={isShipmentViewModalOpen}
                onClose={handleCloseShipmentView}
                title="Sevkiyat Detayı"
                maxWidth="max-w-lg"
            >
                {currentShipment && (() => {
                    const order = orders.find(o => o.id === currentShipment.orderId);
                    const customer = customers.find(c => c.id === order?.customerId);
                    return (
                        <ShipmentDetail
                            shipment={currentShipment}
                            order={order}
                            customer={customer}
                        />
                    );
                })()}
            </Modal>

            {/* Import Modal */}
            <Modal
                show={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Excel'den Müşteri İçe Aktar"
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Nasıl kullanılır?</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            <li>Şablon dosyasını indirin</li>
                            <li>Excel'de doldurun</li>
                            <li>Dosyayı yükleyin</li>
                        </ol>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Şablon Dosyasını İndir
                        </button>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                disabled={isImporting}
                                className="hidden"
                                id="file-input"
                            />
                            <label
                                htmlFor="file-input"
                                className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-gray-600 dark:text-gray-300 mb-1">
                                    {isImporting ? 'İçe aktarılıyor...' : 'Excel dosyası seçmek için tıklayın'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    .xlsx, .xls veya .csv formatında
                                </p>
                            </label>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Önemli Notlar</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                            <li>Telefon numaraları 05XX XXX XXXX formatında olmalı</li>
                            <li>E-posta adresleri geçerli formatta olmalı</li>
                            <li>Müşteri Adı ve Telefon zorunlu alanlardır</li>
                            <li>Hatalı satırlar atlanacaktır</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, customer: null })}
                onConfirm={confirmDelete}
                title={deleteConfirm.customer?.id === 'batch' ? 'Toplu Silme' : 'Müşteriyi Sil'}
                message={
                    deleteConfirm.customer?.id === 'batch'
                        ? `Seçili ${deleteConfirm.customer?.count} müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                        : `"${deleteConfirm.customer?.name}" müşterisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                }
            />
        </div>
    );
});

Customers.displayName = 'Customers';

export default Customers;
