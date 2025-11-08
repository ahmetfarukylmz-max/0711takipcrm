import React, { useState } from 'react';
import { PlusIcon, UsersIcon, ClipboardListIcon, DocumentTextIcon, CalendarIcon } from '../icons';
import ActionSheet from './ActionSheet';

const FAB = ({ activePage, onAction }) => {
    const [showActionSheet, setShowActionSheet] = useState(false);

    const fabActions = {
        'Müşteriler': { label: 'Müşteri Ekle', action: 'addCustomer' },
        'Ürünler': { label: 'Ürün Ekle', action: 'addProduct' },
        'Teklifler': { label: 'Teklif Ekle', action: 'addQuote' },
        'Siparişler': { label: 'Sipariş Ekle', action: 'addOrder' },
        'Görüşmeler': { label: 'Görüşme Ekle', action: 'addMeeting' },
        'Sevkiyat': { label: 'Sevkiyat Ekle', action: 'addShipment' },
    };

    // Quick actions for Dashboard
    const dashboardActions = [
        {
            label: 'Müşteri Ekle',
            onPress: () => onAction('addCustomer'),
            icon: <UsersIcon className="w-6 h-6" />
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

    const currentAction = fabActions[activePage];

    // Show FAB on Dashboard or pages with add actions
    if (!currentAction && activePage !== 'Anasayfa') {
        return null;
    }

    return (
        <>
            <button
                onClick={handleFABClick}
                className="md:hidden fixed right-4 bottom-20 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full min-w-[56px] min-h-[56px] w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
                aria-label={activePage === 'Anasayfa' ? 'Hızlı İşlemler' : currentAction?.label}
                title={activePage === 'Anasayfa' ? 'Hızlı İşlemler' : currentAction?.label}
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {activePage === 'Anasayfa' && (
                <ActionSheet
                    show={showActionSheet}
                    onClose={() => setShowActionSheet(false)}
                    title="Hızlı İşlemler"
                    actions={dashboardActions}
                />
            )}
        </>
    );
};

export default FAB;
