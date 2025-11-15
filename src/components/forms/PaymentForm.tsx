import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
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

  // Müşteri seçildiğinde, o müşteriye ait siparişleri filtrele
  const customerOrders = formData.customerId
    ? orders.filter(o => o.customerId === formData.customerId)
    : orders;

  // Sipariş seçildiğinde tutarı otomatik doldur
  useEffect(() => {
    if (formData.orderId && !payment) {
      const selectedOrder = orders.find(o => o.id === formData.orderId);
      if (selectedOrder) {
        setFormData(prev => ({
          ...prev,
          amount: selectedOrder.total || 0,
          currency: selectedOrder.currency || 'TRY',
          customerId: selectedOrder.customerId
        }));
      }
    }
  }, [formData.orderId, orders, payment]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Müşteri bilgilerini denormalize et
    const customer = customers.find(c => c.id === formData.customerId);
    const order = orders.find(o => o.id === formData.orderId);

    // Undefined ve boş değerleri temizle - Firestore hatası çözer
    const cleanData: any = {
      customerId: formData.customerId,
      amount: Number(formData.amount),
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      dueDate: formData.dueDate,
      status: formData.status
    };

    // Opsiyonel alanları sadece dolu ise ekle
    if (customer?.name) cleanData.customerName = customer.name;
    if (formData.orderId) cleanData.orderId = formData.orderId;
    if (order?.orderNumber) cleanData.orderNumber = order.orderNumber;
    if (formData.checkNumber) cleanData.checkNumber = formData.checkNumber;
    if (formData.checkBank) cleanData.checkBank = formData.checkBank;
    if (formData.paidDate) cleanData.paidDate = formData.paidDate;
    if (formData.notes) cleanData.notes = formData.notes;

    // Mevcut ödeme düzenleme ise id'yi ekle
    if (payment?.id) {
      cleanData.id = payment.id;
    }

    onSave(cleanData);
  };

  // Ödeme yöntemi çek veya senet ise ekstra alanlar göster
  const showCheckFields = formData.paymentMethod === 'Çek' || formData.paymentMethod === 'Senet';
  const requirePaidDate = formData.status === 'Tahsil Edildi';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Müşteri ve Sipariş */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Müşteri <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
          >
            <option value="">Müşteri Seçin</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sipariş (Opsiyonel)
          </label>
          <select
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
          >
            <option value="">Sipariş Seçin</option>
            {customerOrders.map(order => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - {order.total?.toLocaleString('tr-TR')} {order.currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tutar ve Para Birimi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <FormInput
            label="Tutar"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Para Birimi
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
          >
            <option value="TRY">TRY (₺)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      {/* Ödeme Yöntemi ve Vade Tarihi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ödeme Yöntemi <span className="text-red-500">*</span>
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
          >
            <option value="Belirtilmemiş">Belirtilmemiş</option>
            <option value="Nakit">Nakit</option>
            <option value="Havale/EFT">Havale/EFT</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Çek">Çek</option>
            <option value="Senet">Senet</option>
          </select>
        </div>

        <FormInput
          label="Vade Tarihi"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
          required
        />
      </div>

      {/* Çek/Senet Bilgileri (Conditional) */}
      {showCheckFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <FormInput
            label={`${formData.paymentMethod} Numarası`}
            name="checkNumber"
            value={formData.checkNumber}
            onChange={handleChange}
            placeholder="Numara girin"
          />
          <FormInput
            label="Banka"
            name="checkBank"
            value={formData.checkBank}
            onChange={handleChange}
            placeholder="Banka adı"
          />
        </div>
      )}

      {/* Durum ve Tahsil Tarihi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Durum
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
          >
            <option value="Bekliyor">Bekliyor</option>
            <option value="Tahsil Edildi">Tahsil Edildi</option>
            <option value="Gecikti">Gecikti</option>
            <option value="İptal">İptal</option>
          </select>
        </div>

        {requirePaidDate && (
          <FormInput
            label="Tahsil Tarihi"
            name="paidDate"
            type="date"
            value={formData.paidDate}
            onChange={handleChange}
            required
          />
        )}
      </div>

      {/* Notlar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notlar
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Ödeme ile ilgili notlar..."
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
        />
      </div>

      {/* Buttons */}
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

export default PaymentForm;
