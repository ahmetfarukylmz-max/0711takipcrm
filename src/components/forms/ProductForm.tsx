import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import { currencies, DEFAULT_CURRENCY } from '../../constants';
import type { Product, Currency } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { PRODUCT_CATEGORIES } from '../../utils/categories';

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
    category: string;
    tags: string;
    track_stock: boolean;
    stock_quantity: string | number;
    minimum_stock: string | number;
}

/**
 * ProductForm component - Form for creating/editing products
 */
const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState<ProductFormData>({
        name: product?.name || '',
        code: product?.code || '',
        description: product?.description || '',
        cost_price: product?.cost_price || '',
        selling_price: product?.selling_price || '',
        currency: product?.currency || DEFAULT_CURRENCY,
        category: product?.category || '',
        tags: product?.tags?.join(', ') || '',
        track_stock: product?.track_stock || false,
        stock_quantity: product?.stock_quantity || '',
        minimum_stock: product?.minimum_stock || ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
            return;
        }

        let sanitizedValue = value;

        // Apply sanitization for text fields
        if (name === 'name' || name === 'code' || name === 'description' || name === 'tags') {
            sanitizedValue = sanitizeText(value);
        }

        setFormData({ ...formData, [name]: sanitizedValue });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Parse tags from comma-separated string
        const tagsArray = formData.tags
            ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            : [];

        onSave({
            ...product,
            name: formData.name,
            code: formData.code || undefined,
            description: formData.description || undefined,
            cost_price: typeof formData.cost_price === 'string' ? parseFloat(formData.cost_price) : formData.cost_price,
            selling_price: typeof formData.selling_price === 'string' ? parseFloat(formData.selling_price) : formData.selling_price,
            currency: formData.currency,
            category: formData.category || undefined,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            track_stock: formData.track_stock,
            stock_quantity: formData.track_stock && formData.stock_quantity !== ''
                ? (typeof formData.stock_quantity === 'string' ? parseFloat(formData.stock_quantity) : formData.stock_quantity)
                : undefined,
            minimum_stock: formData.track_stock && formData.minimum_stock !== ''
                ? (typeof formData.minimum_stock === 'string' ? parseFloat(formData.minimum_stock) : formData.minimum_stock)
                : undefined,
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
                    inputMode="decimal"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleChange}
                    required
                />
                <FormInput
                    label={`Satış Fiyatı (${formData.currency === 'USD' ? '$' : '₺'})`}
                    name="selling_price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={handleChange}
                    required
                />
            </div>

            {/* Category Selection */}
            <FormSelect
                label="Kategori (Opsiyonel)"
                name="category"
                value={formData.category}
                onChange={handleChange}
            >
                <option value="">Kategori Seçiniz</option>
                {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                    </option>
                ))}
            </FormSelect>

            <FormInput
                label="Etiketler (Opsiyonel)"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Virgülle ayırarak etiket ekleyin (örn: yeni, indirimli, popüler)"
            />

            {/* Stock Management */}
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="track_stock"
                        name="track_stock"
                        checked={formData.track_stock}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="track_stock" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Stok Takibi Yap
                    </label>
                </div>

                {formData.track_stock && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <FormInput
                            label="Mevcut Stok Miktarı"
                            name="stock_quantity"
                            type="number"
                            inputMode="numeric"
                            step="0.01"
                            value={formData.stock_quantity}
                            onChange={handleChange}
                            placeholder="Örn: 100"
                        />
                        <FormInput
                            label="Minimum Stok Seviyesi"
                            name="minimum_stock"
                            type="number"
                            inputMode="numeric"
                            step="0.01"
                            value={formData.minimum_stock}
                            onChange={handleChange}
                            placeholder="Örn: 10"
                        />
                    </div>
                )}
                {formData.track_stock && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        💡 Stok miktarı minimum seviyenin altına düştüğünde uyarı alırsınız
                    </p>
                )}
            </div>

            <FormTextarea
                label="Açıklama"
                name="description"
                value={formData.description}
                onChange={handleChange}
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2.5 min-h-[44px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 active:scale-[0.98] transition-transform"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-[0.98] transition-transform"
                >
                    Kaydet
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
