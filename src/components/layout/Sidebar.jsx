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
  LightbulbIcon,
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

const NavLink = memo(({ page, children, Icon, activePage, onNavigate, badge }) => {
  const isActive = activePage === page;
  return (
    <button
      onClick={() => onNavigate(page)}
      className={`group w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 min-h-[48px] ${
        isActive
          ? 'bg-primary-50 text-primary-800 shadow-sm border border-primary-200 font-bold'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 text-primary-700' : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}`}
      />
      <span className="flex-1 text-left text-sm font-medium tracking-tight">{children}</span>
      {badge > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-bold bg-rose-500 text-white rounded-full shadow-sm shadow-rose-200">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
});

NavLink.displayName = 'NavLink';

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
      if (onNavigate) onNavigate(page);
      if (onToggleExpand) onToggleExpand();
    };
    return (
      <button
        onClick={handleClick}
        className={`group w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 min-h-[48px] ${
          isActive
            ? 'bg-primary-50 text-primary-800 shadow-sm border border-primary-200 font-bold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 text-primary-700' : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}`}
        />
        <span className="flex-1 text-left text-sm font-medium tracking-tight">{children}</span>
        {badge > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-bold bg-rose-500 text-white rounded-full shadow-sm shadow-rose-200">
            {badge}
          </span>
        )}
        {hasSubmenu &&
          (isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          ))}
      </button>
    );
  }
);

ParentNavLink.displayName = 'ParentNavLink';

const SubNavLink = memo(({ page, children, Icon, activePage, onNavigate }) => {
  const isActive = activePage === page;
  return (
    <button
      onClick={() => onNavigate(page)}
      className={`group w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-xl transition-all duration-200 min-h-[40px] ${
        isActive
          ? 'text-primary-600 font-bold bg-primary-50/50 dark:bg-primary-900/20'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
      }`}
    >
      <Icon
        className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
      />
      <span className="flex-1 text-left text-xs font-medium">{children}</span>
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
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarExpandedMenus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebarExpandedMenus', JSON.stringify(expandedMenus));
    } catch {
      // Ignore localStorage errors
    }
  }, [expandedMenus]);

  const handleToggleExpand = useCallback((menuKey) => {
    setExpandedMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  }, []);

  const handleLogout = useCallback(async () => {
    if (user) await logUserActivity(user.uid, user.email, 'logout');
    await signOut(auth);
  }, [user]);

  const handleNavClick = useCallback(
    (page) => {
      setActivePage(page);
      if (onClose && window.innerWidth < 768) onClose();
    },
    [setActivePage, onClose]
  );

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
          { page: 'Lot Yönetimi', label: 'Lot Yönetimi', Icon: CubeIcon },
          { page: 'Uzlaştırma', label: 'Uzlaştırma', Icon: AdjustmentsIcon },
        ],
      },
      { page: 'Teklifler', label: 'Teklifler', Icon: DocumentTextIcon, badge: 0 },
      { page: 'Siparişler', label: 'Siparişler', Icon: ClipboardListIcon, badge: 0 },
      { page: 'Satınalma', label: 'Satınalma', Icon: ShoppingCartIcon, badge: 0 },
      { page: 'Görüşmeler', label: 'Görüşmeler', Icon: CalendarIcon, badge: 0 },
      { page: 'Sevkiyat', label: 'Sevkiyat', Icon: TruckIcon, badge: 0 },
      { page: 'Cari Hesaplar', label: 'Cari Hesaplar', Icon: ScaleIcon, badge: 0 },
      { page: 'Satış Zekası', label: 'Satış Zekası', Icon: LightbulbIcon, badge: 0 },
      {
        page: 'Ödemeler',
        label: 'Ödemeler',
        Icon: CreditCardIcon,
        badge: overdueItems?.payments || 0,
      },
      { page: 'Raporlar', label: 'Raporlar', Icon: ChartBarIcon, badge: 0 },
    ];
    if (isAdmin()) items.push({ page: 'Admin', label: 'Admin Paneli', Icon: ShieldIcon, badge: 0 });
    return items;
  }, [isAdmin, overdueItems]);

  return (
    <aside
      className={`h-full flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-slate-200 dark:border-gray-700 rounded-[2rem] overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="px-6 py-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-glow">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Takip CRM
              </h1>
              <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">
                Crystal Ed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-2xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-4 overflow-y-auto flex-1 custom-scrollbar pb-4">
          {navigationItems.map((item) => (
            <div key={item.page}>
              {item.hasSubmenu ? (
                <>
                  <ParentNavLink
                    {...item}
                    isExpanded={expandedMenus[item.page]}
                    onToggleExpand={() => handleToggleExpand(item.page)}
                    onNavigate={handleNavClick}
                    activePage={activePage}
                  >
                    {item.label}
                  </ParentNavLink>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${expandedMenus[item.page] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="flex flex-col gap-1 mt-1 pl-2 border-l border-slate-200/50 ml-6">
                      {item.submenu.map((sub) => (
                        <SubNavLink
                          key={sub.page}
                          {...sub}
                          activePage={activePage}
                          onNavigate={handleNavClick}
                        >
                          {sub.label}
                        </SubNavLink>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <NavLink {...item} activePage={activePage} onNavigate={handleNavClick}>
                  {item.label}
                </NavLink>
              )}
            </div>
          ))}
          <button
            onClick={onToggleGuide}
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 mt-2 transition-all"
          >
            <QuestionMarkCircleIcon className="w-5 h-5 text-slate-500 group-hover:text-primary-600 transition-colors" />
            <span className="flex-1 text-left text-sm font-medium">Rehber</span>
          </button>
        </nav>
      </div>
      <div className="p-4 border-t border-slate-50 dark:border-gray-800 space-y-2">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogoutIcon className="w-5 h-5" />
          <span className="flex-1 text-left text-sm font-bold tracking-tight">Çıkış Yap</span>
        </button>
        <div className="flex justify-center pb-2">
          <ConnectionStatusIndicator status={connectionStatus} />
        </div>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
