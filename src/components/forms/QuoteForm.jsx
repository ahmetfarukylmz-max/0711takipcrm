import React, { useState, useMemo } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import ItemEditor from './ItemEditor';
import { turkeyVATRates, currencies, DEFAULT_CURRENCY } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const QuoteForm = ({ quote, onSave, onCancel, customers, products, orders = [], shipments = [] }) => {
    const [formData, setFormData] = useState(quote || {
        customerId: customers[0]?.id || '',
        items: [],
        gecerlilik_tarihi: '',
        status: 'Hazırlandı',
        vatRate: 20,
        paymentType: 'Peşin',
        paymentTerm: '',
        currency: DEFAULT_CURRENCY,
        notes: '',
        rejection_reason: ''
    });
    const [items, setItems] = useState(
        (quote?.items || []).map(item => ({
            ...item,
            unit: 'Kg'
        }))
    );

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

    const timelineEvents = useMemo(() => {
        if (!quote) return [];

        const events = [
            { date: quote.teklif_tarihi, description: 'Teklif oluşturuldu.', status: 'Hazırlandı' }
        ];

        if (quote.status === 'Onaylandı' && quote.orderId) {
            const order = orders.find(o => o.id === quote.orderId);
            if (order) {
                events.push({ date: order.order_date, description: `Siparişe dönüştürüldü. (Sipariş No: #${order.id.slice(-6)})`, status: 'Onaylandı' });

                const relatedShipments = shipments.filter(s => s.orderId === order.id);
                relatedShipments.forEach(shipment => {
                    events.push({ date: shipment.shipment_date, description: `Sipariş sevk edildi. (Nakliyeci: ${shipment.transporter})`, status: shipment.status });
                    if (shipment.status === 'Teslim Edildi') {
                        events.push({ date: shipment.delivery_date, description: 'Sipariş teslim edildi.', status: 'Teslim Edildi' });
                    }
                });
            }
        }

        if (quote.status === 'Reddedildi') {
            events.push({ date: null, description: `Teklif reddedildi. Neden: ${quote.rejection_reason || 'Belirtilmemiş'}` , status: 'Reddedildi' });
        }

        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [quote, orders, shipments]);

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
                    label="Geçerlilik Tarihi"
                    name="gecerlilik_tarihi"
                    type="date"
                    value={formData.gecerlilik_tarihi}
                    onChange={e => setFormData({ ...formData, gecerlilik_tarihi: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                    label="Durum"
                    name="status"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="Hazırlandı">Hazırlandı</option>
                    <option value="Onaylandı">Onaylandı</option>
                    <option value="Reddedildi">Reddedildi</option>
                </FormSelect>

                {formData.status === 'Reddedildi' && (
                    <FormTextarea
                        label="Reddedilme Nedeni"
                        name="rejection_reason"
                        value={formData.rejection_reason}
                        onChange={e => setFormData({ ...formData, rejection_reason: e.target.value })}
                        placeholder="Teklifin neden reddedildiğini açıklayın..."
                        rows={3}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormSelect
                    label="Para Birimi"
                    name="currency"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
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
                placeholder="Teklif ile ilgili özel notlar ekleyebilirsiniz..."
                rows={3}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
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

            {quote && (
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Teklif Zaman Çizelgesi</h3>
                    <div className="space-y-2">
                        {timelineEvents.map((event, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="text-xs text-gray-500">{formatDate(event.date)}</div>
                                <div className="text-sm text-gray-700">{event.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                    Teklifi Kaydet
                </button>
            </div>

        </form>
    );
};

export default QuoteForm;
