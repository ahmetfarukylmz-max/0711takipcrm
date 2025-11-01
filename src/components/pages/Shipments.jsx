import React, { useState } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDate, getStatusClass } from '../../utils/formatters';

const ShipmentEditForm = ({ shipment, orders = [], products = [], shipments = [], onSave, onCancel, readOnly = false }) => {
    const [formData, setFormData] = useState({
        shipment_date: shipment.shipment_date || '',
        transporter: shipment.transporter || '',
        delivery_date: shipment.delivery_date || ''
    });

    // Find the order related to this shipment
    const relatedOrder = orders.find(o => o.id === shipment.orderId);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.transporter.trim()) {
            alert('Lütfen nakliye firması giriniz!');
            return;
        }

        onSave({
            ...shipment,
            ...formData
        });
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                Tahmini Teslim Tarihi
                            </label>
                            <input
                                type="date"
                                name="delivery_date"
                                value={formData.delivery_date}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
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

const Shipments = ({ shipments, orders = [], products = [], customers = [], onDelivery, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentShipment, setCurrentShipment] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, shipment: null });
    const [selectedItems, setSelectedItems] = useState(new Set());

    const handleDelivery = (shipmentId) => {
        onDelivery(shipmentId);
    };

    const handleOpenModal = (shipment) => {
        setCurrentShipment(shipment);
        setIsModalOpen(true);
    };

    const handleSave = (shipmentData) => {
        onUpdate(shipmentData);
        setIsModalOpen(false);
        setCurrentShipment(null);
    };

    const handleDelete = (shipment) => {
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
        const activeShipments = shipments.filter(s => !s.isDeleted);
        if (selectedItems.size === activeShipments.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(activeShipments.map(s => s.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            shipment: { id: 'batch', count: selectedItems.size }
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, shipment: null });
    };

    const activeShipments = shipments.filter(s => !s.isDeleted);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sevkiyat Yönetimi</h1>
                {selectedItems.size > 0 && (
                    <button
                        onClick={handleBatchDelete}
                        className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Seçili {selectedItems.size} Sevkiyatı Sil
                    </button>
                )}
            </div>

            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {activeShipments.length} sevkiyat gösteriliyor
            </div>

            <div className="overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left">
                                <input
                                    type="checkbox"
                                    checked={activeShipments.length > 0 && selectedItems.size === activeShipments.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            {['Müşteri', 'Nakliye Firması', 'Sevk Tarihi', 'Teslim Tarihi', 'Durum', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {activeShipments.length > 0 ? activeShipments.map(shipment => {
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
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300 font-bold">{customer?.name || 'Bilinmeyen Müşteri'}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{shipment.transporter}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(shipment.shipment_date)}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(shipment.delivery_date) || '-'}</td>
                                <td className="p-3 text-sm">
                                    <span
                                        className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(shipment.status)}`}
                                    >
                                        {shipment.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm">
                                    <div className="flex gap-3">
                                        {shipment.status !== 'Teslim Edildi' ? (
                                            <>
                                                <button
                                                    onClick={() => handleOpenModal(shipment)}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelivery(shipment.id)}
                                                    className="text-green-600 hover:underline dark:text-green-400"
                                                >
                                                    Teslim Edildi
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(shipment)}
                                                    className="text-red-500 hover:underline dark:text-red-400"
                                                >
                                                    Sil
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleOpenModal(shipment)}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Görüntüle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(shipment)}
                                                    className="text-red-500 hover:underline dark:text-red-400"
                                                >
                                                    Sil
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                        }) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    Henüz sevkiyat eklenmemiş.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
                        readOnly={currentShipment.status === 'Teslim Edildi'}
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
};

export default Shipments;
