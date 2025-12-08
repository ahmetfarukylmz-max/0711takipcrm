import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';
import CustomerForm from './CustomerForm';
import InquiredProductModal from './InquiredProductModal';
import InquiredProductsList from './meeting/InquiredProductsList';
import { PlusIcon } from '../icons';
import type { Meeting, Customer, Product, InquiredProduct } from '../../types';
import { sanitizeText } from '../../utils/sanitize';

interface MeetingFormProps {
  /** Existing meeting to edit (undefined for new meeting) */
  meeting?: Partial<Meeting>;
  /** Callback when form is submitted */
  onSave: (meeting: Partial<Meeting>) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** List of customers */
  customers: Customer[];
  /** List of products */
  products: Product[];
  /** Callback when new customer is created */
  onCustomerSave: (customer: Partial<Customer>) => Promise<string | void>;
  /** Callback when new product is created */
  onProductSave: (product: Partial<Product>) => Promise<string | void>;
  /** Callback to create quote from meeting */
  onCreateQuote?: (customerId: string, products: InquiredProduct[]) => void;
  /** Whether form is read-only */
  readOnly?: boolean;
}

interface MeetingFormData {
  customerId: string;
  date: string;
  notes: string;
  outcome: string;
  status: string;
  meetingType: string;
  next_action_date: string;
  next_action_type: string;
  next_action_notes: string;
}

/**
 * MeetingForm component - Form for creating/editing meetings
 */
const MeetingForm: React.FC<MeetingFormProps> = ({
  meeting,
  onSave,
  onCancel,
  customers,
  products,
  onCustomerSave,
  onProductSave,
  onCreateQuote,
  readOnly = false,
}) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [inquiredProducts, setInquiredProducts] = useState<InquiredProduct[]>(
    meeting?.inquiredProducts || []
  );
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<MeetingFormData>({
    customerId: meeting?.customerId || customers[0]?.id || '',
    date: meeting?.meeting_date || new Date().toISOString().slice(0, 10),
    notes: meeting?.notes || '',
    outcome: meeting?.outcome || 'İlgileniyor',
    status: meeting?.status || 'Planlandı',
    meetingType: (meeting as any)?.meetingType || 'İlk Temas',
    next_action_date: meeting?.next_action_date || '',
    next_action_type: meeting?.next_action_type || 'Telefonla Arama',
    next_action_notes: meeting?.next_action_notes || '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    let value = e.target.value;
    if (e.target.name === 'notes' || e.target.name === 'next_action_notes') {
      value = sanitizeText(value);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNewCustomerSave = async (customerData: Partial<Customer>) => {
    const newCustomerId = await onCustomerSave(customerData);
    if (newCustomerId) {
      setFormData((prev) => ({ ...prev, customerId: newCustomerId }));
    }
    setIsCustomerModalOpen(false);
  };

  const handleAddProduct = () => {
    setEditingProductIndex(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (index: number) => {
    setEditingProductIndex(index);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (product: Omit<InquiredProduct, 'id'>) => {
    if (editingProductIndex !== null) {
      // Edit existing
      const updated = [...inquiredProducts];
      updated[editingProductIndex] = {
        ...updated[editingProductIndex],
        ...product,
      };
      setInquiredProducts(updated);
    } else {
      // Add new
      const newProduct: InquiredProduct = {
        ...product,
        id: Date.now().toString(),
      };
      setInquiredProducts([...inquiredProducts, newProduct]);
    }
    setIsProductModalOpen(false);
    setEditingProductIndex(null);
  };

  const handleDeleteProduct = (index: number) => {
    setInquiredProducts(inquiredProducts.filter((_, i) => i !== index));
  };

  const handleCreateQuote = () => {
    if (onCreateQuote && formData.customerId && inquiredProducts.length > 0) {
      onCreateQuote(formData.customerId, inquiredProducts);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!readOnly) {
      const meetingData: Partial<Meeting> = {
        ...meeting,
        customerId: formData.customerId,
        meeting_date: formData.date,
        meetingType: formData.meetingType,
        notes: formData.notes,
        outcome: formData.outcome as any,
        status: formData.status,
        next_action_date: formData.next_action_date || undefined,
        next_action_type: formData.next_action_type || undefined,
        next_action_notes: formData.next_action_notes || undefined,
      };

      // Only add inquiredProducts if there are any
      if (inquiredProducts.length > 0) {
        meetingData.inquiredProducts = inquiredProducts;
      }

      // Remove undefined values to avoid Firebase errors
      Object.keys(meetingData).forEach((key) => {
        if (meetingData[key as keyof Meeting] === undefined) {
          delete meetingData[key as keyof Meeting];
        }
      });

      onSave(meetingData);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <FormSelect
                label="Müşteri"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                disabled={readOnly}
              >
                <option value="">Müşteri Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <button
              type="button"
              title="Yeni Müşteri Ekle"
              onClick={() => setIsCustomerModalOpen(true)}
              className="p-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={readOnly}
            >
              <PlusIcon className="w-5 h-5 !mr-0" />
            </button>
          </div>
          <FormInput
            label="Görüşme Tarihi"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            label="Görüşme Durumu"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            disabled={readOnly}
          >
            <option>Planlandı</option>
            <option>Tamamlandı</option>
            <option>İptal Edildi</option>
            <option>Ertelendi</option>
            <option>Tekrar Aranacak</option>
          </FormSelect>
          <FormSelect
            label="Görüşme Türü"
            name="meetingType"
            value={formData.meetingType}
            onChange={handleChange}
            required
            disabled={readOnly}
          >
            <option>İlk Temas</option>
            <option>Teklif Sunumu</option>
            <option>Takip Görüşmesi</option>
            <option>İtiraz Yönetimi</option>
            <option>Kapanış Görüşmesi</option>
            <option>Müşteri Ziyareti</option>
            <option>Online Toplantı</option>
          </FormSelect>
        </div>
        <FormTextarea
          label="Görüşme Notları"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          disabled={readOnly}
        />

        {/* Inquired Products Section */}
        <InquiredProductsList
          inquiredProducts={inquiredProducts}
          readOnly={readOnly}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />

        <FormSelect
          label="Görüşme Sonucu"
          name="outcome"
          value={formData.outcome}
          onChange={handleChange}
          disabled={readOnly}
        >
          <option>İlgileniyor</option>
          <option>Teklif Bekliyor</option>
          <option>Sonra Değerlendirecek</option>
          <option>İlgilenmiyor</option>
          <option>Satışa Dönüştü (Kazanıldı)</option>
          <option>Kaybedildi</option>
          <option>Tahsilat</option>
        </FormSelect>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mt-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
            <span>📅</span> Sonraki Adım Planla (Otomatik Hatırlatma)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormSelect
              label="Eylem Tipi"
              name="next_action_type"
              value={formData.next_action_type}
              onChange={handleChange}
              disabled={readOnly}
            >
              <option>Telefonla Arama</option>
              <option>E-posta Gönder</option>
              <option>WhatsApp Mesajı</option>
              <option>Müşteri Ziyareti</option>
              <option>Online Toplantı</option>
              <option>Teklif Hazırla</option>
            </FormSelect>
            <FormInput
              label="Tarih"
              name="next_action_date"
              type="date"
              value={formData.next_action_date}
              onChange={handleChange}
              disabled={readOnly}
            />
            <FormInput
              label="Not / Konu"
              name="next_action_notes"
              value={formData.next_action_notes}
              onChange={handleChange}
              placeholder="Örn: Teklifi hatırlat"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {!readOnly && onCreateQuote && inquiredProducts.length > 0 && formData.customerId && (
              <button
                type="button"
                onClick={handleCreateQuote}
                className="px-4 py-2.5 min-h-[44px] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>📄</span>
                Teklif Oluştur ({inquiredProducts.length} Ürün)
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 min-h-[44px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 active:scale-[0.98] transition-transform"
            >
              {readOnly ? 'Kapat' : 'İptal'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-[0.98] transition-transform"
              >
                Kaydet
              </button>
            )}
          </div>
        </div>
      </form>
      <Modal
        show={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Yeni Müşteri Ekle"
      >
        <CustomerForm
          onSave={handleNewCustomerSave}
          onCancel={() => setIsCustomerModalOpen(false)}
        />
      </Modal>
      <Modal
        show={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProductIndex(null);
        }}
        title={editingProductIndex !== null ? 'Ürünü Düzenle' : 'Sorulan Ürün Ekle'}
        maxWidth="max-w-2xl"
      >
        <InquiredProductModal
          products={products}
          onSave={handleSaveProduct}
          onCancel={() => {
            setIsProductModalOpen(false);
            setEditingProductIndex(null);
          }}
          onProductSave={onProductSave}
          existingProduct={
            editingProductIndex !== null ? inquiredProducts[editingProductIndex] : undefined
          }
        />
      </Modal>
    </>
  );
};

export default MeetingForm;
