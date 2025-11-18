import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Import store for optimistic updates (will be used by saveDocumentOptimistic)
let storeInstance = null;
export const setStoreInstance = (store) => {
  storeInstance = store;
};

/**
 * Logs a user activity to the activity_log collection.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - A short description of the action (e.g., 'CREATE_CUSTOMER', 'UPDATE_ORDER').
 * @param {Object} details - An object containing details about the activity.
 */
export const logActivity = async (userId, action, details) => {
    if (!userId) return;
    try {
        const logData = {
            userId,
            action,
            details,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, `users/${userId}/activity_log`), logData);
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

/**
 * Generic save function for Firestore documents
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {Object} data - Data to save
 * @returns {Promise<string>} Document ID
 */
export const saveDocument = async (userId, collectionName, data) => {
    if (!userId) return null;

    const { id, ...dataToSave } = data;

    // Special handling for products
    if (collectionName === 'products') {
        dataToSave.cost_price = parseFloat(dataToSave.cost_price) || 0;
        dataToSave.selling_price = parseFloat(dataToSave.selling_price) || 0;
    }

    const collectionPath = `users/${userId}/${collectionName}`;

    if (id) {
        // Update existing document
        try {
            await updateDoc(doc(db, collectionPath, id), dataToSave);
            return id;
        } catch (error) {
            // If document doesn't exist, create it instead
            if (error.code === 'not-found') {
                console.warn(`Document ${id} not found, creating new document instead`);
                const newDocRef = await addDoc(collection(db, collectionPath), dataToSave);
                return newDocRef.id;
            }
            throw error; // Re-throw other errors
        }
    } else {
        // Create new document
        const newDocRef = await addDoc(collection(db, collectionPath), dataToSave);
        return newDocRef.id;
    }
};

/**
 * Save order with default values
 * @param {string} userId - User ID
 * @param {Object} data - Order data
 * @returns {Promise<string>} Document ID
 */
export const saveOrder = async (userId, data) => {
    const finalData = { ...data };
    if (!finalData.status) finalData.status = 'Bekliyor';
    if (!finalData.order_date) finalData.order_date = new Date().toISOString().slice(0, 10);
    return saveDocument(userId, 'orders', finalData);
};

/**
 * Save quote with default values
 * @param {string} userId - User ID
 * @param {Object} data - Quote data
 * @returns {Promise<string>} Document ID
 */
export const saveQuote = async (userId, data) => {
    const finalData = { ...data };
    if (!finalData.status) finalData.status = 'Hazırlandı';
    if (!finalData.teklif_tarihi) finalData.teklif_tarihi = new Date().toISOString().slice(0, 10);
    return saveDocument(userId, 'teklifler', finalData);
};

/**
 * Convert quote to order
 * @param {string} userId - User ID
 * @param {Object} quote - Quote data
 * @returns {Promise<void>}
 */
export const convertQuoteToOrder = async (userId, quote) => {
    if (!userId) return;

    const newOrder = {
        customerId: quote.customerId,
        items: quote.items,
        subtotal: quote.subtotal,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
        total_amount: quote.total_amount,
        order_date: new Date().toISOString().slice(0, 10),
        status: 'Bekliyor',
        paymentType: quote.paymentType || 'Peşin',
        paymentTerm: quote.paymentTerm || null,
        currency: quote.currency || 'TRY',
        shipmentId: null,
        quoteId: quote.id,
        // Preserve ownership from quote
        createdBy: quote.createdBy || userId,
        createdByEmail: quote.createdByEmail
    };

    // Remove null/undefined values
    Object.keys(newOrder).forEach(key => {
        if (newOrder[key] === null || newOrder[key] === undefined) {
            delete newOrder[key];
        }
    });

    const orderRef = await addDoc(collection(db, `users/${userId}/orders`), newOrder);
    await updateDoc(doc(db, `users/${userId}/teklifler`, quote.id), {
        status: 'Onaylandı',
        orderId: orderRef.id
    });
};

/**
 * Mark shipment as delivered
 * @param {string} userId - User ID
 * @param {string} shipmentId - Shipment ID
 * @param {string} orderId - Order ID
 * @returns {Promise<void>}
 */
export const markShipmentDelivered = async (userId, shipmentId, orderId) => {
    if (!userId) return;

    const shipmentRef = doc(db, `users/${userId}/shipments`, shipmentId);
    await updateDoc(shipmentRef, {
        status: 'Teslim Edildi',
        delivery_date: new Date().toISOString().slice(0, 10)
    });

    const orderRef = doc(db, `users/${userId}/orders`, orderId);
    await updateDoc(orderRef, { status: 'Tamamlandı' });
};

/**
 * Soft delete a document (marks as deleted instead of removing)
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteDocument = async (userId, collectionName, docId) => {
    if (!userId || !docId) return false;

    try {
        const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
        await updateDoc(docRef, {
            isDeleted: true,
            deletedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
};

/**
 * Undo a soft delete (restore a deleted document)
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const undoDelete = async (userId, collectionName, docId) => {
    if (!userId || !docId) return false;

    try {
        const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
        await updateDoc(docRef, {
            isDeleted: false,
            deletedAt: null
        });
        return true;
    } catch (error) {
        console.error('Undo delete error:', error);
        return false;
    }
};

/**
 * Save document with optimistic UI updates
 * Updates UI immediately before Firestore confirmation for better UX
 *
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {Object} data - Data to save
 * @param {Object} options - Optimistic update options
 * @param {Function} options.onOptimisticUpdate - Callback when optimistic update is applied
 * @param {Function} options.onSuccess - Callback when Firestore save succeeds
 * @param {Function} options.onError - Callback when Firestore save fails
 * @returns {Promise<string>} Document ID
 *
 * @example
 * await saveDocumentOptimistic(userId, 'customers', data, {
 *   onOptimisticUpdate: (tempDoc) => {
 *     // Update UI immediately
 *     addPendingItem('customers', tempDoc);
 *   },
 *   onSuccess: (realDoc) => {
 *     // Replace temp with real
 *     updatePendingItem('customers', tempDoc.id, realDoc);
 *   },
 *   onError: (tempId) => {
 *     // Rollback
 *     removePendingItem('customers', tempId);
 *   }
 * });
 */
export const saveDocumentOptimistic = async (userId, collectionName, data, options = {}) => {
    if (!userId) return null;

    const { onOptimisticUpdate, onSuccess, onError } = options;
    const isUpdate = !!data.id;
    const tempId = data.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. Optimistic UI Update (immediate)
    if (onOptimisticUpdate && storeInstance) {
        const tempDoc = {
            ...data,
            id: tempId,
            _pending: true,
            _optimistic: true,
        };

        if (isUpdate) {
            // For updates, use existing update function
            storeInstance.getState().updateInCollection(collectionName, tempId, tempDoc);
        } else {
            // For creates, add to collection
            storeInstance.getState().addPendingItem(collectionName, tempDoc);
        }

        onOptimisticUpdate(tempDoc);
    }

    // 2. Firestore Save (async)
    try {
        const realId = await saveDocument(userId, collectionName, data);

        // 3. Success - update with real data
        if (onSuccess && storeInstance) {
            const realDoc = {
                ...data,
                id: realId,
                _pending: false,
                _optimistic: false,
            };

            if (!isUpdate && tempId !== realId) {
                // New document: remove temp and let real-time listener handle the rest
                storeInstance.getState().removePendingItem(collectionName, tempId);
            } else {
                // Update: mark as no longer pending
                storeInstance.getState().updateInCollection(collectionName, realId, {
                    _pending: false,
                    _optimistic: false,
                });
            }

            onSuccess(realDoc);
        }

        return realId;
    } catch (error) {
        console.error('Optimistic save failed:', error);

        // 4. Error - rollback optimistic update
        if (onError && storeInstance) {
            if (isUpdate) {
                // Revert update - real-time listener will restore original
                storeInstance.getState().updateInCollection(collectionName, tempId, {
                    _pending: false,
                    _optimistic: false,
                    _error: true,
                });
            } else {
                // Remove temp item
                storeInstance.getState().removePendingItem(collectionName, tempId);
            }

            onError(tempId, error);
        }

        throw error;
    }
};

/**
 * Delete document with optimistic UI updates
 *
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} options - Optimistic update options
 * @returns {Promise<boolean>} Success status
 */
export const deleteDocumentOptimistic = async (userId, collectionName, docId, options = {}) => {
    const { onOptimisticUpdate, onSuccess, onError } = options;

    // 1. Optimistic UI Update
    if (onOptimisticUpdate && storeInstance) {
        storeInstance.getState().updateInCollection(collectionName, docId, {
            isDeleted: true,
            _pending: true,
        });
        onOptimisticUpdate(docId);
    }

    // 2. Firestore Delete
    try {
        const success = await deleteDocument(userId, collectionName, docId);

        if (success && onSuccess && storeInstance) {
            storeInstance.getState().updateInCollection(collectionName, docId, {
                _pending: false,
            });
            onSuccess(docId);
        }

        return success;
    } catch (error) {
        console.error('Optimistic delete failed:', error);

        // 3. Rollback
        if (onError && storeInstance) {
            storeInstance.getState().updateInCollection(collectionName, docId, {
                isDeleted: false,
                _pending: false,
                _error: true,
            });
            onError(docId, error);
        }

        return false;
    }
};
