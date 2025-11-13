import React, { memo } from 'react';
import type { Customer, Order, Meeting } from '../../types';

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
  overdueCount: number;
  setActivePage: (page: string) => void;
}

/**
 * Critical Alerts component - Shows important warnings and notifications
 */
const CriticalAlerts = memo<CriticalAlertsProps>(({
  customers,
  orders,
  meetings,
  overdueCount,
  setActivePage
}) => {
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
      action: () => setActivePage('Siparişler'),
      actionLabel: 'Görüntüle'
    });
  }

  // Customers not contacted in 2 weeks
  const inactiveCustomers = customers.filter(c => {
    if (c.isDeleted) return false;
    const lastMeeting = meetings
      .filter(m => m.customerId === c.id && !m.isDeleted)
      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())[0];

    if (!lastMeeting) return true; // Never contacted
    return new Date(lastMeeting.meeting_date) < twoWeeksAgo;
  });

  if (inactiveCustomers.length > 5) {
    alerts.push({
      id: 'inactive-customers',
      type: 'warning',
      icon: '👥',
      message: `${inactiveCustomers.length} müşteriye 2 haftadır ulaşılmadı!`,
      action: () => setActivePage('Müşteriler'),
      actionLabel: 'İncele'
    });
  }

  // Overdue actions
  if (overdueCount > 0) {
    alerts.push({
      id: 'overdue-actions',
      type: 'danger',
      icon: '⏰',
      message: `${overdueCount} gecikmiş eylem var!`,
      action: () => setActivePage('Görüşmeler'),
      actionLabel: 'Görüntüle'
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
  );
});

CriticalAlerts.displayName = 'CriticalAlerts';

export default CriticalAlerts;
