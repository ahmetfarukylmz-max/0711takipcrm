import {
  Customer,
  Product,
  Order,
  Shipment,
  Quote,
  Meeting,
  CustomTask,
  Payment,
  StockMovement,
  PurchaseRequest,
  ReturnInvoice,
} from '../types';

// Collection Keys (Veri koleksiyonlarının isimleri)
export type CollectionKey =
  | 'customers'
  | 'products'
  | 'orders'
  | 'shipments'
  | 'teklifler'
  | 'gorusmeler'
  | 'customTasks'
  | 'payments'
  | 'stock_movements'
  | 'suppliers' // Gelecek modül için hazırlık
  | 'purchaseOrders' // Gelecek modül için hazırlık
  | 'purchase_requests'
  | 'returns';

// Ana Veri Koleksiyonları
export interface Collections {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  shipments: Shipment[];
  teklifler: Quote[];
  gorusmeler: Meeting[];
  customTasks: CustomTask[];
  payments: Payment[];
  stock_movements: StockMovement[];
  suppliers: any[]; // Tip tanımlanınca güncellenecek
  purchaseOrders: any[]; // Tip tanımlanınca güncellenecek
  purchase_requests: PurchaseRequest[];
  returns: ReturnInvoice[];
}

// UI Slice: Arayüz durumu ve aksiyonları
export interface UISlice {
  // State
  activePage: string;
  editingDocument: any | null; // Document tipine göre özelleştirilebilir
  showGuide: boolean;
  overdueItems: any[];
  prefilledQuote: any | null;
  refreshing: boolean;
  selectedProductId: string | null;
  dataLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  user: any | null; // Authentication user object
  sidebarOpen: boolean; // Sidebar visibility state

  // Actions
  setActivePage: (page: string) => void;
  setEditingDocument: (doc: any | null) => void;
  setUser: (user: any | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setShowGuide: (show: boolean) => void;
  toggleGuide: () => void;
  setOverdueItems: (items: any[]) => void;
  setPrefilledQuote: (quote: any | null) => void;
  clearPrefilledQuote: () => void;
  setRefreshing: (refreshing: boolean) => void;
  setSelectedProductId: (productId: string | null) => void;
  clearSelectedProductId: () => void;
  setDataLoading: (loading: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

// Data Slice: Veri yönetimi ve seçiciler
export interface DataSlice {
  // State
  collections: Collections;

  // Actions - Generic
  setCollections: (collections: Collections) => void;
  updateCollection: <T>(collectionName: CollectionKey, data: T[]) => void;
  addToCollection: <T>(collectionName: CollectionKey, item: T) => void;
  updateInCollection: <T>(
    collectionName: CollectionKey,
    itemId: string,
    updatedItem: Partial<T>
  ) => void;
  removeFromCollection: (collectionName: CollectionKey, itemId: string) => void;

  // Actions - Optimistic UI
  addPendingItem: <T>(collectionName: CollectionKey, tempItem: T) => void;
  removePendingItem: (collectionName: CollectionKey, tempId: string) => void;
  updatePendingItem: <T>(collectionName: CollectionKey, tempId: string, realItem: T) => void;

  // Selectors (Getters)
  getCustomerById: (id: string) => Customer | undefined;
  getProductById: (id: string) => Product | undefined;
  getOrderById: (id: string) => Order | undefined;
  getQuoteById: (id: string) => Quote | undefined;
  getMeetingById: (id: string) => Meeting | undefined;
  getShipmentById: (id: string) => Shipment | undefined;
  getPaymentById: (id: string) => Payment | undefined;

  // Relation Selectors
  getOrdersByCustomer: (customerId: string) => Order[];
  getQuotesByCustomer: (customerId: string) => Quote[];
  getMeetingsByCustomer: (customerId: string) => Meeting[];
  getShipmentsByOrder: (orderId: string) => Shipment[];
  getPaymentsByCustomer: (customerId: string) => Payment[];
  getPaymentsByOrder: (orderId: string) => Payment[];

  // Computed Selectors
  getCustomerBalance: (customerId: string) => {
    totalOrders: number;
    totalPayments: number;
    balance: number;
  };
  getActiveCustomers: () => Customer[];
  getActiveOrders: () => Order[];
  getPendingQuotes: () => Quote[];
  getOverduePayments: () => Payment[];
  getUninvoicedShipments: () => Shipment[];
}

// Main Store State (Combination)
export type StoreState = UISlice & DataSlice;
