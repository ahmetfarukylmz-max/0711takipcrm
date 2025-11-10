import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import { currencies, DEFAULT_CURRENCY } from '../../constants';
import type { Product, Currency } from '../../types';

interface ProductFormProps {
    /** Existing product to edit (undefined for new product) */
    product?: Partial<Product>;
    /** Callback when form is submitted */
    onSave: (product: Partial<Product>) => void;
    /** Callback when form is cancelled */
    onCancel: () => void;
}

interface ProductFormData {
    name: string;
    code: string;
    description: string;
    cost_price: string | number;
    selling_price: string | number;
    currency: Currency;
}

/**
 * ProductForm component - Form for creating/editing products
 */
const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState<ProductFormData>({
        name: product?.name || '',
        code: product?.id || '',
        description: product?.description || '',
        cost_price: product?.cost_price || '',
        selling_price: product?.selling_price || '',
        currency: (product as any)?.currency || DEFAULT_CURRENCY
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({
            ...product,
            name: formData.name,
            description: formData.description,
            cost_price: typeof formData.cost_price === 'string' ? parseFloat(formData.cost_price) : formData.cost_price,
            selling_price: typeof formData.selling_price === 'string' ? parseFloat(formData.selling_price) : formData.selling_price,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
                label="Ürün Adı"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <FormInput
                label="Ürün Kodu"
                name="code"
                value={formData.code}
                onChange={handleChange}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormSelect
                    label="Para Birimi"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                >
                    {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                        </option>
                    ))}
                </FormSelect>
                <FormInput
                    label={`Maliyet Fiyatı (${formData.currency === 'USD' ? '$' : '₺'})`}
                    name="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleChange}
                    required
                />
                <FormInput
                    label={`Satış Fiyatı (${formData.currency === 'USD' ? '$' : '₺'})`}
                    name="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={handleChange}
                    required
                />
            </div>
            <FormTextarea
                label="Açıklama"
                name="description"
                value={formData.description}
                onChange={handleChange}
            />
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Kaydet
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
