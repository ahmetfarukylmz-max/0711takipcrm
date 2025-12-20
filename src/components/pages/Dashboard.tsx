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
import CustomerForm from '../forms/CustomerForm'; // New Import
import QuoteForm from '../forms/QuoteForm'; // New Import
import OrderForm from '../forms/OrderForm'; // New Import
import MeetingForm from '../forms/MeetingForm'; // New Import
import CustomTaskForm from '../forms/CustomTaskForm'; // New Import
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
  /** List of customers */
  customers: Customer[];
  /** List of orders */
  orders: Order[];
  /** List of quotes (teklifler) */
  teklifler: Quote[];
  /** List of meetings (gorusmeler) */
  gorusmeler: Meeting[];
  /** List of products */
  products: Product[];
  /** List of shipments */
  shipments: Shipment[];
  /** List of overdue items */
  overdueItems: Meeting[];
  /** List of custom tasks */
  customTasks: CustomTask[];
  /** Callback to set active page */
  setActivePage: (page: string) => void;
  /** Callback when meeting is saved */
  onMeetingSave: (meeting: Partial<Meeting>) => void;
  /** Callback when custom task is saved */
  onCustomTaskSave: (task: Partial<CustomTask>) => void;
  /** Callback when customer is saved */
  onCustomerSave: (customer: Partial<Customer>) => Promise<string | void>;
  /** Callback when order is saved */
  onOrderSave: (order: Partial<Order>) => void;
  /** Callback when quote is saved */
  onQuoteSave: (quote: Partial<Quote>) => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * Dashboard component - Main dashboard page with statistics and widgets
 */
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
    loading = false,
  }) => {
    // Zustand store actions
    const setSelectedProductId = useStore((state) => state.setSelectedProductId);

    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<BestSellingProduct | null>(null);
    const [isInactiveCustomersModalOpen, setIsInactiveCustomersModalOpen] = useState(false);
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);
    const [showOpenOrdersModal, setShowOpenOrdersModal] = useState(false);
    const [showPendingQuotesModal, setShowPendingQuotesModal] = useState(false);
    const [showCancelledOrdersModal, setShowCancelledOrdersModal] = useState(false);
    const [isNewActionMenuOpen, setIsNewActionMenuOpen] = useState(false); // For header dropdown

    // New states for form modals
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

    // Calculate today's tasks
    const todayTasks = useMemo<TodayTask[]>(() => {
      const tasks: TodayTask[] = [];

      // Today's meetings
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

      // Today's deliveries
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

      // Today's custom tasks
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

      return tasks.sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
    }, [gorusmeler, orders, customers, customTasks, today]);

    // Calculate low stock products
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
        .sort((a, b) => {
          const aPercentage = a.minimum_stock ? a.stock_quantity! / a.minimum_stock : 1;
          const bPercentage = b.minimum_stock ? b.stock_quantity! / b.minimum_stock : 1;
          return aPercentage - bPercentage;
        })
        .slice(0, 5);
    }, [products]);

    const toggleTask = async (task: TodayTask) => {
      const newCompleted = !task.completed;

      try {
        if (task.sourceType === 'meeting') {
          const meeting = gorusmeler.find((m) => m.id === task.sourceId);
          if (meeting) {
            await onMeetingSave({
              ...meeting,
              status: newCompleted ? 'Tamamlandı' : 'Planlandı',
            });
            toast.success(newCompleted ? 'Görüşme tamamlandı!' : 'Görüşme aktif duruma alındı');
          }
        } else if (task.sourceType === 'order') {
          const order = orders.find((o) => o.id === task.sourceId);
          if (order) {
            toast.info('Teslimat durumu siparişler sayfasından güncellenebilir');
          }
        } else if (task.sourceType === 'customTask') {
          const customTask = customTasks.find((t) => t.id === task.sourceId);
          if (customTask) {
            await onCustomTaskSave({
              ...customTask,
              completed: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : undefined,
            });
          }
        }
      } catch (error) {
        logger.error('Task toggle error:', error);
        toast.error('Görev güncellenirken hata oluştu');
      }
    };

    const bestSellingProducts = useMemo<BestSellingProduct[]>(() => {
      const productSales: Record<
        string,
        {
          quantity: number;
          revenue: number;
          customerData: Record<string, { quantity: number; revenue: number }>;
        }
      > = {};

      orders
        .filter((o) => !o.isDeleted)
        .forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              const productId = item.productId;
              const customerId = order.customerId;

              if (!productSales[productId]) {
                productSales[productId] = {
                  quantity: 0,
                  revenue: 0,
                  customerData: {},
                };
              }

              if (!productSales[productId].customerData[customerId]) {
                productSales[productId].customerData[customerId] = {
                  quantity: 0,
                  revenue: 0,
                };
              }

              const itemQuantity = item.quantity || 0;
              const itemRevenue = itemQuantity * (item.unit_price || 0);

              productSales[productId].quantity += itemQuantity;
              productSales[productId].revenue += itemRevenue;
              productSales[productId].customerData[customerId].quantity += itemQuantity;
              productSales[productId].customerData[customerId].revenue += itemRevenue;
            });
          }
        });

      return Object.entries(productSales)
        .map(([productId, stats]) => {
          const product = products.find((p) => p.id === productId && !p.isDeleted);

          const customersList = Object.entries(stats.customerData)
            .map(([customerId, customerStats]) => {
              const customer = customers.find((c) => c.id === customerId && !c.isDeleted);
              return {
                customerId,
                customerName: customer?.name || 'Bilinmeyen Müşteri',
                quantity: customerStats.quantity,
                revenue: customerStats.revenue,
              };
            })
            .sort((a, b) => b.quantity - a.quantity);

          return {
            id: productId,
            name: product?.name || 'Bilinmeyen Ürün',
            unit: product?.unit || 'Kg',
            quantity: stats.quantity,
            revenue: stats.revenue,
            customers: customersList,
          };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    }, [orders, products, customers]);

    const upcomingDeliveries = useMemo(() => {
      const today = new Date();
      const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return orders
        .filter((order) => {
          if (order.isDeleted || !order.delivery_date) return false;
          const deliveryDate = new Date(order.delivery_date);
          return (
            deliveryDate >= today && deliveryDate <= next7Days && order.status !== 'Tamamlandı'
          );
        })
        .sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime())
        .slice(0, 5);
    }, [orders]);

    if (loading) {
      return (
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Hoş Geldiniz! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            İşletmenizin genel durumuna buradan göz atabilirsiniz.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonStat key={index} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm"
              >
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4 animate-pulse"></div>
                <SkeletonList count={5} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Operasyon Merkezi</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {formatDate(new Date().toISOString())}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center">
              <ClipboardListIcon className="w-4 h-4 mr-2" />
              Rapor Al
            </button>
            <div className="relative">
              <button
                onClick={() => setIsNewActionMenuOpen(!isNewActionMenuOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-blue-200 transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Yeni Ekle
              </button>

              {isNewActionMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                  <button
                    onClick={() => {
                      setIsNewActionMenuOpen(false);
                      setIsQuoteFormOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📄 Yeni Teklif
                  </button>
                  <button
                    onClick={() => {
                      setIsNewActionMenuOpen(false);
                      setIsCustomerFormOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    👥 Yeni Müşteri
                  </button>
                  <button
                    onClick={() => {
                      setIsNewActionMenuOpen(false);
                      setIsOrderFormOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📦 Yeni Sipariş
                  </button>
                  <button
                    onClick={() => {
                      setIsNewActionMenuOpen(false);
                      setIsMeetingFormOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📞 Yeni Görüşme
                  </button>
                  <button
                    onClick={() => {
                      setIsNewActionMenuOpen(false);
                      setIsCustomTaskFormOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📋 Yeni Görev
                  </button>
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-8">
          <div className="animate-fadeIn">
            <MobileStat
              label="Açık Siparişler"
              value={openOrders.length}
              icon={<ClipboardListIcon className="w-4 h-4" />}
              color="blue"
              onClick={() => setShowOpenOrdersModal(true)}
              secondaryText={'+2 bugün'}
            />
          </div>
          <div className="animate-fadeIn animate-delay-100">
            <MobileStat
              label="Bekleyen Teklifler"
              value={teklifler.filter((t) => !t.isDeleted && t.status === 'Hazırlandı').length}
              icon={<DocumentTextIcon className="w-4 h-4" />}
              color="purple"
              onClick={() => setShowPendingQuotesModal(true)}
              secondaryText={formatCurrency(
                teklifler
                  .filter((t) => !t.isDeleted && t.status === 'Hazırlandı')
                  .reduce((sum, q) => sum + (q.total_amount || 0), 0),
                'TRY'
              )}
            />
          </div>
          <div className="animate-fadeIn animate-delay-200">
            <MobileStat
              label="Planlanan Eylemler"
              value={upcomingActions.length}
              icon={<CalendarIcon className="w-4 h-4" />}
              color="green"
              onClick={() => setShowUpcomingModal(true)}
              secondaryText="Görüşme/Ziyaret"
            />
          </div>
          <div className="animate-fadeIn animate-delay-300">
            <MobileStat
              label="Gecikmiş Eylemler"
              value={overdueItems.length}
              icon={<BellIcon className="w-4 h-4" />}
              color="red"
              onClick={() => setIsOverdueModalOpen(true)}
              secondaryText="Acil ilgilen!"
            />
          </div>
          <div className="animate-fadeIn animate-delay-400">
            <MobileStat
              label="İptal Edilen"
              value={cancelledOrders.length}
              icon={<ClipboardListIcon className="w-4 h-4" />}
              color="gray"
              onClick={() => setShowCancelledOrdersModal(true)}
              secondaryText="Bu ay"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Daily Operations Timeline (5 cols) */}
          <DailyOperationsTimeline
            todayTasks={todayTasks}
            onToggleTask={toggleTask}
            setActivePage={setActivePage}
            customers={customers}
          />
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
          show={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`${selectedProduct?.name || ''} - Alıcı Müşteriler`}
          maxWidth="max-w-2xl"
        >
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Toplam Satış:</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedProduct.quantity} Kg
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Toplam Gelir:</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedProduct.revenue)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Müşteri Listesi ({selectedProduct.customers.length})
                </h4>
                <div className="space-y-2">
                  {selectedProduct.customers.map((customer, index) => (
                    <div
                      key={customer.customerId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {customer.customerName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {customer.quantity} Kg • {formatCurrency(customer.revenue)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          %{((customer.quantity / selectedProduct.quantity) * 100).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pay</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          show={isInactiveCustomersModalOpen}
          onClose={() => setIsInactiveCustomersModalOpen(false)}
          title="İnaktif Müşteriler - İletişim Gerekli"
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

        <Modal
          show={showCancelledOrdersModal}
          onClose={() => setShowCancelledOrdersModal(false)}
          title="İptal Edilen Siparişler"
          maxWidth="max-w-5xl"
        >
          <div className="space-y-4">
            {cancelledOrders.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                İptal edilen sipariş bulunmamaktadır.
              </p>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Toplam İptal:</span>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cancelledOrders.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Toplam Tutar:</span>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          cancelledOrders.reduce((sum, o) => {
                            const amount = typeof o.total_amount === 'number' ? o.total_amount : 0;
                            return sum + amount;
                          }, 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">İptal Oranı:</span>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {orders?.filter((o) => !o.isDeleted).length > 0
                          ? (
                              (cancelledOrders.length /
                                (orders?.filter((o) => !o.isDeleted).length || 1)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Son 30 Gün:</span>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          cancelledOrders.filter((o) => {
                            if (!o.cancelledAt) return false;
                            try {
                              const cancelDate = new Date(o.cancelledAt);
                              if (isNaN(cancelDate.getTime())) return false;
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              return cancelDate >= thirtyDaysAgo;
                            } catch {
                              return false;
                            }
                          }).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Müşteri
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Sipariş Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          İptal Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tutar
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          İptal Nedeni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {cancelledOrders.map((order) => {
                        const customer = customers.find((c) => c.id === order.customerId);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {customer?.name || 'Bilinmeyen'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                              {order.cancelledAt ? formatDate(order.cancelledAt) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(order.total_amount || 0, order.currency || 'TRY')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {order.cancellationReason || 'Belirtilmemiş'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCancelledOrdersModal(false);
                      setActivePage('Siparişler');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Tüm Siparişleri Görüntüle
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    );
  }
);

Dashboard.displayName = 'Dashboard';

export default Dashboard;
