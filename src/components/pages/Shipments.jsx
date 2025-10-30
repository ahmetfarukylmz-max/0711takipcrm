import React from 'react';
import { formatDate, getStatusClass } from '../../utils/formatters';

const Shipments = ({ shipments, onDelivery }) => {
    const handleDelivery = (shipmentId) => {
        onDelivery(shipmentId);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Sevkiyat Yönetimi</h1>
            <div className="overflow-auto rounded-lg shadow bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            {['Sipariş ID', 'Sevk Tarihi', 'Nakliye Firması', 'Takip No', 'Teslim Tarihi', 'Durum', 'İşlem'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shipments.map(shipment => (
                            <tr key={shipment.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700">#{shipment.orderId}</td>
                                <td className="p-3 text-sm text-gray-700">{formatDate(shipment.shipment_date)}</td>
                                <td className="p-3 text-sm text-gray-700">{shipment.transporter}</td>
                                <td className="p-3 text-sm text-gray-700">{shipment.tracking_number}</td>
                                <td className="p-3 text-sm text-gray-700">{formatDate(shipment.delivery_date)}</td>
                                <td className="p-3 text-sm">
                                    <span
                                        className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(shipment.status)}`}
                                    >
                                        {shipment.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm">
                                    {shipment.status !== 'Teslim Edildi' && (
                                        <button
                                            onClick={() => handleDelivery(shipment.id)}
                                            className="bg-green-500 text-white px-3 py-1 text-xs rounded-md hover:bg-green-600"
                                        >
                                            Teslim Edildi
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Shipments;
