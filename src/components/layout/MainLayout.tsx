import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from '../common/BottomNav';
import FAB from '../common/FAB';
import PullToRefresh from '../common/PullToRefresh';
import Modal from '../common/Modal';
import UserGuide from '../guide/UserGuide';
import CommandPalette from '../common/CommandPalette'; // NEW IMPORT
import { Toaster } from 'react-hot-toast';
import useStore from '../../store/useStore';
import { Customer } from '../../types';

// Loading Screen Component
const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-background dark:bg-gray-900">
    <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-soft flex items-center gap-4 border border-slate-50 dark:border-gray-700">
      <div className="w-10 h-10 border-4 border-primary-100 border-t-primary rounded-full animate-spin"></div>
      <span className="text-lg font-bold text-slate-700 dark:text-gray-300 tracking-tight">
        Veriler Hazırlanıyor...
      </span>
    </div>
  </div>
);

interface MainLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onRefresh: () => Promise<void>;
  onFABAction: (action: string, customerId?: string) => void;
  customers: Customer[]; // For FAB
}

const MainLayout: React.FC<MainLayoutProps> = ({
  activePage,
  setActivePage,
  connectionStatus,
  onRefresh,
  onFABAction,
  customers,
}) => {
  const showGuide = useStore((state) => state.showGuide);
  const toggleGuide = useStore((state) => state.toggleGuide);
  const overdueItems = useStore((state) => state.overdueItems);
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);

  // Handle Toggle Guide wrapper
  const handleToggleGuide = () => {
    toggleGuide();
  };

  return (
    <div className="flex h-screen bg-background dark:bg-gray-950 font-sans relative overflow-hidden p-4 gap-4 selection:bg-primary-100 selection:text-primary-900">
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            'rounded-2xl shadow-soft-lg border border-slate-50 dark:border-gray-700 font-semibold',
        }}
      />
      <CommandPalette />

      {/* Sidebar - Desktop (Floating & Glass) */}
      <aside
        className={`hidden md:flex flex-col w-72 h-full rounded-[2rem] transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 w-0 p-0 overflow-hidden'
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          connectionStatus={connectionStatus}
          onToggleGuide={handleToggleGuide}
          overdueItems={overdueItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Content Area */}
      <main className="flex-1 h-full rounded-[2rem] overflow-hidden relative flex flex-col transition-all duration-300">
        {/* Desktop Sidebar Toggle Button - Floating */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`hidden md:flex fixed bottom-8 left-8 z-[60] p-3 rounded-2xl bg-slate-900 text-white shadow-lg hover:scale-110 active:scale-95 transition-all ${
            sidebarOpen ? 'md:hidden' : 'block'
          }`}
          title="Menüyü Aç"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
          <PullToRefresh onRefresh={onRefresh}>
            <Suspense fallback={<LoadingScreen />}>
              <div className="animate-fadeIn p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                <Outlet />
              </div>
            </Suspense>
          </PullToRefresh>
          <div className="h-24 md:h-10"></div> {/* Bottom spacer */}
        </div>
      </main>

      {/* Mobile Navigation Components */}
      <BottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        onToggleGuide={handleToggleGuide}
      />
      <FAB activePage={activePage} onAction={onFABAction} customers={customers} />

      {showGuide && (
        <Modal
          show={showGuide}
          onClose={handleToggleGuide}
          title="Kullanıcı Rehberi"
          maxWidth="max-w-7xl"
        >
          <UserGuide />
        </Modal>
      )}
    </div>
  );
};

export default MainLayout;
