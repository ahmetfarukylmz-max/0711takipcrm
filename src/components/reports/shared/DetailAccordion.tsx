import React, { memo, useCallback, ReactNode } from 'react';

interface DetailAccordionProps {
  /** Section title */
  title: string;
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Number of items in this section */
  count: number;
  /** Whether the accordion is open */
  isOpen: boolean;
  /** Toggle handler */
  onToggle: () => void;
  /** Children to render when open */
  children: ReactNode;
}

/**
 * DetailAccordion - Reusable collapsible section for report details
 */
export const DetailAccordion = memo<DetailAccordionProps>(({
  title,
  icon: Icon,
  count,
  isOpen,
  onToggle,
  children
}) => {
  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 page-break-avoid">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors no-print"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{count} kayıt</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
});

DetailAccordion.displayName = 'DetailAccordion';
