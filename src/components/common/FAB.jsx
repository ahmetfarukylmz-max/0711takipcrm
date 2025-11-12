import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon, TruckIcon } from '../icons';
import ActionSheet from './ActionSheet';

const FAB = ({ activePage, onAction, customers = [] }) => {
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showRecentCustomers, setShowRecentCustomers] = useState(false);
    const longPressTimer = useRef(null);
    const [isLongPress, setIsLongPress] = useState(false);

    const fabActions = {
        'Müşteriler': { label: 'Müşteri Ekle', action: 'addCustomer' },
        'Ürünler': { label: 'Ürün Ekle', action: 'addProduct' },
        'Teklifler': { label: 'Teklif Ekle', action: 'addQuote' },
        'Siparişler': { label: 'Sipariş Ekle', action: 'addOrder' },
        'Görüşmeler': { label: 'Görüşme Ekle', action: 'addMeeting' },
        'Sevkiyat': { label: 'Sevkiyat Ekle', action: 'addShipment' },
    };

    // Get recent customers (last 5 active customers)
    const recentCustomers = customers
        .filter(c => !c.isDeleted)
        .slice(0, 5);

    // Quick actions for Dashboard
    const dashboardActions = [
        {
            label: 'Müşteri Ekle',
            onPress: () => onAction('addCustomer'),
            icon: <UsersIcon className="w-6 h-6" />
        },
        {
            label: 'Ürün Ekle',
            onPress: () => onAction('addProduct'),
            icon: <TruckIcon className="w-6 h-6" />
        },
        {
            label: 'Teklif Oluştur',
            onPress: () => onAction('addQuote'),
            icon: <DocumentTextIcon className="w-6 h-6" />
        },
        {
            label: 'Sipariş Ekle',
            onPress: () => onAction('addOrder'),
            icon: <ClipboardListIcon className="w-6 h-6" />
        },
        {
            label: 'Görüşme Planla',
            onPress: () => onAction('addMeeting'),
            icon: <CalendarIcon className="w-6 h-6" />
        }
    ];

    // Recent customers actions
    const recentCustomersActions = recentCustomers.map(customer => ({
        label: customer.name,
        subtitle: customer.city || customer.phone,
        onPress: () => {
            // For now, just navigate to customers page
            // Could be enhanced to open customer detail directly
            onAction('viewCustomer', customer.id);
        },
        icon: <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    }));

    // Long press handlers
    const handleTouchStart = () => {
        setIsLongPress(false);
        longPressTimer.current = setTimeout(() => {
            setIsLongPress(true);
            setShowActionSheet(true);
            // Haptic feedback on supported devices
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }

        // If it wasn't a long press, treat as normal click
        if (!isLongPress) {
            handleFABClick();
        }
        setIsLongPress(false);
    };

    const handleFABClick = () => {
        if (activePage === 'Anasayfa') {
            // On Dashboard, show action sheet with multiple options
            setShowActionSheet(true);
        } else {
            // On other pages, trigger single action
            const currentAction = fabActions[activePage];
            if (currentAction) {
                onAction(currentAction.action);
            }
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    const currentAction = fabActions[activePage];

    // Show FAB on Dashboard or pages with add actions
    if (!currentAction && activePage !== 'Anasayfa') {
        return null;
    }

    // Combine actions for dashboard: main actions + recent customers link
    const combinedDashboardActions = [
        ...dashboardActions,
        ...(recentCustomersActions.length > 0 ? [
            {
                label: 'Son Müşteriler',
                subtitle: `${recentCustomers.length} müşteri`,
                onPress: () => {
                    setShowActionSheet(false);
                    setTimeout(() => setShowRecentCustomers(true), 100);
                },
                icon: <UsersIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            }
        ] : [])
    ];

    return (
        <>
            <button
                onClick={handleFABClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={() => {
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                    }
                    setIsLongPress(false);
                }}
                className={`md:hidden fixed right-4 bottom-20 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full min-w-[56px] min-h-[56px] w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isLongPress ? 'scale-110' : 'active:scale-95'
                }`}
                aria-label={activePage === 'Anasayfa' ? 'Hızlı İşlemler' : currentAction?.label}
                title={`Tıkla: ${activePage === 'Anasayfa' ? 'Hızlı işlemler' : currentAction?.label} | Basılı Tut: Hızlı menü`}
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {/* Main Action Sheet */}
            <ActionSheet
                show={showActionSheet}
                onClose={() => setShowActionSheet(false)}
                title={activePage === 'Anasayfa' ? 'Hızlı İşlemler' : 'Hızlı Menü'}
                actions={activePage === 'Anasayfa' ? combinedDashboardActions : dashboardActions}
            />

            {/* Recent Customers Sheet */}
            {recentCustomersActions.length > 0 && (
                <ActionSheet
                    show={showRecentCustomers}
                    onClose={() => setShowRecentCustomers(false)}
                    title="Son Müşteriler"
                    actions={recentCustomersActions}
                />
            )}
        </>
    );
};

export default FAB;
