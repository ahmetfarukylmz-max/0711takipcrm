import React, { memo } from 'react';

interface SkeletonListProps {
    /** Number of list items to render */
    count?: number;
    /** Show compact version (for sidebar or small lists) */
    compact?: boolean;
}

/**
 * SkeletonList component - Loading skeleton for list-based layouts
 * Used in Dashboard widgets, recent items, and small lists
 */
const SkeletonList = memo<SkeletonListProps>(({ count = 5, compact = false }) => {
    return (
        <div className="space-y-2 md:space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 animate-pulse ${
                        compact ? 'p-2' : 'p-3 md:p-4'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            {/* Title */}
                            <div className={`h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 ${compact ? 'mb-1' : 'mb-2'}`}></div>
                            {/* Subtitle */}
                            {!compact && (
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            )}
                        </div>
                        {/* Right content */}
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20 ml-4"></div>
                    </div>
                </div>
            ))}
        </div>
    );
});

SkeletonList.displayName = 'SkeletonList';

export default SkeletonList;
