import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StockLot, Product } from '../../types';
import { getProductLots, createStockLot, generateLotNumber } from '../../services/lotService';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { logger } from '../../utils/logger';

/**
 * StockLotManagement - Page for managing stock lots
 */
const StockLotManagement: React.FC = () => {
  const { user } = useAuth();
  const [lots, setLots] = useState<StockLot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'consumed'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // New lot form state
  const [newLot, setNewLot] = useState({
    productId: '',
    lotNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    initialQuantity: 0,
    unitCost: 0,
    currency: 'TRY' as const,
    supplierName: '',
    invoiceNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load products
      const productsRef = collection(db, `users/${user.uid}/products`);
      const productsSnapshot = await getDocs(productsRef);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData.filter(p => !p.isDeleted));

      // Load lots
      const lotsRef = collection(db, `users/${user.uid}/stock_lots`);
      const lotsSnapshot = await getDocs(lotsRef);
      const lotsData = lotsSnapshot.docs.map(doc => doc.data()) as StockLot[];
      setLots(lotsData.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()));
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLot = async () => {
    if (!user || !newLot.productId || !newLot.initialQuantity || !newLot.unitCost) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const product = products.find(p => p.id === newLot.productId);
    if (!product) return;

    try {
      const lotData: Partial<StockLot> = {
        productId: newLot.productId,
        productName: product.name,
        productUnit: product.unit,
        lotNumber: newLot.lotNumber || generateLotNumber(newLot.productId),
        purchaseDate: newLot.purchaseDate,
        initialQuantity: newLot.initialQuantity,
        unitCost: newLot.unitCost,
        totalCost: newLot.initialQuantity * newLot.unitCost,
        currency: newLot.currency,
        supplierName: newLot.supplierName,
        invoiceNumber: newLot.invoiceNumber,
        notes: newLot.notes,
        createdBy: user.uid,
        createdByEmail: user.email || 'unknown'
      };

      await createStockLot(user.uid, lotData as any);
      toast.success('Lot başarıyla oluşturuldu');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      logger.error('Error creating lot:', error);
      toast.error('Lot oluşturulurken hata oluştu');
    }
  };

  const resetForm = () => {
    setNewLot({
      productId: '',
      lotNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      initialQuantity: 0,
      unitCost: 0,
      currency: 'TRY',
      supplierName: '',
      invoiceNumber: '',
      notes: ''
    });
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Filter lots
  const filteredLots = lots.filter(lot => {
    // Status filter
    if (filterStatus === 'active' && lot.status !== 'active') return false;
    if (filterStatus === 'consumed' && lot.status !== 'consumed') return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        lot.lotNumber.toLowerCase().includes(search) ||
        lot.productName.toLowerCase().includes(search) ||
        lot.supplierName?.toLowerCase().includes(search) ||
        lot.invoiceNumber?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    totalLots: lots.length,
    activeLots: lots.filter(l => l.status === 'active').length,
    consumedLots: lots.filter(l => l.status === 'consumed').length,
    totalValue: lots
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + (l.remainingQuantity * l.unitCost), 0)
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            📦 Lot Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stok lotlarını takip edin ve yönetin
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
            font-medium transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Yeni Lot Ekle
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Lot</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalLots}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Aktif Lot</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.activeLots}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tüketilen</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.consumedLots}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Toplam Değer</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Ara
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lot numarası, ürün, tedarikçi..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📊 Durum Filtresi
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="consumed">Tüketilen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lots List */}
      {filteredLots.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Lot Bulunamadı"
          message={lots.length === 0 ? "Henüz hiç lot eklenmemiş. Yeni lot eklemek için yukarıdaki butona tıklayın." : "Filtreleme kriterlerine uygun lot bulunamadı."}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLots.map((lot) => (
            <div
              key={lot.id}
              className={`
                bg-white dark:bg-gray-800 rounded-lg p-5 border-2 transition-all
                ${lot.status === 'active'
                  ? 'border-green-200 dark:border-green-700 hover:border-green-400'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
                }
              `}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100">
                    {lot.lotNumber}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{lot.productName}</p>
                </div>
                <span
                  className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${lot.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {lot.status === 'active' ? '✅ Aktif' : '⏹️ Tüketildi'}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tarih</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    📅 {formatDate(lot.purchaseDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Birim Maliyet</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(lot.unitCost, lot.currency)}/{lot.productUnit}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Başlangıç</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {lot.initialQuantity} {lot.productUnit}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Kalan</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {lot.remainingQuantity} {lot.productUnit}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Tüketim</span>
                  <span>{((lot.consumedQuantity / lot.initialQuantity) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(lot.consumedQuantity / lot.initialQuantity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Supplier Info */}
              {lot.supplierName && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm mb-3">
                  <p className="text-gray-600 dark:text-gray-400">🏢 Tedarikçi</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{lot.supplierName}</p>
                  {lot.invoiceNumber && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      Fatura: {lot.invoiceNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Total Value */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                <p className="text-sm text-blue-600 dark:text-blue-400">Kalan Değer</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(lot.remainingQuantity * lot.unitCost, lot.currency)}
                </p>
              </div>

              {/* Notes */}
              {lot.notes && (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 italic">
                  💬 {lot.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Lot Modal */}
      <Modal
        show={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="➕ Yeni Lot Ekle"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-600">*</span> Ürün
            </label>
            <select
              value={newLot.productId}
              onChange={(e) => setNewLot({ ...newLot, productId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Ürün Seçin</option>
              {products
                .filter(p => p.lotTrackingEnabled)
                .map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.unit})
                  </option>
                ))}
            </select>
          </div>

          {/* Lot Number & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lot Numarası (Opsiyonel)
              </label>
              <input
                type="text"
                value={newLot.lotNumber}
                onChange={(e) => setNewLot({ ...newLot, lotNumber: e.target.value })}
                placeholder="Otomatik oluşturulacak"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-600">*</span> Alım Tarihi
              </label>
              <input
                type="date"
                value={newLot.purchaseDate}
                onChange={(e) => setNewLot({ ...newLot, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Quantity & Cost */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-600">*</span> Miktar
              </label>
              <input
                type="number"
                value={newLot.initialQuantity || ''}
                onChange={(e) => setNewLot({ ...newLot, initialQuantity: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.001}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-600">*</span> Birim Maliyet
              </label>
              <input
                type="number"
                value={newLot.unitCost || ''}
                onChange={(e) => setNewLot({ ...newLot, unitCost: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Para Birimi
              </label>
              <select
                value={newLot.currency}
                onChange={(e) => setNewLot({ ...newLot, currency: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Total Cost Display */}
          {newLot.initialQuantity > 0 && newLot.unitCost > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(newLot.initialQuantity * newLot.unitCost, newLot.currency)}
              </p>
            </div>
          )}

          {/* Supplier Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tedarikçi Adı
              </label>
              <input
                type="text"
                value={newLot.supplierName}
                onChange={(e) => setNewLot({ ...newLot, supplierName: e.target.value })}
                placeholder="ABC Çelik Ltd."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fatura Numarası
              </label>
              <input
                type="text"
                value={newLot.invoiceNumber}
                onChange={(e) => setNewLot({ ...newLot, invoiceNumber: e.target.value })}
                placeholder="FT-2024-001"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notlar
            </label>
            <textarea
              value={newLot.notes}
              onChange={(e) => setNewLot({ ...newLot, notes: e.target.value })}
              placeholder="Bu lot hakkında notlar..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-md
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors font-medium"
            >
              ❌ İptal
            </button>
            <button
              onClick={handleCreateLot}
              disabled={!newLot.productId || !newLot.initialQuantity || !newLot.unitCost}
              className={`
                flex-1 px-6 py-3 rounded-md font-medium transition-colors
                ${newLot.productId && newLot.initialQuantity && newLot.unitCost
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              ✅ Lot Oluştur
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StockLotManagement;
