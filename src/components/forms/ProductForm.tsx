import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import { currencies, DEFAULT_CURRENCY } from '../../constants';
import type { Product, Currency } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { PRODUCT_CATEGORIES, getCategoryById } from '../../utils/categories';
import { getNextProductCode } from '../../services/counterService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
    unit: string;
    currency: Currency;
    category: string;
    track_stock: boolean;
    stock_quantity: string | number;
    minimum_stock: string | number;
    // Hybrid Costing System
    lotTrackingEnabled: boolean;
    costingMethod: 'fifo' | 'lifo' | 'average';
    allowManualLotSelection: boolean;
    requireLotApproval: boolean;
}

/**
 * ProductForm component - Form for creating/editing products
 */
const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const { user } = useAuth();
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [formData, setFormData] = useState<ProductFormData>({
        name: product?.name || '',
        code: product?.code || '',
        description: product?.description || '',
        cost_price: product?.cost_price || '',
        selling_price: product?.selling_price || '',
        unit: product?.unit || 'Kg',
        currency: product?.currency || DEFAULT_CURRENCY,
        category: product?.category || '',
        track_stock: product?.track_stock || false,
        stock_quantity: product?.stock_quantity || '',
        minimum_stock: product?.minimum_stock || '',
        // Hybrid Costing System
        lotTrackingEnabled: product?.lotTrackingEnabled || false,
        costingMethod: product?.costingMethod || 'average',
        allowManualLotSelection: product?.allowManualLotSelection || false,
        requireLotApproval: product?.requireLotApproval || false
    });

    const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        let sanitizedValue = value;

        // Apply sanitization for text fields
        if (name === 'name' || name === 'code' || name === 'description') {
            sanitizedValue = sanitizeText(value);
        }

        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

        // Auto-generate code when category changes
        if (name === 'category' && value) {
            if (!user) return;
            
            const category = getCategoryById(value);
            if (category && category.prefix) {
                // Only generate if code is empty or looks like an auto-generated code (to avoid overwriting custom codes)
                // Actually, user request implies auto-fill on selection.
                // Let's set a loading state or placeholder
                setIsGeneratingCode(true);
                try {
                    const newCode = await getNextProductCode(user.uid, category.prefix);
                    setFormData(prev => ({ ...prev, code: newCode }));
                } catch (error) {
                    console.error("Error generating code", error);
                } finally {
                    setIsGeneratingCode(false);
                }
            }
        }
    };

    // Removed manual button handler as it is now automatic

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.category) {
            toast.error('Lütfen bir kategori seçin');
            return;
        }

        // Build product object and remove undefined values
        const productData: Partial<Product> = {
            ...product,
            name: formData.name,
            cost_price: typeof formData.cost_price === 'string' ? parseFloat(formData.cost_price) : formData.cost_price,
            selling_price: typeof formData.selling_price === 'string' ? parseFloat(formData.selling_price) : formData.selling_price,
            unit: formData.unit,
            currency: formData.currency,
            track_stock: formData.track_stock,
        };

        // Add optional fields only if they have values
        if (formData.code) productData.code = formData.code;
        if (formData.description) productData.description = formData.description;
        if (formData.category) productData.category = formData.category;

        if (formData.track_stock && formData.stock_quantity !== '') {
            productData.stock_quantity = typeof formData.stock_quantity === 'string'
                ? parseFloat(formData.stock_quantity)
                : formData.stock_quantity;
        }

        if (formData.track_stock && formData.minimum_stock !== '') {
            productData.minimum_stock = typeof formData.minimum_stock === 'string'
                ? parseFloat(formData.minimum_stock)
                : formData.minimum_stock;
        }

        // Add hybrid costing system fields
        productData.lotTrackingEnabled = formData.lotTrackingEnabled;
        productData.costingMethod = formData.costingMethod;
        productData.allowManualLotSelection = formData.allowManualLotSelection;
        productData.requireLotApproval = formData.requireLotApproval;

        onSave(productData);
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection - Now Required */}
                <FormSelect
                    label="Kategori"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                >
                    <option value="">Kategori Seçiniz</option>
                    {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                        </option>
                    ))}
                </FormSelect>

                {/* Ürün Kodu - Auto Generated */}
                <div className="relative">
                    <FormInput
                        label="Ürün Kodu"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder={isGeneratingCode ? "Oluşturuluyor..." : "Otomatik (Kategori Seçince)"}
                        disabled={isGeneratingCode}
                    />
                    {isGeneratingCode && (
                        <div className="absolute right-3 top-9">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormSelect
                    label="Birim"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                >
                    <option value="Kg">Kg</option>
                    <option value="Adet">Adet</option>
                </FormSelect>
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

            {/* Hybrid Costing System */}
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📦</span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Lot Takibi ve Maliyet Yönetimi
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="lotTrackingEnabled"
                        name="lotTrackingEnabled"
                        checked={formData.lotTrackingEnabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="lotTrackingEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Lot/Parti Takibi Aktif (Maliyetler lot bazlı takip edilir)
                    </label>
                </div>

                {formData.lotTrackingEnabled && (
                    <div className="space-y-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                        <FormSelect
                            label="Maliyet Yöntemi"
                            name="costingMethod"
                            value={formData.costingMethod}
                            onChange={handleChange}
                        >
                            <option value="average">Ağırlıklı Ortalama (Average)</option>
                            <option value="fifo">İlk Giren İlk Çıkar (FIFO)</option>
                            <option value="lifo">Son Giren İlk Çıkar (LIFO)</option>
                        </FormSelect>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allowManualLotSelection"
                                name="allowManualLotSelection"
                                checked={formData.allowManualLotSelection}
                                onChange={handleChange}
                                disabled={formData.costingMethod === 'average'}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                            />
                            <label htmlFor="allowManualLotSelection" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                Manuel lot seçimine izin ver (Satış sırasında kullanıcı istediği lotu seçebilir)
                            </label>
                        </div>

                        {formData.allowManualLotSelection && (
                            <div className="flex items-center gap-2 pl-6">
                                <input
                                    type="checkbox"
                                    id="requireLotApproval"
                                    name="requireLotApproval"
                                    checked={formData.requireLotApproval}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="requireLotApproval" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    FIFO ihlalleri için onay gerektir
                                </label>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 rounded p-3 text-sm">
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                                <strong className="text-gray-900 dark:text-gray-100">ℹ️ Açıklamalar:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                <li><strong>FIFO:</strong> En eski stok önce kullanılır (muhasebe standardı)</li>
                                <li><strong>LIFO:</strong> En yeni stok önce kullanılır</li>
                                <li><strong>Ortalama:</strong> Tüm lotların ağırlıklı ortalaması kullanılır</li>
                                <li><strong>Manuel Seçim:</strong> Kullanıcı depoda hangi lotu kullandıysa onu seçer</li>
                            </ul>
                        </div>
                    </div>
                )}

                {!formData.lotTrackingEnabled && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        💡 Lot takibi, aynı ürünün farklı zamanlarda farklı maliyetlerle alındığında kar analizini doğru yapmanızı sağlar.
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
