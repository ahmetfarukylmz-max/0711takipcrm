import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { db } from './firebase';
import { logger } from '../utils/logger';

/**
 * COUNTER SERVICE
 * Manages sequential counters for orders, quotes, and other entities
 * Format: SIP-2025-1001, TEK-2025-0523
 */

/**
 * Get current year for counter
 */
const getCurrentYear = () => {
  return new Date().getFullYear();
};

/**
 * Get next counter value for a specific type
 * @param {string} userId - User ID
 * @param {string} counterType - Type of counter ('order' or 'quote')
 * @returns {Promise<Object>} Counter info { number, year, formattedNumber }
 */
export const getNextCounter = async (userId, counterType) => {
  if (!userId) throw new Error('User ID is required');
  if (!counterType) throw new Error('Counter type is required');

  const counterRef = doc(db, `users/${userId}/counters/${counterType}`);
  const currentYear = getCurrentYear();

  try {
    // Use transaction to ensure atomic increment
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let currentValue = 1;
      let year = currentYear;

      if (counterDoc.exists()) {
        const data = counterDoc.data();
        const storedYear = data.year || currentYear;

        // Check if year changed - reset counter
        if (storedYear !== currentYear) {
          currentValue = 1;
          year = currentYear;
        } else {
          currentValue = (data.value || 0) + 1;
          year = storedYear;
        }
      }

      // Update counter
      transaction.set(counterRef, {
        value: currentValue,
        year: year,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      return { value: currentValue, year };
    });

    // Format the number
    const prefix = counterType === 'order' ? 'SIP' : 'TEK';
    const paddedNumber = result.value.toString().padStart(4, '0');
    const formattedNumber = `${prefix}-${result.year}-${paddedNumber}`;

    return {
      number: result.value,
      year: result.year,
      formattedNumber
    };
  } catch (error) {
    logger.error('Error getting next counter:', error);
    throw error;
  }
};

/**
 * Get next order number
 * @param {string} userId - User ID
 * @returns {Promise<string>} Formatted order number (e.g., "SIP-2025-1001")
 */
export const getNextOrderNumber = async (userId) => {
  const counter = await getNextCounter(userId, 'order');
  return counter.formattedNumber;
};

/**
 * Get next quote number
 * @param {string} userId - User ID
 * @returns {Promise<string>} Formatted quote number (e.g., "TEK-2025-0523")
 */
export const getNextQuoteNumber = async (userId) => {
  const counter = await getNextCounter(userId, 'quote');
  return counter.formattedNumber;
};

/**
 * Initialize counters for a new user
 * @param {string} userId - User ID
 */
export const initializeCounters = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const currentYear = getCurrentYear();
  const orderCounterRef = doc(db, `users/${userId}/counters/order`);
  const quoteCounterRef = doc(db, `users/${userId}/counters/quote`);

  try {
    // Check if counters exist
    const orderDoc = await getDoc(orderCounterRef);
    const quoteDoc = await getDoc(quoteCounterRef);

    // Initialize if not exist
    if (!orderDoc.exists()) {
      await setDoc(orderCounterRef, {
        value: 0,
        year: currentYear,
        lastUpdated: new Date().toISOString()
      });
    }

    if (!quoteDoc.exists()) {
      await setDoc(quoteCounterRef, {
        value: 0,
        year: currentYear,
        lastUpdated: new Date().toISOString()
      });
    }

    logger.log('Counters initialized successfully');
  } catch (error) {
    logger.error('Error initializing counters:', error);
    throw error;
  }
};

/**
 * Get current counter value (without incrementing)
 * @param {string} userId - User ID
 * @param {string} counterType - Type of counter
 * @returns {Promise<Object>} Current counter info
 */
export const getCurrentCounter = async (userId, counterType) => {
  if (!userId) throw new Error('User ID is required');

  const counterRef = doc(db, `users/${userId}/counters/${counterType}`);
  const counterDoc = await getDoc(counterRef);

  if (counterDoc.exists()) {
    return counterDoc.data();
  }

  return { value: 0, year: getCurrentYear() };
};

/**
 * Reset counter (admin function)
 * @param {string} userId - User ID
 * @param {string} counterType - Type of counter
 */
export const resetCounter = async (userId, counterType) => {
  if (!userId) throw new Error('User ID is required');

  const counterRef = doc(db, `users/${userId}/counters/${counterType}`);
  await setDoc(counterRef, {
    value: 0,
    year: getCurrentYear(),
    lastUpdated: new Date().toISOString()
  });

  logger.log(`Counter ${counterType} reset successfully`);
};
