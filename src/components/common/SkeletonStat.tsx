import React, { memo } from 'react';

/**
 * SkeletonStat component - Loading skeleton for stat cards
 * Used in Dashboard statistics grid
 */
const SkeletonStat = memo(() => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    {/* Label */}
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-3"></div>
                    {/* Value */}
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
                {/* Icon */}
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
        </div>
    );
});

SkeletonStat.displayName = 'SkeletonStat';

export default SkeletonStat;
