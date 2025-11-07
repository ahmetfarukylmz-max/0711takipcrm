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
    logActivity
} from './services/firestoreService';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Modal from './components/common/Modal';
import Guide from './components/common/Guide';
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
const Reports = lazy(() => import('./components/pages/Reports'));
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
    const handleFABAction = (action) => {
        // Trigger the appropriate action based on the current page
        // This will be handled by each page component through their existing "Add" buttons
        const addButtons = {
            'addCustomer': () => document.querySelector('[data-action="add-customer"]')?.click(),
            'addProduct': () => document.querySelector('[data-action="add-product"]')?.click(),
            'addQuote': () => document.querySelector('[data-action="add-quote"]')?.click(),
            'addOrder': () => document.querySelector('[data-action="add-order"]')?.click(),
            'addMeeting': () => document.querySelector('[data-action="add-meeting"]')?.click(),
            'addShipment': () => document.querySelector('[data-action="add-shipment"]')?.click(),
        };

        if (addButtons[action]) {
            addButtons[action]();
        }
    };

    // Fetch all collections
    const { collections, connectionStatus } = useFirestoreCollections([
        'customers',
        'products',
        'orders',
        'shipments',
        'teklifler',
        'gorusmeler'
    ]);

    const customers = collections.customers || [];
    const products = collections.products || [];
    const orders = collections.orders || [];
    const shipments = collections.shipments || [];
    const teklifler = collections.teklifler || [];
    const gorusmeler = collections.gorusmeler || [];

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
        await saveDocument(user.uid, 'customers', data);
        logUserActivity(action, details);
    };
    const handleProductSave = async (data) => {
        const action = data.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT';
        const details = { message: `Ürün ${data.id ? 'güncellendi': 'oluşturuldu'}: ${data.name}` };
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
        await saveQuote(user.uid, data);
        logUserActivity(action, details);
    };
    const handleMeetingSave = async (data) => {
        const customerName = customers.find(c => c.id === data.customerId)?.name || '';
        const action = data.id ? 'UPDATE_MEETING' : 'CREATE_MEETING';
        const details = { message: `${customerName} ile görüşme ${data.id ? 'güncellendi' : 'oluşturuldu'}` };
        await saveDocument(user.uid, 'gorusmeler', data);
        logUserActivity(action, details);
    };

    // Shipment handler
    const handleShipmentSave = async (shipmentData) => {
        try {
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

    // Delete handler functions
    const handleCustomerDelete = (id) => {
        const customer = customers.find(c => c.id === id);
        deleteDocument(user.uid, 'customers', id).then(() => {
            logUserActivity('DELETE_CUSTOMER', { message: `Müşteri silindi: ${customer?.name}` });
        });
    };
    const handleProductDelete = (id) => {
        const product = products.find(p => p.id === id);
        deleteDocument(user.uid, 'products', id).then(() => {
            logUserActivity('DELETE_PRODUCT', { message: `Ürün silindi: ${product?.name}` });
        });
    };
    const handleOrderDelete = (id) => {
        const order = orders.find(o => o.id === id);
        const customerName = customers.find(c => c.id === order?.customerId)?.name || '';
        deleteDocument(user.uid, 'orders', id).then(() => {
            logUserActivity('DELETE_ORDER', { message: `${customerName} müşterisinin siparişi silindi` });
        });
    };
    const handleQuoteDelete = (id) => {
        const quote = teklifler.find(q => q.id === id);
        const customerName = customers.find(c => c.id === quote?.customerId)?.name || '';
        deleteDocument(user.uid, 'teklifler', id).then(() => {
            logUserActivity('DELETE_QUOTE', { message: `${customerName} müşterisinin teklifi silindi` });
        });
    };
    const handleMeetingDelete = (id) => {
        const meeting = gorusmeler.find(m => m.id === id);
        const customerName = customers.find(c => c.id === meeting?.customerId)?.name || '';
        deleteDocument(user.uid, 'gorusmeler', id).then(() => {
            logUserActivity('DELETE_MEETING', { message: `${customerName} müşterisiyle olan görüşme silindi` });
        });
    };
    const handleShipmentDelete = (id) => {
        const shipment = shipments.find(s => s.id === id);
        const order = orders.find(o => o.id === shipment?.orderId);
        const customerName = customers.find(c => c.id === order?.customerId)?.name || '';
        deleteDocument(user.uid, 'shipments', id).then(() => {
            logUserActivity('DELETE_SHIPMENT', { message: `${customerName} müşterisinin sevkiyatı silindi` });
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
                        overdueItems={overdueItems}
                        setActivePage={setActivePage}
                        onMeetingSave={handleMeetingSave}
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
                        onShipmentUpdate={handleShipmentUpdate}
                    />
                );
            case 'Ürünler':
                return <Products products={products} onSave={handleProductSave} onDelete={handleProductDelete} />;
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
                    />
                );
            case 'Görüşmeler':
                return (
                    <Meetings
                        meetings={gorusmeler}
                        customers={customers}
                        onSave={handleMeetingSave}
                        onDelete={handleMeetingDelete}
                        onCustomerSave={handleCustomerSave}
                    />
                );
            case 'Sevkiyat':
                return <Shipments shipments={shipments} orders={orders} products={products} customers={customers} onDelivery={handleDelivery} onUpdate={handleShipmentUpdate} onDelete={handleShipmentDelete} />;
            case 'Raporlar':
                return (
                    <Reports
                        orders={orders}
                        customers={customers}
                        teklifler={teklifler}
                        gorusmeler={gorusmeler}
                        shipments={shipments}
                        products={products}
                    />
                );
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
                        overdueItems={overdueItems}
                        setActivePage={setActivePage}
                        onMeetingSave={handleMeetingSave}
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

            {/* Hamburger Menü Butonu - Sadece Mobilde */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-[60] bg-gray-800 dark:bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
                aria-label="Menüyü Aç"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                </svg>
            </button>

            {/* Overlay - Mobilde Sidebar açıkken arka planı karart */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Menüyü Kapat"
                />
            )}

            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                connectionStatus={connectionStatus}
                onToggleGuide={handleToggleGuide}
                overdueItems={overdueItems}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
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
            <BottomNav activePage={activePage} setActivePage={setActivePage} />
            <FAB activePage={activePage} onAction={handleFABAction} />
            {showGuide && (
                <Modal show={showGuide} onClose={handleToggleGuide} title="Kullanıcı Rehberi">
                    <Guide />
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
