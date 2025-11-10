import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import type { Customer } from '../../types';

interface CustomerFormProps {
    /** Existing customer to edit (undefined for new customer) */
    customer?: Partial<Customer>;
    /** Callback when form is submitted */
    onSave: (customer: Partial<Customer>) => void;
    /** Callback when form is cancelled */
    onCancel: () => void;
}

interface CustomerFormData {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    city: string;
}

/**
 * CustomerForm component - Form for creating/editing customers
 */
const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState<CustomerFormData>({
        name: customer?.name || '',
        contact_person: customer?.contact_person || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        city: customer?.city || ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({ ...customer, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
                label="Müşteri Adı"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <FormInput
                label="Yetkili Kişi"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
            />
            <FormInput
                label="Telefon"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
            />
            <FormInput
                label="E-posta"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
            />
            <FormInput
                label="Adres"
                name="address"
                value={formData.address}
                onChange={handleChange}
            />
            <FormInput
                label="Şehir"
                name="city"
                value={formData.city}
                onChange={handleChange}
            />
            <div className="flex justify-end gap-3 pt-4">
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
                    Kaydet
                </button>
            </div>
        </form>
    );
};

export default CustomerForm;
