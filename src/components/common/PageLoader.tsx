import React, { memo } from 'react';
import SkeletonTable from './SkeletonTable';
import SkeletonStat from './SkeletonStat';

interface PageLoaderProps {
    /** Type of page being loaded */
    type: 'dashboard' | 'table' | 'form' | 'detail';
    /** Page title to display while loading */
    title?: string;
    /** Number of columns for table skeleton */
    columns?: number;
    /** Number of rows for table skeleton */
    rows?: number;
}

/**
 * PageLoader component - Consistent page-level loading states
 * Provides skeleton screens based on page type
 */
const PageLoader = memo<PageLoaderProps>(({
    type,
    title,
    columns = 5,
    rows = 10
}) => {
    if (type === 'dashboard') {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {title || 'Yükleniyor...'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Veriler yükleniyor...</p>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-8">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonStat key={index} />
                    ))}
                </div>

                {/* Widgets skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-sm">
                            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-3 animate-pulse"></div>
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        {title || 'Yükleniyor...'}
                    </h1>
                </div>
                {/* Desktop: Table skeleton */}
                <div className="hidden md:block">
                    <SkeletonTable rows={rows} columns={columns} />
                </div>
                {/* Mobile: Card skeleton */}
                <div className="md:hidden">
                    <SkeletonTable rows={rows} columns={columns} mobileCardView={true} />
                </div>
            </div>
        );
    }

    if (type === 'form') {
        return (
            <div className="animate-pulse">
                {title && (
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
                )}
                <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index}>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    ))}
                    <div className="flex gap-3 pt-4">
                        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'detail') {
        return (
            <div className="animate-pulse">
                {/* Header */}
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-6"></div>

                {/* Content sections */}
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
});

PageLoader.displayName = 'PageLoader';

export default PageLoader;
