import React, { memo, useState } from 'react';
import Modal from '../common/Modal';
import OverdueOrdersModal from './OverdueOrdersModal';
import UninvoicedShipmentsModal from './UninvoicedShipmentsModal';
import type { Customer, Order, Meeting, Quote, Shipment } from '../../types';
import { UsersIcon, ClockIcon, ClipboardListIcon, DocumentTextIcon } from '../icons';

interface CriticalAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  icon: string;
  title: string; // Added title field
  message: string;
  action?: () => void;
  actionLabel?: string;
}

interface CriticalAlertsProps {
  customers: Customer[];
  orders: Order[];
  meetings: Meeting[];
  quotes: Quote[];
  shipments: Shipment[];
  setActivePage: (page: string) => void;
  onShowInactiveCustomers?: () => void;
}

/**
 * Critical Alerts component - Shows important warnings and notifications
 */
const CriticalAlerts = memo<CriticalAlertsProps>(
  ({ customers, orders, meetings, quotes, shipments, setActivePage, onShowInactiveCustomers }) => {
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [showUninvoicedModal, setShowUninvoicedModal] = useState(false);
    const today = new Date();
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Calculate alerts
    const alerts: CriticalAlert[] = [];

    // Overdue deliveries
    const overdueDeliveries = orders.filter(
      (o) =>
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
        title: 'Geciken Teslimatlar',
        message: `${overdueDeliveries.length} siparişin teslim tarihi geçti!`,
        action: () => setShowOverdueModal(true),
        actionLabel: 'Görüntüle',
      });
    }

    // Customers with no interaction in 2 weeks (meetings, orders, or quotes)
    const inactiveCustomers = customers.filter((c) => {
      if (c.isDeleted) return false;

      // Get last meeting
      const lastMeeting = meetings
        .filter((m) => m.customerId === c.id && !m.isDeleted)
        .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())[0];

      // Get last order
      const lastOrder = orders
        .filter((o) => o.customerId === c.id && !o.isDeleted)
        .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0];

      // Get last quote
      const lastQuote = quotes
        .filter((q) => q.customerId === c.id && !q.isDeleted)
        .sort((a, b) => {
          const dateA = a.quote_date || a.teklif_tarihi || '';
          const dateB = b.quote_date || b.teklif_tarihi || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })[0];

      // Get last shipment
      const lastShipment = shipments
        .filter((s) => s.customerId === c.id && !s.isDeleted)
        .sort((a, b) => {
          const dateA = a.shipmentDate || a.shipment_date || a.delivery_date || '';
          const dateB = b.shipmentDate || b.shipment_date || b.delivery_date || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })[0];

      // Find the most recent interaction
      const quoteDate = lastQuote ? lastQuote.quote_date || lastQuote.teklif_tarihi : null;
      const shipmentDate = lastShipment
        ? lastShipment.shipmentDate || lastShipment.shipment_date || lastShipment.delivery_date
        : null;

      const interactions = [
        lastMeeting?.meeting_date,
        lastOrder?.order_date,
        quoteDate,
        shipmentDate,
      ].filter(Boolean);

      if (interactions.length === 0) return true; // Never contacted

      const lastInteractionDate = new Date(
        Math.max(...interactions.map((d) => new Date(d!).getTime()))
      );
      return lastInteractionDate < twoWeeksAgo;
    });

    if (inactiveCustomers.length > 5) {
      alerts.push({
        id: 'inactive-customers',
        type: 'warning',
        icon: '👥',
        title: 'İletişim Kopukluğu',
        message: `${inactiveCustomers.length} müşteriyle 2 haftadır hiç etkileşim yok.`,
        action: onShowInactiveCustomers || (() => setActivePage('Müşteriler')),
        actionLabel: 'İncele',
      });
    }

    // Pending quotes without follow-up
    const stalePendingQuotes = orders.filter(
      (o) =>
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
        title: 'Bekleyen Sipariş Takibi',
        message: `${stalePendingQuotes.length} sipariş 1 haftadır bekliyor.`,
        action: () => setActivePage('Siparişler'),
        actionLabel: 'İncele',
      });
    }

    // Uninvoiced shipments (Faturası kesilmemiş sevkiyatlar)
    const uninvoicedShipments = shipments.filter(
      (s) => !s.isDeleted && !s.isInvoiced && s.status === 'Teslim Edildi'
    );

    if (uninvoicedShipments.length > 0) {
      alerts.push({
        id: 'uninvoiced-shipments',
        type: 'warning',
        icon: '📄',
        title: 'Faturalanmamış Sevkiyatlar',
        message: `${uninvoicedShipments.length} sevkiyatın faturası kesilmedi.`,
        action: () => setShowUninvoicedModal(true),
        actionLabel: 'Görüntüle',
      });
    }

    if (alerts.length === 0) {
      return null;
    }

    const getAlertStyles = (type: string) => {
      switch (type) {
        case 'danger':
          return 'bg-red-50 border-red-500 text-red-800';
        case 'warning':
          return 'bg-yellow-50 border-yellow-400 text-yellow-800';
        case 'info':
          return 'bg-blue-50 border-blue-500 text-blue-800';
        default:
          return 'bg-gray-50 border-gray-300 text-gray-800';
      }
    };

    return (
      <>
        <div className="space-y-3 mb-6 animate-fadeIn">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-4 ${getAlertStyles(alert.type)} rounded-r-xl shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`bg-${alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-100 p-2 rounded-full text-${alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-600 group-hover:scale-110 transition-transform`}
                >
                  {alert.id === 'inactive-customers' && <UsersIcon className="w-6 h-6" />}
                  {alert.id === 'overdue-deliveries' && <ClockIcon className="w-6 h-6" />}
                  {alert.id === 'stale-quotes' && <ClipboardListIcon className="w-6 h-6" />}
                  {alert.id === 'uninvoiced-shipments' && <DocumentTextIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{alert.title}</h3>
                  <p
                    className={`text-sm ${getAlertStyles(alert.type).match(/text-(red|yellow|blue|gray)-800/)?.[0] || 'text-gray-800'}`}
                  >
                    {alert.message}
                  </p>
                </div>
              </div>
              {alert.action && alert.actionLabel && (
                <button
                  onClick={alert.action}
                  className={`px-4 py-2 bg-white text-${alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-700 text-sm font-semibold rounded-lg hover:bg-${alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-50 border border-${alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-200 transition-colors`}
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
            shipments={shipments}
            onViewAllOrders={() => {
              setShowOverdueModal(false);
              setActivePage('Siparişler');
            }}
          />
        </Modal>

        {/* Uninvoiced Shipments Modal */}
        <Modal
          show={showUninvoicedModal}
          onClose={() => setShowUninvoicedModal(false)}
          title="Faturası Kesilmemiş Sevkiyatlar"
          maxWidth="max-w-4xl"
        >
          <UninvoicedShipmentsModal
            shipments={uninvoicedShipments}
            orders={orders}
            customers={customers}
            onViewAllShipments={() => {
              setShowUninvoicedModal(false);
              setActivePage('Sevkiyat');
            }}
          />
        </Modal>
      </>
    );
  }
);

CriticalAlerts.displayName = 'CriticalAlerts';

export default CriticalAlerts;
