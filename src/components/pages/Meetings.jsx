import React, { useState } from 'react';
import Modal from '../common/Modal';
import MeetingForm from '../forms/MeetingForm';
import { PlusIcon } from '../icons';
import { formatDate, getStatusClass } from '../../utils/formatters';

const Meetings = ({ meetings, customers, onSave, onCustomerSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);

    const handleOpenModal = (meeting = null) => {
        setCurrentMeeting(meeting);
        setIsModalOpen(true);
    };

    const handleSave = (meetingData) => {
        onSave(meetingData);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Görüşme Takibi</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    <PlusIcon />
                    Yeni Görüşme Kaydı
                </button>
            </div>
            <div className="overflow-auto rounded-lg shadow bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            {['Müşteri', 'Görüşme Tarihi', 'Sonuç', 'Sonraki Eylem', 'Eylem Tarihi', 'İşlemler'].map(head => (
                                <th key={head} className="p-3 text-sm font-semibold tracking-wide text-left">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {meetings.map(meeting => (
                            <tr key={meeting.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-bold">
                                    {customers.find(c => c.id === meeting.customerId)?.name || 'Bilinmiyor'}
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
                                    <button
                                        onClick={() => handleOpenModal(meeting)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Düzenle
                                    </button>
                                </td>
                            </tr>
                        ))}
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
        </div>
    );
};

export default Meetings;
