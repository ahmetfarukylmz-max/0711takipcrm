import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Migrate existing data to add createdBy field
 * This assigns all records without createdBy to the specified admin user
 * @param {string} userId - The user ID (admin)
 * @param {string} userEmail - The user email
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Object>} Migration results
 */
export const migrateExistingData = async (userId, userEmail, onProgress) => {
    const collections = ['customers', 'products', 'teklifler', 'orders', 'gorusmeler', 'shipments', 'customTasks'];
    const results = {
        success: true,
        totalProcessed: 0,
        totalUpdated: 0,
        errors: [],
        details: {}
    };

    try {
        for (const collectionName of collections) {
            const collectionPath = `users/${userId}/${collectionName}`;
            const collectionRef = collection(db, collectionPath);

            onProgress && onProgress(`Processing ${collectionName}...`);

            try {
                const snapshot = await getDocs(collectionRef);
                const documents = snapshot.docs;
                let updated = 0;

                for (const docSnapshot of documents) {
                    const data = docSnapshot.data();

                    // Only update if createdBy doesn't exist
                    if (!data.createdBy) {
                        try {
                            await updateDoc(doc(db, collectionPath, docSnapshot.id), {
                                createdBy: userId,
                                createdByEmail: userEmail
                            });
                            updated++;
                        } catch (error) {
                            results.errors.push({
                                collection: collectionName,
                                docId: docSnapshot.id,
                                error: error.message
                            });
                        }
                    }
                }

                results.totalProcessed += documents.length;
                results.totalUpdated += updated;
                results.details[collectionName] = {
                    total: documents.length,
                    updated
                };

                onProgress && onProgress(`${collectionName}: ${updated}/${documents.length} updated`);
            } catch (error) {
                console.error(`Error processing ${collectionName}:`, error);
                results.errors.push({
                    collection: collectionName,
                    error: error.message
                });
            }
        }

        if (results.errors.length > 0) {
            results.success = false;
        }

        return results;
    } catch (error) {
        console.error('Migration error:', error);
        return {
            success: false,
            totalProcessed: 0,
            totalUpdated: 0,
            errors: [{ general: error.message }],
            details: {}
        };
    }
};
