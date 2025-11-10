import React, { memo } from 'react';

interface TrendIndicatorProps {
  /** Current value */
  current: number;
  /** Previous value */
  previous?: number;
  /** Show percentage (default: true) */
  showPercentage?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * TrendIndicator - Shows trend direction and percentage change
 */
export const TrendIndicator = memo<TrendIndicatorProps>(({
  current,
  previous,
  showPercentage = true,
  size = 'md'
}) => {
  if (!previous || previous === 0) {
    return <span className="text-xs text-gray-500">-</span>;
  }

  const change = ((current - previous) / previous * 100).toFixed(1);
  const isPositive = Number(change) >= 0;
  const isNeutral = change === '0.0';

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isNeutral) {
    return (
      <span className={`${sizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium`}>
        {showPercentage && '0%'}
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 ${sizeClasses[size]} font-medium ${
      isPositive
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400'
    }`}>
      <svg
        className={iconSizes[size]}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isPositive ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        )}
      </svg>
      {showPercentage && `${isPositive ? '+' : ''}${change}%`}
    </span>
  );
});

TrendIndicator.displayName = 'TrendIndicator';
