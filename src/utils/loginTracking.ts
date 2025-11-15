import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Get user's IP address from external API
 */
const getIpAddress = async (): Promise<string | undefined> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        return undefined;
    }
};

/**
 * Log user login/logout activity
 */
export const logUserActivity = async (
    userId: string,
    email: string,
    action: 'login' | 'logout'
): Promise<void> => {
    try {
        const ipAddress = await getIpAddress();
        const userAgent = navigator.userAgent;

        // Add log to loginLogs collection
        await addDoc(collection(db, 'loginLogs'), {
            userId,
            email,
            action,
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString()
        });

        // Update user's lastLogin if it's a login action
        if (action === 'login') {
            await updateDoc(doc(db, 'users', userId), {
                lastLogin: new Date().toISOString(),
                isActive: true // Ensure user is active
            });
        }
    } catch (error) {
        console.error('Error logging user activity:', error);
        // Don't throw error, just log it - tracking shouldn't break auth flow
    }
};
