import React from 'react';

interface ConfirmDialogProps {
    /** Whether dialog is visible */
    isOpen: boolean;
    /** Callback when dialog should close */
    onClose: () => void;
    /** Callback when user confirms the action */
    onConfirm: () => void;
    /** Dialog title */
    title: string;
    /** Dialog message/description */
    message: string;
    /** Text for confirm button */
    confirmText?: string;
    /** Text for cancel button */
    cancelText?: string;
}

/**
 * ConfirmDialog component - A modal dialog for confirming destructive actions
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Sil",
    cancelText = "İptal"
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    id="confirm-dialog-title"
                    className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100"
                >
                    {title}
                </h3>
                <p
                    id="confirm-dialog-description"
                    className="text-gray-600 dark:text-gray-300 mb-6"
                >
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 min-h-[44px] bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                        aria-label="İptal"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 min-h-[44px] bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={confirmText}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
