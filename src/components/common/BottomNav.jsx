import React from 'react';
import { HomeIcon, UsersIcon, BoxIcon, ClipboardListIcon, ChartBarIcon } from '../icons';

const BottomNav = ({ activePage, setActivePage }) => {
    const navItems = [
        { page: 'Anasayfa', label: 'Ana', Icon: HomeIcon },
        { page: 'Müşteriler', label: 'Müşteri', Icon: UsersIcon },
        { page: 'Ürünler', label: 'Ürün', Icon: BoxIcon },
        { page: 'Siparişler', label: 'Sipariş', Icon: ClipboardListIcon },
        { page: 'Raporlar', label: 'Rapor', Icon: ChartBarIcon },
    ];

    return (
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
            </div>
        </nav>
    );
};

export default BottomNav;
