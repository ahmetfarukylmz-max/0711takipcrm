import React, { useState, useMemo, memo, useRef, ChangeEvent, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ProductForm from '../forms/ProductForm';
import ProductDetail from './ProductDetail';
import SearchBar from '../common/SearchBar';
import MobileListItem from '../common/MobileListItem';
import MobileActions from '../common/MobileActions';
import SkeletonTable from '../common/SkeletonTable';
import EmptyState from '../common/EmptyState';
import { PlusIcon } from '../icons';
import { formatCurrency } from '../../utils/formatters';
import { exportProducts } from '../../utils/excelExport';
import { importProducts, downloadProductTemplate } from '../../utils/excelImport';
import { PRODUCT_CATEGORIES, getCategoryWithIcon } from '../../utils/categories';
import { updateProductStock } from '../../services/firestoreService';
import useStore from '../../store/useStore';
import type { Product, Order, Quote, Customer, StockMovement } from '../../types';

interface DeleteConfirmState {
    isOpen: boolean;
    product: (Product & { count?: number }) | null;
}

interface ProductsProps {
    /** List of products */
    products: Product[];
    /** List of orders for product analytics */
    orders?: Order[];
    /** List of quotes for product analytics */
    quotes?: Quote[];
    /** List of customers for product analytics */
    customers?: Customer[];
    /** Callback when product is saved */
    onSave: (product: Partial<Product>) => Promise<void> | void;
    /** Callback when product is deleted */
    onDelete: (id: string) => void;
    /** Loading state */
    loading?: boolean;
}

/**
 * Products component - Product management page
 */
const Products = memo<ProductsProps>(({
    products,
    orders = [],
    quotes = [],
    customers = [],
    onSave,
    onDelete,
    loading = false
}) => {
    // Zustand store - for navigation from Dashboard
    const selectedProductId = useStore((state) => state.selectedProductId);
    const clearSelectedProductId = useStore((state) => state.clearSelectedProductId);
    const stockMovements = useStore((state) => state.collections.stock_movements);
    const user = useStore((state) => state.user);

    // Get all data from store for ProductDetail (in case not passed as props)
    const storeOrders = useStore((state) => state.collections.orders);
    const storeQuotes = useStore((state) => state.collections.teklifler);
    const storeCustomers = useStore((state) => state.collections.customers);

    // Use props if available, otherwise fallback to store
    const allOrders = orders.length > 0 ? orders : storeOrders;
    const allQuotes = quotes.length > 0 ? quotes : storeQuotes;
    const allCustomers = customers.length > 0 ? customers : storeCustomers;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, product: null });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sorting state
    type SortField = 'name' | 'cost_price' | 'selling_price' | 'stock' | 'profit_margin';
    type SortDirection = 'asc' | 'desc';
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Advanced filters state
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [priceRangeMin, setPriceRangeMin] = useState<number | ''>('');
    const [priceRangeMax, setPriceRangeMax] = useState<number | ''>('');
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'normal' | 'not_tracked'>('all');
    const [profitabilityFilter, setProfitabilityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [salesStatusFilter, setSalesStatusFilter] = useState<'all' | 'never' | 'low' | 'high'>('all');

    // Auto-open product detail when navigating from Dashboard
    useEffect(() => {
        if (selectedProductId && !loading) {
            const product = products.find(p => p.id === selectedProductId && !p.isDeleted);
            if (product) {
                setSelectedProduct(product);
                clearSelectedProductId();
            }
        }
    }, [selectedProductId, products, loading, clearSelectedProductId]);

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
                // Detay sayfasındaysak, listeye dön
                if (selectedProduct && selectedProduct.id === deleteConfirm.product.id) {
                    setSelectedProduct(null);
                }
            }
        }
    };

    // Product detail handlers
    const handleViewProduct = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleBackFromDetail = () => {
        setSelectedProduct(null);
    };

    const handleEditFromDetail = () => {
        if (selectedProduct) {
            handleOpenModal(selectedProduct);
        }
    };

    const handleDeleteFromDetail = () => {
        if (selectedProduct) {
            handleDelete(selectedProduct);
        }
    };

    // Quick stock update handler
    const handleQuickStockUpdate = async (product: Product, quantityChange: number) => {
        if (!user?.uid || !user?.email) {
            toast.error('Kullanıcı bilgisi bulunamadı');
            return;
        }

        if (!product.track_stock) {
            toast.error('Bu ürün için stok takibi aktif değil');
            return;
        }

        try {
            const success = await updateProductStock(
                user.uid,
                product.id,
                quantityChange,
                {
                    type: 'Manuel Giriş',
                    notes: `Hızlı stok güncellemesi: ${quantityChange > 0 ? '+' : ''}${quantityChange} ${product.unit || 'Adet'}`,
                    createdBy: user.uid,
                    createdByEmail: user.email
                }
            );

            if (success) {
                toast.success(`Stok güncellendi: ${quantityChange > 0 ? '+' : ''}${quantityChange} ${product.unit || 'Adet'}`);
            } else {
                toast.error('Stok güncellenemedi');
            }
        } catch (error) {
            console.error('Quick stock update error:', error);
            toast.error('Stok güncelleme hatası');
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

    // Calculate product stats (profit margin, total sales)
    const productsWithStats = useMemo(() => {
        return activeProducts.map(product => {
            // Calculate profit margin percentage
            const profitMargin = product.selling_price > 0
                ? ((product.selling_price - product.cost_price) / product.selling_price) * 100
                : 0;

            // Calculate total sales quantity from orders
            const productOrders = allOrders.filter(o =>
                !o.isDeleted && o.items?.some(item => item.productId === product.id)
            );

            const totalSales = productOrders.reduce((sum, order) => {
                const item = order.items?.find(i => i.productId === product.id);
                return sum + (item?.quantity || 0);
            }, 0);

            return { ...product, profitMargin, totalSales };
        });
    }, [activeProducts, allOrders]);

    const filteredProducts = useMemo(() => {
        // First apply filters
        const filtered = productsWithStats.filter(product => {
            const query = searchQuery.toLowerCase();

            // Basic search filter
            const matchesSearch = !searchQuery.trim() ||
                product.name?.toLowerCase().includes(query) ||
                product.code?.toLowerCase().includes(query) ||
                product.cost_price?.toString().includes(query) ||
                product.selling_price?.toString().includes(query);

            // Category filter
            const matchesCategory = categoryFilter === 'all' ||
                categoryFilter === 'uncategorized' && !product.category ||
                product.category === categoryFilter;

            // Price range filter
            const matchesPriceRange = (
                (priceRangeMin === '' || product.selling_price >= priceRangeMin) &&
                (priceRangeMax === '' || product.selling_price <= priceRangeMax)
            );

            // Stock status filter
            let matchesStockStatus = true;
            if (stockStatusFilter !== 'all') {
                if (stockStatusFilter === 'not_tracked') {
                    matchesStockStatus = !product.track_stock;
                } else if (stockStatusFilter === 'out') {
                    matchesStockStatus = product.track_stock && (product.stock_quantity || 0) === 0;
                } else if (stockStatusFilter === 'low') {
                    matchesStockStatus = product.track_stock &&
                        product.stock_quantity !== undefined &&
                        product.minimum_stock !== undefined &&
                        product.stock_quantity > 0 &&
                        product.stock_quantity <= product.minimum_stock;
                } else if (stockStatusFilter === 'normal') {
                    matchesStockStatus = product.track_stock &&
                        product.stock_quantity !== undefined &&
                        product.minimum_stock !== undefined &&
                        product.stock_quantity > product.minimum_stock;
                }
            }

            // Profitability filter
            let matchesProfitability = true;
            if (profitabilityFilter !== 'all') {
                if (profitabilityFilter === 'high') {
                    matchesProfitability = product.profitMargin > 25;
                } else if (profitabilityFilter === 'medium') {
                    matchesProfitability = product.profitMargin >= 10 && product.profitMargin <= 25;
                } else if (profitabilityFilter === 'low') {
                    matchesProfitability = product.profitMargin < 10;
                }
            }

            // Sales status filter
            let matchesSalesStatus = true;
            if (salesStatusFilter !== 'all') {
                if (salesStatusFilter === 'never') {
                    matchesSalesStatus = product.totalSales === 0;
                } else if (salesStatusFilter === 'low') {
                    matchesSalesStatus = product.totalSales > 0 && product.totalSales < 10;
                } else if (salesStatusFilter === 'high') {
                    matchesSalesStatus = product.totalSales >= 10;
                }
            }

            return matchesSearch && matchesCategory && matchesPriceRange &&
                   matchesStockStatus && matchesProfitability && matchesSalesStatus;
        });

        // Then apply sorting
        return filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name, 'tr');
                    break;
                case 'cost_price':
                    comparison = (a.cost_price || 0) - (b.cost_price || 0);
                    break;
                case 'selling_price':
                    comparison = (a.selling_price || 0) - (b.selling_price || 0);
                    break;
                case 'stock':
                    comparison = (a.stock_quantity || 0) - (b.stock_quantity || 0);
                    break;
                case 'profit_margin':
                    comparison = a.profitMargin - b.profitMargin;
                    break;
                default:
                    comparison = 0;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [productsWithStats, searchQuery, categoryFilter, sortField, sortDirection,
        priceRangeMin, priceRangeMax, stockStatusFilter, profitabilityFilter, salesStatusFilter]);

    // Show skeleton when loading
    if (loading) {
        return (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Ürün Yönetimi</h1>
                </div>
                {/* Desktop: Table skeleton */}
                <div className="hidden md:block">
                    <SkeletonTable rows={10} columns={6} />
                </div>
                {/* Mobile: Card skeleton */}
                <div className="md:hidden">
                    <SkeletonTable rows={10} columns={6} mobileCardView={true} />
                </div>
            </div>
        );
    }

    // Show product detail if selected
    if (selectedProduct) {
        return (
            <ProductDetail
                product={selectedProduct}
                orders={allOrders}
                quotes={allQuotes}
                customers={allCustomers}
                stockMovements={stockMovements}
                onEdit={handleEditFromDetail}
                onDelete={handleDeleteFromDetail}
                onBack={handleBackFromDetail}
            />
        );
    }

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

            <div className="mb-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <SearchBar
                        placeholder="Ürün ara (ad, kod, fiyat, etiket)..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                >
                    <option value="all">Tüm Kategoriler</option>
                    <option value="uncategorized">Kategorisiz</option>
                    {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap"
                >
                    {showAdvancedFilters ? '🔽' : '▶️'} Gelişmiş Filtreler
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Price Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fiyat Aralığı
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRangeMin}
                                    onChange={(e) => setPriceRangeMin(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRangeMax}
                                    onChange={(e) => setPriceRangeMax(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Stock Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Stok Durumu
                            </label>
                            <select
                                value={stockStatusFilter}
                                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tümü</option>
                                <option value="normal">Normal Stok</option>
                                <option value="low">Düşük Stok</option>
                                <option value="out">Tükendi</option>
                                <option value="not_tracked">Takip Yok</option>
                            </select>
                        </div>

                        {/* Profitability */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Karlılık
                            </label>
                            <select
                                value={profitabilityFilter}
                                onChange={(e) => setProfitabilityFilter(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tümü</option>
                                <option value="high">Yüksek (&gt;%25)</option>
                                <option value="medium">Orta (%10-25)</option>
                                <option value="low">Düşük (&lt;%10)</option>
                            </select>
                        </div>

                        {/* Sales Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Satış Durumu
                            </label>
                            <select
                                value={salesStatusFilter}
                                onChange={(e) => setSalesStatusFilter(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tümü</option>
                                <option value="high">Yüksek Satış (≥10)</option>
                                <option value="low">Düşük Satış (1-9)</option>
                                <option value="never">Hiç Satılmadı</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => {
                                setPriceRangeMin('');
                                setPriceRangeMax('');
                                setStockStatusFilter('all');
                                setProfitabilityFilter('all');
                                setSalesStatusFilter('all');
                            }}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            Filtreleri Temizle
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {filteredProducts.length} ürün gösteriliyor
                {(searchQuery || categoryFilter !== 'all') && ` (${activeProducts.length} toplam)`}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-auto rounded-xl shadow-sm bg-white dark:bg-gray-800">
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
                            <th
                                className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Ürün Adı
                                    {sortField === 'name' && (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                Ürün Kodu
                            </th>
                            <th
                                className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors"
                                onClick={() => handleSort('cost_price')}
                            >
                                <div className="flex items-center gap-1">
                                    Maliyet Fiyatı
                                    {sortField === 'cost_price' && (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors"
                                onClick={() => handleSort('selling_price')}
                            >
                                <div className="flex items-center gap-1">
                                    Satış Fiyatı
                                    {sortField === 'selling_price' && (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors"
                                onClick={() => handleSort('stock')}
                            >
                                <div className="flex items-center gap-1">
                                    Stok Durumu
                                    {sortField === 'stock' && (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors"
                                onClick={() => handleSort('profit_margin')}
                            >
                                <div className="flex items-center gap-1">
                                    Kar Marjı
                                    {sortField === 'profit_margin' && (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="p-3 text-sm text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(product.id)}
                                        onChange={() => handleSelectItem(product.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td
                                    className="p-3 text-sm text-gray-700 dark:text-gray-300 font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleViewProduct(product)}
                                    title="Detayları görmek için tıklayın"
                                >
                                    {product.name}
                                </td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{product.code}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(product.cost_price, product.currency || 'TRY')}</td>
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(product.selling_price, product.currency || 'TRY')}</td>
                                <td className="p-3 text-sm">
                                    {product.track_stock ? (
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    product.stock_quantity !== undefined && product.minimum_stock !== undefined && product.stock_quantity <= product.minimum_stock
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                    {product.stock_quantity || 0} {product.unit}
                                                </span>
                                                {product.stock_quantity !== undefined && product.minimum_stock !== undefined && product.stock_quantity <= product.minimum_stock && (
                                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">⚠️</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                Değer: {formatCurrency((product.stock_quantity || 0) * (product.cost_price || 0), product.currency || 'TRY')}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQuickStockUpdate(product, -10);
                                                    }}
                                                    className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded transition-colors"
                                                    title="10 azalt"
                                                >
                                                    -10
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQuickStockUpdate(product, 10);
                                                    }}
                                                    className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded transition-colors"
                                                    title="10 ekle"
                                                >
                                                    +10
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                            Takip yok
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 text-sm">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                        product.profitMargin > 25
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : product.profitMargin >= 10
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                        %{product.profitMargin.toFixed(1)}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-right">
                                    <div className="flex gap-3 justify-end">
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
                                <td colSpan={7} className="p-0">
                                    <EmptyState
                                        icon={searchQuery ? 'search' : 'products'}
                                        title={searchQuery ? 'Ürün Bulunamadı' : 'Henüz Ürün Yok'}
                                        description={searchQuery
                                            ? 'Arama kriterinize uygun ürün bulunamadı. Lütfen farklı bir anahtar kelime deneyin.'
                                            : 'Ürün ekleyerek başlayın. Ürünlerinizi buradan yönetebilir ve fiyatlandırabilirsiniz.'}
                                        action={!searchQuery ? {
                                            label: 'İlk Ürünü Ekle',
                                            onClick: () => handleOpenModal(),
                                            icon: <PlusIcon />
                                        } : undefined}
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                    <MobileListItem
                        key={product.id}
                        title={product.name}
                        subtitle={`Kod: ${product.code}`}
                        bottomContent={
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Maliyet:</span>
                                    <span className="text-gray-900 dark:text-gray-100 font-semibold">{formatCurrency(product.cost_price, product.currency || 'TRY')}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Satış:</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(product.selling_price, product.currency || 'TRY')}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Stok:</span>
                                    {product.track_stock ? (
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                product.stock_quantity !== undefined && product.minimum_stock !== undefined && product.stock_quantity <= product.minimum_stock
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                                {product.stock_quantity || 0} {product.unit}
                                            </span>
                                            {product.stock_quantity !== undefined && product.minimum_stock !== undefined && product.stock_quantity <= product.minimum_stock && (
                                                <span className="text-xs text-yellow-600 dark:text-yellow-400">⚠️</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                            Takip yok
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Kar Marjı:</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        product.profitMargin > 25
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : product.profitMargin >= 10
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                        %{product.profitMargin.toFixed(1)}
                                    </span>
                                </div>
                                {product.track_stock && (
                                    <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Hızlı Stok:</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickStockUpdate(product, -10);
                                                }}
                                                className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded transition-colors"
                                            >
                                                -10
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickStockUpdate(product, 10);
                                                }}
                                                className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded transition-colors"
                                            >
                                                +10
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        }
                        actions={
                            <MobileActions
                                actions={[
                                    {
                                        label: 'Detay',
                                        onClick: () => handleViewProduct(product),
                                        variant: 'primary'
                                    },
                                    {
                                        label: 'Düzenle',
                                        onClick: () => handleOpenModal(product),
                                        variant: 'secondary'
                                    },
                                    {
                                        label: 'Sil',
                                        onClick: () => handleDelete(product),
                                        variant: 'danger'
                                    }
                                ]}
                            />
                        }
                    />
                )) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <EmptyState
                            icon={searchQuery ? 'search' : 'products'}
                            title={searchQuery ? 'Ürün Bulunamadı' : 'Henüz Ürün Yok'}
                            description={searchQuery
                                ? 'Arama kriterinize uygun ürün bulunamadı. Lütfen farklı bir anahtar kelime deneyin.'
                                : 'Ürün ekleyerek başlayın. Ürünlerinizi buradan yönetebilir ve fiyatlandırabilirsiniz.'}
                            action={!searchQuery ? {
                                label: 'İlk Ürünü Ekle',
                                onClick: () => handleOpenModal(),
                                icon: <PlusIcon />
                            } : undefined}
                        />
                    </div>
                )}
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
