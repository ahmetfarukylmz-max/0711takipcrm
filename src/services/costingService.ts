import {
  calculateFIFOCost,
  calculateLIFOCost,
  calculateWeightedAverage,
  getAvailableLots,
  hasSufficientStock,
} from './lotService';

/**
 * COSTING SERVICE - Hybrid Costing System
 *
 * This service provides high-level costing functions for orders
 * and integrates lot tracking with the order processing flow.
 */

// ============================================================================
// ORDER ITEM COSTING
// ============================================================================

/**
 * Calculate cost for an order item based on product's costing method
 * @param {string} userId - User ID
 * @param {Object} product - Product object
 * @param {number} quantity - Quantity needed
 * @returns {Promise<Object>} Cost calculation result
 */
export const calculateOrderItemCost = async (userId, product, quantity) => {
  if (!product.lotTrackingEnabled) {
    // Use simple average cost if lot tracking is disabled
    return {
      totalCost: (product.averageCost || product.cost_price) * quantity,
      costPerUnit: product.averageCost || product.cost_price,
      lotConsumptions: [],
      method: 'average',
    };
  }

  // Check if sufficient stock exists
  const hasSufficient = await hasSufficientStock(userId, product.id, quantity);
  if (!hasSufficient) {
    throw new Error(`Yetersiz stok: ${product.name} için yeterli lot bulunamadı`);
  }

  // Use product's costing method
  const method = product.costingMethod || 'fifo';

  switch (method) {
    case 'fifo':
      return await calculateFIFOCost(userId, product.id, quantity);

    case 'lifo':
      return await calculateLIFOCost(userId, product.id, quantity);

    case 'average':
      return {
        totalCost: (product.averageCost || product.cost_price) * quantity,
        costPerUnit: product.averageCost || product.cost_price,
        lotConsumptions: [],
        method: 'average',
      };

    default:
      // Default to FIFO
      return await calculateFIFOCost(userId, product.id, quantity);
  }
};

/**
 * Calculate both accounting (FIFO) and physical costs for dual tracking
 * @param {string} userId - User ID
 * @param {Object} product - Product object
 * @param {number} quantity - Quantity needed
 * @param {Array} manualLotSelection - Optional manual lot selection
 * @returns {Promise<Object>} Dual cost calculation
 */
export const calculateDualCost = async (userId, product, quantity, manualLotSelection = null) => {
  // Always calculate FIFO for accounting
  const accountingCost = await calculateFIFOCost(userId, product.id, quantity);

  // Calculate physical cost
  let physicalCost;
  let hasCostVariance = false;
  let lotSelectionMethod = 'auto-fifo';

  if (manualLotSelection && manualLotSelection.length > 0) {
    // User manually selected lots
    const availableLots = await getAvailableLots(userId, product.id);
    physicalCost = calculateCostFromSelectedLots(manualLotSelection, availableLots);
    hasCostVariance = Math.abs(physicalCost.totalCost - accountingCost.totalCost) > 0.01;
    lotSelectionMethod = 'manual';
  } else if (product.costingMethod === 'lifo') {
    // Product uses LIFO
    physicalCost = await calculateLIFOCost(userId, product.id, quantity);
    hasCostVariance = Math.abs(physicalCost.totalCost - accountingCost.totalCost) > 0.01;
    lotSelectionMethod = 'auto-lifo';
  } else {
    // Default: FIFO for both
    physicalCost = accountingCost;
    lotSelectionMethod = 'auto-fifo';
  }

  // Calculate variance
  const costVariance = physicalCost.totalCost - accountingCost.totalCost;
  const costVariancePercentage =
    accountingCost.totalCost > 0 ? (costVariance / accountingCost.totalCost) * 100 : 0;

  return {
    // Accounting (FIFO)
    accountingCost: accountingCost.totalCost,
    accountingCostPerUnit: accountingCost.costPerUnit,
    accountingLotConsumptions: accountingCost.lotConsumptions,

    // Physical (Actual)
    physicalCost: physicalCost.totalCost,
    physicalCostPerUnit: physicalCost.costPerUnit,
    physicalLotConsumptions: physicalCost.lotConsumptions,

    // Variance
    costVariance,
    costVariancePercentage,
    hasCostVariance,

    // Method
    lotSelectionMethod,
  };
};

/**
 * Calculate cost from manually selected lots
 * @param {Array} selectedLots - Array of { lotId, quantityUsed } objects
 * @param {Array} availableLots - Array of available lot objects
 * @returns {Object} { totalCost, costPerUnit, lotConsumptions }
 */
export const calculateCostFromSelectedLots = (selectedLots, availableLots) => {
  let totalCost = 0;
  let totalQuantity = 0;
  const consumptions = [];

  for (const selection of selectedLots) {
    const lot = availableLots.find((l) => l.id === selection.lotId);
    if (!lot) {
      throw new Error(`Lot bulunamadı: ${selection.lotId}`);
    }

    if (selection.quantityUsed > lot.remainingQuantity) {
      throw new Error(`${lot.lotNumber} için yetersiz stok`);
    }

    const costFromLot = selection.quantityUsed * lot.unitCost;

    consumptions.push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      quantityUsed: selection.quantityUsed,
      unitCost: lot.unitCost,
      totalCost: costFromLot,
      purchaseDate: lot.purchaseDate,
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

// ============================================================================
// PRODUCT COST UPDATES
// ============================================================================

/**
 * Update product's weighted average cost when new stock arrives
 * @param {Object} product - Current product data
 * @param {number} newQuantity - New quantity being added
 * @param {number} newUnitCost - Cost per unit of new stock
 * @returns {Object} Updated product data { averageCost, totalStockValue, stockQuantity }
 */
export const updateProductAverageCost = (product, newQuantity, newUnitCost) => {
  const currentQty = product.stock_quantity || 0;
  const currentAvg = product.averageCost || product.cost_price || 0;

  const result = calculateWeightedAverage(currentQty, currentAvg, newQuantity, newUnitCost);

  return {
    averageCost: result.averageCost,
    totalStockValue: result.totalValue,
    stock_quantity: result.quantity,
  };
};

/**
 * Add entry to product's cost history
 * @param {Object} product - Product object
 * @param {Object} entry - Cost history entry
 * @returns {Array} Updated cost history
 */
export const addCostHistoryEntry = (product, entry) => {
  const history = product.costHistory || [];

  // Add new entry
  history.push({
    date: new Date().toISOString().split('T')[0],
    ...entry,
  });

  // Keep only last 12 months (365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const filteredHistory = history.filter((h) => new Date(h.date) >= oneYearAgo);

  // Sort by date (newest first)
  filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  return filteredHistory;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'TRY') => {
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

/**
 * Calculate profit margin for an order item
 * @param {number} sellingPrice - Selling price per unit
 * @param {number} costPrice - Cost price per unit
 * @returns {Object} { profit, profitMargin, profitPercentage }
 */
export const calculateProfitMargin = (sellingPrice, costPrice) => {
  const profit = sellingPrice - costPrice;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const profitPercentage = costPrice > 0 ? (profit / costPrice) * 100 : 0;

  return {
    profit,
    profitMargin, // Kar marjı (profit / selling price)
    profitPercentage, // Kar oranı (profit / cost price)
  };
};

/**
 * Validate lot selection for an order item
 * @param {Array} selectedLots - Selected lots
 * @param {number} quantityNeeded - Quantity needed
 * @returns {Object} { isValid, error }
 */
export const validateLotSelection = (selectedLots, quantityNeeded) => {
  const totalSelected = selectedLots.reduce((sum, lot) => sum + lot.quantityUsed, 0);

  if (Math.abs(totalSelected - quantityNeeded) > 0.001) {
    return {
      isValid: false,
      error: `Seçilen miktar (${totalSelected}) ihtiyaç duyulan miktara (${quantityNeeded}) eşit değil`,
    };
  }

  return { isValid: true };
};

/**
 * Check if FIFO approval is required for lot selection
 * @param {Object} product - Product object
 * @param {Array} accountingLots - FIFO lots
 * @param {Array} physicalLots - Actually selected lots
 * @returns {boolean} True if approval is required
 */
export const requiresFIFOApproval = (product, accountingLots, physicalLots) => {
  if (!product.requireLotApproval) return false;

  // Check if lot selection differs from FIFO
  if (accountingLots.length !== physicalLots.length) return true;

  for (let i = 0; i < accountingLots.length; i++) {
    if (accountingLots[i].lotId !== physicalLots[i].lotId) return true;
    if (Math.abs(accountingLots[i].quantityUsed - physicalLots[i].quantityUsed) > 0.001)
      return true;
  }

  return false;
};
