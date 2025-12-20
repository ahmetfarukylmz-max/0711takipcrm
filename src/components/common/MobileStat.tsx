import React, { ReactNode } from 'react';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';

interface MobileStatProps {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Icon component */
  icon?: ReactNode;
  /** Color theme */
  color?: 'blue' | 'yellow' | 'green' | 'red' | 'indigo' | 'purple' | 'pink' | 'gray';
  /** Click handler */
  onClick?: () => void;
  /** Trend indicator (optional) */
  trend?: {
    value: string;
    isPositive: boolean;
  };
  /** Optional secondary text displayed below the main value */
  secondaryText?: string;
  /** Disable counter animation */
  disableAnimation?: boolean;
}

const colorClasses = {
  blue: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  yellow: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
  },
  green: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
  },
  red: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
  },
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
  },
  purple: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
  },
  pink: {
    text: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/30',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50',
  },
  gray: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    iconBg: 'bg-gray-100 dark:bg-gray-900/50',
  },
};

/**
 * MobileStat - Statistics card optimized for mobile dashboards
 * Clean, modern design with optional icon and trend
 */
const MobileStat: React.FC<MobileStatProps> = ({
  label,
  value,
  icon,
  color = 'blue',
  onClick,
  trend,
  secondaryText, // New prop for additional text under value
  disableAnimation = false,
}) => {
  const colors = colorClasses[color] || colorClasses.blue;

  // Use counter animation only for numeric values
  const numericValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  const isNumeric = !isNaN(numericValue);
  const animatedValue = useCounterAnimation(
    isNumeric ? numericValue : 0,
    1000,
    !disableAnimation && isNumeric
  );

  const displayValue = !disableAnimation && isNumeric ? animatedValue : value;

  return (
    <div
      className={`
                bg-white p-4 rounded-xl border border-gray-100 shadow-sm
                ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
                hover:shadow-md transition-all group
            `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
        {icon && (
          <span
            className={`${colors.iconBg} p-1.5 rounded-lg group-hover:bg-${color}-600 group-hover:text-white transition-colors`}
          >
            {icon}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{displayValue}</h3>
      {(trend || secondaryText) && (
        <p
          className={`text-xs mt-1 ${secondaryText ? 'text-gray-400' : trend?.isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}
        >
          {trend && (
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              ></path>
            </svg>
          )}
          {secondaryText || (trend ? trend.value : '')}
        </p>
      )}
    </div>
  );
};

export default MobileStat;
