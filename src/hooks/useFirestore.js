import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for real-time Firestore collection synchronization
 * @param {string} collectionName - Name of the Firestore collection
 * @returns {Array} Array of documents with their IDs
 */
export const useFirestoreCollection = (collectionName) => {
    const [data, setData] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('Bağlanılıyor...');
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setData([]);
            setConnectionStatus('Bağlantı Bekleniyor');
            return;
        }

        const handleSnapshotError = (error) => {
            console.error(`Veritabanı bağlantı hatası (${collectionName}):`, error);
            setConnectionStatus('Bağlantı Hatası');
        };

        const collectionPath = `users/${user.uid}/${collectionName}`;
        const collectionRef = collection(db, collectionPath);

        const unsubscribe = onSnapshot(
            collectionRef,
            (snapshot) => {
                setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setConnectionStatus('Bağlandı');
            },
            handleSnapshotError
        );

        return () => unsubscribe();
    }, [user, collectionName]);

    return { data, connectionStatus };
};

/**
 * Custom hook for managing multiple Firestore collections
 * @param {Array<string>} collectionNames - Array of collection names
 * @returns {Object} Object with collection data, connection status, and loading state
 */
export const useFirestoreCollections = (collectionNames) => {
    const [collections, setCollections] = useState({});
    const [connectionStatus, setConnectionStatus] = useState('Bağlanılıyor...');
    const [loading, setLoading] = useState(true);
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        if (!user) {
            const emptyCollections = {};
            collectionNames.forEach(name => {
                emptyCollections[name] = [];
            });
            setCollections(emptyCollections);
            setConnectionStatus('Bağlantı Bekleniyor');
            setLoading(false);
            return;
        }

        setLoading(true);

        const handleSnapshotError = (error) => {
            console.error('Veritabanı bağlantı hatası:', error);
            setConnectionStatus('Bağlantı Hatası');
        };

        // Admin mode: Subscribe to all users' data
        if (isAdmin()) {
            // First, get all users
            const setupAdminSubscriptions = async () => {
                try {
                    const usersSnapshot = await getDocs(collection(db, 'users'));
                    const allUserIds = usersSnapshot.docs.map(doc => doc.id);

                    const allUnsubscribers = [];

                    // For each collection type
                    collectionNames.forEach(collectionName => {
                        // Subscribe to data from ALL users
                        allUserIds.forEach(userId => {
                            const collectionPath = `users/${userId}/${collectionName}`;
                            const collectionRef = collection(db, collectionPath);

                            const unsubscribe = onSnapshot(
                                collectionRef,
                                (snapshot) => {
                                    const documents = snapshot.docs.map(doc => ({
                                        id: doc.id,
                                        ...doc.data(),
                                        _userId: userId // Track which user owns this data
                                    }));

                                    // Merge with existing data from other users
                                    setCollections(prev => {
                                        const existingDocs = prev[collectionName] || [];
                                        // Remove old docs from this specific user
                                        const otherUsersDocs = existingDocs.filter(d => d._userId !== userId);
                                        // Add new docs from this user
                                        return {
                                            ...prev,
                                            [collectionName]: [...otherUsersDocs, ...documents]
                                        };
                                    });

                                    setConnectionStatus('Bağlandı');
                                    setLoading(false);
                                },
                                handleSnapshotError
                            );

                            allUnsubscribers.push(unsubscribe);
                        });
                    });

                    return () => allUnsubscribers.forEach(unsub => unsub());
                } catch (error) {
                    console.error('Error setting up admin subscriptions:', error);
                    handleSnapshotError(error);
                }
            };

            const cleanupPromise = setupAdminSubscriptions();

            return () => {
                cleanupPromise.then(cleanup => cleanup && cleanup());
            };
        } else {
            // Normal user mode: Only subscribe to their own data
            const unsubscribers = collectionNames.map(collectionName => {
                const collectionPath = `users/${user.uid}/${collectionName}`;
                const collectionRef = collection(db, collectionPath);

                return onSnapshot(
                    collectionRef,
                    (snapshot) => {
                        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                        setCollections(prev => ({
                            ...prev,
                            [collectionName]: documents
                        }));
                        setConnectionStatus('Bağlandı');
                        setLoading(false);
                    },
                    handleSnapshotError
                );
            });

            return () => unsubscribers.forEach(unsub => unsub());
        }
    }, [user, isAdmin, JSON.stringify(collectionNames)]);

    return { collections, connectionStatus, loading };
};
