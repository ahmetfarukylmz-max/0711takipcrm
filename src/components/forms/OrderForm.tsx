import React, { useState, ChangeEvent, FormEvent, useMemo } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import ItemEditor from './ItemEditor';
import { turkeyVATRates, currencies, DEFAULT_CURRENCY } from '../../constants';
import { formatCurrency } from '../../utils/formatters';
import { getAvailableAdvance } from '../../utils/cariHelpers';
import type { Order, Customer, Product, OrderItem, VATRate, Currency, Payment } from '../../types';

interface OrderFormData {
    customerId: string;
    items: OrderItem[];
    delivery_date: string;
    vatRate: VATRate;
    paymentType: string;
    paymentTerm: string | number;
    currency: Currency;
    notes: string;
    appliedAdvance: number;
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
    /** List of payments for advance calculation */
    payments?: Payment[];
}

/**
 * OrderForm component - Form for creating and editing orders
 */
const OrderForm: React.FC<OrderFormProps> = ({ order, onSave, onCancel, customers, products, payments = [] }) => {
    const [formData, setFormData] = useState<OrderFormData>(order || {
        customerId: customers[0]?.id || '',
        items: [],
        delivery_date: '',
        vatRate: 20,
        paymentType: 'Peşin',
        paymentTerm: '',
        currency: DEFAULT_CURRENCY,
        notes: '',
        appliedAdvance: 0
    });
    const [items, setItems] = useState<OrderItem[]>(
        (order?.items || []).map(item => ({
            ...item,
            unit: 'Kg'
        }))
    );

    // Calculate available advance for selected customer
    const availableAdvance = useMemo(() => {
        if (!formData.customerId || !payments.length) return 0;
        return getAvailableAdvance(formData.customerId, payments);
    }, [formData.customerId, payments]);

    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const vatAmount = subtotal * (formData.vatRate / 100);
    const totalBeforeAdvance = subtotal + vatAmount;
    const total = totalBeforeAdvance - formData.appliedAdvance;

    const handleApplyAdvance = (amount: number) => {
        // Ensure applied advance doesn't exceed available or total
        const maxApplicable = Math.min(availableAdvance, totalBeforeAdvance);
        const appliedAmount = Math.min(Math.max(0, amount), maxApplicable);
        setFormData({ ...formData, appliedAdvance: appliedAmount });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({
            ...formData,
            items,
            subtotal,
            vatAmount,
            total_amount: total,
            appliedAdvance: formData.appliedAdvance
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                    label="Müşteri"
                    name="customerId"
                    value={formData.customerId}
                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                    required
                >
                    <option value="">Müşteri Seçin</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </FormSelect>
                <FormInput
                    label="Teslim Tarihi"
                    name="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, paymentType: e.target.value, paymentTerm: e.target.value === 'Peşin' ? '' : formData.paymentTerm })}
                >
                    <option value="Peşin">Peşin</option>
                    <option value="Vadeli">Vadeli</option>
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
            </div>

            <ItemEditor items={items} setItems={setItems} products={products} />

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
                    {formData.appliedAdvance > 0 && (
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                            <span>Uygulanan Avans:</span>
                            <span className="font-medium">-{formatCurrency(formData.appliedAdvance, 'TRY')}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-800 dark:text-gray-200">Genel Toplam:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total, formData.currency)}</span>
                    </div>
                </div>
            </div>

            {/* Advance Payment Application */}
            {availableAdvance > 0 && formData.customerId && (
                <div className="p-4 rounded-lg border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">💵</span>
                            <div>
                                <h4 className="font-semibold text-green-900 dark:text-green-100">
                                    Kullanılabilir Avans
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {formatCurrency(availableAdvance, 'TRY')} avans bakiyesi mevcut
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <FormInput
                                label="Uygulanacak Avans Tutarı (TRY)"
                                name="appliedAdvance"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max={Math.min(availableAdvance, totalBeforeAdvance)}
                                step="0.01"
                                value={formData.appliedAdvance}
                                onChange={e => handleApplyAdvance(Number(e.target.value))}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-2 items-end">
                            <button
                                type="button"
                                onClick={() => handleApplyAdvance(Math.min(availableAdvance, totalBeforeAdvance))}
                                className="px-4 py-2 min-h-[44px] bg-green-600 text-white rounded-md hover:bg-green-700 active:scale-[0.98] transition-transform whitespace-nowrap"
                            >
                                Tümünü Uygula
                            </button>
                            {formData.appliedAdvance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleApplyAdvance(0)}
                                    className="px-4 py-2 min-h-[44px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 active:scale-[0.98] transition-transform whitespace-nowrap"
                                >
                                    Temizle
                                </button>
                            )}
                        </div>
                    </div>
                    {formData.appliedAdvance > 0 && (
                        <div className="mt-3 p-3 rounded-md bg-white dark:bg-gray-800 border border-green-300 dark:border-green-600">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Kalan Avans:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(availableAdvance - formData.appliedAdvance, 'TRY')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
