import React from 'react';
import { formatDate } from '../../utils/formatters';
import { getShortOrderNumber } from '../../utils/numberFormatters';
import type { Shipment, Order, Customer } from '../../types';

interface UninvoicedShipmentsModalProps {
    /** List of uninvoiced shipments */
    shipments: Shipment[];
    /** List of orders */
    orders: Order[];
    /** List of customers */
    customers: Customer[];
    /** Callback to navigate to Shipments page */
    onViewAllShipments: () => void;
    /** Callback to mark shipment as invoiced */
    onMarkAsInvoiced?: (shipmentId: string) => void;
}

/**
 * UninvoicedShipmentsModal - Displays list of delivered shipments without invoices
 */
const UninvoicedShipmentsModal: React.FC<UninvoicedShipmentsModalProps> = ({
    shipments,
    orders,
    customers,
    onViewAllShipments,
    onMarkAsInvoiced
}) => {
    /**
     * Calculate days since delivery
     */
    const getDaysSinceDelivery = (shipmentDate: string): number => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const delivery = new Date(shipmentDate);
        delivery.setHours(0, 0, 0, 0);
        return Math.ceil((today.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24));
    };

    /**
     * Get urgency text
     */
    const getUrgencyText = (days: number): string => {
        if (days === 0) return 'Bugün teslim edildi';
        if (days === 1) return '1 gün önce teslim edildi';
        return `${days} gün önce teslim edildi`;
    };

    /**
     * Get urgency color based on days since delivery
     */
    const getUrgencyColor = (days: number): string => {
        if (days >= 7) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
        if (days >= 3) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    };

    const getUrgencyTextColor = (days: number): string => {
        if (days >= 7) return 'text-red-700 dark:text-red-300';
        if (days >= 3) return 'text-orange-700 dark:text-orange-300';
        return 'text-yellow-700 dark:text-yellow-300';
    };

    const getUrgencyIcon = (days: number): string => {
        if (days >= 7) return '🔴';
        if (days >= 3) return '🟠';
        return '🟡';
    };

    /**
     * Sort shipments by days since delivery (oldest first)
     */
    const sortedShipments = [...shipments]
        .filter(s => s.shipment_date)
        .sort((a, b) => {
            const daysA = getDaysSinceDelivery(a.shipment_date);
            const daysB = getDaysSinceDelivery(b.shipment_date);
            return daysB - daysA; // Descending order (oldest first)
        });

    if (sortedShipments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-4xl mb-4">🎉</p>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Tüm sevkiyatların faturası kesilmiş!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            Toplam {sortedShipments.length} sevkiyatın faturası kesilmedi
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            En eski: {getUrgencyText(getDaysSinceDelivery(sortedShipments[0].shipment_date))}
                        </p>
                    </div>
                    <button
                        onClick={onViewAllShipments}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                        Sevkiyatlarda Görüntüle
                    </button>
                </div>
            </div>

            {/* Shipments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedShipments.map((shipment) => {
                    const order = orders.find(o => o.id === shipment.orderId);
                    const customer = customers.find(c => c.id === order?.customerId);
                    const daysSince = getDaysSinceDelivery(shipment.shipment_date);

                    return (
                        <div
                            key={shipment.id}
                            className={`border rounded-lg p-4 transition-all ${getUrgencyColor(daysSince)}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{getUrgencyIcon(daysSince)}</span>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {customer?.name || 'Bilinmeyen Müşteri'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Sipariş: {getShortOrderNumber(order)} •
                                        Sevk Tarihi: {formatDate(shipment.shipment_date)}
                                    </p>
                                    <p className={`text-xs font-bold mt-1 ${getUrgencyTextColor(daysSince)}`}>
                                        {getUrgencyIcon(daysSince)} {getUrgencyText(daysSince).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Shipment Info */}
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p><span className="font-medium">Nakliye:</span> {shipment.carrier || (shipment as any).transporter || 'Belirtilmemiş'}</p>
                                {shipment.tracking_number && (
                                    <p><span className="font-medium">Takip No:</span> {shipment.tracking_number}</p>
                                )}
                                {shipment.notes && (
                                    <p><span className="font-medium">Not:</span> {shipment.notes}</p>
                                )}
                            </div>

                            {/* Quick Action */}
                            {onMarkAsInvoiced && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => onMarkAsInvoiced(shipment.id)}
                                        className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        ✅ Fatura Kesildi İşaretle
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UninvoicedShipmentsModal;
