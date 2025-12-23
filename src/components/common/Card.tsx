import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-[2rem] border border-slate-50 dark:border-gray-700 shadow-soft overflow-hidden transition-all duration-300 hover:shadow-soft-md ${className}`}
    >
      {(title || action) && (
        <div className="px-8 py-6 border-b border-slate-50 dark:border-gray-700 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-8'}>{children}</div>
    </div>
  );
};

export default Card;
