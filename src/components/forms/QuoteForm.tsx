import React, { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import ItemEditor from './ItemEditor';
import { turkeyVATRates, currencies, DEFAULT_CURRENCY } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type {
  Quote,
  Customer,
  Product,
  Order,
  Shipment,
  OrderItem,
  VATRate,
  Currency,
} from '../../types';
import { logger } from '../../utils/logger';
import { sanitizeText } from '../../utils/sanitize';

interface QuoteFormData {
  customerId: string;
  items: OrderItem[];
  teklif_tarihi: string; // Added field
  gecerlilik_tarihi: string;
  status: string;
  vatRate: VATRate;
  paymentType: string;
  paymentTerm: string | number;
  currency: Currency;
  notes: string;
  rejection_reason: string;
}

interface TimelineEvent {
  date: any;
  description: string;
  status?: string;
}

interface QuoteFormProps {
  /** Quote to edit (undefined for new quote) */
  quote?: Partial<Quote>;
  /** Callback when quote is saved */
  onSave: (quote: Partial<Quote>) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** List of customers */
  customers: Customer[];
  /** List of products */
  products: Product[];
  /** List of orders (for timeline) */
  orders?: Order[];
  /** List of shipments (for timeline) */
  shipments?: Shipment[];
}

/**
 * QuoteForm component - Form for creating and editing quotes
 */
const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  onSave,
  onCancel,
  customers,
  products,
  orders = [],
  shipments = [],
}) => {
  const [formData, setFormData] = useState<QuoteFormData>(
    quote
      ? {
          customerId: quote.customerId || '',
          items: [],
          teklif_tarihi: quote.teklif_tarihi || new Date().toISOString().slice(0, 10),
          gecerlilik_tarihi: quote.gecerlilik_tarihi || '',
          status: quote.status || 'Hazırlandı',
          vatRate: quote.vatRate || 20,
          paymentType: quote.paymentType || 'Peşin',
          paymentTerm: quote.paymentTerm || '',
          currency: quote.currency || DEFAULT_CURRENCY,
          notes: quote.notes || '',
          rejection_reason: quote.rejection_reason || '',
        }
      : {
          customerId: customers[0]?.id || '',
          items: [],
          teklif_tarihi: new Date().toISOString().slice(0, 10),
          gecerlilik_tarihi: '',
          status: 'Hazırlandı',
          vatRate: 20,
          paymentType: 'Peşin',
          paymentTerm: '',
          currency: DEFAULT_CURRENCY,
          notes: '',
          rejection_reason: '',
        }
  );
  const [items, setItems] = useState<OrderItem[]>(
    (quote?.items || []).map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: item.productName || product?.name || '',
        unit: item.unit || product?.unit || 'Kg',
      };
    })
  );

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0
  );
  const vatAmount = subtotal * (formData.vatRate / 100);
  const total = subtotal + vatAmount;

  const handleFormSubmit = (e: React.MouseEvent<HTMLButtonElement>, status: string) => {
    e.preventDefault();

    // Validate: Items cannot be empty
    if (items.length === 0) {
      alert('En az bir ürün eklemelisiniz!');
      return;
    }

    // Clean items - Remove undefined values from each item
    const cleanItems = items.map((item) => {
      const cleanItem: any = {
        productId: item.productId || '',
        productName: item.productName || 'Belirtilmemiş',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        unit: item.unit || 'Kg',
      };
      // Only add optional fields if they exist
      if (item.product_code) cleanItem.product_code = item.product_code;
      if (item.notes) cleanItem.notes = item.notes;
      return cleanItem;
    });

    // Validate items - ensure all have productId and productName
    const invalidItems = cleanItems.filter((item) => !item.productId || !item.productName);
    if (invalidItems.length > 0) {
      alert('Bazı ürünlerde eksik bilgi var. Lütfen tüm ürünleri düzgün seçtiğinizden emin olun.');
      logger.error('❌ Hatalı ürünler:', invalidItems);
      return;
    }

    // Clean data - Firestore doesn't accept undefined values
    const cleanData: any = {
      customerId: formData.customerId,
      items: cleanItems,
      teklif_tarihi: formData.teklif_tarihi, // Include date
      status: status, // Use passed status
      vatRate: formData.vatRate,
      paymentType: formData.paymentType,
      currency: formData.currency,
      subtotal,
      vatAmount,
      total_amount: total,
    };

    // Add optional fields only if they have values
    if (formData.gecerlilik_tarihi) cleanData.gecerlilik_tarihi = formData.gecerlilik_tarihi;
    if (formData.notes) cleanData.notes = formData.notes;

    // Payment-specific fields
    if (formData.paymentType === 'Vadeli' && formData.paymentTerm) {
      cleanData.paymentTerm = formData.paymentTerm;
    }

    // Rejection reason (only if status is Reddedildi)
    if (status === 'Reddedildi' && formData.rejection_reason) {
      cleanData.rejection_reason = formData.rejection_reason;
    }

    onSave(cleanData);
  };

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!quote) return [];

    const events: TimelineEvent[] = [
      { date: quote.teklif_tarihi, description: 'Teklif oluşturuldu.', status: 'Hazırlandı' },
    ];

    if (quote.status === 'Onaylandı' && quote.orderId) {
      const order = orders.find((o) => o.id === quote.orderId);
      if (order) {
        events.push({
          date: order.order_date,
          description: `Siparişe dönüştürüldü. (Sipariş No: #${order.id.slice(-6)})`,
          status: 'Onaylandı',
        });

        const relatedShipments = shipments.filter((s) => s.orderId === order.id);
        relatedShipments.forEach((shipment) => {
          events.push({
            date: shipment.shipment_date,
            description: `Sipariş sevk edildi. (Nakliyeci: ${shipment.transporter})`,
            status: shipment.status,
          });
          if (shipment.status === 'Teslim Edildi') {
            events.push({
              date: shipment.delivery_date,
              description: 'Sipariş teslim edildi.',
              status: 'Teslim Edildi',
            });
          }
        });
      }
    }

    if (quote.status === 'Reddedildi') {
      events.push({
        date: null,
        description: `Teklif reddedildi. Neden: ${quote.rejection_reason || 'Belirtilmemiş'}`,
        status: 'Reddedildi',
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [quote, orders, shipments]);

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormSelect
          label="Müşteri"
          name="customerId"
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          required
        >
          <option value="">Müşteri Seçin</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </FormSelect>
        <FormInput
          label="Teklif Tarihi"
          name="teklif_tarihi"
          type="date"
          value={formData.teklif_tarihi}
          onChange={(e) => setFormData({ ...formData, teklif_tarihi: e.target.value })}
          required
        />
        <FormInput
          label="Geçerlilik Tarihi"
          name="gecerlilik_tarihi"
          type="date"
          value={formData.gecerlilik_tarihi}
          onChange={(e) => setFormData({ ...formData, gecerlilik_tarihi: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          label="Durum"
          name="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="Taslak">Taslak</option>
          <option value="Hazırlandı">Hazırlandı</option>
          <option value="Onaylandı">Onaylandı</option>
          <option value="Reddedildi">Reddedildi</option>
        </FormSelect>

        {formData.status === 'Reddedildi' && (
          <FormTextarea
            label="Reddedilme Nedeni"
            name="rejection_reason"
            value={formData.rejection_reason}
            onChange={(e) =>
              setFormData({ ...formData, rejection_reason: sanitizeText(e.target.value) })
            }
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
          onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
        >
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.name}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          label="Ödeme Tipi"
          name="paymentType"
          value={formData.paymentType}
          onChange={(e) =>
            setFormData({
              ...formData,
              paymentType: e.target.value,
              paymentTerm: e.target.value === 'Peşin' ? '' : formData.paymentTerm,
            })
          }
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
            onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
            required
          />
        )}
      </div>

      <ItemEditor items={items} setItems={setItems} products={products} />

      <FormTextarea
        label="Özel Notlar"
        name="notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: sanitizeText(e.target.value) })}
        placeholder="Teklif ile ilgili özel notlar ekleyebilirsiniz..."
        rows={3}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <FormSelect
          label="KDV Oranı"
          name="vatRate"
          value={formData.vatRate}
          onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) as VATRate })}
        >
          {turkeyVATRates.map((vat) => (
            <option key={vat.rate} value={vat.rate}>
              %{vat.rate} - {vat.description}
            </option>
          ))}
        </FormSelect>
        <div className="space-y-2 text-right p-4 rounded-lg bg-gray-100 dark:bg-gray-600">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Ara Toplam:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(subtotal, formData.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">KDV (%{formData.vatRate}):</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(vatAmount, formData.currency)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-800 dark:text-gray-200">Genel Toplam:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {formatCurrency(total, formData.currency)}
            </span>
          </div>
        </div>
      </div>

      {quote && (
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Teklif Zaman Çizelgesi
          </h3>
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

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 min-h-[44px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 active:scale-[0.98] transition-transform"
        >
          İptal
        </button>

        {/* Taslak Butonu */}
        {(!quote?.status || quote.status === 'Taslak') && (
          <button
            type="button"
            onClick={(e) => handleFormSubmit(e, 'Taslak')}
            className="px-4 py-2.5 min-h-[44px] bg-amber-500 text-white rounded-md hover:bg-amber-600 active:scale-[0.98] transition-transform"
          >
            Taslak Olarak Kaydet
          </button>
        )}

        <button
          type="button"
          onClick={(e) =>
            handleFormSubmit(
              e,
              quote?.status && quote.status !== 'Taslak' ? quote.status : 'Hazırlandı'
            )
          }
          className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-[0.98] transition-transform"
        >
          {!quote?.status || quote.status === 'Taslak' ? 'Teklifi Onayla' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default QuoteForm;
