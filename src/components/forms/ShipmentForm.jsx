import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ShipmentForm = ({ order, products, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        shipment_date: new Date().toISOString().split('T')[0],
        transporter: '',
        notes: '',
        items: []
    });

    useEffect(() => {
        if (order) {
            // Initialize items with order items and their quantities
            const items = order.items.map(item => ({
                productId: item.productId,
                productName: products.find(p => p.id === item.productId)?.name || 'Bilinmiyor',
                orderedQty: item.quantity,
                unit: item.unit || 'Adet',
                shippedQty: 0,
                toShipQty: item.quantity // Default to ship all
            }));
            setFormData(prev => ({ ...prev, items }));
        }
    }, [order, products]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemQtyChange = (index, value) => {
        const newItems = [...formData.items];
        const qty = parseInt(value) || 0;
        const maxQty = newItems[index].orderedQty - newItems[index].shippedQty;
        newItems[index].toShipQty = Math.min(Math.max(0, qty), maxQty);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate
        if (!formData.transporter.trim()) {
            toast.error('Lütfen nakliye firması giriniz!');
            return;
        }

        const itemsToShip = formData.items.filter(item => item.toShipQty > 0);
        if (itemsToShip.length === 0) {
            toast.error('Lütfen en az bir ürün için sevk miktarı giriniz!');
            return;
        }

        const shipmentData = {
            orderId: order.id,
            customerId: order.customerId,
            shipment_date: formData.shipment_date,
            transporter: formData.transporter,
            notes: formData.notes || '',
            status: 'Yolda',
            items: itemsToShip.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.toShipQty,
                unit: item.unit
            }))
        };

        onSave(shipmentData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shipment Info */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
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
                            placeholder="Sevkiyat ile ilgili özel notlar ekleyebilirsiniz..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>
            </div>

            {/* Items to Ship */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Sevk Edilecek Ürünler</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Ürün</th>
                                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Sipariş Miktarı</th>
                                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Sevk Edildi</th>
                                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Kalan</th>
                                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Sevk Edilecek *</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{item.productName}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">{item.orderedQty} {item.unit}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">{item.shippedQty} {item.unit}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">{item.orderedQty - item.shippedQty} {item.unit}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.orderedQty - item.shippedQty}
                                                value={item.toShipQty}
                                                onChange={(e) => handleItemQtyChange(index, e.target.value)}
                                                className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{item.unit}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Sevk Et
                </button>
            </div>
        </form>
    );
};

export default ShipmentForm;
