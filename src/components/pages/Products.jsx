import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ProductForm from '../forms/ProductForm';
import SearchBar from '../common/SearchBar';
import { PlusIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';

const Products = ({ products, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, product: null });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenModal = (product = null) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = (productData) => {
        onSave(productData);
        setIsModalOpen(false);
    };

    const handleDelete = (product) => {
        setDeleteConfirm({ isOpen: true, product });
    };

    const confirmDelete = () => {
        if (deleteConfirm.product) {
            if (deleteConfirm.product.id === 'batch') {
                confirmBatchDelete();
            } else {
                onDelete(deleteConfirm.product.id);
                setDeleteConfirm({ isOpen: false, product: null });
            }
        }
    };

    // Batch delete functions
    const handleSelectItem = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === filteredProducts.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            product: { id: 'batch', count: selectedItems.size }
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, product: null });
    };

    // Filter out deleted products and apply search
    const activeProducts = products.filter(p => !p.isDeleted);

    const filteredProducts = useMemo(() => {
        return activeProducts.filter(product => {
            const query = searchQuery.toLowerCase();

            const matchesSearch = !searchQuery.trim() ||
                product.name?.toLowerCase().includes(query) ||
                product.code?.toLowerCase().includes(query) ||
                product.cost_price?.toString().includes(query) ||
                product.selling_price?.toString().includes(query);

            return matchesSearch;
        });
    }, [activeProducts, searchQuery]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Ürün Yönetimi</h1>
                <div className="flex gap-3">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Seçili {selectedItems.size} Ürünü Sil
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        Yeni Ürün
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <SearchBar
                    placeholder="Ürün ara (ad, kod, fiyat)..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />
            </div>

            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {filteredProducts.length} ürün gösteriliyor
                {searchQuery && ` (${activeProducts.length} toplam)`}
            </div>

            <div className="overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left">
                                <input
                                    type="checkbox"
                                    checked={filteredProducts.length > 0 && selectedItems.size === filteredProducts.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            {['Ürün Adı', 'Ürün Kodu', 'Maliyet Fiyatı', 'Satış Fiyatı', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(product.id)}
                                        onChange={() => handleSelectItem(product.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300 font-bold">{product.name}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{product.code}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(product.cost_price, product.currency || 'TRY')}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(product.selling_price, product.currency || 'TRY')}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            className="text-blue-500 hover:underline dark:text-blue-400"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product)}
                                            className="text-red-500 hover:underline dark:text-red-400"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery ? 'Arama kriterine uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
                                </td>
                            </tr>
                        )}
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

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
                onConfirm={confirmDelete}
                title={deleteConfirm.product?.id === 'batch' ? 'Toplu Silme' : 'Ürünü Sil'}
                message={
                    deleteConfirm.product?.id === 'batch'
                        ? `Seçili ${deleteConfirm.product?.count} ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                        : `"${deleteConfirm.product?.name}" ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                }
            />
        </div>
    );
};

export default Products;
