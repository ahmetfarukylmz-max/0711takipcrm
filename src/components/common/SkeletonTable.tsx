import React, { memo } from 'react';

interface SkeletonTableProps {
    /** Number of rows to render */
    rows?: number;
    /** Number of columns to render */
    columns?: number;
    /** Show mobile card view instead of table */
    mobileCardView?: boolean;
}

/**
 * SkeletonTable component - Loading skeleton for table layouts
 * Used in Customers, Orders, Products, Quotes, Meetings, Shipments pages
 */
const SkeletonTable = memo<SkeletonTableProps>(({ rows = 5, columns = 4, mobileCardView = false }) => {
    if (mobileCardView) {
        // Mobile card view skeleton
        return (
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Desktop table view skeleton
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {Array.from({ length: columns }).map((_, index) => (
                            <th key={index} className="px-6 py-3">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex} className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

SkeletonTable.displayName = 'SkeletonTable';

export default SkeletonTable;
