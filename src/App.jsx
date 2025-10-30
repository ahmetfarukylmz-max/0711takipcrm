import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useFirestoreCollections } from './hooks/useFirestore';
import {
    saveDocument,
    saveOrder,
    saveQuote,
    convertQuoteToOrder,
    markShipmentDelivered
} from './services/firestoreService';

// Layout Components
import Sidebar from './components/layout/Sidebar';

// Page Components
import LoginScreen from './components/pages/LoginScreen';
import Dashboard from './components/pages/Dashboard';
import Customers from './components/pages/Customers';
import Products from './components/pages/Products';
import Orders from './components/pages/Orders';
import Quotes from './components/pages/Quotes';
import Meetings from './components/pages/Meetings';
import Shipments from './components/pages/Shipments';

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

    // Handler functions
    const handleCustomerSave = (data) => saveDocument(user.uid, 'customers', data);
    const handleProductSave = (data) => saveDocument(user.uid, 'products', data);
    const handleOrderSave = (data) => saveOrder(user.uid, data);
    const handleQuoteSave = (data) => saveQuote(user.uid, data);
    const handleMeetingSave = (data) => saveDocument(user.uid, 'gorusmeler', data);

    const handleConvertToOrder = async (quote) => {
        await convertQuoteToOrder(user.uid, quote);
    };

    const handleDelivery = async (shipmentId) => {
        const shipment = shipments.find(s => s.id === shipmentId);
        if (shipment) {
            await markShipmentDelivered(user.uid, shipmentId, shipment.orderId);
        }
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
                    />
                );
            case 'Müşteriler':
                return <Customers customers={customers} onSave={handleCustomerSave} />;
            case 'Ürünler':
                return <Products products={products} onSave={handleProductSave} />;
            case 'Teklifler':
                return (
                    <Quotes
                        quotes={teklifler}
                        onSave={handleQuoteSave}
                        onConvertToOrder={handleConvertToOrder}
                        customers={customers}
                        products={products}
                    />
                );
            case 'Siparişler':
                return (
                    <Orders
                        orders={orders}
                        onSave={handleOrderSave}
                        customers={customers}
                        products={products}
                    />
                );
            case 'Görüşmeler':
                return (
                    <Meetings
                        meetings={gorusmeler}
                        customers={customers}
                        onSave={handleMeetingSave}
                        onCustomerSave={handleCustomerSave}
                    />
                );
            case 'Sevkiyat':
                return <Shipments shipments={shipments} onDelivery={handleDelivery} />;
            default:
                return (
                    <Dashboard
                        customers={customers}
                        orders={orders}
                        teklifler={teklifler}
                        gorusmeler={gorusmeler}
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
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                connectionStatus={connectionStatus}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <CrmApp />
        </AuthProvider>
    );
}
