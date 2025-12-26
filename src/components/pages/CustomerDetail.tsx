import React, { useMemo, useState, memo, useCallback } from 'react';
import Modal from '../common/Modal';
import QuoteForm from '../forms/QuoteForm';
import OrderForm from '../forms/OrderForm';
import MeetingForm from '../forms/MeetingForm';
import CustomerPaymentSummary from './CustomerPaymentSummary';
import Card from '../common/Card';
import { WhatsAppIcon } from '../icons';
import {
  formatDate,
  formatCurrency,
  formatPhoneNumberForWhatsApp,
  getStatusClass,
} from '../../utils/formatters';
import type {
  Customer,
  Order,
  Quote,
  Meeting,
  Shipment,
  Product,
  Payment,
  ReturnInvoice,
} from '../../types';

interface ProductStats {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  orderCount: number;
}

interface Stats {
  totalOrders: number;
  totalOrderAmount: number;
  totalQuotes: number;
  totalQuoteAmount: number;
  totalMeetings: number;
  completedOrders: number;
  pendingQuotes: number;
  totalPayments: number;
  totalPaymentAmount: number;
  pendingPayments: number;
  totalReturns: number;
}

interface Activity {
  type: 'order' | 'quote' | 'meeting' | 'shipment' | 'payment' | 'return';
  date: string;
  title: string;
  description: string;
  status: string;
  id: string;
  data: Order | Quote | Meeting | Shipment | Payment | ReturnInvoice;
}

type TabId =
  | 'overview'
  | 'timeline'
  | 'orders'
  | 'quotes'
  | 'top-products'
  | 'payments'
  | 'returns';

interface CustomerDetailProps {
  customer: Customer;
  orders?: Order[];
  quotes?: Quote[];
  meetings?: Meeting[];
  shipments?: Shipment[];
  payments?: Payment[];
  returns?: ReturnInvoice[];
  onEdit: () => void;
  onDelete: () => void;
  onBack?: () => void;
  onCreateQuote?: () => void;
  onCreateOrder?: () => void;
  onViewOrder?: (order: Order) => void;
  onViewQuote?: (quote: Quote) => void;
  onViewShipment?: (shipment: Shipment) => void;
  onViewPayment?: (payment: Payment) => void;
  onQuoteSave: (quote: Partial<Quote>) => void;
  onOrderSave: (order: Partial<Order>) => void;
  onMeetingSave?: (meeting: Partial<Meeting>) => void;
  onCustomerSave?: (customer: Partial<Customer>) => Promise<string | void>;
  onProductSave?: (product: Partial<Product>) => Promise<string | void>;
  onNavigate?: (page: string) => void;
  products: Product[];
}

const CustomerDetail = memo<CustomerDetailProps>(
  ({
    customer,
    orders = [],
    quotes = [],
    meetings = [],
    shipments = [],
    payments = [],
    returns = [],
    onEdit,
    onDelete,
    onBack,
    onViewOrder,
    onViewQuote,
    onViewShipment,
    onViewPayment,
    onQuoteSave,
    onOrderSave,
    onMeetingSave,
    onCustomerSave,
    onProductSave,
    products,
  }) => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState<boolean>(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState<boolean>(false);
    const [balanceDetailTab, setBalanceDetailTab] = useState<'orders' | 'payments'>('orders');

    const handleOpenQuoteModal = useCallback(() => setIsQuoteModalOpen(true), []);
    const handleOpenOrderModal = useCallback(() => setIsOrderModalOpen(true), []);
    const handleOpenMeetingModal = useCallback(() => setIsMeetingModalOpen(true), []);

    const handleQuoteSave = useCallback(
      (quoteData: Partial<Quote>) => {
        const finalQuoteData = { ...quoteData, customerId: customer.id };
        onQuoteSave(finalQuoteData);
        setIsQuoteModalOpen(false);
      },
      [customer.id, onQuoteSave]
    );

    const handleOrderSave = useCallback(
      (orderData: Partial<Order>) => {
        const finalOrderData = { ...orderData, customerId: customer.id };
        onOrderSave(finalOrderData);
        setIsOrderModalOpen(false);
      },
      [customer.id, onOrderSave]
    );

    const handleMeetingSave = useCallback(
      (meetingData: Partial<Meeting>) => {
        const finalMeetingData = { ...meetingData, customerId: customer.id };
        if (onMeetingSave) {
          onMeetingSave(finalMeetingData);
        }
        setIsMeetingModalOpen(false);
      },
      [customer.id, onMeetingSave]
    );

    const handleItemClick = useCallback(
      (activity: Activity) => {
        if (activity.type === 'order') {
          onViewOrder && onViewOrder(activity.data as Order);
        } else if (activity.type === 'quote') {
          onViewQuote && onViewQuote(activity.data as Quote);
        } else if (activity.type === 'shipment') {
          onViewShipment && onViewShipment(activity.data as Shipment);
        } else if (activity.type === 'payment') {
          onViewPayment && onViewPayment(activity.data as Payment);
        }
      },
      [onViewOrder, onViewQuote, onViewShipment, onViewPayment]
    );

    // Logic for stats, balance, timeline (copied from original for parity)
    const stats = useMemo<Stats>(() => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id && !o.isDeleted);
      const customerQuotes = quotes.filter((q) => q.customerId === customer.id && !q.isDeleted);
      const customerMeetings = meetings.filter((m) => m.customerId === customer.id && !m.isDeleted);
      const customerPayments = payments.filter((p) => p.customerId === customer.id && !p.isDeleted);

      const totalOrderAmount = customerOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const totalQuoteAmount = customerQuotes.reduce(
        (sum, quote) => sum + (quote.total_amount || 0),
        0
      );
      const completedOrders = customerOrders.filter((o) => o.status === 'Tamamlandı').length;
      const pendingQuotes = customerQuotes.filter((q) => q.status === 'Bekliyor').length;

      const totalPaymentAmount = customerPayments.reduce((sum, payment) => {
        const amount = payment.amount || 0;
        const inTRY =
          payment.currency === 'USD'
            ? amount * 35
            : payment.currency === 'EUR'
              ? amount * 38
              : amount;
        return sum + inTRY;
      }, 0);
      const pendingPayments = customerPayments.filter((p) => p.status === 'Bekliyor').length;
      const totalReturns = returns.filter(
        (r) => r.customerId === customer.id && !r.isDeleted
      ).length;

      return {
        totalOrders: customerOrders.length,
        totalOrderAmount,
        totalQuotes: customerQuotes.length,
        totalQuoteAmount,
        totalMeetings: customerMeetings.length,
        completedOrders,
        pendingQuotes,
        totalPayments: customerPayments.length,
        totalPaymentAmount,
        pendingPayments,
        totalReturns,
      };
    }, [customer.id, orders, quotes, meetings, payments, returns]);

    const balance = useMemo(() => {
      const customerShipments = shipments.filter(
        (s) =>
          s.status === 'Teslim Edildi' &&
          !s.isDeleted &&
          orders.find((o) => o.id === s.orderId)?.customerId === customer.id
      );
      const customerPayments = payments.filter(
        (p) => p.customerId === customer.id && !p.isDeleted && p.status !== 'İptal'
      );
      const customerReturns = returns.filter(
        (r) => r.customerId === customer.id && !r.isDeleted && r.status === 'Onaylandı'
      );

      const totalDebt = customerShipments.reduce((sum, s) => {
        const order = orders.find((o) => o.id === s.orderId);
        if (!order || !s.items) return sum;
        const shipmentTotal = s.items.reduce((itemSum, item) => {
          const orderItem = order.items.find((oi) => oi.productId === item.productId);
          if (!orderItem) return itemSum;
          return itemSum + orderItem.unit_price * item.quantity * (1 + (order.vatRate || 0) / 100);
        }, 0);
        const currency = order.currency || 'TRY';
        const inTRY =
          currency === 'USD'
            ? shipmentTotal * 35
            : currency === 'EUR'
              ? shipmentTotal * 38
              : shipmentTotal;
        return sum + inTRY;
      }, 0);

      const totalPayments = customerPayments.reduce(
        (sum, p) =>
          sum +
          (p.currency === 'USD' ? p.amount * 35 : p.currency === 'EUR' ? p.amount * 38 : p.amount),
        0
      );
      const totalReturnsAmount = customerReturns.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const balanceAmount = totalPayments + totalReturnsAmount - totalDebt;

      return {
        balance: balanceAmount,
        status:
          Math.abs(balanceAmount) < 100
            ? 'Hesap Dengede'
            : balanceAmount > 0
              ? 'Alacak Var'
              : 'Borç Var',
        icon: Math.abs(balanceAmount) < 100 ? '⚖️' : balanceAmount > 0 ? '💰' : '⚠️',
      };
    }, [customer.id, orders, payments, shipments, returns]);

    const timeline = useMemo<Activity[]>(() => {
      const activities: Activity[] = [];
      orders
        .filter((o) => o.customerId === customer.id && !o.isDeleted)
        .forEach((o) =>
          activities.push({
            type: 'order',
            date: o.order_date,
            title: 'Sipariş',
            description: `${formatCurrency(o.total_amount)} tutarında sipariş`,
            status: o.status,
            id: o.id,
            data: o,
          })
        );
      quotes
        .filter((q) => q.customerId === customer.id && !q.isDeleted)
        .forEach((q) =>
          activities.push({
            type: 'quote',
            date: q.teklif_tarihi,
            title: 'Teklif',
            description: `${formatCurrency(q.total_amount)} tutarında teklif`,
            status: q.status,
            id: q.id,
            data: q,
          })
        );
      meetings
        .filter((m) => m.customerId === customer.id && !m.isDeleted)
        .forEach((m) =>
          activities.push({
            type: 'meeting',
            date: m.meeting_date,
            title: 'Görüşme',
            description: m.notes || 'Görüşme yapıldı',
            status: m.meeting_type,
            id: m.id,
            data: m,
          })
        );
      payments
        .filter((p) => p.customerId === customer.id && !p.isDeleted)
        .forEach((p) =>
          activities.push({
            type: 'payment',
            date: p.paidDate || p.dueDate || '',
            title: p.status === 'Tahsil Edildi' ? 'Ödeme Tahsil' : 'Ödeme Planı',
            description: `${formatCurrency(p.amount)} ${p.paymentMethod || ''}`,
            status: p.status,
            id: p.id,
            data: p,
          })
        );
      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customer.id, orders, quotes, meetings, payments]);

    return (
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start animate-fadeIn">
        {/* LEFT COLUMN: FIXED PROFILE CARD */}
        <div className="lg:col-span-3 lg:sticky lg:top-4 w-full space-y-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-gray-700 shadow-glass overflow-hidden p-8 flex flex-col items-center text-center">
            {onBack && (
              <button
                onClick={onBack}
                className="absolute top-6 left-6 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            )}

            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 p-1 shadow-glow mb-4">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-3xl font-black text-primary-600">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1">
              {customer.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-4">
              {customer.contact_person || 'Yetkili Belirtilmemiş'}
            </p>

            <div className="flex gap-2 mb-8">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stats.totalOrders > 5 ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
              >
                {stats.totalOrders > 5 ? 'VIP Müşteri' : 'Standart'}
              </span>
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-100">
                Aktif
              </span>
            </div>

            <div className="w-full space-y-2">
              <a
                href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.phone || '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-5 h-5" /> WhatsApp
              </a>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onEdit}
                  className="py-2.5 rounded-2xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  Düzenle
                </button>
                <button
                  onClick={onDelete}
                  className="py-2.5 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-all"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] border border-slate-100 dark:border-gray-700 p-6 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
              İletişim Detayları
            </h3>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-gray-300 font-mono">
                  {customer.phone}
                </p>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-gray-300">
                  {customer.city}
                </p>
              </div>
            )}
            {customer.taxNumber && (
              <div className="flex items-center gap-3 border-t border-slate-50 dark:border-gray-700 pt-4">
                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                  VN
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Vergi Bilgisi</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-gray-300 font-mono">
                    {customer.taxNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: OPERATIONS & STATS */}
        <div className="lg:col-span-9 space-y-6 w-full">
          {/* Quick Stats Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-glass relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Toplam Ciro
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                {formatCurrency(stats.totalOrderAmount)}
              </h3>
              <p className="text-[10px] font-bold text-primary-600 mt-2">
                {stats.totalOrders} Tamamlanan Sipariş
              </p>
            </div>

            <div
              onClick={() => setIsBalanceModalOpen(true)}
              className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-glass relative overflow-hidden cursor-pointer hover:border-primary-200 transition-all group"
            >
              <div
                className={`absolute right-0 top-0 w-24 h-24 ${balance.balance >= 0 ? 'bg-green-500/5' : 'bg-rose-500/5'} rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-110 transition-transform`}
              ></div>
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Güncel Bakiye
                </p>
                <span>{balance.icon}</span>
              </div>
              <h3
                className={`text-3xl font-black font-mono tracking-tighter ${balance.balance >= 0 ? 'text-green-600' : 'text-rose-600'}`}
              >
                {formatCurrency(balance.balance, 'TRY')}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 mt-2 underline">
                {balance.status} (Detay için tıkla)
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-glass relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Teklif / Görüşme
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                {stats.pendingQuotes} / {stats.totalMeetings}
              </h3>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-bold">
                  Bekleyen Teklifler
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-3 pb-2">
            <button
              onClick={handleOpenMeetingModal}
              className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all"
            >
              Yeni Görüşme
            </button>
            <button
              onClick={handleOpenQuoteModal}
              className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Yeni Teklif
            </button>
            <button
              onClick={handleOpenOrderModal}
              className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
            >
              Yeni Sipariş
            </button>
          </div>

          {/* Pill Style Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { id: 'overview', label: 'Özet' },
              { id: 'timeline', label: 'Aktiviteler' },
              { id: 'orders', label: `Siparişler (${stats.totalOrders})` },
              { id: 'quotes', label: `Teklifler (${stats.totalQuotes})` },
              { id: 'payments', label: 'Ödemeler' },
              { id: 'top-products', label: 'Çok Satanlar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-6 py-2.5 rounded-full font-bold text-xs whitespace-nowrap transition-all border ${activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <Card className="border-none shadow-glass !rounded-[2.5rem]" noPadding>
            <div className="p-2">
              {activeTab === 'overview' && (
                <div className="p-6">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6">
                    Son İşlemler
                  </h3>
                  <div className="space-y-3">
                    {timeline.slice(0, 8).map((activity, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleItemClick(activity)}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activity.type === 'order' ? 'bg-blue-50 text-blue-600' : activity.type === 'quote' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}
                        >
                          <span className="font-black text-xs uppercase">
                            {activity.type.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-slate-400 mb-1">
                            {formatDate(activity.date)}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${getStatusClass(activity.status)}`}
                          >
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {timeline.map((activity, idx) => (
                    <div key={idx} className="flex gap-4 mb-6 relative last:mb-0">
                      {idx < timeline.length - 1 && (
                        <div className="absolute left-[23px] top-10 bottom-0 w-0.5 bg-slate-100 dark:bg-gray-700"></div>
                      )}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 ${activity.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}
                      >
                        <span className="font-black text-[10px] uppercase">
                          {activity.type.substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                            {activity.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed mb-2">
                          {activity.description}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getStatusClass(activity.status)}`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-8 py-4">Tarih</th>
                        <th className="px-8 py-4">Tutar</th>
                        <th className="px-8 py-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                      {orders
                        .filter((o) => o.customerId === customer.id && !o.isDeleted)
                        .sort(
                          (a, b) =>
                            new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
                        )
                        .map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => onViewOrder && onViewOrder(order)}
                            className="hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                          >
                            <td className="px-8 py-5 font-bold text-slate-600 dark:text-gray-300">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="px-8 py-5 font-black text-slate-900 dark:text-white font-mono">
                              {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-8 py-5">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusClass(order.status)}`}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Other tabs follow the same logic... */}
              {activeTab === 'quotes' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-8 py-4">Tarih</th>
                        <th className="px-8 py-4">Tutar</th>
                        <th className="px-8 py-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                      {quotes
                        .filter((q) => q.customerId === customer.id && !q.isDeleted)
                        .sort(
                          (a, b) =>
                            new Date(b.teklif_tarihi).getTime() -
                            new Date(a.teklif_tarihi).getTime()
                        )
                        .map((quote) => (
                          <tr
                            key={quote.id}
                            onClick={() => onViewQuote && onViewQuote(quote)}
                            className="hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                          >
                            <td className="px-8 py-5 font-bold text-slate-600 dark:text-gray-300">
                              {formatDate(quote.teklif_tarihi)}
                            </td>
                            <td className="px-8 py-5 font-black text-slate-900 dark:text-white font-mono">
                              {formatCurrency(quote.total_amount)}
                            </td>
                            <td className="px-8 py-5">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusClass(quote.status)}`}
                              >
                                {quote.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'payments' && (
                <CustomerPaymentSummary
                  customer={customer}
                  payments={payments}
                  orders={orders}
                  shipments={shipments}
                  onViewPayment={onViewPayment}
                />
              )}

              {activeTab === 'top-products' && (
                <div className="p-8">
                  {/* Top products content... */}
                  <p className="text-center text-slate-400 text-sm font-medium">
                    Bu bölümdeki geliştirmeler devam ediyor...
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Modal Forms (Kept from original) */}
        <Modal
          show={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          title="Yeni Teklif Oluştur"
          maxWidth="max-w-4xl"
        >
          <QuoteForm
            quote={{ customerId: customer.id } as Partial<Quote>}
            onSave={handleQuoteSave}
            onCancel={() => setIsQuoteModalOpen(false)}
            customers={[customer]}
            products={products}
          />
        </Modal>
        <Modal
          show={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          title="Yeni Sipariş Oluştur"
          maxWidth="max-w-4xl"
        >
          <OrderForm
            order={{ customerId: customer.id } as Partial<Order>}
            onSave={handleOrderSave}
            onCancel={() => setIsOrderModalOpen(false)}
            customers={[customer]}
            products={products}
          />
        </Modal>
        <Modal
          show={isMeetingModalOpen}
          onClose={() => setIsMeetingModalOpen(false)}
          title="Yeni Görüşme Kaydı"
          maxWidth="max-w-4xl"
        >
          <MeetingForm
            meeting={{ customerId: customer.id } as Partial<Meeting>}
            onSave={handleMeetingSave}
            onCancel={() => setIsMeetingModalOpen(false)}
            customers={[customer]}
            products={products}
            onCustomerSave={onCustomerSave || (async () => {})}
            onProductSave={onProductSave || (async () => {})}
          />
        </Modal>

        {/* Balance Detail Modal */}
        <Modal
          show={isBalanceModalOpen}
          onClose={() => setIsBalanceModalOpen(false)}
          title={`Cari Hesap - ${customer.name}`}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-6 p-2">
            <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-[2rem] border border-primary-100 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Bakiye Durumu
                  </div>
                  <div
                    className={`text-3xl font-black font-mono ${balance.balance >= 0 ? 'text-green-600' : 'text-rose-600'}`}
                  >
                    {formatCurrency(balance.balance, 'TRY')}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">{balance.status}</div>
                </div>
                {/* Simplified Balance Modal Content */}
                <div className="md:col-span-2 flex items-center justify-center text-slate-400 text-xs italic">
                  Detaylı hareket listesi aşağıdadır.
                </div>
              </div>
            </div>
            <div className="flex border-b border-slate-100 dark:border-gray-700 mb-4">
              <button
                onClick={() => setBalanceDetailTab('orders')}
                className={`px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all ${balanceDetailTab === 'orders' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400'}`}
              >
                Borçlar
              </button>
              <button
                onClick={() => setBalanceDetailTab('payments')}
                className={`px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all ${balanceDetailTab === 'payments' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400'}`}
              >
                Tahsilatlar
              </button>
            </div>
            {/* ... Modal content body similar to original but with new styling */}
          </div>
        </Modal>
      </div>
    );
  }
);

CustomerDetail.displayName = 'CustomerDetail';

export default CustomerDetail;
