import React, { useState } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import ProductSelector from './ProductSelector';
import { TrashIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';
import LotSelectionDialog from '../costing/LotSelectionDialog';
import { getLotsByProduct } from '../../services/lotService';
import { calculateFIFOConsumption, calculateLIFOConsumption } from '../../services/fifoLifoService';
import { useAuth } from '../../context/AuthContext';
import type { Product, OrderItem, StockLot, LotConsumption } from '../../types';
import { logger } from '../../utils/logger';

interface ItemEditorProps {
    /** Array of order items */
    items: OrderItem[];
    /** Callback to update items */
    setItems: (items: OrderItem[]) => void;
    /** List of available products */
    products: Product[];
    /** If true, only allow editing prices (disable add/remove/change products) */
    priceOnlyMode?: boolean;
}

/**
 * ItemEditor component - Editor for order items
 */
const ItemEditor: React.FC<ItemEditorProps> = ({ items, setItems, products, priceOnlyMode = false }) => {
    const { user } = useAuth();

    // Lot selection dialog state
    const [lotDialogState, setLotDialogState] = useState<{
        isOpen: boolean;
        itemIndex: number;
        productId: string;
        productName: string;
        quantityNeeded: number;
        unit: string;
        availableLots: StockLot[];
        suggestedLots: LotConsumption[];
    } | null>(null);

    const handleAddItem = () => {
        if (products.length > 0) {
            // Start with empty item to force user to select product
            setItems([
                ...items,
                {
                    productId: '',
                    productName: '',
                    quantity: 1,
                    unit: 'Kg',
                    unit_price: 0
                }
            ]);
        }
    };

    // Open lot selection dialog
    const handleOpenLotDialog = async (index: number) => {
        const item = items[index];
        const product = products.find(p => p.id === item.productId);

        if (!product || !product.lotTrackingEnabled) {
            return;
        }

        try {
            // Fetch available lots for this product
            const lots = await getLotsByProduct(item.productId, user?.uid);

            // Filter out lots with 0 quantity
            const availableLots = lots.filter(lot => lot.quantity > 0);

            if (availableLots.length === 0) {
                alert('Bu ürün için kullanılabilir lot bulunamadı!');
                return;
            }

            // Calculate FIFO suggestion based on product's costing method
            const costingMethod = product.costingMethod || 'fifo';
            let suggestedLots: LotConsumption[] = [];

            if (costingMethod === 'fifo') {
                suggestedLots = calculateFIFOConsumption(availableLots, item.quantity || 0);
            } else if (costingMethod === 'lifo') {
                suggestedLots = calculateLIFOConsumption(availableLots, item.quantity || 0);
            } else {
                // Average costing - suggest proportionally from all lots
                suggestedLots = calculateFIFOConsumption(availableLots, item.quantity || 0);
            }

            setLotDialogState({
                isOpen: true,
                itemIndex: index,
                productId: item.productId,
                productName: item.productName || product.name,
                quantityNeeded: item.quantity || 0,
                unit: item.unit || product.unit,
                availableLots,
                suggestedLots
            });
        } catch (error) {
            logger.error('Lot bilgileri yüklenirken hata:', error);
            alert('Lot bilgileri yüklenirken bir hata oluştu.');
        }
    };

    // Handle lot selection confirmation
    const handleLotConfirm = (selectedLots: LotConsumption[], notes?: string) => {
        if (!lotDialogState) return;

        const { itemIndex, productId } = lotDialogState;
        const product = products.find(p => p.id === productId);
        const newItems = [...items];
        const item = newItems[itemIndex];

        // Calculate costs
        const physicalCost = selectedLots.reduce((sum, lot) => sum + lot.totalCost, 0);
        const physicalCostPerUnit = item.quantity ? physicalCost / item.quantity : 0;

        // Calculate accounting cost (FIFO)
        const accountingLots = calculateFIFOConsumption(
            lotDialogState.availableLots,
            item.quantity || 0
        );
        const accountingCost = accountingLots.reduce((sum, lot) => sum + lot.totalCost, 0);
        const accountingCostPerUnit = item.quantity ? accountingCost / item.quantity : 0;

        // Calculate variance
        const costVariance = physicalCost - accountingCost;
        const costVariancePercentage = accountingCost !== 0 ? (costVariance / accountingCost) * 100 : 0;
        const hasCostVariance = Math.abs(costVariance) > 0.01;

        // Determine lot selection method
        let lotSelectionMethod: 'auto-fifo' | 'auto-lifo' | 'manual' = 'manual';
        const costingMethod = product?.costingMethod || 'fifo';

        // Check if manual selection matches FIFO
        const isFIFOMatch = JSON.stringify(selectedLots.map(l => ({ lotId: l.lotId, quantityUsed: l.quantityUsed }))) ===
                            JSON.stringify(accountingLots.map(l => ({ lotId: l.lotId, quantityUsed: l.quantityUsed })));

        if (isFIFOMatch) {
            lotSelectionMethod = 'auto-fifo';
        } else if (costingMethod === 'lifo') {
            lotSelectionMethod = 'auto-lifo';
        }

        // Update item with lot information
        newItems[itemIndex] = {
            ...item,
            physicalLotConsumptions: selectedLots,
            physicalCost,
            physicalCostPerUnit,
            accountingLotConsumptions: accountingLots,
            accountingCost,
            accountingCostPerUnit,
            costVariance,
            costVariancePercentage,
            hasCostVariance,
            lotSelectionMethod,
            costingNotes: notes,
            varianceReason: hasCostVariance ? `Manuel lot seçimi - ${costingMethod.toUpperCase()} kuralından sapma` : undefined
        };

        setItems(newItems);
        setLotDialogState(null);
    };

    // Handle lot dialog cancel
    const handleLotCancel = () => {
        setLotDialogState(null);
    };

    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];

        // Create a new object for the item to ensure React detects the change
        newItems[index] = {
            ...newItems[index],
            [field]: value
        };

        // Update unit price, product name, and unit when product changes
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].productName = product.name;
                newItems[index].unit = product.unit;
                newItems[index].unit_price = product.selling_price;

                // Clear lot information when product changes
                delete newItems[index].physicalLotConsumptions;
                delete newItems[index].accountingLotConsumptions;
                delete newItems[index].physicalCost;
                delete newItems[index].accountingCost;
                delete newItems[index].costVariance;
                delete newItems[index].hasCostVariance;
                delete newItems[index].lotSelectionMethod;
                delete newItems[index].costingNotes;
            }
        }

        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Ürünler</h4>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 sm:border-0 sm:bg-transparent sm:p-0 sm:rounded-none">
                        {/* Ürün Seçimi - Mobilde tam genişlik */}
                        <div className="flex-1 sm:min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
                                Ürün
                            </label>
                            <ProductSelector
                                products={products}
                                value={item.productId}
                                onChange={(value) => handleItemChange(index, 'productId', value)}
                                disabled={priceOnlyMode}
                            />
                        </div>

                        {/* Miktar, Birim, Fiyat - Mobilde yan yana */}
                        <div className="flex gap-2 sm:gap-3">
                            <div className="flex-1 sm:w-20">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
                                    Miktar
                                </label>
                                <FormInput
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                    min="1"
                                    step="0.01"
                                    placeholder="Miktar"
                                    disabled={priceOnlyMode}
                                />
                            </div>
                            <div className="w-12 sm:w-16 flex items-end sm:items-center justify-center pb-2 sm:pb-0">
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{item.unit || 'Kg'}</span>
                            </div>
                            <div className="flex-1 sm:w-28">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
                                    Fiyat {priceOnlyMode && <span className="text-blue-600 dark:text-blue-400">(Düzenlenebilir)</span>}
                                </label>
                                <FormInput
                                    type="number"
                                    value={item.unit_price}
                                    onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                    step="0.01"
                                    placeholder="Birim Fiyat"
                                    disabled={false}
                                />
                            </div>
                        </div>

                        {/* Toplam ve Sil - Mobilde alt satır */}
                        <div className="flex justify-between sm:justify-start sm:gap-3 items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-600">
                            <div className="flex-1 sm:w-28">
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:hidden mb-1">
                                    Toplam
                                </div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-right">
                                    {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                                </div>
                            </div>

                            {/* Lot Selection Button */}
                            {(() => {
                                const product = products.find(p => p.id === item.productId);
                                const isLotEnabled = product?.lotTrackingEnabled;
                                const hasLotSelected = item.physicalLotConsumptions && item.physicalLotConsumptions.length > 0;

                                return isLotEnabled && !priceOnlyMode ? (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenLotDialog(index)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] ${
                                            hasLotSelected
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'
                                        }`}
                                        title={hasLotSelected ? 'Lot seçildi - değiştirmek için tıkla' : 'Lot seçmek için tıkla'}
                                    >
                                        {hasLotSelected ? '✓ Lot Seçildi' : '📦 Lot Seç'}
                                    </button>
                                ) : null;
                            })()}

                            {!priceOnlyMode && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    aria-label="Ürünü Sil"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {!priceOnlyMode && (
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full sm:w-auto text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 min-h-[44px]"
                >
                    + Ürün Ekle
                </button>
            )}
            {priceOnlyMode && (
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    ℹ️ Sevk edilmiş sipariş: Sadece fiyatlar düzenlenebilir
                </div>
            )}

            {/* Lot Selection Dialog */}
            {lotDialogState && (
                <LotSelectionDialog
                    isOpen={lotDialogState.isOpen}
                    productId={lotDialogState.productId}
                    productName={lotDialogState.productName}
                    quantityNeeded={lotDialogState.quantityNeeded}
                    unit={lotDialogState.unit}
                    suggestedLots={lotDialogState.suggestedLots}
                    availableLots={lotDialogState.availableLots}
                    onConfirm={handleLotConfirm}
                    onCancel={handleLotCancel}
                />
            )}
        </div>
    );
};

export default ItemEditor;
