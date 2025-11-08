import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Firestore'dan kullanıcı bilgilerini al
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserRole(userData.role || 'user');
                    } else {
                        // Kullanıcı ilk kez giriş yapıyorsa, varsayılan role ile oluştur
                        const defaultRole = 'user';
                        await setDoc(doc(db, 'users', currentUser.uid), {
                            email: currentUser.email,
                            role: defaultRole,
                            createdAt: new Date().toISOString(),
                            displayName: currentUser.displayName || ''
                        });
                        setUserRole(defaultRole);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setUserRole('user');
                }
            } else {
                setUserRole(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isAdmin = () => {
        return userRole === 'admin';
    };

    const value = {
        user,
        userRole,
        loading,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
