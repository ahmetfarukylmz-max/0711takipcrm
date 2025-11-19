import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import SearchBar from '../common/SearchBar';
import EmptyState from '../common/EmptyState';
import ActionsDropdown from '../common/ActionsDropdown';
import Modal from '../common/Modal';
import type { Payment, CheckStatus } from '../../types';

interface CheckPortfolioProps {
  payments: Payment[];
  onSave: (payment: Partial<Payment>) => void;
  onDelete: (id: string) => void;
}

// Çek durumu için icon döndür
const getCheckStatusIcon = (status: CheckStatus): string => {
  switch (status) {
    case 'Portföyde':
      return '💼';
    case 'Bankaya Verildi':
      return '🏦';
    case 'Tahsil Edildi':
      return '✅';
    case 'Ciro Edildi':
      return '🔄';
    case 'Karşılıksız':
      return '❌';
    case 'İade Edildi':
      return '↩️';
  }
};

// Çek durumu için renk döndür
const getCheckStatusColor = (status: CheckStatus): string => {
  switch (status) {
    case 'Portföyde':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Bankaya Verildi':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'Tahsil Edildi':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'Ciro Edildi':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'Karşılıksız':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'İade Edildi':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const CheckPortfolio: React.FC<CheckPortfolioProps> = ({ payments, onSave, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CheckStatus | 'Tümü'>('Tümü');
  const [selectedCheck, setSelectedCheck] = useState<Payment | null>(null);

  // Sadece çek ve senet ödemelerini filtrele
  const checkPayments = useMemo(() => {
    return payments.filter(p => {
      if (p.isDeleted) return false;
      if (p.paymentMethod !== 'Çek' && p.paymentMethod !== 'Senet') return false;

      const matchesSearch =
        p.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.checkNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.checkBank?.toLowerCase().includes(searchQuery.toLowerCase());

      // Eğer checkTracking yoksa, default olarak 'Portföyde' kabul et
      const checkStatus = p.checkTracking?.status || 'Portföyde';
      const matchesStatus = statusFilter === 'Tümü' || checkStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  // Portföy istatistikleri
  const stats = useMemo(() => {
    const allChecks = payments.filter(p =>
      !p.isDeleted && (p.paymentMethod === 'Çek' || p.paymentMethod === 'Senet')
    );

    const portfolio = allChecks.filter(p => !p.checkTracking || p.checkTracking.status === 'Portföyde');
    const atBank = allChecks.filter(p => p.checkTracking?.status === 'Bankaya Verildi');
    const collected = allChecks.filter(p => p.checkTracking?.status === 'Tahsil Edildi');
    const endorsed = allChecks.filter(p => p.checkTracking?.status === 'Ciro Edildi');

    // Vadesi gelen (30 gün içinde)
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueSoon = portfolio.filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate >= today && dueDate <= thirtyDaysLater;
    });

    return {
      total: allChecks.length,
      totalAmount: allChecks.reduce((sum, p) => sum + p.amount, 0),
      portfolio: portfolio.length,
      portfolioAmount: portfolio.reduce((sum, p) => sum + p.amount, 0),
      atBank: atBank.length,
      atBankAmount: atBank.reduce((sum, p) => sum + p.amount, 0),
      collected: collected.length,
      collectedAmount: collected.reduce((sum, p) => sum + p.amount, 0),
      endorsed: endorsed.length,
      endorsedAmount: endorsed.reduce((sum, p) => sum + p.amount, 0),
      dueSoon: dueSoon.length,
      dueSoonAmount: dueSoon.reduce((sum, p) => sum + p.amount, 0)
    };
  }, [payments]);

  // Çek durumu değiştir
  const handleSubmitToBank = (payment: Payment) => {
    const today = new Date().toISOString().split('T')[0];

    onSave({
      ...payment,
      checkTracking: {
        checkNumber: payment.checkNumber || '',
        bank: payment.checkBank || '',
        dueDate: payment.dueDate,
        amount: payment.amount,
        currency: payment.currency || 'TRY',
        status: 'Bankaya Verildi',
        bankSubmissionDate: today,
        endorsements: [],
        statusHistory: [
          ...(payment.checkTracking?.statusHistory || []),
          {
            date: new Date().toISOString(),
            status: 'Bankaya Verildi',
            changedBy: 'current-user', // TODO: Get from AuthContext
            notes: 'Bankaya teslim edildi'
          }
        ]
      }
    });

    toast.success('✅ Çek bankaya teslim edildi!');
  };

  const handleCollectCheck = (payment: Payment) => {
    const today = new Date().toISOString().split('T')[0];

    onSave({
      ...payment,
      status: 'Tahsil Edildi',
      paidDate: today,
      checkTracking: {
        ...(payment.checkTracking || {
          checkNumber: payment.checkNumber || '',
          bank: payment.checkBank || '',
          dueDate: payment.dueDate,
          amount: payment.amount,
          currency: payment.currency || 'TRY',
          endorsements: [],
          statusHistory: []
        }),
        status: 'Tahsil Edildi',
        collectionDate: today,
        statusHistory: [
          ...(payment.checkTracking?.statusHistory || []),
          {
            date: new Date().toISOString(),
            status: 'Tahsil Edildi',
            changedBy: 'current-user',
            notes: 'Tahsil edildi'
          }
        ]
      }
    });

    toast.success('✅ Çek tahsil edildi!');
  };

  const handleMarkBounced = (payment: Payment) => {
    const today = new Date().toISOString().split('T')[0];

    onSave({
      ...payment,
      status: 'Gecikti',
      checkTracking: {
        ...(payment.checkTracking || {
          checkNumber: payment.checkNumber || '',
          bank: payment.checkBank || '',
          dueDate: payment.dueDate,
          amount: payment.amount,
          currency: payment.currency || 'TRY',
          endorsements: [],
          statusHistory: []
        }),
        status: 'Karşılıksız',
        bouncedDate: today,
        bouncedReason: 'Karşılıksız döndü',
        statusHistory: [
          ...(payment.checkTracking?.statusHistory || []),
          {
            date: new Date().toISOString(),
            status: 'Karşılıksız',
            changedBy: 'current-user',
            notes: 'Karşılıksız döndü'
          }
        ]
      }
    });

    toast.error('❌ Çek karşılıksız olarak işaretlendi!');
  };

  // Actions dropdown için aksiyonlar
  const getCheckActions = (payment: Payment) => {
    const checkStatus = payment.checkTracking?.status || 'Portföyde';

    switch (checkStatus) {
      case 'Portföyde':
        return [
          {
            label: '🏦 Bankaya Ver',
            onClick: () => handleSubmitToBank(payment)
          },
          {
            label: '✅ Tahsil Et',
            onClick: () => handleCollectCheck(payment)
          },
          {
            label: '👁️ Detay',
            onClick: () => setSelectedCheck(payment)
          },
          {
            label: '🗑️ Sil',
            onClick: () => onDelete(payment.id),
            destructive: true
          }
        ];

      case 'Bankaya Verildi':
        return [
          {
            label: '✅ Tahsil Edildi',
            onClick: () => handleCollectCheck(payment)
          },
          {
            label: '❌ Karşılıksız',
            onClick: () => handleMarkBounced(payment),
            destructive: true
          },
          {
            label: '👁️ Detay',
            onClick: () => setSelectedCheck(payment)
          }
        ];

      case 'Tahsil Edildi':
      case 'Karşılıksız':
      case 'Ciro Edildi':
      case 'İade Edildi':
        return [
          {
            label: '👁️ Detay',
            onClick: () => setSelectedCheck(payment)
          }
        ];

      default:
        return [];
    }
  };

  return (
    <div>
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">Portföyde</span>
            <span className="text-2xl">💼</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.portfolio}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(stats.portfolioAmount, 'TRY')}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700 dark:text-purple-400 font-medium">Bankada</span>
            <span className="text-2xl">🏦</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{stats.atBank}</div>
          <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
            {formatCurrency(stats.atBankAmount, 'TRY')}
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Vadesi Yakın</span>
            <span className="text-2xl">⏰</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.dueSoon}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
            {formatCurrency(stats.dueSoonAmount, 'TRY')}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">Tahsil Edilen</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.collected}</div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(stats.collectedAmount, 'TRY')}
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Müşteri, çek no, banka ile ara..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CheckStatus | 'Tümü')}
          className="input-field w-full md:w-48"
        >
          <option value="Tümü">Tüm Durumlar</option>
          <option value="Portföyde">💼 Portföyde</option>
          <option value="Bankaya Verildi">🏦 Bankada</option>
          <option value="Tahsil Edildi">✅ Tahsil Edildi</option>
          <option value="Ciro Edildi">🔄 Ciro Edildi</option>
          <option value="Karşılıksız">❌ Karşılıksız</option>
          <option value="İade Edildi">↩️ İade Edildi</option>
        </select>
      </div>

      {/* Çek Listesi */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Çek/Senet No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Vade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Banka
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {checkPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-0 py-0">
                  <EmptyState
                    icon="payments"
                    title="Çek/Senet Bulunamadı"
                    description={searchQuery || statusFilter !== 'Tümü' ? 'Filtreye uygun çek/senet bulunamadı.' : 'Henüz çek veya senet ödemesi yok.'}
                  />
                </td>
              </tr>
            ) : (
              checkPayments.map((payment) => {
                const checkStatus = payment.checkTracking?.status || 'Portföyde';

                return (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.checkNumber || '-'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.checkBank || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCheckStatusColor(checkStatus)}`}>
                        {getCheckStatusIcon(checkStatus)} {checkStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsDropdown actions={getCheckActions(payment)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {checkPayments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <EmptyState
              icon="payments"
              title="Çek/Senet Bulunamadı"
              description={searchQuery || statusFilter !== 'Tümü' ? 'Filtreye uygun çek/senet bulunamadı.' : 'Henüz çek veya senet ödemesi yok.'}
            />
          </div>
        ) : (
          checkPayments.map((payment) => {
            const checkStatus = payment.checkTracking?.status || 'Portföyde';

            return (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                onClick={() => setSelectedCheck(payment)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {payment.customerName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Çek: {payment.checkNumber || '-'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCheckStatusColor(checkStatus)}`}>
                    {getCheckStatusIcon(checkStatus)} {checkStatus}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Tutar:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Vade:</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(payment.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Banka:</span>
                    <span className="text-gray-900 dark:text-gray-100">{payment.checkBank || '-'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                  <ActionsDropdown actions={getCheckActions(payment)} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Check Detail Modal - Basitleştirilmiş */}
      {selectedCheck && (
        <Modal
          show={!!selectedCheck}
          onClose={() => setSelectedCheck(null)}
          title={`Çek Detay - ${selectedCheck.checkNumber || 'N/A'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Müşteri:</span>
                <span className="text-sm font-semibold">{selectedCheck.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tutar:</span>
                <span className="text-sm font-semibold">{formatCurrency(selectedCheck.amount, selectedCheck.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vade:</span>
                <span className="text-sm font-semibold">{formatDate(selectedCheck.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Banka:</span>
                <span className="text-sm font-semibold">{selectedCheck.checkBank || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Durum:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCheckStatusColor(selectedCheck.checkTracking?.status || 'Portföyde')}`}>
                  {getCheckStatusIcon(selectedCheck.checkTracking?.status || 'Portföyde')} {selectedCheck.checkTracking?.status || 'Portföyde'}
                </span>
              </div>
            </div>

            {selectedCheck.notes && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notlar:</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                  {selectedCheck.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CheckPortfolio;
