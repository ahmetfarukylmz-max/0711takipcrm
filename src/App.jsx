import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
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
    cancelOrder
} from './services/firestoreService';
import { showUndoableDelete, showSmartConfirm } from './utils/toastUtils.jsx';
import { logger } from './utils/logger';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Modal from './components/common/Modal';
import UserGuide from './components/common/UserGuide';
import ErrorBoundary from './components/common/ErrorBoundary';
import BottomNav from './components/common/BottomNav';
import FAB from './components/common/FAB';
import PullToRefresh from './components/common/PullToRefresh';


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

const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-lg text-gray-600">
            <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            <span>Yükleniyor...</span>
        </div>
    </div>
);

const CrmApp = () => {
    const { user, loading } = useAuth();

    // Zustand store - replacing local state
    const activePage = useStore((state) => state.activePage);
    const setActivePage = useStore((state) => state.setActivePage);
    const editingDocument = useStore((state) => state.editingDocument);
    const setEditingDocument = useStore((state) => state.setEditingDocument);
    const showGuide = useStore((state) => state.showGuide);
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        toast.success('Veriler güncellendi');
    };

    // Handle FAB actions
    const handleFABAction = (action, customerId) => {
        // Handle viewCustomer action
        if (action === 'viewCustomer' && customerId) {
            setActivePage('Müşteriler');
            // Could store customerId to open detail modal, but for now just navigate
            return;
        }

        const actionMap = {
            'addCustomer': {
                page: 'Müşteriler',
                selector: '[data-action="add-customer"]'
            },
            'addProduct': {
                page: 'Ürünler',
                selector: '[data-action="add-product"]'
            },
            'addQuote': {
                page: 'Teklifler',
                selector: '[data-action="add-quote"]'
            },
            'addOrder': {
                page: 'Siparişler',
                selector: '[data-action="add-order"]'
            },
            'addMeeting': {
                page: 'Görüşmeler',
                selector: '[data-action="add-meeting"]'
            },
            'addShipment': {
                page: 'Sevkiyat',
                selector: '[data-action="add-shipment"]'
            }
        };

        const actionConfig = actionMap[action];
        if (!actionConfig) return;

        // If we're on the Dashboard, navigate to the appropriate page first
        if (activePage === 'Anasayfa') {
            setActivePage(actionConfig.page);
            // Wait for page to render, then trigger the add button
            setTimeout(() => {
                document.querySelector(actionConfig.selector)?.click();
            }, 300);
        } else {
            // If already on the page, just trigger the button
            document.querySelector(actionConfig.selector)?.click();
        }
    };

    // Fetch all collections
    const { collections, connectionStatus, loading: dataLoading } = useFirestoreCollections([
        'customers',
        'products',
        'orders',
        'shipments',
        'teklifler',
        'gorusmeler',
        'customTasks',
        'payments',
        'stock_movements'
    ]);

    // Sync Firestore data to Zustand store
    useEffect(() => {
        setCollections(collections);
        setConnectionStatus(connectionStatus);
        setDataLoading(dataLoading);
    }, [collections, connectionStatus, dataLoading, setCollections, setConnectionStatus, setDataLoading]);

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

        const overdueMeetings = (gorusmeler
            .filter(item => !item.isDeleted)
            .filter(meeting => {
                const nextActionDate = meeting.next_action_date ? new Date(meeting.next_action_date) : null;
                return nextActionDate && nextActionDate < today && meeting.status !== 'Tamamlandı' && meeting.status !== 'İptal Edildi';
            })
            .map(meeting => {
                const customer = customers.find(c => c.id === meeting.customerId);
                return { ...meeting, type: 'meeting', customerName: customer ? customer.name : 'Bilinmiyor' };
            })
        );

        // Use queueMicrotask to avoid React error #185 (updating state during render)
        queueMicrotask(() => {
            setOverdueItems(overdueMeetings);
        });
    }, [gorusmeler, customers, setOverdueItems]);

    // Handler functions
    const handleCustomerSave = async (data) => {
        const action = data.id ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER';
        const details = {
            message: `Müşteri ${data.id ? 'güncellendi': 'oluşturuldu'}: ${data.name}`,
            customerId: data.id
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
        const details = { message: `Ürün ${data.id ? 'güncellendi': 'oluşturuldu'}: ${data.name}` };
        // Add createdBy for new records
        if (!data.id) {
            data.createdBy = user.uid;
            data.createdByEmail = user.email;
        }
        await saveDocument(user.uid, 'products', data);
        logUserActivity(action, details);
    };
    const handleOrderSave = async (data) => {
        const customerName = customers.find(c => c.id === data.customerId)?.name || '';
        const action = data.id ? 'UPDATE_ORDER' : 'CREATE_ORDER';
        const details = {
            message: `${customerName} için sipariş ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
            amount: data.total_amount
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
        const customerName = customers.find(c => c.id === data.customerId)?.name || '';
        const action = data.id ? 'UPDATE_QUOTE' : 'CREATE_QUOTE';
        const details = {
            message: `${customerName} için teklif ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
            amount: data.total_amount
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
        const customerName = customers.find(c => c.id === data.customerId)?.name || '';
        const action = data.id ? 'UPDATE_MEETING' : 'CREATE_MEETING';
        const details = { message: `${customerName} ile görüşme ${data.id ? 'güncellendi' : 'oluşturuldu'}` };
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
            .filter(ip => ip.productId)
            .map(ip => {
                const product = products.find(p => p.id === ip.productId);
                if (!product) return null;

                return {
                    productId: ip.productId,
                    productName: ip.productName,
                    quantity: ip.quantity || 1,
                    unit: ip.unit || product.unit || 'Adet',
                    unitPrice: ip.priceQuoted || product.price || 0,
                    totalPrice: (ip.quantity || 1) * (ip.priceQuoted || product.price || 0)
                };
            })
            .filter(item => item !== null);

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
            currency: 'TRY'
        };

        // Set prefilled quote and navigate to Quotes page
        setPrefilledQuote(newQuote);
        setActivePage('Teklifler');
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
            const order = orders.find(o => o.id === shipmentData.orderId);
            const customerName = customers.find(c => c.id === order?.customerId)?.name || '';
            logUserActivity('CREATE_SHIPMENT', { message: `${customerName} müşterisinin siparişi için sevkiyat oluşturuldu` });
            toast.success('Sevkiyat başarıyla kaydedildi!');
        } catch (error) {
            logger.error('Sevkiyat kaydedilemedi:', error);
            toast.error('Sevkiyat kaydedilemedi!');
        }
    };

    const handleShipmentUpdate = async (shipmentData) => {
        try {
            await saveDocument(user.uid, 'shipments', shipmentData);
            const order = orders.find(o => o.id === shipmentData.orderId);
            const customerName = customers.find(c => c.id === order?.customerId)?.name || '';
            logUserActivity('UPDATE_SHIPMENT', { message: `${customerName} müşterisinin sevkiyatı güncellendi` });
            toast.success('Sevkiyat başarıyla güncellendi!');
        } catch (error) {
            logger.error('Sevkiyat güncellenemedi:', error);
            toast.error('Sevkiyat güncellenemedi!');
        }
    };

    const handlePaymentSave = async (data) => {
        const action = data.id ? 'UPDATE_PAYMENT' : 'CREATE_PAYMENT';
        const customerName = customers.find(c => c.id === data.customerId)?.name || '';

        // Build activity details - only include defined values
        const details = {
            message: `${customerName} için ödeme ${data.id ? 'güncellendi' : 'oluşturuldu'}`,
            amount: data.amount
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
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        const customerName = payment.customerName || 'Bilinmeyen müşteri';
        const relatedOrder = payment.orderId ? orders.find(o => o.id === payment.orderId) : null;

        showSmartConfirm({
            itemName: `${customerName} - Ödeme`,
            itemType: 'ödeme',
            relatedCount: relatedOrder ? 1 : 0,
            relatedType: relatedOrder ? 'sipariş ile ilişkili' : '',
            onConfirm: () => {
                deleteDocument(user.uid, 'payments', id).then(() => {
                    logUserActivity('DELETE_PAYMENT', { message: `Ödeme silindi: ${customerName} - ${payment.amount}` });
                    showUndoableDelete(
                        `${customerName} müşterisinin ödemesi silindi`,
                        () => {
                            undoDelete(user.uid, 'payments', id);
                            logUserActivity('UNDO_DELETE_PAYMENT', { message: `Ödeme geri alındı: ${customerName}` });
                        }
                    );
                });
            }
        });
    };

    // Delete handler functions
    const handleCustomerDelete = (id) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;

        const relatedOrders = orders.filter(o => o.customerId === id && !o.isDeleted).length;
        const relatedQuotes = teklifler.filter(t => t.customerId === id && !t.isDeleted).length;
        const relatedMeetings = gorusmeler.filter(m => m.customerId === id && !m.isDeleted).length;
        const totalRelated = relatedOrders + relatedQuotes + relatedMeetings;

        showSmartConfirm({
            itemName: customer.name,
            itemType: 'müşteri',
            relatedCount: totalRelated,
            relatedType: totalRelated > 0 ? `sipariş/teklif/görüşme` : '',
            onConfirm: () => {
                deleteDocument(user.uid, 'customers', id).then(() => {
                    logUserActivity('DELETE_CUSTOMER', { message: `Müşteri silindi: ${customer?.name}` });
                    showUndoableDelete(
                        `"${customer.name}" müşterisi silindi`,
                        () => {
                            undoDelete(user.uid, 'customers', id);
                            logUserActivity('UNDO_DELETE_CUSTOMER', { message: `Müşteri geri alındı: ${customer?.name}` });
                        }
                    );
                });
            }
        });
    };
    const handleProductDelete = (id) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const usedInOrders = orders.some(o =>
            !o.isDeleted && o.items && o.items.some(item => item.productId === id)
        );

        showSmartConfirm({
            itemName: product.name,
            itemType: 'ürün',
            relatedCount: usedInOrders ? 1 : 0,
            relatedType: usedInOrders ? 'siparişte kullanılıyor' : '',
            onConfirm: () => {
                deleteDocument(user.uid, 'products', id).then(() => {
                    logUserActivity('DELETE_PRODUCT', { message: `Ürün silindi: ${product?.name}` });
                    showUndoableDelete(
                        `"${product.name}" ürünü silindi`,
                        () => {
                            undoDelete(user.uid, 'products', id);
                            logUserActivity('UNDO_DELETE_PRODUCT', { message: `Ürün geri alındı: ${product?.name}` });
                        }
                    );
                });
            }
        });
    };
    const handleOrderDelete = (id) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;

        const customer = customers.find(c => c.id === order?.customerId);
        const customerName = customer?.name || 'Bilinmeyen müşteri';
        const relatedShipments = shipments.filter(s => s.orderId === id && !s.isDeleted).length;

        showSmartConfirm({
            itemName: `${customerName} - Sipariş`,
            itemType: 'sipariş',
            relatedCount: relatedShipments,
            relatedType: relatedShipments > 0 ? 'sevkiyat' : '',
            onConfirm: () => {
                deleteDocument(user.uid, 'orders', id).then(() => {
                    logUserActivity('DELETE_ORDER', { message: `${customerName} müşterisinin siparişi silindi` });
                    showUndoableDelete(
                        `${customerName} müşterisinin siparişi silindi`,
                        () => {
                            undoDelete(user.uid, 'orders', id);
                            logUserActivity('UNDO_DELETE_ORDER', { message: `Sipariş geri alındı: ${customerName}` });
                        }
                    );
                });
            }
        });
    };

    const handleOrderCancel = async (orderId, cancellationData) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const customer = customers.find(c => c.id === order?.customerId);
        const customerName = customer?.name || 'Bilinmeyen müşteri';

        try {
            const success = await cancelOrder(user.uid, orderId, {
                ...cancellationData,
                cancelledByEmail: user.email
            });

            if (success) {
                toast.success('Sipariş başarıyla iptal edildi');
                logUserActivity('CANCEL_ORDER', {
                    message: `${customerName} müşterisinin siparişi iptal edildi`,
                    orderId: orderId,
                    reason: cancellationData.reason,
                    amount: order.total_amount
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
        const quote = teklifler.find(q => q.id === id);
        if (!quote) return;

        const customer = customers.find(c => c.id === quote?.customerId);
        const customerName = customer?.name || 'Bilinmeyen müşteri';

        showSmartConfirm({
            itemName: `${customerName} - Teklif`,
            itemType: 'teklif',
            onConfirm: () => {
                deleteDocument(user.uid, 'teklifler', id).then(() => {
                    logUserActivity('DELETE_QUOTE', { message: `${customerName} müşterisinin teklifi silindi` });
                    showUndoableDelete(
                        `${customerName} müşterisinin teklifi silindi`,
                        () => {
                            undoDelete(user.uid, 'teklifler', id);
                            logUserActivity('UNDO_DELETE_QUOTE', { message: `Teklif geri alındı: ${customerName}` });
                        }
                    );
                });
            }
        });
    };
    const handleMeetingDelete = (id) => {
        const meeting = gorusmeler.find(m => m.id === id);
        if (!meeting) return;

        const customer = customers.find(c => c.id === meeting?.customerId);
        const customerName = customer?.name || 'Bilinmeyen müşteri';

        showSmartConfirm({
            itemName: `${customerName} - Görüşme`,
            itemType: 'görüşme',
            onConfirm: () => {
                deleteDocument(user.uid, 'gorusmeler', id).then(() => {
                    logUserActivity('DELETE_MEETING', { message: `${customerName} müşterisiyle olan görüşme silindi` });
                    showUndoableDelete(
                        `${customerName} müşterisiyle olan görüşme silindi`,
                        () => {
                            undoDelete(user.uid, 'gorusmeler', id);
                            logUserActivity('UNDO_DELETE_MEETING', { message: `Görüşme geri alındı: ${customerName}` });
                        }
                    );
                });
            }
        });
    };
    const handleShipmentDelete = (id) => {
        const shipment = shipments.find(s => s.id === id);
        if (!shipment) return;

        const order = orders.find(o => o.id === shipment?.orderId);
        const customer = customers.find(c => c.id === order?.customerId);
        const customerName = customer?.name || 'Bilinmeyen müşteri';

        showSmartConfirm({
            itemName: `${customerName} - Sevkiyat`,
            itemType: 'sevkiyat',
            onConfirm: () => {
                deleteDocument(user.uid, 'shipments', id).then(() => {
                    logUserActivity('DELETE_SHIPMENT', { message: `${customerName} müşterisinin sevkiyatı silindi` });
                    showUndoableDelete(
                        `${customerName} müşterisinin sevkiyatı silindi`,
                        () => {
                            undoDelete(user.uid, 'shipments', id);
                            logUserActivity('UNDO_DELETE_SHIPMENT', { message: `Sevkiyat geri alındı: ${customerName}` });
                        }
                    );
                });
            }
        });
    };

    const handleConvertToOrder = async (quote) => {
        await convertQuoteToOrder(user.uid, quote);
        const customerName = customers.find(c => c.id === quote.customerId)?.name || '';
        logUserActivity('CONVERT_QUOTE_TO_ORDER', { 
            message: `${customerName} müşterisinin teklifi siparişe dönüştürüldü`,
            amount: quote.total_amount
        });
    };

    const handleDelivery = async (shipmentId) => {
        const shipment = shipments.find(s => s.id === shipmentId);
        if (shipment) {
            await markShipmentDelivered(user.uid, shipmentId, shipment.orderId, user.email);
            const order = orders.find(o => o.id === shipment.orderId);
            const customerName = customers.find(c => c.id === order?.customerId)?.name || '';
            logUserActivity('MARK_SHIPMENT_DELIVERED', { message: `${customerName} müşterisinin sevkiyatı teslim edildi olarak işaretlendi` });
        }
    };

    const handleGeneratePdf = (doc) => {
        setEditingDocument(doc);
        setActivePage('belge-hazirla');
    };

    // Render page based on activePage state
    const renderPage = () => {
        switch (activePage) {
            case 'Anasayfa':
                return (
                    <Dashboard
                        customers={customers}
                        orders={orders}
                        teklifler={teklifler}
                        gorusmeler={gorusmeler}
                        products={products}
                        shipments={shipments}
                        overdueItems={overdueItems}
                        customTasks={customTasks}
                        setActivePage={setActivePage}
                        onMeetingSave={handleMeetingSave}
                        onCustomTaskSave={handleCustomTaskSave}
                        onScheduleMeeting={(customerId) => setSelectedCustomerId(customerId)}
                        loading={dataLoading}
                    />
                );
            case 'Müşteriler':
                return (
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
                        setActivePage={setActivePage}
                        loading={dataLoading}
                    />
                );
            case 'Ürünler':
                return (
                    <Products
                        products={products}
                        orders={orders}
                        quotes={teklifler}
                        customers={customers}
                        onSave={handleProductSave}
                        onDelete={handleProductDelete}
                        loading={dataLoading}
                    />
                );
            case 'Teklifler':
                return (
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
                );
            case 'Siparişler':
                return (
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
                            const payment = payments.find(p => p.id === paymentId);
                            if (payment) {
                                const today = new Date().toISOString().split('T')[0];
                                handlePaymentSave({ ...payment, status: 'Tahsil Edildi', paidDate: today });
                                toast.success('Ödeme tahsil edildi olarak işaretlendi!');
                            }
                        }}
                        onGoToPayment={(paymentId) => {
                            setSelectedPaymentId(paymentId);
                            setActivePage('Ödemeler');
                        }}
                        onGeneratePdf={handleGeneratePdf}
                        loading={dataLoading}
                    />
                );
            case 'Görüşmeler':
                return (
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
                );
            case 'Sevkiyat':
                return <Shipments shipments={shipments} orders={orders} products={products} customers={customers} onDelivery={handleDelivery} onUpdate={handleShipmentUpdate} onDelete={handleShipmentDelete} onGeneratePdf={handleGeneratePdf} loading={dataLoading} />;
            case 'Ödemeler':
                return (
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
                );
            case 'Cari Hesaplar':
                return (
                    <Balances
                        customers={customers}
                        orders={orders}
                        payments={payments}
                        onCustomerClick={() => {
                            // Navigate to customer detail
                            setActivePage('Müşteriler');
                            // The click will be handled by Customers page
                        }}
                    />
                );
            case 'Raporlar':
                return (
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
                );
            case 'Lot Yönetimi':
                return <StockLotManagement />;
            case 'Uzlaştırma':
                return <LotReconciliation />;
            case 'Admin':
                return <Admin />;
            case 'belge-hazirla':
                return <PdfGenerator doc={editingDocument} customers={customers} products={products} orders={orders} shipments={shipments} />;
            default:
                return (
                    <Dashboard
                        customers={customers}
                        orders={orders}
                        teklifler={teklifler}
                        gorusmeler={gorusmeler}
                        products={products}
                        shipments={shipments}
                        overdueItems={overdueItems}
                        customTasks={customTasks}
                        setActivePage={setActivePage}
                        onMeetingSave={handleMeetingSave}
                        onCustomTaskSave={handleCustomTaskSave}
                        onScheduleMeeting={(customerId) => setSelectedCustomerId(customerId)}
                        loading={dataLoading}
                    />
                );
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <LoginScreen />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <Toaster position="top-right" />

            {/* Sidebar - Sadece Desktop'ta Görünür */}
            <div className="hidden md:block">
                <Sidebar
                    activePage={activePage}
                    setActivePage={setActivePage}
                    connectionStatus={connectionStatus}
                    onToggleGuide={handleToggleGuide}
                    overdueItems={overdueItems}
                    isOpen={true}
                    onClose={() => {}}
                />
            </div>
            <main className="flex-1 h-full p-4 sm:p-6 lg:p-8 overflow-y-auto md:ml-0 pb-20 md:pb-4">
                <PullToRefresh onRefresh={handleRefresh}>
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                            <div className="flex items-center gap-3 text-lg text-gray-600 dark:text-gray-400">
                                <svg
                                    className="animate-spin h-5 w-5 text-blue-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                <span>Yükleniyor...</span>
                            </div>
                        </div>
                    }>
                        {renderPage()}
                    </Suspense>
                </PullToRefresh>
            </main>

            {/* Mobile Navigation Components */}
            <BottomNav activePage={activePage} setActivePage={setActivePage} onToggleGuide={handleToggleGuide} />
            <FAB activePage={activePage} onAction={handleFABAction} customers={customers} />
            {showGuide && (
                <Modal show={showGuide} onClose={handleToggleGuide} title="Kullanıcı Rehberi" maxWidth="max-w-7xl">
                    <UserGuide />
                </Modal>
            )}
        </div>
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
