import React from 'react';

export const Skeleton = ({ className = '', variant = 'default' }) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

    const variantClasses = {
        default: 'rounded',
        circle: 'rounded-full',
        text: 'rounded h-4',
        card: 'rounded-lg'
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="p-3">
                                <Skeleton className="h-4 w-24" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex} className="p-3">
                                    <Skeleton className="h-4 w-32" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const CardSkeleton = () => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton variant="circle" className="w-12 h-12" />
            </div>
        </div>
    );
};

export const DashboardSkeleton = () => {
    return (
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <div key={j} className="flex justify-between items-center p-3">
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-32 mb-2" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Skeleton;
