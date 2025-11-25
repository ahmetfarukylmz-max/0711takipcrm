import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';

const OverdueActions = ({ overdueItems, setActivePage, onMeetingUpdate }) => {
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newDate, setNewDate] = useState('');

    const handleReschedule = (e, item) => {
        e.stopPropagation();
        setSelectedItem(item);
        setNewDate(item.next_action_date || '');
        setIsRescheduleModalOpen(true);
    };

    const handleComplete = async (e, item) => {
        e.stopPropagation();
        if (!onMeetingUpdate) {
            toast.error('Güncelleme fonksiyonu bulunamadı!');
            return;
        }

        try {
            // Remove extra fields that don't belong in Firestore
            // eslint-disable-next-line no-unused-vars
            const { type, customerName, ...meetingData } = item;
            await onMeetingUpdate({
                ...meetingData,
                status: 'Tamamlandı'
            });
            toast.success('Görüşme tamamlandı olarak işaretlendi!');
        } catch (error) {
            console.error('Görüşme güncellenemedi:', error);
            toast.error('Görüşme güncellenemedi!');
        }
    };

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        if (!onMeetingUpdate) {
            toast.error('Güncelleme fonksiyonu bulunamadı!');
            return;
        }

        if (!newDate) {
            toast.error('Lütfen yeni tarih giriniz!');
            return;
        }

        try {
            // Remove extra fields that don't belong in Firestore
            // eslint-disable-next-line no-unused-vars
            const { type, customerName, ...meetingData } = selectedItem;
            await onMeetingUpdate({
                ...meetingData,
                next_action_date: newDate
            });
            toast.success('Görüşme yeniden zamanlandı!');
            setIsRescheduleModalOpen(false);
            setSelectedItem(null);
            setNewDate('');
        } catch (error) {
            console.error('Görüşme güncellenemedi:', error);
            toast.error('Görüşme güncellenemedi!');
        }
    };

    const handleItemClick = (page) => {
        setActivePage(page);
    };

    const groupedItems = overdueItems.reduce((acc, item) => {
        const type = item.type === 'meeting' ? 'Görüşmeler' : 'Diğer';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(item);
        return acc;
    }, {});

    const isOverdueByWeek = (date) => {
        const today = new Date();
        const actionDate = new Date(date);
        const diffTime = today - actionDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7;
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-600 shadow-md rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Gecikmiş Eylemler</h2>
                <div className="max-h-96 overflow-y-auto">
                    {overdueItems.length > 0 ? (
                        Object.keys(groupedItems).map(group => (
                            <div key={group} className="mb-4">
                                <h3 className="p-2 bg-gray-100 dark:bg-gray-600 font-bold text-md text-gray-700 dark:text-gray-300 rounded-t-lg">{group}</h3>
                                <ul className="divide-y divide-gray-200 dark:divide-gray-500">
                                    {groupedItems[group].map(item => (
                                        <li
                                            key={item.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer ${isOverdueByWeek(item.next_action_date) ? 'bg-red-50 dark:bg-red-900' : ''}`}
                                            onClick={() => handleItemClick(group)}
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-1">
                                                    <p className="text-md font-semibold text-gray-900 dark:text-white">{item.customerName}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.next_action_notes}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Eylem Tarihi: {new Date(item.next_action_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="ml-4 flex-shrink-0 flex flex-col gap-2">
                                                    <button onClick={(e) => handleReschedule(e, item)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Yeniden Zamanla</button>
                                                    <button onClick={(e) => handleComplete(e, item)} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Tamamlandı</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">Gecikmiş eylem bulunmuyor.</p>
                    )}
                </div>
            </div>

            <Modal
                show={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                title="Görüşmeyi Yeniden Zamanla"
            >
                <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                    {selectedItem && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Müşteri:</strong> {selectedItem.customerName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Notlar:</strong> {selectedItem.next_action_notes}
                            </p>
                        </div>
                    )}
                    <FormInput
                        label="Yeni Eylem Tarihi"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setIsRescheduleModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default OverdueActions;
