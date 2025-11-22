import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { formatCancellationReason } from '../../utils/orderHelpers';
import type { Order, Shipment, Payment, Customer, CancellationReason } from '../../types';

interface CancellationData {
  reason: CancellationReason;
  notes: string;
  shipmentIds: string[];
  paymentIds: string[];
  cancelledByEmail?: string;
}

interface CancelOrderDialogProps {
  order: Order;
  customers: Customer[];
  shipments: Shipment[];
  payments: Payment[];
  onCancel: (data: CancellationData) => void;
  onClose: () => void;
}

const CANCELLATION_REASONS: CancellationReason[] = [
  'Müşteri Talebi',
  'Stok Yetersizliği',
  'Fiyat Anlaşmazlığı',
  'Teslimat Süresi',
  'Ödeme Sorunu',
  'Diğer'
];

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  order,
  customers,
  shipments,
  payments,
  onCancel,
  onClose
}) => {
  const [reason, setReason] = useState<CancellationReason | ''>('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Müşteri bilgisini al
  const customer = customers.find(c => c.id === order.customerId);
  const customerName = customer?.name || 'Bilinmeyen müşteri';

  // İlgili sevkiyatlar (iptal edilecek)
  const relatedShipments = shipments.filter(
    s => s.orderId === order.id && !s.isDeleted && s.status !== 'İptal Edildi'
  );

  // İlgili ödemeler (iptal edilecek)
  const relatedPayments = payments.filter(
    p => p.orderId === order.id && !p.isDeleted && p.status !== 'İptal'
  );

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Lütfen iptal nedenini seçin');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onCancel({
      reason: reason as CancellationReason,
      notes,
      shipmentIds: relatedShipments.map(s => s.id),
      paymentIds: relatedPayments.map(p => p.id)
    });
    setShowConfirm(false);
  };

  return (
    <>
      <Modal show={true} onClose={onClose} title="Sipariş İptali" maxWidth="max-w-lg">
        <div className="space-y-4">
          {/* Uyarı */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Bu işlem geri alınamaz!
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Sipariş iptal edilecek ve ilgili kayıtlar güncellenecek.
                </p>
              </div>
            </div>
          </div>

          {/* Sipariş bilgisi */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Sipariş Bilgileri</h4>
            <div className="text-sm space-y-1">
              <p><strong>Müşteri:</strong> {customerName}</p>
              <p><strong>Tutar:</strong> {formatCurrency(order.total_amount)}</p>
              <p><strong>Tarih:</strong> {formatDate(order.order_date)}</p>
              <p><strong>Durum:</strong> <span className="text-blue-600 dark:text-blue-400">{order.status}</span></p>
            </div>
          </div>

          {/* Etkilenecek kayıtlar */}
          {(relatedShipments.length > 0 || relatedPayments.length > 0) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Etkilenecek Kayıtlar
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {relatedShipments.length > 0 && (
                  <li>✓ {relatedShipments.length} sevkiyat iptal edilecek</li>
                )}
                {relatedPayments.length > 0 && (
                  <li>✓ {relatedPayments.length} ödeme iptal edilecek</li>
                )}
              </ul>
            </div>
          )}

          {/* İptal nedeni */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              İptal Nedeni <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as CancellationReason)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">İptal nedeni seçin...</option>
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{formatCancellationReason(r)}</option>
              ))}
            </select>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="İptal hakkında ek bilgi..."
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                       text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg
                       hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed
                       font-medium transition-colors"
            >
              🚫 İptal Et
            </button>
          </div>
        </div>
      </Modal>

      {/* Onay dialog'u */}
      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          title="Emin misiniz?"
          message={`"${customerName}" müşterisinin ${formatCurrency(order.total_amount)} tutarındaki siparişi iptal edilecek. Bu işlem geri alınamaz.`}
          confirmText="Evet, İptal Et"
          cancelText="Hayır"
          onConfirm={handleConfirm}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default CancelOrderDialog;
