import React from 'react';

const FormSelect = ({ label, children, ...props }) => {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <select
                {...props}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {children}
            </select>
        </div>
    );
};

export default FormSelect;
