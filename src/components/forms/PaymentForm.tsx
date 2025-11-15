import React, { useState, useEffect } from 'react';
import type { Payment, Customer, Order, PaymentMethod, PaymentStatus, Currency } from '../../types';

interface PaymentFormProps {
  payment: Payment | null;
  customers: Customer[];
  orders: Order[];
  onSave: (data: Partial<Payment>) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ payment, customers, orders, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    customerId: payment?.customerId || '',
    orderId: payment?.orderId || '',
    amount: payment?.amount || 0,
    currency: (payment?.currency || 'TRY') as Currency,
    paymentMethod: (payment?.paymentMethod || 'Belirtilmemiş') as PaymentMethod,
    dueDate: payment?.dueDate || '',
    checkNumber: payment?.checkNumber || '',
    checkBank: payment?.checkBank || '',
    status: (payment?.status || 'Bekliyor') as PaymentStatus,
    paidDate: payment?.paidDate || '',
    notes: payment?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Müşteri seçildiğinde ilgili siparişleri filtrele
  const customerOrders = orders.filter(order => order.customerId === formData.customerId);

  // Sipariş seçildiğinde tutarı otomatik doldur
  useEffect(() => {
    if (formData.orderId && !payment) {
      const selectedOrder = orders.find(o => o.id === formData.orderId);
      if (selectedOrder) {
        setFormData(prev => ({
          ...prev,
          amount: selectedOrder.total_amount,
          currency: selectedOrder.currency || 'TRY'
        }));
      }
    }
  }, [formData.orderId, orders, payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) newErrors.customerId = 'Müşteri seçiniz';
    if (formData.amount <= 0) newErrors.amount = 'Geçerli bir tutar giriniz';
    if (!formData.dueDate) newErrors.dueDate = 'Vade tarihi giriniz';
    if (formData.status === 'Tahsil Edildi' && !formData.paidDate) {
      newErrors.paidDate = 'Tahsil tarihi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    const selectedOrder = orders.find(o => o.id === formData.orderId);

    const paymentData: Partial<Payment> = {
      ...formData,
      customerName: selectedCustomer?.name,
      orderNumber: selectedOrder ? `#${selectedOrder.id.slice(-6)}` : undefined,
      id: payment?.id
    };

    // Çek/Senet değilse ilgili alanları temizle
    if (formData.paymentMethod !== 'Çek' && formData.paymentMethod !== 'Senet') {
      paymentData.checkNumber = undefined;
      paymentData.checkBank = undefined;
    }

    // Tahsil edilmediyse tahsil tarihini temizle
    if (formData.status !== 'Tahsil Edildi') {
      paymentData.paidDate = undefined;
    }

    onSave(paymentData);
  };

  const showCheckFields = formData.paymentMethod === 'Çek' || formData.paymentMethod === 'Senet';
  const showPaidDate = formData.status === 'Tahsil Edildi';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Müşteri Seçimi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Müşteri *
        </label>
        <select
          name="customerId"
          value={formData.customerId}
          onChange={handleChange}
          className={`input-field ${errors.customerId ? 'border-red-500' : ''}`}
          required
        >
          <option value="">Müşteri seçiniz</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
      </div>

      {/* Sipariş Seçimi (Opsiyonel) */}
      {formData.customerId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sipariş (Opsiyonel)
          </label>
          <select
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Sipariş seçiniz</option>
            {customerOrders.map(order => (
              <option key={order.id} value={order.id}>
                #{order.id.slice(-6)} - {formatCurrency(order.total_amount, order.currency)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tutar ve Para Birimi */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tutar *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleNumberChange}
            step="0.01"
            min="0"
            className={`input-field ${errors.amount ? 'border-red-500' : ''}`}
            required
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Para Birimi
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="input-field"
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Ödeme Yöntemi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ödeme Yöntemi *
        </label>
        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="Belirtilmemiş">Belirtilmemiş</option>
          <option value="Nakit">Nakit</option>
          <option value="Havale/EFT">Havale/EFT</option>
          <option value="Kredi Kartı">Kredi Kartı</option>
          <option value="Çek">Çek</option>
          <option value="Senet">Senet</option>
        </select>
      </div>

      {/* Çek/Senet Bilgileri */}
      {showCheckFields && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formData.paymentMethod} Numarası
            </label>
            <input
              type="text"
              name="checkNumber"
              value={formData.checkNumber}
              onChange={handleChange}
              className="input-field"
              placeholder="Örn: 123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Banka
            </label>
            <input
              type="text"
              name="checkBank"
              value={formData.checkBank}
              onChange={handleChange}
              className="input-field"
              placeholder="Örn: Akbank"
            />
          </div>
        </div>
      )}

      {/* Vade Tarihi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Vade Tarihi *
        </label>
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          className={`input-field ${errors.dueDate ? 'border-red-500' : ''}`}
          required
        />
        {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
      </div>

      {/* Durum */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Durum
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="input-field"
        >
          <option value="Bekliyor">Bekliyor</option>
          <option value="Tahsil Edildi">Tahsil Edildi</option>
          <option value="Gecikti">Gecikti</option>
          <option value="İptal">İptal</option>
        </select>
      </div>

      {/* Tahsil Tarihi */}
      {showPaidDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tahsil Tarihi *
          </label>
          <input
            type="date"
            name="paidDate"
            value={formData.paidDate}
            onChange={handleChange}
            className={`input-field ${errors.paidDate ? 'border-red-500' : ''}`}
            required
          />
          {errors.paidDate && <p className="text-red-500 text-xs mt-1">{errors.paidDate}</p>}
        </div>
      )}

      {/* Notlar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notlar
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Ödeme ile ilgili notlar..."
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn-primary flex-1">
          {payment ? 'Güncelle' : 'Kaydet'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          İptal
        </button>
      </div>
    </form>
  );
};

// Helper function
function formatCurrency(amount: number, currency: Currency = 'TRY'): string {
  const symbols: Record<Currency, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€'
  };
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbols[currency]}`;
}

export default PaymentForm;
