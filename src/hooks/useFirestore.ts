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
import useStore from '../store/useStore'; // Import Zustand store

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
 * Custom hook for managing multiple Firestore collections and updating Zustand store directly
 * @param {string[]} collectionNames - Array of collection names
 * @returns {FirestoreCollectionsResult} Object with connection status and loading state (data managed by Zustand)
 */
export const useFirestoreCollections = (collectionNames: string[]): FirestoreCollectionsResult => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Bağlanılıyor...');
  const [loading, setLoading] = useState<boolean>(true);
  const { user, isAdmin } = useAuth();
  const setCollections = useStore((state) => state.setCollections);
  const setDataLoading = useStore((state) => state.setDataLoading);
  const setConnectionStatusStore = useStore((state) => state.setConnectionStatus);

  useEffect(() => {
    if (!user) {
      const emptyCollections: Record<string, any[]> = {};
      collectionNames.forEach((name) => {
        emptyCollections[name] = [];
      });
      setCollections(emptyCollections);
      setConnectionStatus('Bağlantı Bekleniyor');
      setLoading(false);
      setDataLoading(false); // Update Zustand loading
      setConnectionStatusStore('Bağlantı Bekleniyor'); // Update Zustand connection status
      return;
    }

    setLoading(true);
    setDataLoading(true); // Update Zustand loading

    const handleSnapshotError = (error: FirestoreError) => {
      console.error('Veritabanı bağlantı hatası:', error);
      setConnectionStatus('Bağlantı Hatası');
      setConnectionStatusStore('Bağlantı Hatası'); // Update Zustand connection status
      setLoading(false);
      setDataLoading(false); // Update Zustand loading
    };

    const isAdminResult = isAdmin && isAdmin(); // Cache isAdmin result

    // Admin mode: Subscribe to all users' data
    // Note: This logic creates NxM listeners (Users x Collections), which is not scalable.
    // TODO: Refactor this to use Collection Group Queries or a better admin pattern.
    if (isAdminResult) {
      const setupAdminSubscriptions = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const allUserIds = usersSnapshot.docs.map((doc) => doc.id);

          const allUnsubscribers: Unsubscribe[] = [];
          const collectionsData: Record<string, any[]> = {};

          let completedCollections = 0;
          const totalCollections = collectionNames.length * allUserIds.length;

          // For each collection type
          collectionNames.forEach((collectionName) => {
            collectionsData[collectionName] = []; // Initialize for current collection

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

                  // Update the local collectionsData for this specific user and collection
                  // Then, update Zustand with the merged data
                  collectionsData[collectionName] = collectionsData[collectionName]
                    .filter((d: any) => d._userId !== userId)
                    .concat(documents);

                  // This approach is problematic as it triggers setCollections on every snapshot for every user/collection
                  // A better approach would be to collect all data and then setCollections once
                  // For now, let's keep the current logic but flag this as an area for improvement.

                  // Merge with existing data from other users
                  setCollections((prev: Record<string, any[]>) => {
                    const existingDocs = prev[collectionName] || [];
                    const otherUsersDocs = existingDocs.filter((d: any) => d._userId !== userId);
                    return {
                      ...prev,
                      [collectionName]: [...otherUsersDocs, ...documents],
                    };
                  });

                  completedCollections++;
                  if (completedCollections >= totalCollections) {
                    setLoading(false);
                    setDataLoading(false);
                  }
                  setConnectionStatus('Bağlandı');
                  setConnectionStatusStore('Bağlandı');
                },
                handleSnapshotError
              );

              allUnsubscribers.push(unsubscribe);
            });
          });

          // After setting up all subscriptions, update loading state
          // This part is tricky because initial data might not have arrived yet.
          // The loading state should ideally be managed by counting expected snapshots.
          // For now, setting it once after setup and then relying on snapshot completions.
          setLoading(false);
          setDataLoading(false);

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
            console.log(
              `🔥 Firestore'dan veri geldi [${collectionName}]:`,
              documents.length,
              'kayıt'
            );

            setCollections((prev: Record<string, any[]>) => ({
              ...prev,
              [collectionName]: documents,
            }));
            setConnectionStatus('Bağlandı');
            setConnectionStatusStore('Bağlandı');
            setLoading(false);
            setDataLoading(false);
          },
          handleSnapshotError
        );
      });

      // After setting up all subscriptions, update loading state.
      // Similar to admin mode, this might be premature if snapshots haven't fired yet.
      setLoading(false);
      setDataLoading(false);

      return () => unsubscribers.forEach((unsub) => unsub());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    isAdmin,
    JSON.stringify(collectionNames),
    setCollections,
    setDataLoading,
    setConnectionStatusStore,
  ]);

  return { connectionStatus, loading };
};
