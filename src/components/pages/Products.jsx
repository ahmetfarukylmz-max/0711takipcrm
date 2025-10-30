import React, { useState } from 'react';
import Modal from '../common/Modal';
import ProductForm from '../forms/ProductForm';
import { PlusIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';

const Products = ({ products, onSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    const handleOpenModal = (product = null) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = (productData) => {
        onSave(productData);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Ürün Yönetimi</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    <PlusIcon />
                    Yeni Ürün
                </button>
            </div>
            <div className="overflow-auto rounded-lg shadow bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            {['Ürün Adı', 'Ürün Kodu', 'Maliyet Fiyatı', 'Satış Fiyatı', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-bold">{product.name}</td>
                                <td className="p-3 text-sm text-gray-700">{product.code}</td>
                                <td className="p-3 text-sm text-gray-700">{formatCurrency(product.cost_price)}</td>
                                <td className="p-3 text-sm text-gray-700">{formatCurrency(product.selling_price)}</td>
                                <td className="p-3 text-sm text-gray-700">
                                    <button
                                        onClick={() => handleOpenModal(product)}
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
                title={currentProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            >
                <ProductForm
                    product={currentProduct}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Products;
