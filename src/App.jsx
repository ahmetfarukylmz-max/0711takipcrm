import React, { useState, lazy, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useFirestoreCollections } from './hooks/useFirestore';
import useStore from './store/useStore';
import { logActivity, setStoreInstance } from './services/firestoreService';
import {
  saveCustomer,
  saveProduct,
  saveOrderHandler,
  saveQuoteHandler,
  saveMeetingHandler,
  saveCustomTaskHandler,
  saveShipmentHandler,
  updateShipmentHandlerV2,
  savePaymentHandler,
  deleteCustomerHandler,
  deleteProductHandler,
  deleteOrderHandler,
  deleteQuoteHandler,
  deleteMeetingHandler,
  deletePaymentHandler,
  deleteShipmentHandler,
  cancelOrderHandler,
  convertToOrderHandler,
  markShipmentDeliveredHandler,
  createQuoteFromMeetingHandler,
} from './utils/dataHandlers';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
// Sidebar, BottomNav, FAB, PullToRefresh moved to MainLayout

// Page Components - Lazy Loaded for better performance
import LoginScreen from './components/pages/LoginScreen';
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const Customers = lazy(() => import('./components/pages/Customers'));
const Products = lazy(() => import('./components/pages/Products'));
const Orders = lazy(() => import('./components/pages/Orders'));
const Quotes = lazy(() => import('./components/pages/Quotes'));
const Meetings = lazy(() => import('./components/pages/Meetings'));
const Shipments = lazy(() => import('./components/pages/Shipments'));
const Payments = lazy(() => import('./components/pages/Payments'));
const Balances = lazy(() => import('./components/pages/Balances'));
const Reports = lazy(() => import('./components/pages/Reports'));
const Admin = lazy(() => import('./components/pages/Admin'));
const PdfGenerator = lazy(() => import('./components/pages/PdfGenerator'));
const Purchasing = lazy(() => import('./components/pages/Purchasing'));
// Hybrid Costing System Pages
const StockLotManagement = lazy(() => import('./components/pages/StockLotManagement'));
const LotReconciliation = lazy(() => import('./components/pages/LotReconciliation'));

const CrmApp = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand store - replacing local state
  const activePage = useStore((state) => state.activePage);
  const setActivePage = useStore((state) => state.setActivePage);
  const editingDocument = useStore((state) => state.editingDocument);
  const setEditingDocument = useStore((state) => state.setEditingDocument);
  const toggleGuide = useStore((state) => state.toggleGuide);

  // Overdue items calculation moved to useMemo to prevent infinite render loops
  // const overdueItems = useStore((state) => state.getOverdueMeetings()); // This caused infinite loop

  const prefilledQuote = useStore((state) => state.prefilledQuote);
  const setPrefilledQuote = useStore((state) => state.setPrefilledQuote);
  const clearPrefilledQuote = useStore((state) => state.clearPrefilledQuote);

  // eslint-disable-next-line no-unused-vars
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Initialize store instance for optimistic UI
  useEffect(() => {
    setStoreInstance(useStore);
  }, []);

  const handleToggleGuide = () => {
    toggleGuide();
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Wait a bit to simulate refresh (Firestore already updates in real-time)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Veriler güncellendi');
  };

  // URL to ActivePage Sync
  useEffect(() => {
    const path = location.pathname;
    switch (path) {
      case '/':
        setActivePage('Anasayfa');
        break;
      case '/customers':
        setActivePage('Müşteriler');
        break;
      case '/products':
        setActivePage('Ürünler');
        break;
      case '/orders':
        setActivePage('Siparişler');
        break;
      case '/quotes':
        setActivePage('Teklifler');
        break;
      case '/meetings':
        setActivePage('Görüşmeler');
        break;
      case '/shipments':
        setActivePage('Sevkiyat');
        break;
      case '/payments':
        setActivePage('Ödemeler');
        break;
      case '/balances':
        setActivePage('Cari Hesaplar');
        break;
      case '/reports':
        setActivePage('Raporlar');
        break;
      case '/lots':
        setActivePage('Lot Yönetimi');
        break;
      case '/reconciliation':
        setActivePage('Uzlaştırma');
        break;
      case '/admin':
        setActivePage('Admin');
        break;
      case '/pdf-generator':
        setActivePage('belge-hazirla');
        break;
      case '/purchasing':
        setActivePage('Satınalma');
        break;
      default:
        setActivePage('Anasayfa');
    }
  }, [location.pathname, setActivePage]);

  // Navigation Helper
  const navigateToPage = (page) => {
    switch (page) {
      case 'Anasayfa':
        navigate('/');
        break;
      case 'Müşteriler':
        navigate('/customers');
        break;
      case 'Ürünler':
        navigate('/products');
        break;
      case 'Siparişler':
        navigate('/orders');
        break;
      case 'Teklifler':
        navigate('/quotes');
        break;
      case 'Görüşmeler':
        navigate('/meetings');
        break;
      case 'Sevkiyat':
        navigate('/shipments');
        break;
      case 'Ödemeler':
        navigate('/payments');
        break;
      case 'Cari Hesaplar':
        navigate('/balances');
        break;
      case 'Raporlar':
        navigate('/reports');
        break;
      case 'Lot Yönetimi':
        navigate('/lots');
        break;
      case 'Uzlaştırma':
        navigate('/reconciliation');
        break;
      case 'Admin':
        navigate('/admin');
        break;
      case 'belge-hazirla':
        navigate('/pdf-generator');
        break;
      case 'Satınalma':
        navigate('/purchasing');
        break;
      default:
        navigate('/');
    }
  };

  // Handle FAB actions
  const handleFABAction = (action, customerId) => {
    // Handle viewCustomer action
    if (action === 'viewCustomer' && customerId) {
      navigateToPage('Müşteriler');
      // Could store customerId to open detail modal, but for now just navigate
      return;
    }

    const actionMap = {
      addCustomer: {
        page: 'Müşteriler',
        selector: '[data-action="add-customer"]',
      },
      addProduct: {
        page: 'Ürünler',
        selector: '[data-action="add-product"]',
      },
      addQuote: {
        page: 'Teklifler',
        selector: '[data-action="add-quote"]',
      },
      addOrder: {
        page: 'Siparişler',
        selector: '[data-action="add-order"]',
      },
      addMeeting: {
        page: 'Görüşmeler',
        selector: '[data-action="add-meeting"]',
      },
      addShipment: {
        page: 'Sevkiyat',
        selector: '[data-action="add-shipment"]',
      },
    };

    const actionConfig = actionMap[action];
    if (!actionConfig) return;

    // Navigate first
    navigateToPage(actionConfig.page);

    // Wait for page to render, then trigger the add button
    setTimeout(() => {
      document.querySelector(actionConfig.selector)?.click();
    }, 300);
  };

  // Fetch all collections (now directly updates Zustand store)
  useFirestoreCollections([
    'customers',
    'products',
    'orders',
    'shipments',
    'teklifler',
    'gorusmeler',
    'customTasks',
    'payments',
    'stock_movements',
  ]);

  // Get collections and loading/connection status from Zustand store
  const customers = useStore((state) => state.collections.customers) || [];
  const products = useStore((state) => state.collections.products) || [];
  const orders = useStore((state) => state.collections.orders) || [];
  const shipments = useStore((state) => state.collections.shipments) || [];
  const teklifler = useStore((state) => state.collections.teklifler) || [];
  const gorusmeler = useStore((state) => state.collections.gorusmeler) || [];
  const customTasks = useStore((state) => state.collections.customTasks) || [];
  const payments = useStore((state) => state.collections.payments) || [];
  const connectionStatus = useStore((state) => state.connectionStatus);
  const dataLoading = useStore((state) => state.dataLoading);

  // Re-implemented overdueItems calculation using useMemo to fix infinite loop
  const overdueItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
  }, [gorusmeler, customers]);

  const logUserActivity = (action, details) => {
    logActivity(user.uid, action, details);
  };

  // Handler functions
  const handleCustomerSave = async (data) => {
    await saveCustomer(user, data, customers, logUserActivity);
  };
  const handleProductSave = async (data) => {
    await saveProduct(user, data, logUserActivity);
  };
  const handleOrderSave = async (data) => {
    await saveOrderHandler(user, data, customers, logUserActivity);
  };

  const handleQuoteSave = async (data) => {
    await saveQuoteHandler(user, data, customers, logUserActivity);
  };
  const handleMeetingSave = async (data) => {
    await saveMeetingHandler(user, data, customers, logUserActivity);
  };

  const handleCustomTaskSave = async (data) => {
    await saveCustomTaskHandler(user, data, logUserActivity);
  };

  const handleCreateQuoteFromMeeting = (customerId, inquiredProducts) => {
    createQuoteFromMeetingHandler(
      customerId,
      inquiredProducts,
      products,
      setPrefilledQuote,
      navigateToPage,
      toast
    );
  };

  // Shipment handler
  const handleShipmentSave = async (shipmentData) => {
    await saveShipmentHandler(user, shipmentData, orders, customers, logUserActivity);
  };

  const handleShipmentUpdate = async (shipmentData) => {
    await updateShipmentHandlerV2(user, shipmentData, orders, customers, logUserActivity);
  };

  const handlePaymentSave = async (data) => {
    await savePaymentHandler(user, data, customers, logUserActivity);
  };

  const handlePaymentDelete = (id) => {
    deletePaymentHandler(user, id, payments, orders, logUserActivity);
  };

  // Delete handler functions
  const handleCustomerDelete = (id) => {
    deleteCustomerHandler(user, id, customers, orders, teklifler, gorusmeler, logUserActivity);
  };
  const handleProductDelete = (id) => {
    deleteProductHandler(user, id, products, orders, logUserActivity);
  };
  const handleOrderDelete = (id) => {
    deleteOrderHandler(user, id, orders, customers, shipments, logUserActivity);
  };

  const handleOrderCancel = async (orderId, cancellationData) => {
    await cancelOrderHandler(user, orderId, cancellationData, orders, customers, logUserActivity);
  };

  const handleQuoteDelete = (id) => {
    deleteQuoteHandler(user, id, teklifler, customers, logUserActivity);
  };
  const handleMeetingDelete = (id) => {
    deleteMeetingHandler(user, id, gorusmeler, customers, logUserActivity);
  };
  const handleShipmentDelete = (id) => {
    deleteShipmentHandler(user, id, shipments, orders, customers, logUserActivity);
  };

  const handleConvertToOrder = async (quote) => {
    await convertToOrderHandler(user, quote, customers, logUserActivity);
  };

  const handleDelivery = async (shipmentId) => {
    await markShipmentDeliveredHandler(
      user,
      shipmentId,
      shipments,
      orders,
      customers,
      logUserActivity
    );
  };

  const handleGeneratePdf = (doc) => {
    setEditingDocument(doc);
    navigateToPage('belge-hazirla');
  };

  if (loading) {
    // MainLayout has its own suspense, but initial auth loading needs this
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-lg text-gray-600">
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            activePage={activePage}
            setActivePage={navigateToPage}
            connectionStatus={connectionStatus}
            onRefresh={handleRefresh}
            onFABAction={handleFABAction}
            customers={customers}
          />
        }
      >
        <Route
          path="/"
          element={
            <Dashboard
              customers={customers}
              orders={orders}
              teklifler={teklifler}
              gorusmeler={gorusmeler}
              products={products}
              shipments={shipments}
              overdueItems={overdueItems}
              customTasks={customTasks}
              setActivePage={navigateToPage}
              onMeetingSave={handleMeetingSave}
              onCustomTaskSave={handleCustomTaskSave}
              onScheduleMeeting={(customerId) => setSelectedCustomerId(customerId)}
              loading={dataLoading}
            />
          }
        />
        <Route
          path="/customers"
          element={
            <Customers
              customers={customers}
              onSave={handleCustomerSave}
              onDelete={handleCustomerDelete}
              orders={orders}
              quotes={teklifler}
              meetings={gorusmeler}
              shipments={shipments}
              products={products}
              payments={payments}
              onQuoteSave={handleQuoteSave}
              onOrderSave={handleOrderSave}
              onMeetingSave={handleMeetingSave}
              onProductSave={handleProductSave}
              onShipmentUpdate={handleShipmentUpdate}
              setActivePage={navigateToPage}
              loading={dataLoading}
            />
          }
        />
        <Route
          path="/products"
          element={
            <Products
              products={products}
              orders={orders}
              quotes={teklifler}
              customers={customers}
              onSave={handleProductSave}
              onDelete={handleProductDelete}
              loading={dataLoading}
            />
          }
        />
        <Route
          path="/quotes"
          element={
            <Quotes
              quotes={teklifler}
              orders={orders}
              shipments={shipments}
              onSave={handleQuoteSave}
              onDelete={handleQuoteDelete}
              onConvertToOrder={handleConvertToOrder}
              customers={customers}
              products={products}
              onGeneratePdf={handleGeneratePdf}
              prefilledQuote={prefilledQuote}
              onPrefilledQuoteConsumed={clearPrefilledQuote}
              loading={dataLoading}
            />
          }
        />
        <Route
          path="/orders"
          element={
            <Orders
              orders={orders}
              onSave={handleOrderSave}
              onDelete={handleOrderDelete}
              onCancel={handleOrderCancel}
              onShipment={handleShipmentSave}
              customers={customers}
              products={products}
              shipments={shipments}
              payments={payments}
              onMarkAsPaid={(paymentId) => {
                const payment = payments.find((p) => p.id === paymentId);
                if (payment) {
                  const today = new Date().toISOString().split('T')[0];
                  handlePaymentSave({ ...payment, status: 'Tahsil Edildi', paidDate: today });
                  toast.success('Ödeme tahsil edildi olarak işaretlendi!');
                }
              }}
              onGoToPayment={(paymentId) => {
                setSelectedPaymentId(paymentId);
                navigateToPage('Ödemeler');
              }}
              onGeneratePdf={handleGeneratePdf}
              loading={dataLoading}
            />
          }
        />
        <Route
          path="/meetings"
          element={
            <Meetings
              meetings={gorusmeler}
              customers={customers}
              products={products}
              onSave={handleMeetingSave}
              onDelete={handleMeetingDelete}
              onCustomerSave={handleCustomerSave}
              onProductSave={handleProductSave}
              onCreateQuote={handleCreateQuoteFromMeeting}
              loading={dataLoading}
              selectedCustomerId={selectedCustomerId}
              onCustomerSelected={() => setSelectedCustomerId(null)}
            />
          }
        />
        <Route
          path="/shipments"
          element={
            <Shipments
              shipments={shipments}
              orders={orders}
              products={products}
              customers={customers}
              onDelivery={handleDelivery}
              onUpdate={handleShipmentUpdate}
              onDelete={handleShipmentDelete}
              loading={dataLoading}
            />
          }
        />
        <Route
          path="/payments"
          element={
            <Payments
              payments={payments}
              customers={customers}
              orders={orders}
              onSave={handlePaymentSave}
              onDelete={handlePaymentDelete}
              loading={dataLoading}
              selectedPaymentId={selectedPaymentId}
              onPaymentSelected={() => setSelectedPaymentId(null)}
            />
          }
        />
        <Route
          path="/balances"
          element={
            <Balances
              customers={customers}
              orders={orders}
              payments={payments}
              onCustomerClick={() => {
                navigateToPage('Müşteriler');
              }}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <Reports
              orders={orders}
              customers={customers}
              teklifler={teklifler}
              gorusmeler={gorusmeler}
              shipments={shipments}
              products={products}
              payments={payments}
              onGuideClick={handleToggleGuide}
            />
          }
        />
        <Route path="/lots" element={<StockLotManagement />} />
        <Route path="/reconciliation" element={<LotReconciliation />} />
        <Route path="/purchasing" element={<Purchasing />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/pdf-generator"
          element={
            <PdfGenerator
              doc={editingDocument}
              customers={customers}
              products={products}
              orders={orders}
              shipments={shipments}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CrmApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
