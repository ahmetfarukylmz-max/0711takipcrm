import React, { useState } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';
import CustomerForm from './CustomerForm';
import { PlusIcon } from '../icons';

const MeetingForm = ({ meeting, onSave, onCancel, customers, onCustomerSave }) => {
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [formData, setFormData] = useState(meeting || {
        customerId: customers[0]?.id || '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
        outcome: 'İlgileniyor',
        next_action_date: '',
        next_action_notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNewCustomerSave = async (customerData) => {
        const newCustomerId = await onCustomerSave(customerData);
        if (newCustomerId) {
            setFormData(prev => ({ ...prev, customerId: newCustomerId }));
        }
        setIsCustomerModalOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <FormSelect
                                label="Müşteri"
                                name="customerId"
                                value={formData.customerId}
                                onChange={handleChange}
                                required
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
                            className="p-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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
                    />
                </div>
                <FormTextarea
                    label="Görüşme Notları"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                />
                <FormSelect
                    label="Görüşme Sonucu"
                    name="outcome"
                    value={formData.outcome}
                    onChange={handleChange}
                >
                    <option>İlgileniyor</option>
                    <option>Teklif Bekliyor</option>
                    <option>Sonra Değerlendirecek</option>
                    <option>İlgilenmiyor</option>
                </FormSelect>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <FormInput
                        label="Sonraki Eylem Tarihi"
                        name="next_action_date"
                        type="date"
                        value={formData.next_action_date}
                        onChange={handleChange}
                    />
                    <FormInput
                        label="Sonraki Eylem Notu"
                        name="next_action_notes"
                        value={formData.next_action_notes}
                        onChange={handleChange}
                        placeholder="Örn: Teklifi hatırlat"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
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
                        Kaydet
                    </button>
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
