import React from 'react';
import { StockLot } from '../../types';

interface LotCardProps {
  lot: StockLot;
  isSelected: boolean;
  isFifoRecommended: boolean;
  selectedQuantity: number;
  maxQuantity?: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

/**
 * LotCard - Displays a single lot with selection controls
 */
const LotCard: React.FC<LotCardProps> = ({
  lot,
  isSelected,
  isFifoRecommended,
  selectedQuantity,
  maxQuantity,
  onQuantityChange,
  disabled = false
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: lot.currency || 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    const clampedValue = Math.min(Math.max(0, value), lot.remainingQuantity);
    onQuantityChange(clampedValue);
  };

  return (
    <div
      className={`
        relative border-2 rounded-lg p-4 transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}
        ${isFifoRecommended && !disabled ? 'ring-2 ring-green-500 ring-offset-2' : ''}
      `}
    >
      {/* FIFO Badge */}
      {isFifoRecommended && !disabled && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          ✅ FIFO ÖNERİSİ
        </div>
      )}

      {/* Lot Number & Date */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-mono font-bold text-gray-900 dark:text-gray-100">
            {lot.lotNumber}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📅 {formatDate(lot.purchaseDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Kalan Stok</p>
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {lot.remainingQuantity} {lot.productUnit}
          </p>
        </div>
      </div>

      {/* Cost Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Birim Maliyet</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(lot.unitCost)}/{lot.productUnit}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Toplam Değer</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(lot.remainingQuantity * lot.unitCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Supplier Info */}
      {lot.supplierName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          🏢 {lot.supplierName}
          {lot.invoiceNumber && ` - Fatura: ${lot.invoiceNumber}`}
        </p>
      )}

      {/* Quantity Input */}
      {!disabled && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kullanılacak Miktar ({lot.productUnit})
          </label>
          <input
            type="number"
            value={selectedQuantity || ''}
            onChange={handleQuantityChange}
            min={0}
            max={lot.remainingQuantity}
            step={0.001}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          />
          {selectedQuantity > lot.remainingQuantity && (
            <p className="text-red-600 text-xs mt-1">
              ⚠️ Yetersiz stok! Maksimum: {lot.remainingQuantity} {lot.productUnit}
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {lot.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          💬 {lot.notes}
        </p>
      )}
    </div>
  );
};

export default LotCard;
