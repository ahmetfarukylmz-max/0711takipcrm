import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmDialog from './ConfirmDialog';

const Modal = ({
    show,
    onClose,
    title,
    children,
    maxWidth = 'max-w-2xl',
    hasUnsavedChanges = false,
    preventBackdropClose = false
}) => {
    const modalRef = useRef(null);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

    // Handle close with unsaved changes check
    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    // Confirm close despite unsaved changes
    const confirmClose = () => {
        setShowUnsavedWarning(false);
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = () => {
        if (!preventBackdropClose) {
            handleClose();
        }
    };

    // Scroll to top when modal opens and focus modal
    useEffect(() => {
        if (show) {
            window.scrollTo(0, 0);
            // Focus modal container after a short delay
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 100);
        }
    }, [show]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && show) {
                handleClose();
            }
        };

        if (show) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [show, hasUnsavedChanges]);

    if (!show) return null;

    return (
        <>
            <div
                className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-start p-4 md:pt-8 overflow-y-auto"
                onClick={handleBackdropClick}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div
                    ref={modalRef}
                    tabIndex={-1}
                    className={`bg-white dark:bg-gray-700 rounded-lg shadow-xl p-4 md:p-6 w-full max-w-full md:${maxWidth} outline-none my-auto md:my-0 animate-fadeIn`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-3">
                        <h3
                            id="modal-title"
                            className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {title}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label="Modalı kapat"
                            title="Kapat (ESC)"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="mt-4 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-2">
                        {children}
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            <ConfirmDialog
                isOpen={showUnsavedWarning}
                onClose={() => setShowUnsavedWarning(false)}
                onConfirm={confirmClose}
                title="Kaydedilmemiş Değişiklikler"
                message="Yaptığınız değişiklikler kaydedilmedi. Çıkmak istediğinizden emin misiniz?"
                confirmText="Evet, Çık"
                cancelText="İptal"
            />
        </>
    );
};

Modal.propTypes = {
    /** Whether the modal is visible */
    show: PropTypes.bool.isRequired,
    /** Callback when modal should close */
    onClose: PropTypes.func.isRequired,
    /** Modal title */
    title: PropTypes.string.isRequired,
    /** Modal content */
    children: PropTypes.node.isRequired,
    /** Tailwind max-width class (e.g., 'max-w-2xl', 'max-w-4xl') */
    maxWidth: PropTypes.string,
    /** Whether there are unsaved changes (triggers warning on close) */
    hasUnsavedChanges: PropTypes.bool,
    /** Prevent closing when clicking backdrop */
    preventBackdropClose: PropTypes.bool,
};

export default Modal;
