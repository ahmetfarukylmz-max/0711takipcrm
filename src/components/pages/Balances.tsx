import React, { useMemo, useState, memo } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelExport';
import { WhatsAppIcon, DownloadIcon, PrinterIcon } from '../icons';
import type { Customer, Order, Payment } from '../../types';

interface BalancesProps {
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  onCustomerClick?: (customer: Customer) => void;
}

type BalanceStatus = 'all' | 'alacak' | 'borc' | 'dengede';
type SortField = 'name' | 'balance' | 'orders' | 'payments';
type SortDirection = 'asc' | 'desc';

interface CustomerBalance {
  customer: Customer;
  totalOrders: number;
  totalPayments: number;
  balance: number;
  status: 'alacak' | 'borc' | 'dengede';
  statusText: string;
  icon: string;
  color: string;
  orderDetails: Array<{ id: string; date: string; amount: number; currency: string }>;
  paymentDetails: Array<{ id: string; date: string; amount: number; currency: string; method: string }>;
}

const Balances = memo<BalancesProps>(({ customers, orders, payments, onCustomerClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BalanceStatus>('all');
  const [cityFilter, setCityFilter] = useState('Tümü');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [sortField, setSortField] = useState<SortField>('balance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Calculate balances for all customers
  const customerBalances = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.isDeleted);

    return activeCustomers.map(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
      const customerPayments = payments.filter(p => p.customerId === customer.id && !p.isDeleted && p.status === 'Tahsil Edildi');

      const orderDetails = customerOrders.map(o => ({
        id: o.id,
        date: o.order_date,
        amount: o.total_amount || 0,
        currency: o.currency || 'TRY'
      }));

      const paymentDetails = customerPayments.map(p => ({
        id: p.id,
        date: p.paidDate || p.dueDate,
        amount: p.amount || 0,
        currency: p.currency || 'TRY',
        method: p.paymentMethod || 'Belirtilmemiş'
      }));

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
        paymentDetails
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

    return {
      totalAlacak,
      totalBorc,
      netBalance,
      dengedeCount
    };
  }, [customerBalances]);

  // Get unique cities for filter
  const cities = useMemo(() => {
    const uniqueCities = new Set(customers.filter(c => c.city).map(c => c.city));
    return ['Tümü', ...Array.from(uniqueCities).sort()];
  }, [customers]);

  // Filter and sort
  const filteredAndSortedBalances = useMemo(() => {
    let filtered = customerBalances;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
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
  }, [customerBalances, searchTerm, statusFilter, cityFilter, minBalance, maxBalance, sortField, sortDirection]);

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

  const toggleRowExpansion = (customerId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedRows(newExpanded);
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

  const handleWhatsAppReminder = (customer: Customer, balance: number) => {
    if (!customer.phone) {
      toast.error('Müşterinin telefon numarası kayıtlı değil');
      return;
    }

    const message = balance < 0
      ? `Merhaba ${customer.name}, ${formatCurrency(Math.abs(balance), 'TRY')} tutarında borcunuz bulunmaktadır. Ödemenizi beklemekteyiz.`
      : `Merhaba ${customer.name}, ${formatCurrency(balance, 'TRY')} tutarında alacağınız bulunmaktadır.`;

    const phoneNumber = formatPhoneNumberForWhatsApp(customer.phone);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp açılıyor...');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCityFilter('Tümü');
    setMinBalance('');
    setMaxBalance('');
    toast.success('Filtreler temizlendi');
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Detay
                </th>
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-lg">Müşteri bulunamadı</p>
                      <p className="text-sm mt-1">Filtreleri değiştirin veya yeni müşteri ekleyin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedBalances.map((cb) => (
                  <React.Fragment key={cb.customer.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* Expand Button */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRowExpansion(cb.customer.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          {expandedRows.has(cb.customer.id) ? '▼' : '▶'}
                        </button>
                      </td>

                      {/* Customer Name */}
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => onCustomerClick?.(cb.customer)}
                      >
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cb.customer.name}
                          </div>
                          {cb.customer.company && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {cb.customer.company}
                            </div>
                          )}
                          {cb.customer.city && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              📍 {cb.customer.city}
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {cb.customer.phone && (
                            <button
                              onClick={() => handleWhatsAppReminder(cb.customer, cb.balance)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="WhatsApp ile hatırlat"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onCustomerClick?.(cb.customer)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Detay
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedRows.has(cb.customer.id) && (
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Orders Detail */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                📦 Siparişler ({cb.orderDetails.length})
                              </h4>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {cb.orderDetails.length === 0 ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Henüz sipariş yok</p>
                                ) : (
                                  cb.orderDetails.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 p-2 rounded">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {formatDate(order.date)}
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(order.amount, order.currency)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Payments Detail */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                💰 Ödemeler ({cb.paymentDetails.length})
                              </h4>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {cb.paymentDetails.length === 0 ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Henüz ödeme yok</p>
                                ) : (
                                  cb.paymentDetails.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 p-2 rounded">
                                      <div className="flex flex-col">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {formatDate(payment.date)}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                          {payment.method}
                                        </span>
                                      </div>
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(payment.amount, payment.currency)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

Balances.displayName = 'Balances';

export default Balances;
