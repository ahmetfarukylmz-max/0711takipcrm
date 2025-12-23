import React from 'react';
import PropTypes from 'prop-types';

const FormInput = ({ label, ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className="block w-full px-5 py-3 bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-gray-100 transition-all duration-200"
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
  inputMode: PropTypes.oneOf([
    'none',
    'text',
    'tel',
    'url',
    'email',
    'numeric',
    'decimal',
    'search',
  ]),
};

export default FormInput;
