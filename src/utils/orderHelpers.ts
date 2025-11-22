/**
 * Order Helper Functions
 *
 * Utility functions for order management and validation
 */

import type { Order, Shipment } from '../types';

/**
 * Check result interface
 */
export interface CancelCheckResult {
  canCancel: boolean;
  reason?: string;
  warning?: string;
  shipmentCount?: number;
}

/**
 * Check if an order can be cancelled
 *
 * Rules:
 * - Order must not be already cancelled
 * - Order must not be completed
 * - Order must not have shipped/delivered shipments
 * - Orders with "Hazırlanıyor" shipments can be cancelled (with warning)
 *
 * @param order - The order to check
 * @param shipments - All shipments in the system
 * @returns CancelCheckResult with canCancel flag and optional reason/warning
 */
export const canCancelOrder = (
  order: Order,
  shipments: Shipment[]
): CancelCheckResult => {
  // Sipariş zaten iptal edilmiş
  if (order.status === 'İptal Edildi') {
    return {
      canCancel: false,
      reason: 'Sipariş zaten iptal edilmiş'
    };
  }

  // Sipariş tamamlanmış
  if (order.status === 'Tamamlandı') {
    return {
      canCancel: false,
      reason: 'Tamamlanmış sipariş iptal edilemez'
    };
  }

  // Soft-deleted siparişler iptal edilemez
  if (order.isDeleted) {
    return {
      canCancel: false,
      reason: 'Silinmiş sipariş iptal edilemez'
    };
  }

  // Sevkiyat kontrolü - bu sipariş için sevkiyatları filtrele
  const orderShipments = shipments.filter(
    s => s.orderId === order.id && !s.isDeleted
  );

  // Sevkiyat yoksa direkt iptal edilebilir
  if (orderShipments.length === 0) {
    return { canCancel: true };
  }

  // Sevkiyat varsa ve gönderilmiş/yolda/teslim edilmişse iptal edilemez
  const hasActiveShipment = orderShipments.some(s =>
    ['Gönderildi', 'Yolda', 'Teslim Edildi'].includes(s.status)
  );

  if (hasActiveShipment) {
    return {
      canCancel: false,
      reason: 'Sevkiyat gönderilmiş, iptal edilemez'
    };
  }

  // Hazırlanan sevkiyat varsa uyarı ver ama iptal edilebilir
  const hasPreparedShipment = orderShipments.some(
    s => s.status === 'Hazırlanıyor'
  );

  if (hasPreparedShipment) {
    return {
      canCancel: true,
      warning: 'Hazırlanan sevkiyat da iptal edilecek',
      shipmentCount: orderShipments.length
    };
  }

  // İptal edilebilir
  return { canCancel: true };
};

/**
 * Get cancellation data for an order
 * Returns shipments and payments that will be affected by cancellation
 */
export const getCancellationData = (
  orderId: string,
  shipments: Shipment[],
  payments: any[]
) => {
  const relatedShipments = shipments.filter(
    s => s.orderId === orderId && !s.isDeleted && s.status !== 'İptal Edildi'
  );

  const relatedPayments = payments.filter(
    p => p.orderId === orderId && !p.isDeleted && p.status !== 'İptal'
  );

  return {
    shipments: relatedShipments,
    payments: relatedPayments,
    hasAffectedRecords: relatedShipments.length > 0 || relatedPayments.length > 0
  };
};

/**
 * Format cancellation reason for display
 */
export const formatCancellationReason = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    'Müşteri Talebi': '👤 Müşteri Talebi',
    'Stok Yetersizliği': '📦 Stok Yetersizliği',
    'Fiyat Anlaşmazlığı': '💰 Fiyat Anlaşmazlığı',
    'Teslimat Süresi': '🕐 Teslimat Süresi',
    'Ödeme Sorunu': '💳 Ödeme Sorunu',
    'Diğer': '❓ Diğer'
  };

  return reasonMap[reason] || reason;
};
