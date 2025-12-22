import React, { useState, useEffect } from 'react';
import { Customer, Product, Shipment, ReturnInvoice, ReturnItem, ShipmentItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TrashIcon, PlusIcon } from '../icons';
import { toast } from 'react-hot-toast';

interface ReturnFormProps {
  customers: Customer[];
  products: Product[];
  shipments: Shipment[];
  initialShipmentId?: string;
  onSave: (returnData: Partial<ReturnInvoice>) => Promise<void>;
  onCancel: () => void;
  currentUser: any;
}

const ReturnForm: React.FC<ReturnFormProps> = ({
  customers,
  products,
  shipments,
  initialShipmentId,
  onSave,
  onCancel,
  currentUser,
}) => {
  const [formData, setFormData] = useState<Partial<ReturnInvoice>>({
    invoiceDate: new Date().toISOString().slice(0, 10),
    status: 'Onaylandı',
    items: [],
    vatRate: 20,
    subtotal: 0,
    vatAmount: 0,
    totalAmount: 0,
    type: 'return',
  });

  // Filter shipments to only delivered ones
  const deliveredShipments = shipments.filter((s) => s.status === 'Teslim Edildi' && !s.isDeleted);

  useEffect(() => {
    if (initialShipmentId) {
      handleShipmentChange(initialShipmentId);
    }
  }, [initialShipmentId]);

  const calculateTotals = (items: ReturnItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = (subtotal * (formData.vatRate || 20)) / 100;
    const totalAmount = subtotal + vatAmount;
    return { subtotal, vatAmount, totalAmount };
  };

  const handleShipmentChange = (shipmentId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    // Find customer name safely
    const customer = customers.find((c) => c.id === shipment.customerId);
    const safeCustomerName = shipment.customerName || customer?.name || 'Bilinmeyen Müşteri';

    setFormData((prev) => ({
      ...prev,
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      customerId: shipment.customerId,
      customerName: safeCustomerName,
      // Reset items when shipment changes
      items: [],
      ...calculateTotals([]),
    }));
  };

  const handleAddItem = (shipmentItem: ShipmentItem) => {
    const product = products.find((p) => p.id === shipmentItem.productId);
    // Try to find unit price from product catalog if not available elsewhere
    // In a real scenario, we should get this from the original Order Item to be precise
    const unitPrice = product?.selling_price || 0;

    const newItem: ReturnItem = {
      productId: shipmentItem.productId,
      productName: shipmentItem.productName || product?.name || 'Bilinmiyor',
      quantity: 1, // Default to 1
      unit: shipmentItem.unit || product?.unit || 'Adet',
      unitPrice: unitPrice,
      totalPrice: unitPrice * 1,
      condition: 'Sağlam',
    };

    const newItems = [...(formData.items || []), newItem];
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...calculateTotals(newItems),
    }));
  };

  const handleUpdateItem = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...(formData.items || [])];
    const item = { ...newItems[index], [field]: value };

    // Recalculate total price if quantity or price changes
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = item.quantity * item.unitPrice;
    }

    newItems[index] = item;
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...calculateTotals(newItems),
    }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...calculateTotals(newItems),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Lütfen bir sevkiyat seçin');
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      toast.error('Lütfen iade edilecek ürünleri ekleyin');
      return;
    }

    // Sanitize data (replace undefined with null or empty string)
    const safeData = {
      ...formData,
      invoiceNumber: formData.invoiceNumber || null,
      notes: formData.notes || null,
      customerName: formData.customerName || 'Bilinmiyor', // Fallback just in case
    };

    try {
      await onSave({
        ...safeData,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        createdAt: new Date().toISOString(),
      });
      toast.success('İade faturası oluşturuldu ve stoklara işlendi');
    } catch (error) {
      console.error(error);
      toast.error('İade işlemi sırasında hata oluştu');
    }
  };

  const selectedShipment = shipments.find((s) => s.id === formData.shipmentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">İade Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kaynak Sevkiyat
            </label>
            <select
              className="input-field w-full"
              value={formData.shipmentId || ''}
              onChange={(e) => handleShipmentChange(e.target.value)}
              required
            >
              <option value="">Sevkiyat Seçin...</option>
              {deliveredShipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.customerName} - {s.shipment_date} ({s.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İade Tarihi
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İade Fatura No (Opsiyonel)
            </label>
            <input
              type="text"
              className="input-field w-full"
              value={formData.invoiceNumber || ''}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="Müşterinin kestiği fatura no"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notlar
            </label>
            <input
              type="text"
              className="input-field w-full"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="İade nedeni vb."
            />
          </div>
        </div>
      </div>

      {/* Item Selection Area */}
      {selectedShipment && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
              Sevkiyat İçeriği (Eklenecek Ürünler)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedShipment.items?.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddItem(item)}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-left group"
              >
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {item.productName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Sevk Edilen: {item.quantity} {item.unit}
                  </div>
                </div>
                <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Return Items List */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
          İade Edilecek Ürünler
        </h4>

        {(!formData.items || formData.items.length === 0) && (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
            Yukarıdan ürün seçiniz.
          </div>
        )}

        {formData.items?.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Ürün</label>
              <div
                className="text-sm font-medium text-gray-900 dark:text-white truncate"
                title={item.productName}
              >
                {item.productName}
              </div>
            </div>

            <div className="w-1/2 md:w-1/6">
              <label className="block text-xs font-medium text-gray-500 mb-1">Miktar</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-full text-right"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value))}
                />
                <span className="ml-2 text-xs text-gray-500">{item.unit}</span>
              </div>
            </div>

            <div className="w-1/2 md:w-1/6">
              <label className="block text-xs font-medium text-gray-500 mb-1">Birim Fiyat</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field w-full text-right"
                value={item.unitPrice}
                onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value))}
              />
            </div>

            <div className="w-1/2 md:w-1/6">
              <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
              <select
                className="input-field w-full text-sm"
                value={item.condition}
                onChange={(e) => handleUpdateItem(index, 'condition', e.target.value)}
              >
                <option value="Sağlam">Sağlam</option>
                <option value="Hasarlı">Hasarlı</option>
                <option value="Hurda">Hurda</option>
              </select>
            </div>

            <div className="w-1/2 md:w-1/6 text-right">
              <label className="block text-xs font-medium text-gray-500 mb-1">Toplam</label>
              <div className="font-bold text-gray-900 dark:text-white py-2">
                {formatCurrency(item.totalPrice, 'TRY')}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Totals */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Ara Toplam:</span>
            <span>{formatCurrency(formData.subtotal || 0, 'TRY')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>KDV (%{formData.vatRate}):</span>
            <span>{formatCurrency(formData.vatAmount || 0, 'TRY')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-600 pt-2">
            <span>İade Tutarı:</span>
            <span className="text-red-600 dark:text-red-400">
              {formatCurrency(formData.totalAmount || 0, 'TRY')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            * Bu tutar müşterinin borcundan düşülecektir.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm"
        >
          İadeyi Onayla ve Stokları Güncelle
        </button>
      </div>
    </form>
  );
};

export default ReturnForm;
