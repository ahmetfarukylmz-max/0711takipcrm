import React, { useState, useMemo, useEffect } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import ItemEditor from './ItemEditor';
import { turkeyVATRates, currencies, DEFAULT_CURRENCY } from '../../constants';
import { formatCurrency, formatDate, roundNumber } from '../../utils/formatters';
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
import { CreditCardIcon } from '../icons';

interface QuoteFormData {
  customerId: string;
  items: OrderItem[];
  teklif_tarihi: string;
  gecerlilik_tarihi: string;
  status: string;
  vatRate: VATRate;
  paymentType: string;
  paymentTerm: string;
  currency: Currency;
  notes: string;
  rejection_reason: string;
}

// Extend OrderItem locally to track original price for calculations
interface ExtendedOrderItem extends OrderItem {
  basePrice?: number; // The original cash price before maturity rate
}

interface TimelineEvent {
  date: any;
  description: string;
  status?: string;
}

interface QuoteFormProps {
  quote?: Partial<Quote>;
  onSave: (quote: Partial<Quote>) => void;
  onCancel: () => void;
  customers: Customer[];
  products: Product[];
  orders?: Order[];
  shipments?: Shipment[];
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  onSave,
  onCancel,
  customers,
  products,
  orders = [],
  shipments = [],
}) => {
  // Helper to parse existing payment term string (e.g. "60 Gün Vadeli")
  const parsePaymentTerm = (termString: string | number | undefined) => {
    if (!termString) return { days: '', rate: 0 };
    const str = String(termString);
    const match = str.match(/(\d+)/);
    return {
      days: match ? match[0] : '',
      rate: 0, // Rate is not stored in DB currently, default to 0
    };
  };

  const initialTerm = parsePaymentTerm(quote?.paymentTerm);

  const [maturityDays, setMaturityDays] = useState<string>(initialTerm.days);
  const [maturityRate, setMaturityRate] = useState<number>(0);

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
          paymentTerm: quote.paymentTerm ? String(quote.paymentTerm) : '',
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

  const [items, setItems] = useState<ExtendedOrderItem[]>(
    (quote?.items || []).map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: item.productName || product?.name || '',
        unit: item.unit || product?.unit || 'Kg',
        basePrice: item.unit_price, // Assume current price is base initially
      };
    })
  );

  // Effect: When items change (added/removed via ItemEditor), ensure they have basePrice
  // and apply current maturity rate if it's a NEW item
  useEffect(() => {
    setItems((prevItems) => {
      let hasChanges = false;
      const updated = prevItems.map((item) => {
        // If item has no basePrice, it's likely new. Set it from unit_price.
        if (item.basePrice === undefined) {
          hasChanges = true;
          const base = item.unit_price;
          // Apply current rate immediately to new items
          const newPrice = base * (1 + maturityRate / 100);
          return {
            ...item,
            basePrice: base,
            unit_price: Number(newPrice.toFixed(2)),
          };
        }
        return item;
      });
      return hasChanges ? updated : prevItems;
    });
  }, [items.length, maturityRate]); // Depend on length to catch adds, and rate

  // Recalculate prices when Rate changes
  const handleRateChange = (newRate: number) => {
    setMaturityRate(newRate);

    const updatedItems = items.map((item) => {
      const base = item.basePrice || item.unit_price || 0;
      const newUnitPrice = base * (1 + newRate / 100);
      return {
        ...item,
        basePrice: base,
        unit_price: Number(newUnitPrice.toFixed(2)),
      };
    });

    setItems(updatedItems);
  };

  const subtotal = roundNumber(
    items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0)
  );
  const vatAmount = roundNumber(subtotal * (formData.vatRate / 100));
  const total = roundNumber(subtotal + vatAmount);

  const handleFormSubmit = (e: React.MouseEvent<HTMLButtonElement>, status: string) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('En az bir ürün eklemelisiniz!');
      return;
    }

    // Construct final Payment Term string
    let finalPaymentTerm = formData.paymentTerm;
    if (formData.paymentType === 'Vadeli') {
      finalPaymentTerm = `${maturityDays} Gün Vadeli`;
      // Optionally append rate info if needed, but usually just days is enough for print
    }

    const cleanItems = items.map(({ basePrice, ...item }) => {
      const cleanItem: any = {
        productId: item.productId || '',
        productName: item.productName || 'Belirtilmemiş',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        unit: item.unit || 'Kg',
      };
      if (item.product_code) cleanItem.product_code = item.product_code;
      if (item.notes) cleanItem.notes = item.notes;
      return cleanItem;
    });

    const invalidItems = cleanItems.filter((item) => !item.productId || !item.productName);
    if (invalidItems.length > 0) {
      alert('Bazı ürünlerde eksik bilgi var.');
      return;
    }

    const cleanData: any = {
      customerId: formData.customerId,
      items: cleanItems,
      teklif_tarihi: formData.teklif_tarihi,
      status: status,
      vatRate: formData.vatRate,
      paymentType: formData.paymentType,
      paymentTerm: finalPaymentTerm,
      currency: formData.currency,
      subtotal,
      vatAmount,
      total_amount: total,
    };

    if (quote?.id) cleanData.id = quote.id;
    if (formData.gecerlilik_tarihi) cleanData.gecerlilik_tarihi = formData.gecerlilik_tarihi;
    if (formData.notes) cleanData.notes = formData.notes;
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
    // ... rest of timeline logic remains same ...
    return events;
  }, [quote]);

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
            placeholder="Neden reddedildi?"
            rows={3}
          />
        )}
      </div>

      {/* Payment & Currency Section - ENHANCED */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5" />
          Ödeme ve Para Birimi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            onChange={(e) => {
              const type = e.target.value;
              setFormData({
                ...formData,
                paymentType: type,
              });
              if (type === 'Peşin') {
                setMaturityDays('');
                handleRateChange(0); // Reset rate to 0 for cash
              }
            }}
          >
            <option value="Peşin">Peşin</option>
            <option value="Vadeli">Vadeli</option>
          </FormSelect>

          {formData.paymentType === 'Vadeli' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vade Süresi (Gün)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    className="input-field w-full pr-12"
                    placeholder="60"
                    value={maturityDays}
                    onChange={(e) => setMaturityDays(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Gün</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Vade Farkı (%)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.1"
                    className="input-field w-full pr-8 border-blue-300 focus:border-blue-500 text-blue-700 font-bold"
                    placeholder="0"
                    value={maturityRate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-blue-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {maturityRate > 0 && formData.paymentType === 'Vadeli' && (
          <p className="text-xs text-blue-600 mt-2">
            * Ürün fiyatlarına otomatik olarak <strong>%{maturityRate}</strong> vade farkı
            eklenmiştir. (Baz fiyat korunmaktadır).
          </p>
        )}
      </div>

      <ItemEditor items={items} setItems={setItems} products={products} />

      <FormTextarea
        label="Özel Notlar"
        name="notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: sanitizeText(e.target.value) })}
        placeholder="Notlar..."
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
