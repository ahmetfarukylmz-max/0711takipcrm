import React, { useState, useMemo, memo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import MeetingForm from '../forms/MeetingForm';
import MeetingDetail from './MeetingDetail';
import ActionsDropdown from '../common/ActionsDropdown';
import { PlusIcon, WhatsAppIcon } from '../icons';
import { formatDate, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment);

const Meetings = memo(({ meetings, customers, onSave, onDelete, onCustomerSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [viewMode, setViewMode] = useState('list');
    const [calendarView, setCalendarView] = useState('month');
    const [filters, setFilters] = useState({
        status: 'Tümü',
        meetingType: 'Tümü',
        dateRange: 'Tümü'
    });
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    const handleOpenModal = (meeting = null) => {
        setCurrentMeeting(meeting);
        setIsModalOpen(true);
        setIsDetailModalOpen(false);
    };

    const handleOpenDetailModal = (meeting) => {
        setCurrentMeeting(meeting);
        setIsDetailModalOpen(true);
        setIsModalOpen(false);
    };

    const handleSave = (meetingData) => {
        onSave(meetingData);
        setIsModalOpen(false);
    };

    const handleDelete = (item) => {
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
    const handleSelectItem = (id) => {
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
        }
        else {
            setSelectedItems(new Set(filteredAndSortedMeetings.map(m => m.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            item: { id: 'batch', count: selectedItems.size }
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, item: null });
    };

    // Quick action handlers
    const handleQuickComplete = (meeting) => {
        onSave({ ...meeting, status: 'Tamamlandı' });
        toast.success('Görüşme tamamlandı olarak işaretlendi!');
    };

    // Filter out deleted meetings
    const activeMeetings = meetings.filter(item => !item.isDeleted);

    const calendarEvents = useMemo(() => {
        const eventsByDay = {};

        activeMeetings.forEach(meeting => {
            const date = new Date(meeting.next_action_date || meeting.date).toISOString().split('T')[0];
            if (!eventsByDay[date]) {
                eventsByDay[date] = [];
            }
            eventsByDay[date].push(meeting);
        });

        const allEvents = [];
        Object.values(eventsByDay).forEach(dayMeetings => {
            dayMeetings.forEach((meeting, index) => {
                const customer = customers.find(c => c.id === meeting.customerId);
                const start = new Date(meeting.next_action_date || meeting.date);
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
    const filteredAndSortedMeetings = activeMeetings.filter(meeting => {
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
            const meetingDate = new Date(meeting.date);
            meetingDate.setHours(0, 0, 0, 0);

            if (filters.dateRange === 'Bugün') {
                if (meetingDate.getTime() !== today.getTime()) return false;
            } else if (filters.dateRange === 'Bu Hafta') {
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                if (meetingDate < weekAgo || meetingDate > today) return false;
            } else if (filters.dateRange === 'Gecikmiş') {
                const nextActionDate = meeting.next_action_date ? new Date(meeting.next_action_date) : null;
                if (!nextActionDate || nextActionDate >= today || meeting.status === 'Tamamlandı' || meeting.status === 'İptal Edildi') {
                    return false;
                }
            }
        }

        return true;
    }).sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'date') {
            comparison = new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'next_action_date') {
            const dateA = a.next_action_date ? new Date(a.next_action_date) : new Date('9999-12-31');
            const dateB = b.next_action_date ? new Date(b.next_action_date) : new Date('9999-12-31');
            comparison = dateA - dateB;
        } else if (sortBy === 'status') {
            comparison = (a.status || '').localeCompare(b.status || '');
        } else if (sortBy === 'customer') {
            const customerA = customers.find(c => c.id === a.customerId)?.name || '';
            const customerB = customers.find(c => c.id === b.customerId)?.name || '';
            comparison = customerA.localeCompare(customerB);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Görüşme Takibi</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-400'}`}>Liste</button>
                        <button onClick={() => setViewMode('calendar')} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-400'}`}>Takvim</button>
                    </div>
                    {selectedItems.size > 0 && viewMode === 'list' && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center flex-1 sm:flex-none bg-red-500 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Seçili {selectedItems.size} Kaydı Sil</span>
                            <span className="sm:hidden">Sil ({selectedItems.size})</span>
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Görüşme Türü</label>
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
                                        onChange={(e) => setSortBy(e.target.value)}
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
                            {filteredAndSortedMeetings.length !== activeMeetings.length && ` (${activeMeetings.length} toplam)`}
                        </div>
                    </div>

                    <div className="overflow-auto rounded-lg shadow bg-white">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200 hidden md:table-header-group">
                                <tr>
                                    <th className="p-3 text-sm font-semibold tracking-wide text-left">
                                        <input
                                            type="checkbox"
                                            checked={filteredAndSortedMeetings.length > 0 && selectedItems.size === filteredAndSortedMeetings.length}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    {['Müşteri', 'Görüşme Tarihi', 'Durum', 'Tür', 'Sonuç', 'Sonraki Eylem', 'Eylem Tarihi', 'İşlemler'].map(head => (
                                        <th key={head} className={`p-3 text-sm font-semibold tracking-wide text-left ${head === 'İşlemler' ? 'text-right' : ''}`}>
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y md:divide-none divide-gray-100">
                                {filteredAndSortedMeetings.map(meeting => {
                                    const customer = customers.find(c => c.id === meeting.customerId);
                                    const meetingActions = [
                                        { label: 'Detay', onClick: () => handleOpenDetailModal(meeting) },
                                        { label: 'Düzenle', onClick: () => handleOpenModal(meeting) },
                                        { label: 'Sil', onClick: () => handleDelete(meeting), destructive: true },
                                    ];

                                    return (
                                        <tr key={meeting.id} className="block md:table-row mb-4 md:mb-0 rounded-lg md:rounded-none shadow md:shadow-none hover:bg-gray-50">
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Seç:{' '}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(meeting.id)}
                                                    onChange={() => handleSelectItem(meeting.id)}
                                                    className="w-5 h-5 md:w-4 md:h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Müşteri:{' '}
                                                </span>
                                                <div className="inline-block md:block text-left md:text-left">
                                                    <div className="text-gray-700 font-bold">{customer?.name || 'Bilinmiyor'}</div>
                                                    {customer?.phone && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500 font-normal">{customer.phone}</span>
                                                            <a
                                                                href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.phone)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:text-green-700 transition-colors"
                                                                title="WhatsApp ile mesaj gönder"
                                                            >
                                                                <WhatsAppIcon className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Görüşme Tarihi:{' '}
                                                </span>
                                                <span className="text-gray-700">{formatDate(meeting.date)}</span>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Durum:{' '}
                                                </span>
                                                <span
                                                    className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.status || 'Planlandı')}`}
                                                >
                                                    {meeting.status || 'Planlandı'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Tür:{' '}
                                                </span>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {meeting.meetingType || 'İlk Temas'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Sonuç:{' '}
                                                </span>
                                                <span
                                                    className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.outcome)}`}
                                                >
                                                    {meeting.outcome}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Sonraki Eylem:{' '}
                                                </span>
                                                <span className="text-gray-700">{meeting.next_action_notes}</span>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    Eylem Tarihi:{' '}
                                                </span>
                                                <span className="text-gray-700">{formatDate(meeting.next_action_date)}</span>
                                            </td>
                                            <td className="p-3 text-sm block md:table-cell text-right md:text-left">
                                                <span className="float-left font-semibold text-gray-500 md:hidden uppercase tracking-wider text-xs">
                                                    İşlemler:{' '}
                                                </span>
                                                <div className="flex items-center justify-end md:justify-end gap-2 min-h-[44px]">
                                                    <button
                                                        onClick={() => handleQuickComplete(meeting)}
                                                        className={`p-2 rounded-full min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1 ${meeting.status === 'Tamamlandı' ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-100 hover:bg-green-200'}`}
                                                        title="Tamamla"
                                                        disabled={meeting.status === 'Tamamlandı'}
                                                    >
                                                        <svg className="w-5 h-5 md:w-4 md:h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                    </button>
                                                    <ActionsDropdown actions={meetingActions} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
                        onSelectEvent={event => handleOpenDetailModal(event.resource)}
                        view={calendarView}
                        onView={setCalendarView}
                        messages={{
                            next: ">",
                            previous: "<",
                            today: "Bugün",
                            month: "Ay",
                            week: "Hafta",
                            day: "Gün",
                            agenda: "Ajanda",
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
                    meeting={currentMeeting}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    customers={customers}
                    onCustomerSave={onCustomerSave}
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
                    customer={customers.find(c => c.id === currentMeeting?.customerId)}
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
});

Meetings.displayName = 'Meetings';

export default Meetings;
