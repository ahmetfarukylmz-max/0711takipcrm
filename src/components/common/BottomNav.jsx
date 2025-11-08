import React, { useState } from 'react';
import { HomeIcon, UsersIcon, BoxIcon, ClipboardListIcon, MenuIcon, DocumentTextIcon, CalendarIcon, TruckIcon, ChartBarIcon, QuestionIcon } from '../icons';
import ActionSheet from './ActionSheet';
import { useAuth } from '../../context/AuthContext';

const BottomNav = ({ activePage, setActivePage, onToggleGuide }) => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const { logout } = useAuth();

    const navItems = [
        { page: 'Anasayfa', label: 'Ana', Icon: HomeIcon },
        { page: 'Müşteriler', label: 'Müşteri', Icon: UsersIcon },
        { page: 'Ürünler', label: 'Ürün', Icon: BoxIcon },
        { page: 'Siparişler', label: 'Sipariş', Icon: ClipboardListIcon },
    ];

    const moreItems = [
        {
            label: 'Teklifler',
            onPress: () => setActivePage('Teklifler'),
            icon: <DocumentTextIcon className="w-6 h-6" />
        },
        {
            label: 'Görüşmeler',
            onPress: () => setActivePage('Görüşmeler'),
            icon: <CalendarIcon className="w-6 h-6" />
        },
        {
            label: 'Sevkiyat',
            onPress: () => setActivePage('Sevkiyat'),
            icon: <TruckIcon className="w-6 h-6" />
        },
        {
            label: 'Raporlar',
            onPress: () => setActivePage('Raporlar'),
            icon: <ChartBarIcon className="w-6 h-6" />
        },
        {
            label: 'Kullanıcı Rehberi',
            onPress: () => {
                if (onToggleGuide) onToggleGuide();
            },
            icon: <QuestionIcon className="w-6 h-6" />
        },
    ];

    const morePages = ['Teklifler', 'Görüşmeler', 'Sevkiyat', 'Raporlar'];
    const isMoreActive = morePages.includes(activePage);

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {navItems.map(({ page, label, Icon }) => (
                        <button
                            key={page}
                            onClick={() => setActivePage(page)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                                activePage === page
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 transition-transform ${
                                activePage === page ? 'scale-110' : ''
                            }`} />
                            <span className={`text-xs font-medium ${
                                activePage === page ? 'font-semibold' : ''
                            }`}>
                                {label}
                            </span>
                            {activePage === page && (
                                <div className="absolute bottom-0 h-0.5 w-12 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                            )}
                        </button>
                    ))}

                    {/* Daha Fazla Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                            isMoreActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        <MenuIcon className={`w-6 h-6 mb-1 transition-transform ${
                            isMoreActive ? 'scale-110' : ''
                        }`} />
                        <span className={`text-xs font-medium ${
                            isMoreActive ? 'font-semibold' : ''
                        }`}>
                            Daha Fazla
                        </span>
                        {isMoreActive && (
                            <div className="absolute bottom-0 h-0.5 w-12 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                        )}
                    </button>
                </div>
            </nav>

            <ActionSheet
                show={showMoreMenu}
                onClose={() => setShowMoreMenu(false)}
                title="Daha Fazla"
                actions={moreItems}
            />
        </>
    );
};

export default BottomNav;
