import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc, // Added
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';
import { StockLot, LotConsumption } from '../types';

/**
 * LOT SERVICE - Hybrid Costing System
 *
 * This service handles lot tracking, FIFO/LIFO calculations,
 * and cost management for the hybrid costing system.
 */

// ============================================================================
// LOT MANAGEMENT
// ============================================================================

/**
 * Generate a unique lot number
 * Format: LOT-YYYY-MM-DD-XXX
 */
export const generateLotNumber = (productId: string): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `LOT-${dateStr}-${randomSuffix}`;
};

/**
 * Create a new stock lot
 * @param {string} userId - User ID
 * @param {Partial<StockLot>} lotData - Lot data
 * @returns {Promise<string>} Created lot ID
 */
export const createStockLot = async (
  userId: string,
  lotData: Partial<StockLot>
): Promise<string> => {
  if (!userId) throw new Error('User ID is required');

  const lotRef = doc(collection(db, `users/${userId}/stock_lots`));

  const lot = {
    id: lotRef.id,
    ...lotData,
    remainingQuantity: lotData.initialQuantity,
    consumedQuantity: 0,
    status: 'active',
    isConsumed: false,
    createdAt: Timestamp.now(),
  };

  await setDoc(lotRef, lot);
  return lotRef.id;
};

/**
 * Get available lots for a product (with remaining quantity > 0)
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {string} sortMethod - 'fifo' (oldest first) or 'lifo' (newest first)
 * @returns {Promise<StockLot[]>} Available lots
 */
export const getAvailableLots = async (
  userId: string,
  productId: string,
  sortMethod: 'fifo' | 'lifo' = 'fifo'
): Promise<StockLot[]> => {
  if (!userId || !productId) return [];

  const lotsRef = collection(db, `users/${userId}/stock_lots`);
  const q = query(
    lotsRef,
    where('productId', '==', productId),
    where('status', '==', 'active'),
    where('remainingQuantity', '>', 0)
  );

  const snapshot = await getDocs(q);
  const lots = snapshot.docs.map((doc) => doc.data() as StockLot);

  // Sort by purchase date
  if (sortMethod === 'fifo') {
    // Oldest first (FIFO)
    lots.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
  } else if (sortMethod === 'lifo') {
    // Newest first (LIFO)
    lots.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  return lots;
};

/**
 * Get all lots for a product (including consumed)
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<StockLot[]>} All lots
 */
export const getProductLots = async (userId: string, productId: string): Promise<StockLot[]> => {
  if (!userId || !productId) return [];

  const lotsRef = collection(db, `users/${userId}/stock_lots`);
  const q = query(lotsRef, where('productId', '==', productId), orderBy('purchaseDate', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as StockLot);
};

/**
 * Helper function to get lots by product (uses current user from context)
 * Note: This is a simplified version that expects userId to be passed in
 * For use in components, pass userId from useAuth
 * @param {string} productId - Product ID
 * @returns {Promise<StockLot[]>} Available lots with quantity > 0
 */
export const getLotsByProduct = async (
  productId: string,
  userId: string | null = null
): Promise<StockLot[]> => {
  // If userId not provided, this will be handled by the component using useAuth
  if (!userId) {
    logger.warn('getLotsByProduct called without userId');
    return [];
  }

  return await getAvailableLots(userId, productId, 'fifo');
};

// ============================================================================
// COST CALCULATION (FIFO, LIFO, Average)
// ============================================================================

interface CostCalculationResult {
  totalCost: number;
  costPerUnit: number;
  lotConsumptions: Partial<LotConsumption>[];
}

/**
 * Calculate cost using FIFO method
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantityNeeded - Quantity to calculate cost for
 * @returns {Promise<CostCalculationResult>} { totalCost, costPerUnit, lotConsumptions }
 */
export const calculateFIFOCost = async (
  userId: string,
  productId: string,
  quantityNeeded: number
): Promise<CostCalculationResult> => {
  const lots = await getAvailableLots(userId, productId, 'fifo');

  let remaining = quantityNeeded;
  let totalCost = 0;
  const consumptions: Partial<LotConsumption>[] = [];

  for (const lot of lots) {
    if (remaining <= 0) break;

    const qtyFromLot = Math.min(remaining, lot.remainingQuantity);
    const costFromLot = qtyFromLot * lot.unitCost;

    consumptions.push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      quantityUsed: qtyFromLot,
      unitCost: lot.unitCost,
      totalCost: costFromLot,
      consumptionType: 'fifo',
    });

    totalCost += costFromLot;
    remaining -= qtyFromLot;
  }

  if (remaining > 0) {
    // Yetersiz stok durumu, ancak yine de hesaplananı dönüyoruz. UI'da uyarı gösterilebilir.
    // throw new Error(`Yetersiz stok: ${remaining} ${lots[0]?.productUnit || 'adet'} eksik`);
  }

  return {
    totalCost,
    costPerUnit: quantityNeeded > 0 ? totalCost / quantityNeeded : 0,
    lotConsumptions: consumptions,
  };
};

/**
 * Calculate cost using LIFO method
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantityNeeded - Quantity to calculate cost for
 * @returns {Promise<CostCalculationResult>} { totalCost, costPerUnit, lotConsumptions }
 */
export const calculateLIFOCost = async (
  userId: string,
  productId: string,
  quantityNeeded: number
): Promise<CostCalculationResult> => {
  const lots = await getAvailableLots(userId, productId, 'lifo');

  let remaining = quantityNeeded;
  let totalCost = 0;
  const consumptions: Partial<LotConsumption>[] = [];

  for (const lot of lots) {
    if (remaining <= 0) break;

    const qtyFromLot = Math.min(remaining, lot.remainingQuantity);
    const costFromLot = qtyFromLot * lot.unitCost;

    consumptions.push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      quantityUsed: qtyFromLot,
      unitCost: lot.unitCost,
      totalCost: costFromLot,
      consumptionType: 'lifo',
    });

    totalCost += costFromLot;
    remaining -= qtyFromLot;
  }

  return {
    totalCost,
    costPerUnit: quantityNeeded > 0 ? totalCost / quantityNeeded : 0,
    lotConsumptions: consumptions,
  };
};

/**
 * Calculate cost from manually selected lots
 * @param {Array} selectedLots - Array of { lotId, quantityUsed } objects
 * @param {Array} availableLots - Array of available lot objects
 * @returns {Object} { totalCost, costPerUnit, lotConsumptions }
 */
export const calculateCostFromSelectedLots = (
  selectedLots: { lotId: string; quantityUsed: number }[],
  availableLots: StockLot[]
): CostCalculationResult => {
  let totalCost = 0;
  let totalQuantity = 0;
  const consumptions: Partial<LotConsumption>[] = [];

  for (const selection of selectedLots) {
    const lot = availableLots.find((l) => l.id === selection.lotId);
    if (!lot) {
      throw new Error(`Lot bulunamadı: ${selection.lotId}`);
    }

    if (selection.quantityUsed > lot.remainingQuantity) {
      throw new Error(
        `${lot.lotNumber} için yetersiz stok: ${lot.remainingQuantity} mevcut, ${selection.quantityUsed} talep edildi`
      );
    }

    const costFromLot = selection.quantityUsed * lot.unitCost;

    consumptions.push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      quantityUsed: selection.quantityUsed,
      unitCost: lot.unitCost,
      totalCost: costFromLot,
      consumptionType: 'manual',
    });

    totalCost += costFromLot;
    totalQuantity += selection.quantityUsed;
  }

  return {
    totalCost,
    costPerUnit: totalQuantity > 0 ? totalCost / totalQuantity : 0,
    lotConsumptions: consumptions,
  };
};

/**
 * Calculate weighted average cost for a product
 * @param {number} currentQty - Current stock quantity
 * @param {number} currentAvg - Current average cost
 * @param {number} newQty - New quantity being added
 * @param {number} newCost - Cost of new quantity
 * @returns {Object} { averageCost, totalValue, quantity }
 */
export const calculateWeightedAverage = (
  currentQty: number,
  currentAvg: number,
  newQty: number,
  newCost: number
): { averageCost: number; totalValue: number; quantity: number } => {
  const currentValue = currentQty * currentAvg;
  const newValue = newQty * newCost;
  const totalQty = currentQty + newQty;
  const totalValue = currentValue + newValue;

  return {
    averageCost: totalQty > 0 ? totalValue / totalQty : 0,
    totalValue: totalValue,
    quantity: totalQty,
  };
};

// ============================================================================
// LOT CONSUMPTION
// ============================================================================

/**
 * Consume lots and create consumption records
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {Array} consumptions - Array of lot consumptions
 * @returns {Promise<Array>} Created consumption records
 */
export const consumeLots = async (
  userId: string,
  orderId: string,
  consumptions: Partial<LotConsumption>[]
): Promise<LotConsumption[]> => {
  if (!userId || !orderId || !consumptions || consumptions.length === 0) {
    throw new Error('Invalid parameters for consumeLots');
  }

  const createdConsumptions: LotConsumption[] = [];

  for (const consumption of consumptions) {
    // 1. Create LotConsumption record
    const consumptionRef = doc(collection(db, `users/${userId}/lot_consumptions`));
    const consumptionData = {
      id: consumptionRef.id,
      ...consumption,
      orderId,
      consumptionDate: new Date().toISOString().split('T')[0],
      createdAt: Timestamp.now(),
    } as LotConsumption;

    await setDoc(consumptionRef, consumptionData);
    createdConsumptions.push(consumptionData);

    // 2. Update the lot
    if (consumption.lotId && consumption.quantityUsed) {
      const lotRef = doc(db, `users/${userId}/stock_lots`, consumption.lotId);
      const lotDoc = await getDoc(lotRef);

      if (!lotDoc.exists()) {
        logger.warn(`Lot ${consumption.lotId} not found, skipping update`);
        continue;
      }

      const lotData = lotDoc.data() as StockLot;
      const newRemaining = lotData.remainingQuantity - consumption.quantityUsed;
      const newConsumed = lotData.consumedQuantity + consumption.quantityUsed;

      await updateDoc(lotRef, {
        remainingQuantity: newRemaining,
        consumedQuantity: newConsumed,
        isConsumed: newRemaining <= 0,
        consumedAt: newRemaining <= 0 ? new Date().toISOString() : null,
        status: newRemaining <= 0 ? 'consumed' : 'active',
        updatedAt: Timestamp.now(),
      });
    }
  }

  return createdConsumptions;
};

/**
 * Get lot consumptions for an order
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Array>} Lot consumptions
 */
export const getOrderLotConsumptions = async (
  userId: string,
  orderId: string
): Promise<LotConsumption[]> => {
  if (!userId || !orderId) return [];

  const consumptionsRef = collection(db, `users/${userId}/lot_consumptions`);
  const q = query(consumptionsRef, where('orderId', '==', orderId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as LotConsumption);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if product has sufficient stock across all lots
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantityNeeded - Quantity needed
 * @returns {Promise<boolean>} True if sufficient stock exists
 */
export const hasSufficientStock = async (
  userId: string,
  productId: string,
  quantityNeeded: number
): Promise<boolean> => {
  const lots = await getAvailableLots(userId, productId);
  const totalAvailable = lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  return totalAvailable >= quantityNeeded;
};

/**
 * Get total available quantity for a product across all lots
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<number>} Total available quantity
 */
export const getTotalAvailableQuantity = async (
  userId: string,
  productId: string
): Promise<number> => {
  const lots = await getAvailableLots(userId, productId);
  return lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
};
