import React from 'react';

const FormSelect = ({ label, children, ...props }) => {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <select
                {...props}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {children}
            </select>
        </div>
    );
};

export default FormSelect;
