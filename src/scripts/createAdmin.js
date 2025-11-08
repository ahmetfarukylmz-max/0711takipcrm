/**
 * Admin Kullanıcı Oluşturma Script'i
 *
 * Bu script'i tarayıcı console'dan çalıştırarak mevcut kullanıcıyı admin yapabilirsiniz.
 *
 * KULLANIM:
 * 1. Uygulamaya giriş yapın (admin yapmak istediğiniz hesapla)
 * 2. Tarayıcıda F12 tuşuna basın (Developer Tools)
 * 3. Console tab'ına gidin
 * 4. Bu dosyanın içeriğini kopyalayıp yapıştırın
 * 5. createAdmin() fonksiyonunu çağırın
 */

import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Mevcut kullanıcıyı admin yapma
 */
export const createAdmin = async () => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error('❌ Hata: Önce giriş yapmalısınız!');
            return { success: false, error: 'No user logged in' };
        }

        console.log('👤 Mevcut kullanıcı:', currentUser.email);
        console.log('🔑 User UID:', currentUser.uid);

        // Kullanıcı dokümanını kontrol et
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('📄 Mevcut role:', userData.role);

            if (userData.role === 'admin') {
                console.log('✅ Bu kullanıcı zaten admin!');
                return { success: true, message: 'Already admin' };
            }
        }

        // Kullanıcıyı admin yap
        await setDoc(userRef, {
            email: currentUser.email,
            role: 'admin',
            createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            displayName: currentUser.displayName || '',
            isAdmin: true
        }, { merge: true });

        console.log('🎉 Başarılı! Kullanıcı admin yapıldı.');
        console.log('🔄 Sayfayı yenileyip tekrar giriş yapın.');

        return { success: true, userId: currentUser.uid, email: currentUser.email };
    } catch (error) {
        console.error('❌ Admin oluşturma hatası:', error);
        return { success: false, error };
    }
};

/**
 * Belirli bir UID ile admin oluşturma
 * @param {string} userId - Kullanıcının UID'si
 * @param {string} email - Kullanıcının email'i
 */
export const createAdminByUID = async (userId, email) => {
    try {
        if (!userId || !email) {
            console.error('❌ Hata: userId ve email gerekli!');
            return { success: false, error: 'Missing parameters' };
        }

        const userRef = doc(db, 'users', userId);

        await setDoc(userRef, {
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString(),
            isInitialAdmin: true
        });

        console.log('🎉 Başarılı! Admin kullanıcı oluşturuldu.');
        console.log('📧 Email:', email);
        console.log('🔑 UID:', userId);

        return { success: true, userId, email };
    } catch (error) {
        console.error('❌ Admin oluşturma hatası:', error);
        return { success: false, error };
    }
};

/**
 * Tüm kullanıcıları listele (sadece admin görebilir)
 */
export const listAllUsers = async () => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error('❌ Hata: Önce giriş yapmalısınız!');
            return { success: false, error: 'No user logged in' };
        }

        // Import collection and getDocs dynamically to avoid issues
        const { collection, getDocs } = await import('firebase/firestore');

        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        console.log('👥 Toplam kullanıcı sayısı:', snapshot.size);
        console.log('═══════════════════════════════════════════════');

        const users = [];
        snapshot.forEach((doc) => {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                email: userData.email,
                role: userData.role,
                createdAt: userData.createdAt
            });

            console.log(`
📧 Email: ${userData.email}
🔑 UID: ${doc.id}
👤 Role: ${userData.role || 'user'}
📅 Oluşturulma: ${userData.createdAt}
───────────────────────────────────────────────`);
        });

        return { success: true, users };
    } catch (error) {
        console.error('❌ Kullanıcıları listeleme hatası:', error);
        console.log('⚠️  Not: Sadece admin kullanıcılar bu komutu çalıştırabilir.');
        return { success: false, error };
    }
};

/**
 * Kullanıcı rolünü kontrol etme
 */
export const checkMyRole = async () => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error('❌ Hata: Önce giriş yapmalısınız!');
            return { success: false, error: 'No user logged in' };
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('═══════════════════════════════════════════════');
            console.log('👤 Kullanıcı Bilgileri:');
            console.log('📧 Email:', currentUser.email);
            console.log('🔑 UID:', currentUser.uid);
            console.log('👥 Role:', userData.role || 'user');
            console.log('📅 Hesap oluşturma:', userData.createdAt);
            console.log('═══════════════════════════════════════════════');

            return { success: true, role: userData.role };
        } else {
            console.log('⚠️  Kullanıcı dokümanı bulunamadı. İlk giriş mi yapıyorsunuz?');
            return { success: false, error: 'User document not found' };
        }
    } catch (error) {
        console.error('❌ Role kontrol hatası:', error);
        return { success: false, error };
    }
};

// Window'a export et - tarayıcı console'dan kullanılabilir olsun
if (typeof window !== 'undefined') {
    window.createAdmin = createAdmin;
    window.createAdminByUID = createAdminByUID;
    window.listAllUsers = listAllUsers;
    window.checkMyRole = checkMyRole;
}

console.log(`
╔═══════════════════════════════════════════════════════════╗
║          🔐 Admin Yönetim Script'i Yüklendi              ║
╚═══════════════════════════════════════════════════════════╝

📌 Kullanılabilir Komutlar:

1️⃣  createAdmin()
   → Mevcut kullanıcıyı admin yapar

2️⃣  createAdminByUID('USER_UID', 'email@example.com')
   → Belirli bir UID ile admin oluşturur

3️⃣  listAllUsers()
   → Tüm kullanıcıları listeler (sadece admin)

4️⃣  checkMyRole()
   → Kendi role bilgisini gösterir

═══════════════════════════════════════════════════════════

🚀 Başlamak için createAdmin() komutunu çalıştırın!
`);
