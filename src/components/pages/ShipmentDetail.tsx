import React, { memo } from 'react';
import { formatDate } from '../../utils/formatters';
import type { Shipment, Order, Customer } from '../../types';

interface ShipmentDetailProps {
    /** Shipment data to display */
    shipment: Shipment | null;
    /** Associated order */
    order?: Order | null;
    /** Associated customer */
    customer?: Customer | null;
}

/**
 * ShipmentDetail component - Displays detailed information about a shipment
 */
const ShipmentDetail = memo<ShipmentDetailProps>(({ shipment, order, customer }) => {
    if (!shipment) return null;

    return (
        <div className="space-y-6 p-4">
            {/* Shipment Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Sevkiyat Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Müşteri</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{customer?.name || 'Bilinmiyor'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Sipariş Tarihi</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{order ? formatDate(order.order_date) : 'Bilinmiyor'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Sevk Tarihi</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(shipment.shipment_date)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Nakliye Firması</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{shipment.transporter}</p>
                    </div>
                    <div className="col-span-full">
                        <p className="text-gray-500 dark:text-gray-400">Notlar</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{shipment.notes || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Shipped Items */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Sevk Edilen Ürünler</h3>

                {/* Desktop: Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Ürün Adı</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Miktar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {shipment.items && shipment.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.productName}</td>
                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{item.quantity} {item.unit || 'adet'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile: Card View */}
                <div className="md:hidden space-y-3">
                    {shipment.items && shipment.items.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{item.productName}</span>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{item.quantity} {item.unit || 'adet'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

ShipmentDetail.displayName = 'ShipmentDetail';

export default ShipmentDetail;
