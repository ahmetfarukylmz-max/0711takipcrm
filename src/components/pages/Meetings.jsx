import React, { useState } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import MeetingForm from '../forms/MeetingForm';
import { PlusIcon, WhatsAppIcon } from '../icons';
import { formatDate, getStatusClass, formatPhoneNumberForWhatsApp } from '../../utils/formatters';

const Meetings = ({ meetings, customers, onSave, onDelete, onCustomerSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });
    const [selectedItems, setSelectedItems] = useState(new Set());

    const handleOpenModal = (meeting = null) => {
        setCurrentMeeting(meeting);
        setIsModalOpen(true);
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
        if (selectedItems.size === activeMeetings.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(activeMeetings.map(m => m.id)));
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

    // Filter out deleted meetings
    const activeMeetings = meetings.filter(item => !item.isDeleted);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Görüşme Takibi</h1>
                <div className="flex gap-3">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Seçili {selectedItems.size} Kaydı Sil
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        Yeni Görüşme Kaydı
                    </button>
                </div>
            </div>
            <div className="overflow-auto rounded-lg shadow bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left">
                                <input
                                    type="checkbox"
                                    checked={activeMeetings.length > 0 && selectedItems.size === activeMeetings.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            {['Müşteri', 'Görüşme Tarihi', 'Sonuç', 'Sonraki Eylem', 'Eylem Tarihi', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {activeMeetings.map(meeting => {
                            const customer = customers.find(c => c.id === meeting.customerId);
                            return (
                                <tr key={meeting.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(meeting.id)}
                                            onChange={() => handleSelectItem(meeting.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 font-bold">
                                        <div>
                                            <div>{customer?.name || 'Bilinmiyor'}</div>
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
                                <td className="p-3 text-sm text-gray-700">{formatDate(meeting.date)}</td>
                                <td className="p-3 text-sm">
                                    <span
                                        className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.outcome)}`}
                                    >
                                        {meeting.outcome}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-700">{meeting.next_action_notes}</td>
                                <td className="p-3 text-sm text-gray-700">{formatDate(meeting.next_action_date)}</td>
                                <td className="p-3 text-sm text-gray-700">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleOpenModal(meeting)}
                                            className="text-blue-500 hover:underline"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(meeting)}
                                            className="text-red-500 hover:underline"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>
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
};

export default Meetings;
