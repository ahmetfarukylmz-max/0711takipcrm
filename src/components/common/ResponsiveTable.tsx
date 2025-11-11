import React, { ReactNode } from 'react';

interface ResponsiveTableProps {
    /** Desktop table headers */
    headers?: string[];
    /** Content - can be table rows or mobile cards */
    children: ReactNode;
    /** Show as cards on mobile (default: true) */
    mobileCards?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Is data empty */
    isEmpty?: boolean;
}

/**
 * ResponsiveTable - Wrapper component for responsive table/list views
 * Shows table on desktop, cards on mobile for better UX
 */
const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
    headers = [],
    children,
    mobileCards = true,
    emptyMessage = 'Veri bulunamadı.',
    isEmpty = false
}) => {
    if (isEmpty) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    {headers.length > 0 && (
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                            <tr>
                                {headers.map((header, index) => (
                                    <th
                                        key={index}
                                        className="p-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {children}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            {mobileCards && (
                <div className="md:hidden space-y-3">
                    {children}
                </div>
            )}
        </>
    );
};

export default ResponsiveTable;
