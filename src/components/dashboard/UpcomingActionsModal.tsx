import React from 'react';
import { formatDate } from '../../utils/formatters';
import type { Meeting, Customer } from '../../types';

interface UpcomingActionsModalProps {
    /** List of upcoming meetings */
    meetings: Meeting[];
    /** List of customers */
    customers: Customer[];
    /** Callback to navigate to Meetings page */
    onViewAllMeetings: () => void;
}

/**
 * UpcomingActionsModal - Displays list of upcoming planned actions/meetings
 */
const UpcomingActionsModal: React.FC<UpcomingActionsModalProps> = ({
    meetings,
    customers,
    onViewAllMeetings
}) => {
    /**
     * Calculate days until action
     */
    const getDaysUntil = (actionDate: string): number => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const action = new Date(actionDate);
        action.setHours(0, 0, 0, 0);
        return Math.ceil((action.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    /**
     * Get time text
     */
    const getTimeText = (days: number): string => {
        if (days === 0) return 'Bugün';
        if (days === 1) return 'Yarın';
        if (days <= 7) return `${days} gün sonra`;
        if (days <= 14) return `${Math.ceil(days / 7)} hafta sonra`;
        return `${formatDate(meetings[0]?.next_action_date || '')}`;
    };

    /**
     * Get urgency color based on days until action
     */
    const getUrgencyColor = (days: number): string => {
        if (days === 0) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
        if (days === 1) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
        if (days <= 3) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
        return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
    };

    const getUrgencyTextColor = (days: number): string => {
        if (days === 0) return 'text-red-700 dark:text-red-300';
        if (days === 1) return 'text-orange-700 dark:text-orange-300';
        if (days <= 3) return 'text-yellow-700 dark:text-yellow-300';
        return 'text-green-700 dark:text-green-300';
    };

    const getUrgencyIcon = (days: number): string => {
        if (days === 0) return '🔴';
        if (days === 1) return '🟠';
        if (days <= 3) return '🟡';
        return '🟢';
    };

    /**
     * Get meeting type icon
     */
    const getMeetingTypeIcon = (type?: string): string => {
        if (!type) return '📞';
        if (type.includes('İlk')) return '👋';
        if (type.includes('Teklif')) return '📄';
        if (type.includes('Takip')) return '🔄';
        return '📞';
    };

    /**
     * Sort meetings by action date (soonest first)
     */
    const sortedMeetings = [...meetings]
        .filter(m => m.next_action_date)
        .sort((a, b) => {
            const dateA = new Date(a.next_action_date!);
            const dateB = new Date(b.next_action_date!);
            return dateA.getTime() - dateB.getTime();
        });

    if (sortedMeetings.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-4xl mb-4">📅</p>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Planlanan eylem bulunmuyor
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Toplam {sortedMeetings.length} planlanan eylem
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            En yakın: {getTimeText(getDaysUntil(sortedMeetings[0].next_action_date!))}
                        </p>
                    </div>
                    <button
                        onClick={onViewAllMeetings}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                        Görüşmelerde Görüntüle
                    </button>
                </div>
            </div>

            {/* Meetings List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedMeetings.map((meeting) => {
                    const customer = customers.find(c => c.id === meeting.customerId);
                    const daysUntil = getDaysUntil(meeting.next_action_date!);

                    return (
                        <div
                            key={meeting.id}
                            className={`border rounded-lg p-4 transition-all ${getUrgencyColor(daysUntil)}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{getMeetingTypeIcon(meeting.meetingType)}</span>
                                        <span className="text-lg">{getUrgencyIcon(daysUntil)}</span>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {customer?.name || 'Bilinmeyen Müşteri'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {meeting.meetingType || 'Görüşme'} •
                                        {formatDate(meeting.next_action_date!)}
                                        {meeting.meeting_time && ` • ${meeting.meeting_time}`}
                                    </p>
                                    <p className={`text-xs font-bold mt-1 ${getUrgencyTextColor(daysUntil)}`}>
                                        {getUrgencyIcon(daysUntil)} {getTimeText(daysUntil).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Meeting Details */}
                            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                {meeting.next_action_notes && (
                                    <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            📝 Eylem Notu:
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                            {meeting.next_action_notes}
                                        </p>
                                    </div>
                                )}

                                {/* Meeting Info */}
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {meeting.notes && (
                                        <p><span className="font-medium">Not:</span> {meeting.notes}</p>
                                    )}
                                    {meeting.outcome && (
                                        <p><span className="font-medium">Sonuç:</span> {meeting.outcome}</p>
                                    )}
                                    {customer?.phone && (
                                        <p><span className="font-medium">Telefon:</span> {customer.phone}</p>
                                    )}
                                    {customer?.email && (
                                        <p><span className="font-medium">E-posta:</span> {customer.email}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingActionsModal;
