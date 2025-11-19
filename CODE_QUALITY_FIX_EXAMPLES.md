# Code Quality Analysis - Specific Fix Examples

## 1. URGENT: Remove Hardcoded Firebase Keys

### Current (WRONG) - `/src/services/firebase.js`
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC4sX0QJpGgHqxQcTQYP3Jy4eMw9el4L0k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "takipcrm-c1d3f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "takipcrm-c1d3f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "takipcrm-c1d3f.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "342863238377",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:342863238377:web:bc010cc0233bf863c8cc78"
};
```

### Fixed Version
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'apiKey', 'authDomain', 'projectId', 
    'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  for (const key of requiredKeys) {
    if (!firebaseConfig[key]) {
      throw new Error(
        `Missing Firebase configuration: ${key}. ` +
        `Please set VITE_FIREBASE_${key.toUpperCase()} environment variable.`
      );
    }
  }
};

validateFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

---

## 2. Fix Firestore Security Rules

### Current (TOO PERMISSIVE) - `firestore.rules:55-58`
```
match /{document=**} {
  allow read, write: if isAdmin();
}
```

### Fixed Version
```
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAdmin() {
      return request.auth != null &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();

      // User-based subcollections
      match /{collection}/{documentId} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
    }

    // Activity logs (admin only)
    match /activity_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }

    // Deny everything else by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Extract Duplicate Delete Handlers

### Current (DUPLICATED) - `src/App.jsx:443-597`
```javascript
// Six nearly identical functions...
const handleCustomerDelete = (id) => {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  
  const relatedOrders = orders.filter(o => o.customerId === id && !o.isDeleted).length;
  // ... count logic
  
  showSmartConfirm({
    itemName: customer.name,
    itemType: 'müşteri',
    relatedCount: totalRelated,
    onConfirm: () => {
      deleteDocument(user.uid, 'customers', id).then(() => {
        logUserActivity('DELETE_CUSTOMER', {...});
        showUndoableDelete("...", () => {
          undoDelete(user.uid, 'customers', id);
        });
      });
    }
  });
};

const handleProductDelete = (id) => {
  // Almost identical code...
};

// ... 4 more identical functions
```

### Fixed Version - Create Factory
```javascript
// Create a factory function for delete handlers
const createDeleteHandler = ({
  collectionName,
  getItem,
  getRelatedInfo,
  activityAction,
  undoActivityAction,
}) => {
  return (id) => {
    const item = getItem(id);
    if (!item) return;

    const relatedInfo = getRelatedInfo(id);

    showSmartConfirm({
      itemName: item.name || item.customerName,
      itemType: collectionName,
      relatedCount: relatedInfo.count || 0,
      relatedType: relatedInfo.type || '',
      onConfirm: () => {
        deleteDocument(user.uid, collectionName, id).then(() => {
          logUserActivity(activityAction, {
            message: `${collectionName} silindi: ${item.name}`,
          });
          showUndoableDelete(
            `"${item.name}" ${collectionName}ı silindi`,
            () => {
              undoDelete(user.uid, collectionName, id);
              logUserActivity(undoActivityAction, {
                message: `${collectionName} geri alındı: ${item.name}`,
              });
            }
          );
        });
      },
    });
  };
};

// Usage
const handleCustomerDelete = createDeleteHandler({
  collectionName: 'Müşteri',
  getItem: (id) => customers.find(c => c.id === id),
  getRelatedInfo: (id) => {
    const orders = filterRelatedOrders(id);
    const quotes = filterRelatedQuotes(id);
    const meetings = filterRelatedMeetings(id);
    return {
      count: orders.length + quotes.length + meetings.length,
      type: 'sipariş/teklif/görüşme',
    };
  },
  activityAction: 'DELETE_CUSTOMER',
  undoActivityAction: 'UNDO_DELETE_CUSTOMER',
});

const handleProductDelete = createDeleteHandler({
  collectionName: 'Ürün',
  getItem: (id) => products.find(p => p.id === id),
  getRelatedInfo: (id) => {
    const used = orders.some(o => 
      !o.isDeleted && o.items?.some(item => item.productId === id)
    );
    return {
      count: used ? 1 : 0,
      type: 'siparişte kullanılıyor',
    };
  },
  activityAction: 'DELETE_PRODUCT',
  undoActivityAction: 'UNDO_DELETE_PRODUCT',
});

// ... repeat for other handlers
```

---

## 4. Fix Type Safety Issues

### Current (USING ANY) - `src/components/forms/MeetingForm.tsx:70`
```typescript
const [formData, setFormData] = useState<MeetingFormData>({
  // ...
  meetingType: (meeting as any)?.meetingType || 'İlk Temas',
  // ...
});
```

### Fixed Version
```typescript
// Add meetingType to Meeting interface or create extended type
interface MeetingFormData {
  customerId: string;
  date: string;
  notes: string;
  outcome: string;
  status: string;
  meetingType: 'İlk Temas' | 'Takip' | 'Müzakere' | 'Teklif';
  next_action_date: string;
  next_action_notes: string;
}

// Or extend Meeting type
type MeetingWithType = Meeting & {
  meetingType?: 'İlk Temas' | 'Takip' | 'Müzakere' | 'Teklif';
};

const [formData, setFormData] = useState<MeetingFormData>({
  customerId: meeting?.customerId || customers[0]?.id || '',
  date: meeting?.meeting_date || new Date().toISOString().slice(0, 10),
  notes: meeting?.notes || '',
  outcome: meeting?.outcome || 'İlgileniyor',
  status: meeting?.status || 'Planlandı',
  meetingType: meeting?.meetingType || 'İlk Temas',
  next_action_date: meeting?.next_action_date || '',
  next_action_notes: meeting?.next_action_notes || ''
});
```

### Enable Strict TypeScript - `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* STRICT LINTING - Changed from false to true */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    /* Allow JS files */
    "allowJs": true,
    "checkJs": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 5. Add Accessibility Attributes

### Current (MISSING LABELS) - Various components
```jsx
<button onClick={handleDelete}>
  <TrashIcon />
</button>

<input
  type="text"
  placeholder="Search customers..."
  onChange={handleSearch}
/>
```

### Fixed Version
```jsx
<button 
  onClick={handleDelete}
  aria-label="Müşteri sil"
  title="Müşteri sil"
  className="p-2 hover:bg-red-50 rounded"
>
  <TrashIcon aria-hidden="true" />
</button>

<div className="search-container">
  <label htmlFor="customer-search" className="sr-only">
    Müşteri Ara
  </label>
  <input
    id="customer-search"
    type="text"
    placeholder="Müşteri adı yazın..."
    onChange={handleSearch}
    aria-label="Müşteri arama kutusu"
    className="px-3 py-2 border rounded"
  />
</div>

{/* For icon-only buttons */}
<button 
  onClick={handleEdit}
  aria-label="Müşteri bilgilerini düzenle"
  className="p-2 hover:bg-blue-50 rounded"
>
  <EditIcon aria-hidden="true" />
</button>
```

---

## 6. Fix Missing Memoization

### Current (RECALCULATED EVERY RENDER)
```typescript
const Orders = memo<OrdersProps>(({ orders, customers, ... }) => {
  // This recalculates on every render
  const openOrders = orders.filter(o => 
    !o.isDeleted && ['Bekliyor', 'Hazırlanıyor'].includes(o.status)
  );
  
  // Event handler recreated every render
  const handleOpenModal = (order: Order | null = null) => {
    setCurrentOrder(order);
    setIsModalOpen(true);
  };
  
  return (
    // ...
    <Orders {...props} onOpenModal={handleOpenModal} />
  );
});
```

### Fixed Version
```typescript
const Orders = memo<OrdersProps>(({ orders, customers, ... }) => {
  // Memoize filtered results
  const openOrders = useMemo(() => 
    orders.filter(o => 
      !o.isDeleted && ['Bekliyor', 'Hazırlanıyor'].includes(o.status)
    ),
    [orders]
  );
  
  // Memoize event handler to prevent child re-renders
  const handleOpenModal = useCallback((order: Order | null = null) => {
    setCurrentOrder(order);
    setIsModalOpen(true);
  }, []);
  
  // Expensive computations
  const totalRevenue = useMemo(() =>
    openOrders.reduce((sum, o) => sum + o.total_amount, 0),
    [openOrders]
  );
  
  const averageOrderValue = useMemo(() =>
    openOrders.length > 0 ? totalRevenue / openOrders.length : 0,
    [openOrders, totalRevenue]
  );
  
  return (
    // ...
    <OrdersList 
      orders={openOrders}
      onOpenModal={handleOpenModal}
      totalRevenue={totalRevenue}
      averageOrderValue={averageOrderValue}
    />
  );
});
```

---

## 7. Standardize Error Handling

### Current (INCONSISTENT)
```javascript
// Approach 1: Silent fail
catch (error) {
  console.error('Delete error:', error);
  return false;
}

// Approach 2: Rethrow
catch (error) {
  if (error.code === 'not-found') {
    console.warn(...);
  }
  throw error;
}

// Approach 3: Generic log
catch (error) {
  console.error("Error logging activity:", error);
}
```

### Fixed Version
```typescript
// Define custom error class
class FirestoreError extends Error {
  constructor(
    public code: string,
    public operation: string,
    message: string,
    public recoverable: boolean = false,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

// Create error handler
export const handleFirestoreError = (
  error: any,
  operation: string,
  context?: Record<string, any>
) => {
  if (error instanceof FirestoreError) {
    logger.error('Firestore operation failed', {
      code: error.code,
      operation: error.operation,
      message: error.message,
      recoverable: error.recoverable,
      context,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: false,
      error: error.message,
      recoverable: error.recoverable,
    };
  }
  
  logger.error('Unexpected error', {
    operation,
    error: error instanceof Error ? error.message : String(error),
    context,
    timestamp: new Date().toISOString(),
  });
  
  return {
    success: false,
    error: 'Beklenmeyen bir hata oluştu',
    recoverable: false,
  };
};

// Usage in services
export const deleteDocument = async (
  userId: string,
  collectionName: string,
  docId: string
) => {
  if (!userId || !docId) {
    return handleFirestoreError(
      new Error('Missing userId or docId'),
      `delete ${collectionName}`,
      { userId, collectionName, docId }
    );
  }

  try {
    const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    if (error.code === 'not-found') {
      return handleFirestoreError(
        new FirestoreError(
          'not-found',
          `delete ${collectionName}`,
          `Document not found: ${docId}`,
          false,
          { collectionName, docId }
        ),
        `delete ${collectionName}`
      );
    }
    
    return handleFirestoreError(error, `delete ${collectionName}`);
  }
};
```

---

## 8. Create Modal State Hook

### Current (DUPLICATED) - Multiple page components
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
const [isQuoteViewModalOpen, setIsQuoteViewModalOpen] = useState(false);
const [isOrderViewModalOpen, setIsOrderViewModalOpen] = useState(false);
const [isShipmentViewModalOpen, setIsShipmentViewModalOpen] = useState(false);
const [isImportModalOpen, setIsImportModalOpen] = useState(false);
// ... 4+ more modal states
```

### Fixed Version - Create Custom Hook
```typescript
// hooks/useModalState.ts
import { useState, useCallback } from 'react';

interface ModalState {
  [key: string]: boolean;
}

export const useModalState = (initialModals: string[] = []) => {
  const [modals, setModals] = useState<ModalState>(
    initialModals.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const openModal = useCallback((key: string) => {
    setModals(prev => ({ ...prev, [key]: true }));
  }, []);

  const closeModal = useCallback((key: string) => {
    setModals(prev => ({ ...prev, [key]: false }));
  }, []);

  const toggleModal = useCallback((key: string) => {
    setModals(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(Object.keys(modals).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
  }, [modals]);

  return { modals, openModal, closeModal, toggleModal, closeAllModals };
};
```

### Usage in Components
```typescript
import { useModalState } from '../../hooks/useModalState';

const Customers = memo<CustomersProps>(({ ... }) => {
  const { modals, openModal, closeModal } = useModalState([
    'form',
    'detail',
    'quoteView',
    'orderView',
    'shipmentView',
    'import',
  ]);

  return (
    <>
      {/* Instead of isModalOpen */}
      <Modal show={modals.form} onClose={() => closeModal('form')}>
        <CustomerForm {...props} />
      </Modal>

      <Modal show={modals.detail} onClose={() => closeModal('detail')}>
        <CustomerDetail {...props} />
      </Modal>

      {/* Trigger modals */}
      <button onClick={() => openModal('form')}>Add Customer</button>
      <button onClick={() => openModal('detail')}>View Details</button>
    </>
  );
});
```

---

## 9. Remove Console Logs

### Current - `src/App.jsx:389, 408, 410`
```javascript
console.log('💰 Saving payment:', data);
console.log('💾 Calling saveDocument for payments...');
console.log('✅ Payment saved successfully');
```

### Fixed Version
Just remove them. Use proper logging in production:

**For Development:** Use browser DevTools  
**For Production:** Use error reporting service (Sentry, LogRocket, etc.)

```typescript
// Optional: Create logger utility
export const logger = {
  dev: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(message, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(message, error);
    // Send to error tracking service
    reportErrorToService(message, error);
  }
};

// Usage
logger.dev('💰 Saving payment:', data); // Only logs in dev mode
```

### Update vite.config.js
```javascript
terserOptions: {
  compress: {
    drop_console: process.env.NODE_ENV === 'production', // Remove in prod
    drop_debugger: true,
  },
  mangle: {
    keep_classnames: true,
    keep_fnames: true
  }
}
```

