import React from 'react';
import PropTypes from 'prop-types';

const FormInput = ({ label, ...props }) => {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <input
                {...props}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 sm:text-sm"
            />
        </div>
    );
};

FormInput.propTypes = {
    /** Input field label */
    label: PropTypes.string,
    /** Input type (text, email, number, etc.) */
    type: PropTypes.string,
    /** Input name */
    name: PropTypes.string,
    /** Input value */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Change handler */
    onChange: PropTypes.func,
    /** Placeholder text */
    placeholder: PropTypes.string,
    /** Is field required */
    required: PropTypes.bool,
    /** Is field disabled */
    disabled: PropTypes.bool,
    /** Mobile keyboard type (tel, email, numeric, decimal, etc.) */
    inputMode: PropTypes.oneOf(['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search']),
};

export default FormInput;
