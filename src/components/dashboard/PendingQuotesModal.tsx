import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { Quote, Customer } from '../../types';

interface PendingQuotesModalProps {
    /** List of pending quotes (Hazırlandı status) */
    quotes: Quote[];
    /** List of customers */
    customers: Customer[];
    /** Callback to navigate to Quotes page */
    onViewAllQuotes: () => void;
}

/**
 * PendingQuotesModal - Displays list of pending quotes with validity info
 */
const PendingQuotesModal: React.FC<PendingQuotesModalProps> = ({
    quotes,
    customers,
    onViewAllQuotes
}) => {
    const [expandedQuote, setExpandedQuote] = useState<string | null>(null);

    /**
     * Calculate days until quote expires
     */
    const getDaysUntilExpiry = (validUntil: string): number => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(validUntil);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    /**
     * Get urgency color based on days until expiry
     */
    const getUrgencyColor = (days: number): string => {
        if (days < 0) return 'bg-gray-50 dark:bg-gray-800/20 border-gray-300 dark:border-gray-700'; // Expired
        if (days === 0) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'; // Expires today
        if (days <= 2) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'; // Expiring soon
        if (days <= 7) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'; // Expiring this week
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'; // Valid
    };

    const getUrgencyTextColor = (days: number): string => {
        if (days < 0) return 'text-gray-500 dark:text-gray-400';
        if (days === 0) return 'text-red-700 dark:text-red-300';
        if (days <= 2) return 'text-orange-700 dark:text-orange-300';
        if (days <= 7) return 'text-yellow-700 dark:text-yellow-300';
        return 'text-green-700 dark:text-green-300';
    };

    const getUrgencyIcon = (days: number): string => {
        if (days < 0) return '⚫';
        if (days === 0) return '🔴';
        if (days <= 2) return '🟠';
        if (days <= 7) return '🟡';
        return '🟢';
    };

    const getExpiryText = (days: number): string => {
        if (days < 0) return 'Süresi dolmuş';
        if (days === 0) return 'Bugün sona eriyor';
        if (days === 1) return 'Yarın sona eriyor';
        if (days <= 7) return `${days} gün geçerli`;
        return `${days} gün geçerli`;
    };

    const getPaymentTypeColor = (paymentType?: string): string => {
        if (paymentType === 'Peşin') {
            return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        }
        if (paymentType === 'Vadeli') {
            return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
        }
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    };

    /**
     * Sort quotes by expiry date (soonest to expire first, then expired ones)
     */
    const sortedQuotes = [...quotes]
        .filter(q => q.valid_until)
        .sort((a, b) => {
            const daysA = getDaysUntilExpiry(a.valid_until!);
            const daysB = getDaysUntilExpiry(b.valid_until!);

            // Put expired quotes at the end
            if (daysA < 0 && daysB >= 0) return 1;
            if (daysA >= 0 && daysB < 0) return -1;

            return daysA - daysB; // Ascending order
        });

    // Quotes without expiry date at the end
    const quotesWithoutDate = quotes.filter(q => !q.valid_until);
    const allSortedQuotes = [...sortedQuotes, ...quotesWithoutDate];

    return (
        <div className="max-h-[70vh] overflow-y-auto">
            {allSortedQuotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">📋 Bekleyen teklif yok.</p>
                    <p className="text-sm mt-2">Tüm teklifler işleme alınmış.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {allSortedQuotes.map(quote => {
                        const customer = customers.find(c => c.id === quote.customerId);
                        const daysUntil = quote.valid_until ? getDaysUntilExpiry(quote.valid_until) : null;
                        const isExpanded = expandedQuote === quote.id;
                        const isExpired = daysUntil !== null && daysUntil < 0;

                        return (
                            <div
                                key={quote.id}
                                className={`border-2 rounded-lg p-4 transition-all ${
                                    daysUntil !== null ? getUrgencyColor(daysUntil) : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700'
                                } ${isExpired ? 'opacity-75' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {daysUntil !== null && (
                                                <span className="text-xl">{getUrgencyIcon(daysUntil)}</span>
                                            )}
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {customer?.name || 'Bilinmeyen Müşteri'}
                                            </h3>
                                            {isExpired && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                                    Süresi Dolmuş
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-sm">
                                            <p className="text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Teklif:</span>{' '}
                                                <span className="font-mono text-blue-600 dark:text-blue-400">
                                                    #{quote.id.slice(-6)}
                                                </span>
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Teklif Tarihi:</span>{' '}
                                                {formatDate(quote.teklif_tarihi)}
                                            </p>
                                            {quote.valid_until && daysUntil !== null && (
                                                <p className={`font-medium ${getUrgencyTextColor(daysUntil)}`}>
                                                    <span className="font-medium">Geçerlilik:</span>{' '}
                                                    {formatDate(quote.valid_until)} ({getExpiryText(daysUntil)})
                                                </p>
                                            )}
                                            {!quote.valid_until && (
                                                <p className="text-gray-500 dark:text-gray-400 italic">
                                                    Geçerlilik tarihi belirtilmemiş
                                                </p>
                                            )}
                                            {quote.paymentType && (
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">Ödeme:</span>{' '}
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPaymentTypeColor(quote.paymentType)}`}>
                                                        {quote.paymentType}
                                                        {quote.paymentType === 'Vadeli' && quote.paymentTerm && ` (${quote.paymentTerm} gün)`}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(quote.total_amount, quote.currency)}
                                        </p>
                                        <button
                                            onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                                            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {isExpanded ? 'Gizle ▲' : 'Detaylar ▼'}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && quote.items && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                            Teklif Kalemleri:
                                        </h4>
                                        <div className="space-y-1.5">
                                            {quote.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between text-sm bg-white dark:bg-gray-800 rounded p-2"
                                                >
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {item.productName || 'Ürün'}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {item.quantity} {item.unit || 'Adet'} × {formatCurrency(item.unit_price, quote.currency)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Summary */}
                                        <div className="mt-3 space-y-1 text-sm border-t border-gray-200 dark:border-gray-600 pt-2">
                                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                <span>Ara Toplam:</span>
                                                <span>{formatCurrency(quote.subtotal, quote.currency)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                <span>KDV ({quote.vatRate}%):</span>
                                                <span>{formatCurrency(quote.vatAmount, quote.currency)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                                                <span>Toplam:</span>
                                                <span>{formatCurrency(quote.total_amount, quote.currency)}</span>
                                            </div>
                                        </div>

                                        {quote.notes && (
                                            <div className="mt-3 text-sm">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">Not:</span>{' '}
                                                <span className="text-gray-600 dark:text-gray-400">{quote.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                    onClick={onViewAllQuotes}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                >
                    Tüm Teklifleri Görüntüle ({quotes.length})
                </button>
            </div>
        </div>
    );
};

export default PendingQuotesModal;
