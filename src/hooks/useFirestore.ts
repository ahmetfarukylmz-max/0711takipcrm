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
  const updateCollection = useStore((state) => state.updateCollection);
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
      setDataLoading(false);
      setConnectionStatusStore('Bağlantı Bekleniyor');
      return;
    }

    setLoading(true);
    setDataLoading(true);

    const handleSnapshotError = (error: FirestoreError) => {
      console.error('Veritabanı bağlantı hatası:', error);
      setConnectionStatus('Bağlantı Hatası');
      setConnectionStatusStore('Bağlantı Hatası');
      setLoading(false);
      setDataLoading(false);
    };

    const isAdminResult = isAdmin && isAdmin();

    if (isAdminResult) {
      const setupAdminSubscriptions = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const allUserIds = usersSnapshot.docs.map((doc) => doc.id);

          const allUnsubscribers: Unsubscribe[] = [];
          const collectionsData: Record<string, any[]> = {};

          let completedCollections = 0;
          const totalCollections = collectionNames.length * allUserIds.length;

          collectionNames.forEach((collectionName) => {
            collectionsData[collectionName] = [];

            allUserIds.forEach((userId) => {
              const collectionPath = `users/${userId}/${collectionName}`;
              const collectionRef = collection(db, collectionPath);

              const unsubscribe = onSnapshot(
                collectionRef,
                (snapshot) => {
                  const documents = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    _userId: userId,
                  }));

                  // Admin mode still needs complex merging, but we use updateCollection for now
                  // Note: This is still not fully optimal for admin but fixes the immediate sync issue
                  // We are essentially "appending" or "refreshing" the whole list for that collection
                  // A better admin strategy is needed later.

                  // For now, let's rely on the fact that we need to merge EVERYTHING for that collection across users
                  // This part is tricky with simple updateCollection.
                  // We will stick to the original logic for Admin but use setCollections properly or updateCollection carefully.
                  // Since Admin logic was complex, let's simplify:
                  // We will just console log for Admin for now and focus on fixing the User mode which is 99% of use case.

                  collectionsData[collectionName] = collectionsData[collectionName]
                    .filter((d: any) => d._userId !== userId)
                    .concat(documents);

                  setCollections((prev: Record<string, any[]>) => {
                    // Re-merge logic for admin
                    // This part was working "okay" before, let's keep it mostly as is but with logs
                    return {
                      ...prev,
                      [collectionName]: collectionsData[collectionName], // simplified
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

          setLoading(false);
          setDataLoading(false);

          return () => allUnsubscribers.forEach((unsub) => unsub());
        } catch (error: any) {
          console.error('Error setting up admin subscriptions:', error);
          handleSnapshotError(error);
          return () => {};
        }
      };

      const cleanupPromise = setupAdminSubscriptions();

      return () => {
        cleanupPromise.then((cleanup) => cleanup && cleanup());
      };
    } else {
      // Normal user mode
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

            // FIX: Use updateCollection instead of setCollections
            updateCollection(collectionName, documents);

            setConnectionStatus('Bağlandı');
            setConnectionStatusStore('Bağlandı');
            setLoading(false);
            setDataLoading(false);
          },
          handleSnapshotError
        );
      });

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
    updateCollection,
    setDataLoading,
    setConnectionStatusStore,
  ]);

  return { connectionStatus, loading };
};
