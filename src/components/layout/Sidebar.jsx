import React, { useMemo, useCallback, memo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { logUserActivity } from '../../utils/loginTracking';
import ConnectionStatusIndicator from '../common/ConnectionStatusIndicator';

import {
    HomeIcon,
    UsersIcon,
    BoxIcon,
    DocumentTextIcon,
    ClipboardListIcon,
    CalendarIcon,
    TruckIcon,
    CreditCardIcon,
    ScaleIcon,
    LogoutIcon,
    QuestionMarkCircleIcon,
    ShieldIcon
} from '../icons';

const ChartBarIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

// Memoized NavLink component for better performance
const NavLink = memo(({ page, children, Icon, activePage, onNavigate, badge }) => {
    const isActive = activePage === page;

    return (
        <button
            onClick={() => onNavigate(page)}
            aria-label={children}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title={`${children}${isActive ? ' (Şu anda aktif)' : ''}`}
        >
            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">{children}</span>
            {badge > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );
});

NavLink.displayName = 'NavLink';

const Sidebar = ({ activePage, setActivePage, connectionStatus, onToggleGuide, overdueItems, isOpen, onClose }) => {
    const { user, isAdmin } = useAuth();

    // Memoized logout handler
    const handleLogout = useCallback(async () => {
        // Log logout activity before signing out
        if (user) {
            await logUserActivity(user.uid, user.email, 'logout');
        }
        await signOut(auth);
    }, [user]);

    // Memoized navigation handler
    const handleNavClick = useCallback((page) => {
        setActivePage(page);
        // Mobilde menüyü kapat
        if (onClose && window.innerWidth < 768) {
            onClose();
        }
    }, [setActivePage, onClose]);

    // Navigation items configuration with badges
    const navigationItems = useMemo(() => {
        const items = [
            { page: 'Anasayfa', label: 'Anasayfa', Icon: HomeIcon, badge: 0 },
            { page: 'Müşteriler', label: 'Müşteriler', Icon: UsersIcon, badge: 0 },
            { page: 'Ürünler', label: 'Ürünler', Icon: BoxIcon, badge: 0 },
            { page: 'Teklifler', label: 'Teklifler', Icon: DocumentTextIcon, badge: 0 },
            { page: 'Siparişler', label: 'Siparişler', Icon: ClipboardListIcon, badge: 0 },
            { page: 'Görüşmeler', label: 'Görüşmeler', Icon: CalendarIcon, badge: 0 },
            { page: 'Sevkiyat', label: 'Sevkiyat', Icon: TruckIcon, badge: 0 },
            { page: 'Ödemeler', label: 'Ödemeler', Icon: CreditCardIcon, badge: overdueItems?.payments || 0 },
            { page: 'Cari Hesaplar', label: 'Cari Hesaplar', Icon: ScaleIcon, badge: 0 },
            { page: 'Raporlar', label: 'Raporlar', Icon: ChartBarIcon, badge: 0 },
        ];

        // Add admin panel if user is admin
        if (isAdmin()) {
            items.push({ page: 'Admin', label: 'Admin Paneli', Icon: ShieldIcon, badge: 0 });
        }

        return items;
    }, [isAdmin, overdueItems]);

    return (
        <aside className={`
            w-64 bg-gray-800 dark:bg-gray-900 text-white flex flex-col p-4
            fixed md:relative h-full z-50
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `} role="navigation" aria-label="Ana menü">
            <div className="flex flex-col flex-grow">
                <div className="mb-10 border-b border-gray-700 pb-4 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-white">Takip CRM</h1>
                    {/* Mobilde kapat butonu */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-gray-300 hover:text-white"
                        aria-label="Menüyü Kapat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="flex flex-col gap-2" role="navigation" aria-label="Sayfalar">
                    {navigationItems.map(({ page, label, Icon, badge }) => (
                        <NavLink
                            key={page}
                            page={page}
                            Icon={Icon}
                            activePage={activePage}
                            onNavigate={handleNavClick}
                            badge={badge}
                        >
                            {label}
                        </NavLink>
                    ))}
                    <button
                        onClick={onToggleGuide}
                        aria-label="Kullanıcı rehberi"
                        className="w-full flex items-center gap-3 px-4 py-2 mt-2 rounded-md transition-colors text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset min-h-[44px]"
                        title="Rehberi aç"
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        <span className="flex-1 text-left">Rehber</span>
                    </button>
                </nav>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleLogout}
                    aria-label="Çıkış yap"
                    className="w-full flex items-center gap-3 px-4 py-2 mb-2 rounded-md transition-colors text-gray-300 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset min-h-[44px]"
                    title="Uygulamadan çıkış yap"
                >
                    <LogoutIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-left">Çıkış Yap</span>
                </button>
                <ConnectionStatusIndicator status={connectionStatus} />
            </div>
        </aside>
    );
};

// Memoize Sidebar to prevent unnecessary re-renders
export default memo(Sidebar);
