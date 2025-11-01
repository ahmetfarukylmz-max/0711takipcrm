import React from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import { TrashIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';

// Normalize unit values (convert lowercase to capitalized)
const normalizeUnit = (unit) => {
    if (!unit) return 'Adet';
    if (unit.toLowerCase() === 'adet') return 'Adet';
    if (unit.toLowerCase() === 'kg') return 'Kg';
    return unit;
};

const ItemEditor = ({ items, setItems, products }) => {
    // Normalize units when component receives items
    React.useEffect(() => {
        const normalizedItems = items.map(item => ({
            ...item,
            unit: normalizeUnit(item.unit)
        }));

        // Only update if there's a difference
        const hasChanges = items.some((item, index) => item.unit !== normalizedItems[index].unit);
        if (hasChanges) {
            setItems(normalizedItems);
        }
    }, []);

    const handleAddItem = () => {
        if (products.length > 0) {
            const firstProduct = products[0];
            setItems([
                ...items,
                {
                    productId: firstProduct.id,
                    quantity: 1,
                    unit: 'Adet',
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
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Ürünler</h4>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center">
                        <div className="flex-1 min-w-[240px]">
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
                        <div className="w-24">
                            <FormInput
                                type="number"
                                value={item.quantity}
                                onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                min="1"
                                placeholder="Miktar"
                            />
                        </div>
                        <div className="w-28">
                            <select
                                value={item.unit || 'Adet'}
                                onChange={e => handleItemChange(index, 'unit', e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="Adet">Adet</option>
                                <option value="Kg">Kg</option>
                            </select>
                        </div>
                        <div className="w-36">
                            <FormInput
                                type="number"
                                value={item.unit_price}
                                onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                step="0.01"
                                placeholder="Birim Fiyat"
                            />
                        </div>
                        <div className="w-36 text-sm text-gray-700 dark:text-gray-300 text-right font-medium">
                            {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                        </div>
                        <div className="w-10">
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
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
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
                + Ürün Ekle
            </button>
        </div>
    );
};

export default ItemEditor;
