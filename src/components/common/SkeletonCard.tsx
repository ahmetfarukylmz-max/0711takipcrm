import React, { memo } from 'react';

interface SkeletonCardProps {
    /** Number of skeleton cards to render */
    count?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * SkeletonCard component - Loading skeleton for card-based layouts
 * Used in Dashboard widgets and list views
 */
const SkeletonCard = memo<SkeletonCardProps>(({ count = 1, className = '' }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse ${className}`}
                >
                    <div className="flex justify-between items-start mb-3">
                        {/* Title skeleton */}
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                        {/* Badge/status skeleton */}
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    {/* Subtitle skeleton */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    {/* Additional line */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
            ))}
        </>
    );
});

SkeletonCard.displayName = 'SkeletonCard';

export default SkeletonCard;
