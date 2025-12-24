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
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] border border-white/60 dark:border-gray-700/60 shadow-glass overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 ${className}`}
    >
      {(title || action) && (
        <div className="px-8 py-6 border-b border-slate-100/50 dark:border-gray-700/50 flex items-center justify-between bg-white/40 dark:bg-gray-800/40">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">
                {subtitle}
              </p>
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
