# Admin Sistemi Kurulum Rehberi

## 🎯 Genel Bakış

Projenizde artık Firestore tabanlı bir role sistemi var. Her kullanıcı `admin` veya `user` rolüne sahip olabilir.

## 📋 Sistem Nasıl Çalışıyor

1. **İlk Giriş**: Kullanıcı ilk kez giriş yaptığında otomatik olarak `users` koleksiyonunda oluşturulur
2. **Varsayılan Role**: Yeni kullanıcılar otomatik olarak `user` rolü alır
3. **Admin Kontrolü**: `useAuth()` hook'u ile admin kontrolü yapılabilir

## 🔧 İlk Admin Kullanıcıyı Oluşturma

### Yöntem 1: Firebase Console'dan (Önerilen)

1. **Firebase Console'a** gidin: https://console.firebase.google.com/
2. **Projenizi** seçin: `takipcrm-c1d3f`
3. **Firestore Database** > **Data** sekmesine gidin
4. **users** koleksiyonunu bulun
5. Admin yapmak istediğiniz kullanıcının **UID**'sini bulun
6. O kullanıcının document'ini açın
7. **role** field'ını bulun ve `admin` olarak değiştirin
8. **Save** edin

### Yöntem 2: Tarayıcı Console'dan (Geliştirme)

1. Uygulamaya **giriş yapın** (admin yapmak istediğiniz hesapla)
2. Tarayıcıda **F12** tuşuna basın (Developer Tools)
3. **Console** tab'ına gidin
4. Şu kodu yapıştırın:

```javascript
import { makeUserAdmin } from './src/services/userService';

// Mevcut kullanıcıyı admin yap
const currentUserId = "BURAYA_USER_ID_YAZIN";
await makeUserAdmin(currentUserId);
```

### Yöntem 3: Kod ile (İlk Kurulum)

Sadece ilk admin için, `src/services/userService.js` dosyasını kullanabilirsiniz:

```javascript
import { createInitialAdmin } from './services/userService';

// İlk admin oluştur
await createInitialAdmin('USER_UID_BURAYA', 'admin@example.com');
```

## 📊 Firestore Yapısı

```
users/
  {userId}/
    email: "user@example.com"
    role: "admin" | "user"
    createdAt: "2024-01-01T00:00:00.000Z"
    displayName: "User Name"
```

## 💻 Kodda Kullanım

### Admin Kontrolü

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
    const { isAdmin, userRole } = useAuth();

    if (isAdmin()) {
        return <div>Admin Panel</div>;
    }

    return <div>Normal User View</div>;
}
```

### Role Bilgisini Gösterme

```javascript
const { userRole } = useAuth();

console.log(userRole); // "admin" veya "user"
```

## 🔐 Güvenlik

### Firestore Security Rules

`firestore.rules` dosyanıza admin kontrolü ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users koleksiyonu - sadece kendi bilgisini okuyabilir
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Diğer koleksiyonlar için admin kontrolü örneği
    match /customers/{customerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🛠️ Kullanıcı UID'sini Bulma

### Tarayıcı Console'da:

```javascript
// Mevcut kullanıcının UID'si
console.log(auth.currentUser.uid);
```

### React Component'te:

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
    const { user } = useAuth();

    console.log('User UID:', user?.uid);
    console.log('User Email:', user?.email);
}
```

## 📝 Örnek Senaryo

1. **İlk Kurulum**:
   - Uygulamaya ilk kez giriş yapın
   - Tarayıcı console'da UID'nizi alın: `console.log(auth.currentUser.uid)`
   - Firebase Console'da users koleksiyonunda kendinizi bulun
   - Role'ü `admin` olarak değiştirin

2. **Diğer Adminler**:
   - Admin olarak giriş yapın
   - Kullanıcı yönetim paneli oluşturun (ileride)
   - Başka kullanıcıları admin yapın

## ⚠️ Önemli Notlar

1. **İlk Admin**: Mutlaka en az bir admin oluşturun
2. **Güvenlik**: Admin yetkilerini dikkatli verin
3. **Yedekleme**: Admin listesini bir yere kaydedin
4. **Test**: Önce test kullanıcısı ile deneyin

## 🔄 Admin Yetkisini Kaldırma

```javascript
import { removeAdminRole } from './services/userService';

await removeAdminRole('USER_UID');
```

## 📞 Yardım

Sorun yaşarsanız:
1. Firebase Console'da `users` koleksiyonunu kontrol edin
2. Tarayıcı console'da hata mesajlarına bakın
3. `userRole` state'ini kontrol edin: `console.log(userRole)`
