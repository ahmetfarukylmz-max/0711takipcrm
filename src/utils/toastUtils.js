import toast from 'react-hot-toast';

/**
 * Show a deletion toast with undo functionality
 * @param {string} message - The message to display
 * @param {Function} onUndo - Callback function to execute on undo
 * @param {number} duration - Duration in milliseconds (default: 3000)
 * @returns {string} Toast ID
 */
export const showUndoableDelete = (message, onUndo, duration = 3000) => {
    return toast((t) => (
        <div className="flex items-center gap-3">
            <span className="flex-1">{message}</span>
            <button
                onClick={() => {
                    onUndo();
                    toast.dismiss(t.id);
                    toast.success('Geri alındı', { duration: 2000 });
                }}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 active:scale-95 transition-all min-h-[36px]"
            >
                Geri Al
            </button>
        </div>
    ), {
        duration,
        icon: '🗑️',
        style: {
            minWidth: '320px',
            padding: '12px 16px',
        },
    });
};

/**
 * Show a confirmation toast before deletion
 * @param {Object} options - Configuration options
 * @param {string} options.itemName - Name of the item being deleted
 * @param {string} options.itemType - Type of item (e.g., 'müşteri', 'ürün', 'sipariş')
 * @param {number} options.relatedCount - Number of related items
 * @param {string} options.relatedType - Type of related items
 * @param {Function} options.onConfirm - Callback function to execute on confirm
 * @param {number} options.duration - Toast duration (default: 5000)
 * @returns {string} Toast ID
 */
export const showSmartConfirm = ({
    itemName,
    itemType,
    relatedCount = 0,
    relatedType = '',
    onConfirm,
    duration = 5000
}) => {
    const relatedWarning = relatedCount > 0
        ? ` (${relatedCount} ${relatedType} var)`
        : '';

    return toast((t) => (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                        "{itemName}" {itemType}nı silmek istediğinizden emin misiniz?
                    </p>
                    {relatedWarning && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            {relatedWarning}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all min-h-[40px]"
                >
                    İptal
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        toast.dismiss(t.id);
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 active:scale-95 transition-all min-h-[40px]"
                >
                    Sil
                </button>
            </div>
        </div>
    ), {
        duration: duration,
        icon: null,
        style: {
            minWidth: '360px',
            maxWidth: '500px',
            padding: '16px',
        },
    });
};

/**
 * Show a success toast with custom styling
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (default: 2000)
 * @returns {string} Toast ID
 */
export const showSuccess = (message, duration = 2000) => {
    return toast.success(message, {
        duration,
        style: {
            padding: '12px 16px',
        },
    });
};

/**
 * Show an error toast with custom styling
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 * @returns {string} Toast ID
 */
export const showError = (message, duration = 3000) => {
    return toast.error(message, {
        duration,
        style: {
            padding: '12px 16px',
        },
    });
};
