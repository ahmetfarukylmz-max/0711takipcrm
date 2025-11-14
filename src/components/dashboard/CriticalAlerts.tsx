import React, { memo, useState } from 'react';
import Modal from '../common/Modal';
import OverdueOrdersModal from './OverdueOrdersModal';
import type { Customer, Order, Meeting, Quote } from '../../types';

interface CriticalAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  icon: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}

interface CriticalAlertsProps {
  customers: Customer[];
  orders: Order[];
  meetings: Meeting[];
  quotes: Quote[];
  setActivePage: (page: string) => void;
  onShowInactiveCustomers?: () => void;
}

/**
 * Critical Alerts component - Shows important warnings and notifications
 */
const CriticalAlerts = memo<CriticalAlertsProps>(({
  customers,
  orders,
  meetings,
  quotes,
  setActivePage,
  onShowInactiveCustomers
}) => {
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Calculate alerts
  const alerts: CriticalAlert[] = [];

  // Overdue deliveries
  const overdueDeliveries = orders.filter(o =>
    !o.isDeleted &&
    o.delivery_date &&
    new Date(o.delivery_date) < today &&
    o.status !== 'Tamamlandı' &&
    o.status !== 'İptal Edildi'
  );

  if (overdueDeliveries.length > 0) {
    alerts.push({
      id: 'overdue-deliveries',
      type: 'danger',
      icon: '📦',
      message: `${overdueDeliveries.length} sipariş teslim tarihi geçti!`,
      action: () => setShowOverdueModal(true),
      actionLabel: 'Görüntüle'
    });
  }

  // Customers with no interaction in 2 weeks (meetings, orders, or quotes)
  const inactiveCustomers = customers.filter(c => {
    if (c.isDeleted) return false;

    // Get last meeting
    const lastMeeting = meetings
      .filter(m => m.customerId === c.id && !m.isDeleted)
      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())[0];

    // Get last order
    const lastOrder = orders
      .filter(o => o.customerId === c.id && !o.isDeleted)
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0];

    // Get last quote
    const lastQuote = quotes
      .filter(q => q.customerId === c.id && !q.isDeleted)
      .sort((a, b) => new Date(b.quote_date).getTime() - new Date(a.quote_date).getTime())[0];

    // Find the most recent interaction
    const interactions = [
      lastMeeting?.meeting_date,
      lastOrder?.order_date,
      lastQuote?.quote_date
    ].filter(Boolean);

    if (interactions.length === 0) return true; // Never contacted

    const lastInteractionDate = new Date(Math.max(...interactions.map(d => new Date(d!).getTime())));
    return lastInteractionDate < twoWeeksAgo;
  });

  if (inactiveCustomers.length > 5) {
    alerts.push({
      id: 'inactive-customers',
      type: 'warning',
      icon: '👥',
      message: `${inactiveCustomers.length} müşteriyle 2 haftadır etkileşim yok!`,
      action: onShowInactiveCustomers || (() => setActivePage('Müşteriler')),
      actionLabel: 'İncele'
    });
  }

  // Pending quotes without follow-up
  const stalePendingQuotes = orders.filter(o =>
    !o.isDeleted &&
    o.status === 'Bekliyor' &&
    o.order_date &&
    new Date(o.order_date) < new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  );

  if (stalePendingQuotes.length > 3) {
    alerts.push({
      id: 'stale-quotes',
      type: 'warning',
      icon: '📋',
      message: `${stalePendingQuotes.length} sipariş 1 haftadır bekliyor!`,
      action: () => setActivePage('Siparişler'),
      actionLabel: 'İncele'
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <>
      <div className="space-y-3 mb-6 animate-fadeIn">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-4 border-l-4 rounded-lg ${getAlertStyles(alert.type)} transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="alert icon">
                {alert.icon}
              </span>
              <p className="font-medium text-sm md:text-base">{alert.message}</p>
            </div>
            {alert.action && alert.actionLabel && (
              <button
                onClick={alert.action}
                className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap ml-4"
              >
                {alert.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Overdue Orders Modal */}
      <Modal
        show={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        title="Teslim Tarihi Geçmiş Siparişler"
        maxWidth="max-w-4xl"
      >
        <OverdueOrdersModal
          orders={overdueDeliveries}
          customers={customers}
          onViewAllOrders={() => {
            setShowOverdueModal(false);
            setActivePage('Siparişler');
          }}
        />
      </Modal>
    </>
  );
});

CriticalAlerts.displayName = 'CriticalAlerts';

export default CriticalAlerts;
