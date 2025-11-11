import React, { ReactNode } from 'react';

interface MobileInfoRowProps {
    /** Label text */
    label: string;
    /** Value content */
    value: ReactNode;
    /** Icon (optional) */
    icon?: ReactNode;
}

/**
 * MobileInfoRow - Clean info display for mobile cards
 * Shows label-value pairs in a mobile-optimized layout
 */
const MobileInfoRow: React.FC<MobileInfoRowProps> = ({ label, value, icon }) => {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center gap-2">
                {icon && (
                    <div className="text-gray-400 dark:text-gray-500">
                        {icon}
                    </div>
                )}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {label}
                </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                {value}
            </div>
        </div>
    );
};

export default MobileInfoRow;
