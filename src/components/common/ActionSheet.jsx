import React, { useEffect } from 'react';

const ActionSheet = ({ show, onClose, title, actions }) => {
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

    // Prevent body scroll when action sheet is open
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

    if (!show) return null;

    return (
        <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-end animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-slideUp"
                onClick={e => e.stopPropagation()}
            >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Title */}
                {title && (
                    <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                    </div>
                )}

                {/* Actions */}
                <div className="flex-1 overflow-y-auto">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                action.onPress();
                                onClose();
                            }}
                            disabled={action.disabled}
                            className={`w-full flex items-center gap-4 px-6 py-4 min-h-[56px] transition-colors ${
                                action.destructive
                                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            } ${
                                action.disabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'active:bg-gray-200 dark:active:bg-gray-600'
                            } ${
                                index === 0 ? '' : 'border-t border-gray-100 dark:border-gray-700'
                            }`}
                        >
                            {action.icon && (
                                <span className="flex-shrink-0">
                                    {action.icon}
                                </span>
                            )}
                            <span className="flex-1 text-left font-medium">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Cancel button */}
                <div className="border-t-8 border-gray-100 dark:border-gray-900">
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-center font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors min-h-[56px]"
                    >
                        İptal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionSheet;
