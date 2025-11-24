import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import LotCard from './LotCard';
import CostVarianceAlert from './CostVarianceAlert';
import { StockLot, LotConsumption } from '../../types';

interface LotSelectionDialogProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  quantityNeeded: number;
  unit: string;
  suggestedLots: LotConsumption[]; // FIFO suggestion
  availableLots: StockLot[];
  onConfirm: (selectedLots: LotConsumption[], notes?: string) => void;
  onCancel: () => void;
}

interface LotSelection {
  lotId: string;
  quantityUsed: number;
}

/**
 * LotSelectionDialog - Modal for selecting lots during sales
 * Supports both automatic FIFO and manual lot selection
 */
const LotSelectionDialog: React.FC<LotSelectionDialogProps> = ({
  isOpen,
  productName,
  quantityNeeded,
  unit,
  suggestedLots,
  availableLots,
  onConfirm,
  onCancel
}) => {
  const [selectionMethod, setSelectionMethod] = useState<'auto-fifo' | 'manual'>('auto-fifo');
  const [manualSelection, setManualSelection] = useState<LotSelection[]>([]);
  const [notes, setNotes] = useState('');

  // Initialize manual selection from FIFO suggestion
  useEffect(() => {
    if (isOpen) {
      const initialSelection = suggestedLots.map(lot => ({
        lotId: lot.lotId,
        quantityUsed: lot.quantityUsed
      }));
      setManualSelection(initialSelection);
      setSelectionMethod('auto-fifo');
      setNotes('');
    }
  }, [isOpen, suggestedLots]);

  // Calculate selected lots based on method
  const getSelectedLots = (): LotConsumption[] => {
    if (selectionMethod === 'auto-fifo') {
      return suggestedLots;
    } else {
      // Convert manual selections to LotConsumption format
      return manualSelection
        .filter(sel => sel.quantityUsed > 0)
        .map(sel => {
          const lot = availableLots.find(l => l.id === sel.lotId);
          if (!lot) return null;
          return {
            id: '', // Will be generated on save
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            quantityUsed: sel.quantityUsed,
            unitCost: lot.unitCost,
            totalCost: sel.quantityUsed * lot.unitCost,
            purchaseDate: lot.purchaseDate,
            consumptionType: 'manual' as const,
            orderId: '', // Will be set on save
            consumptionDate: new Date().toISOString().split('T')[0],
            createdBy: '',
            createdByEmail: '',
            createdAt: new Date().toISOString()
          };
        })
        .filter(Boolean) as LotConsumption[];
    }
  };

  const selectedLots = getSelectedLots();

  // Calculate totals
  const selectedQuantity = selectedLots.reduce((sum, lot) => sum + lot.quantityUsed, 0);
  const selectedCost = selectedLots.reduce((sum, lot) => sum + lot.totalCost, 0);
  const fifoSelectedCost = suggestedLots.reduce((sum, lot) => sum + lot.totalCost, 0);

  // Check variance
  const hasCostVariance = Math.abs(selectedCost - fifoSelectedCost) > 0.01;
  const costVariance = selectedCost - fifoSelectedCost;

  // Validation
  const quantityMatches = Math.abs(selectedQuantity - quantityNeeded) < 0.001;
  const hasRequiredNotes = !hasCostVariance || (hasCostVariance && notes.trim().length > 0);
  const canConfirm = quantityMatches && hasRequiredNotes;

  // Handle lot quantity change
  const handleLotQuantityChange = (lotId: string, quantity: number) => {
    setManualSelection(prev => {
      const existing = prev.find(s => s.lotId === lotId);
      if (existing) {
        return prev.map(s =>
          s.lotId === lotId ? { ...s, quantityUsed: quantity } : s
        );
      } else {
        return [...prev, { lotId, quantityUsed: quantity }];
      }
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(selectedLots, hasCostVariance ? notes : undefined);
    }
  };

  return (
    <Modal
      show={isOpen}
      onClose={onCancel}
      title={`Lot Seçimi - ${productName}`}
      maxWidth="max-w-5xl"
      hasUnsavedChanges={selectionMethod === 'manual' && manualSelection.length > 0}
    >
      <div className="space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Çıkış Miktarı: {quantityNeeded} {unit}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Satış için hangi lotların kullanılacağını seçin
              </p>
            </div>
          </div>
        </div>

        {/* Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lot Seçim Yöntemi
          </label>
          <select
            value={selectionMethod}
            onChange={(e) => {
              const newMethod = e.target.value as 'auto-fifo' | 'manual';
              setSelectionMethod(newMethod);
              if (newMethod === 'auto-fifo') {
                // Reset to FIFO suggestion
                setManualSelection(suggestedLots.map(lot => ({
                  lotId: lot.lotId,
                  quantityUsed: lot.quantityUsed
                })));
                setNotes('');
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto-fifo">🤖 Otomatik (FIFO - İlk Giren İlk Çıkar)</option>
            <option value="manual">✋ Manuel Seçim</option>
          </select>
        </div>

        {/* FIFO Recommendation */}
        {selectionMethod === 'manual' && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
              <span>✅</span>
              FIFO Önerisi (Muhasebe Standardı)
            </h3>
            <div className="space-y-2 text-sm">
              {suggestedLots.map((lot) => (
                <div key={lot.lotId} className="flex justify-between items-center bg-white dark:bg-gray-800 rounded p-2">
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {lot.lotNumber}: {lot.quantityUsed} {unit} @ {formatCurrency(lot.unitCost)}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(lot.totalCost)}
                  </span>
                </div>
              ))}
              <div className="border-t-2 border-green-200 dark:border-green-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-gray-100">
                <span>Toplam FIFO Maliyeti:</span>
                <span>{formatCurrency(fifoSelectedCost)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Available Lots */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <span>📋</span>
            Mevcut Lotlar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {availableLots.map((lot) => {
              const isFifoRecommended = suggestedLots.some(s => s.lotId === lot.id);
              const selectedQty = selectionMethod === 'manual'
                ? manualSelection.find(s => s.lotId === lot.id)?.quantityUsed || 0
                : suggestedLots.find(s => s.lotId === lot.id)?.quantityUsed || 0;

              return (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  isSelected={selectedQty > 0}
                  isFifoRecommended={isFifoRecommended}
                  selectedQuantity={selectedQty}
                  onQuantityChange={(qty) => handleLotQuantityChange(lot.id, qty)}
                  disabled={selectionMethod === 'auto-fifo'}
                />
              );
            })}
          </div>
        </div>

        {/* Cost Variance Alert */}
        {hasCostVariance && selectionMethod === 'manual' && (
          <CostVarianceAlert
            fifoCost={fifoSelectedCost}
            selectedCost={selectedCost}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">📊 Özet</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Seçilen Miktar</p>
              <p className={`font-bold text-lg ${quantityMatches ? 'text-green-600' : 'text-red-600'}`}>
                {selectedQuantity.toFixed(3)} / {quantityNeeded} {unit}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Toplam Maliyet</p>
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {formatCurrency(selectedCost)}
              </p>
            </div>
            {hasCostVariance && (
              <>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">FIFO Farkı</p>
                  <p className={`font-bold text-lg ${costVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {costVariance > 0 ? '+' : ''}{formatCurrency(costVariance)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Fark Oranı</p>
                  <p className={`font-bold text-lg ${costVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {costVariance > 0 ? '+' : ''}{((costVariance / fifoSelectedCost) * 100).toFixed(2)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Validation Messages */}
        {!quantityMatches && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ⚠️ Seçilen miktar ({selectedQuantity.toFixed(3)} {unit}) ihtiyaç duyulan miktara ({quantityNeeded} {unit}) eşit değil
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-md
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors font-medium"
          >
            ❌ İptal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`
              flex-1 px-6 py-3 rounded-md font-medium transition-all
              ${canConfirm
                ? hasCostVariance
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
            title={!canConfirm ? 'Lütfen tüm gerekli alanları doldurun' : ''}
          >
            {hasCostVariance ? '⚠️ Farkla Onayla' : '✅ Onayla'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LotSelectionDialog;
