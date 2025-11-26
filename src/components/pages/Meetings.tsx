import React, { useState, useMemo, memo, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import MeetingForm from '../forms/MeetingForm';
import MeetingDetail from './MeetingDetail';
import ActionsDropdown from '../common/ActionsDropdown';
import MobileListItem from '../common/MobileListItem';
import MobileActions from '../common/MobileActions';
import SkeletonTable from '../common/SkeletonTable';
import EmptyState from '../common/EmptyState';
import { PlusIcon } from '../icons';
import { formatDate, getStatusClass } from '../../utils/formatters';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Meeting, Customer, Product } from '../../types';

const locales = {
  tr: tr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Meeting;
}

interface MeetingFilters {
  status: string;
  meetingType: string;
  dateRange: string;
}

interface DeleteConfirmState {
  isOpen: boolean;
  item: (Meeting & { count?: number }) | null;
}

interface MeetingsProps {
  /** List of meetings */
  meetings: Meeting[];
  /** List of customers */
  customers: Customer[];
  /** List of products */
  products: Product[];
  /** Callback when meeting is saved */
  onSave: (meeting: Partial<Meeting>) => void;
  /** Callback when meeting is deleted */
  onDelete: (id: string) => void;
  /** Callback when customer is saved */
  onCustomerSave: (customer: Partial<Customer>) => Promise<string | void>;
  /** Callback when product is saved */
  onProductSave: (product: Partial<Product>) => Promise<string | void>;
  /** Callback to create quote from meeting */
  onCreateQuote?: (customerId: string, products: any[]) => void;
  /** Loading state */
  loading?: boolean;
  /** Selected customer ID from navigation */
  selectedCustomerId?: string | null;
  /** Callback when customer is selected */
  onCustomerSelected?: () => void;
}

/**
 * Meetings component - Meeting management page with calendar view
 */
const Meetings = memo<MeetingsProps>(
  ({
    meetings,
    customers,
    products,
    onSave,
    onDelete,
    onCustomerSave,
    onProductSave,
    onCreateQuote,
    loading = false,
    selectedCustomerId,
    onCustomerSelected,
  }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
      isOpen: false,
      item: null,
    });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [calendarView, setCalendarView] = useState<View>('month');
    const [filters, setFilters] = useState<MeetingFilters>({
      status: 'Tümü',
      meetingType: 'Tümü',
      dateRange: 'Tümü',
    });
    const [sortBy, setSortBy] = useState<'date' | 'next_action_date' | 'status' | 'customer'>(
      'date'
    );
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Handle selected customer from navigation
    useEffect(() => {
      if (selectedCustomerId) {
        // Create a new meeting with pre-selected customer
        const customer = customers.find((c) => c.id === selectedCustomerId);
        if (customer) {
          setCurrentMeeting({
            customerId: selectedCustomerId,
            customerName: customer.name,
          } as Meeting);
          setIsModalOpen(true);
          setViewMode('list'); // Switch to list view to show the modal
          // Clear the selection after opening
          if (onCustomerSelected) {
            onCustomerSelected();
          }
        }
      }
    }, [selectedCustomerId, customers, onCustomerSelected]);

    const handleOpenModal = (meeting: Meeting | null = null) => {
      setCurrentMeeting(meeting);
      setIsModalOpen(true);
      setIsDetailModalOpen(false);
    };

    const handleOpenDetailModal = (meeting: Meeting) => {
      setCurrentMeeting(meeting);
      setIsDetailModalOpen(true);
      setIsModalOpen(false);
    };

    const handleSave = (meetingData: Partial<Meeting>) => {
      onSave(meetingData);
      setIsModalOpen(false);
    };

    const handleDelete = (item: Meeting) => {
      setDeleteConfirm({ isOpen: true, item });
    };

    const confirmDelete = () => {
      if (deleteConfirm.item) {
        if (deleteConfirm.item.id === 'batch') {
          confirmBatchDelete();
        } else {
          onDelete(deleteConfirm.item.id);
          setDeleteConfirm({ isOpen: false, item: null });
        }
      }
    };

    // Batch delete functions
    const handleSelectItem = (id: string) => {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
      if (selectedItems.size === filteredAndSortedMeetings.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredAndSortedMeetings.map((m) => m.id)));
      }
    };

    const handleBatchDelete = () => {
      setDeleteConfirm({
        isOpen: true,
        item: { id: 'batch', count: selectedItems.size } as any,
      });
    };

    const confirmBatchDelete = () => {
      selectedItems.forEach((id) => onDelete(id));
      setSelectedItems(new Set());
      setDeleteConfirm({ isOpen: false, item: null });
    };

    // Quick action handlers
    const handleQuickComplete = (meeting: Meeting) => {
      onSave({ ...meeting, status: 'Tamamlandı' });
      toast.success('Görüşme tamamlandı olarak işaretlendi!');
    };

    // Filter out deleted meetings
    const activeMeetings = meetings.filter((item) => !item.isDeleted);

    const calendarEvents = useMemo<CalendarEvent[]>(() => {
      const eventsByDay: Record<string, Meeting[]> = {};

      activeMeetings.forEach((meeting) => {
        // Validate date before using it
        const dateValue = meeting.next_action_date || meeting.meeting_date;
        if (!dateValue) return; // Skip if no date

        const dateObj = new Date(dateValue);
        // Check if date is valid
        if (isNaN(dateObj.getTime())) return; // Skip invalid dates

        const date = dateObj.toISOString().split('T')[0];
        if (!eventsByDay[date]) {
          eventsByDay[date] = [];
        }
        eventsByDay[date].push(meeting);
      });

      const allEvents: CalendarEvent[] = [];
      Object.values(eventsByDay).forEach((dayMeetings) => {
        dayMeetings.forEach((meeting, index) => {
          const customer = customers.find((c) => c.id === meeting.customerId);
          const dateValue = meeting.next_action_date || meeting.meeting_date;
          if (!dateValue) return; // Skip if no date

          const start = new Date(dateValue);
          if (isNaN(start.getTime())) return; // Skip invalid dates

          start.setHours(9 + index, 0, 0, 0); // Stagger events by an hour

          const end = new Date(start);
          end.setHours(start.getHours() + 1);

          allEvents.push({
            id: meeting.id,
            title: `${customer?.name || 'Bilinmeyen'}: ${meeting.next_action_notes || meeting.notes}`,
            start,
            end,
            allDay: false,
            resource: meeting,
          });
        });
      });

      return allEvents;
    }, [activeMeetings, customers]);

    // Apply filters and sorting
    const filteredAndSortedMeetings = useMemo(() => {
      return activeMeetings
        .filter((meeting) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Status filter
          if (filters.status !== 'Tümü' && meeting.status !== filters.status) {
            return false;
          }

          // Meeting type filter
          if (filters.meetingType !== 'Tümü' && meeting.meetingType !== filters.meetingType) {
            return false;
          }

          // Date range filter
          if (filters.dateRange !== 'Tümü') {
            const meetingDate = new Date(meeting.meeting_date);
            meetingDate.setHours(0, 0, 0, 0);

            if (filters.dateRange === 'Bugün') {
              if (meetingDate.getTime() !== today.getTime()) return false;
            } else if (filters.dateRange === 'Bu Hafta') {
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              if (meetingDate < weekAgo || meetingDate > today) return false;
            } else if (filters.dateRange === 'Gecikmiş') {
              const nextActionDate = meeting.next_action_date
                ? new Date(meeting.next_action_date)
                : null;
              if (
                !nextActionDate ||
                nextActionDate >= today ||
                meeting.status === 'Tamamlandı' ||
                meeting.status === 'İptal Edildi'
              ) {
                return false;
              }
            }
          }

          return true;
        })
        .sort((a, b) => {
          let comparison = 0;

          if (sortBy === 'date') {
            comparison = new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime();
          } else if (sortBy === 'next_action_date') {
            const dateA = a.next_action_date
              ? new Date(a.next_action_date)
              : new Date('9999-12-31');
            const dateB = b.next_action_date
              ? new Date(b.next_action_date)
              : new Date('9999-12-31');
            comparison = dateA.getTime() - dateB.getTime();
          } else if (sortBy === 'status') {
            comparison = (a.status || '').localeCompare(b.status || '');
          } else if (sortBy === 'customer') {
            const customerA = customers.find((c) => c.id === a.customerId)?.name || '';
            const customerB = customers.find((c) => c.id === b.customerId)?.name || '';
            comparison = customerA.localeCompare(customerB);
          }

          return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [activeMeetings, filters, sortBy, sortOrder, customers]);

    // Show skeleton when loading
    if (loading) {
      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Görüşme Takibi</h1>
          </div>
          {/* Desktop: Table skeleton */}
          <div className="hidden md:block">
            <SkeletonTable rows={10} columns={9} />
          </div>
          {/* Mobile: Card skeleton */}
          <div className="md:hidden">
            <SkeletonTable rows={10} columns={9} mobileCardView={true} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Görüşme Takibi
          </h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Takvim
              </button>
            </div>
            {selectedItems.size > 0 && viewMode === 'list' && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center flex-1 sm:flex-none bg-red-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-600"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="hidden sm:inline">Seçili {selectedItems.size} Kaydı Sil</span>
                <span className="sm:hidden">Sil ({selectedItems.size})</span>
              </button>
            )}
            <button
              onClick={() => handleOpenModal()}
              data-action="add-meeting"
              className="flex items-center flex-1 sm:flex-none bg-blue-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-600"
            >
              <PlusIcon />
              <span className="hidden sm:inline">Yeni Görüşme Kaydı</span>
              <span className="sm:hidden">Yeni</span>
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <>
            {/* Filters and Sorting */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option>Tümü</option>
                    <option>Planlandı</option>
                    <option>Tamamlandı</option>
                    <option>İptal Edildi</option>
                    <option>Ertelendi</option>
                    <option>Tekrar Aranacak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Görüşme Türü
                  </label>
                  <select
                    value={filters.meetingType}
                    onChange={(e) => setFilters({ ...filters, meetingType: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option>Tümü</option>
                    <option>İlk Temas</option>
                    <option>Teklif Sunumu</option>
                    <option>Takip Görüşmesi</option>
                    <option>İtiraz Yönetimi</option>
                    <option>Kapanış Görüşmesi</option>
                    <option>Müşteri Ziyareti</option>
                    <option>Online Toplantı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option>Tümü</option>
                    <option>Bugün</option>
                    <option>Bu Hafta</option>
                    <option>Gecikmiş</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="date">Görüşme Tarihi</option>
                      <option value="next_action_date">Eylem Tarihi</option>
                      <option value="status">Durum</option>
                      <option value="customer">Müşteri</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                      title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {filteredAndSortedMeetings.length} görüşme gösteriliyor
                {filteredAndSortedMeetings.length !== activeMeetings.length &&
                  ` (${activeMeetings.length} toplam)`}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '50px' }} />
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '150px' }} />
                </colgroup>
                <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={
                          filteredAndSortedMeetings.length > 0 &&
                          selectedItems.size === filteredAndSortedMeetings.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-300">
                      Müşteri
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Tarih
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">
                      Durum
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">
                      Tür
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300">
                      Sonuç
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Sonraki Eylem
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Eylem Tarihi
                    </th>
                    <th className="p-3 text-sm font-semibold tracking-wide text-right text-gray-700 dark:text-gray-300">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredAndSortedMeetings.length > 0 ? (
                    filteredAndSortedMeetings.map((meeting) => {
                      const customer = customers.find((c) => c.id === meeting.customerId);
                      const meetingActions = [
                        { label: 'Detay', onClick: () => handleOpenDetailModal(meeting) },
                        { label: 'Düzenle', onClick: () => handleOpenModal(meeting) },
                        { label: 'Sil', onClick: () => handleDelete(meeting), destructive: true },
                      ];

                      return (
                        <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-3 text-sm text-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(meeting.id)}
                              onChange={() => handleSelectItem(meeting.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-3 text-sm text-left text-gray-900 dark:text-gray-100 font-bold">
                            {customer?.name || 'Bilinmiyor'}
                          </td>
                          <td className="p-3 text-sm text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(meeting.meeting_date)}
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${getStatusClass(meeting.status || 'Planlandı')}`}
                            >
                              {meeting.status || 'Planlandı'}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap">
                              {meeting.meetingType || 'İlk Temas'}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${getStatusClass(meeting.outcome)}`}
                            >
                              {meeting.outcome || '-'}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center text-gray-700 dark:text-gray-300">
                            <div className="max-w-xs truncate" title={meeting.next_action_notes}>
                              {meeting.next_action_notes || '-'}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(meeting.next_action_date) || '-'}
                          </td>
                          <td className="p-3 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleQuickComplete(meeting)}
                                className={`p-1 rounded-full ${meeting.status === 'Tamamlandı' ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800'}`}
                                title="Tamamla"
                                disabled={meeting.status === 'Tamamlandı'}
                              >
                                <svg
                                  className="w-4 h-4 text-green-700 dark:text-green-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                              </button>
                              <ActionsDropdown actions={meetingActions} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <EmptyState
                          icon={
                            Object.values(filters).some((f) => f !== 'Tümü') ? 'search' : 'meetings'
                          }
                          title={
                            Object.values(filters).some((f) => f !== 'Tümü')
                              ? 'Görüşme Bulunamadı'
                              : 'Henüz Görüşme Yok'
                          }
                          description={
                            Object.values(filters).some((f) => f !== 'Tümü')
                              ? 'Filtrelere uygun görüşme bulunamadı.'
                              : undefined
                          }
                          action={
                            !Object.values(filters).some((f) => f !== 'Tümü')
                              ? {
                                  label: 'Yeni Görüşme Ekle',
                                  onClick: () => handleOpenModal(),
                                  icon: <PlusIcon />,
                                }
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredAndSortedMeetings.length > 0 ? (
                filteredAndSortedMeetings.map((meeting) => {
                  const customer = customers.find((c) => c.id === meeting.customerId);

                  return (
                    <MobileListItem
                      key={meeting.id}
                      title={customer?.name || 'Bilinmiyor'}
                      subtitle={formatDate(meeting.meeting_date)}
                      onClick={() => handleOpenDetailModal(meeting)}
                      rightContent={
                        <span
                          className={`px-2 py-1 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.status || 'Planlandı')}`}
                        >
                          {meeting.status || 'Planlandı'}
                        </span>
                      }
                      bottomContent={
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Tür:</span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {meeting.meetingType || 'İlk Temas'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Sonuç:</span>
                            <span
                              className={`px-2 py-1 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.outcome)}`}
                            >
                              {meeting.outcome}
                            </span>
                          </div>
                          {meeting.next_action_notes && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-gray-600 dark:text-gray-400">
                                Sonraki Eylem:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium text-right">
                                {meeting.next_action_notes}
                              </span>
                            </div>
                          )}
                          {meeting.next_action_date && (
                            <div className="flex items-center justify-between py-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                Eylem Tarihi:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100 font-bold">
                                {formatDate(meeting.next_action_date)}
                              </span>
                            </div>
                          )}
                        </div>
                      }
                      actions={
                        <div className="space-y-2 mt-3">
                          {meeting.status !== 'Tamamlandı' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickComplete(meeting);
                              }}
                              className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                              Tamamlandı Olarak İşaretle
                            </button>
                          )}
                          <MobileActions
                            actions={[
                              {
                                label: 'Düzenle',
                                onClick: (e) => {
                                  e?.stopPropagation();
                                  handleOpenModal(meeting);
                                },
                                variant: 'primary',
                              },
                              {
                                label: 'Sil',
                                onClick: (e) => {
                                  e?.stopPropagation();
                                  handleDelete(meeting);
                                },
                                variant: 'danger',
                              },
                            ]}
                          />
                        </div>
                      }
                    />
                  );
                })
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <EmptyState
                    icon={Object.values(filters).some((f) => f !== 'Tümü') ? 'search' : 'meetings'}
                    title={
                      Object.values(filters).some((f) => f !== 'Tümü')
                        ? 'Görüşme Bulunamadı'
                        : 'Henüz Görüşme Yok'
                    }
                    description={
                      Object.values(filters).some((f) => f !== 'Tümü')
                        ? 'Filtrelere uygun görüşme bulunamadı.'
                        : undefined
                    }
                    action={
                      !Object.values(filters).some((f) => f !== 'Tümü')
                        ? {
                            label: 'Yeni Görüşme Ekle',
                            onClick: () => handleOpenModal(),
                            icon: <PlusIcon />,
                          }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'calendar' && (
          <div className="bg-white p-4 rounded-lg shadow" style={{ height: '70vh' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={(event) => handleOpenDetailModal(event.resource)}
              view={calendarView}
              onView={setCalendarView}
              messages={{
                next: '>',
                previous: '<',
                today: 'Bugün',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün',
                agenda: 'Ajanda',
              }}
            />
          </div>
        )}

        <Modal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentMeeting ? 'Görüşme Kaydını Düzenle' : 'Yeni Görüşme Kaydı Ekle'}
        >
          <MeetingForm
            meeting={currentMeeting || undefined}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            customers={customers}
            products={products}
            onCustomerSave={onCustomerSave}
            onProductSave={onProductSave}
            onCreateQuote={onCreateQuote}
            readOnly={false}
          />
        </Modal>

        <Modal
          show={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Görüşme Detayı"
        >
          <MeetingDetail
            meeting={currentMeeting}
            customer={customers.find((c) => c.id === currentMeeting?.customerId)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
          onConfirm={confirmDelete}
          title={deleteConfirm.item?.id === 'batch' ? 'Toplu Silme' : 'Görüşmeyi Sil'}
          message={
            deleteConfirm.item?.id === 'batch'
              ? `Seçili ${deleteConfirm.item?.count} görüşme kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
              : `"${deleteConfirm.item?.id}" görüşmesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
          }
        />
      </div>
    );
  }
);

Meetings.displayName = 'Meetings';

export default Meetings;
