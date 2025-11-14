import React, { useState, useMemo, memo, ChangeEvent, FormEvent } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import SearchBar from '../common/SearchBar';
import ActionsDropdown from '../common/ActionsDropdown';
import MobileListItem from '../common/MobileListItem';
import MobileActions from '../common/MobileActions';
import SkeletonTable from '../common/SkeletonTable';
import { formatDate, getStatusClass } from '../../utils/formatters';
import type { Shipment, Order, Product, Customer } from '../../types';

interface ShipmentFormData {
    shipment_date: string;
    transporter: string;
    notes: string;
    isInvoiced: boolean;
    invoiceNotes: string;
}

interface ShipmentEditFormProps {
    shipment: Shipment;
    orders?: Order[];
    shipments?: Shipment[];
    onSave: (shipment: Partial<Shipment>) => void;
    onCancel: () => void;
    readOnly?: boolean;
}

const ShipmentEditForm: React.FC<ShipmentEditFormProps> = ({ shipment, orders = [], shipments = [], onSave, onCancel, readOnly = false }) => {
    const [formData, setFormData] = useState<ShipmentFormData>({
        shipment_date: shipment.shipment_date || '',
        transporter: shipment.transporter || '',
        notes: shipment.notes || '',
        isInvoiced: shipment.isInvoiced || false,
        invoiceNotes: shipment.invoiceNotes || ''
    });

    // Find the order related to this shipment
    const relatedOrder = orders.find(o => o.id === shipment.orderId);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.transporter.trim()) {
            toast.error('Lütfen nakliye firması giriniz!');
            return;
        }

        const updatedShipment: Partial<Shipment> = {
            ...shipment,
            ...formData,
            // Fatura kesildi işaretlenmişse ve daha önce işaretlenmemişse, tarihi kaydet
            invoicedAt: formData.isInvoiced && !shipment.isInvoiced
                ? new Date().toISOString()
                : shipment.invoicedAt
        };

        onSave(updatedShipment);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Sevkiyat Bilgileri</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nakliye Firması *
                        </label>
                        <input
                            type="text"
                            name="transporter"
                            value={formData.transporter}
                            onChange={handleChange}
                            placeholder="Örn: MNG Kargo, Aras Kargo"
                            required
                            disabled={readOnly}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sevk Tarihi *
                        </label>
                        <input
                            type="date"
                            name="shipment_date"
                            value={formData.shipment_date}
                            onChange={handleChange}
                            required
                            disabled={readOnly}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Özel Notlar
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Sevkiyat ile ilgili özel notlar..."
                            disabled={readOnly}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Fatura Durumu */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isInvoiced"
                                name="isInvoiced"
                                checked={formData.isInvoiced}
                                onChange={handleCheckboxChange}
                                disabled={readOnly}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="isInvoiced" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fatura kesildi
                            </label>
                            {formData.isInvoiced && shipment.invoicedAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({formatDate(shipment.invoicedAt)})
                                </span>
                            )}
                        </div>

                        {formData.isInvoiced && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fatura Notu
                                </label>
                                <input
                                    type="text"
                                    name="invoiceNotes"
                                    value={formData.invoiceNotes}
                                    onChange={handleChange}
                                    placeholder="Fatura no, ek bilgiler..."
                                    disabled={readOnly}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipment Items */}
            {shipment.items && shipment.items.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Sevk Edilen Ürünler</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Ürün Adı</th>
                                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Sipariş</th>
                                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Bu Sevkiyat</th>
                                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Sevk</th>
                                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Kalan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {shipment.items.map((item, index) => {
                                    // Find ordered quantity from the order
                                    const orderedQty = relatedOrder?.items?.find(oi => oi.productId === item.productId)?.quantity || 0;

                                    // Calculate total shipped quantity for this product (from all shipments of this order)
                                    const totalShippedQty = shipments
                                        .filter(s => s.orderId === shipment.orderId && !s.isDeleted)
                                        .reduce((sum, s) => {
                                            const shipmentItem = s.items?.find(si => si.productId === item.productId);
                                            return sum + (shipmentItem?.quantity || 0);
                                        }, 0);

                                    const remainingQty = orderedQty - totalShippedQty;

                                    const unit = item.unit || 'Adet';
                                    return (
                                        <tr key={index}>
                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{item.productName}</td>
                                            <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">{orderedQty} {unit}</td>
                                            <td className="px-3 py-2 text-sm text-center text-blue-600 dark:text-blue-400 font-semibold">{item.quantity} {unit}</td>
                                            <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">{totalShippedQty} {unit}</td>
                                            <td className={`px-3 py-2 text-sm text-center font-semibold ${remainingQty > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                {remainingQty} {unit}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                    {readOnly ? 'Kapat' : 'İptal'}
                </button>
                {!readOnly && (
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Kaydet
                    </button>
                )}
            </div>
        </form>
    );
};

interface ShipmentFilters {
    status: string;
    dateRange: string;
    customer: string;
}

interface DeleteConfirmState {
    isOpen: boolean;
    shipment: (Shipment & { count?: number }) | null;
}

interface ShipmentsProps {
    /** List of shipments */
    shipments: Shipment[];
    /** List of orders */
    orders?: Order[];
    /** List of products */
    products?: Product[];
    /** List of customers */
    customers?: Customer[];
    /** Callback when shipment is delivered */
    onDelivery: (shipmentId: string) => void;
    /** Callback when shipment is updated */
    onUpdate: (shipment: Partial<Shipment>) => void;
    /** Callback when shipment is deleted */
    onDelete: (id: string) => void;
    /** Loading state */
    loading?: boolean;
}

/**
 * Shipments component - Shipment management page
 */
const Shipments = memo<ShipmentsProps>(({ shipments, orders = [], products = [], customers = [], onDelivery, onUpdate, onDelete, loading = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, shipment: null });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ShipmentFilters>({
        status: 'Tümü',
        dateRange: 'Tümü',
        customer: 'Tümü'
    });
    const [sortBy, setSortBy] = useState<'shipment_date' | 'status' | 'customer'>('shipment_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleDelivery = (shipmentId: string) => {
        onDelivery(shipmentId);
    };

    // Helper functions for quick status updates
    const getNextStatusIcon = (currentStatus: string) => {
        switch (currentStatus) {
            case 'Hazırlanıyor': return '🚚';
            case 'Yolda': return '✅';
            case 'Dağıtımda': return '✅';
            default: return '→';
        }
    };

    const getNextStatusText = (currentStatus: string) => {
        switch (currentStatus) {
            case 'Hazırlanıyor': return 'Yola Çıkar';
            case 'Yolda': return 'Teslim Et';
            case 'Dağıtımda': return 'Teslim Et';
            default: return 'İlerlet';
        }
    };

    const handleQuickStatusUpdate = (shipment: Shipment) => {
        let nextStatus: string;
        switch (shipment.status) {
            case 'Hazırlanıyor':
                nextStatus = 'Yolda';
                onUpdate({ ...shipment, status: nextStatus });
                toast.success('Sevkiyat yola çıktı!');
                break;
            case 'Yolda':
            case 'Dağıtımda':
                handleDelivery(shipment.id);
                return;
            default:
                return;
        }
    };

    const handleOpenModal = (shipment: Shipment) => {
        setCurrentShipment(shipment);
        setIsModalOpen(true);
    };

    const handleSave = (shipmentData: Partial<Shipment>) => {
        onUpdate(shipmentData);
        setIsModalOpen(false);
        setCurrentShipment(null);
    };

    const handleDelete = (shipment: Shipment) => {
        setDeleteConfirm({ isOpen: true, shipment });
    };

    const confirmDelete = () => {
        if (deleteConfirm.shipment) {
            if (deleteConfirm.shipment.id === 'batch') {
                confirmBatchDelete();
            } else {
                onDelete(deleteConfirm.shipment.id);
                setDeleteConfirm({ isOpen: false, shipment: null });
            }
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
        if (selectedItems.size === filteredAndSortedShipments.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredAndSortedShipments.map(s => s.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            shipment: { id: 'batch', count: selectedItems.size } as any
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, shipment: null });
    };

    const activeShipments = shipments.filter(s => !s.isDeleted);

    // Apply filters, search, and sorting
    const filteredAndSortedShipments = useMemo(() => {
        return activeShipments.filter(shipment => {
            const order = orders.find(o => o.id === shipment.orderId);
            const customer = customers.find(c => c.id === order?.customerId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    customer?.name?.toLowerCase().includes(query) ||
                    shipment.transporter?.toLowerCase().includes(query) ||
                    shipment.trackingNumber?.toLowerCase().includes(query);

                if (!matchesSearch) return false;
            }

            // Status filter
            if (filters.status !== 'Tümü' && shipment.status !== filters.status) {
                return false;
            }

            // Date range filter
            if (filters.dateRange !== 'Tümü') {
                const shipmentDate = new Date(shipment.shipment_date);
                shipmentDate.setHours(0, 0, 0, 0);

                if (filters.dateRange === 'Bugün') {
                    if (shipmentDate.getTime() !== today.getTime()) return false;
                } else if (filters.dateRange === 'Bu Hafta') {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    if (shipmentDate < weekAgo || shipmentDate > today) return false;
                } else if (filters.dateRange === 'Bu Ay') {
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    if (shipmentDate < monthStart || shipmentDate > today) return false;
                }
            }

            // Customer filter
            if (filters.customer !== 'Tümü' && customer?.id !== filters.customer) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            let comparison = 0;

            if (sortBy === 'shipment_date') {
                comparison = new Date(a.shipment_date).getTime() - new Date(b.shipment_date).getTime();
            } else if (sortBy === 'status') {
                comparison = (a.status || '').localeCompare(b.status || '');
            } else if (sortBy === 'customer') {
                const orderA = orders.find(o => o.id === a.orderId);
                const orderB = orders.find(o => o.id === b.orderId);
                const customerA = customers.find(c => c.id === orderA?.customerId)?.name || '';
                const customerB = customers.find(c => c.id === orderB?.customerId)?.name || '';
                comparison = customerA.localeCompare(customerB);
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [activeShipments, searchQuery, filters, sortBy, sortOrder, orders, customers]);

    // Show skeleton when loading
    if (loading) {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sevkiyat Yönetimi</h1>
                </div>
                {/* Desktop: Table skeleton */}
                <div className="hidden md:block">
                    <SkeletonTable rows={10} columns={7} />
                </div>
                {/* Mobile: Card skeleton */}
                <div className="md:hidden">
                    <SkeletonTable rows={10} columns={7} mobileCardView={true} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Sevkiyat Yönetimi</h1>
                {selectedItems.size > 0 && (
                    <button
                        onClick={handleBatchDelete}
                        className="flex items-center flex-1 sm:flex-none bg-red-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-600 w-full sm:w-auto"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Seçili {selectedItems.size} Sevkiyatı Sil</span>
                        <span className="sm:hidden">Sil ({selectedItems.size})</span>
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <SearchBar
                    placeholder="Müşteri, nakliye firması veya takip no ara..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />
            </div>

            {/* Filters and Sorting */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option>Tümü</option>
                            <option>Hazırlanıyor</option>
                            <option>Yolda</option>
                            <option>Teslim Edildi</option>
                            <option>İptal Edildi</option>
                            <option>İade Edildi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih</label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option>Tümü</option>
                            <option>Bugün</option>
                            <option>Bu Hafta</option>
                            <option>Bu Ay</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Müşteri</label>
                        <select
                            value={filters.customer}
                            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option>Tümü</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sıralama</label>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="shipment_date">Sevk Tarihi</option>
                                <option value="status">Durum</option>
                                <option value="customer">Müşteri</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                                title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {filteredAndSortedShipments.length} sevkiyat gösteriliyor
                    {filteredAndSortedShipments.length !== activeShipments.length && ` (${activeShipments.length} toplam)`}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={filteredAndSortedShipments.length > 0 && selectedItems.size === filteredAndSortedShipments.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">Sipariş No</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">Müşteri</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">Nakliye Firması</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">Sevk Tarihi</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">Durum</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">Fatura</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-right text-gray-700 dark:text-gray-300">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredAndSortedShipments.length > 0 ? filteredAndSortedShipments.map(shipment => {
                            const order = orders.find(o => o.id === shipment.orderId);
                            const customer = customers.find(c => c.id === order?.customerId);

                            return (
                                <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(shipment.id)}
                                            onChange={() => handleSelectItem(shipment.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-3 text-sm text-blue-600 dark:text-blue-400 font-mono">
                                        #{order?.id?.slice(-6) || 'N/A'}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100 font-bold">{customer?.name || 'Bilinmeyen Müşteri'}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{shipment.transporter}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(shipment.shipment_date)}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(shipment.status)}`}>
                                            {shipment.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-center">
                                        {shipment.isInvoiced ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded">
                                                    ✅ Kesildi
                                                </span>
                                                {shipment.invoiceNotes && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400" title={shipment.invoiceNotes}>
                                                        {shipment.invoiceNotes.length > 15 ? shipment.invoiceNotes.substring(0, 15) + '...' : shipment.invoiceNotes}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-semibold rounded">
                                                ❌ Yok
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Hızlı Durum Değiştirme - Sadece aktif sevkiyatlar için */}
                                            {shipment.status !== 'Teslim Edildi' && shipment.status !== 'İptal Edildi' && shipment.status !== 'İade Edildi' && (
                                                <button
                                                    onClick={() => handleQuickStatusUpdate(shipment)}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm whitespace-nowrap"
                                                    title={`${getNextStatusText(shipment.status)}`}
                                                >
                                                    <span className="mr-1">{getNextStatusIcon(shipment.status)}</span>
                                                    {getNextStatusText(shipment.status)}
                                                </button>
                                            )}

                                            {/* Detay Butonu */}
                                            <button
                                                onClick={() => handleOpenModal(shipment)}
                                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Detay Görüntüle"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>

                                            {/* Dropdown Menü */}
                                            <ActionsDropdown
                                                actions={[
                                                    {
                                                        label: shipment.status === 'Teslim Edildi' ? 'Görüntüle' : 'Düzenle',
                                                        onClick: () => handleOpenModal(shipment)
                                                    },
                                                    {
                                                        label: 'Sil',
                                                        onClick: () => handleDelete(shipment),
                                                        destructive: true
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü'
                                        ? 'Arama kriterine uygun sevkiyat bulunamadı.'
                                        : 'Henüz sevkiyat eklenmemiş.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredAndSortedShipments.length > 0 ? filteredAndSortedShipments.map(shipment => {
                    const order = orders.find(o => o.id === shipment.orderId);
                    const customer = customers.find(c => c.id === order?.customerId);

                    return (
                        <MobileListItem
                            key={shipment.id}
                            title={customer?.name || 'Bilinmeyen Müşteri'}
                            subtitle={`Sipariş #${order?.id?.slice(-6) || 'N/A'} • ${formatDate(shipment.shipment_date)}`}
                            onClick={() => handleOpenModal(shipment)}
                            rightContent={
                                <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(shipment.status)}`}>
                                    {shipment.status}
                                </span>
                            }
                            bottomContent={
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Nakliye Firması:</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-medium">{shipment.transporter}</span>
                                    </div>
                                    {shipment.trackingNumber && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400">Takip No:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{shipment.trackingNumber}</span>
                                        </div>
                                    )}
                                    {shipment.notes && (
                                        <div className="flex items-start justify-between py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Notlar:</span>
                                            <span className="text-gray-900 dark:text-gray-100 text-right flex-1 ml-2">{shipment.notes}</span>
                                        </div>
                                    )}
                                </div>
                            }
                            actions={
                                <div className="space-y-2 mt-3">
                                    {shipment.status !== 'Teslim Edildi' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelivery(shipment.id);
                                            }}
                                            className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Teslim Edildi Olarak İşaretle
                                        </button>
                                    )}
                                    <MobileActions
                                        actions={[
                                            {
                                                label: shipment.status === 'Teslim Edildi' ? 'Görüntüle' : 'Düzenle',
                                                onClick: (e) => {
                                                    e?.stopPropagation();
                                                    handleOpenModal(shipment);
                                                },
                                                variant: 'primary'
                                            },
                                            {
                                                label: 'Sil',
                                                onClick: (e) => {
                                                    e?.stopPropagation();
                                                    handleDelete(shipment);
                                                },
                                                variant: 'danger'
                                            }
                                        ]}
                                    />
                                </div>
                            }
                        />
                    );
                }) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü'
                                ? 'Arama kriterine uygun sevkiyat bulunamadı.'
                                : 'Henüz sevkiyat eklenmemiş.'}
                        </p>
                    </div>
                )}
            </div>

            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentShipment?.status === 'Teslim Edildi' ? 'Sevkiyat Detayları' : 'Sevkiyat Düzenle'}
            >
                {currentShipment && (
                    <ShipmentEditForm
                        shipment={currentShipment}
                        orders={orders}
                        products={products}
                        shipments={shipments}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                    />
                )}
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, shipment: null })}
                onConfirm={confirmDelete}
                title={deleteConfirm.shipment?.id === 'batch' ? 'Toplu Silme' : 'Sevkiyatı Sil'}
                message={
                    deleteConfirm.shipment?.id === 'batch'
                        ? `Seçili ${deleteConfirm.shipment?.count} sevkiyatı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                        : 'Bu sevkiyatı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
                }
            />
        </div>
    );
});

Shipments.displayName = 'Shipments';

export default Shipments;
