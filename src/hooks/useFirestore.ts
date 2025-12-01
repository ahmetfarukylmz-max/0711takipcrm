import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  getDocs,
  DocumentData,
  FirestoreError,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

// Define types for collection data
interface BaseDocument {
  id: string;
  [key: string]: any;
}

interface FirestoreCollectionResult<T> {
  data: T[];
  connectionStatus: string;
}

interface FirestoreCollectionsResult {
  collections: Record<string, any[]>;
  connectionStatus: string;
  loading: boolean;
}

/**
 * Custom hook for real-time Firestore collection synchronization
 * @param {string} collectionName - Name of the Firestore collection
 * @returns {FirestoreCollectionResult} Array of documents with their IDs
 */
export const useFirestoreCollection = <T = BaseDocument>(
  collectionName: string
): FirestoreCollectionResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Bağlanılıyor...');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData([]);
      setConnectionStatus('Bağlantı Bekleniyor');
      return;
    }

    const handleSnapshotError = (error: FirestoreError) => {
      console.error(`Veritabanı bağlantı hatası (${collectionName}):`, error);
      setConnectionStatus('Bağlantı Hatası');
    };

    const collectionPath = `users/${user.uid}/${collectionName}`;
    const collectionRef = collection(db, collectionPath);

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as unknown as T);
        setData(docs);
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
 * @param {string[]} collectionNames - Array of collection names
 * @returns {FirestoreCollectionsResult} Object with collection data, connection status, and loading state
 */
export const useFirestoreCollections = (collectionNames: string[]): FirestoreCollectionsResult => {
  const [collections, setCollections] = useState<Record<string, any[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<string>('Bağlanılıyor...');
  const [loading, setLoading] = useState<boolean>(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user) {
      const emptyCollections: Record<string, any[]> = {};
      collectionNames.forEach((name) => {
        emptyCollections[name] = [];
      });
      setCollections(emptyCollections);
      setConnectionStatus('Bağlantı Bekleniyor');
      setLoading(false);
      return;
    }

    setLoading(true);

    const handleSnapshotError = (error: FirestoreError) => {
      console.error('Veritabanı bağlantı hatası:', error);
      setConnectionStatus('Bağlantı Hatası');
    };

    // Admin mode: Subscribe to all users' data
    // Note: This logic creates NxM listeners (Users x Collections), which is not scalable.
    // TODO: Refactor this to use Collection Group Queries or a better admin pattern.
    if (isAdmin && isAdmin()) {
      // First, get all users
      const setupAdminSubscriptions = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const allUserIds = usersSnapshot.docs.map((doc) => doc.id);

          const allUnsubscribers: Unsubscribe[] = [];

          // For each collection type
          collectionNames.forEach((collectionName) => {
            // Subscribe to data from ALL users
            allUserIds.forEach((userId) => {
              const collectionPath = `users/${userId}/${collectionName}`;
              const collectionRef = collection(db, collectionPath);

              const unsubscribe = onSnapshot(
                collectionRef,
                (snapshot) => {
                  const documents = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    _userId: userId, // Track which user owns this data
                  }));

                  // Merge with existing data from other users
                  setCollections((prev) => {
                    const existingDocs = prev[collectionName] || [];
                    // Remove old docs from this specific user
                    const otherUsersDocs = existingDocs.filter((d: any) => d._userId !== userId);
                    // Add new docs from this user
                    return {
                      ...prev,
                      [collectionName]: [...otherUsersDocs, ...documents],
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

          return () => allUnsubscribers.forEach((unsub) => unsub());
        } catch (error: any) {
          console.error('Error setting up admin subscriptions:', error);
          handleSnapshotError(error);
          return () => {}; // Return empty cleanup function on error
        }
      };

      const cleanupPromise = setupAdminSubscriptions();

      return () => {
        cleanupPromise.then((cleanup) => cleanup && cleanup());
      };
    } else {
      // Normal user mode: Only subscribe to their own data
      const unsubscribers = collectionNames.map((collectionName) => {
        const collectionPath = `users/${user.uid}/${collectionName}`;
        const collectionRef = collection(db, collectionPath);

        return onSnapshot(
          collectionRef,
          (snapshot) => {
            const documents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            setCollections((prev) => ({
              ...prev,
              [collectionName]: documents,
            }));
            setConnectionStatus('Bağlandı');
            setLoading(false);
          },
          handleSnapshotError
        );
      });

      return () => unsubscribers.forEach((unsub) => unsub());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, JSON.stringify(collectionNames)]);

  return { collections, connectionStatus, loading };
};
