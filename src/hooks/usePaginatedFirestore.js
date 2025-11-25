import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, onSnapshot, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * usePaginatedFirestore Hook
 *
 * Provides paginated data loading from Firestore with real-time updates.
 * Useful for large collections to improve initial load time and performance.
 *
 * @param {string} collectionName - Firestore collection name
 * @param {number} pageSize - Number of items per page (default: 50)
 * @param {Object} options - Additional options
 * @param {string} options.orderByField - Field to order by (default: 'createdAt')
 * @param {string} options.orderDirection - 'asc' or 'desc' (default: 'desc')
 * @param {Array} options.filters - Array of filter objects [{field, operator, value}]
 *
 * @returns {Object} { data, loading, hasMore, loadMore, reset }
 *
 * @example
 * const { data, loading, hasMore, loadMore } = usePaginatedFirestore('customers', 50);
 *
 * // In component:
 * <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore}>
 *   {data.map(item => <Item key={item.id} {...item} />)}
 * </InfiniteScroll>
 */
export function usePaginatedFirestore(
  collectionName,
  pageSize = 50,
  options = {}
) {
  const {
    orderByField = 'createdAt',
    orderDirection = 'desc',
    filters = [],
    // eslint-disable-next-line no-unused-vars
    enableRealtime = true,
  } = options;

  const [data, setData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();

  // Build base query
  const buildQuery = useCallback((lastDocument = null) => {
    if (!user) return null;

    const collectionPath = `users/${user.uid}/${collectionName}`;
    const collectionRef = collection(db, collectionPath);

    let q = query(collectionRef);

    // Apply filters
    filters.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    // Add common filter to exclude deleted items
    q = query(q, where('isDeleted', '==', false));

    // Order by
    q = query(q, orderBy(orderByField, orderDirection));

    // Pagination
    q = query(q, limit(pageSize));

    if (lastDocument) {
      q = query(q, startAfter(lastDocument));
    }

    return q;
  }, [user, collectionName, orderByField, orderDirection, pageSize, JSON.stringify(filters)]);

  // Load initial page
  useEffect(() => {
    if (!user) {
      setData([]);
      setInitialLoading(false);
      return;
    }

    const q = buildQuery();
    if (!q) return;

    setInitialLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _doc: doc, // Store document reference for pagination
        }));

        setData(documents);
        setHasMore(snapshot.docs.length === pageSize);
        setInitialLoading(false);

        // Store last document for pagination
        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
      },
      (error) => {
        console.error(`Error loading ${collectionName}:`, error);
        setInitialLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, buildQuery, collectionName, pageSize]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;

    setLoading(true);

    const q = buildQuery(lastDoc);
    if (!q) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newDocuments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _doc: doc,
        }));

        if (newDocuments.length > 0) {
          setData((prevData) => [...prevData, ...newDocuments]);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }

        setHasMore(snapshot.docs.length === pageSize);
        setLoading(false);
      },
      (error) => {
        console.error(`Error loading more ${collectionName}:`, error);
        setLoading(false);
      }
    );

    // For loadMore, we don't need continuous subscription
    // Unsubscribe after first load
    setTimeout(() => unsubscribe(), 1000);
  }, [hasMore, loading, lastDoc, buildQuery, collectionName, pageSize]);

  // Reset pagination
  const reset = useCallback(() => {
    setData([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(false);
  }, []);

  return {
    data,
    loading: initialLoading || loading,
    hasMore,
    loadMore,
    reset,
  };
}

export default usePaginatedFirestore;
