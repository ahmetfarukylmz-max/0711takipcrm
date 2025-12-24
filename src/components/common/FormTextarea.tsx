import React, { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea field label */
  label?: string;
}

/**
 * FormTextarea component - Styled textarea field
 */
const FormTextarea: React.FC<FormTextareaProps> = ({ label, ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <textarea
        {...props}
        rows={props.rows || 3}
        className="block w-full px-5 py-3 bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-gray-100 transition-all duration-200 resize-none"
      />
    </div>
  );
};

export default FormTextarea;
