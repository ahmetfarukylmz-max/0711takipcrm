import React from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import { TrashIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';

const ItemEditor = ({ items, setItems, products }) => {
    const handleAddItem = () => {
        if (products.length > 0) {
            const firstProduct = products[0];
            setItems([
                ...items,
                {
                    productId: firstProduct.id,
                    quantity: 1,
                    unit: 'Kg',
                    unit_price: firstProduct.selling_price
                }
            ]);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];

        // Create a new object for the item to ensure React detects the change
        newItems[index] = {
            ...newItems[index],
            [field]: value
        };

        // Update unit price when product changes
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].unit_price = product.selling_price;
            }
        }

        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
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
                            <FormSelect
                                value={item.productId}
                                onChange={e => handleItemChange(index, 'productId', e.target.value)}
                            >
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </FormSelect>
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
                                />
                            </div>
                            <div className="w-12 sm:w-16 flex items-end sm:items-center justify-center pb-2 sm:pb-0">
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Kg</span>
                            </div>
                            <div className="flex-1 sm:w-28">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
                                    Fiyat
                                </label>
                                <FormInput
                                    type="number"
                                    value={item.unit_price}
                                    onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                    step="0.01"
                                    placeholder="Birim Fiyat"
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
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Ürünü Sil"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={handleAddItem}
                className="w-full sm:w-auto text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 min-h-[44px]"
            >
                + Ürün Ekle
            </button>
        </div>
    );
};

export default ItemEditor;
