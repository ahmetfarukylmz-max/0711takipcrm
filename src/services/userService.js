import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { db } from './firebase';
import { logger } from '../utils/logger';

/**
 * Kullanıcıyı admin yapma
 * @param {string} userId - Kullanıcının UID'si
 */
export const makeUserAdmin = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            role: 'admin',
            updatedAt: new Date().toISOString()
        });
        logger.log(`User ${userId} is now an admin`);
        return { success: true };
    } catch (error) {
        logger.error('Error making user admin:', error);
        return { success: false, error };
    }
};

/**
 * Kullanıcının admin yetkisini kaldırma
 * @param {string} userId - Kullanıcının UID'si
 */
export const removeAdminRole = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            role: 'user',
            updatedAt: new Date().toISOString()
        });
        logger.log(`User ${userId} is now a regular user`);
        return { success: true };
    } catch (error) {
        logger.error('Error removing admin role:', error);
        return { success: false, error };
    }
};

/**
 * Kullanıcının role bilgisini al
 * @param {string} userId - Kullanıcının UID'si
 */
export const getUserRole = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data().role || 'user';
        }
        return 'user';
    } catch (error) {
        logger.error('Error getting user role:', error);
        return 'user';
    }
};

/**
 * İlk admin kullanıcıyı oluşturma (manuel)
 * @param {string} userId - Kullanıcının UID'si
 * @param {string} email - Kullanıcının email'i
 */
export const createInitialAdmin = async (userId, email) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString(),
            isInitialAdmin: true
        });
        logger.log(`Initial admin user created: ${email}`);
        return { success: true };
    } catch (error) {
        logger.error('Error creating initial admin:', error);
        return { success: false, error };
    }
};
