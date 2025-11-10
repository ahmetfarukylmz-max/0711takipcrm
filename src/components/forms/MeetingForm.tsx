import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';
import CustomerForm from './CustomerForm';
import { PlusIcon } from '../icons';
import type { Meeting, Customer } from '../../types';

interface MeetingFormProps {
    /** Existing meeting to edit (undefined for new meeting) */
    meeting?: Partial<Meeting>;
    /** Callback when form is submitted */
    onSave: (meeting: Partial<Meeting>) => void;
    /** Callback when form is cancelled */
    onCancel: () => void;
    /** List of customers */
    customers: Customer[];
    /** Callback when new customer is created */
    onCustomerSave: (customer: Partial<Customer>) => Promise<string | void>;
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
    onCustomerSave,
    readOnly = false
}) => {
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [formData, setFormData] = useState<MeetingFormData>({
        customerId: meeting?.customerId || customers[0]?.id || '',
        date: meeting?.meeting_date || new Date().toISOString().slice(0, 10),
        notes: meeting?.notes || '',
        outcome: meeting?.outcome || 'İlgileniyor',
        status: meeting?.status || 'Planlandı',
        meetingType: (meeting as any)?.meetingType || 'İlk Temas',
        next_action_date: meeting?.next_action_date || '',
        next_action_notes: meeting?.next_action_notes || ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNewCustomerSave = async (customerData: Partial<Customer>) => {
        const newCustomerId = await onCustomerSave(customerData);
        if (newCustomerId) {
            setFormData(prev => ({ ...prev, customerId: newCustomerId }));
        }
        setIsCustomerModalOpen(false);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!readOnly) {
            onSave({
                ...meeting,
                customerId: formData.customerId,
                meeting_date: formData.date,
                notes: formData.notes,
                outcome: formData.outcome as any,
                status: formData.status,
                next_action_date: formData.next_action_date,
                next_action_notes: formData.next_action_notes
            });
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
                                {customers.map(c => (
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
                    <option>Tahsilat</option>
                </FormSelect>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <FormInput
                        label="Sonraki Eylem Tarihi"
                        name="next_action_date"
                        type="date"
                        value={formData.next_action_date}
                        onChange={handleChange}
                        disabled={readOnly}
                    />
                    <FormInput
                        label="Sonraki Eylem Notu"
                        name="next_action_notes"
                        value={formData.next_action_notes}
                        onChange={handleChange}
                        placeholder="Örn: Teklifi hatırlat"
                        disabled={readOnly}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        {readOnly ? 'Kapat' : 'İptal'}
                    </button>
                    {!readOnly && (
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Kaydet
                        </button>
                    )}
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
        </>
    );
};

export default MeetingForm;
