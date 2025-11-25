import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import ItemEditor from './ItemEditor';
import { turkeyVATRates, currencies, DEFAULT_CURRENCY } from '../../constants';
import { formatCurrency } from '../../utils/formatters';
import type { Order, Customer, Product, OrderItem, VATRate, Currency } from '../../types';
import { logger } from '../../utils/logger';

interface OrderFormData {
    customerId: string;
    items: OrderItem[];
    order_date: string;
    delivery_date: string;
    vatRate: VATRate;
    paymentType: string;
    paymentTerm: string | number;
    checkBank?: string;
    checkNumber?: string;
    checkDate?: string;
    currency: Currency;
    notes: string;
}

interface OrderFormProps {
    /** Order to edit (undefined for new order) */
    order?: Partial<Order>;
    /** Callback when order is saved */
    onSave: (order: Partial<Order>) => void;
    /** Callback when form is cancelled */
    onCancel: () => void;
    /** List of customers */
    customers: Customer[];
    /** List of products */
    products: Product[];
    /** If true, only allow editing prices (for shipped orders) */
    priceOnlyMode?: boolean;
}

/**
 * OrderForm component - Form for creating and editing orders
 */
const OrderForm: React.FC<OrderFormProps> = ({ order, onSave, onCancel, customers, products, priceOnlyMode = false }) => {
    const [formData, setFormData] = useState<OrderFormData>({
        customerId: order?.customerId || customers[0]?.id || '',
        items: order?.items || [],
        order_date: order?.order_date || new Date().toISOString().slice(0, 10),
        delivery_date: order?.delivery_date || '',
        vatRate: order?.vatRate || 20,
        paymentType: order?.paymentType || 'Peşin',
        paymentTerm: order?.paymentTerm || '',
        checkBank: order?.checkBank || '',
        checkNumber: order?.checkNumber || '',
        checkDate: order?.checkDate || '',
        currency: order?.currency || DEFAULT_CURRENCY,
        notes: order?.notes || ''
    });
    const [items, setItems] = useState<OrderItem[]>(
        (order?.items || []).map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                ...item,
                productName: item.productName || product?.name || '',
                unit: item.unit || product?.unit || 'Kg'
            };
        })
    );

    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const vatAmount = subtotal * (formData.vatRate / 100);
    const total = subtotal + vatAmount;

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate: Items cannot be empty
        if (items.length === 0) {
            alert('En az bir ürün eklemelisiniz!');
            return;
        }

        // Clean items - Remove undefined values from each item
        const cleanItems = items.map(item => {
            const cleanItem: any = {
                productId: item.productId || '',
                productName: item.productName || 'Belirtilmemiş',
                quantity: item.quantity || 0,
                unit_price: item.unit_price || 0,
                unit: item.unit || 'Kg'
            };
            // Only add optional fields if they exist
            if (item.product_code) cleanItem.product_code = item.product_code;
            if (item.notes) cleanItem.notes = item.notes;
            return cleanItem;
        });

        // Validate items - ensure all have productId and productName
        const invalidItems = cleanItems.filter(item => !item.productId || !item.productName);
        if (invalidItems.length > 0) {
            alert('Bazı ürünlerde eksik bilgi var. Lütfen tüm ürünleri düzgün seçtiğinizden emin olun.');
            logger.error('❌ Hatalı ürünler:', invalidItems);
            return;
        }

        // Clean data - Firestore doesn't accept undefined values
        const cleanData: any = {
            customerId: formData.customerId,
            items: cleanItems,
            order_date: formData.order_date,
            vatRate: formData.vatRate,
            paymentType: formData.paymentType,
            currency: formData.currency,
            subtotal,
            vatAmount,
            total_amount: total
        };

        // Preserve order status when editing (don't reset to 'Bekliyor')
        if (order?.status) {
            cleanData.status = order.status;
        }

        // Add optional fields only if they have values
        if (formData.delivery_date) cleanData.delivery_date = formData.delivery_date;
        if (formData.notes) cleanData.notes = formData.notes;

        // Payment-specific fields
        if (formData.paymentType === 'Vadeli' && formData.paymentTerm) {
            cleanData.paymentTerm = formData.paymentTerm;
        }

        if (formData.paymentType === 'Çek') {
            if (formData.checkBank) cleanData.checkBank = formData.checkBank;
            if (formData.checkNumber) cleanData.checkNumber = formData.checkNumber;
            if (formData.checkDate) cleanData.checkDate = formData.checkDate;
        }

        // Mevcut sipariş düzenleme ise id'yi ekle (yoksa yeni sipariş olarak kaydedilir!)
        if (order?.id) {
            cleanData.id = order.id;
        }

        onSave(cleanData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {priceOnlyMode && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700 dark:text-amber-200">
                                <strong>Sevk Edilmiş Sipariş:</strong> Bu sipariş sevk edildiği için müşteri, ürünler ve miktarlar değiştirilemez. Fiyatlar, ödeme şekilleri ve teslim tarihi düzenlenebilir.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <FormSelect
                label="Müşteri"
                name="customerId"
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                required
                disabled={priceOnlyMode}
            >
                <option value="">Müşteri Seçin</option>
                {customers.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </FormSelect>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Sipariş Tarihi"
                    name="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                    required
                    disabled={priceOnlyMode}
                />
                <FormInput
                    label="Teslim Tarihi"
                    name="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    disabled={false}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormSelect
                    label="Para Birimi"
                    name="currency"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                >
                    {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                        </option>
                    ))}
                </FormSelect>
                <FormSelect
                    label="Ödeme Tipi"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={e => setFormData({
                        ...formData,
                        paymentType: e.target.value,
                        paymentTerm: e.target.value === 'Peşin' ? '' : formData.paymentTerm,
                        checkBank: e.target.value === 'Çek' ? formData.checkBank : '',
                        checkNumber: e.target.value === 'Çek' ? formData.checkNumber : '',
                        checkDate: e.target.value === 'Çek' ? formData.checkDate : ''
                    })}
                >
                    <option value="Peşin">Peşin</option>
                    <option value="Vadeli">Vadeli</option>
                    <option value="Çek">Çek</option>
                </FormSelect>
                {formData.paymentType === 'Vadeli' && (
                    <FormInput
                        label="Vade Süresi (gün)"
                        name="paymentTerm"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        placeholder="Örn: 30, 60, 90"
                        value={formData.paymentTerm}
                        onChange={e => setFormData({ ...formData, paymentTerm: e.target.value })}
                        required
                    />
                )}
                {formData.paymentType === 'Çek' && (
                    <>
                        <FormInput
                            label="Banka Adı"
                            name="checkBank"
                            type="text"
                            placeholder="Örn: İş Bankası, Garanti"
                            value={formData.checkBank || ''}
                            onChange={e => setFormData({ ...formData, checkBank: e.target.value })}
                        />
                        <FormInput
                            label="Çek Numarası"
                            name="checkNumber"
                            type="text"
                            placeholder="Örn: 123456"
                            value={formData.checkNumber || ''}
                            onChange={e => setFormData({ ...formData, checkNumber: e.target.value })}
                        />
                        <FormInput
                            label="Çek Vadesi"
                            name="checkDate"
                            type="date"
                            value={formData.checkDate || ''}
                            onChange={e => setFormData({ ...formData, checkDate: e.target.value })}
                        />
                    </>
                )}
            </div>

            <ItemEditor items={items} setItems={setItems} products={products} priceOnlyMode={priceOnlyMode} />

            <FormTextarea
                label="Özel Notlar"
                name="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Sipariş ile ilgili özel notlar ekleyebilirsiniz..."
                rows={3}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                <FormSelect
                    label="KDV Oranı"
                    name="vatRate"
                    value={formData.vatRate}
                    onChange={e => setFormData({ ...formData, vatRate: Number(e.target.value) as VATRate })}
                >
                    {turkeyVATRates.map(vat => (
                        <option key={vat.rate} value={vat.rate}>
                            %{vat.rate} - {vat.description}
                        </option>
                    ))}
                </FormSelect>
                <div className="space-y-2 text-right p-4 rounded-lg bg-gray-100 dark:bg-gray-600">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Ara Toplam:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotal, formData.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">KDV (%{formData.vatRate}):</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(vatAmount, formData.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-800 dark:text-gray-200">Genel Toplam:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total, formData.currency)}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
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
                    Siparişi Kaydet
                </button>
            </div>
        </form>
    );
};

export default OrderForm;
