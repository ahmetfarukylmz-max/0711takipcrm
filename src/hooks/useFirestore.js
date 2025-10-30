import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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
 * @returns {Object} Object with collection data and connection status
 */
export const useFirestoreCollections = (collectionNames) => {
    const [collections, setCollections] = useState({});
    const [connectionStatus, setConnectionStatus] = useState('Bağlanılıyor...');
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            const emptyCollections = {};
            collectionNames.forEach(name => {
                emptyCollections[name] = [];
            });
            setCollections(emptyCollections);
            setConnectionStatus('Bağlantı Bekleniyor');
            return;
        }

        const handleSnapshotError = (error) => {
            console.error('Veritabanı bağlantı hatası:', error);
            setConnectionStatus('Bağlantı Hatası');
        };

        const unsubscribers = collectionNames.map(collectionName => {
            const collectionPath = `users/${user.uid}/${collectionName}`;
            const collectionRef = collection(db, collectionPath);

            return onSnapshot(
                collectionRef,
                (snapshot) => {
                    setCollections(prev => ({
                        ...prev,
                        [collectionName]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    }));
                    setConnectionStatus('Bağlandı');
                },
                handleSnapshotError
            );
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user, collectionNames.join(',')]);

    return { collections, connectionStatus };
};
