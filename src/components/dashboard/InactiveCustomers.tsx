import React, { memo, useMemo } from 'react';
import { WhatsAppIcon } from '../icons';
import { formatDate, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import type { Customer, Meeting, Order, Quote, Shipment } from '../../types';

interface InactiveCustomer {
  customer: Customer;
  lastInteractionDate: string | null;
  lastInteractionType: 'meeting' | 'order' | 'quote' | 'shipment' | null;
  daysSinceContact: number;
}

interface InactiveCustomersProps {
  customers: Customer[];
  meetings: Meeting[];
  orders: Order[];
  quotes: Quote[];
  shipments: Shipment[];
  setActivePage: (page: string) => void;
  onScheduleMeeting?: (customerId: string) => void;
}

/**
 * InactiveCustomers component - Shows customers not contacted in 2 weeks
 */
const InactiveCustomers = memo<InactiveCustomersProps>(
  ({ customers, meetings, orders, quotes, shipments, setActivePage, onScheduleMeeting }) => {
    const inactiveCustomersList = useMemo<InactiveCustomer[]>(() => {
      const today = new Date();
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

      return customers
        .filter((c) => !c.isDeleted)
        .map((customer) => {
          // Get last meeting
          const lastMeeting = meetings
            .filter((m) => m.customerId === customer.id && !m.isDeleted)
            .sort(
              (a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
            )[0];

          // Get last order
          const lastOrder = orders
            .filter((o) => o.customerId === customer.id && !o.isDeleted)
            .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0];

          // Get last quote
          const lastQuote = quotes
            .filter((q) => q.customerId === customer.id && !q.isDeleted)
            .sort((a, b) => {
              const dateA = a.quote_date || a.teklif_tarihi || '';
              const dateB = b.quote_date || b.teklif_tarihi || '';
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            })[0];

          // Get last shipment
          const lastShipment = shipments
            .filter((s) => s.customerId === customer.id && !s.isDeleted)
            .sort(
              (a, b) => new Date(b.shipmentDate).getTime() - new Date(a.shipmentDate).getTime()
            )[0];

          // Find the most recent interaction
          const interactions: Array<{
            date: string;
            type: 'meeting' | 'order' | 'quote' | 'shipment';
          }> = [];

          if (lastMeeting) interactions.push({ date: lastMeeting.meeting_date, type: 'meeting' });
          if (lastOrder) interactions.push({ date: lastOrder.order_date, type: 'order' });
          if (lastQuote) {
            const quoteDate = lastQuote.quote_date || lastQuote.teklif_tarihi;
            if (quoteDate) interactions.push({ date: quoteDate, type: 'quote' });
          }
          if (lastShipment)
            interactions.push({ date: lastShipment.shipmentDate, type: 'shipment' });

          if (interactions.length === 0) {
            return {
              customer,
              lastInteractionDate: null,
              lastInteractionType: null,
              daysSinceContact: 999, // Never contacted
            };
          }

          const lastInteraction = interactions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          const daysSinceContact = Math.floor(
            (today.getTime() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            customer,
            lastInteractionDate: lastInteraction.date,
            lastInteractionType: lastInteraction.type,
            daysSinceContact,
          };
        })
        .filter(
          (item) => !item.lastInteractionDate || new Date(item.lastInteractionDate) < twoWeeksAgo
        )
        .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
    }, [customers, meetings, orders, quotes, shipments]);

    if (inactiveCustomersList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-gray-600 dark:text-gray-400">
            Tüm müşterilerinizle aktif iletişimdesiniz!
          </p>
        </div>
      );
    }

    const getUrgencyColor = (days: number) => {
      if (days > 60) return 'text-red-600 dark:text-red-400';
      if (days > 30) return 'text-orange-600 dark:text-orange-400';
      return 'text-yellow-600 dark:text-yellow-400';
    };

    const getUrgencyBadge = (days: number) => {
      if (days > 60) return { icon: '🔴', text: 'Çok Acil' };
      if (days > 30) return { icon: '🟠', text: 'Acil' };
      return { icon: '🟡', text: 'Dikkat' };
    };

    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Toplam {inactiveCustomersList.length} müşteriyle etkileşim yok
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                Son 2 haftada hiç görüşme, sipariş, teklif veya sevkiyat kaydı bulunmuyor
              </p>
            </div>
            <button
              onClick={() => setActivePage('Müşteriler')}
              className="px-3 py-1.5 text-xs font-semibold bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Tüm Müşteriler
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {inactiveCustomersList.map((item) => {
            const badge = getUrgencyBadge(item.daysSinceContact);
            const urgencyColor = getUrgencyColor(item.daysSinceContact);

            // Get interaction type icon and label
            const getInteractionInfo = (
              type: 'meeting' | 'order' | 'quote' | 'shipment' | null
            ) => {
              switch (type) {
                case 'meeting':
                  return { icon: '📞', label: 'Görüşme' };
                case 'order':
                  return { icon: '🛒', label: 'Sipariş' };
                case 'quote':
                  return { icon: '📄', label: 'Teklif' };
                case 'shipment':
                  return { icon: '🚚', label: 'Sevkiyat' };
                default:
                  return { icon: '❌', label: 'Etkileşim yok' };
              }
            };

            const interactionInfo = getInteractionInfo(item.lastInteractionType);

            return (
              <div
                key={item.customer.id}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                        {item.customer.name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {badge.icon} {badge.text}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      {item.customer.phone && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span>📱</span>
                          <span>{item.customer.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>{interactionInfo.icon}</span>
                        <span className={urgencyColor}>
                          {item.lastInteractionDate
                            ? `Son ${interactionInfo.label}: ${formatDate(item.lastInteractionDate)} (${item.daysSinceContact} gün önce)`
                            : 'Hiç etkileşim kaydı yok'}
                        </span>
                      </div>

                      {item.customer.address && (
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                          <span>📍</span>
                          <span className="line-clamp-1">{item.customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {item.customer.phone && (
                      <a
                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(item.customer.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                        title="WhatsApp ile mesaj gönder"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}

                    <button
                      onClick={() => {
                        if (onScheduleMeeting) {
                          onScheduleMeeting(item.customer.id);
                        }
                        setActivePage('Görüşmeler');
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                      title="Görüşme planla"
                    >
                      📞 Planla
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

InactiveCustomers.displayName = 'InactiveCustomers';

export default InactiveCustomers;
