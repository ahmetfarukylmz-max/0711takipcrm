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
  isHighlighted = false,
}) => {
  return (
    <div
      className={`
                bg-white dark:bg-gray-800 rounded-2xl shadow-glass border border-slate-100/50 dark:border-gray-700/50 p-4 mb-3
                ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
                ${isHighlighted ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
                transition-all duration-200
            `}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Left Icon */}
        {leftIcon && <div className="flex-shrink-0 mt-0.5">{leftIcon}</div>}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Right Content Row */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate tracking-tight">
              {title}
            </h3>
            {rightContent && (
              <div className="flex-shrink-0 text-right font-medium">{rightContent}</div>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-1">{subtitle}</p>
          )}

          {/* Bottom Content */}
          {bottomContent && <div className="mt-2 text-sm text-slate-500">{bottomContent}</div>}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="mt-3 pt-3 border-t border-slate-100/50 dark:border-gray-700/50 flex gap-2 overflow-x-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default MobileListItem;
