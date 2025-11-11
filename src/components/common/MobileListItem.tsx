import React, { ReactNode } from 'react';

interface MobileListItemProps {
    /** Main title */
    title: string;
    /** Subtitle or secondary text */
    subtitle?: string;
    /** Right side content (badge, status, etc.) */
    rightContent?: ReactNode;
    /** Bottom content (additional info) */
    bottomContent?: ReactNode;
    /** Icon or avatar on the left */
    leftIcon?: ReactNode;
    /** Click handler */
    onClick?: () => void;
    /** Additional actions (shown as buttons) */
    actions?: ReactNode;
    /** Highlight/selected state */
    isHighlighted?: boolean;
}

/**
 * MobileListItem - Optimized list item for mobile
 * Clean, touch-friendly design with proper spacing
 */
const MobileListItem: React.FC<MobileListItemProps> = ({
    title,
    subtitle,
    rightContent,
    bottomContent,
    leftIcon,
    onClick,
    actions,
    isHighlighted = false
}) => {
    return (
        <div
            className={`
                bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-3
                ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
                ${isHighlighted ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                transition-all
            `}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="flex-shrink-0 mt-0.5">
                        {leftIcon}
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Title & Right Content Row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {title}
                        </h3>
                        {rightContent && (
                            <div className="flex-shrink-0">
                                {rightContent}
                            </div>
                        )}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {subtitle}
                        </p>
                    )}

                    {/* Bottom Content */}
                    {bottomContent && (
                        <div className="mt-2">
                            {bottomContent}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            {actions && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default MobileListItem;
