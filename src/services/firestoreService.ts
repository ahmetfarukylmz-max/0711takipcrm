import { collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getNextOrderNumber, getNextQuoteNumber } from './counterService';
import { logger } from '../utils/logger';

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
    logger.error('Error logging activity:', error);
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
        logger.warn(`Document ${id} not found, creating new document instead`);
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

  // Generate order number for new orders (if not already set)
  if (!finalData.id && !finalData.orderNumber) {
    try {
      finalData.orderNumber = await getNextOrderNumber(userId);
      logger.log('Generated order number:', finalData.orderNumber);
    } catch (error) {
      logger.error('Error generating order number:', error);
      // Continue without order number if generation fails
    }
  }

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

  // Generate quote number for new quotes (if not already set)
  if (!finalData.id && !finalData.quoteNumber) {
    try {
      finalData.quoteNumber = await getNextQuoteNumber(userId);
      logger.log('Generated quote number:', finalData.quoteNumber);
    } catch (error) {
      logger.error('Error generating quote number:', error);
      // Continue without quote number if generation fails
    }
  }

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
    createdByEmail: quote.createdByEmail,
  };

  // Remove null/undefined values
  Object.keys(newOrder).forEach((key) => {
    if (newOrder[key] === null || newOrder[key] === undefined) {
      delete newOrder[key];
    }
  });

  const orderRef = await addDoc(collection(db, `users/${userId}/orders`), newOrder);
  await updateDoc(doc(db, `users/${userId}/teklifler`, quote.id), {
    status: 'Onaylandı',
    orderId: orderRef.id,
  });
};

/**
 * Log stock movement to stock_movements collection
 * @param {string} userId - User ID
 * @param {Object} movementData - Stock movement data
 * @returns {Promise<string>} Movement ID
 */
export const logStockMovement = async (userId, movementData) => {
  if (!userId) return null;

  try {
    const movementRef = await addDoc(collection(db, `users/${userId}/stock_movements`), {
      ...movementData,
      createdAt: new Date().toISOString(),
    });
    return movementRef.id;
  } catch (error) {
    logger.error('Error logging stock movement:', error);
    return null;
  }
};

/**
 * Update product stock quantity
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantityChange - Quantity change (positive or negative)
 * @param {Object} movementData - Additional movement data (type, relatedId, notes, etc.)
 * @returns {Promise<boolean>} Success status
 */
export const updateProductStock = async (userId, productId, quantityChange, movementData = {}) => {
  if (!userId || !productId) return false;

  try {
    const productRef = doc(db, `users/${userId}/products`, productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      logger.error('Product not found:', productId);
      return false;
    }

    const product = productDoc.data();

    // Only update stock if tracking is enabled
    if (!product.track_stock) {
      logger.log('Stock tracking not enabled for product:', productId);
      return false;
    }

    const previousStock = product.stock_quantity || 0;
    const newStock = previousStock + quantityChange;

    // Update product stock
    await updateDoc(productRef, {
      stock_quantity: newStock,
      updatedAt: new Date().toISOString(),
    });

    // Log the stock movement
    await logStockMovement(userId, {
      productId,
      productName: product.name,
      productUnit: product.unit || 'Adet',
      quantity: quantityChange,
      previousStock,
      newStock,
      ...movementData,
    });

    return true;
  } catch (error) {
    logger.error('Error updating product stock:', error);
    return false;
  }
};

/**
 * Mark shipment as delivered and update product stock
 * @param {string} userId - User ID
 * @param {string} shipmentId - Shipment ID
 * @param {string} orderId - Order ID
 * @param {string} userEmail - User email for logging
 * @returns {Promise<void>}
 */
export const markShipmentDelivered = async (userId, shipmentId, orderId, userEmail = 'system') => {
  if (!userId) return;

  try {
    // Get shipment details
    const shipmentRef = doc(db, `users/${userId}/shipments`, shipmentId);
    const shipmentDoc = await getDoc(shipmentRef);

    if (!shipmentDoc.exists()) {
      logger.error('Shipment not found:', shipmentId);
      return;
    }

    const shipment = shipmentDoc.data();

    // Update shipment status
    await updateDoc(shipmentRef, {
      status: 'Teslim Edildi',
      delivery_date: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    });

    // Get order details to calculate if all items are delivered
    const orderRef = doc(db, `users/${userId}/orders`, orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      const order = orderDoc.data();

      // Get all shipments for this order
      const shipmentsRef = collection(db, `users/${userId}/shipments`);
      const shipmentsQuery = query(shipmentsRef, where('orderId', '==', orderId));
      const shipmentsSnapshot = await getDocs(shipmentsQuery);

      // Calculate total ordered quantities by order item index
      // This handles cases where same product appears multiple times with different quantities
      const orderedQuantitiesByIndex = {};
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item, itemIndex) => {
          orderedQuantitiesByIndex[itemIndex] = item.quantity || 0;
        });
      }

      // Calculate total delivered quantities by order item index
      const deliveredQuantitiesByIndex = {};
      shipmentsSnapshot.forEach(shipmentDoc => {
        const shipmentData = shipmentDoc.data();
        // Only count delivered and non-deleted shipments
        if (shipmentData.status === 'Teslim Edildi' && !shipmentData.isDeleted && shipmentData.items && Array.isArray(shipmentData.items)) {
          shipmentData.items.forEach(item => {
            const orderItemIndex = item.orderItemIndex ?? null;
            if (orderItemIndex !== null && orderItemIndex !== undefined) {
              deliveredQuantitiesByIndex[orderItemIndex] = (deliveredQuantitiesByIndex[orderItemIndex] || 0) + (item.quantity || 0);
            }
          });
        }
      });

      // Check if all order items are fully delivered
      let allDelivered = true;
      for (const itemIndex in orderedQuantitiesByIndex) {
        const ordered = orderedQuantitiesByIndex[itemIndex];
        const delivered = deliveredQuantitiesByIndex[itemIndex] || 0;
        if (delivered < ordered) {
          allDelivered = false;
          break;
        }
      }

      // Update order status only if all items are delivered
      if (allDelivered) {
        await updateDoc(orderRef, {
          status: 'Tamamlandı',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Update stock for each shipped item
    if (shipment.items && Array.isArray(shipment.items)) {
      for (const item of shipment.items) {
        await updateProductStock(userId, item.productId, -item.quantity, {
          type: 'Sevkiyat',
          relatedId: shipmentId,
          relatedType: 'shipment',
          relatedReference: shipment.orderNumber || orderId,
          notes: `Sevkiyat teslim edildi: ${shipment.customerName || 'Müşteri'}`,
          createdBy: userId,
          createdByEmail: userEmail,
        });
      }
    }

    // Log activity
    await logActivity(userId, 'SHIPMENT_DELIVERED', {
      shipmentId,
      orderId,
      items: shipment.items?.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
      })),
    });
  } catch (error) {
    logger.error('Error marking shipment as delivered:', error);
    throw error;
  }
};

/**
 * Delete shipment, revert stock if delivered, and update order status
 * @param {string} userId - User ID
 * @param {string} shipmentId - Shipment ID
 * @param {string} userEmail - User email for logging
 * @returns {Promise<boolean>} Success status
 */
export const deleteShipment = async (userId, shipmentId, userEmail = 'system') => {
  if (!userId || !shipmentId) return false;

  try {
    // 1. Get shipment details
    const shipmentRef = doc(db, `users/${userId}/shipments`, shipmentId);
    const shipmentDoc = await getDoc(shipmentRef);

    if (!shipmentDoc.exists()) {
      logger.error('Shipment not found:', shipmentId);
      return false;
    }

    const shipment = shipmentDoc.data();

    // 2. If shipment was delivered, revert stock changes (add back to inventory)
    if (shipment.status === 'Teslim Edildi' && shipment.items && Array.isArray(shipment.items)) {
      for (const item of shipment.items) {
        await updateProductStock(userId, item.productId, item.quantity, { // Positive quantity to add back
          type: 'Sevkiyat İptali/Silme',
          relatedId: shipmentId,
          relatedType: 'shipment',
          relatedReference: shipment.orderNumber || shipment.orderId,
          notes: `Sevkiyat silindi, stok iade edildi: ${shipment.customerName || 'Müşteri'}`,
          createdBy: userId,
          createdByEmail: userEmail,
        });
      }
    }

    // 3. Mark shipment as deleted
    await updateDoc(shipmentRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
      deletedByEmail: userEmail
    });

    // 4. Update related order status
    if (shipment.orderId) {
      const orderRef = doc(db, `users/${userId}/orders`, shipment.orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const order = orderDoc.data();
        // If order was completed, revert it to 'Hazırlanıyor' or 'Bekliyor'
        // Ideally we should check if there are other active shipments, but reverting to 'Hazırlanıyor' is safe
        // as the user can create a new shipment to complete it again.
        if (order.status === 'Tamamlandı') {
           // Check if there are ANY other delivered shipments remaining
           const shipmentsRef = collection(db, `users/${userId}/shipments`);
           const q = query(shipmentsRef, where('orderId', '==', shipment.orderId), where('isDeleted', '==', false), where('status', '==', 'Teslim Edildi'));
           const snapshot = await getDocs(q);
           
           // If no delivered shipments remain, maybe 'Bekliyor'? If some remain, 'Hazırlanıyor'.
           // To simplify, 'Hazırlanıyor' is a good fallback for partial state.
           const newStatus = snapshot.empty ? 'Hazırlanıyor' : 'Hazırlanıyor'; 
           
           await updateDoc(orderRef, {
             status: newStatus,
             updatedAt: new Date().toISOString()
           });
        }
      }
    }

    // 5. Log activity
    await logActivity(userId, 'DELETE_SHIPMENT', {
      shipmentId,
      orderId: shipment.orderId,
      message: `Sevkiyat silindi (Stok iadesi: ${shipment.status === 'Teslim Edildi' ? 'Evet' : 'Hayır'})`
    });

    return true;
  } catch (error) {
    logger.error('Error deleting shipment:', error);
    return false;
  }
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
      deletedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    logger.error('Delete error:', error);
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
      deletedAt: null,
    });
    return true;
  } catch (error) {
    logger.error('Undo delete error:', error);
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
    logger.error('Optimistic save failed:', error);

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
    logger.error('Optimistic delete failed:', error);

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

/**
 * Cancel an order and related shipments/payments
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {Object} cancellationData - Cancellation details
 * @param {string} cancellationData.reason - Cancellation reason
 * @param {string} cancellationData.notes - Additional notes
 * @param {string} cancellationData.cancelledByEmail - Email of user who cancelled
 * @param {string[]} cancellationData.shipmentIds - Shipment IDs to cancel
 * @param {string[]} cancellationData.paymentIds - Payment IDs to cancel
 * @returns {Promise<boolean>} Success status
 */
export const cancelOrder = async (userId, orderId, cancellationData) => {
  if (!userId || !orderId) return false;

  try {
    const { reason, notes, cancelledByEmail, shipmentIds = [], paymentIds = [] } = cancellationData;

    // 1. Siparişi iptal et
    const orderRef = doc(db, `users/${userId}/orders`, orderId);
    await updateDoc(orderRef, {
      status: 'İptal Edildi',
      cancelledAt: new Date().toISOString(),
      cancelledBy: userId,
      cancelledByEmail: cancelledByEmail || '',
      cancellationReason: reason,
      cancellationNotes: notes || '',
    });

    // 2. İlgili sevkiyatları iptal et (eğer varsa)
    for (const shipmentId of shipmentIds) {
      const shipmentRef = doc(db, `users/${userId}/shipments`, shipmentId);
      await updateDoc(shipmentRef, {
        status: 'İptal Edildi',
        cancelledAt: new Date().toISOString(),
        notes: `Sipariş iptali nedeniyle iptal edildi`,
      });
    }

    // 3. İlgili ödemeleri iptal et (eğer varsa)
    for (const paymentId of paymentIds) {
      const paymentRef = doc(db, `users/${userId}/payments`, paymentId);
      await updateDoc(paymentRef, {
        status: 'İptal',
        notes: `Sipariş iptali nedeniyle iptal edildi`,
      });
    }

    return true;
  } catch (error) {
    logger.error('Order cancellation error:', error);
    return false;
  }
};

/**
 * Save stock count session
 * @param {string} userId - User ID
 * @param {Object} countSession - Count session data
 * @returns {Promise<string>} Session ID
 */
export const saveStockCountSession = async (userId, countSession) => {
  if (!userId) return null;

  try {
    const { id, ...dataToSave } = countSession;

    if (id) {
      // Update existing session
      await updateDoc(doc(db, `users/${userId}/stock_counts`, id), {
        ...dataToSave,
        updatedAt: new Date().toISOString(),
      });
      return id;
    } else {
      // Create new session
      const newSessionRef = await addDoc(collection(db, `users/${userId}/stock_counts`), {
        ...dataToSave,
        createdAt: new Date().toISOString(),
      });
      return newSessionRef.id;
    }
  } catch (error) {
    logger.error('Error saving stock count session:', error);
    return null;
  }
};

/**
 * Apply stock count adjustments to inventory
 * @param {string} userId - User ID
 * @param {string} sessionId - Count session ID
 * @param {Array} countItems - Array of count items with variances
 * @param {string} userEmail - User email for logging
 * @returns {Promise<boolean>} Success status
 */
export const applyStockCountAdjustments = async (userId, sessionId, countItems, userEmail) => {
  if (!userId || !sessionId) return false;

  try {
    // Apply adjustments for each product with variance
    const adjustmentPromises = countItems
      .filter((item) => item.variance !== 0 && item.physicalCount !== null)
      .map((item) => {
        return updateProductStock(userId, item.productId, item.variance, {
          type: 'Sayım Düzeltmesi',
          relatedId: sessionId,
          relatedType: 'stock_count',
          relatedReference: `Stok Sayımı - ${new Date().toISOString().slice(0, 10)}`,
          notes:
            item.notes || `Stok sayımı düzeltmesi: ${item.systemStock} → ${item.physicalCount}`,
          createdBy: userId,
          createdByEmail: userEmail,
        });
      });

    await Promise.all(adjustmentPromises);

    // Update count session as applied
    await updateDoc(doc(db, `users/${userId}/stock_counts`, sessionId), {
      appliedAt: new Date().toISOString(),
      appliedBy: userId,
      appliedByEmail: userEmail,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    logger.error('Error applying stock count adjustments:', error);
    return false;
  }
};
