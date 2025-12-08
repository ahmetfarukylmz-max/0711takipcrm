import { StateCreator } from 'zustand';
import { StoreState, UISlice } from '../types';

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => ({
  // Initial State
  activePage: 'Anasayfa',
  editingDocument: null,
  showGuide: false,
  overdueItems: [],
  prefilledQuote: null,
  refreshing: false,
  selectedProductId: null,
  dataLoading: false,
  connectionStatus: 'connected',
  user: null,
  sidebarOpen: true,

  // Actions
  setActivePage: (page) => set({ activePage: page }),

  setEditingDocument: (doc) => set({ editingDocument: doc }),

  setUser: (user) => set({ user: user }),

  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setShowGuide: (show) => set({ showGuide: show }),

  toggleGuide: () => set((state) => ({ showGuide: !state.showGuide })),

  setOverdueItems: (items) => set({ overdueItems: items }),

  setPrefilledQuote: (quote) => set({ prefilledQuote: quote }),

  clearPrefilledQuote: () => set({ prefilledQuote: null }),

  setRefreshing: (refreshing) => set({ refreshing }),

  setSelectedProductId: (productId) => set({ selectedProductId: productId }),

  clearSelectedProductId: () => set({ selectedProductId: null }),

  setDataLoading: (loading) => set({ dataLoading: loading }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
});
