import { create } from 'zustand';

/**
 * Zustand Global Store
 * Centralizes application state management to reduce props drilling
 * and improve performance with selective re-rendering
 */
const useStore = create((set, get) => ({
  // ============================================================================
  // STATE
  // ============================================================================

  // UI State
  activePage: 'Anasayfa',
  editingDocument: null,
  showGuide: false,
  overdueItems: [],
  prefilledQuote: null,
  refreshing: false,

  // Data Collections
  collections: {
    customers: [],
    products: [],
    orders: [],
    shipments: [],
    teklifler: [],
    gorusmeler: [],
    customTasks: [],
    payments: [],
  },

  // Loading & Connection Status
  dataLoading: false,
  connectionStatus: 'connected',

  // ============================================================================
  // ACTIONS - UI State
  // ============================================================================

  setActivePage: (page) => set({ activePage: page }),

  setEditingDocument: (doc) => set({ editingDocument: doc }),

  setShowGuide: (show) => set({ showGuide: show }),

  toggleGuide: () => set((state) => ({ showGuide: !state.showGuide })),

  setOverdueItems: (items) => set({ overdueItems: items }),

  setPrefilledQuote: (quote) => set({ prefilledQuote: quote }),

  clearPrefilledQuote: () => set({ prefilledQuote: null }),

  setRefreshing: (refreshing) => set({ refreshing }),

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
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: state.collections[collectionName].map((item) =>
          item.id === itemId ? { ...item, ...updatedItem } : item
        ),
      },
    })),

  removeFromCollection: (collectionName, itemId) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: state.collections[collectionName].filter(
          (item) => item.id !== itemId
        ),
      },
    })),

  // Optimistic UI helpers
  addPendingItem: (collectionName, tempItem) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: [...state.collections[collectionName], { ...tempItem, _pending: true }],
      },
    })),

  removePendingItem: (collectionName, tempId) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: state.collections[collectionName].filter(
          (item) => item.id !== tempId
        ),
      },
    })),

  updatePendingItem: (collectionName, tempId, realItem) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionName]: state.collections[collectionName].map((item) =>
          item.id === tempId ? { ...realItem, _pending: false } : item
        ),
      },
    })),

  setDataLoading: (loading) => set({ dataLoading: loading }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

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
    return state.collections.orders.filter(
      (o) => o.customerId === customerId && !o.isDeleted
    );
  },

  getQuotesByCustomer: (customerId) => {
    const state = get();
    return state.collections.teklifler.filter(
      (t) => t.customerId === customerId && !t.isDeleted
    );
  },

  getMeetingsByCustomer: (customerId) => {
    const state = get();
    return state.collections.gorusmeler.filter(
      (g) => g.customerId === customerId && !g.isDeleted
    );
  },

  getShipmentsByOrder: (orderId) => {
    const state = get();
    return state.collections.shipments.filter(
      (s) => s.orderId === orderId && !s.isDeleted
    );
  },

  getPaymentsByCustomer: (customerId) => {
    const state = get();
    return state.collections.payments.filter(
      (p) => p.customerId === customerId && !p.isDeleted
    );
  },

  getPaymentsByOrder: (orderId) => {
    const state = get();
    return state.collections.payments.filter(
      (p) => p.orderId === orderId && !p.isDeleted
    );
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

    const totalOrders = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
    return state.collections.orders.filter(
      (o) => !o.isDeleted && o.status !== 'Tamamlandı'
    );
  },

  getPendingQuotes: () => {
    const state = get();
    return state.collections.teklifler.filter(
      (t) => !t.isDeleted && t.status === 'Hazırlandı'
    );
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

  getUninvoicedShipments: () => {
    const state = get();
    return state.collections.shipments.filter(
      (s) => !s.isDeleted && s.status === 'Teslim Edildi' && !s.isInvoiced
    );
  },
}));

export default useStore;
