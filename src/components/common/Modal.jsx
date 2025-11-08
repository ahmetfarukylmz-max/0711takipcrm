import React, { useEffect } from 'react';

const Modal = ({ show, onClose, title, children, maxWidth = 'max-w-[95vw] sm:max-w-2xl' }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && show) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 dark:bg-black/60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-gray-700 rounded-lg shadow-xl p-6 w-full ${maxWidth}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-3">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 text-2xl font-bold"
                        aria-label="Kapat"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
