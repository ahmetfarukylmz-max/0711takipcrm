import React, { useState } from 'react';
import Modal from './Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Payment } from '../../types';

interface CollectPaymentDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paidDate: string) => void;
  isOverdue?: boolean;
}

const CollectPaymentDialog: React.FC<CollectPaymentDialogProps> = ({
  payment,
  isOpen,
  onClose,
  onConfirm,
  isOverdue = false
}) => {
  const [paidDate, setPaidDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  if (!payment) return null;

  const handleConfirm = () => {
    onConfirm(paidDate);
    onClose();
  };

  // Gecikme hesaplama
  const calculateDelay = () => {
    const due = new Date(payment.dueDate);
    const paid = new Date(paidDate);
    const diff = Math.floor((paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const delayDays = calculateDelay();

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      title="Ödeme Tahsil Et"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Uyarı (eğer gecikmeli ise) */}
        {isOverdue && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Gecikmiş Ödeme
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Bu ödeme vade tarihini geçmiş. Tahsilat kaydı yapılacak.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ödeme Bilgileri */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Müşteri:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {payment.customerName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tutar:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(payment.amount, payment.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Vade Tarihi:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(payment.dueDate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ödeme Yöntemi:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {payment.paymentMethod}
            </span>
          </div>
          {payment.checkNumber && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Çek/Senet No:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {payment.checkNumber}
              </span>
            </div>
          )}
        </div>

        {/* Tahsil Tarihi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tahsil Tarihi <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Gecikme Bilgisi */}
        {delayDays !== 0 && (
          <div className={`p-3 rounded-lg ${
            delayDays > 0
              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}>
            <p className={`text-sm font-medium ${
              delayDays > 0
                ? 'text-orange-800 dark:text-orange-300'
                : 'text-green-800 dark:text-green-300'
            }`}>
              {delayDays > 0
                ? `⏱️ ${delayDays} gün gecikmeyle tahsil edilecek`
                : `✓ Vade tarihinden ${Math.abs(delayDays)} gün önce tahsil edilecek`
              }
            </p>
          </div>
        )}

        {/* Onay Mesajı */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {payment.customerName} müşterisinden <strong>{formatCurrency(payment.amount, payment.currency)}</strong> tutarındaki ödemeyi
            <strong> {formatDate(paidDate)}</strong> tarihinde tahsil edildi olarak işaretlemek istediğinize emin misiniz?
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            ✓ Tahsil Et
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CollectPaymentDialog;
