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
            className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:scale-[1.01]'
            }`}
            title={`${children}${isActive ? ' (Şu anda aktif)' : ''}`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} aria-hidden="true" />
            <span className="flex-1 text-left font-medium">{children}</span>
            {badge > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg animate-pulse">
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
            w-64 bg-gradient-to-b from-gray-800 via-gray-800 to-gray-900 text-white flex flex-col
            fixed md:relative h-full z-50
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            shadow-2xl
        `} role="navigation" aria-label="Ana menü">
            <div className="flex flex-col flex-grow">
                {/* Simple Header */}
                <div className="mb-6 px-4 pt-6 pb-6 flex justify-between items-center border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                        {/* Logo Icon */}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                            Takip CRM
                        </h1>
                    </div>
                    {/* Mobilde kapat butonu */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                        aria-label="Menüyü Kapat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="flex flex-col gap-2 px-3 overflow-y-auto flex-1" role="navigation" aria-label="Sayfalar">
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

                    {/* Divider */}
                    <div className="my-2 border-t border-gray-700/50" />

                    {/* Guide Button */}
                    <button
                        onClick={onToggleGuide}
                        aria-label="Kullanıcı rehberi"
                        className="group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 min-h-[44px]"
                        title="Rehberi aç"
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                        <span className="flex-1 text-left font-medium">Rehber</span>
                    </button>
                </nav>
            </div>
            {/* Footer Section */}
            <div className="flex-shrink-0 px-3 pb-4 space-y-3">
                {/* Connection Status */}
                <div className="px-2">
                    <ConnectionStatusIndicator status={connectionStatus} />
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    aria-label="Çıkış yap"
                    className="group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-800 min-h-[44px] border border-gray-700 hover:border-red-500"
                    title="Uygulamadan çıkış yap"
                >
                    <LogoutIcon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                    <span className="flex-1 text-left font-medium">Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
};

// Memoize Sidebar to prevent unnecessary re-renders
export default memo(Sidebar);
