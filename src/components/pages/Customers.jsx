import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomerForm from '../forms/CustomerForm';
import CustomerDetail from './CustomerDetail';
import QuoteForm from '../forms/QuoteForm';
import OrderForm from '../forms/OrderForm';
import SearchBar from '../common/SearchBar';
import { PlusIcon, WhatsAppIcon } from '../icons';
import { getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';

const Customers = ({
    customers,
    onSave,
    onDelete,
    orders = [],
    quotes = [],
    meetings = [],
    shipments = [],
    products = [],
    onQuoteSave,
    onOrderSave
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isQuoteViewModalOpen, setIsQuoteViewModalOpen] = useState(false);
    const [isOrderViewModalOpen, setIsOrderViewModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, customer: null });
    const [selectedItems, setSelectedItems] = useState(new Set());

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

    const handleCreateQuoteFromDetail = () => {
        setIsDetailModalOpen(false);
        setIsQuoteModalOpen(true);
    };

    const handleCreateOrderFromDetail = () => {
        setIsDetailModalOpen(false);
        setIsOrderModalOpen(true);
    };

    const handleSave = (customerData) => {
        onSave(customerData);
        setIsModalOpen(false);
    };

    const handleQuoteSave = (quoteData) => {
        // Ensure customer is set
        const finalQuoteData = {
            ...quoteData,
            customerId: currentCustomer.id
        };
        onQuoteSave(finalQuoteData);
        setIsQuoteModalOpen(false);
        setIsDetailModalOpen(true); // Return to detail view
    };

    const handleOrderSave = (orderData) => {
        // Ensure customer is set
        const finalOrderData = {
            ...orderData,
            customerId: currentCustomer.id
        };
        onOrderSave(finalOrderData);
        setIsOrderModalOpen(false);
        setIsDetailModalOpen(true); // Return to detail view
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
                            quotes.some(q => q.customerId === customerId && !q.isDeleted) ||
                            meetings.some(m => m.customerId === customerId && !m.isDeleted) ||
                            shipments.some(s => {
                                const order = orders.find(o => o.id === s.orderId);
                                return order && order.customerId === customerId && !order.isDeleted;
                            });
        return hasActivity ? 'Aktif Müşteri' : 'Potansiyel Müşteri';
    };

    const customerStatuses = ['Tümü', 'Aktif Müşteri', 'Potansiyel Müşteri'];

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

            return matchesSearch && matchesStatus;
        });
    }, [customers, searchQuery, statusFilter, orders, quotes, meetings, shipments]);

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
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        Yeni Müşteri
                    </button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
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
                            {['Müşteri Adı', 'Yetkili Kişi', 'Telefon', 'E-posta', 'Durum', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 md:divide-none">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => {
                                const status = getCustomerStatus(customer.id);
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
                                                E-posta:{' '}
                                            </span>
                                            {customer.email}
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
                                            <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                                İşlemler:{' '}
                                            </span>
                                            <div className="flex flex-wrap gap-2 justify-end md:justify-start">
                                                <button
                                                    onClick={() => handleOpenModal(customer)}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer)}
                                                    className="text-red-500 hover:underline"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery || statusFilter !== 'Tümü'
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
                        onCreateQuote={handleCreateQuoteFromDetail}
                        onCreateOrder={handleCreateOrderFromDetail}
                        onViewOrder={handleViewOrder}
                        onViewQuote={handleViewQuote}
                    />
                )}
            </Modal>

            <Modal
                show={isQuoteModalOpen}
                onClose={() => {
                    setIsQuoteModalOpen(false);
                    setIsDetailModalOpen(true);
                }}
                title="Yeni Teklif Oluştur"
            >
                {currentCustomer && (
                    <QuoteForm
                        quote={{ customerId: currentCustomer.id }}
                        onSave={handleQuoteSave}
                        onCancel={() => {
                            setIsQuoteModalOpen(false);
                            setIsDetailModalOpen(true);
                        }}
                        customers={customers}
                        products={products}
                    />
                )}
            </Modal>

            <Modal
                show={isOrderModalOpen}
                onClose={() => {
                    setIsOrderModalOpen(false);
                    setIsDetailModalOpen(true);
                }}
                title="Yeni Sipariş Oluştur"
            >
                {currentCustomer && (
                    <OrderForm
                        order={{ customerId: currentCustomer.id }}
                        onSave={handleOrderSave}
                        onCancel={() => {
                            setIsOrderModalOpen(false);
                            setIsDetailModalOpen(true);
                        }}
                        customers={customers}
                        products={products}
                    />
                )}
            </Modal>

            <Modal
                show={isOrderViewModalOpen}
                onClose={handleCloseOrderView}
                title="Sipariş Detayı"
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
};

export default Customers;
