import React, { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Select field label */
  label?: string;
  /** Select options */
  children: React.ReactNode;
}

/**
 * FormSelect component - Styled select dropdown
 */
const FormSelect: React.FC<FormSelectProps> = ({ label, children, ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          className="block w-full pl-5 pr-10 py-3 bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-gray-100 transition-all duration-200 appearance-none"
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FormSelect;
