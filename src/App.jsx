import React, { useState, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useFirestoreCollections } from './hooks/useFirestore';
import useStore from './store/useStore';
import {
  saveDocument,
  saveOrder,
  saveQuote,
  convertQuoteToOrder,
  markShipmentDelivered,
  deleteDocument,
  undoDelete,
  logActivity,
  setStoreInstance,
  cancelOrder,
} from './services/firestoreService';
import { showUndoableDelete, showSmartConfirm } from './utils/toastUtils.jsx';
import { logger } from './utils/logger';

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
  const overdueItems = useStore((state) => state.overdueItems);
  const setOverdueItems = useStore((state) => state.setOverdueItems);
  const prefilledQuote = useStore((state) => state.prefilledQuote);
  const setPrefilledQuote = useStore((state) => state.setPrefilledQuote);
  const clearPrefilledQuote = useStore((state) => state.clearPrefilledQuote);
  const setCollections = useStore((state) => state.setCollections);
  const setDataLoading = useStore((state) => state.setDataLoading);
  const setConnectionStatus = useStore((state) => state.setConnectionStatus);

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

  // Fetch all collections
  const {
    collections,
    connectionStatus,
    loading: dataLoading,
  } = useFirestoreCollections([
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

  // Sync Firestore data to Zustand store
  useEffect(() => {
    setCollections(collections);
    setConnectionStatus(connectionStatus);
    setDataLoading(dataLoading);
  }, [
    collections,
    connectionStatus,
    dataLoading,
    setCollections,
    setConnectionStatus,
    setDataLoading,
  ]);

  // Get collections from store (now other components can access directly from store)
  // Using fallback empty arrays to prevent undefined errors
  const customers = useStore((state) => state.collections.customers) || [];
  const products = useStore((state) => state.collections.products) || [];
  const orders = useStore((state) => state.collections.orders) || [];
  const shipments = useStore((state) => state.collections.shipments) || [];
  const teklifler = useStore((state) => state.collections.teklifler) || [];
  const gorusmeler = useStore((state) => state.collections.gorusmeler) || [];
  const customTasks = useStore((state) => state.collections.customTasks) || [];
  const payments = useStore((state) => state.collections.payments) || [];

  const logUserActivity = (action, details) => {
    logActivity(user.uid, action, details);
  };

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueMeetings = gorusmeler
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

    // Use queueMicrotask to avoid React error #185 (updating state during render)
    queueMicrotask(() => {
      setOverdueItems(overdueMeetings);
    });
  }, [gorusmeler, customers, setOverdueItems]);

  // Handler functions
  const handleCustomerSave = async (data) => {
    const action = data.id ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER';
    const details = {
      message: `Müşteri ${data.id ? 'güncellendi' : 'oluşturuldu'}: ${data.name}`,
      customerId: data.id,
    };
    // Add createdBy for new records
    if (!data.id) {
      data.createdBy = user.uid;
      data.createdByEmail = user.email;
    }
    await saveDocument(user.uid, 'customers', data);
    logUserActivity(action, details);
  };
  const handleProductSave = async (data) => {
    const action = data.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT';
    const details = { message: `Ürün ${data.id ? 'güncellendi' : 'oluşturuldu'}: ${data.name}` };
    // Add createdBy for new records
    if (!data.id) {
      data.createdBy = user.uid;
      data.createdByEmail = user.email;
    }
    await saveDocument(user.uid, 'products', data);
    logUserActivity(action, details);
  };
  const handleOrderSave = async (data) => {
    const customerName = customers.find((c) => c.id === data.customerId)?.name || '';
    const action = data.id ? 'UPDATE_ORDER' : 'CREATE_ORDER';
    const details = {
      message: `${customerName} için sipariş ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
      amount: data.total_amount,
    };

    const isNewOrder = !data.id;

    // Add createdBy for new records
    if (isNewOrder) {
      data.createdBy = user.uid;
      data.createdByEmail = user.email;
    }

    await saveOrder(user.uid, data);
    logUserActivity(action, details);
  };
  const handleQuoteSave = async (data) => {
    const customerName = customers.find((c) => c.id === data.customerId)?.name || '';
    const action = data.id ? 'UPDATE_QUOTE' : 'CREATE_QUOTE';
    const details = {
      message: `${customerName} için teklif ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
      amount: data.total_amount,
    };
    // Add createdBy for new records
    if (!data.id) {
      data.createdBy = user.uid;
      data.createdByEmail = user.email;
    }
    await saveQuote(user.uid, data);
    logUserActivity(action, details);
  };
  const handleMeetingSave = async (data) => {
    const customerName = customers.find((c) => c.id === data.customerId)?.name || '';
    const action = data.id ? 'UPDATE_MEETING' : 'CREATE_MEETING';
    const details = {
      message: `${customerName} ile görüşme ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
    };
    // Add createdBy for new records
    if (!data.id) {
      data.createdBy = user.uid;
      data.createdByEmail = user.email;
    }
    await saveDocument(user.uid, 'gorusmeler', data);
    logUserActivity(action, details);
  };

  const handleCustomTaskSave = async (data) => {
    const action = data.id ? 'UPDATE_CUSTOM_TASK' : 'CREATE_CUSTOM_TASK';
    const details = { message: `Görev ${data.id ? 'güncellendi' : 'oluşturuldu'}: ${data.title}` };
    // Add createdByEmail for new records (userId already set by component)
    if (!data.id) {
      data.createdByEmail = user.email;
    }
    await saveDocument(user.uid, 'customTasks', data);
    logUserActivity(action, details);
    toast.success(data.id ? 'Görev güncellendi!' : 'Görev eklendi!');
  };

  const handleCreateQuoteFromMeeting = (customerId, inquiredProducts) => {
    // Convert inquired products to quote items
    const quoteItems = inquiredProducts
      .filter((ip) => ip.productId)
      .map((ip) => {
        const product = products.find((p) => p.id === ip.productId);
        if (!product) return null;

        return {
          productId: ip.productId,
          productName: ip.productName,
          quantity: ip.quantity || 1,
          unit: ip.unit || product.unit || 'Adet',
          unitPrice: ip.priceQuoted || product.price || 0,
          totalPrice: (ip.quantity || 1) * (ip.priceQuoted || product.price || 0),
        };
      })
      .filter((item) => item !== null);

    if (quoteItems.length === 0) {
      toast.error('Teklif oluşturmak için en az bir geçerli ürün gerekli');
      return;
    }

    // Calculate totals
    const subtotal = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatRate = 20; // Default VAT rate
    const vatAmount = (subtotal * vatRate) / 100;
    const total_amount = subtotal + vatAmount;

    // Create prefilled quote
    const newQuote = {
      customerId,
      items: quoteItems,
      subtotal,
      vatRate,
      vatAmount,
      total_amount,
      quote_date: new Date().toISOString().slice(0, 10),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days
      status: 'Hazırlandı',
      currency: 'TRY',
    };

    // Set prefilled quote and navigate to Quotes page
    setPrefilledQuote(newQuote);
    navigateToPage('Teklifler');
    toast.success(`${quoteItems.length} ürünle teklif oluşturuluyor...`);
  };

  // Shipment handler
  const handleShipmentSave = async (shipmentData) => {
    try {
      // Add createdBy for new shipments
      if (!shipmentData.id) {
        shipmentData.createdBy = user.uid;
        shipmentData.createdByEmail = user.email;
      }
      await saveDocument(user.uid, 'shipments', shipmentData);
      const order = orders.find((o) => o.id === shipmentData.orderId);
      const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
      logUserActivity('CREATE_SHIPMENT', {
        message: `${customerName} müşterisinin siparişi için sevkiyat oluşturuldu`,
      });
      toast.success('Sevkiyat başarıyla kaydedildi!');
    } catch (error) {
      logger.error('Sevkiyat kaydedilemedi:', error);
      toast.error('Sevkiyat kaydedilemedi!');
    }
  };

  const handleShipmentUpdate = async (shipmentData) => {
    try {
      await saveDocument(user.uid, 'shipments', shipmentData);
      const order = orders.find((o) => o.id === shipmentData.orderId);
      const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
      logUserActivity('UPDATE_SHIPMENT', {
        message: `${customerName} müşterisinin sevkiyatı güncellendi`,
      });
      toast.success('Sevkiyat başarıyla güncellendi!');
    } catch (error) {
      logger.error('Sevkiyat güncellenemedi:', error);
      toast.error('Sevkiyat güncellenemedi!');
    }
  };

  const handlePaymentSave = async (data) => {
    const action = data.id ? 'UPDATE_PAYMENT' : 'CREATE_PAYMENT';
    const customerName = customers.find((c) => c.id === data.customerId)?.name || '';

    // Build activity details - only include defined values
    const details = {
      message: `${customerName} için ödeme ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
      amount: data.amount,
    };
    // Only add paymentId if it exists (update case)
    if (data.id) {
      details.paymentId = data.id;
    }

    // Add createdBy for new records
    if (!data.id) {
      data.createdBy = user.uid;
      data.createdByEmail = user.email;
    }
    await saveDocument(user.uid, 'payments', data);
    logUserActivity(action, details);
    toast.success(`Ödeme başarıyla ${data.id ? 'güncellendi' : 'kaydedildi'}!`);
  };

  const handlePaymentDelete = (id) => {
    const payment = payments.find((p) => p.id === id);
    if (!payment) return;

    const customerName = payment.customerName || 'Bilinmeyen müşteri';
    const relatedOrder = payment.orderId ? orders.find((o) => o.id === payment.orderId) : null;

    showSmartConfirm({
      itemName: `${customerName} - Ödeme`,
      itemType: 'ödeme',
      relatedCount: relatedOrder ? 1 : 0,
      relatedType: relatedOrder ? 'sipariş ile ilişkili' : '',
      onConfirm: () => {
        deleteDocument(user.uid, 'payments', id).then(() => {
          logUserActivity('DELETE_PAYMENT', {
            message: `Ödeme silindi: ${customerName} - ${payment.amount}`,
          });
          showUndoableDelete(`${customerName} müşterisinin ödemesi silindi`, () => {
            undoDelete(user.uid, 'payments', id);
            logUserActivity('UNDO_DELETE_PAYMENT', {
              message: `Ödeme geri alındı: ${customerName}`,
            });
          });
        });
      },
    });
  };

  // Delete handler functions
  const handleCustomerDelete = (id) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    const relatedOrders = orders.filter((o) => o.customerId === id && !o.isDeleted).length;
    const relatedQuotes = teklifler.filter((t) => t.customerId === id && !t.isDeleted).length;
    const relatedMeetings = gorusmeler.filter((m) => m.customerId === id && !m.isDeleted).length;
    const totalRelated = relatedOrders + relatedQuotes + relatedMeetings;

    showSmartConfirm({
      itemName: customer.name,
      itemType: 'müşteri',
      relatedCount: totalRelated,
      relatedType: totalRelated > 0 ? `sipariş/teklif/görüşme` : '',
      onConfirm: () => {
        deleteDocument(user.uid, 'customers', id).then(() => {
          logUserActivity('DELETE_CUSTOMER', { message: `Müşteri silindi: ${customer?.name}` });
          showUndoableDelete(`"${customer.name}" müşterisi silindi`, () => {
            undoDelete(user.uid, 'customers', id);
            logUserActivity('UNDO_DELETE_CUSTOMER', {
              message: `Müşteri geri alındı: ${customer?.name}`,
            });
          });
        });
      },
    });
  };
  const handleProductDelete = (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const usedInOrders = orders.some(
      (o) => !o.isDeleted && o.items && o.items.some((item) => item.productId === id)
    );

    showSmartConfirm({
      itemName: product.name,
      itemType: 'ürün',
      relatedCount: usedInOrders ? 1 : 0,
      relatedType: usedInOrders ? 'siparişte kullanılıyor' : '',
      onConfirm: () => {
        deleteDocument(user.uid, 'products', id).then(() => {
          logUserActivity('DELETE_PRODUCT', { message: `Ürün silindi: ${product?.name}` });
          showUndoableDelete(`"${product.name}" ürünü silindi`, () => {
            undoDelete(user.uid, 'products', id);
            logUserActivity('UNDO_DELETE_PRODUCT', {
              message: `Ürün geri alındı: ${product?.name}`,
            });
          });
        });
      },
    });
  };
  const handleOrderDelete = (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const customer = customers.find((c) => c.id === order?.customerId);
    const customerName = customer?.name || 'Bilinmeyen müşteri';
    const relatedShipments = shipments.filter((s) => s.orderId === id && !s.isDeleted).length;

    showSmartConfirm({
      itemName: `${customerName} - Sipariş`,
      itemType: 'sipariş',
      relatedCount: relatedShipments,
      relatedType: relatedShipments > 0 ? 'sevkiyat' : '',
      onConfirm: () => {
        deleteDocument(user.uid, 'orders', id).then(() => {
          logUserActivity('DELETE_ORDER', {
            message: `${customerName} müşterisinin siparişi silindi`,
          });
          showUndoableDelete(`${customerName} müşterisinin siparişi silindi`, () => {
            undoDelete(user.uid, 'orders', id);
            logUserActivity('UNDO_DELETE_ORDER', {
              message: `Sipariş geri alındı: ${customerName}`,
            });
          });
        });
      },
    });
  };

  const handleOrderCancel = async (orderId, cancellationData) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const customer = customers.find((c) => c.id === order?.customerId);
    const customerName = customer?.name || 'Bilinmeyen müşteri';

    try {
      const success = await cancelOrder(user.uid, orderId, {
        ...cancellationData,
        cancelledByEmail: user.email,
      });

      if (success) {
        toast.success('Sipariş başarıyla iptal edildi');
        logUserActivity('CANCEL_ORDER', {
          message: `${customerName} müşterisinin siparişi iptal edildi`,
          orderId: orderId,
          reason: cancellationData.reason,
          amount: order.total_amount,
        });
      } else {
        toast.error('Sipariş iptal edilemedi');
      }
    } catch (error) {
      logger.error('Cancel order error:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const handleQuoteDelete = (id) => {
    const quote = teklifler.find((q) => q.id === id);
    if (!quote) return;

    const customer = customers.find((c) => c.id === quote?.customerId);
    const customerName = customer?.name || 'Bilinmeyen müşteri';

    showSmartConfirm({
      itemName: `${customerName} - Teklif`,
      itemType: 'teklif',
      onConfirm: () => {
        deleteDocument(user.uid, 'teklifler', id).then(() => {
          logUserActivity('DELETE_QUOTE', {
            message: `${customerName} müşterisinin teklifi silindi`,
          });
          showUndoableDelete(`${customerName} müşterisinin teklifi silindi`, () => {
            undoDelete(user.uid, 'teklifler', id);
            logUserActivity('UNDO_DELETE_QUOTE', {
              message: `Teklif geri alındı: ${customerName}`,
            });
          });
        });
      },
    });
  };
  const handleMeetingDelete = (id) => {
    const meeting = gorusmeler.find((m) => m.id === id);
    if (!meeting) return;

    const customer = customers.find((c) => c.id === meeting?.customerId);
    const customerName = customer?.name || 'Bilinmeyen müşteri';

    showSmartConfirm({
      itemName: `${customerName} - Görüşme`,
      itemType: 'görüşme',
      onConfirm: () => {
        deleteDocument(user.uid, 'gorusmeler', id).then(() => {
          logUserActivity('DELETE_MEETING', {
            message: `${customerName} müşterisiyle olan görüşme silindi`,
          });
          showUndoableDelete(`${customerName} müşterisiyle olan görüşme silindi`, () => {
            undoDelete(user.uid, 'gorusmeler', id);
            logUserActivity('UNDO_DELETE_MEETING', {
              message: `Görüşme geri alındı: ${customerName}`,
            });
          });
        });
      },
    });
  };
  const handleShipmentDelete = (id) => {
    const shipment = shipments.find((s) => s.id === id);
    if (!shipment) return;

    const order = orders.find((o) => o.id === shipment?.orderId);
    const customer = customers.find((c) => c.id === order?.customerId);
    const customerName = customer?.name || 'Bilinmeyen müşteri';

    showSmartConfirm({
      itemName: `${customerName} - Sevkiyat`,
      itemType: 'sevkiyat',
      onConfirm: () => {
        // Use specialized delete function that handles stock reversion and order status
        import('./services/firestoreService').then(({ deleteShipment }) => {
          deleteShipment(user.uid, id, user.email).then((success) => {
            if (success) {
              toast.success('Sevkiyat silindi ve stoklar iade edildi.');
              // Note: deleteShipment handles logging, so we don't need to log manually here
              // But we keep undo functionality for UI consistency (though complex to undo stock changes fully)
              showUndoableDelete(`${customerName} müşterisinin sevkiyatı silindi`, () => {
                // Undo logic is complex for shipment (stock reversion etc.), for now just basic restore
                undoDelete(user.uid, 'shipments', id);
                logUserActivity('UNDO_DELETE_SHIPMENT', {
                  message: `Sevkiyat geri alındı: ${customerName}`,
                });
              });
            } else {
              toast.error('Sevkiyat silinirken bir hata oluştu.');
            }
          });
        });
      },
    });
  };

  const handleConvertToOrder = async (quote) => {
    await convertQuoteToOrder(user.uid, quote);
    const customerName = customers.find((c) => c.id === quote.customerId)?.name || '';
    logUserActivity('CONVERT_QUOTE_TO_ORDER', {
      message: `${customerName} müşterisinin teklifi siparişe dönüştürüldü`,
      amount: quote.total_amount,
    });
  };

  const handleDelivery = async (shipmentId) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (shipment) {
      await markShipmentDelivered(user.uid, shipmentId, shipment.orderId, user.email);
      const order = orders.find((o) => o.id === shipment.orderId);
      const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
      logUserActivity('MARK_SHIPMENT_DELIVERED', {
        message: `${customerName} müşterisinin sevkiyatı teslim edildi olarak işaretlendi`,
      });
    }
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
