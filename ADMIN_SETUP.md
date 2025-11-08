# Admin Sistemi Kurulum Rehberi

## 🎯 Genel Bakış

Projenizde artık Firestore tabanlı bir role sistemi var. Her kullanıcı `admin` veya `user` rolüne sahip olabilir.

## 📋 Sistem Nasıl Çalışıyor

1. **İlk Giriş**: Kullanıcı ilk kez giriş yaptığında otomatik olarak `users` koleksiyonunda oluşturulur
2. **Varsayılan Role**: Yeni kullanıcılar otomatik olarak `user` rolü alır
3. **Admin Kontrolü**: `useAuth()` hook'u ile admin kontrolü yapılabilir

## 🔧 İlk Admin Kullanıcıyı Oluşturma

### Firebase Console'dan (ÖNERİLEN - GÜVENLİ) 🔐

1. **Admin yapmak istediğiniz hesapla uygulamaya giriş yapın**
2. **Kullanıcı UID'sini not alın:**
   - Tarayıcıda F12 → Console
   - Bu komutu çalıştırın: `firebase.auth().currentUser.uid`
   - UID'yi kopyalayın

3. **Firebase Console'a gidin:** https://console.firebase.google.com/
4. **Projenizi seçin:** `takipcrm-c1d3f`
5. **Firestore Database** → **Data** sekmesine gidin
6. **users** koleksiyonunu bulun
7. Kopyaladığınız **UID** ile kullanıcı document'ini açın
8. **role** field'ını `admin` olarak değiştirin
9. **Save** edin
10. Uygulamada sayfayı yenileyin

> **⚠️ Güvenlik Notu:** Admin oluşturma işlemi sadece Firebase Console üzerinden yapılmalıdır. Tarayıcı console üzerinden yapılan işlemler güvenlik açığı oluşturur.

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

✅ **Firestore güvenlik kuralları zaten yapılandırıldı!** `firestore.rules` dosyası aşağıdaki özelliklere sahip:

**Admin Yetkileri:**
- ✅ Admin kullanıcılar **TÜM koleksiyonları** okuyabilir ve yazabilir
- ✅ Admin kullanıcılar **kullanıcı rollerini** güncelleyebilir
- ✅ Admin kullanıcılar **tüm kullanıcıları** listeleyebilir

**Normal Kullanıcı Yetkileri:**
- ✅ Kendi kullanıcı bilgilerini okuyabilir
- ✅ Tüm veri koleksiyonlarını (customers, products, orders vb.) okuyabilir
- ❌ Veri yazamaz (sadece admin)
- ❌ Diğer kullanıcıların bilgilerini göremez

**Güvenlik Kuralları Özeti:**

```javascript
// Admin kontrolü
function isAdmin() {
  return request.auth != null &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Users koleksiyonu
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow create: if isOwner(userId);
  allow update, delete: if isAdmin();
}

// Diğer koleksiyonlar (customers, products, orders, vb.)
match /customers/{customerId} {
  allow read: if isAuthenticated();  // Herkes okuyabilir
  allow write: if isAdmin();          // Sadece admin yazabilir
}
```

**Firebase Console'da Kuralları Yükleme:**

1. Firebase Console → Firestore Database → Rules
2. Projedeki `firestore.rules` dosyasının içeriğini kopyalayın
3. Rules editörüne yapıştırın
4. **Yayınla** (Publish) butonuna tıklayın

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
