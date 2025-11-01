import React from 'react';

const Modal = ({ show, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full ${maxWidth}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                    >
                        &times;
                    </button>
                </div>
                <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
