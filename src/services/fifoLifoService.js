/**
 * FIFO/LIFO Service
 * Handles FIFO (First In First Out) and LIFO (Last In First Out) calculations for lot consumption
 */

/**
 * Calculate FIFO consumption - consume oldest lots first
 * @param {Array} availableLots - Array of available stock lots
 * @param {number} quantityNeeded - Total quantity needed
 * @returns {Array} Array of LotConsumption objects
 */
export const calculateFIFOConsumption = (availableLots, quantityNeeded) => {
  const consumptions = [];
  let remainingQuantity = quantityNeeded;

  // Sort by purchase date (oldest first)
  const sortedLots = [...availableLots].sort((a, b) => {
    const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(a.createdAt);
    const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(b.createdAt);
    return dateA - dateB;
  });

  for (const lot of sortedLots) {
    if (remainingQuantity <= 0) break;

    const quantityFromThisLot = Math.min(lot.quantity, remainingQuantity);

    if (quantityFromThisLot > 0) {
      consumptions.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityUsed: quantityFromThisLot,
        unitCost: lot.unitCost,
        totalCost: quantityFromThisLot * lot.unitCost,
        purchaseDate: lot.purchaseDate || lot.createdAt
      });

      remainingQuantity -= quantityFromThisLot;
    }
  }

  return consumptions;
};

/**
 * Calculate LIFO consumption - consume newest lots first
 * @param {Array} availableLots - Array of available stock lots
 * @param {number} quantityNeeded - Total quantity needed
 * @returns {Array} Array of LotConsumption objects
 */
export const calculateLIFOConsumption = (availableLots, quantityNeeded) => {
  const consumptions = [];
  let remainingQuantity = quantityNeeded;

  // Sort by purchase date (newest first)
  const sortedLots = [...availableLots].sort((a, b) => {
    const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(a.createdAt);
    const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(b.createdAt);
    return dateB - dateA; // Reversed for LIFO
  });

  for (const lot of sortedLots) {
    if (remainingQuantity <= 0) break;

    const quantityFromThisLot = Math.min(lot.quantity, remainingQuantity);

    if (quantityFromThisLot > 0) {
      consumptions.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityUsed: quantityFromThisLot,
        unitCost: lot.unitCost,
        totalCost: quantityFromThisLot * lot.unitCost,
        purchaseDate: lot.purchaseDate || lot.createdAt
      });

      remainingQuantity -= quantityFromThisLot;
    }
  }

  return consumptions;
};

/**
 * Calculate weighted average cost consumption
 * @param {Array} availableLots - Array of available stock lots
 * @param {number} quantityNeeded - Total quantity needed
 * @returns {Array} Array of LotConsumption objects
 */
export const calculateAverageCostConsumption = (availableLots, quantityNeeded) => {
  // Calculate weighted average cost
  const totalQuantity = availableLots.reduce((sum, lot) => sum + lot.quantity, 0);
  const totalCost = availableLots.reduce((sum, lot) => sum + (lot.quantity * lot.unitCost), 0);
  const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

  const consumptions = [];
  let remainingQuantity = quantityNeeded;

  // Consume proportionally from all lots
  for (const lot of availableLots) {
    if (remainingQuantity <= 0) break;

    const proportion = lot.quantity / totalQuantity;
    const quantityFromThisLot = Math.min(
      lot.quantity,
      Math.min(remainingQuantity, quantityNeeded * proportion)
    );

    if (quantityFromThisLot > 0) {
      consumptions.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityUsed: quantityFromThisLot,
        unitCost: averageCost, // Use average cost
        totalCost: quantityFromThisLot * averageCost,
        purchaseDate: lot.purchaseDate || lot.createdAt
      });

      remainingQuantity -= quantityFromThisLot;
    }
  }

  return consumptions;
};

/**
 * Detect FIFO violations
 * @param {Array} selectedLots - Manually selected lots
 * @param {Array} fifoLots - FIFO suggested lots
 * @returns {Object} Violation details
 */
export const detectFIFOViolation = (selectedLots, fifoLots) => {
  // Simple comparison - check if lot order matches
  const selectedOrder = selectedLots.map(l => l.lotId).join(',');
  const fifoOrder = fifoLots.map(l => l.lotId).join(',');

  const hasViolation = selectedOrder !== fifoOrder;

  return {
    hasViolation,
    violationType: hasViolation ? 'order_mismatch' : null,
    message: hasViolation
      ? 'Manuel seçim FIFO kuralını ihlal ediyor. Farklı lotlar veya farklı sırada lotlar kullanıldı.'
      : 'FIFO kuralına uygun'
  };
};
