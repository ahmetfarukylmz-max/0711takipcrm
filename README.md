# 🚀 Takip CRM

Modern, hızlı ve kullanıcı dostu bir **Müşteri İlişkileri Yönetim (CRM)** sistemi. React 18, Firebase ve Tailwind CSS ile geliştirilmiştir.

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4.0-orange.svg)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-purple.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

> 📖 **[Detaylı Kullanıcı Rehberi için tıklayın →](USER_GUIDE.md)**
> Sistemi nasıl kullanacağınızı adım adım öğrenmek için kapsamlı rehberimizi inceleyin.

## ✨ Özellikler

### 📊 Temel Modüller
- **Müşteri Yönetimi** - Müşteri bilgilerini kaydedin, düzenleyin ve takip edin
- **Ürün Kataloğu** - Ürün listesi, fiyatlandırma ve stok yönetimi
- **Sipariş Takibi** - Sipariş oluşturma, durum takibi ve yönetimi
- **Teklif Hazırlama** - Profesyonel teklifler oluşturun ve siparişe dönüştürün
- **Görüşme Kaydı** - Müşteri görüşmelerini ve sonuçlarını takip edin
- **Kargo Yönetimi** - Gönderim ve teslimat takibi
- **Raporlama** - Detaylı satış raporları ve istatistikler

### 🎨 Kullanıcı Deneyimi
- ✅ **Responsive Tasarım** - Mobil, tablet ve masaüstü uyumlu
- ✅ **Dark Mode** - Karanlık tema desteği
- ✅ **PWA Desteği** - Offline çalışma ve uygulama gibi yükleme
- ✅ **Real-time Sync** - Firebase ile anlık veri senkronizasyonu
- ✅ **Hızlı Arama** - Tüm modüllerde anlık arama
- ✅ **Excel Export/Import** - Veri içe/dışa aktarma
- ✅ **PDF Oluşturma** - Teklif ve sipariş PDF'leri

### 📱 Mobil UX Özellikleri (Yeni!)
- ✅ **Loading Skeletons** - Yüklenirken gösterilen iskelet ekranlar
- ✅ **Smart Confirmations** - Akıllı onay ve geri alma sistemi
- ✅ **Quick Actions FAB** - Hızlı erişim floating menüsü
- ✅ **Swipe Gestures** - Sol/sağ kaydırma hareketleri ile düzenleme/silme
- ✅ **Pull-to-Refresh** - Aşağı çekerek yenileme özelliği
- ✅ **Undo Delete** - 3 saniye içinde silme işlemini geri alma

### 📈 Görselleştirme
- **Satış Grafikleri** - Trend analizi (Chart.js)
- **Durum Grafikleri** - Sipariş durum dağılımı
- **Müşteri Analitiği** - Müşteri bazlı performans
- **Dashboard** - Önemli metriklerin özet görünümü

### 🔒 Güvenlik
- Firebase Authentication ile güvenli giriş
- Role-based access control (Admin/User)
- Firestore Security Rules
- Soft delete mekanizması

---

## 🛠️ Teknoloji Stack

### Frontend
- **React** 18.3.1 - UI Framework
- **Vite** 7.1.7 - Build tool
- **Tailwind CSS** 4.1.16 - Styling
- **Chart.js** 4.5.1 - Grafikler

### Backend & Database
- **Firebase** 12.4.0
  - Firestore (Database)
  - Authentication
  - Hosting

### Diğer Kütüphaneler
- **react-hot-toast** - Bildirimler
- **react-big-calendar** - Takvim
- **jspdf** - PDF oluşturma
- **xlsx** - Excel işlemleri
- **moment.js** - Tarih/saat işlemleri

### Development
- **Vitest** - Testing framework
- **ESLint** - Code linting
- **TypeScript** - Type checking

---

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Firebase hesabı

### Adım 1: Repository'yi Klonlayın
```bash
git clone https://github.com/yourusername/0711takipcrm.git
cd 0711takipcrm
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 3: Firebase Yapılandırması
1. `.env.example` dosyasını `.env` olarak kopyalayın:
```bash
cp .env.example .env
```

2. `.env` dosyasını düzenleyin ve Firebase credentials'larınızı ekleyin:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Adım 4: Firestore Security Rules
`firestore.rules` dosyasını Firebase Console'dan yükleyin.

### Adım 5: İlk Admin Kullanıcı
Detaylı adımlar için `ADMIN_SETUP.md` dosyasına bakın.

---

## 🚀 Kullanım

### Development Modu
```bash
npm run dev
```
Tarayıcınızda `http://localhost:5173` adresini açın.

### Production Build
```bash
npm run build
```
Build dosyaları `dist/` klasöründe oluşturulur.

### Preview (Production Build)
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

### Testing
```bash
# Testleri çalıştır
npm test

# Test UI
npm run test:ui

# Coverage raporu
npm run test:coverage
```

---

## 📁 Proje Yapısı

```
0711takipcrm/
├── public/              # Static assets
│   └── 404.html         # SPA routing for GitHub Pages
├── src/
│   ├── components/      # React components
│   │   ├── pages/       # Page components
│   │   ├── forms/       # Form components
│   │   ├── common/      # Reusable UI components
│   │   │   ├── LoadingSkeleton.jsx       # Yükleme iskelet ekranı
│   │   │   ├── QuickActionsFAB.jsx       # Hızlı erişim menüsü
│   │   │   ├── SwipeableListItem.jsx     # Kaydırılabilir liste öğesi
│   │   │   └── PullToRefresh.jsx         # Aşağı çekme yenileme
│   │   ├── charts/      # Chart components
│   │   ├── layout/      # Layout components
│   │   └── reports/     # Report components
│   ├── context/         # React Context
│   ├── hooks/           # Custom hooks
│   ├── services/        # Firebase services
│   ├── utils/           # Utility functions
│   │   └── toastUtils.jsx                # Toast bildirimleri
│   ├── types/           # TypeScript types
│   ├── constants/       # Constants
│   ├── test/            # Test setup
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions deployment
├── .env.example         # Environment variables template
├── firestore.rules      # Firestore security rules
├── vite.config.js       # Vite configuration
├── vitest.config.js     # Vitest configuration
└── package.json         # Dependencies
```

---

## 🎯 Kullanım Örnekleri

### Müşteri Ekleme
1. Sol menüden "Müşteriler" sekmesine gidin
2. Sağ alt köşedeki Quick Actions (FAB) menüsüne tıklayın
3. "Yeni Müşteri" seçeneğini seçin
4. Müşteri bilgilerini doldurun
5. "Kaydet" butonuna tıklayın

### Teklif Oluşturma
1. "Teklifler" sekmesine gidin
2. Quick Actions menüsünden "Yeni Teklif"e tıklayın
3. Müşteri seçin
4. Ürünleri ekleyin
5. KDV oranını belirleyin
6. "PDF İndir" ile teklifi indirin

### Rapor Görüntüleme
1. "Raporlar" sekmesine gidin
2. Tarih aralığı seçin
3. Detaylı raporları inceleyin
4. Grafikleri görüntüleyin
5. Excel'e aktarın

### 📱 Mobil Kullanım İpuçları

#### Swipe Gestures (Kaydırma Hareketleri)
- **Sağa kaydır**: Müşteri/sipariş/teklif düzenle
- **Sola kaydır**: Sil (geri alma ile)
- Her kaydırma işlemi görsel geri bildirim gösterir

#### Quick Actions Menüsü
- Sağ alt köşedeki mavi yuvarlak butona tıklayın
- Hızlı erişim seçenekleri:
  - ➕ Yeni Müşteri
  - 📦 Yeni Sipariş
  - 📄 Yeni Teklif
  - 🏭 Yeni Ürün
- Menü dışına tıklayarak kapatın

#### Smart Confirmations
- Silme işlemlerinde "Geri Al" butonu görünür
- 3 saniye içinde silme işlemini geri alabilirsiniz
- Otomatik kapanma ile kullanıcı dostu deneyim

#### Pull to Refresh
- Listede en üstteyken aşağı çekin
- Sayfayı yenilemek için bırakın
- Yenilenme animasyonu görünür

---

## 🔧 Yapılandırma

### Firebase Security Rules
`firestore.rules` dosyasında tanımlı kurallar:
- **Admin**: Tüm okuma/yazma yetkisi
- **User**: Sadece okuma yetkisi

### Vite Konfigürasyonu
- Base path: `/0711takipcrm/`
- Build optimizasyonları (code splitting, minification)
- PWA yapılandırması
- Source maps (production)

---

## 📊 Veritabanı Şeması

### Koleksiyonlar
- `users/` - Kullanıcı bilgileri ve rolleri
- `customers/` - Müşteri kayıtları
- `products/` - Ürün kataloğu
- `orders/` - Sipariş kayıtları
- `teklifler/` - Teklif kayıtları
- `meetings/` - Görüşme kayıtları
- `shipments/` - Kargo kayıtları
- `reports/` - Rapor kayıtları

Detaylı şema bilgisi için kaynak koduna bakın.

---

## 🚢 Deployment

### GitHub Pages
Proje otomatik olarak GitHub Pages'e deploy edilir:
1. `main` branch'e push yapın
2. GitHub Actions otomatik build alır
3. `dist/` klasörü GitHub Pages'e deploy edilir
4. URL: `https://yourusername.github.io/0711takipcrm/`

### Manuel Deployment
```bash
npm run build
# dist/ klasörünü hosting servisinize yükleyin
```

---

## 🧪 Testing

Test framework: **Vitest** + **React Testing Library**

### Test Yazma
```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Coverage Raporu
```bash
npm run test:coverage
```
Rapor `coverage/` klasöründe oluşturulur.

---

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje private bir projedir. Tüm hakları saklıdır.

---

## 📞 İletişim

Proje Sahibi - [GitHub Profile](https://github.com/ahmetfarukylmz-max)

Proje Linki: [https://github.com/ahmetfarukylmz-max/0711takipcrm](https://github.com/ahmetfarukylmz-max/0711takipcrm)

---

## 🙏 Teşekkürler

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)

---

## 📈 Versiyon Geçmişi

### v1.1.0 (2025-11-12) - Mobil UX İyileştirmeleri
- ✅ **Loading Skeletons** - Tüm sayfalara iskelet yükleme ekranları
- ✅ **Smart Confirmations** - Geri alınabilir silme işlemleri
- ✅ **Quick Actions FAB** - Floating action button ile hızlı erişim
- ✅ **Swipe Gestures** - Kaydırma hareketleri ile düzenleme/silme
- ✅ **Pull-to-Refresh** - Aşağı çekerek yenileme özelliği
- ✅ **Undo System** - 3 saniye içinde işlemleri geri alma
- ✅ GitHub Pages deployment iyileştirmeleri
- ✅ Touch event optimizasyonları

### v1.0.0 (2024-11-10)
- ✅ İlk stable release
- ✅ Tüm temel modüller tamamlandı
- ✅ React 18 migration
- ✅ Chart.js entegrasyonu
- ✅ PWA desteği
- ✅ Test framework kurulumu

---

**Built with ❤️ using React & Firebase**
