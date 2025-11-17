import React, { memo } from 'react';

interface EmptyStateProps {
    /** Title of the empty state */
    title: string;
    /** Description text */
    description?: string;
    /** Icon type to display */
    icon?: 'customers' | 'products' | 'orders' | 'quotes' | 'meetings' | 'shipments' | 'payments' | 'search' | 'generic';
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    /** Additional CSS classes */
    className?: string;
}

/**
 * EmptyState component - Displays a friendly empty state with illustration and optional CTA
 * Used across all pages when no data is available
 */
const EmptyState = memo<EmptyStateProps>(({
    title,
    description,
    icon = 'generic',
    action,
    className = ''
}) => {
    // Icon illustrations
    const icons = {
        customers: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        products: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        orders: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        quotes: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        meetings: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        shipments: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        ),
        payments: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        search: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        generic: (
            <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
        )
    };

    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            {/* Icon/Illustration */}
            <div className="mb-6 animate-fadeIn">
                {icons[icon]}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 animate-fadeIn animate-delay-100">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 animate-fadeIn animate-delay-200">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-medium px-6 py-3 rounded-lg transition-all min-h-[44px] shadow-sm hover:shadow-md animate-fadeIn animate-delay-300"
                    aria-label={action.label}
                >
                    {action.icon}
                    {action.label}
                </button>
            )}
        </div>
    );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
