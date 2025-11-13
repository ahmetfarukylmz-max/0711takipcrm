import React, { memo } from 'react';
import { formatDate, getStatusClass } from '../../utils/formatters';
import type { Meeting, Customer } from '../../types';

interface MeetingDetailProps {
    /** Meeting data to display */
    meeting: Meeting | null;
    /** Customer associated with the meeting */
    customer?: Customer | null;
}

/**
 * MeetingDetail component - Displays detailed information about a meeting
 */
const MeetingDetail = memo<MeetingDetailProps>(({ meeting, customer }) => {
    if (!meeting) return null;

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Müşteri Bilgileri</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p><span className="font-semibold">Adı:</span> {customer?.name || 'N/A'}</p>
                        <p><span className="font-semibold">Email:</span> {customer?.email || 'N/A'}</p>
                        <p><span className="font-semibold">Telefon:</span> {customer?.phone || 'N/A'}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Görüşme Bilgileri</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p><span className="font-semibold">Görüşme Tarihi:</span> {formatDate(meeting.meeting_date)}</p>
                        <p><span className="font-semibold">Görüşme Türü:</span> {meeting.meetingType || 'N/A'}</p>
                        <p>
                            <span className="font-semibold">Durum:</span>
                            <span className={`ml-2 p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.status)}`}>
                                {meeting.status}
                            </span>
                        </p>
                        <p>
                            <span className="font-semibold">Sonuç:</span>
                            <span className={`ml-2 p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(meeting.outcome)}`}>
                                {meeting.outcome}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Görüşme Notları</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-wrap">{meeting.notes || '-'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Sonraki Eylem</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-wrap">{meeting.next_action_notes || '-'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Sonraki Eylem Tarihi</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{formatDate(meeting.next_action_date) || '-'}</p>
                </div>
            </div>
        </div>
    );
});

MeetingDetail.displayName = 'MeetingDetail';

export default MeetingDetail;
