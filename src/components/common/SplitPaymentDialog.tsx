import React, { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import FormInput from './FormInput';
import { formatCurrency } from '../../utils/formatters';
import type { Payment, Currency } from '../../types';

interface SplitPaymentDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paidAmount: number, paidDate: string) => void;
}

/**
 * SplitPaymentDialog - Dialog for splitting a payment into paid and remaining parts
 *
 * Use case: Customer expected to pay 80,000 but only paid 40,000
 * This creates:
 * - One payment for 40,000 marked as "Tahsil Edildi"
 * - One payment for 40,000 marked as "Bekliyor"
 */
const SplitPaymentDialog: React.FC<SplitPaymentDialogProps> = ({
  payment,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string>('');

  if (!payment) return null;

  const remainingAmount = payment.amount - paidAmount;
  const currency = payment.currency || 'TRY';

  const handleConfirm = () => {
    // Validations
    if (paidAmount <= 0) {
      setError('Ödenen tutar 0\'dan büyük olmalıdır');
      return;
    }

    if (paidAmount >= payment.amount) {
      setError('Ödenen tutar toplam tutardan küçük olmalıdır. Tam ödeme için "Tahsil Et" kullanın.');
      return;
    }

    if (!paidDate) {
      setError('Ödeme tarihi gereklidir');
      return;
    }

    onConfirm(paidAmount, paidDate);
    handleClose();
  };

  const handleClose = () => {
    setPaidAmount(0);
    setPaidDate(new Date().toISOString().slice(0, 10));
    setError('');
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="💰 Kısmi Ödeme"
      confirmText="Kaydet"
      cancelText="İptal"
      message={
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Müşteri:</strong> {payment.customerName}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Beklenen Tutar:</strong> {formatCurrency(payment.amount, currency)}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              Bu ödeme iki parçaya bölünecek: Tahsil edilen kısım ve kalan bakiye
            </p>
          </div>

          {/* Paid Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bugün Ödenen Tutar <span className="text-red-500">*</span>
            </label>
            <FormInput
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={payment.amount - 0.01}
              value={paidAmount}
              onChange={(e) => {
                setPaidAmount(parseFloat(e.target.value) || 0);
                setError('');
              }}
              placeholder={`0.00 ${currency}`}
              required
            />
          </div>

          {/* Paid Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ödeme Tarihi <span className="text-red-500">*</span>
            </label>
            <FormInput
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              required
            />
          </div>

          {/* Summary */}
          {paidAmount > 0 && paidAmount < payment.amount && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">✅ Tahsil Edilen:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(paidAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">⏳ Kalan Bakiye:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(remainingAmount, currency)}
                </span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Toplam:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(payment.amount, currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 rounded">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Not:</strong> Bu işlem sonrası iki ayrı ödeme kaydı oluşturulacak ve birbirine bağlanacaktır.
            </p>
          </div>
        </div>
      }
    />
  );
};

export default SplitPaymentDialog;
