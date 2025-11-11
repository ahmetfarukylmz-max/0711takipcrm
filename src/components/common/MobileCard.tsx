import React, { ReactNode } from 'react';

interface MobileCardProps {
    /** Card content */
    children: ReactNode;
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Disable hover effect */
    noHover?: boolean;
}

/**
 * MobileCard - Modern card component optimized for mobile
 * Provides a clean, touch-friendly interface
 */
const MobileCard: React.FC<MobileCardProps> = ({
    children,
    onClick,
    className = '',
    noHover = false
}) => {
    const baseClasses = "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-3";
    const hoverClasses = noHover ? "" : "active:scale-[0.98] transition-transform";
    const clickableClasses = onClick ? "cursor-pointer" : "";

    return (
        <div
            className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default MobileCard;
