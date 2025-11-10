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
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <textarea
                {...props}
                rows={props.rows || 2}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
            />
        </div>
    );
};

export default FormTextarea;
