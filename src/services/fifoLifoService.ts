import { StockLot, LotConsumption } from '../types';

/**
 * FIFO/LIFO Service
 * Handles FIFO (First In First Out) and LIFO (Last In First Out) calculations for lot consumption
 */

/**
 * Calculate FIFO consumption - consume oldest lots first
 * @param {StockLot[]} availableLots - Array of available stock lots
 * @param {number} quantityNeeded - Total quantity needed
 * @returns {Partial<LotConsumption>[]} Array of LotConsumption objects
 */
export const calculateFIFOConsumption = (
  availableLots: StockLot[],
  quantityNeeded: number
): Partial<LotConsumption>[] => {
  const consumptions: Partial<LotConsumption>[] = [];
  let remainingQuantity = quantityNeeded;

  // Sort by purchase date (oldest first)
  const sortedLots = [...availableLots].sort((a, b) => {
    const dateA = a.purchaseDate
      ? new Date(a.purchaseDate)
      : a.createdAt
        ? new Date(a.createdAt)
        : new Date();
    const dateB = b.purchaseDate
      ? new Date(b.purchaseDate)
      : b.createdAt
        ? new Date(b.createdAt)
        : new Date();
    return dateA.getTime() - dateB.getTime();
  });

  for (const lot of sortedLots) {
    if (remainingQuantity <= 0) break;

    // Use remainingQuantity if defined, otherwise quantity (compatibility)
    const lotQuantity = lot.remainingQuantity ?? (lot as any).quantity;
    const quantityFromThisLot = Math.min(lotQuantity, remainingQuantity);

    if (quantityFromThisLot > 0) {
      consumptions.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityUsed: quantityFromThisLot,
        unitCost: lot.unitCost,
        totalCost: quantityFromThisLot * lot.unitCost,
        // purchaseDate is not in LotConsumption interface, but useful for debugging
      });

      remainingQuantity -= quantityFromThisLot;
    }
  }

  return consumptions;
};

/**
 * Calculate LIFO consumption - consume newest lots first
 * @param {StockLot[]} availableLots - Array of available stock lots
 * @param {number} quantityNeeded - Total quantity needed
 * @returns {Partial<LotConsumption>[]} Array of LotConsumption objects
 */
export const calculateLIFOConsumption = (
  availableLots: StockLot[],
  quantityNeeded: number
): Partial<LotConsumption>[] => {
  const consumptions: Partial<LotConsumption>[] = [];
  let remainingQuantity = quantityNeeded;

  // Sort by purchase date (newest first)
  const sortedLots = [...availableLots].sort((a, b) => {
    const dateA = a.purchaseDate
      ? new Date(a.purchaseDate)
      : a.createdAt
        ? new Date(a.createdAt)
        : new Date();
    const dateB = b.purchaseDate
      ? new Date(b.purchaseDate)
      : b.createdAt
        ? new Date(b.createdAt)
        : new Date();
    return dateB.getTime() - dateA.getTime(); // Reversed for LIFO
  });

  for (const lot of sortedLots) {
    if (remainingQuantity <= 0) break;

    const lotQuantity = lot.remainingQuantity ?? (lot as any).quantity;
    const quantityFromThisLot = Math.min(lotQuantity, remainingQuantity);

    if (quantityFromThisLot > 0) {
      consumptions.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityUsed: quantityFromThisLot,
        unitCost: lot.unitCost,
        totalCost: quantityFromThisLot * lot.unitCost,
      });

      remainingQuantity -= quantityFromThisLot;
    }
  }

  return consumptions;
};

/**
 * Calculate weighted average cost consumption
 * @param {StockLot[]} availableLots - Array of available stock lots
 * @param {number} quantityNeeded - Total quantity needed
 * @returns {Partial<LotConsumption>[]} Array of LotConsumption objects
 */
export const calculateAverageCostConsumption = (
  availableLots: StockLot[],
  quantityNeeded: number
): Partial<LotConsumption>[] => {
  // Calculate weighted average cost
  const totalQuantity = availableLots.reduce(
    (sum, lot) => sum + (lot.remainingQuantity ?? (lot as any).quantity),
    0
  );
  const totalCost = availableLots.reduce(
    (sum, lot) => sum + (lot.remainingQuantity ?? (lot as any).quantity) * lot.unitCost,
    0
  );
  const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

  const consumptions: Partial<LotConsumption>[] = [];
  let remainingQuantity = quantityNeeded;

  // Consume proportionally from all lots
  for (const lot of availableLots) {
    if (remainingQuantity <= 0) break;

    const lotQuantity = lot.remainingQuantity ?? (lot as any).quantity;
    const proportion = lotQuantity / totalQuantity;
    const quantityFromThisLot = Math.min(
      lotQuantity,
      Math.min(remainingQuantity, quantityNeeded * proportion)
    );

    if (quantityFromThisLot > 0) {
      consumptions.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityUsed: quantityFromThisLot,
        unitCost: averageCost, // Use average cost
        totalCost: quantityFromThisLot * averageCost,
      });

      remainingQuantity -= quantityFromThisLot;
    }
  }

  return consumptions;
};

/**
 * Detect FIFO violations
 * @param {Partial<LotConsumption>[]} selectedLots - Manually selected lots
 * @param {Partial<LotConsumption>[]} fifoLots - FIFO suggested lots
 * @returns {Object} Violation details
 */
export const detectFIFOViolation = (
  selectedLots: Partial<LotConsumption>[],
  fifoLots: Partial<LotConsumption>[]
): { hasViolation: boolean; violationType: string | null; message: string } => {
  // Simple comparison - check if lot order matches
  const selectedOrder = selectedLots.map((l) => l.lotId).join(',');
  const fifoOrder = fifoLots.map((l) => l.lotId).join(',');

  const hasViolation = selectedOrder !== fifoOrder;

  return {
    hasViolation,
    violationType: hasViolation ? 'order_mismatch' : null,
    message: hasViolation
      ? 'Manuel seçim FIFO kuralını ihlal ediyor. Farklı lotlar veya farklı sırada lotlar kullanıldı.'
      : 'FIFO kuralına uygun',
  };
};
