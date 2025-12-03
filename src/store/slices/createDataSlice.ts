import { StateCreator } from 'zustand';
import { StoreState, DataSlice, CollectionKey } from '../types';
import { Customer, Order, Quote, Payment, Shipment } from '../../types';

// Define types for Balances.tsx specific logic moved here
type BalanceStatus = 'alacak' | 'borc' | 'dengede';
type RiskLevel = 'low' | 'medium' | 'high';

interface CustomerBalance {
  customer: Customer;
  totalOrders: number;
  totalPayments: number;
  balance: number;
  status: BalanceStatus;
  statusText: string;
  icon: string;
  color: string;
  orderDetails: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    orderNumber?: string;
    status?: string;
  }>;
  paymentDetails: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
  }>;
  dueDateInfo: {
    overduePayments: Payment[];
    upcomingPayments: Payment[];
    totalOverdueAmount: number;
    totalUpcomingAmount: number;
  };
  riskAnalysis: {
    riskScore: number; // 0-100
    riskLevel: RiskLevel;
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

// Currency Conversion Rates (hardcoded for now, ideally fetched from an API)
const USD_TO_TRY_RATE = 35;
const EUR_TO_TRY_RATE = 38;

const convertToTRY = (amount: number, currency: string) => {
  if (currency === 'USD') return amount * USD_TO_TRY_RATE;
  if (currency === 'EUR') return amount * EUR_TO_TRY_RATE;
  return amount;
};

export const createDataSlice: StateCreator<StoreState, [], [], DataSlice> = (set, get) => ({
  // Initial State
  collections: {
    customers: [],
    products: [],
    orders: [],
    shipments: [],
    teklifler: [],
    gorusmeler: [],
    customTasks: [],
    payments: [],
    stock_movements: [],
    suppliers: [],
    purchaseOrders: [],
  },

  // ============================================================================
  // ACTIONS - Data Collections
  // ============================================================================

  setCollections: (collections) => set({ collections }),

  updateCollection: (collectionName, data) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: data,
      },
    })),

  addToCollection: (collectionName, item) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: [...state.collections[collectionName], item],
      },
    })),

  updateInCollection: (collectionName, itemId, updatedItem) =>
    set((state) => {
      const currentCollection = state.collections[collectionName] as any[];
      return {
        collections: {
          ...state.collections,
          [collectionName]: currentCollection.map((item) =>
            item.id === itemId ? { ...item, ...updatedItem } : item
          ),
        },
      };
    }),

  removeFromCollection: (collectionName, itemId) =>
    set((state) => {
      const currentCollection = state.collections[collectionName] as any[];
      return {
        collections: {
          ...state.collections,
          [collectionName]: currentCollection.filter((item) => item.id !== itemId),
        },
      };
    }),

  // Optimistic UI helpers
  addPendingItem: (collectionName, tempItem) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: [...state.collections[collectionName], { ...tempItem, _pending: true }],
      },
    })),

  removePendingItem: (collectionName, tempId) =>
    set((state) => {
      const currentCollection = state.collections[collectionName] as any[];
      return {
        collections: {
          ...state.collections,
          [collectionName]: currentCollection.filter((item) => item.id !== tempId),
        },
      };
    }),

  updatePendingItem: (collectionName, tempId, realItem) =>
    set((state) => {
      const currentCollection = state.collections[collectionName] as any[];
      return {
        collections: {
          ...state.collections,
          [collectionName]: currentCollection.map((item) =>
            item.id === tempId ? { ...realItem, _pending: false } : item
          ),
        },
      };
    }),

  // ============================================================================
  // SELECTORS - Get specific items
  // ============================================================================

  getCustomerById: (id) => {
    const state = get();
    return state.collections.customers.find((c) => c.id === id);
  },

  getProductById: (id) => {
    const state = get();
    return state.collections.products.find((p) => p.id === id);
  },

  getOrderById: (id) => {
    const state = get();
    return state.collections.orders.find((o) => o.id === id);
  },

  getQuoteById: (id) => {
    const state = get();
    return state.collections.teklifler.find((t) => t.id === id);
  },

  getMeetingById: (id) => {
    const state = get();
    return state.collections.gorusmeler.find((g) => g.id === id);
  },

  getShipmentById: (id) => {
    const state = get();
    return state.collections.shipments.find((s) => s.id === id);
  },

  getPaymentById: (id) => {
    const state = get();
    return state.collections.payments.find((p) => p.id === id);
  },

  // ============================================================================
  // SELECTORS - Get related items
  // ============================================================================

  getOrdersByCustomer: (customerId) => {
    const state = get();
    return state.collections.orders.filter((o) => o.customerId === customerId && !o.isDeleted);
  },

  getQuotesByCustomer: (customerId) => {
    const state = get();
    return state.collections.teklifler.filter((t) => t.customerId === customerId && !t.isDeleted);
  },

  getMeetingsByCustomer: (customerId) => {
    const state = get();
    return state.collections.gorusmeler.filter((g) => g.customerId === customerId && !g.isDeleted);
  },

  getShipmentsByOrder: (orderId) => {
    const state = get();
    return state.collections.shipments.filter((s) => s.orderId === orderId && !s.isDeleted);
  },

  getPaymentsByCustomer: (customerId) => {
    const state = get();
    return state.collections.payments.filter((p) => p.customerId === customerId && !p.isDeleted);
  },

  getPaymentsByOrder: (orderId) => {
    const state = get();
    return state.collections.payments.filter((p) => p.orderId === orderId && !p.isDeleted);
  },

  // ============================================================================
  // COMPUTED SELECTORS - Analytics & Statistics
  // ============================================================================

  getCustomerBalance: (customerId) => {
    const state = get();
    const orders = state.collections.orders.filter(
      (o) => o.customerId === customerId && !o.isDeleted
    );
    const payments = state.collections.payments.filter(
      (p) => p.customerId === customerId && !p.isDeleted && p.status === 'Tahsil Edildi'
    );

    const totalOrders = orders.reduce(
      (sum, o) => sum + convertToTRY(o.total_amount || 0, o.currency || 'TRY'),
      0
    );
    const totalPayments = payments.reduce(
      (sum, p) => sum + convertToTRY(p.amount || 0, p.currency || 'TRY'),
      0
    );

    return {
      totalOrders,
      totalPayments,
      balance: totalOrders - totalPayments,
    };
  },

  getActiveCustomers: () => {
    const state = get();
    return state.collections.customers.filter((c) => !c.isDeleted);
  },

  getActiveOrders: () => {
    const state = get();
    return state.collections.orders.filter((o) => !o.isDeleted && o.status !== 'Tamamlandı');
  },

  getPendingQuotes: () => {
    const state = get();
    return state.collections.teklifler.filter((t) => !t.isDeleted && t.status === 'Hazırlandı');
  },

  getOverduePayments: () => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return state.collections.payments.filter((p) => {
      if (p.isDeleted || p.status === 'Tahsil Edildi') return false;
      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      return dueDate && dueDate < today;
    });
  },

  getOverdueMeetings: () => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gorusmeler = state.collections.gorusmeler || [];
    const customers = state.collections.customers || [];

    return gorusmeler
      .filter((item) => !item.isDeleted)
      .filter((meeting) => {
        const nextActionDate = meeting.next_action_date ? new Date(meeting.next_action_date) : null;
        return (
          nextActionDate &&
          nextActionDate < today &&
          meeting.status !== 'Tamamlandı' &&
          meeting.status !== 'İptal Edildi'
        );
      })
      .map((meeting) => {
        const customer = customers.find((c) => c.id === meeting.customerId);
        return {
          ...meeting,
          type: 'meeting',
          customerName: customer ? customer.name : 'Bilinmiyor',
        };
      });
  },

  getUninvoicedShipments: () => {
    const state = get();
    return state.collections.shipments.filter(
      (s) => !s.isDeleted && s.status === 'Teslim Edildi' && !s.isInvoiced
    );
  },

  getAllCustomerBalances: () => {
    const state = get();
    const activeCustomers = state.collections.customers.filter((c) => !c.isDeleted);
    const orders = state.collections.orders;
    const payments = state.collections.payments;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    return activeCustomers.map((customer) => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id && !o.isDeleted);
      const customerPayments = payments.filter(
        (p) => p.customerId === customer.id && !p.isDeleted && p.status !== 'İptal'
      );
      const customerPendingPayments = payments.filter(
        (p) =>
          p.customerId === customer.id &&
          !p.isDeleted &&
          p.status !== 'Tahsil Edildi' &&
          p.status !== 'İptal'
      );

      const orderDetails = customerOrders.map((o) => ({
        id: o.id,
        date: o.order_date,
        amount: o.total_amount || 0,
        currency: o.currency || 'TRY',
        orderNumber: o.orderNumber,
        status: o.status,
      }));

      const paymentDetails = customerPayments.map((p) => ({
        id: p.id,
        date: p.paidDate || p.dueDate,
        amount: p.amount || 0,
        currency: p.currency || 'TRY',
        method: p.paymentMethod || 'Belirtilmemiş',
        status: p.status,
      }));

      // Calculate due date info
      const overduePayments = customerPendingPayments.filter((p) => {
        if (!p.dueDate) return false;
        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      const upcomingPayments = customerPendingPayments.filter((p) => {
        if (!p.dueDate) return false;
        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= sevenDaysLater;
      });

      const totalOrdersInTRY = customerOrders.reduce((sum, order) => {
        return sum + convertToTRY(order.total_amount || 0, order.currency || 'TRY');
      }, 0);

      const totalPaymentsInTRY = customerPayments.reduce((sum, payment) => {
        return sum + convertToTRY(payment.amount || 0, payment.currency || 'TRY');
      }, 0);

      const balanceAmount = totalPaymentsInTRY - totalOrdersInTRY;

      let status: BalanceStatus;
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
      const averageDelayDays =
        overdueCount > 0
          ? overduePayments.reduce((sum, p) => {
              const dueDate = new Date(p.dueDate);
              dueDate.setHours(0, 0, 0, 0);
              const delayDays = Math.floor(
                (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + delayDays;
            }, 0) / overdueCount
          : 0;

      const totalOverdueAmountInTRY = overduePayments.reduce((sum, p) => {
        return sum + convertToTRY(p.amount || 0, p.currency || 'TRY');
      }, 0);

      const totalUpcomingAmountInTRY = upcomingPayments.reduce((sum, p) => {
        return sum + convertToTRY(p.amount || 0, p.currency || 'TRY');
      }, 0);

      const overdueRatio =
        totalOrdersInTRY > 0 ? (totalOverdueAmountInTRY / totalOrdersInTRY) * 100 : 0;
      const balanceRatio =
        totalOrdersInTRY > 0 ? (Math.abs(balanceAmount) / totalOrdersInTRY) * 100 : 0;

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

      let riskLevel: RiskLevel;
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
        totalOrders: totalOrdersInTRY,
        totalPayments: totalPaymentsInTRY,
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
          totalOverdueAmount: totalOverdueAmountInTRY,
          totalUpcomingAmount: totalUpcomingAmountInTRY,
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
            balanceRatio: Math.round(balanceRatio * 10) / 10,
          },
        },
      };
    });
  },

  getBalancesSummary: () => {
    const customerBalances = get().getAllCustomerBalances(); // Use the new selector

    const totalAlacak = customerBalances
      .filter((cb) => cb.status === 'alacak')
      .reduce((sum, cb) => sum + cb.balance, 0);

    const totalBorc = customerBalances
      .filter((cb) => cb.status === 'borc')
      .reduce((sum, cb) => sum + Math.abs(cb.balance), 0);

    const netBalance = customerBalances.reduce((sum, cb) => sum + cb.balance, 0);

    const dengedeCount = customerBalances.filter((cb) => cb.status === 'dengede').length;

    // Calculate total overdue and upcoming
    const totalOverdue = customerBalances.reduce(
      (sum, cb) => sum + cb.dueDateInfo.totalOverdueAmount,
      0
    );
    const totalUpcoming = customerBalances.reduce(
      (sum, cb) => sum + cb.dueDateInfo.totalUpcomingAmount,
      0
    );
    const overdueCount = customerBalances.filter(
      (cb) => cb.dueDateInfo.overduePayments.length > 0
    ).length;
    const upcomingCount = customerBalances.filter(
      (cb) => cb.dueDateInfo.upcomingPayments.length > 0
    ).length;

    // Calculate risk statistics
    const highRiskCount = customerBalances.filter(
      (cb) => cb.riskAnalysis.riskLevel === 'high'
    ).length;
    const mediumRiskCount = customerBalances.filter(
      (cb) => cb.riskAnalysis.riskLevel === 'medium'
    ).length;
    const lowRiskCount = customerBalances.filter(
      (cb) => cb.riskAnalysis.riskLevel === 'low'
    ).length;

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
      lowRiskCount,
    };
  },

  getUniqueCities: () => {
    const state = get();
    const customers = state.collections.customers;
    const uniqueCities = new Set(customers.filter((c) => c.city).map((c) => c.city));
    return ['Tümü', ...Array.from(uniqueCities).sort()];
  },
});
