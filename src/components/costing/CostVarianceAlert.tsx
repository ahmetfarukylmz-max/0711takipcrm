import React from 'react';

interface CostVarianceAlertProps {
  fifoCost: number;
  selectedCost: number;
  currency?: string;
  notes: string;
  onNotesChange: (notes: string) => void;
}

/**
 * CostVarianceAlert - Displays warning when selected lots differ from FIFO
 */
const CostVarianceAlert: React.FC<CostVarianceAlertProps> = ({
  fifoCost,
  selectedCost,
  currency = 'TRY',
  notes,
  onNotesChange
}) => {
  const variance = selectedCost - fifoCost;
  const variancePercentage = fifoCost > 0 ? ((variance / fifoCost) * 100).toFixed(2) : '0.00';
  const isHigher = variance > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (Math.abs(variance) < 0.01) {
    return null; // No variance, don't show alert
  }

  return (
    <div className="border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⚠️</span>
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">
          Maliyet Farkı Tespit Edildi
        </h3>
      </div>

      {/* Cost Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded p-3 mb-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">FIFO Maliyeti</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(fifoCost)}
            </p>
            <p className="text-xs text-gray-500">(Muhasebe Standardı)</p>
          </div>

          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Seçilen Maliyet</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(selectedCost)}
            </p>
            <p className="text-xs text-gray-500">(Gerçek Kullanım)</p>
          </div>

          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Fark</p>
            <p className={`font-bold text-lg ${isHigher ? 'text-red-600' : 'text-green-600'}`}>
              {isHigher ? '+' : ''}{formatCurrency(variance)}
            </p>
            <p className={`text-xs font-semibold ${isHigher ? 'text-red-600' : 'text-green-600'}`}>
              ({isHigher ? '+' : ''}{variancePercentage}%)
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded p-3 mb-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ℹ️ Açıklama:</strong> Seçtiğiniz lotlar FIFO (İlk Giren İlk Çıkar) standardından farklı.
          Bu fark ay sonu uzlaştırma raporunda görünecek ve analiz edilecektir.
        </p>
      </div>

      {/* Reason Input - Required */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span className="text-red-600">*</span> Sebep Açıklaması (Zorunlu)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Örneğin: Depoda ön rafta olan yeni stok kullanıldı..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-yellow-500
            placeholder-gray-400 dark:placeholder-gray-500"
          required
        />
        {!notes && (
          <p className="text-red-600 text-xs mt-1">
            ⚠️ Maliyet farkı nedeni belirtilmelidir
          </p>
        )}
      </div>

      {/* Warning */}
      <div className="mt-3 flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
        <span>⚡</span>
        <p>
          <strong>Önemli:</strong> Bu işlem ay sonu uzlaştırmada incelenecek ve
          {isHigher ? ' ek maliyet' : ' maliyet tasarrufu'} olarak kaydedilecektir.
        </p>
      </div>
    </div>
  );
};

export default CostVarianceAlert;
