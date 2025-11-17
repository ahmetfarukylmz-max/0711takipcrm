import React, { memo } from 'react';

interface LoadingSpinnerProps {
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Optional loading message */
    message?: string;
    /** Center the spinner vertically and horizontally */
    center?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * LoadingSpinner component - Consistent loading indicator across the app
 * Replaces inline loading implementations for consistency
 */
const LoadingSpinner = memo<LoadingSpinnerProps>(({
    size = 'md',
    message,
    center = false,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    const spinner = (
        <svg
            className={`animate-spin text-blue-500 ${sizeClasses[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Loading"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );

    const content = (
        <div className={`flex items-center gap-3 ${textSizeClasses[size]} text-gray-600 dark:text-gray-400 ${className}`}>
            {spinner}
            {message && <span>{message}</span>}
        </div>
    );

    if (center) {
        return (
            <div className="flex h-full min-h-[200px] items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
