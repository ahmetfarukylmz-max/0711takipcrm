import React, { useState } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import ItemEditor from './ItemEditor';
import { turkeyVATRates } from '../../constants';
import { formatCurrency } from '../../utils/formatters';

const QuoteForm = ({ quote, onSave, onCancel, customers, products }) => {
    const [formData, setFormData] = useState(quote || {
        customerId: customers[0]?.id || '',
        items: [],
        gecerlilik_tarihi: '',
        vatRate: 20
    });
    const [items, setItems] = useState(quote?.items || []);

    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const vatAmount = subtotal * (formData.vatRate / 100);
    const total = subtotal + vatAmount;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            items,
            subtotal,
            vatAmount,
            total_amount: total
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                    label="Geçerlilik Tarihi"
                    name="gecerlilik_tarihi"
                    type="date"
                    value={formData.gecerlilik_tarihi}
                    onChange={e => setFormData({ ...formData, gecerlilik_tarihi: e.target.value })}
                />
            </div>

            <ItemEditor items={items} setItems={setItems} products={products} />

            <div className="grid grid-cols-2 gap-4 items-end">
                <FormSelect
                    label="KDV Oranı"
                    name="vatRate"
                    value={formData.vatRate}
                    onChange={e => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                >
                    {turkeyVATRates.map(vat => (
                        <option key={vat.rate} value={vat.rate}>
                            %{vat.rate} - {vat.description}
                        </option>
                    ))}
                </FormSelect>
                <div className="space-y-2 text-right p-4 rounded-lg bg-gray-50">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ara Toplam:</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">KDV (%{formData.vatRate}):</span>
                        <span className="font-medium">{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-800">Genel Toplam:</span>
                        <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                    Teklifi Kaydet
                </button>
            </div>
        </form>
    );
};

export default QuoteForm;
