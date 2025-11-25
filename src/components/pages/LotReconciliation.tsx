import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LotReconciliation as LotReconciliationType, Product } from '../../types';
import {
  runMonthlyReconciliation,
  getReconciliationsByPeriod,
  applyReconciliationAdjustment,
  generateReconciliationReport,
  getCurrentPeriod,
  getPreviousPeriod
} from '../../services/reconciliationService';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { logger } from '../../utils/logger';

/**
 * LotReconciliation - Page for monthly reconciliation
 */
const LotReconciliation: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [reconciliations, setReconciliations] = useState<LotReconciliationType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningReconciliation, setRunningReconciliation] = useState(false);
  const [selectedRecon, setSelectedRecon] = useState<LotReconciliationType | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, period]);

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
      setProducts(productsData.filter(p => !p.isDeleted && p.lotTrackingEnabled));

      // Load reconciliations for the period
      const recons = await getReconciliationsByPeriod(user.uid, period);
      setReconciliations(recons);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    if (!user || products.length === 0) {
      toast.error('Lot takibi aktif olan ürün bulunamadı');
      return;
    }

    setRunningReconciliation(true);
    try {
      const results = await runMonthlyReconciliation(user.uid, period, products);
      setReconciliations(results);

      if (results.length === 0) {
        toast.success('✅ Hiç fark tespit edilmedi!');
      } else {
        toast.success(`${results.length} fark tespit edildi ve raporlandı`);
      }
    } catch (error) {
      logger.error('Error running reconciliation:', error);
      toast.error('Uzlaştırma çalıştırılırken hata oluştu');
    } finally {
      setRunningReconciliation(false);
    }
  };

  const handleApproveAdjustment = async (reconciliation: LotReconciliationType) => {
    setSelectedRecon(reconciliation);
    setShowApprovalDialog(true);
  };

  const confirmApproval = async () => {
    if (!user || !selectedRecon) return;

    try {
      await applyReconciliationAdjustment(
        user.uid,
        selectedRecon.id,
        user.uid,
        user.email || 'unknown'
      );
      toast.success('Düzeltme başarıyla uygulandı');
      setShowApprovalDialog(false);
      setSelectedRecon(null);
      loadData();
    } catch (error) {
      logger.error('Error applying adjustment:', error);
      toast.error('Düzeltme uygulanırken hata oluştu');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calculate summary statistics
  const summary = {
    totalReconciliations: reconciliations.length,
    totalVarianceValue: reconciliations.reduce((sum, r) => sum + Math.abs(r.varianceValue), 0),
    pendingCount: reconciliations.filter(r => r.status === 'pending').length,
    approvedCount: reconciliations.filter(r => r.status === 'approved').length,
    adjustedCount: reconciliations.filter(r => r.status === 'adjusted').length,
    rejectedCount: reconciliations.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          🔍 Lot Uzlaştırma - Ay Sonu Kontrolü
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Muhasebe (FIFO) ve fiziksel stok arasındaki farkları tespit edin
        </p>
      </div>

      {/* Period Selection & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📅 Dönem Seçimi
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              max={getCurrentPeriod()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPeriod(getPreviousPeriod())}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors"
            >
              ⬅️ Önceki Ay
            </button>
            <button
              onClick={() => setPeriod(getCurrentPeriod())}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors"
            >
              📅 Bu Ay
            </button>
          </div>
          <button
            onClick={handleRunReconciliation}
            disabled={runningReconciliation}
            className={`
              px-6 py-3 rounded-md font-medium transition-colors min-w-[200px]
              ${runningReconciliation
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {runningReconciliation ? '🔄 Kontrol Ediliyor...' : '🔍 Uzlaştırmayı Çalıştır'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {reconciliations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Toplam Fark</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {summary.totalReconciliations}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Bekleyen</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {summary.pendingCount}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Düzeltilmiş</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {summary.adjustedCount}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Onaylanmış</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {summary.approvedCount}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <p className="text-sm text-red-600 dark:text-red-400 mb-1">Toplam Etki</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(summary.totalVarianceValue)}
            </p>
          </div>
        </div>
      )}

      {/* Reconciliations Table */}
      {reconciliations.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Fark Bulunamadı"
          message="Dönem seçip uzlaştırmayı çalıştırın veya seçili dönem için henüz fark tespit edilmemiş."
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ürün
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Lot
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Muhasebe
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Fiziksel
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Fark
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Değer
                  </th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Durum
                  </th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((recon) => (
                  <tr
                    key={recon.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">
                      {recon.productName}
                    </td>
                    <td className="p-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                      {recon.lotNumber}
                    </td>
                    <td className="p-3 text-sm text-right text-gray-900 dark:text-gray-100">
                      {recon.accountingBalance.toFixed(3)}
                    </td>
                    <td className="p-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                      {recon.physicalBalance.toFixed(3)}
                    </td>
                    <td
                      className={`
                        p-3 text-sm text-right font-bold
                        ${recon.variance > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }
                      `}
                    >
                      {recon.variance > 0 ? '+' : ''}{recon.variance.toFixed(3)}
                    </td>
                    <td className="p-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(Math.abs(recon.varianceValue))}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`
                          inline-block px-3 py-1 rounded-full text-xs font-semibold
                          ${recon.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : recon.status === 'approved'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : recon.status === 'adjusted'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        {recon.status === 'pending' && '⏳ Bekliyor'}
                        {recon.status === 'approved' && '✅ Onaylandı'}
                        {recon.status === 'adjusted' && '🔧 Düzeltildi'}
                        {recon.status === 'rejected' && '❌ Reddedildi'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {recon.status === 'pending' && (
                        <button
                          onClick={() => handleApproveAdjustment(recon)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md
                            transition-colors text-sm font-medium"
                        >
                          ✅ Onayla & Düzelt
                        </button>
                      )}
                      {recon.status === 'adjusted' && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {recon.adjustedByEmail}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false);
          setSelectedRecon(null);
        }}
        onConfirm={confirmApproval}
        title="Düzeltme Onayı"
        message={
          selectedRecon
            ? `${selectedRecon.productName} - ${selectedRecon.lotNumber} için tespit edilen ${selectedRecon.variance > 0 ? '+' : ''}${selectedRecon.variance.toFixed(3)} birim farkı onaylıyor ve muhasebe kaydını düzeltmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve lot tüketim kayıtlarına phantom kayıt eklenecektir.`
            : ''
        }
        confirmText="Onayla & Düzelt"
        cancelText="İptal"
      />
    </div>
  );
};

export default LotReconciliation;
