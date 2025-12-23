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
import { formatDate, formatCurrency } from '../../utils/formatters';
import OverdueActions from '../dashboard/OverdueActions';
import CriticalAlerts from '../dashboard/CriticalAlerts';
import InactiveCustomers from '../dashboard/InactiveCustomers';
import UpcomingActionsModal from '../dashboard/UpcomingActionsModal';
import OpenOrdersModal from '../dashboard/OpenOrdersModal';
import PendingQuotesModal from '../dashboard/PendingQuotesModal';
import DailyOperationsTimeline from '../dashboard/DailyOperationsTimeline';
import OperationalTabbedContent from '../dashboard/OperationalTabbedContent';
import Modal from '../common/Modal';
import SkeletonStat from '../common/SkeletonStat';
import SkeletonList from '../common/SkeletonList';
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

interface BestSellingProduct {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  revenue: number;
  customers: Array<{
    customerId: string;
    customerName: string;
    quantity: number;
    revenue: number;
  }>;
}

interface DashboardProps {
  customers: Customer[];
  orders: Order[];
  teklifler: Quote[];
  gorusmeler: Meeting[];
  products: Product[];
  shipments: Shipment[];
  overdueItems: Meeting[];
  customTasks: CustomTask[];
  setActivePage: (page: string) => void;
  onMeetingSave: (meeting: Partial<Meeting>) => void;
  onCustomTaskSave: (task: Partial<CustomTask>) => void;
  onCustomerSave: (customer: Partial<Customer>) => Promise<string | void>;
  onOrderSave: (order: Partial<Order>) => void;
  onQuoteSave: (quote: Partial<Quote>) => void;
  loading?: boolean;
}

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
    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<BestSellingProduct | null>(null);
    const [isInactiveCustomersModalOpen, setIsInactiveCustomersModalOpen] = useState(false);
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);
    const [showOpenOrdersModal, setShowOpenOrdersModal] = useState(false);
    const [showPendingQuotesModal, setShowPendingQuotesModal] = useState(false);
    const [showCancelledOrdersModal, setShowCancelledOrdersModal] = useState(false);
    const [isNewActionMenuOpen, setIsNewActionMenuOpen] = useState(false);

    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
    const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
    const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);
    const [isCustomTaskFormOpen, setIsCustomTaskFormOpen] = useState(false);

    const openOrders = orders.filter(
      (o) => !o.isDeleted && ['Bekliyor', 'Hazırlanıyor'].includes(o.status)
    );
    const cancelledOrders =
      orders?.filter((o) => !o.isDeleted && o.status === 'İptal Edildi') || [];
    const today = new Date().toISOString().slice(0, 10);

    const upcomingActions = gorusmeler
      .filter((g) => !g.isDeleted && g.next_action_date && g.next_action_date >= today)
      .sort(
        (a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime()
      )
      .slice(0, 5);

    const todayTasks = useMemo<TodayTask[]>(() => {
      const tasks: TodayTask[] = [];
      gorusmeler
        .filter((m) => !m.isDeleted && m.next_action_date === today)
        .forEach((meeting) => {
          const customer = customers.find((c) => c.id === meeting.customerId);
          tasks.push({
            id: `meeting-${meeting.id}`,
            type: 'meeting',
            title: customer?.name || 'Bilinmeyen Müşteri',
            subtitle: meeting.next_action_notes || 'Görüşme',
            time: meeting.meeting_time,
            completed: meeting.status === 'Tamamlandı',
            sourceType: 'meeting',
            sourceId: meeting.id,
            customerId: meeting.customerId,
          });
        });
      orders
        .filter((o) => !o.isDeleted && o.delivery_date === today && o.status !== 'Tamamlandı')
        .forEach((order) => {
          const customer = customers.find((c) => c.id === order.customerId);
          tasks.push({
            id: `delivery-${order.id}`,
            type: 'delivery',
            title: customer?.name || 'Bilinmeyen Müşteri',
            subtitle: `Teslimat - ${formatCurrency(order.total_amount)}`,
            completed: order.status === 'Teslim Edildi',
            sourceType: 'order',
            sourceId: order.id,
            customerId: order.customerId,
          });
        });
      customTasks
        .filter((t) => !t.isDeleted && t.date === today)
        .forEach((task) => {
          tasks.push({
            id: `custom-${task.id}`,
            type: 'custom',
            title: task.title,
            subtitle: task.notes || '',
            time: task.time,
            completed: task.completed,
            sourceType: 'customTask',
            sourceId: task.id,
            priority: task.priority,
          });
        });
      return tasks.sort((a, b) => (a.time && b.time ? a.time.localeCompare(b.time) : 0));
    }, [gorusmeler, orders, customers, customTasks, today]);

    const lowStockProducts = useMemo(() => {
      return products
        .filter(
          (p) =>
            !p.isDeleted &&
            p.track_stock &&
            p.stock_quantity !== undefined &&
            p.minimum_stock !== undefined &&
            p.stock_quantity <= p.minimum_stock
        )
        .sort((a, b) => a.stock_quantity! / a.minimum_stock! - b.stock_quantity! / b.minimum_stock!)
        .slice(0, 5);
    }, [products]);

    const toggleTask = async (task: TodayTask) => {
      const newCompleted = !task.completed;
      try {
        if (task.sourceType === 'meeting') {
          const meeting = gorusmeler.find((m) => m.id === task.sourceId);
          if (meeting)
            await onMeetingSave({ ...meeting, status: newCompleted ? 'Tamamlandı' : 'Planlandı' });
        } else if (task.sourceType === 'customTask') {
          const customTask = customTasks.find((t) => t.id === task.sourceId);
          if (customTask) await onCustomTaskSave({ ...customTask, completed: newCompleted });
        }
      } catch (error) {
        logger.error('Task toggle error:', error);
      }
    };

    const bestSellingProducts = useMemo<BestSellingProduct[]>(() => {
      const productSales: Record<string, any> = {};
      orders
        .filter((o) => !o.isDeleted)
        .forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              const productId = item.productId;
              if (!productSales[productId])
                productSales[productId] = { quantity: 0, revenue: 0, customerData: {} };
              const itemQuantity = item.quantity || 0;
              const itemRevenue = itemQuantity * (item.unit_price || 0);
              productSales[productId].quantity += itemQuantity;
              productSales[productId].revenue += itemRevenue;
            });
          }
        });
      return Object.entries(productSales)
        .map(([productId, stats]: [string, any]) => {
          const product = products.find((p) => p.id === productId);
          return {
            id: productId,
            name: product?.name || 'Ürün',
            unit: product?.unit || 'Adet',
            quantity: stats.quantity,
            revenue: stats.revenue,
            customers: [],
          };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    }, [orders, products]);

    const upcomingDeliveries = useMemo(() => {
      const todayDate = new Date();
      const next7Days = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return orders
        .filter(
          (o) =>
            !o.isDeleted &&
            o.delivery_date &&
            new Date(o.delivery_date) >= todayDate &&
            new Date(o.delivery_date) <= next7Days &&
            o.status !== 'Tamamlandı'
        )
        .sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime())
        .slice(0, 5);
    }, [orders]);

    if (loading) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonList count={5} />
            <SkeletonList count={5} />
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hoş Geldiniz 👋
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mt-1">
              İşletmenizin bugünkü performansı oldukça iyi.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-all">
              Raporlar
            </button>
            <div className="relative">
              <button
                onClick={() => setIsNewActionMenuOpen(!isNewActionMenuOpen)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>+</span> Yeni Teklif
              </button>
              {isNewActionMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-2 z-50 border border-slate-100 dark:border-gray-700">
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
                      className="flex items-center w-full px-5 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <span className="mr-3 opacity-70">{item.icon}</span> {item.label}
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

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-8">
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowOpenOrdersModal(true)}
          >
            <p className="text-slate-400 text-sm font-medium mb-1">Açık Siparişler</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {openOrders.length}
            </h3>
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block font-bold">
              +2 bugün
            </div>
          </div>
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowPendingQuotesModal(true)}
          >
            <p className="text-slate-400 text-sm font-medium mb-1">Bekleyen Teklifler</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatCurrency(
                teklifler
                  .filter((t) => !t.isDeleted && t.status === 'Hazırlandı')
                  .reduce((sum, q) => sum + (q.total_amount || 0), 0)
              )}
            </h3>
            <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg inline-block font-bold">
              {teklifler.filter((t) => !t.isDeleted && t.status === 'Hazırlandı').length} Adet
            </div>
          </div>
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowUpcomingModal(true)}
          >
            <p className="text-slate-400 text-sm font-medium mb-1">Planlanan Eylemler</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {upcomingActions.length}
            </h3>
            <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg inline-block font-bold">
              Görüşme/Ziyaret
            </div>
          </div>
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setIsOverdueModalOpen(true)}
          >
            <p className="text-slate-400 text-sm font-medium mb-1">Gecikmiş Eylemler</p>
            <h3 className="text-2xl font-bold text-red-600">{overdueItems.length}</h3>
            <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg inline-block font-bold">
              Acil İlgilen!
            </div>
          </div>
        </div>

        {/* GRID */}
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

        {/* MODALS */}
        <Modal
          show={isCustomerFormOpen}
          onClose={() => setIsCustomerFormOpen(false)}
          title="Yeni Müşteri Ekle"
        >
          <CustomerForm onSave={onCustomerSave} onCancel={() => setIsCustomerFormOpen(false)} />
        </Modal>
        <Modal
          show={isQuoteFormOpen}
          onClose={() => setIsQuoteFormOpen(false)}
          title="Yeni Teklif Oluştur"
        >
          <QuoteForm
            onSave={onQuoteSave}
            onCancel={() => setIsQuoteFormOpen(false)}
            customers={customers}
            products={products}
          />
        </Modal>
        <Modal
          show={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          title="Yeni Sipariş Oluştur"
        >
          <OrderForm
            onSave={onOrderSave}
            onCancel={() => setIsOrderFormOpen(false)}
            customers={customers}
            products={products}
            shipments={shipments}
          />
        </Modal>
        <Modal
          show={isMeetingFormOpen}
          onClose={() => setIsMeetingFormOpen(false)}
          title="Yeni Görüşme Oluştur"
        >
          <MeetingForm
            onSave={onMeetingSave}
            onCancel={() => setIsMeetingFormOpen(false)}
            customers={customers}
            products={products}
          />
        </Modal>
        <Modal
          show={isCustomTaskFormOpen}
          onClose={() => setIsCustomTaskFormOpen(false)}
          title="Yeni Görev Ekle"
        >
          <CustomTaskForm
            onSave={onCustomTaskSave}
            onCancel={() => setIsCustomTaskFormOpen(false)}
          />
        </Modal>
        <Modal
          show={isOverdueModalOpen}
          onClose={() => setIsOverdueModalOpen(false)}
          title="Gecikmiş Eylemler"
          maxWidth="max-w-4xl"
        >
          <OverdueActions
            overdueItems={overdueItems}
            setActivePage={setActivePage}
            onMeetingUpdate={onMeetingSave}
          />
        </Modal>
        <Modal
          show={isInactiveCustomersModalOpen}
          onClose={() => setIsInactiveCustomersModalOpen(false)}
          title="İnaktif Müşteriler"
          maxWidth="max-w-4xl"
        >
          <InactiveCustomers
            customers={customers}
            meetings={gorusmeler}
            orders={orders}
            quotes={teklifler}
            shipments={shipments}
            setActivePage={setActivePage}
          />
        </Modal>
        <Modal
          show={showUpcomingModal}
          onClose={() => setShowUpcomingModal(false)}
          title="Planlanan Eylemler"
          maxWidth="max-w-4xl"
        >
          <UpcomingActionsModal
            meetings={upcomingActions}
            customers={customers}
            onViewAllMeetings={() => {
              setShowUpcomingModal(false);
              setActivePage('Görüşmeler');
            }}
          />
        </Modal>
        <Modal
          show={showOpenOrdersModal}
          onClose={() => setShowOpenOrdersModal(false)}
          title="Açık Siparişler"
          maxWidth="max-w-4xl"
        >
          <OpenOrdersModal
            orders={openOrders}
            customers={customers}
            shipments={shipments}
            onViewAllOrders={() => {
              setShowOpenOrdersModal(false);
              setActivePage('Siparişler');
            }}
          />
        </Modal>
        <Modal
          show={showPendingQuotesModal}
          onClose={() => setShowPendingQuotesModal(false)}
          title="Bekleyen Teklifler"
          maxWidth="max-w-4xl"
        >
          <PendingQuotesModal
            quotes={teklifler.filter((t) => !t.isDeleted && t.status === 'Hazırlandı')}
            customers={customers}
            onViewAllQuotes={() => {
              setShowPendingQuotesModal(false);
              setActivePage('Teklifler');
            }}
          />
        </Modal>
      </div>
    );
  }
);

Dashboard.displayName = 'Dashboard';
export default Dashboard;
