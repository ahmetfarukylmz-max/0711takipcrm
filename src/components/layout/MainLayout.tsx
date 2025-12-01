import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from '../common/BottomNav';
import FAB from '../common/FAB';
import PullToRefresh from '../common/PullToRefresh';
import Modal from '../common/Modal';
import UserGuide from '../common/UserGuide';
import { Toaster } from 'react-hot-toast';
import useStore from '../../store/useStore';
import { Customer } from '../../types';

// Loading Screen Component
const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="flex items-center gap-3 text-lg text-gray-600 dark:text-gray-400">
      <svg
        className="animate-spin h-5 w-5 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span>Yükleniyor...</span>
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

  // Handle Toggle Guide wrapper
  const handleToggleGuide = () => {
    toggleGuide();
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Toaster position="top-right" />

      {/* Sidebar - Sadece Desktop'ta Görünür */}
      <div className="hidden md:block">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          connectionStatus={connectionStatus}
          onToggleGuide={handleToggleGuide}
          overdueItems={overdueItems}
          isOpen={true}
          onClose={() => {}}
        />
      </div>

      <main className="flex-1 h-full p-4 sm:p-6 lg:p-8 overflow-y-auto md:ml-0 pb-20 md:pb-4">
        <PullToRefresh onRefresh={onRefresh}>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </PullToRefresh>
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
