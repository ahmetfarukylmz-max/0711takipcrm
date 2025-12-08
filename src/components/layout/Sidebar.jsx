import React, { useMemo, useCallback, memo, useState, useEffect } from 'react';
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
  ShieldIcon,
} from '../icons';

const ShoppingCartIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ChartBarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const CubeIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const AdjustmentsIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
    />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
      className={`group w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:scale-[1.01]'
      }`}
      title={`${children}${isActive ? ' (Şu anda aktif)' : ''}`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
        aria-hidden="true"
      />
      <span className="flex-1 text-left font-medium text-sm">{children}</span>
      {badge > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-4 px-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg animate-pulse">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
});

NavLink.displayName = 'NavLink';

// Memoized ParentNavLink component with expand/collapse for submenus
const ParentNavLink = memo(
  ({
    page,
    children,
    Icon,
    hasSubmenu,
    isExpanded,
    onToggleExpand,
    onNavigate,
    activePage,
    badge,
  }) => {
    const isActive = activePage === page;

    const handleClick = () => {
      // First navigate to the page
      if (onNavigate) {
        onNavigate(page);
      }
      // Then toggle the submenu
      if (onToggleExpand) {
        onToggleExpand();
      }
    };

    return (
      <button
        onClick={handleClick}
        aria-label={children}
        aria-expanded={isExpanded}
        aria-current={isActive ? 'page' : undefined}
        className={`group w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:scale-[1.01]'
        }`}
        title={`${children}${isActive ? ' (Şu anda aktif)' : ''}`}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
          aria-hidden="true"
        />
        <span className="flex-1 text-left font-medium text-sm">{children}</span>
        {badge > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-4 px-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {hasSubmenu &&
          (isExpanded ? (
            <ChevronDownIcon
              className="w-4 h-4 transition-transform duration-200"
              aria-hidden="true"
            />
          ) : (
            <ChevronRightIcon
              className="w-4 h-4 transition-transform duration-200"
              aria-hidden="true"
            />
          ))}
      </button>
    );
  }
);

ParentNavLink.displayName = 'ParentNavLink';

// Memoized SubNavLink component for submenu items
const SubNavLink = memo(({ page, children, Icon, activePage, onNavigate, badge }) => {
  const isActive = activePage === page;

  return (
    <button
      onClick={() => onNavigate(page)}
      aria-label={children}
      aria-current={isActive ? 'page' : undefined}
      className={`group w-full flex items-center gap-3 pl-12 pr-4 py-2 rounded-xl transition-all duration-200 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white hover:scale-[1.01]'
      }`}
      title={`${children}${isActive ? ' (Şu anda aktif)' : ''}`}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
        aria-hidden="true"
      />
      <span className="flex-1 text-left font-medium text-sm">{children}</span>
      {badge > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-4 px-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg animate-pulse">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
});

SubNavLink.displayName = 'SubNavLink';

const Sidebar = ({
  activePage,
  setActivePage,
  connectionStatus,
  onToggleGuide,
  overdueItems,
  isOpen,
  onClose,
}) => {
  const { user, isAdmin } = useAuth();

  // State for expanded menu items (persisted to localStorage)
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarExpandedMenus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save expanded menus to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('sidebarExpandedMenus', JSON.stringify(expandedMenus));
    } catch {
      // Ignore localStorage errors
    }
  }, [expandedMenus]);

  // Toggle expanded state for a parent menu
  const handleToggleExpand = useCallback((menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  }, []);

  // Memoized logout handler
  const handleLogout = useCallback(async () => {
    // Log logout activity before signing out
    if (user) {
      await logUserActivity(user.uid, user.email, 'logout');
    }
    await signOut(auth);
  }, [user]);

  // Memoized navigation handler
  const handleNavClick = useCallback(
    (page) => {
      setActivePage(page);
      // Mobilde menüyü kapat
      if (onClose && window.innerWidth < 768) {
        onClose();
      }
    },
    [setActivePage, onClose]
  );

  // Navigation items configuration with badges and hierarchical structure
  const navigationItems = useMemo(() => {
    const items = [
      { page: 'Anasayfa', label: 'Anasayfa', Icon: HomeIcon, badge: 0 },
      { page: 'Müşteriler', label: 'Müşteriler', Icon: UsersIcon, badge: 0 },
      {
        page: 'Ürünler',
        label: 'Ürünler',
        Icon: BoxIcon,
        badge: 0,
        hasSubmenu: true,
        submenu: [
          { page: 'Lot Yönetimi', label: 'Lot Yönetimi', Icon: CubeIcon, badge: 0 },
          { page: 'Uzlaştırma', label: 'Uzlaştırma', Icon: AdjustmentsIcon, badge: 0 },
        ],
      },
      { page: 'Teklifler', label: 'Teklifler', Icon: DocumentTextIcon, badge: 0 },
      { page: 'Siparişler', label: 'Siparişler', Icon: ClipboardListIcon, badge: 0 },
      { page: 'Satınalma', label: 'Satınalma', Icon: ShoppingCartIcon, badge: 0 },
      { page: 'Görüşmeler', label: 'Görüşmeler', Icon: CalendarIcon, badge: 0 },
      { page: 'Sevkiyat', label: 'Sevkiyat', Icon: TruckIcon, badge: 0 },
      { page: 'Cari Hesaplar', label: 'Cari Hesaplar', Icon: ScaleIcon, badge: 0 },
      {
        page: 'Ödemeler',
        label: 'Ödemeler',
        Icon: CreditCardIcon,
        badge: overdueItems?.payments || 0,
      },
      { page: 'Raporlar', label: 'Raporlar', Icon: ChartBarIcon, badge: 0 },
    ];

    // Add admin panel if user is admin
    if (isAdmin()) {
      items.push({ page: 'Admin', label: 'Admin Paneli', Icon: ShieldIcon, badge: 0 });
    }

    return items;
  }, [isAdmin, overdueItems]);

  return (
    <aside
      className={`
            w-64 bg-gradient-to-b from-gray-800 via-gray-800 to-gray-900 text-white flex flex-col
            fixed md:relative h-full z-50
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            shadow-2xl
        `}
      role="navigation"
      aria-label="Ana menü"
    >
      <div className="flex flex-col flex-grow">
        {/* Simple Header */}
        <div className="mb-4 px-4 pt-4 pb-4 flex justify-between items-center border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            {/* Logo Icon */}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Takip CRM
            </h1>
          </div>
          {/* Mobilde kapat butonu */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
            aria-label="Menüyü Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav
          className="flex flex-col gap-1 px-3 overflow-y-auto flex-1"
          role="navigation"
          aria-label="Sayfalar"
        >
          {navigationItems.map((item) => {
            const { page, label, Icon, badge, hasSubmenu, submenu } = item;

            if (hasSubmenu && submenu) {
              // Parent item with submenu
              const isExpanded = expandedMenus[page] || false;

              return (
                <div key={page}>
                  <ParentNavLink
                    page={page}
                    Icon={Icon}
                    hasSubmenu={hasSubmenu}
                    isExpanded={isExpanded}
                    onToggleExpand={() => handleToggleExpand(page)}
                    onNavigate={handleNavClick}
                    activePage={activePage}
                    badge={badge}
                  >
                    {label}
                  </ParentNavLink>

                  {/* Submenu with smooth expand/collapse animation */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="flex flex-col gap-1 mt-1">
                      {submenu.map((subItem) => (
                        <SubNavLink
                          key={subItem.page}
                          page={subItem.page}
                          Icon={subItem.Icon}
                          activePage={activePage}
                          onNavigate={handleNavClick}
                          badge={subItem.badge}
                        >
                          {subItem.label}
                        </SubNavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Regular item without submenu
              return (
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
              );
            }
          })}

          {/* Guide Button */}
          <button
            onClick={onToggleGuide}
            aria-label="Kullanıcı rehberi"
            className="group w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 min-h-[40px] mt-1"
            title="Rehberi aç"
          >
            <QuestionMarkCircleIcon
              className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              aria-hidden="true"
            />
            <span className="flex-1 text-left font-medium text-sm">Rehber</span>
          </button>
        </nav>
      </div>
      {/* Footer Section */}
      <div className="flex-shrink-0 px-3 pb-3 space-y-2">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          aria-label="Çıkış yap"
          className="group w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-800 min-h-[40px] border border-gray-700 hover:border-red-500"
          title="Uygulamadan çıkış yap"
        >
          <LogoutIcon
            className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <span className="flex-1 text-left font-medium text-sm">Çıkış Yap</span>
        </button>

        {/* Connection Status - Minimal */}
        <div className="flex justify-center">
          <ConnectionStatusIndicator status={connectionStatus} />
        </div>
      </div>
    </aside>
  );
};

// Memoize Sidebar to prevent unnecessary re-renders
export default memo(Sidebar);
