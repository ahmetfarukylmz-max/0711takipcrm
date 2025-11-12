import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormSelect from '../common/FormSelect';
import FormInput from '../common/FormInput';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';
import ProductForm from './ProductForm';
import { PlusIcon } from '../icons';
import type { InquiredProduct, Product } from '../../types';

interface InquiredProductModalProps {
    products: Product[];
    onSave: (product: Omit<InquiredProduct, 'id'>) => void;
    onCancel: () => void;
    onProductSave: (product: Partial<Product>) => Promise<string | void>;
    existingProduct?: InquiredProduct;
}

const InquiredProductModal: React.FC<InquiredProductModalProps> = ({
    products,
    onSave,
    onCancel,
    onProductSave,
    existingProduct
}) => {
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        productId: existingProduct?.productId || '',
        quantity: existingProduct?.quantity || '',
        unit: existingProduct?.unit || 'Kg',
        priority: existingProduct?.priority || '',
        notes: existingProduct?.notes || '',
        priceQuoted: existingProduct?.priceQuoted || ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewProductSave = async (productData: Partial<Product>) => {
        const newProductId = await onProductSave(productData);
        if (newProductId) {
            setFormData(prev => ({ ...prev, productId: newProductId }));
        }
        setIsNewProductModalOpen(false);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.productId) {
            return;
        }

        const selectedProduct = products.find(p => p.id === formData.productId);
        if (!selectedProduct) return;

        // Build inquired product object without undefined values
        const inquiredProduct: any = {
            productId: formData.productId,
            productName: selectedProduct.name
        };

        // Only add optional fields if they have values
        if (formData.quantity && Number(formData.quantity) > 0) {
            inquiredProduct.quantity = Number(formData.quantity);
        }

        if (formData.unit) {
            inquiredProduct.unit = formData.unit;
        }

        if (formData.priority) {
            inquiredProduct.priority = formData.priority;
        }

        if (formData.notes && formData.notes.trim()) {
            inquiredProduct.notes = formData.notes.trim();
        }

        if (formData.priceQuoted && Number(formData.priceQuoted) > 0) {
            inquiredProduct.priceQuoted = Number(formData.priceQuoted);
        }

        onSave(inquiredProduct as Omit<InquiredProduct, 'id'>);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <FormSelect
                            label="Ürün"
                            name="productId"
                            value={formData.productId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Ürün Seçin</option>
                            {products
                                .filter(p => !p.isDeleted)
                                .map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                        </FormSelect>
                    </div>
                    <button
                        type="button"
                        title="Yeni Ürün Ekle"
                        onClick={() => setIsNewProductModalOpen(true)}
                        className="p-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        <PlusIcon className="w-5 h-5 !mr-0" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Miktar (Opsiyonel)"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Örn: 2000"
                    step="0.01"
                />
                <FormSelect
                    label="Birim"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                >
                    <option value="Kg">Kg</option>
                    <option value="Adet">Adet</option>
                    <option value="Metre">Metre</option>
                    <option value="Ton">Ton</option>
                    <option value="Paket">Paket</option>
                    <option value="Kutu">Kutu</option>
                </FormSelect>
            </div>

            <FormSelect
                label="İlgi Seviyesi (Opsiyonel)"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
            >
                <option value="">Seçiniz</option>
                <option value="Düşük">🔵 Düşük - Sadece bilgi aldı</option>
                <option value="Orta">🟡 Orta - İlgileniyor</option>
                <option value="Yüksek">🔴 Yüksek - Acil ihtiyacı var</option>
            </FormSelect>

            <FormInput
                label="Sözlü Fiyat Verildi mi? (Opsiyonel)"
                name="priceQuoted"
                type="number"
                value={formData.priceQuoted}
                onChange={handleChange}
                placeholder="Örn: 85.50"
                step="0.01"
            />

            <FormTextarea
                label="Notlar (Opsiyonel)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Örn: Fiyat sordu, gelecek hafta karar verecek"
                rows={3}
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
                    {existingProduct ? 'Güncelle' : 'Ekle'}
                </button>
            </div>
        </form>
        <Modal
            show={isNewProductModalOpen}
            onClose={() => setIsNewProductModalOpen(false)}
            title="Yeni Ürün Ekle"
        >
            <ProductForm
                onSave={handleNewProductSave}
                onCancel={() => setIsNewProductModalOpen(false)}
            />
        </Modal>
        </>
    );
};

export default InquiredProductModal;
