import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getProductLots } from './lotService';

/**
 * RECONCILIATION SERVICE - Hybrid Costing System
 *
 * This service handles monthly reconciliation between accounting (FIFO)
 * and physical stock to detect and adjust variances.
 */

// ============================================================================
// RECONCILIATION
// ============================================================================

/**
 * Run monthly reconciliation for all products with lot tracking enabled
 * @param {string} userId - User ID
 * @param {string} period - Period in YYYY-MM format (e.g., "2024-11")
 * @param {Array} products - Array of products to reconcile
 * @returns {Promise<Array>} Reconciliation records created
 */
export const runMonthlyReconciliation = async (userId, period, products) => {
  if (!userId || !period) {
    throw new Error('User ID and period are required');
  }

  const [year, month] = period.split('-');
  const periodStart = `${period}-01`;
  // Calculate last day of month
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const periodEnd = `${period}-${lastDay.toString().padStart(2, '0')}`;

  const reconciliations = [];

  for (const product of products) {
    // Skip products without lot tracking
    if (!product.lotTrackingEnabled) continue;

    // Get all lots for this product
    const lots = await getProductLots(userId, product.id);

    for (const lot of lots) {
      // Calculate accounting balance (FIFO expected)
      const accountingBalance = await calculateAccountingBalance(userId, lot.id, periodEnd);

      // Physical balance is the actual remaining quantity
      const physicalBalance = lot.remainingQuantity;

      // Calculate variance
      const variance = physicalBalance - accountingBalance;

      // Only create reconciliation if variance exists (tolerance: 0.01)
      if (Math.abs(variance) > 0.01) {
        const reconciliation = await createReconciliation(userId, {
          period,
          periodStart,
          periodEnd,
          productId: product.id,
          productName: product.name,
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          accountingBalance,
          physicalBalance,
          variance,
          varianceValue: variance * lot.unitCost,
          status: 'pending',
          adjustmentNeeded: true,
        });

        reconciliations.push(reconciliation);
      }
    }
  }

  return reconciliations;
};

/**
 * Calculate accounting balance for a lot based on FIFO consumption
 * @param {string} userId - User ID
 * @param {string} lotId - Lot ID
 * @param {string} asOfDate - Calculate balance as of this date (YYYY-MM-DD)
 * @returns {Promise<number>} Accounting balance
 */
export const calculateAccountingBalance = async (userId, lotId, asOfDate) => {
  // Get all consumptions for this lot up to the specified date
  const consumptionsRef = collection(db, `users/${userId}/lot_consumptions`);
  const q = query(
    consumptionsRef,
    where('lotId', '==', lotId),
    where('consumptionDate', '<=', asOfDate)
  );

  const snapshot = await getDocs(q);
  const consumptions = snapshot.docs.map((doc) => doc.data());

  // Get the lot to find initial quantity
  const lotSnapshot = await getDocs(
    query(collection(db, `users/${userId}/stock_lots`), where('id', '==', lotId))
  );
  const lot = lotSnapshot.docs[0]?.data();

  if (!lot) return 0;

  // Calculate: Initial quantity - Total consumed
  const totalConsumed = consumptions.reduce((sum, c) => sum + c.quantityUsed, 0);
  return lot.initialQuantity - totalConsumed;
};

/**
 * Create a reconciliation record
 * @param {string} userId - User ID
 * @param {Object} reconciliationData - Reconciliation data
 * @returns {Promise<Object>} Created reconciliation
 */
export const createReconciliation = async (userId, reconciliationData) => {
  if (!userId) throw new Error('User ID is required');

  const reconciliationRef = doc(collection(db, `users/${userId}/lot_reconciliations`));

  const reconciliation = {
    id: reconciliationRef.id,
    ...reconciliationData,
    createdAt: Timestamp.now(),
  };

  await setDoc(reconciliationRef, reconciliation);
  return reconciliation;
};

/**
 * Get reconciliations for a specific period
 * @param {string} userId - User ID
 * @param {string} period - Period in YYYY-MM format
 * @returns {Promise<Array>} Reconciliations
 */
export const getReconciliationsByPeriod = async (userId, period) => {
  if (!userId || !period) return [];

  const reconciliationsRef = collection(db, `users/${userId}/lot_reconciliations`);
  const q = query(reconciliationsRef, where('period', '==', period));

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => doc.data());

  // Sort by createdAt desc in memory to avoid index requirement
  return data.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
};

/**
 * Apply reconciliation adjustment
 * @param {string} userId - User ID
 * @param {string} reconciliationId - Reconciliation ID
 * @param {string} approvedBy - User email who approved
 * @param {string} approvedByEmail - User email
 * @returns {Promise<Object>} Updated reconciliation
 */
export const applyReconciliationAdjustment = async (
  userId,
  reconciliationId,
  approvedBy,
  approvedByEmail
) => {
  if (!userId || !reconciliationId || !approvedBy) {
    throw new Error('User ID, reconciliation ID, and approver are required');
  }

  // Get reconciliation
  const reconciliationsRef = collection(db, `users/${userId}/lot_reconciliations`);
  const q = query(reconciliationsRef, where('id', '==', reconciliationId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Reconciliation not found');
  }

  const recon = snapshot.docs[0].data();

  // Adjustment type: usually align accounting to physical reality
  const adjustmentType = 'accounting-to-physical';

  // Create a phantom consumption to adjust accounting records
  await createPhantomConsumption(userId, {
    lotId: recon.lotId,
    quantityAdjustment: recon.variance,
    reason: 'Monthly reconciliation adjustment',
    reconciliationId: recon.id,
    approvedBy,
    notes: `Accounting balance adjusted from ${recon.accountingBalance} to ${recon.physicalBalance}`,
  });

  // Update reconciliation status
  const reconciliationRef = doc(db, `users/${userId}/lot_reconciliations`, reconciliationId);
  const updateData = {
    status: 'adjusted',
    adjustmentType,
    adjustmentDate: new Date().toISOString(),
    adjustedBy: approvedBy,
    adjustedByEmail: approvedByEmail,
    approvedBy: approvedBy,
    approvedByEmail: approvedByEmail,
    approvedAt: new Date().toISOString(),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(reconciliationRef, updateData);

  return { ...recon, ...updateData };
};

/**
 * Create a phantom consumption for reconciliation adjustments
 * @param {string} userId - User ID
 * @param {Object} adjustmentData - Adjustment data
 * @returns {Promise<Object>} Created phantom consumption
 */
export const createPhantomConsumption = async (userId, adjustmentData) => {
  const consumptionRef = doc(collection(db, `users/${userId}/lot_consumptions`));

  const phantomConsumption = {
    id: consumptionRef.id,
    lotId: adjustmentData.lotId,
    lotNumber: adjustmentData.lotNumber || 'N/A',
    orderId: 'RECONCILIATION',
    orderNumber: `RECON-${adjustmentData.reconciliationId}`,
    quantityUsed: adjustmentData.quantityAdjustment,
    unitCost: 0, // No cost impact, just quantity adjustment
    totalCost: 0,
    consumptionType: 'manual',
    consumptionDate: new Date().toISOString().split('T')[0],
    createdBy: adjustmentData.approvedBy,
    createdByEmail: adjustmentData.approvedBy,
    createdAt: Timestamp.now(),
    notes: adjustmentData.notes,
  };

  await setDoc(consumptionRef, phantomConsumption);
  return phantomConsumption;
};

/**
 * Generate reconciliation report for a period
 * @param {string} userId - User ID
 * @param {string} period - Period in YYYY-MM format
 * @returns {Promise<Object>} Reconciliation summary report
 */
export const generateReconciliationReport = async (userId, period) => {
  const reconciliations = await getReconciliationsByPeriod(userId, period);

  const summary = {
    period,
    totalReconciliations: reconciliations.length,
    totalVarianceValue: reconciliations.reduce((sum, r) => sum + Math.abs(r.varianceValue), 0),
    pendingCount: reconciliations.filter((r) => r.status === 'pending').length,
    approvedCount: reconciliations.filter((r) => r.status === 'approved').length,
    adjustedCount: reconciliations.filter((r) => r.status === 'adjusted').length,
    rejectedCount: reconciliations.filter((r) => r.status === 'rejected').length,
    byProduct: {},
  };

  // Group by product
  for (const recon of reconciliations) {
    if (!summary.byProduct[recon.productId]) {
      summary.byProduct[recon.productId] = {
        productName: recon.productName,
        variances: [],
        totalVariance: 0,
        totalVarianceValue: 0,
      };
    }

    summary.byProduct[recon.productId].variances.push(recon);
    summary.byProduct[recon.productId].totalVariance += recon.variance;
    summary.byProduct[recon.productId].totalVarianceValue += Math.abs(recon.varianceValue);
  }

  return summary;
};

/**
 * Get current period in YYYY-MM format
 * @returns {string} Current period
 */
export const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get previous period in YYYY-MM format
 * @returns {string} Previous period
 */
export const getPreviousPeriod = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};
