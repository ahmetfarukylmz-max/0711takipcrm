import React from 'react';
import { PlusIcon } from '../../icons';
import type { InquiredProduct } from '../../../types';

interface InquiredProductsListProps {
  inquiredProducts: InquiredProduct[];
  readOnly: boolean;
  onAddProduct: () => void;
  onEditProduct: (index: number) => void;
  onDeleteProduct: (index: number) => void;
}

const InquiredProductsList: React.FC<InquiredProductsListProps> = ({
  inquiredProducts,
  readOnly,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}) => {
  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'Yüksek':
        return '🔴';
      case 'Orta':
        return '🟡';
      case 'Düşük':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          📦 Sorulan/İlgilenilen Ürünler
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={onAddProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            <PlusIcon className="w-4 h-4 !mr-0" />
            Ürün Ekle
          </button>
        )}
      </div>

      {inquiredProducts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz ürün eklenmedi</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Müşterinin sorduğu veya ilgilendiği ürünleri buraya ekleyin
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiredProducts.map((product, index) => (
            <div
              key={product.id || index}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getPriorityIcon(product.priority)}</span>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {product.productName}
                  </h4>
                  {product.priority && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {product.priority} İlgi
                    </span>
                  )}
                </div>
                {product.quantity && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📊 Miktar:{' '}
                    <strong>
                      {product.quantity} {product.unit || 'Adet'}
                    </strong>
                  </p>
                )}
                {product.priceQuoted && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💰 Sözlü Fiyat: <strong>{product.priceQuoted.toFixed(2)} ₺</strong>
                  </p>
                )}
                {product.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    💬 {product.notes}
                  </p>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditProduct(index)}
                    className="px-2.5 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(index)}
                    className="px-2.5 py-1.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InquiredProductsList;
