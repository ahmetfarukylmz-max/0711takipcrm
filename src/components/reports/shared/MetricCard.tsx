import React, { memo, useCallback } from 'react';

interface MetricCardProps {
  /** Card title */
  title: string;
  /** Current value to display */
  value: number | string;
  /** Previous value for comparison (optional) */
  previousValue?: number;
  /** Prefix for value (e.g., currency symbol) */
  prefix?: string;
  /** Suffix for value (e.g., unit) */
  suffix?: string;
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind gradient color classes */
  color: string;
  /** Additional details to show */
  details?: string;
  /** Click handler (makes card interactive) */
  onClick?: () => void;
}

/**
 * MetricCard - Reusable metric display card with trend indicators
 * Used across daily reports to show KPIs with comparison to previous period
 */
export const MetricCard = memo<MetricCardProps>(({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  icon: Icon,
  color,
  details,
  onClick
}) => {
  const change = previousValue
    ? ((Number(value) - previousValue) / previousValue * 100).toFixed(1)
    : 0;
  const isPositive = Number(change) >= 0;

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${color}
        p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
        group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 opacity-10">
        <Icon className="w-32 h-32 -mr-8 -mt-8" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {previousValue !== undefined && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
              <svg
                className="w-4 h-4 text-white"
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
              <span className="text-xs font-semibold text-white">
                {Math.abs(Number(change))}%
              </span>
            </div>
          )}
        </div>

        <div className="text-white">
          <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">
              {prefix}{value}{suffix}
            </h3>
          </div>

          {details && (
            <p className="text-xs opacity-75 mt-2">{details}</p>
          )}
        </div>
      </div>

      {/* Hover Details */}
      {previousValue !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-xs text-white/90">
            Dün: {prefix}{previousValue}{suffix}
          </p>
        </div>
      )}

      {onClick && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-white transform rotate-[-90deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';
