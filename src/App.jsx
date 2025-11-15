import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useFirestoreCollections } from './hooks/useFirestore';
import {
    saveDocument,
    saveOrder,
    saveQuote,
    convertQuoteToOrder,
    markShipmentDelivered,
    deleteDocument,
    undoDelete,
    logActivity
} from './services/firestoreService';
import { showUndoableDelete, showSmartConfirm } from './utils/toastUtils.jsx';

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
const Reports = lazy(() => import('./components/pages/Reports'));
const Admin = lazy(() => import('./components/pages/Admin'));
const PdfGenerator = lazy(() => import('./components/pages/PdfGenerator'));

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
    const [activePage, setActivePage] = useState('Anasayfa');
    const [editingDocument, setEditingDocument] = useState(null);
    const [showGuide, setShowGuide] = useState(false);
    const [overdueItems, setOverdueItems] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [prefilledQuote, setPrefilledQuote] = useState(null);

    const handleToggleGuide = () => {
        setShowGuide(!showGuide);
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
        'payments'
    ]);

    const customers = collections.customers || [];
    const products = collections.products || [];
    const orders = collections.orders || [];
    const shipments = collections.shipments || [];
    const teklifler = collections.teklifler || [];
    const gorusmeler = collections.gorusmeler || [];
    const customTasks = collections.customTasks || [];
    const payments = collections.payments || [];

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

        // Combine with other overdue items here in the future
        setOverdueItems(overdueMeetings);
    }, [gorusmeler, customers]);

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

        const orderId = await saveOrder(user.uid, data);
        logUserActivity(action, details);

        // Otomatik ödeme oluştur (sadece yeni sipariş için)
        if (isNewOrder && data.paymentType) {
            try {
                // Vade tarihini hesapla (timezone safe)
                const baseDate = data.delivery_date || data.order_date;
                const [year, month, day] = baseDate.split('-').map(Number);
                const dueDateObj = new Date(year, month - 1, day); // month is 0-indexed

                // Vadeli ise paymentTerm kadar gün ekle
                if (data.paymentType === 'Vadeli' && data.paymentTerm) {
                    dueDateObj.setDate(dueDateObj.getDate() + parseInt(data.paymentTerm));
                }

                // Format: YYYY-MM-DD
                const dueDate = dueDateObj.getFullYear() + '-' +
                    String(dueDateObj.getMonth() + 1).padStart(2, '0') + '-' +
                    String(dueDateObj.getDate()).padStart(2, '0');

                // Otomatik payment kaydı oluştur (sadece dolu alanlar)
                const paymentData = {
                    customerId: data.customerId,
                    customerName: customerName,
                    orderId: orderId, // saveOrder'dan dönen ID
                    amount: data.total_amount,
                    currency: data.currency || 'TRY',
                    paymentMethod: 'Belirtilmemiş',
                    dueDate: dueDate,
                    status: 'Bekliyor',
                    notes: `${data.paymentType} sipariş için otomatik oluşturuldu`,
                    createdBy: user.uid,
                    createdByEmail: user.email
                };

                // Opsiyonel alanları sadece dolu ise ekle
                if (data.orderNumber) {
                    paymentData.orderNumber = data.orderNumber;
                }

                await saveDocument(user.uid, 'payments', paymentData);
                console.log('✅ Otomatik ödeme oluşturuldu:', {
                    ...paymentData,
                    debug: {
                        baseDate,
                        paymentType: data.paymentType,
                        paymentTerm: data.paymentTerm,
                        calculatedDueDate: dueDate
                    }
                });
            } catch (error) {
                console.error('❌ Otomatik ödeme oluşturulamadı:', error);
                // Hata olsa bile sipariş kaydedildi, sadece log'la
            }
        }
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
            console.error('Sevkiyat kaydedilemedi:', error);
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
            console.error('Sevkiyat güncellenemedi:', error);
            toast.error('Sevkiyat güncellenemedi!');
        }
    };

    const handlePaymentSave = async (data) => {
        console.log('💰 Saving payment:', data);
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
        console.log('💾 Calling saveDocument for payments...');
        await saveDocument(user.uid, 'payments', data);
        console.log('✅ Payment saved successfully');
        logUserActivity(action, details);
        toast.success(`Ödeme başarıyla ${data.id ? 'güncellendi' : 'kaydedildi'}!`);
    };

    const handlePaymentDelete = (id) => {
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        deleteDocument(user.uid, 'payments', id).then(() => {
            logUserActivity('DELETE_PAYMENT', { message: `Ödeme silindi: ${payment.customerName} - ${payment.amount}` });
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
            await markShipmentDelivered(user.uid, shipmentId, shipment.orderId);
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
                        onQuoteSave={handleQuoteSave}
                        onOrderSave={handleOrderSave}
                        onMeetingSave={handleMeetingSave}
                        onProductSave={handleProductSave}
                        onShipmentUpdate={handleShipmentUpdate}
                        loading={dataLoading}
                    />
                );
            case 'Ürünler':
                return <Products products={products} onSave={handleProductSave} onDelete={handleProductDelete} loading={dataLoading} />;
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
                        onPrefilledQuoteConsumed={() => setPrefilledQuote(null)}
                        loading={dataLoading}
                    />
                );
            case 'Siparişler':
                return (
                    <Orders
                        orders={orders}
                        onSave={handleOrderSave}
                        onDelete={handleOrderDelete}
                        onShipment={handleShipmentSave}
                        customers={customers}
                        products={products}
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
                    />
                );
            case 'Sevkiyat':
                return <Shipments shipments={shipments} orders={orders} products={products} customers={customers} onDelivery={handleDelivery} onUpdate={handleShipmentUpdate} onDelete={handleShipmentDelete} loading={dataLoading} />;
            case 'Ödemeler':
                return <Payments payments={payments} customers={customers} orders={orders} onSave={handlePaymentSave} onDelete={handlePaymentDelete} loading={dataLoading} />;
            case 'Raporlar':
                return (
                    <Reports
                        orders={orders}
                        customers={customers}
                        teklifler={teklifler}
                        gorusmeler={gorusmeler}
                        shipments={shipments}
                        products={products}
                        onGuideClick={handleToggleGuide}
                    />
                );
            case 'Admin':
                return <Admin />;
            case 'belge-hazirla':
                return <PdfGenerator doc={editingDocument} customers={customers} products={products} />;
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
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto md:ml-0 pb-20 md:pb-4">
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
