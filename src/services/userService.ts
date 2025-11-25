import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';

type UserRole = 'admin' | 'user';

interface ServiceResponse {
  success: boolean;
  error?: unknown;
}

/**
 * Kullanıcıyı admin yapma
 * @param userId - Kullanıcının UID'si
 */
export const makeUserAdmin = async (userId: string): Promise<ServiceResponse> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date().toISOString(),
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
 * @param userId - Kullanıcının UID'si
 */
export const removeAdminRole = async (userId: string): Promise<ServiceResponse> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'user',
      updatedAt: new Date().toISOString(),
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
 * @param userId - Kullanıcının UID'si
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      return role === 'admin' ? 'admin' : 'user';
    }
    return 'user';
  } catch (error) {
    logger.error('Error getting user role:', error);
    return 'user';
  }
};

/**
 * İlk admin kullanıcıyı oluşturma (manuel)
 * @param userId - Kullanıcının UID'si
 * @param email - Kullanıcının email'i
 */
export const createInitialAdmin = async (
  userId: string,
  email: string
): Promise<ServiceResponse> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email: email,
      role: 'admin',
      createdAt: new Date().toISOString(),
      isInitialAdmin: true,
    });
    logger.log(`Initial admin user created: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error creating initial admin:', error);
    return { success: false, error };
  }
};
