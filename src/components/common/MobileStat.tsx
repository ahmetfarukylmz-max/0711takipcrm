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
    color?: 'blue' | 'yellow' | 'green' | 'red' | 'indigo' | 'purple' | 'pink';
    /** Click handler */
    onClick?: () => void;
    /** Trend indicator (optional) */
    trend?: {
        value: string;
        isPositive: boolean;
    };
    /** Disable counter animation */
    disableAnimation?: boolean;
}

const colorClasses = {
    blue: {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50'
    },
    yellow: {
        text: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/30',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/50'
    },
    green: {
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/30',
        iconBg: 'bg-green-100 dark:bg-green-900/50'
    },
    red: {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/30',
        iconBg: 'bg-red-100 dark:bg-red-900/50'
    },
    indigo: {
        text: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/50'
    },
    purple: {
        text: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        iconBg: 'bg-purple-100 dark:bg-purple-900/50'
    },
    pink: {
        text: 'text-pink-600 dark:text-pink-400',
        bg: 'bg-pink-50 dark:bg-pink-900/30',
        iconBg: 'bg-pink-100 dark:bg-pink-900/50'
    }
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
    disableAnimation = false
}) => {
    const colors = colorClasses[color];

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
                ${colors.bg} rounded-xl p-4
                ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
                transition-all hover:shadow-md
            `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {label}
                    </p>
                    <p className={`text-2xl font-bold ${colors.text}`}>
                        {displayValue}
                    </p>
                    {trend && (
                        <p className={`text-xs mt-1 font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`${colors.iconBg} p-3 rounded-xl`}>
                        <div className={colors.text}>
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileStat;
