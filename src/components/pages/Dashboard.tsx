import React, { useMemo, memo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  ClipboardListIcon,
  DocumentTextIcon,
  CalendarIcon,
  WhatsAppIcon,
  BellIcon,
} from '../icons';
import {
  formatDate,
  formatCurrency,
  getStatusClass,
  formatPhoneNumberForWhatsApp,
} from '../../utils/formatters';
import OverdueActions from '../dashboard/OverdueActions';
import CriticalAlerts from '../dashboard/CriticalAlerts';
import InactiveCustomers from '../dashboard/InactiveCustomers';
import UpcomingActionsModal from '../dashboard/UpcomingActionsModal';
import OpenOrdersModal from '../dashboard/OpenOrdersModal';
import PendingQuotesModal from '../dashboard/PendingQuotesModal';
import DailyOperationsTimeline from '../dashboard/DailyOperationsTimeline';
import OperationalTabbedContent from '../dashboard/OperationalTabbedContent';
import Modal from '../common/Modal';
import MobileStat from '../common/MobileStat';
import MobileListItem from '../common/MobileListItem';
import SkeletonStat from '../common/SkeletonStat';
import SkeletonList from '../common/SkeletonList';
import Button from '../common/Button';
import Card from '../common/Card';
import CustomerForm from '../forms/CustomerForm';
import QuoteForm from '../forms/QuoteForm';
import OrderForm from '../forms/OrderForm';
import MeetingForm from '../forms/MeetingForm';
import CustomTaskForm from '../forms/CustomTaskForm';
import useStore from '../../store/useStore';
import type {
  Customer,
  Order,
  Quote,
  Meeting,
  Product,
  CustomTask,
  Shipment,
  TodayTask,
} from '../../types';
import { logger } from '../../utils/logger';

// ... (BestSellingProduct and DashboardProps interfaces remain the same)

const Dashboard = memo<DashboardProps>(
  ({
    customers,
    orders,
    teklifler,
    gorusmeler,
    products,
    shipments,
    overdueItems,
    customTasks,
    setActivePage,
    onMeetingSave,
    onCustomTaskSave,
    onCustomerSave,
    onOrderSave,
    onQuoteSave,
    loading = false,
  }) => {
    // ... (All state and useMemo logic remains exactly the same as before)

    if (loading) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-1/4 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-xl w-1/2 mb-10 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonStat key={index} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-soft border border-slate-50"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6 animate-pulse"></div>
                <SkeletonList count={5} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER SECTION - REFACTORED */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hoş Geldiniz 👋
            </h1>
            <p className="text-slate-500 dark:text-gray-400 mt-2 flex items-center gap-2 font-medium">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {formatDate(new Date().toISOString())} | İşletmenizin durumu oldukça iyi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" leftIcon={<ClipboardListIcon className="w-4 h-4" />}>
              Rapor Al
            </Button>
            <div className="relative">
              <Button
                variant="primary"
                onClick={() => setIsNewActionMenuOpen(!isNewActionMenuOpen)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                }
              >
                Yeni Ekle
              </Button>

              {isNewActionMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg py-2 z-50 border border-slate-100 dark:border-gray-700 animate-slideUp">
                  {[
                    { label: 'Yeni Teklif', icon: '📄', onClick: () => setIsQuoteFormOpen(true) },
                    {
                      label: 'Yeni Müşteri',
                      icon: '👥',
                      onClick: () => setIsCustomerFormOpen(true),
                    },
                    { label: 'Yeni Sipariş', icon: '📦', onClick: () => setIsOrderFormOpen(true) },
                    {
                      label: 'Yeni Görüşme',
                      icon: '📞',
                      onClick: () => setIsMeetingFormOpen(true),
                    },
                    {
                      label: 'Yeni Görev',
                      icon: '📋',
                      onClick: () => setIsCustomTaskFormOpen(true),
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsNewActionMenuOpen(false);
                        item.onClick();
                      }}
                      className="flex items-center w-full px-5 py-3 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <CriticalAlerts
          customers={customers}
          orders={orders}
          meetings={gorusmeler}
          quotes={teklifler}
          shipments={shipments}
          setActivePage={setActivePage}
          onShowInactiveCustomers={() => setIsInactiveCustomersModalOpen(true)}
        />

        {/* STATS GRID - REFACTORED TO MODERN SOFT */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-soft border border-slate-50 dark:border-gray-700 hover:shadow-soft-md transition-all cursor-pointer"
            onClick={() => setShowOpenOrdersModal(true)}
          >
            <p className="text-slate-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              Açık Siparişler
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {openOrders.length}
            </h3>
            <div className="mt-3 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg inline-block font-black uppercase tracking-tight">
              +2 bugün
            </div>
          </div>

          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-soft border border-slate-50 dark:border-gray-700 hover:shadow-soft-md transition-all cursor-pointer"
            onClick={() => setShowPendingQuotesModal(true)}
          >
            <p className="text-slate-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              Bekleyen Teklifler
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {teklifler.filter((t) => !t.isDeleted && t.status === 'Hazırlandı').length}
            </h3>
            <div className="mt-3 text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-lg inline-block font-black uppercase tracking-tight">
              {formatCurrency(
                teklifler
                  .filter((t) => !t.isDeleted && t.status === 'Hazırlandı')
                  .reduce((sum, q) => sum + (q.total_amount || 0), 0)
              )}
            </div>
          </div>

          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-soft border border-slate-50 dark:border-gray-700 hover:shadow-soft-md transition-all cursor-pointer"
            onClick={() => setShowUpcomingModal(true)}
          >
            <p className="text-slate-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              Planlanan Eylemler
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {upcomingActions.length}
            </h3>
            <div className="mt-3 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg inline-block font-black uppercase tracking-tight">
              Görüşme/Ziyaret
            </div>
          </div>

          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-soft border border-slate-50 dark:border-gray-700 hover:shadow-soft-md transition-all cursor-pointer border-b-4 border-b-red-500"
            onClick={() => setIsOverdueModalOpen(true)}
          >
            <p className="text-slate-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 text-red-500">
              Gecikmiş Eylemler
            </p>
            <h3 className="text-3xl font-black text-red-600">{overdueItems.length}</h3>
            <div className="mt-3 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg inline-block font-black uppercase tracking-tight">
              Acil İlgilen!
            </div>
          </div>

          <div
            className="bg-primary p-6 rounded-[1.5rem] shadow-primary text-white hover:scale-[1.02] transition-all cursor-pointer"
            onClick={() => setShowCancelledOrdersModal(true)}
          >
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">
              İptal Edilen
            </p>
            <h3 className="text-3xl font-black">{cancelledOrders.length}</h3>
            <div className="mt-3 text-[10px] text-blue-100 bg-white/10 px-2 py-1 rounded-lg inline-block font-black uppercase tracking-tight">
              Bu Ay
            </div>
          </div>
        </div>

        {/* MAIN GRID - TIMELINE & CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <DailyOperationsTimeline
              todayTasks={todayTasks}
              onToggleTask={toggleTask}
              setActivePage={setActivePage}
              customers={customers}
            />
          </div>
          <div className="lg:col-span-7">
            <OperationalTabbedContent
              lowStockProducts={lowStockProducts}
              products={products}
              upcomingDeliveries={upcomingDeliveries}
              bestSellingProducts={bestSellingProducts}
              customers={customers}
              shipments={shipments}
              setActivePage={setActivePage}
            />
          </div>
        </div>

        {/* Modals remain mostly the same but will benefit from the Card component internally if updated later */}
        {/* ... (All Modal components follow here, exactly as before) */}
      </div>
    );
  }
);

Dashboard.displayName = 'Dashboard';

export default Dashboard;
