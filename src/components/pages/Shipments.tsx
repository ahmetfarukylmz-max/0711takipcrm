import React, { useState, useMemo, memo, ChangeEvent, FormEvent } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import SearchBar from '../common/SearchBar';
import ActionsDropdown from '../common/ActionsDropdown';
import MobileListItem from '../common/MobileListItem';
import MobileActions from '../common/MobileActions';
import SkeletonTable from '../common/SkeletonTable';
import EmptyState from '../common/EmptyState';
import { PlusIcon } from '../icons';
import { formatDate, getStatusClass } from '../../utils/formatters';
import { getShortOrderNumber } from '../../utils/numberFormatters';
import type { Shipment, Order, Product, Customer } from '../../types';

interface ShipmentFormData {
    shipment_date: string;
    carrier: string;
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
        carrier: shipment.carrier || (shipment as any).transporter || '',
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

        if (!formData.carrier.trim()) {
            toast.error('Lütfen nakliye firması giriniz!');
            return;
        }

        const updatedShipment: Partial<Shipment> = {
            ...shipment,
            // If readOnly (Delivered), only update invoice fields
            ...(readOnly ? {} : {
                shipment_date: formData.shipment_date,
                carrier: formData.carrier,
                notes: formData.notes,
            }),
            isInvoiced: formData.isInvoiced,
            invoiceNotes: formData.invoiceNotes,
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
                {readOnly && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg border border-blue-200 dark:border-blue-800">
                        ℹ️ Bu sevkiyat teslim edildiği için sadece fatura bilgileri güncellenebilir.
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nakliye Firması *
                        </label>
                        <input
                            type="text"
                            name="carrier"
                            value={formData.carrier}
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

                    {/* Fatura Durumu - Always Editable */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isInvoiced"
                                name="isInvoiced"
                                checked={formData.isInvoiced}
                                onChange={handleCheckboxChange}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="isInvoiced" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
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
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                                    // Find ordered quantity from the order using orderItemIndex
                                    const orderItemIndex = item.orderItemIndex ?? index; // Fallback to index for backward compatibility
                                    const orderItem = relatedOrder?.items?.[orderItemIndex];
                                    const orderedQty = orderItem?.quantity || 0;

                                    // Calculate total shipped quantity for THIS SPECIFIC order item (by index)
                                    const totalShippedQty = shipments
                                        .filter(s => s.orderId === shipment.orderId && !s.isDeleted)
                                        .reduce((sum, s) => {
                                            const shipmentItem = s.items?.find(si =>
                                                si.productId === item.productId &&
                                                (si.orderItemIndex !== undefined ? si.orderItemIndex === orderItemIndex : true)
                                            );
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
                
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    {readOnly ? 'Fatura Bilgisini Kaydet' : 'Kaydet'}
                </button>
            </div>
        </form>
    );
};

interface ShipmentFilters {
    status: string;
    dateRange: string;
    customer: string;
    invoice: string;
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
    // Bulk Invoice State
    const [isBulkInvoiceModalOpen, setIsBulkInvoiceModalOpen] = useState(false);
    const [bulkInvoiceData, setBulkInvoiceData] = useState({ invoiceDate: new Date().toISOString().split('T')[0], invoiceNo: '' });

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ShipmentFilters>({
        status: 'Tümü',
        dateRange: 'Tümü',
        customer: 'Tümü',
        invoice: 'Tümü'
    });
    const [sortBy, setSortBy] = useState<'shipment_date' | 'status' | 'customer'>('shipment_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleDelivery = (shipmentId: string) => {
        onDelivery(shipmentId);
    };

    // Bulk Invoice Handlers
    const handleBatchInvoice = () => {
        setBulkInvoiceData({ invoiceDate: new Date().toISOString().split('T')[0], invoiceNo: '' });
        setIsBulkInvoiceModalOpen(true);
    };

    const confirmBatchInvoice = () => {
        const selectedShipments = activeShipments.filter(s => selectedItems.has(s.id));
        
        // Update each selected shipment
        selectedShipments.forEach(shipment => {
            if (!shipment.isInvoiced) { // Only update if not already invoiced (or force update?) - let's just update
                onUpdate({
                    ...shipment,
                    isInvoiced: true,
                    invoicedAt: new Date(bulkInvoiceData.invoiceDate).toISOString(),
                    invoiceNotes: bulkInvoiceData.invoiceNo ? `${bulkInvoiceData.invoiceNo}` : shipment.invoiceNotes
                });
            }
        });

        toast.success(`${selectedItems.size} adet sevkiyat faturalandı olarak işaretlendi.`);
        setIsBulkInvoiceModalOpen(false);
        setSelectedItems(new Set()); // Clear selection
    };

    const handlePrintDeliveryNote = (shipment: Shipment) => {
        const order = orders.find(o => o.id === shipment.orderId);
        const customer = customers.find(c => c.id === order?.customerId);

        if (!order || !customer) {
            toast.error('Sipariş veya müşteri bilgisi bulunamadı!');
            return;
        }

        const companyInfo = {
            name: 'AKÇELİK METAL SANAYİ',
            address: 'Küçükbalıklı mh. 11 Eylül Bulvarı No:208/A Osmangazi/Bursa',
            phone: '+90 0224 256 86 56',
            email: 'satis@akcelik-grup.com',
            logoUrl: 'https://i.ibb.co/rGFcQ4GB/logo-Photoroom.png',
        };

        const itemsHtml = (shipment.items || []).map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const isEven = index % 2 === 0;
            
            // Calculate quantities
            const orderItemIndex = item.orderItemIndex ?? index;
            const orderItem = order.items?.[orderItemIndex];
            const orderedQty = orderItem?.quantity || 0;

            // Calculate total shipped quantity for THIS SPECIFIC order item (by index)
            const totalShippedQty = shipments
                .filter(s => s.orderId === shipment.orderId && !s.isDeleted)
                .reduce((sum, s) => {
                    const shipmentItem = s.items?.find(si =>
                        si.productId === item.productId &&
                        (si.orderItemIndex !== undefined ? si.orderItemIndex === orderItemIndex : true)
                    );
                    return sum + (shipmentItem?.quantity || 0);
                }, 0);

            const remainingQty = Math.max(0, orderedQty - totalShippedQty);
            const unit = item.unit || 'Adet';

            return `
                <tr class="border-b border-gray-200 ${isEven ? 'bg-gray-50' : 'bg-white'}">
                    <td class="py-2 px-3 text-center text-gray-500 text-xs">${index + 1}</td>
                    <td class="py-2 px-3 text-sm text-gray-900">${product?.name || item.productName || 'Bilinmeyen Ürün'}</td>
                    <td class="py-2 px-3 text-center text-sm text-gray-700">${orderedQty} ${unit}</td>
                    <td class="py-2 px-3 text-center text-sm font-bold text-gray-900 bg-gray-100">${item.quantity} ${unit}</td>
                    <td class="py-2 px-3 text-center text-sm text-gray-700">${remainingQty} ${unit}</td>
                </tr>
            `;
        }).join('');

        const printContent = `
            <html>
            <head>
                <title>İrsaliye ${shipment.id}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                        @page { margin: 1cm; }
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
                                <h2 class="text-3xl font-bold text-gray-900 mb-3">SEVK İRSALİYESİ</h2>
                                <div class="text-xs text-gray-600 space-y-1">
                                    <p><span class="font-semibold">Sevk Tarihi:</span> ${formatDate(shipment.shipment_date)}</p>
                                    <p><span class="font-semibold">Sipariş No:</span> ${getShortOrderNumber(order)}</p>
                                    <p><span class="font-semibold">Nakliye:</span> ${shipment.carrier || (shipment as any).transporter}</p>
                                    ${shipment.trackingNumber ? `<p><span class="font-semibold">Takip No:</span> ${shipment.trackingNumber}</p>` : ''}
                                </div>
                            </div>
                        </header>

                        <section class="mt-6">
                            <h3 class="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Müşteri Bilgileri</h3>
                            <div class="border border-gray-300 p-3 text-xs">
                                <p class="font-bold text-gray-900">${customer.name}</p>
                                <p class="text-gray-600">${customer.address || ''}, ${customer.city || ''}</p>
                                <p class="text-gray-600">Tel: ${customer.phone || ''} ${customer.email ? '| E-posta: ' + customer.email : ''}</p>
                                ${customer.taxOffice || customer.taxNumber ? `<p class="text-gray-600 mt-1">${customer.taxOffice ? 'Vergi Dairesi: ' + customer.taxOffice : ''} ${customer.taxOffice && customer.taxNumber ? '|' : ''} ${customer.taxNumber ? 'Vergi No: ' + customer.taxNumber : ''}</p>` : ''}
                            </div>
                        </section>

                        <section class="mt-6">
                            <table class="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr class="bg-gray-900 text-white">
                                        <th class="py-2 px-3 text-center text-xs font-semibold border-r border-gray-700">#</th>
                                        <th class="py-2 px-3 text-left text-xs font-semibold border-r border-gray-700">Ürün</th>
                                        <th class="py-2 px-3 text-center text-xs font-semibold border-r border-gray-700">Sipariş</th>
                                        <th class="py-2 px-3 text-center text-xs font-semibold border-r border-gray-700">Sevk Edilen</th>
                                        <th class="py-2 px-3 text-center text-xs font-semibold">Kalan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </section>

                        ${shipment.notes ? `
                        <section class="mt-6 border border-gray-300 p-3">
                            <h3 class="text-xs font-semibold text-gray-900 mb-2 uppercase">Özel Notlar</h3>
                            <p class="text-xs text-gray-600 whitespace-pre-wrap">${shipment.notes}</p>
                        </section>
                        ` : ''}

                        <section class="grid grid-cols-2 gap-12 mt-12 border-t border-gray-300 pt-8">
                            <div class="text-center">
                                <h4 class="font-bold text-gray-900 mb-12">TESLİM EDEN</h4>
                                <div class="border-t border-gray-300 mx-8 pt-2">
                                    <p class="text-xs text-gray-500">İmza / Kaşe</p>
                                </div>
                            </div>
                            <div class="text-center">
                                <h4 class="font-bold text-gray-900 mb-12">TESLİM ALAN</h4>
                                <div class="border-t border-gray-300 mx-8 pt-2">
                                    <p class="text-xs text-gray-500">İmza / Kaşe</p>
                                    <p class="text-xs text-gray-400 mt-1">Malzemeleri eksiksiz ve hasarsız teslim aldım.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div class="text-center mt-6 no-print">
                    <button onclick="window.print()" class="bg-gray-900 text-white px-6 py-2 hover:bg-gray-800 text-sm font-medium rounded shadow">
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

    const handleRevertStatus = (shipment: Shipment) => {
        let previousStatus: string;
        switch (shipment.status) {
            case 'Teslim Edildi':
                previousStatus = 'Yolda';
                onUpdate({ ...shipment, status: previousStatus });
                toast.success('Sevkiyat durumu "Yolda" olarak güncellendi!');
                break;
            case 'Yolda':
                previousStatus = 'Hazırlanıyor';
                onUpdate({ ...shipment, status: previousStatus });
                toast.success('Sevkiyat durumu "Hazırlanıyor" olarak güncellendi!');
                break;
            default:
                toast.error('Bu durum geri alınamaz!');
                return;
        }
    };

    const handleCancelShipment = (shipment: Shipment) => {
        onUpdate({ ...shipment, status: 'İptal Edildi' });
        toast.success('Sevkiyat iptal edildi!');
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
                const carrierField = shipment.carrier || (shipment as any).transporter || '';
                const matchesSearch =
                    customer?.name?.toLowerCase().includes(query) ||
                    carrierField.toLowerCase().includes(query) ||
                    shipment.trackingNumber?.toLowerCase().includes(query);

                if (!matchesSearch) return false;
            }

            // Status filter
            if (filters.status !== 'Tümü' && shipment.status !== filters.status) {
                return false;
            }

            // Invoice Status filter
            if (filters.invoice !== 'Tümü') {
                if (filters.invoice === 'Faturalananlar' && !shipment.isInvoiced) return false;
                if (filters.invoice === 'Fatura Bekleyenler' && shipment.isInvoiced) return false;
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
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleBatchInvoice}
                            className="flex items-center justify-center flex-1 sm:flex-none bg-green-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-green-700 w-full sm:w-auto"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Seçilileri Faturalandır</span>
                            <span className="sm:hidden">Fatura ({selectedItems.size})</span>
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center justify-center flex-1 sm:flex-none bg-red-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-600 w-full sm:w-auto"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Sil</span>
                            <span className="sm:hidden">Sil ({selectedItems.size})</span>
                        </button>
                    </div>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fatura Durumu</label>
                        <select
                            value={filters.invoice}
                            onChange={(e) => setFilters({ ...filters, invoice: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="Tümü">Tümü</option>
                            <option value="Fatura Bekleyenler">Fatura Bekleyenler</option>
                            <option value="Faturalananlar">Faturalananlar</option>
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
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {filteredAndSortedShipments.length} sevkiyat gösteriliyor
                    {filteredAndSortedShipments.length !== activeShipments.length && ` (${activeShipments.length} toplam)`}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <colgroup>
                        <col style={{ width: '40px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '120px' }} />
                    </colgroup>
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={filteredAndSortedShipments.length > 0 && selectedItems.size === filteredAndSortedShipments.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">Sipariş No</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">Müşteri</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">Nakliye Firması</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">Sevk Tarihi</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">Durum</th>
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
                                    <td className="p-3 text-sm text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(shipment.id)}
                                            onChange={() => handleSelectItem(shipment.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-3 text-sm text-left text-blue-600 dark:text-blue-400 font-mono">
                                        {getShortOrderNumber(order)}
                                    </td>
                                    <td className="p-3 text-sm text-center text-gray-900 dark:text-gray-100 font-bold">{customer?.name || 'Bilinmeyen Müşteri'}</td>
                                    <td className="p-3 text-sm text-center text-gray-700 dark:text-gray-300">{shipment.carrier || (shipment as any).transporter}</td>
                                    <td className="p-3 text-sm text-center text-gray-700 dark:text-gray-300">{formatDate(shipment.shipment_date)}</td>
                                    <td className="p-3 text-sm text-center">
                                        <span className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg whitespace-nowrap ${getStatusClass(shipment.status)}`}>
                                            {shipment.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-center">
                                        {shipment.isInvoiced ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded whitespace-nowrap"
                                                title={shipment.invoiceNotes || 'Fatura kesildi'}
                                            >
                                                ✅ Kesildi
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-semibold rounded whitespace-nowrap">
                                                ❌ Yok
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm">
                                        <div className="flex items-center justify-end">
                                            <ActionsDropdown
                                                actions={[
                                                    {
                                                        label: '📄 İrsaliye Yazdır',
                                                        onClick: () => handlePrintDeliveryNote(shipment)
                                                    },
                                                    ...(shipment.status !== 'Teslim Edildi' && shipment.status !== 'İptal Edildi' && shipment.status !== 'İade Edildi' ? [{
                                                        label: `${getNextStatusIcon(shipment.status)} ${getNextStatusText(shipment.status)}`,
                                                        onClick: () => handleQuickStatusUpdate(shipment)
                                                    }] : []),
                                                    ...(shipment.status === 'Teslim Edildi' || shipment.status === 'Yolda' ? [{
                                                        label: '◀️ Durumu Geri Al',
                                                        onClick: () => handleRevertStatus(shipment)
                                                    }] : []),
                                                    ...(shipment.status !== 'İptal Edildi' && shipment.status !== 'İade Edildi' ? [{
                                                        label: '🚫 Sevkiyatı İptal Et',
                                                        onClick: () => handleCancelShipment(shipment)
                                                    }] : []),
                                                    // Düzenle / Görüntüle / Fatura Ayrımı
                                                    ...(shipment.status === 'Teslim Edildi' 
                                                        ? [
                                                            {
                                                                label: '👁️ Detay Görüntüle',
                                                                onClick: () => handleOpenModal(shipment)
                                                            },
                                                            {
                                                                label: '🧾 Fatura Düzenle',
                                                                onClick: () => handleOpenModal(shipment)
                                                            }
                                                        ]
                                                        : [
                                                            {
                                                                label: '✏️ Düzenle',
                                                                onClick: () => handleOpenModal(shipment)
                                                            }
                                                        ]
                                                    ),
                                                    {
                                                        label: '🗑️ Sil',
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
                                <td colSpan={8} className="p-0">
                                    <EmptyState
                                        icon={searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü' ? 'search' : 'shipments'}
                                        title={searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü' ? 'Sevkiyat Bulunamadı' : 'Henüz Sevkiyat Yok'}
                                        description={searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü' ? 'Arama kriterine uygun sevkiyat bulunamadı.' : undefined}
                                    />
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
                            subtitle={`Sipariş ${getShortOrderNumber(order)} • ${formatDate(shipment.shipment_date)}`}
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
                                        <span className="text-gray-900 dark:text-gray-100 font-medium">{shipment.carrier || (shipment as any).transporter}</span>
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
                                                label: 'İrsaliye Yazdır',
                                                onClick: (e) => {
                                                    e?.stopPropagation();
                                                    handlePrintDeliveryNote(shipment);
                                                },
                                                variant: 'secondary'
                                            },
                                            // Teslim Edildiyse Detay ve Fatura Ayrı, Değilse Düzenle
                                            ...(shipment.status === 'Teslim Edildi' ? [
                                                {
                                                    label: '👁️ Detay',
                                                    onClick: (e) => {
                                                        e?.stopPropagation();
                                                        handleOpenModal(shipment);
                                                    },
                                                    variant: 'secondary' as const
                                                },
                                                {
                                                    label: '🧾 Fatura',
                                                    onClick: (e) => {
                                                        e?.stopPropagation();
                                                        handleOpenModal(shipment);
                                                    },
                                                    variant: 'primary' as const
                                                }
                                            ] : [
                                                {
                                                    label: '✏️ Düzenle',
                                                    onClick: (e) => {
                                                        e?.stopPropagation();
                                                        handleOpenModal(shipment);
                                                    },
                                                    variant: 'primary' as const
                                                }
                                            ]),
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <EmptyState
                            icon={searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü' ? 'search' : 'shipments'}
                            title={searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü' ? 'Sevkiyat Bulunamadı' : 'Henüz Sevkiyat Yok'}
                            description={searchQuery || filters.status !== 'Tümü' || filters.dateRange !== 'Tümü' || filters.customer !== 'Tümü' ? 'Arama kriterine uygun sevkiyat bulunamadı.' : undefined}
                        />
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

            <Modal
                show={isBulkInvoiceModalOpen}
                onClose={() => setIsBulkInvoiceModalOpen(false)}
                title="Toplu Fatura İşaretle"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Seçili <strong>{selectedItems.size}</strong> adet sevkiyatı faturalandı olarak işaretlemek üzeresiniz.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fatura Tarihi
                        </label>
                        <input
                            type="date"
                            value={bulkInvoiceData.invoiceDate}
                            onChange={(e) => setBulkInvoiceData({ ...bulkInvoiceData, invoiceDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fatura No / Açıklama (Opsiyonel)
                        </label>
                        <input
                            type="text"
                            value={bulkInvoiceData.invoiceNo}
                            onChange={(e) => setBulkInvoiceData({ ...bulkInvoiceData, invoiceNo: e.target.value })}
                            placeholder="Örn: GIB2023000000123"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setIsBulkInvoiceModalOpen(false)}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400"
                        >
                            İptal
                        </button>
                        <button
                            onClick={confirmBatchInvoice}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Onayla ve İşaretle
                        </button>
                    </div>
                </div>
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
