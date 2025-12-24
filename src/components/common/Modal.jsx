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
  preventBackdropClose = false,
}) => {
  const modalRef = useRef(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Convert Tailwind max-width class to actual CSS value
  const getMaxWidthValue = (maxWidthClass) => {
    const widthMap = {
      'max-w-xs': '20rem', // 320px
      'max-w-sm': '24rem', // 384px
      'max-w-md': '28rem', // 448px
      'max-w-lg': '32rem', // 512px
      'max-w-xl': '36rem', // 576px
      'max-w-2xl': '42rem', // 672px
      'max-w-3xl': '48rem', // 768px
      'max-w-4xl': '56rem', // 896px
      'max-w-5xl': '64rem', // 1024px
      'max-w-6xl': '72rem', // 1152px
      'max-w-7xl': '80rem', // 1280px
    };
    return widthMap[maxWidthClass] || '42rem'; // default to max-w-2xl
  };

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
    const applyMaxWidth = () => {
      if (modalRef.current) {
        if (window.innerWidth >= 768) {
          modalRef.current.style.maxWidth = getMaxWidthValue(maxWidth);
        } else {
          modalRef.current.style.maxWidth = '95vw';
        }
      }
    };

    if (show) {
      window.scrollTo(0, 0);
      // Focus modal container after a short delay
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
          applyMaxWidth();
        }
      }, 100);

      // Handle window resize
      window.addEventListener('resize', applyMaxWidth);
      return () => window.removeEventListener('resize', applyMaxWidth);
    }
  }, [show, maxWidth]);

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
        className="fixed inset-0 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 overflow-y-auto"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft-lg p-6 md:p-8 w-full outline-none my-auto md:my-0 animate-fadeIn border border-slate-100 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h3
              id="modal-title"
              className="text-xl md:text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight"
            >
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-gray-700 rounded-full"
              aria-label="Modalı kapat"
              title="Kapat (ESC)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">{children}</div>
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
