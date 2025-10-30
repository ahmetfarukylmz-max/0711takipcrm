import React, { useState } from 'react';
import FormInput from '../common/FormInput';

const CustomerForm = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState(customer || {
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
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
    );
};

export default CustomerForm;
