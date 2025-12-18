import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import toast from 'react-hot-toast';
import type { Order, Product, Shipment } from '../../types';
import { sanitizeText } from '../../utils/sanitize';

interface ShipmentItem {
  productId: string;
  productName: string;
  orderedQty: number;
  unit: string;
  shippedQty: number;
  toShipQty: number;
  orderItemIndex: number; // Index of the order item in order.items array
}

interface ShipmentFormData {
  shipment_date: string;
  transporter: string;
  notes: string;
  items: ShipmentItem[];
}

interface ShipmentFormProps {
  /** Order to create shipment for */
  order: Order;
  /** List of products */
  products: Product[];
  /** List of existing shipments (for calculating shipped quantities) */
  shipments?: Shipment[];
  /** Callback when shipment is created */
  onSave: (shipmentData: any) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

/**
 * ShipmentForm component - Form for creating shipments from orders
 */
const ShipmentForm: React.FC<ShipmentFormProps> = ({
  order,
  products,
  shipments = [],
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ShipmentFormData>({
    shipment_date: new Date().toISOString().split('T')[0],
    transporter: '',
    notes: '',
    items: [],
  });

  useEffect(() => {
    if (order) {
      // Calculate previously shipped quantities for this order
      const orderShipments = shipments.filter((s) => s.orderId === order.id && !s.isDeleted);

      // Initialize items with order items and their quantities
      // Each order item is tracked by its index in the order.items array
      const items: ShipmentItem[] = order.items.map((item, itemIndex) => {
        // Calculate total shipped quantity for THIS SPECIFIC order item (by index)
        const totalShipped = orderShipments.reduce((sum, shipment) => {
          // Find shipment items that match this order item index
          const shipmentItem = shipment.items?.find((si) => {
            // Modern match: Use exact index if available
            if (si.orderItemIndex !== undefined) {
              return si.orderItemIndex === itemIndex;
            }
            // Legacy fallback: Match by productId (best effort for old data)
            return si.productId === item.productId;
          });
          return sum + (shipmentItem?.quantity || 0);
        }, 0);

        const remainingQty = item.quantity - totalShipped;

        return {
          productId: item.productId,
          productName: products.find((p) => p.id === item.productId)?.name || 'Bilinmiyor',
          orderedQty: item.quantity,
          unit: item.unit || 'Adet',
          shippedQty: totalShipped,
          toShipQty: Math.max(0, remainingQty), // Default to ship remaining quantity
          orderItemIndex: itemIndex, // Track which order item this is
        };
      });
      setFormData((prev) => ({ ...prev, items }));
    }
  }, [order, products, shipments]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Sanitize text inputs
    const sanitizedValue = name === 'transporter' || name === 'notes' ? sanitizeText(value) : value;
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleItemQtyChange = (index: number, value: string) => {
    const newItems = [...formData.items];
    const qty = parseInt(value) || 0;
    // Allow entering values higher than remaining qty (Removed Math.min constraint)
    // Just ensure it's not negative
    newItems[index].toShipQty = Math.max(0, qty);
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate
    if (!formData.transporter.trim()) {
      toast.error('Lütfen nakliye firması giriniz!');
      return;
    }

    const itemsToShip = formData.items.filter((item) => item.toShipQty > 0);
    if (itemsToShip.length === 0) {
      toast.error('Lütfen en az bir ürün için sevk miktarı giriniz!');
      return;
    }

    // Check for over-shipment (Method B: Tolerance Logic)
    let needsOrderUpdate = false;
    const updatedOrderItems = [...order.items]; // Clone original order items

    // Check each item being shipped
    for (const shipItem of itemsToShip) {
      const remainingQty = shipItem.orderedQty - shipItem.shippedQty;

      if (shipItem.toShipQty > remainingQty) {
        needsOrderUpdate = true;

        // Update the item in the cloned order list
        // We use orderItemIndex to find the correct item in the original order
        if (updatedOrderItems[shipItem.orderItemIndex]) {
          // New Total Quantity = Previously Shipped + Currently Shipping
          const newTotalQty = shipItem.shippedQty + shipItem.toShipQty;

          updatedOrderItems[shipItem.orderItemIndex] = {
            ...updatedOrderItems[shipItem.orderItemIndex],
            quantity: newTotalQty,
          };
        }
      }
    }

    let updatedOrderData = null;

    if (needsOrderUpdate) {
      const confirmUpdate = window.confirm(
        'DİKKAT: Sipariş miktarından fazla sevkiyat yapıyorsunuz!\n\n' +
          'Sipariş miktarı otomatik olarak artırılsın ve bakiye güncellensin mi?\n' +
          '(İptal derseniz işlem durdurulur)'
      );

      if (!confirmUpdate) return;

      // Recalculate Order Totals
      const subtotal = updatedOrderItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
        0
      );
      const vatAmount = subtotal * (order.vatRate / 100);
      const total_amount = subtotal + vatAmount;

      updatedOrderData = {
        items: updatedOrderItems,
        subtotal,
        vatAmount,
        total_amount,
        // Add a note about this automatic update
        notes:
          (order.notes ? order.notes + '\n' : '') +
          `[Sistem]: ${new Date().toLocaleDateString()} tarihinde sevkiyat sırasında miktar artırıldı.`,
      };
    }

    const shipmentData = {
      orderId: order.id,
      customerId: order.customerId,
      shipment_date: formData.shipment_date,
      transporter: formData.transporter,
      notes: formData.notes || '',
      status: 'Yolda',
      items: itemsToShip.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.toShipQty,
        unit: item.unit,
        orderItemIndex: item.orderItemIndex, // Include order item index for tracking
      })),
      // Pass the updated order data if exists
      updatedOrder: updatedOrderData,
    };

    onSave(shipmentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Shipment Info */}
      <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Sevkiyat Bilgileri
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nakliye Firması *
            </label>
            <input
              type="text"
              name="transporter"
              value={formData.transporter}
              onChange={handleChange}
              placeholder="Örn: MNG Kargo, Aras Kargo"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sevk Tarihi *
            </label>
            <input
              type="date"
              name="shipment_date"
              value={formData.shipment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Özel Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Sevkiyat ile ilgili özel notlar ekleyebilirsiniz..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Items to Ship */}
      <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Sevk Edilecek Ürünler
        </h3>

        {/* Desktop: Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-600">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Ürün
                </th>
                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Sipariş Miktarı
                </th>
                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Sevk Edildi
                </th>
                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Kalan
                </th>
                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Sevk Edilecek *
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {item.productName}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                    {item.orderedQty} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                    {item.shippedQty} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                    {item.orderedQty - item.shippedQty} {item.unit}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={item.toShipQty}
                        onChange={(e) => handleItemQtyChange(index, e.target.value)}
                        className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.unit}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-3">
          {formData.items.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {item.productName}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sipariş:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {item.orderedQty} {item.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sevk Edildi:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {item.shippedQty} {item.unit}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Kalan:</span>
                  <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                    {item.orderedQty - item.shippedQty} {item.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sevk Edilecek Miktar *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={item.toShipQty}
                    onChange={(e) => handleItemQtyChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 min-h-[44px] text-center border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 min-h-[44px] bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 active:scale-[0.98] transition-transform"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2.5 min-h-[44px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-transform"
        >
          Sevk Et
        </button>
      </div>
    </form>
  );
};

export default ShipmentForm;
