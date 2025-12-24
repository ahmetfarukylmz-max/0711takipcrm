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
  confirmText = 'Sil',
  cancelText = 'İptal',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999]"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft-lg p-8 max-w-md w-full mx-4 animate-fadeIn border border-slate-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-dialog-title"
          className="text-xl font-bold mb-3 text-slate-800 dark:text-white"
        >
          {title}
        </h3>
        <p
          id="confirm-dialog-description"
          className="text-slate-500 dark:text-gray-400 mb-8 leading-relaxed"
        >
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 min-h-[44px] bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors font-medium"
            aria-label="İptal"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2.5 min-h-[44px] bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors font-bold shadow-lg shadow-red-500/30"
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
