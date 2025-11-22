import React from 'react';

interface Action {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    tooltip?: string;
}

interface MobileActionsProps {
    /** Array of actions */
    actions: Action[];
    /** Layout direction */
    direction?: 'horizontal' | 'vertical';
}

/**
 * MobileActions - Touch-friendly action buttons for mobile
 * Provides clear, accessible buttons with proper spacing
 */
const MobileActions: React.FC<MobileActionsProps> = ({
    actions,
    direction = 'horizontal'
}) => {
    const getButtonClasses = (variant: Action['variant'] = 'secondary') => {
        const baseClasses = "flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

        switch (variant) {
            case 'primary':
                return `${baseClasses} bg-blue-600 text-white active:bg-blue-700`;
            case 'danger':
                return `${baseClasses} bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-900/50`;
            case 'secondary':
            default:
                return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600`;
        }
    };

    return (
        <div className={`flex gap-2 ${direction === 'vertical' ? 'flex-col' : 'flex-row'}`}>
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    title={action.tooltip || ''}
                    className={getButtonClasses(action.variant)}
                >
                    {action.icon && <span>{action.icon}</span>}
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    );
};

export default MobileActions;
