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
            className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center p-2 sm:p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-gray-700 rounded-lg shadow-2xl w-full mx-2 sm:mx-0 ${maxWidth} max-h-[95vh] flex flex-col animate-slideUp`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header - only show if title exists */}
                {title && (
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3 sm:p-6 flex-shrink-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Kapat"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Close button when no title */}
                {!title && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 bg-white dark:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                        aria-label="Kapat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-white dark:bg-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
