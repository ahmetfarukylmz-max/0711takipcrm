import React, { useState } from 'react';
import Modal from '../common/Modal';
import CustomerForm from '../forms/CustomerForm';
import { PlusIcon } from '../icons';

const Customers = ({ customers, onSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);

    const handleOpenModal = (customer = null) => {
        setCurrentCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSave = (customerData) => {
        onSave(customerData);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Müşteri Yönetimi</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    <PlusIcon />
                    Yeni Müşteri
                </button>
            </div>
            <div className="overflow-auto rounded-lg shadow bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            {['Müşteri Adı', 'Yetkili Kişi', 'Telefon', 'E-posta', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-bold">{customer.name}</td>
                                <td className="p-3 text-sm text-gray-700">{customer.contact_person}</td>
                                <td className="p-3 text-sm text-gray-700">{customer.phone}</td>
                                <td className="p-3 text-sm text-gray-700">{customer.email}</td>
                                <td className="p-3 text-sm text-gray-700">
                                    <button
                                        onClick={() => handleOpenModal(customer)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Düzenle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
            >
                <CustomerForm
                    customer={currentCustomer}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Customers;
