import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { createStockLot } from './lotService';

/**
 * MIGRATION SERVICE - Hybrid Costing System
 *
 * This service helps migrate existing products and data
 * to the new hybrid costing system with lot tracking.
 */

// ============================================================================
// PRODUCT MIGRATION
// ============================================================================

/**
 * Migrate all products to hybrid costing system
 * Adds default costing configuration to all products
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Migration summary
 */
export const migrateProductsToHybridCosting = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  console.log('🔄 Starting product migration to hybrid costing system...');

  const productsRef = collection(db, `users/${userId}/products`);
  const snapshot = await getDocs(productsRef);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const product of products) {
    try {
      // Skip if already migrated
      if (product.costingMethod !== undefined) {
        console.log(`⏭️ Skipping ${product.name} - already migrated`);
        continue;
      }

      const productRef = doc(db, `users/${userId}/products`, product.id);

      // Add hybrid costing fields
      const updateData = {
        // Default settings
        costingMethod: 'average', // Start with average method (safest)
        allowManualLotSelection: false,
        requireLotApproval: false,
        lotTrackingEnabled: false, // User must enable manually

        // Use existing cost_price as average
        averageCost: product.cost_price || 0,
        totalStockValue: (product.stock_quantity || 0) * (product.cost_price || 0),

        // Initialize cost history
        costHistory: [{
          date: new Date().toISOString().split('T')[0],
          averageCost: product.cost_price || 0,
          stockQuantity: product.stock_quantity || 0,
          method: 'average',
          reason: 'migration',
          notes: 'Hibrit maliyet sistemine geçiş - başlangıç kaydı'
        }],

        updatedAt: Timestamp.now()
      };

      await updateDoc(productRef, updateData);
      successCount++;
      console.log(`✅ Migrated: ${product.name}`);
    } catch (error) {
      errorCount++;
      errors.push({ productId: product.id, productName: product.name, error: error.message });
      console.error(`❌ Error migrating ${product.name}:`, error);
    }
  }

  const summary = {
    totalProducts: products.length,
    successCount,
    errorCount,
    errors
  };

  console.log('\n📊 Migration Summary:');
  console.log(`   Total Products: ${summary.totalProducts}`);
  console.log(`   ✅ Migrated: ${summary.successCount}`);
  console.log(`   ❌ Errors: ${summary.errorCount}`);

  return summary;
};

/**
 * Convert existing stock to initial lot for a product
 * This creates a single "starting lot" from current stock
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Created lot or null
 */
export const convertExistingStockToLot = async (userId, productId) => {
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required');
  }

  // Get product
  const productRef = doc(db, `users/${userId}/products`, productId);
  const productDoc = await getDocs(collection(db, `users/${userId}/products`));
  const products = productDoc.docs.map(d => ({ id: d.id, ...d.data() }));
  const product = products.find(p => p.id === productId);

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if stock exists
  if (!product.stock_quantity || product.stock_quantity <= 0) {
    console.log(`⚠️ No stock for ${product.name}, skipping lot creation`);
    return null;
  }

  // Create initial lot
  const lot = await createStockLot(userId, {
    productId: product.id,
    productName: product.name,
    productUnit: product.unit,
    lotNumber: `INITIAL-${product.id.slice(0, 8).toUpperCase()}`,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseReference: 'Sistem Geçişi',
    supplierName: 'Mevcut Stok',
    initialQuantity: product.stock_quantity,
    unitCost: product.cost_price || 0,
    totalCost: (product.stock_quantity || 0) * (product.cost_price || 0),
    currency: product.currency || 'TRY',
    notes: 'Hibrit maliyet sistemine geçiş sırasında mevcut stoktan oluşturuldu',
    createdBy: userId,
    createdByEmail: 'system@migration'
  });

  // Enable lot tracking for this product
  await updateDoc(productRef, {
    lotTrackingEnabled: true,
    updatedAt: Timestamp.now()
  });

  console.log(`✅ Created initial lot for ${product.name}: ${lot.lotNumber}`);
  return lot;
};

/**
 * Bulk convert multiple products' stock to lots
 * @param {string} userId - User ID
 * @param {Array<string>} productIds - Array of product IDs to convert
 * @returns {Promise<Object>} Conversion summary
 */
export const bulkConvertStockToLots = async (userId, productIds) => {
  if (!userId || !productIds || productIds.length === 0) {
    throw new Error('User ID and product IDs are required');
  }

  console.log(`🔄 Converting ${productIds.length} products to lot tracking...`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];
  const createdLots = [];

  for (const productId of productIds) {
    try {
      const lot = await convertExistingStockToLot(userId, productId);
      if (lot) {
        createdLots.push(lot);
        successCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      errorCount++;
      errors.push({ productId, error: error.message });
      console.error(`❌ Error converting product ${productId}:`, error);
    }
  }

  const summary = {
    totalProducts: productIds.length,
    successCount,
    skippedCount,
    errorCount,
    errors,
    createdLots
  };

  console.log('\n📊 Conversion Summary:');
  console.log(`   Total Products: ${summary.totalProducts}`);
  console.log(`   ✅ Converted: ${summary.successCount}`);
  console.log(`   ⏭️ Skipped (no stock): ${summary.skippedCount}`);
  console.log(`   ❌ Errors: ${summary.errorCount}`);

  return summary;
};

// ============================================================================
// DATA VALIDATION
// ============================================================================

/**
 * Validate hybrid costing system integrity
 * Checks for data consistency issues
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Validation report
 */
export const validateHybridCostingData = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  console.log('🔍 Validating hybrid costing data...');

  const issues = [];

  // Check 1: Products with lot tracking but no lots
  const productsRef = collection(db, `users/${userId}/products`);
  const productsSnapshot = await getDocs(productsRef);
  const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const lotsRef = collection(db, `users/${userId}/stock_lots`);
  const lotsSnapshot = await getDocs(lotsRef);
  const lots = lotsSnapshot.docs.map(doc => doc.data());

  for (const product of products) {
    if (product.lotTrackingEnabled && product.stock_quantity > 0) {
      const productLots = lots.filter(l => l.productId === product.id && l.status === 'active');
      const totalLotQuantity = productLots.reduce((sum, l) => sum + l.remainingQuantity, 0);

      if (productLots.length === 0) {
        issues.push({
          type: 'NO_LOTS',
          severity: 'HIGH',
          productId: product.id,
          productName: product.name,
          message: `Lot takibi aktif ama lot bulunamadı (stok: ${product.stock_quantity})`
        });
      } else if (Math.abs(totalLotQuantity - product.stock_quantity) > 0.01) {
        issues.push({
          type: 'QUANTITY_MISMATCH',
          severity: 'MEDIUM',
          productId: product.id,
          productName: product.name,
          message: `Lot toplamı (${totalLotQuantity}) ile ürün stoğu (${product.stock_quantity}) uyuşmuyor`,
          difference: Math.abs(totalLotQuantity - product.stock_quantity)
        });
      }
    }
  }

  // Check 2: Lots with invalid quantities
  for (const lot of lots) {
    if (lot.remainingQuantity < 0) {
      issues.push({
        type: 'NEGATIVE_QUANTITY',
        severity: 'HIGH',
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        message: `Lot'ta negatif kalan miktar: ${lot.remainingQuantity}`
      });
    }

    if (lot.consumedQuantity + lot.remainingQuantity !== lot.initialQuantity) {
      issues.push({
        type: 'QUANTITY_INTEGRITY',
        severity: 'MEDIUM',
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        message: `Lot miktarları tutarsız: başlangıç=${lot.initialQuantity}, tüketilen=${lot.consumedQuantity}, kalan=${lot.remainingQuantity}`
      });
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalProducts: products.length,
    productsWithLotTracking: products.filter(p => p.lotTrackingEnabled).length,
    totalLots: lots.length,
    activeLots: lots.filter(l => l.status === 'active').length,
    issuesFound: issues.length,
    issues: issues.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
  };

  console.log('\n📊 Validation Report:');
  console.log(`   Total Products: ${report.totalProducts}`);
  console.log(`   Products with Lot Tracking: ${report.productsWithLotTracking}`);
  console.log(`   Total Lots: ${report.totalLots}`);
  console.log(`   Active Lots: ${report.activeLots}`);
  console.log(`   Issues Found: ${report.issuesFound}`);

  if (report.issuesFound > 0) {
    console.log('\n⚠️ Issues:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity}] ${issue.type}: ${issue.message}`);
    });
  } else {
    console.log('\n✅ No issues found!');
  }

  return report;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get migration status for the user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Migration status
 */
export const getMigrationStatus = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const productsRef = collection(db, `users/${userId}/products`);
  const snapshot = await getDocs(productsRef);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const migrated = products.filter(p => p.costingMethod !== undefined).length;
  const notMigrated = products.length - migrated;
  const withLotTracking = products.filter(p => p.lotTrackingEnabled).length;

  return {
    totalProducts: products.length,
    migratedProducts: migrated,
    notMigratedProducts: notMigrated,
    productsWithLotTracking: withLotTracking,
    migrationComplete: notMigrated === 0,
    migrationPercentage: products.length > 0 ? (migrated / products.length) * 100 : 0
  };
};

/**
 * Reset a product's hybrid costing configuration
 * WARNING: This will remove lot tracking configuration but NOT delete lots
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export const resetProductCostingConfig = async (userId, productId) => {
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required');
  }

  const productRef = doc(db, `users/${userId}/products`, productId);

  await updateDoc(productRef, {
    costingMethod: 'average',
    allowManualLotSelection: false,
    requireLotApproval: false,
    lotTrackingEnabled: false,
    updatedAt: Timestamp.now()
  });

  console.log(`✅ Reset costing configuration for product ${productId}`);
};
