import React from 'react';
import { PlusIcon } from '../icons';

const FAB = ({ activePage, onAction }) => {
    const fabActions = {
        'Müşteriler': { label: 'Müşteri Ekle', action: 'addCustomer' },
        'Ürünler': { label: 'Ürün Ekle', action: 'addProduct' },
        'Teklifler': { label: 'Teklif Ekle', action: 'addQuote' },
        'Siparişler': { label: 'Sipariş Ekle', action: 'addOrder' },
        'Görüşmeler': { label: 'Görüşme Ekle', action: 'addMeeting' },
        'Sevkiyat': { label: 'Sevkiyat Ekle', action: 'addShipment' },
    };

    const currentAction = fabActions[activePage];

    // Don't show FAB on pages without add actions
    if (!currentAction) {
        return null;
    }

    return (
        <button
            onClick={() => onAction(currentAction.action)}
            className="md:hidden fixed right-4 bottom-20 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            aria-label={currentAction.label}
            title={currentAction.label}
        >
            <PlusIcon className="w-6 h-6" />
        </button>
    );
};

export default FAB;
