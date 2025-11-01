import React, { useState } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import { currencies, DEFAULT_CURRENCY } from '../../constants';

const ProductForm = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState(product || {
        name: '',
        code: '',
        description: '',
        cost_price: '',
        selling_price: '',
        currency: DEFAULT_CURRENCY
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
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
            <div className="grid grid-cols-3 gap-4">
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
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
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
