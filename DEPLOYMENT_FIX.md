# GitHub Pages Deployment Sorununu Çözme

## Sorun
GitHub Pages'te `/src/main.jsx` 404 hatası alınıyor.

## Neden
Tarayıcı eski index.html'i cache'lemiş. Yeni deployment yapılmış ama tarayıcı eski dosyayı gösteriyor.

## Çözüm Adımları

### 1. Tarayıcı Cache'ini Tamamen Temizle

**Chrome/Edge:**
1. `Ctrl + Shift + Delete` tuşlarına basın
2. "Cached images and files" seçeneğini işaretleyin
3. Time range: "All time" seçin
4. "Clear data" tıklayın

**Firefox:**
1. `Ctrl + Shift + Delete`
2. "Cache" seçeneğini işaretleyin
3. Time range: "Everything"
4. "Clear Now"

### 2. Service Worker'ı Temizle

1. `F12` (DevTools açın)
2. **Application** sekmesi
3. Sol menüden **Service Workers**
4. "Unregister" butonuna tıklayın (tüm service worker'lar için)
5. Sol menüden **Cache Storage**
6. Her cache'i sağ tıklayıp **Delete**
7. **Local Storage** ve **Session Storage**'ı da temizleyin

### 3. Hard Refresh

Tarayıcıyı tamamen kapatıp açın, sonra:
- Windows/Linux: `Ctrl + Shift + R` veya `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 4. İncognito/Private Mode'da Test

Yeni bir incognito pencere açın:
- `Ctrl + Shift + N` (Chrome/Edge)
- `Ctrl + Shift + P` (Firefox)

URL'i buraya yapıştırın: https://ahmetfarukylmz-max.github.io/0711takipcrm/

Eğer incognito'da çalışıyorsa, %100 cache sorunudur.

### 5. GitHub Actions Durumunu Kontrol

https://github.com/ahmetfarukylmz-max/0711takipcrm/actions

Son "Deploy to GitHub Pages" workflow'unun:
- ✅ Yeşil (başarılı) olduğundan emin olun
- ⏱️ Tamamlanmasını bekleyin (2-3 dakika sürer)

### 6. Son Deployment Zamanını Kontrol

https://github.com/ahmetfarukylmz-max/0711takipcrm/deployments

En son deployment'ın ne zaman yapıldığını kontrol edin.

## Beklenen Davranış

Deployment başarılı olduktan sonra:
- ✅ https://ahmetfarukylmz-max.github.io/0711takipcrm/ normal açılmalı
- ✅ Modern sidebar görünmeli
- ✅ No console errors
- ✅ `/src/main.jsx` hatası olmamalı

## Not

GitHub Pages deployment'ı bazen 5-10 dakika cache'de tutabilir. Eğer yukarıdaki adımlar işe yaramazsa:
- 5-10 dakika bekleyin
- Farklı bir cihaz/tarayıcı deneyin
- VPN kullanarak deneyin (farklı CDN node'u kullanır)
