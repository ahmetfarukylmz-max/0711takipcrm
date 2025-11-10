import React, { useState, useMemo, memo, useRef, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ProductForm from '../forms/ProductForm';
import SearchBar from '../common/SearchBar';
import { PlusIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';
import { exportProducts } from '../../utils/excelExport';
import { importProducts, downloadProductTemplate } from '../../utils/excelImport';
import type { Product } from '../../types';

interface DeleteConfirmState {
    isOpen: boolean;
    product: (Product & { count?: number }) | null;
}

interface ProductsProps {
    /** List of products */
    products: Product[];
    /** Callback when product is saved */
    onSave: (product: Partial<Product>) => Promise<void> | void;
    /** Callback when product is deleted */
    onDelete: (id: string) => void;
}

/**
 * Products component - Product management page
 */
const Products = memo<ProductsProps>(({ products, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, product: null });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenModal = (product: Product | null = null) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = (productData: Partial<Product>) => {
        onSave(productData);
        setIsModalOpen(false);
    };

    const handleDelete = (product: Product) => {
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

    // Excel Export/Import handlers
    const handleExport = () => {
        try {
            exportProducts(products, {
                filename: `urunler-${new Date().toISOString().split('T')[0]}.xlsx`,
                includeDeleted: false
            });
            toast.success('Ürünler Excel dosyasına aktarıldı');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export işlemi başarısız');
        }
    };

    const handleDownloadTemplate = () => {
        try {
            downloadProductTemplate();
            toast.success('Şablon dosyası indirildi');
        } catch (error) {
            console.error('Template download error:', error);
            toast.error('Şablon indirme başarısız');
        }
    };

    const handleImportClick = () => {
        setIsImportModalOpen(true);
    };

    const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('Geçersiz dosya formatı. Lütfen Excel veya CSV dosyası seçin.');
            return;
        }

        setIsImporting(true);

        try {
            const { products: importedProducts, result } = await importProducts(file);

            if (result.success || result.imported > 0) {
                for (const product of importedProducts) {
                    await onSave(product);
                }

                toast.success(`${result.imported} ürün başarıyla içe aktarıldı!`);
                setIsImportModalOpen(false);
            }

            if (result.failed > 0) {
                const errorMessage = result.errors.slice(0, 5).map(e => e.message).join('\n');
                toast.error(
                    `${result.failed} ürün hatası:\n${errorMessage}${result.errors.length > 5 ? '\n...' : ''}`,
                    { duration: 6000 }
                );
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Import işlemi başarısız: ' + (error as Error).message);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Batch delete functions
    const handleSelectItem = (id: string) => {
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
            product: { id: 'batch', count: selectedItems.size } as any
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Ürün Yönetimi</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center flex-1 sm:flex-none bg-red-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Seçili {selectedItems.size} Ürünü Sil</span>
                            <span className="sm:hidden">Sil ({selectedItems.size})</span>
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center flex-1 sm:flex-none bg-green-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-green-600"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden md:inline">Excel</span>
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center flex-1 sm:flex-none bg-purple-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-purple-600"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="hidden md:inline">Yükle</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        data-action="add-product"
                        className="flex items-center flex-1 sm:flex-none bg-blue-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        <span className="hidden sm:inline">Yeni Ürün</span>
                        <span className="sm:hidden">Yeni</span>
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
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 hidden md:table-header-group">
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
                    <tbody className="divide-y md:divide-none divide-gray-100 dark:divide-gray-700">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                            <tr key={product.id} className="block md:table-row mb-4 md:mb-0 rounded-lg md:rounded-none shadow md:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Seç:{' '}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(product.id)}
                                        onChange={() => handleSelectItem(product.id)}
                                        className="w-5 h-5 md:w-4 md:h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Ürün Adı:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300 font-bold">{product.name}</span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Ürün Kodu:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">{product.code}</span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Maliyet:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">{formatCurrency(product.cost_price, product.currency || 'TRY')}</span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        Satış:{' '}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">{formatCurrency(product.selling_price, product.currency || 'TRY')}</span>
                                </td>
                                <td className="p-3 text-sm block md:table-cell text-right md:text-left">
                                    <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                        İşlemler:{' '}
                                    </span>
                                    <div className="flex gap-3 justify-end md:justify-start">
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            className="text-blue-500 hover:underline dark:text-blue-400 min-h-[44px] px-2"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product)}
                                            className="text-red-500 hover:underline dark:text-red-400 min-h-[44px] px-2"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
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
                    product={currentProduct || undefined}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Import Modal */}
            <Modal
                show={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Excel'den Ürün İçe Aktar"
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Nasıl kullanılır?</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            <li>Şablon dosyasını indirin</li>
                            <li>Excel'de doldurun (fiyatlar, birim vb.)</li>
                            <li>Dosyayı yükleyin</li>
                        </ol>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Şablon Dosyasını İndir
                        </button>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                disabled={isImporting}
                                className="hidden"
                                id="product-file-input"
                            />
                            <label
                                htmlFor="product-file-input"
                                className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-gray-600 dark:text-gray-300 mb-1">
                                    {isImporting ? 'İçe aktarılıyor...' : 'Excel dosyası seçmek için tıklayın'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    .xlsx, .xls veya .csv formatında
                                </p>
                            </label>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Önemli Notlar</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                            <li>Ürün Adı, Maliyet Fiyatı, Satış Fiyatı ve Birim zorunludur</li>
                            <li>Fiyatlar sayısal değer olmalı (negatif olamaz)</li>
                            <li>Satış fiyatı maliyet fiyatından düşükse uyarı verilir</li>
                            <li>Hatalı satırlar atlanacaktır</li>
                        </ul>
                    </div>
                </div>
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
});

Products.displayName = 'Products';

export default Products;
