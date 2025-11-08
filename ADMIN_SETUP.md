# Admin Sistemi Kurulum Rehberi

## 🎯 Genel Bakış

Projenizde artık Firestore tabanlı bir role sistemi var. Her kullanıcı `admin` veya `user` rolüne sahip olabilir.

## 📋 Sistem Nasıl Çalışıyor

1. **İlk Giriş**: Kullanıcı ilk kez giriş yaptığında otomatik olarak `users` koleksiyonunda oluşturulur
2. **Varsayılan Role**: Yeni kullanıcılar otomatik olarak `user` rolü alır
3. **Admin Kontrolü**: `useAuth()` hook'u ile admin kontrolü yapılabilir

## 🔧 İlk Admin Kullanıcıyı Oluşturma

### Yöntem 1: Otomatik Script ile (EN KOLAY - ÖNERİLEN) 🚀

1. Uygulamaya **giriş yapın** (admin yapmak istediğiniz hesapla)
2. Tarayıcıda **F12** tuşuna basın (Developer Tools)
3. **Console** tab'ına gidin
4. Şu komutu yazın:

```javascript
createAdmin()
```

5. ✅ Başarılı mesajı gördükten sonra **sayfayı yenileyin**
6. Artık admin olarak giriş yaptınız!

**Diğer Yararlı Komutlar:**
```javascript
// Kendi rolünüzü kontrol etme
checkMyRole()

// Belirli bir UID ile admin oluşturma
createAdminByUID('USER_UID_BURAYA', 'email@example.com')

// Tüm kullanıcıları listeleme (sadece admin)
listAllUsers()
```

### Yöntem 2: Firebase Console'dan (Manuel)

1. **Firebase Console'a** gidin: https://console.firebase.google.com/
2. **Projenizi** seçin: `takipcrm-c1d3f`
3. **Firestore Database** > **Data** sekmesine gidin
4. **users** koleksiyonunu bulun
5. Admin yapmak istediğiniz kullanıcının **UID**'sini bulun
6. O kullanıcının document'ini açın
7. **role** field'ını bulun ve `admin` olarak değiştirin
8. **Save** edin
9. Sayfayı yenileyin

### Yöntem 3: Kod ile (İlk Kurulum)

`src/services/userService.js` dosyasını kullanarak:

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
