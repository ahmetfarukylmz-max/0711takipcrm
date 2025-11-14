import React, { useState, ChangeEvent, FormEvent } from 'react';
import FormInput from '../common/FormInput';
import type { Customer } from '../../types';
import { sanitizeText, sanitizePhone, sanitizeEmail } from '../../utils/sanitize';

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
    taxOffice: string;
    taxNumber: string;
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
        city: customer?.city || '',
        taxOffice: customer?.taxOffice || '',
        taxNumber: customer?.taxNumber || ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        // Apply appropriate sanitization based on field type
        switch (name) {
            case 'phone':
                sanitizedValue = sanitizePhone(value);
                break;
            case 'email':
                sanitizedValue = sanitizeEmail(value);
                break;
            case 'name':
            case 'contact_person':
            case 'address':
            case 'city':
            case 'taxOffice':
            case 'taxNumber':
                sanitizedValue = sanitizeText(value);
                break;
            default:
                sanitizedValue = sanitizeText(value);
        }

        setFormData({ ...formData, [name]: sanitizedValue });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({ ...customer, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                    label="Telefon"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={handleChange}
                />
                <FormInput
                    label="E-posta"
                    name="email"
                    type="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>
            <FormInput
                label="Adres"
                name="address"
                value={formData.address}
                onChange={handleChange}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                    label="Şehir"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                />
                <FormInput
                    label="Vergi Dairesi"
                    name="taxOffice"
                    value={formData.taxOffice}
                    onChange={handleChange}
                />
            </div>
            <FormInput
                label="Vergi No"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleChange}
                placeholder="10 haneli vergi numarası"
            />
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

export default CustomerForm;
