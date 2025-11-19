import React, { useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { formatCurrency } from '../../utils/formatters';
import type { Payment } from '../../types';

// Türkçe yerelleştirme
import 'moment/locale/tr';
moment.locale('tr');

const localizer = momentLocalizer(moment);

interface PaymentCalendarProps {
  payments: Payment[];
  onSelectPayment: (payment: Payment) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Payment;
  style: {
    backgroundColor: string;
    borderColor: string;
  };
}

const PaymentCalendar: React.FC<PaymentCalendarProps> = ({
  payments,
  onSelectPayment,
  onSelectSlot
}) => {
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Ödemeleri takvim event'lerine dönüştür
  const calendarEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return payments
      .filter(p => !p.isDeleted && p.status !== 'İptal')
      .map(p => {
        const dueDate = new Date(p.dueDate);

        // Renk belirleme
        let backgroundColor = '#3b82f6'; // Mavi (bekliyor)
        let borderColor = '#2563eb';

        if (p.status === 'Tahsil Edildi') {
          backgroundColor = '#10b981'; // Yeşil
          borderColor = '#059669';
        } else if (p.status === 'Gecikti' || dueDate < today) {
          backgroundColor = '#ef4444'; // Kırmızı
          borderColor = '#dc2626';
        } else {
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 7) {
            backgroundColor = '#f59e0b'; // Sarı (yaklaşıyor)
            borderColor = '#d97706';
          }
        }

        const event: CalendarEvent = {
          id: p.id,
          title: `${p.customerName || 'Müşteri'} - ${formatCurrency(p.amount, p.currency)}`,
          start: dueDate,
          end: dueDate,
          resource: p,
          style: {
            backgroundColor,
            borderColor
          }
        };

        return event;
      });
  }, [payments]);

  // Event'e tıklandığında
  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectPayment(event.resource);
  };

  // Tarih seçildiğinde (yeni ödeme eklemek için)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action: string }) => {
    if (onSelectSlot && slotInfo.action === 'click') {
      onSelectSlot(slotInfo);
    }
  };

  // Event stillerini döndür
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.style.backgroundColor,
        borderColor: event.style.borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        color: 'white',
        fontSize: '0.85rem',
        padding: '2px 4px'
      }
    };
  };

  // Türkçe mesajlar
  const messages = {
    today: 'Bugün',
    previous: 'Önceki',
    next: 'Sonraki',
    month: 'Ay',
    week: 'Hafta',
    day: 'Gün',
    agenda: 'Ajanda',
    date: 'Tarih',
    time: 'Saat',
    event: 'Ödeme',
    noEventsInRange: 'Bu tarih aralığında ödeme yok.',
    showMore: (total: number) => `+${total} daha`
  };

  // Bugüne git
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={navigateToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            📅 Bugün
          </button>
        </div>

        {/* Renk Açıklamaları */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Bekliyor</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Yaklaşıyor (7 gün)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Gecikmiş</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Tahsil Edildi</span>
          </div>
        </div>
      </div>

      {/* Takvim */}
      <div className="calendar-container" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          messages={messages}
          eventPropGetter={eventStyleGetter}
          popup
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
        />
      </div>

      {/* Takvim için özel CSS */}
      <style>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }

        .calendar-container .rbc-header {
          padding: 10px 4px;
          font-weight: 600;
          color: rgb(55, 65, 81);
          background-color: rgb(249, 250, 251);
          border-bottom: 2px solid rgb(229, 231, 235);
        }

        .dark .calendar-container .rbc-header {
          color: rgb(209, 213, 219);
          background-color: rgb(31, 41, 55);
          border-bottom-color: rgb(55, 65, 81);
        }

        .calendar-container .rbc-today {
          background-color: rgb(239, 246, 255);
        }

        .dark .calendar-container .rbc-today {
          background-color: rgb(30, 58, 138);
        }

        .calendar-container .rbc-off-range-bg {
          background-color: rgb(249, 250, 251);
        }

        .dark .calendar-container .rbc-off-range-bg {
          background-color: rgb(17, 24, 39);
        }

        .calendar-container .rbc-event {
          padding: 2px 5px;
          cursor: pointer;
        }

        .calendar-container .rbc-event:hover {
          opacity: 0.85;
        }

        .calendar-container .rbc-toolbar button {
          color: rgb(55, 65, 81);
          border: 1px solid rgb(209, 213, 219);
          background-color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .dark .calendar-container .rbc-toolbar button {
          color: rgb(209, 213, 219);
          border-color: rgb(55, 65, 81);
          background-color: rgb(31, 41, 55);
        }

        .calendar-container .rbc-toolbar button:hover {
          background-color: rgb(243, 244, 246);
        }

        .dark .calendar-container .rbc-toolbar button:hover {
          background-color: rgb(55, 65, 81);
        }

        .calendar-container .rbc-toolbar button.rbc-active {
          background-color: rgb(59, 130, 246);
          color: white;
          border-color: rgb(59, 130, 246);
        }

        .calendar-container .rbc-month-view,
        .calendar-container .rbc-time-view {
          background-color: white;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 8px;
        }

        .dark .calendar-container .rbc-month-view,
        .dark .calendar-container .rbc-time-view {
          background-color: rgb(31, 41, 55);
          border-color: rgb(55, 65, 81);
        }

        .calendar-container .rbc-day-bg,
        .calendar-container .rbc-time-slot {
          border-color: rgb(229, 231, 235);
        }

        .dark .calendar-container .rbc-day-bg,
        .dark .calendar-container .rbc-time-slot {
          border-color: rgb(55, 65, 81);
        }

        .calendar-container .rbc-date-cell {
          padding: 4px;
        }

        .dark .calendar-container .rbc-date-cell {
          color: rgb(209, 213, 219);
        }

        .calendar-container .rbc-show-more {
          background-color: transparent;
          color: rgb(59, 130, 246);
          font-weight: 600;
          font-size: 0.75rem;
          padding: 2px 4px;
        }

        .dark .calendar-container .rbc-show-more {
          color: rgb(96, 165, 250);
        }
      `}</style>
    </div>
  );
};

export default PaymentCalendar;
