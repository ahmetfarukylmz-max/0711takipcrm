import React, { useMemo, useState, memo } from 'react';
import { formatCurrency } from '../../utils/formatters';
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
}

const Balances = memo<BalancesProps>(({ customers, orders, payments, onCustomerClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BalanceStatus>('all');
  const [sortField, setSortField] = useState<SortField>('balance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Calculate balances for all customers
  const customerBalances = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.isDeleted);

    return activeCustomers.map(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDeleted);
      const customerPayments = payments.filter(p => p.customerId === customer.id && !p.isDeleted && p.status === 'Tahsil Edildi');

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
        color
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
  }, [customerBalances, searchTerm, statusFilter, sortField, sortDirection]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💼 Cari Hesaplar
        </h1>
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📊 Durum Filtresi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BalanceStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="alacak">💰 Alacak Var</option>
              <option value="borc">⚠️ Borç Var</option>
              <option value="dengede">⚖️ Hesap Dengede</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{filteredAndSortedBalances.length}</strong> müşteri gösteriliyor
            </div>
          </div>
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
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedBalances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
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
                    onClick={() => onCustomerClick?.(cb.customer)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {cb.customer.name}
                        </div>
                        {cb.customer.company && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {cb.customer.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {formatCurrency(cb.totalOrders, 'TRY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {formatCurrency(cb.totalPayments, 'TRY')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${cb.color}`}>
                      {cb.balance >= 0 ? '+' : ''}{formatCurrency(cb.balance, 'TRY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cb.status === 'alacak' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        cb.status === 'borc' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {cb.icon} {cb.statusText}
                      </span>
                    </td>
                  </tr>
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
