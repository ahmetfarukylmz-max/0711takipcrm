import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

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
        await updateDoc(doc(db, collectionPath, id), dataToSave);
        return id;
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
