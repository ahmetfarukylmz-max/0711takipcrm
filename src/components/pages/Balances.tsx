import React, { useMemo, useState, memo, useRef } from 'react';
import toast from 'react-hot-toast';
import { FixedSizeList } from 'react-window';
import Modal from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelExport';
import { generatePDFExtract } from '../../utils/pdfExtract';
import { DownloadIcon, PrinterIcon } from '../icons';
import { useDebounce } from '../../hooks/useDebounce';
import type { Customer, Order, Payment } from '../../types';
import { logger } from '../../utils/logger';

interface BalancesProps {
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  onCustomerClick?: (customer: Customer) => void;
}

type BalanceStatus = 'all' | 'alacak' | 'borc' | 'dengede';
type SortField = 'name' | 'balance' | 'orders' | 'payments';
type SortDirection = 'asc' | 'desc';
type DetailTab = 'orders' | 'payments' | 'duedates';

interface CustomerBalance {
  customer: Customer;
  totalOrders: number;
  totalPayments: number;
  balance: number;
  status: 'alacak' | 'borc' | 'dengede';
  statusText: string;
  icon: string;
  color: string;
  orderDetails: Array<{ id: string; date: string; amount: number; currency: string; orderNumber?: string; status?: string }>;
  paymentDetails: Array<{ id: string; date: string; amount: number; currency: string; method: string; status: string }>;
  dueDateInfo: {
    overduePayments: Payment[];
    upcomingPayments: Payment[];
    totalOverdueAmount: number;
    totalUpcomingAmount: number;
  };
  riskAnalysis: {
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    riskLabel: string;
    riskColor: string;
    factors: {
      overdueCount: number;
      averageDelayDays: number;
      overdueRatio: number; // % of total debt
      balanceRatio: number; // debt / total orders
    };
  };
}

const Balances = memo<BalancesProps>(({ customers, orders, payments, onCustomerClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search for performance
  const [statusFilter, setStatusFilter] = useState<BalanceStatus>('all');
  const [cityFilter, setCityFilter] = useState('Tümü');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [sortField, setSortField] = useState<SortField>('balance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState<CustomerBalance | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('orders');
  const [alertFilter, setAlertFilter] = useState<'all' | 'overdue' | 'highRisk' | 'upcoming' | 'mediumRisk'>('all');
  const tableRef = useRef<FixedSizeList>(null);

  // Calculate balances for all customers
  const customerBalances = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.isDeleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    return activeCustomers.map(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
      // Include all payments except cancelled ones (Bekliyor status payments like checks are counted)
      const customerPayments = payments.filter(p => p.customerId === customer.id && !p.isDeleted && p.status !== 'İptal');
      const customerPendingPayments = payments.filter(p => p.customerId === customer.id && !p.isDeleted && p.status !== 'Tahsil Edildi' && p.status !== 'İptal');

      const orderDetails = customerOrders.map(o => ({
        id: o.id,
        date: o.order_date,
        amount: o.total_amount || 0,
        currency: o.currency || 'TRY',
        orderNumber: o.orderNumber,
        status: o.status
      }));

      const paymentDetails = customerPayments.map(p => ({
        id: p.id,
        date: p.paidDate || p.dueDate,
        amount: p.amount || 0,
        currency: p.currency || 'TRY',
        method: p.paymentMethod || 'Belirtilmemiş',
        status: p.status
      }));

      // Calculate due date info
      const overduePayments = customerPendingPayments.filter(p => {
        if (!p.dueDate) return false;
        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      const upcomingPayments = customerPendingPayments.filter(p => {
        if (!p.dueDate) return false;
        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= sevenDaysLater;
      });

      const totalOverdueAmount = overduePayments.reduce((sum, p) => {
        const amount = p.amount || 0;
        const inTRY = p.currency === 'USD' ? amount * 35 :
                     p.currency === 'EUR' ? amount * 38 :
                     amount;
        return sum + inTRY;
      }, 0);

      const totalUpcomingAmount = upcomingPayments.reduce((sum, p) => {
        const amount = p.amount || 0;
        const inTRY = p.currency === 'USD' ? amount * 35 :
                     p.currency === 'EUR' ? amount * 38 :
                     amount;
        return sum + inTRY;
      }, 0);

      const totalOrders = customerOrders.reduce((sum, order) => {
        const amount = order.total_amount || 0;
        const inTRY = order.currency === 'USD' ? amount * 35 :
                     order.currency === 'EUR' ? amount * 38 :
                     amount;
        return sum + inTRY;
      }, 0);

      const totalPayments = customerPayments.reduce((sum, payment) => {
        const amount = payment.amount || 0;
        const inTRY = payment.currency === 'USD' ? amount * 35 :
                     payment.currency === 'EUR' ? amount * 38 :
                     amount;
        return sum + inTRY;
      }, 0);

      const balanceAmount = totalPayments - totalOrders;

      let status: 'alacak' | 'borc' | 'dengede';
      let statusText: string;
      let icon: string;
      let color: string;

      if (Math.abs(balanceAmount) < 100) {
        status = 'dengede';
        statusText = 'Hesap Dengede';
        color = 'text-gray-600 dark:text-gray-400';
        icon = '⚖️';
      } else if (balanceAmount > 0) {
        status = 'alacak';
        statusText = 'Alacak Var';
        color = 'text-green-600 dark:text-green-400';
        icon = '💰';
      } else {
        status = 'borc';
        statusText = 'Borç Var';
        color = 'text-red-600 dark:text-red-400';
        icon = '⚠️';
      }

      // Calculate risk analysis
      const overdueCount = overduePayments.length;
      const averageDelayDays = overdueCount > 0
        ? overduePayments.reduce((sum, p) => {
            const dueDate = new Date(p.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const delayDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + delayDays;
          }, 0) / overdueCount
        : 0;

      const overdueRatio = totalOrders > 0 ? (totalOverdueAmount / totalOrders) * 100 : 0;
      const balanceRatio = totalOrders > 0 ? (Math.abs(balanceAmount) / totalOrders) * 100 : 0;

      // Calculate risk score (0-100)
      let riskScore = 0;

      // Factor 1: Overdue count (max 30 points)
      riskScore += Math.min(overdueCount * 10, 30);

      // Factor 2: Average delay days (max 30 points)
      riskScore += Math.min(averageDelayDays * 2, 30);

      // Factor 3: Overdue ratio (max 25 points)
      riskScore += Math.min(overdueRatio * 0.25, 25);

      // Factor 4: Balance ratio - only if in debt (max 15 points)
      if (balanceAmount < 0) {
        riskScore += Math.min(balanceRatio * 0.15, 15);
      }

      riskScore = Math.min(Math.round(riskScore), 100);

      let riskLevel: 'low' | 'medium' | 'high';
      let riskLabel: string;
      let riskColor: string;

      if (riskScore <= 30) {
        riskLevel = 'low';
        riskLabel = 'Düşük Risk';
        riskColor = 'text-green-600 dark:text-green-400';
      } else if (riskScore <= 60) {
        riskLevel = 'medium';
        riskLabel = 'Orta Risk';
        riskColor = 'text-yellow-600 dark:text-yellow-400';
      } else {
        riskLevel = 'high';
        riskLabel = 'Yüksek Risk';
        riskColor = 'text-red-600 dark:text-red-400';
      }

      return {
        customer,
        totalOrders,
        totalPayments,
        balance: balanceAmount,
        status,
        statusText,
        icon,
        color,
        orderDetails,
        paymentDetails,
        dueDateInfo: {
          overduePayments,
          upcomingPayments,
          totalOverdueAmount,
          totalUpcomingAmount
        },
        riskAnalysis: {
          riskScore,
          riskLevel,
          riskLabel,
          riskColor,
          factors: {
            overdueCount,
            averageDelayDays: Math.round(averageDelayDays * 10) / 10, // 1 decimal
            overdueRatio: Math.round(overdueRatio * 10) / 10,
            balanceRatio: Math.round(balanceRatio * 10) / 10
          }
        }
      };
    });
  }, [customers, orders, payments]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalAlacak = customerBalances
      .filter(cb => cb.status === 'alacak')
      .reduce((sum, cb) => sum + cb.balance, 0);

    const totalBorc = customerBalances
      .filter(cb => cb.status === 'borc')
      .reduce((sum, cb) => sum + Math.abs(cb.balance), 0);

    const netBalance = customerBalances.reduce((sum, cb) => sum + cb.balance, 0);

    const dengedeCount = customerBalances.filter(cb => cb.status === 'dengede').length;

    // Calculate total overdue and upcoming
    const totalOverdue = customerBalances.reduce((sum, cb) => sum + cb.dueDateInfo.totalOverdueAmount, 0);
    const totalUpcoming = customerBalances.reduce((sum, cb) => sum + cb.dueDateInfo.totalUpcomingAmount, 0);
    const overdueCount = customerBalances.filter(cb => cb.dueDateInfo.overduePayments.length > 0).length;
    const upcomingCount = customerBalances.filter(cb => cb.dueDateInfo.upcomingPayments.length > 0).length;

    // Calculate risk statistics
    const highRiskCount = customerBalances.filter(cb => cb.riskAnalysis.riskLevel === 'high').length;
    const mediumRiskCount = customerBalances.filter(cb => cb.riskAnalysis.riskLevel === 'medium').length;
    const lowRiskCount = customerBalances.filter(cb => cb.riskAnalysis.riskLevel === 'low').length;

    return {
      totalAlacak,
      totalBorc,
      netBalance,
      dengedeCount,
      totalOverdue,
      totalUpcoming,
      overdueCount,
      upcomingCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount
    };
  }, [customerBalances]);

  // Get unique cities for filter
  const cities = useMemo(() => {
    const uniqueCities = new Set(customers.filter(c => c.city).map(c => c.city));
    return ['Tümü', ...Array.from(uniqueCities).sort()];
  }, [customers]);

  // Filter and sort (using debounced search for performance)
  const filteredAndSortedBalances = useMemo(() => {
    let filtered = customerBalances;

    // Apply alert filter (highest priority)
    if (alertFilter !== 'all') {
      switch (alertFilter) {
        case 'overdue':
          filtered = filtered.filter(cb => cb.dueDateInfo.overduePayments.length > 0);
          break;
        case 'highRisk':
          filtered = filtered.filter(cb => cb.riskAnalysis.riskLevel === 'high');
          break;
        case 'upcoming':
          filtered = filtered.filter(cb => cb.dueDateInfo.upcomingPayments.length > 0);
          break;
        case 'mediumRisk':
          filtered = filtered.filter(cb => cb.riskAnalysis.riskLevel === 'medium');
          break;
      }
    }

    // Apply search filter (debounced)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(cb =>
        cb.customer.name.toLowerCase().includes(term) ||
        cb.customer.company?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cb => cb.status === statusFilter);
    }

    // Apply city filter
    if (cityFilter !== 'Tümü') {
      filtered = filtered.filter(cb => cb.customer.city === cityFilter);
    }

    // Apply balance range filter
    if (minBalance) {
      const min = parseFloat(minBalance);
      if (!isNaN(min)) {
        filtered = filtered.filter(cb => cb.balance >= min);
      }
    }
    if (maxBalance) {
      const max = parseFloat(maxBalance);
      if (!isNaN(max)) {
        filtered = filtered.filter(cb => cb.balance <= max);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'name':
          aVal = a.customer.name.toLowerCase();
          bVal = b.customer.name.toLowerCase();
          break;
        case 'balance':
          aVal = a.balance;
          bVal = b.balance;
          break;
        case 'orders':
          aVal = a.totalOrders;
          bVal = b.totalOrders;
          break;
        case 'payments':
          aVal = a.totalPayments;
          bVal = b.totalPayments;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [customerBalances, debouncedSearchTerm, statusFilter, cityFilter, minBalance, maxBalance, sortField, sortDirection, alertFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleRowClick = (customerBalance: CustomerBalance) => {
    setSelectedCustomerBalance(customerBalance);
    setDetailTab('orders');
  };

  const handleExportExcel = () => {
    const exportData = filteredAndSortedBalances.map(cb => ({
      'Müşteri Adı': cb.customer.name,
      'Şirket': cb.customer.company || '',
      'Şehir': cb.customer.city || '',
      'Telefon': cb.customer.phone || '',
      'Toplam Sipariş': cb.totalOrders,
      'Toplam Ödeme': cb.totalPayments,
      'Bakiye': cb.balance,
      'Durum': cb.statusText,
      'Sipariş Sayısı': cb.orderDetails.length,
      'Ödeme Sayısı': cb.paymentDetails.length
    }));

    exportToExcel(
      exportData,
      `cari-hesaplar-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Cari Hesaplar'
    );
    toast.success('Excel dosyası indirildi!');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Yazdırma penceresi açıldı');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCityFilter('Tümü');
    setMinBalance('');
    setMaxBalance('');
    setAlertFilter('all');
    toast.success('Filtreler temizlendi');
  };

  const handleAlertCardClick = (alertType: 'overdue' | 'highRisk' | 'upcoming' | 'mediumRisk') => {
    // Clear other filters first
    setSearchTerm('');
    setStatusFilter('all');
    setCityFilter('Tümü');
    setMinBalance('');
    setMaxBalance('');

    // Set the alert filter
    setAlertFilter(alertType);

    // Show toast notification
    switch (alertType) {
      case 'overdue':
        toast.success('Vadesi geçmiş ödemeli müşteriler gösteriliyor');
        break;
      case 'highRisk':
        toast.success('Yüksek riskli müşteriler gösteriliyor');
        break;
      case 'upcoming':
        toast.success('Yaklaşan vadeli müşteriler gösteriliyor');
        break;
      case 'mediumRisk':
        toast.success('Orta riskli müşteriler gösteriliyor');
        break;
    }
  };

  const handlePrintExtract = async () => {
    if (!selectedCustomerBalance) return;

    try {
      toast.loading('PDF oluşturuluyor...', { id: 'pdf-generate' });

      const filename = await generatePDFExtract(selectedCustomerBalance);

      toast.success(`PDF indirildi: ${filename}`, { id: 'pdf-generate' });
    } catch (error) {
      logger.error('PDF generation error:', error);
      toast.error('PDF oluşturulurken hata oluştu', { id: 'pdf-generate' });
    }
  };

  const handleExportExtract = () => {
    if (!selectedCustomerBalance) return;

    const cb = selectedCustomerBalance;
    const exportData = [
      {
        'Müşteri': cb.customer.name,
        'Şirket': cb.customer.company || '',
        'Telefon': cb.customer.phone || '',
        'Şehir': cb.customer.city || '',
        '': '',
        'Toplam Sipariş': cb.totalOrders,
        'Toplam Ödeme': cb.totalPayments,
        'Bakiye': cb.balance,
        'Durum': cb.statusText
      },
      {},
      { 'Sipariş Detayları': '' },
      ...cb.orderDetails.map(o => ({
        'Tarih': formatDate(o.date),
        'Sipariş No': o.orderNumber || '-',
        'Tutar': formatCurrency(o.amount, o.currency),
        'Durum': o.status || '-'
      })),
      {},
      { 'Ödeme Detayları': '' },
      ...cb.paymentDetails.map(p => ({
        'Tarih': formatDate(p.date),
        'Tutar': formatCurrency(p.amount, p.currency),
        'Yöntem': p.method,
        'Durum': p.status
      }))
    ];

    exportToExcel(
      exportData,
      `cari-ekstre-${cb.customer.name}-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Cari Ekstre'
    );
    toast.success('Ekstre Excel dosyası indirildi!');
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💼 Cari Hesaplar
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <PrinterIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Yazdır</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Excel İndir</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Alacak */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-green-300 dark:border-green-600">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Alacak</div>
            <span className="text-xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.totalAlacak, 'TRY')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Müşterilerden alınacak
          </div>
        </div>

        {/* Toplam Borç */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-red-300 dark:border-red-600">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Borç</div>
            <span className="text-xl">⚠️</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalBorc, 'TRY')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Müşterilere ödenecek
          </div>
        </div>

        {/* Net Bakiye */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-600">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Net Bakiye</div>
            <span className="text-xl">📊</span>
          </div>
          <div className={`text-2xl font-bold ${
            summary.netBalance > 0 ? 'text-green-600 dark:text-green-400' :
            summary.netBalance < 0 ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {summary.netBalance >= 0 ? '+' : ''}{formatCurrency(summary.netBalance, 'TRY')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Toplam net durum
          </div>
        </div>

        {/* Dengede Müşteriler */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dengede</div>
            <span className="text-xl">⚖️</span>
          </div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {summary.dengedeCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Dengede müşteri sayısı
          </div>
        </div>
      </div>

      {/* Critical Alerts - Horizontal Banner Style */}
      {(summary.totalOverdue > 0 || summary.totalUpcoming > 0 || summary.highRiskCount > 0 || summary.mediumRiskCount > 0) && (
        <div className="space-y-3">
          {/* Overdue Payments Alert */}
          {summary.totalOverdue > 0 && (
            <button
              onClick={() => handleAlertCardClick('overdue')}
              className="w-full flex items-center justify-between p-4 border-l-4 border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div className="text-left">
                  <p className="font-bold text-sm">Vadesi Geçmiş Ödemeler</p>
                  <p className="text-xs opacity-80">{summary.overdueCount} müşteri • {formatCurrency(summary.totalOverdue, 'TRY')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 text-red-600 dark:text-red-400">
                  Görüntüle
                </span>
              </div>
            </button>
          )}

          {/* High Risk Alert */}
          {summary.highRiskCount > 0 && (
            <button
              onClick={() => handleAlertCardClick('highRisk')}
              className="w-full flex items-center justify-between p-4 border-l-4 border-orange-600 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔴</span>
                <div className="text-left">
                  <p className="font-bold text-sm">Yüksek Riskli Müşteriler</p>
                  <p className="text-xs opacity-80">{summary.highRiskCount} müşteri • Dikkatli takip gerekli</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400">
                  İncele
                </span>
              </div>
            </button>
          )}

          {/* Upcoming Payments Alert */}
          {summary.totalUpcoming > 0 && (
            <button
              onClick={() => handleAlertCardClick('upcoming')}
              className="w-full flex items-center justify-between p-4 border-l-4 border-yellow-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div className="text-left">
                  <p className="font-bold text-sm">Yaklaşan Vadeler (7 gün)</p>
                  <p className="text-xs opacity-80">{summary.upcomingCount} müşteri • {formatCurrency(summary.totalUpcoming, 'TRY')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400">
                  Hatırlat
                </span>
              </div>
            </button>
          )}

          {/* Medium Risk Alert */}
          {summary.mediumRiskCount > 0 && (
            <button
              onClick={() => handleAlertCardClick('mediumRisk')}
              className="w-full flex items-center justify-between p-4 border-l-4 border-amber-500 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🟡</span>
                <div className="text-left">
                  <p className="font-bold text-sm">Orta Riskli Müşteriler</p>
                  <p className="text-xs opacity-80">{summary.mediumRiskCount} müşteri • Düzenli kontrol önerilir</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400">
                  İncele
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔍 Müşteri Ara
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim veya şirket..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📊 Durum
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BalanceStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tümü</option>
              <option value="alacak">💰 Alacak Var</option>
              <option value="borc">⚠️ Borç Var</option>
              <option value="dengede">⚖️ Hesap Dengede</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🏙️ Şehir
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Min Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              💵 Min. Bakiye
            </label>
            <input
              type="number"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Max Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              💸 Max. Bakiye
            </label>
            <input
              type="number"
              value={maxBalance}
              onChange={(e) => setMaxBalance(e.target.value)}
              placeholder="∞"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{filteredAndSortedBalances.length}</strong> müşteri gösteriliyor
            {alertFilter !== 'all' && (
              <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                {alertFilter === 'overdue' ? '🚨 Vadesi Geçmiş' :
                 alertFilter === 'highRisk' ? '🔴 Yüksek Risk' :
                 alertFilter === 'upcoming' ? '⚡ Yaklaşan Vadeler' :
                 '🟡 Orta Risk'} Filtresi Aktif
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            🔄 Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Müşteri {getSortIcon('name')}
                </th>
                <th
                  onClick={() => handleSort('orders')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Toplam Sipariş {getSortIcon('orders')}
                </th>
                <th
                  onClick={() => handleSort('payments')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Toplam Ödeme {getSortIcon('payments')}
                </th>
                <th
                  onClick={() => handleSort('balance')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Bakiye {getSortIcon('balance')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedBalances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-lg">Müşteri bulunamadı</p>
                      <p className="text-sm mt-1">Filtreleri değiştirin veya yeni müşteri ekleyin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedBalances.map((cb) => (
                  <tr
                    key={cb.customer.id}
                    onClick={() => handleRowClick(cb)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    {/* Customer Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cb.customer.name}
                          </div>
                          {/* Risk Indicator */}
                          {cb.riskAnalysis.riskLevel === 'high' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold" title={`Yüksek Risk (${cb.riskAnalysis.riskScore}/100)`}>
                              🔴
                            </span>
                          )}
                          {cb.riskAnalysis.riskLevel === 'medium' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold" title={`Orta Risk (${cb.riskAnalysis.riskScore}/100)`}>
                              🟡
                            </span>
                          )}
                          {/* Due Date Indicators */}
                          {cb.dueDateInfo.overduePayments.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold" title="Vadesi geçmiş ödeme var">
                              🚨
                            </span>
                          )}
                          {cb.dueDateInfo.upcomingPayments.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold" title="7 gün içinde vade var">
                              ⚡
                            </span>
                          )}
                        </div>
                        {cb.customer.company && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {cb.customer.company}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(cb.totalOrders, 'TRY')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cb.orderDetails.length} sipariş
                      </div>
                    </td>

                    {/* Total Payments */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(cb.totalPayments, 'TRY')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cb.paymentDetails.length} ödeme
                      </div>
                    </td>

                    {/* Balance */}
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${cb.color}`}>
                      {cb.balance >= 0 ? '+' : ''}{formatCurrency(cb.balance, 'TRY')}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cb.status === 'alacak' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        cb.status === 'borc' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {cb.icon} {cb.statusText}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(cb)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Ekstre
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        show={selectedCustomerBalance !== null}
        onClose={() => setSelectedCustomerBalance(null)}
        title="Cari Hesap Ekstresi"
        maxWidth="max-w-4xl"
      >
        {selectedCustomerBalance && (
          <div className="space-y-4">
            {/* Customer Header */}
            <div className={`p-4 rounded-lg border-2 ${selectedCustomerBalance.status === 'alacak' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600' : selectedCustomerBalance.status === 'borc' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedCustomerBalance.customer.name}
                  </h3>
                  {selectedCustomerBalance.customer.company && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCustomerBalance.customer.company}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {selectedCustomerBalance.customer.city && `📍 ${selectedCustomerBalance.customer.city} • `}
                    {selectedCustomerBalance.customer.phone && `📞 ${selectedCustomerBalance.customer.phone}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bakiye</div>
                  <div className={`text-3xl font-bold ${selectedCustomerBalance.color}`}>
                    {selectedCustomerBalance.balance >= 0 ? '+' : ''}{formatCurrency(selectedCustomerBalance.balance, 'TRY')}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    selectedCustomerBalance.status === 'alacak' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    selectedCustomerBalance.status === 'borc' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {selectedCustomerBalance.icon} {selectedCustomerBalance.statusText}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePrintExtract}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  PDF İndir
                </button>
                <button
                  onClick={handleExportExtract}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Excel İndir
                </button>
              </div>
            </div>

            {/* Risk Analysis Section */}
            {selectedCustomerBalance.riskAnalysis.riskLevel !== 'low' && (
              <div className={`p-4 rounded-lg border-2 ${
                selectedCustomerBalance.riskAnalysis.riskLevel === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    📊 Risk Analizi
                    <span className={`text-sm px-2 py-1 rounded ${selectedCustomerBalance.riskAnalysis.riskColor}`}>
                      {selectedCustomerBalance.riskAnalysis.riskLabel}
                    </span>
                  </h3>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Risk Skoru</div>
                    <div className={`text-3xl font-bold ${selectedCustomerBalance.riskAnalysis.riskColor}`}>
                      {selectedCustomerBalance.riskAnalysis.riskScore}/100
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Gecikmiş Ödeme</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedCustomerBalance.riskAnalysis.factors.overdueCount}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Ort. Gecikme</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedCustomerBalance.riskAnalysis.factors.averageDelayDays} gün
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Gecikme Oranı</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      %{selectedCustomerBalance.riskAnalysis.factors.overdueRatio}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Bakiye Oranı</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      %{selectedCustomerBalance.riskAnalysis.factors.balanceRatio}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Toplam Sipariş</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(selectedCustomerBalance.totalOrders, 'TRY')}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {selectedCustomerBalance.orderDetails.length} adet
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">Toplam Ödeme</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(selectedCustomerBalance.totalPayments, 'TRY')}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {selectedCustomerBalance.paymentDetails.length} adet
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setDetailTab('orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'orders'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  📦 Siparişler ({selectedCustomerBalance.orderDetails.length})
                </button>
                <button
                  onClick={() => setDetailTab('payments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'payments'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  💰 Ödemeler ({selectedCustomerBalance.paymentDetails.length})
                </button>
                <button
                  onClick={() => setDetailTab('duedates')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'duedates'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  ⏰ Vadeler ({selectedCustomerBalance.dueDateInfo.overduePayments.length + selectedCustomerBalance.dueDateInfo.upcomingPayments.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="max-h-96 overflow-y-auto">
              {detailTab === 'orders' ? (
                <div className="space-y-2">
                  {selectedCustomerBalance.orderDetails.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-4xl mb-2">📦</p>
                      <p>Henüz sipariş yok</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Tarih</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Sipariş No</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Tutar</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedCustomerBalance.orderDetails.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                              {formatDate(order.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {order.orderNumber || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                              {formatCurrency(order.amount, order.currency)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {order.status || 'Bekliyor'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : detailTab === 'payments' ? (
                <div className="space-y-2">
                  {selectedCustomerBalance.paymentDetails.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-4xl mb-2">💰</p>
                      <p>Henüz ödeme yok</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Tarih</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Tutar</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Yöntem</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedCustomerBalance.paymentDetails.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                              {formatDate(payment.date)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400 text-right">
                              {formatCurrency(payment.amount, payment.currency)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {payment.method}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                /* Due Dates Tab */
                <div className="space-y-4">
                  {selectedCustomerBalance.dueDateInfo.overduePayments.length === 0 && selectedCustomerBalance.dueDateInfo.upcomingPayments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-4xl mb-2">⏰</p>
                      <p>Vadeli ödeme bulunamadı</p>
                    </div>
                  ) : (
                    <>
                      {/* Overdue Payments Section */}
                      {selectedCustomerBalance.dueDateInfo.overduePayments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-600 dark:text-red-400 font-semibold">🚨 Vadesi Geçmiş Ödemeler</span>
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {selectedCustomerBalance.dueDateInfo.overduePayments.length} adet
                            </span>
                          </div>
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-red-50 dark:bg-red-900/20">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-red-700 dark:text-red-400">Vade Tarihi</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-red-700 dark:text-red-400">Tutar</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-red-700 dark:text-red-400">Ödeme Yöntemi</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-red-700 dark:text-red-400">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {selectedCustomerBalance.dueDateInfo.overduePayments.map((payment) => {
                                const dueDate = new Date(payment.dueDate);
                                const today = new Date();
                                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                                return (
                                  <tr key={payment.id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                      {formatDate(payment.dueDate)}
                                      <div className="text-xs text-red-600 dark:text-red-400">
                                        {daysOverdue} gün gecikti
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 text-right">
                                      {formatCurrency(payment.amount, payment.currency || 'TRY')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                      {payment.paymentMethod}
                                      {payment.checkNumber && (
                                        <div className="text-xs text-gray-500">
                                          No: {payment.checkNumber}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        {payment.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Upcoming Payments Section */}
                      {selectedCustomerBalance.dueDateInfo.upcomingPayments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">⚡ 7 Gün İçinde Vadesi Dolacak</span>
                            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              {selectedCustomerBalance.dueDateInfo.upcomingPayments.length} adet
                            </span>
                          </div>
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-yellow-50 dark:bg-yellow-900/20">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 dark:text-yellow-400">Vade Tarihi</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-yellow-700 dark:text-yellow-400">Tutar</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 dark:text-yellow-400">Ödeme Yöntemi</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-yellow-700 dark:text-yellow-400">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {selectedCustomerBalance.dueDateInfo.upcomingPayments.map((payment) => {
                                const dueDate = new Date(payment.dueDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                return (
                                  <tr key={payment.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                      {formatDate(payment.dueDate)}
                                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                        {daysUntilDue === 0 ? 'Bugün' : `${daysUntilDue} gün sonra`}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-yellow-600 dark:text-yellow-400 text-right">
                                      {formatCurrency(payment.amount, payment.currency || 'TRY')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                      {payment.paymentMethod}
                                      {payment.checkNumber && (
                                        <div className="text-xs text-gray-500">
                                          No: {payment.checkNumber}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                        {payment.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});

Balances.displayName = 'Balances';

export default Balances;
