import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import PaymentForm from '../forms/PaymentForm';
import SearchBar from '../common/SearchBar';
import EmptyState from '../common/EmptyState';
import { PlusIcon, EditIcon, TrashIcon } from '../icons';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { Payment, Customer, Order } from '../../types';

interface PaymentsProps {
  payments: Payment[];
  customers: Customer[];
  orders: Order[];
  onSave: (payment: Partial<Payment>) => Promise<void> | void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const Payments: React.FC<PaymentsProps> = ({
  payments,
  customers,
  orders,
  onSave,
  onDelete,
  loading = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; payment: Payment | null }>({
    isOpen: false,
    payment: null
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);

  // Filtreleme ve arama
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch =
        payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.checkNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'Tümü' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  // Payment statistics
  const paymentStats = useMemo(() => {
    const todayDate = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(todayDate.getDate() + 7);

    // Upcoming payments (due within 7 days)
    const upcomingPayments = payments.filter(p => {
      if (p.status === 'Tahsil Edildi' || p.status === 'İptal') return false;
      const dueDate = new Date(p.dueDate);
      return dueDate >= todayDate && dueDate <= sevenDaysLater;
    });

    // Overdue payments
    const overduePayments = payments.filter(p => {
      if (p.status === 'Tahsil Edildi' || p.status === 'İptal') return false;
      const dueDate = new Date(p.dueDate);
      return dueDate < todayDate;
    });

    // This month's collection
    const thisMonthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    const thisMonthEnd = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);

    const thisMonthPayments = payments.filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate >= thisMonthStart && dueDate <= thisMonthEnd;
    });

    const collectedThisMonth = thisMonthPayments
      .filter(p => p.status === 'Tahsil Edildi')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingThisMonth = thisMonthPayments
      .filter(p => p.status === 'Bekliyor' || p.status === 'Gecikti')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalThisMonth = collectedThisMonth + pendingThisMonth;
    const collectionRate = totalThisMonth > 0 ? (collectedThisMonth / totalThisMonth) * 100 : 0;

    return {
      upcoming: upcomingPayments,
      upcomingTotal: upcomingPayments.reduce((sum, p) => sum + p.amount, 0),
      overdue: overduePayments,
      overdueTotal: overduePayments.reduce((sum, p) => sum + p.amount, 0),
      collectedThisMonth,
      pendingThisMonth,
      totalThisMonth,
      collectionRate
    };
  }, [payments]);

  // Durum renkleri
  const getStatusColor = (status: Payment['status'], dueDate: string) => {
    if (status === 'Tahsil Edildi') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (status === 'İptal') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    if (status === 'Gecikti') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

    // Bekliyor durumu için vade kontrolü
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'; // Gecikmiş
    if (daysUntilDue <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'; // Yaklaşan
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'; // Normal
  };

  const getStatusText = (payment: Payment) => {
    if (payment.status === 'Tahsil Edildi') return '✅ Tahsil Edildi';
    if (payment.status === 'İptal') return '❌ İptal';
    if (payment.status === 'Gecikti') return '⚠️ Gecikti';

    const today = new Date();
    const due = new Date(payment.dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return `⚠️ ${Math.abs(daysUntilDue)} gün gecikti`;
    if (daysUntilDue === 0) return '⏰ Bugün vade';
    if (daysUntilDue <= 7) return `⏰ ${daysUntilDue} gün kaldı`;
    return '📅 Bekliyor';
  };

  const handleOpenModal = (payment: Payment | null = null) => {
    setCurrentPayment(payment);
    setIsModalOpen(true);
  };

  const handleSave = async (paymentData: Partial<Payment>) => {
    try {
      await onSave(paymentData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Payment save error:', error);
      toast.error('Ödeme kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleDelete = (payment: Payment) => {
    setDeleteConfirm({ isOpen: true, payment });
  };

  const confirmDelete = () => {
    if (deleteConfirm.payment) {
      if ((deleteConfirm.payment as any).id === 'batch') {
        confirmBatchDelete();
      } else {
        onDelete(deleteConfirm.payment.id);
        setDeleteConfirm({ isOpen: false, payment: null });
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
    if (selectedItems.size === filteredPayments.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredPayments.map(p => p.id)));
    }
  };

  const handleBatchDelete = () => {
    setDeleteConfirm({
      isOpen: true,
      payment: { id: 'batch', count: selectedItems.size } as any
    });
  };

  const confirmBatchDelete = () => {
    selectedItems.forEach(id => onDelete(id));
    setSelectedItems(new Set());
    setDeleteConfirm({ isOpen: false, payment: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Ödemeler
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Toplam {filteredPayments.length} ödeme
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="btn-danger flex items-center gap-2 justify-center"
            >
              <TrashIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Seçili {selectedItems.size} Ödemeyi Sil</span>
              <span className="sm:hidden">Sil ({selectedItems.size})</span>
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2 justify-center"
          >
            <PlusIcon className="w-5 h-5" />
            Yeni Ödeme
          </button>
        </div>
      </div>

      {/* Payment Alerts - Compact banners like CriticalAlerts */}
      {(paymentStats.overdue.length > 0 || paymentStats.upcoming.length > 0) && (
        <div className="space-y-3 mb-6 animate-fadeIn">
          {/* Overdue Payments Banner */}
          {paymentStats.overdue.length > 0 && (
            <div className="flex items-center justify-between p-4 border-l-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="font-medium text-sm md:text-base">
                  {paymentStats.overdue.length} gecikmiş ödeme - Toplam {formatCurrency(paymentStats.overdueTotal, 'TRY')}
                </p>
              </div>
              <button
                onClick={() => setShowOverdueModal(true)}
                className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap ml-4"
              >
                Görüntüle
              </button>
            </div>
          )}

          {/* Upcoming Payments Banner */}
          {paymentStats.upcoming.length > 0 && (
            <div className="flex items-center justify-between p-4 border-l-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <p className="font-medium text-sm md:text-base">
                  {paymentStats.upcoming.length} ödeme 7 gün içinde vadesi dolacak - Toplam {formatCurrency(paymentStats.upcomingTotal, 'TRY')}
                </p>
              </div>
              <button
                onClick={() => setShowUpcomingModal(true)}
                className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap ml-4"
              >
                Görüntüle
              </button>
            </div>
          )}

          {/* Monthly Collection Info Banner */}
          {paymentStats.totalThisMonth > 0 && (
            <div className="flex items-center justify-between p-4 border-l-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <p className="font-medium text-sm md:text-base">
                  Bu ay tahsilat: {formatCurrency(paymentStats.collectedThisMonth, 'TRY')} / {formatCurrency(paymentStats.totalThisMonth, 'TRY')}
                  <span className="ml-2 text-xs md:text-sm">(%{Math.round(paymentStats.collectionRate)} tamamlandı)</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Müşteri, sipariş no, çek no ile ara..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="Tümü">Tüm Durumlar</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="Tahsil Edildi">Tahsil Edildi</option>
          <option value="Gecikti">Gecikti</option>
          <option value="İptal">İptal</option>
        </select>
      </div>

      {/* Payments Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={filteredPayments.length > 0 && selectedItems.size === filteredPayments.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sipariş
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ödeme Yöntemi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vade Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-0 py-0">
                  <EmptyState
                    icon={searchQuery || statusFilter !== 'Tümü' ? 'search' : 'payments'}
                    title={searchQuery || statusFilter !== 'Tümü' ? 'Ödeme Bulunamadı' : 'Henüz Ödeme Yok'}
                    description={searchQuery || statusFilter !== 'Tümü' ? 'Filtreye uygun ödeme bulunamadı.' : undefined}
                    action={!(searchQuery || statusFilter !== 'Tümü') ? { label: 'Yeni Ödeme Ekle', onClick: () => handleOpenModal(), icon: <PlusIcon /> } : undefined}
                  />
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(payment.id)}
                      onChange={() => handleSelectItem(payment.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleOpenModal(payment)}>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {payment.customerName || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleOpenModal(payment)}>
                    {payment.orderNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleOpenModal(payment)}>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleOpenModal(payment)}>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {payment.paymentMethod}
                    </div>
                    {payment.checkNumber && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.checkNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleOpenModal(payment)}>
                    {formatDate(payment.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleOpenModal(payment)}>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status, payment.dueDate)}`}>
                      {getStatusText(payment)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenModal(payment)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Düzenle"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(payment)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Sil"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payments List - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <EmptyState
              icon={searchQuery || statusFilter !== 'Tümü' ? 'search' : 'payments'}
              title={searchQuery || statusFilter !== 'Tümü' ? 'Ödeme Bulunamadı' : 'Henüz Ödeme Yok'}
              description={searchQuery || statusFilter !== 'Tümü' ? 'Filtreye uygun ödeme bulunamadı.' : undefined}
              action={!(searchQuery || statusFilter !== 'Tümü') ? { label: 'Yeni Ödeme Ekle', onClick: () => handleOpenModal(), icon: <PlusIcon /> } : undefined}
            />
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
              onClick={() => handleOpenModal(payment)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {payment.customerName}
                  </p>
                  {payment.orderNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sipariş: {payment.orderNumber}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status, payment.dueDate)}`}>
                  {getStatusText(payment)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tutar:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ödeme:</span>
                  <span className="text-gray-900 dark:text-gray-100">{payment.paymentMethod}</span>
                </div>
                {payment.checkNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Çek No:</span>
                    <span className="text-gray-900 dark:text-gray-100">{payment.checkNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Vade:</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatDate(payment.dueDate)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenModal(payment)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(payment)}
                  className="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100"
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Form Modal */}
      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentPayment ? 'Ödeme Düzenle' : 'Yeni Ödeme'}
      >
        <PaymentForm
          payment={currentPayment}
          customers={customers}
          orders={orders}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Overdue Payments Modal */}
      <Modal
        show={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        title="Gecikmiş Ödemeler"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <span className="font-semibold">{paymentStats.overdue.length} gecikmiş ödeme</span> - Toplam {formatCurrency(paymentStats.overdueTotal, 'TRY')}
            </p>
          </div>
          <div className="space-y-2">
            {paymentStats.overdue.map((payment) => {
              const today = new Date();
              const dueDate = new Date(payment.dueDate);
              const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowOverdueModal(false);
                    handleOpenModal(payment);
                  }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{payment.customerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vade: {formatDate(payment.dueDate)} • <span className="text-red-600 dark:text-red-400 font-medium">{daysOverdue} gün gecikmiş</span>
                    </p>
                    {payment.orderNumber && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sipariş: {payment.orderNumber}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount, payment.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{payment.paymentMethod}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Upcoming Payments Modal */}
      <Modal
        show={showUpcomingModal}
        onClose={() => setShowUpcomingModal(false)}
        title="Vadesi Yaklaşan Ödemeler (7 Gün İçinde)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">{paymentStats.upcoming.length} ödeme</span> 7 gün içinde vadesi dolacak - Toplam {formatCurrency(paymentStats.upcomingTotal, 'TRY')}
            </p>
          </div>
          <div className="space-y-2">
            {paymentStats.upcoming.map((payment) => {
              const today = new Date();
              const dueDate = new Date(payment.dueDate);
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowUpcomingModal(false);
                    handleOpenModal(payment);
                  }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{payment.customerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vade: {formatDate(payment.dueDate)} •
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium ml-1">
                        {daysUntilDue === 0 ? 'Bugün' : daysUntilDue === 1 ? 'Yarın' : `${daysUntilDue} gün kaldı`}
                      </span>
                    </p>
                    {payment.orderNumber && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sipariş: {payment.orderNumber}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount, payment.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{payment.paymentMethod}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, payment: null })}
        onConfirm={confirmDelete}
        title={(deleteConfirm.payment as any)?.id === 'batch' ? 'Toplu Silme' : 'Ödeme Kaydını Sil'}
        message={
          (deleteConfirm.payment as any)?.id === 'batch'
            ? `${(deleteConfirm.payment as any)?.count} ödeme kaydını silmek istediğinizden emin misiniz?`
            : `${deleteConfirm.payment?.customerName} müşterisine ait ${formatCurrency(deleteConfirm.payment?.amount || 0, deleteConfirm.payment?.currency)} tutarındaki ödeme kaydını silmek istediğinizden emin misiniz?`
        }
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
};

export default Payments;
