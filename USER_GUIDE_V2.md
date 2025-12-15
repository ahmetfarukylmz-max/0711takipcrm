# 📘 Takip CRM v2.0 - Kapsamlı Kullanıcı ve Süreç Rehberi

Takip CRM; satış, satınalma, stok ve finans süreçlerinizi tek bir yerden yönetmenizi sağlayan bütünleşik bir iş yönetim platformudur. Bu rehber, uygulamanın sadece "nasıl kullanılacağını" değil, "iş süreçlerinizi nasıl yöneteceğinizi" anlatmak üzere tasarlanmıştır.

---

## 📑 İçindekiler

1.  [🚀 Hızlı Başlangıç ve Dashboard](#-hızlı-başlangıç-ve-dashboard)
2.  [🛒 Satınalma Yönetimi (Tedarik Zinciri)](#-satınalma-yönetimi-tedarik-zinciri)
3.  [💼 Satış ve CRM Döngüsü](#-satış-ve-crm-döngüsü)
4.  [🏭 Stok ve Maliyet Yönetimi (Costing)](#-stok-ve-maliyet-yönetimi-costing)
5.  [💰 Finansal İşlemler ve Cari Takip](#-finansal-işlemler-ve-cari-takip)
6.  [📊 Raporlama ve İş Zekası](#-raporlama-ve-iş-zekası)

---

## 🚀 Hızlı Başlangıç ve Dashboard

Uygulamaya giriş yaptığınızda sizi karşılayan ana ekran, işletmenizin kokpitidir.

### Dashboard'un Dili

Dashboard size şunları söyler:

- **"Bugün ne yapmalıyım?"** -> _Bekleyen İşler, Yaklaşan Görüşmeler_
- **"Durumumuz ne?"** -> _Toplam Satış, Açık Siparişler, Kritik Stok Uyarıları_
- **"Aksiyon almam gerekenler"** -> _Ödemesi Gecikenler, Onay Bekleyen Teklifler_

### Hızlı Erişim (Quick Actions)

Ekranın sağ alt köşesindeki veya üst menüdeki "Hızlı İşlemler" butonu ile her yerden şunları yapabilirsiniz:

- `Ctrl + K` (veya `Cmd + K`): **Global Arama**. Müşteri, sipariş, ürün veya herhangi bir şeyi anında bulun.
- `+ Yeni`: Hızlıca Müşteri, Sipariş, Teklif veya Satınalma Talebi oluşturun.

---

## 🛒 Satınalma Yönetimi (Tedarik Zinciri)

Satınalma modülü, **Kanban (Pano)** yapısıyla çalışır. Bu, taleplerin görsel olarak soldan sağa akmasını sağlar.

### İş Akışı: Talepten Depoya

#### 1. Talep Oluşturma (`Talep Edildi`)

- **Senaryo:** Depo sorumlusu veya satışçı bir ürüne ihtiyaç duydu.
- **İşlem:** "Yeni Talep" butonu ile ürün, miktar ve aciliyet belirtilerek talep açılır. Kart "Talep Edildi" sütununa düşer.

#### 2. Pazar Araştırması (`Araştırılıyor`)

- **Senaryo:** Satınalma birimi tedarikçilerden fiyat topluyor.
- **İşlem:** Karta tıklayın ve "Tedarikçi Teklifleri" sekmesine geçin. Aldığınız fiyatları (Tedarikçi A: 100 TL, Tedarikçi B: 95 TL) girin. Henüz karar verilmemiştir.

#### 3. Sipariş Verme (`Sipariş Verildi`)

- **Senaryo:** En uygun teklif seçildi.
- **İşlem:** Teklifler arasından uygun olanın yanındaki "Onayla" butonuna basın. Kart otomatik olarak "Sipariş Verildi" sütununa taşınır.

#### 4. Mal Kabul (`Depoya Girdi`)

- **Senaryo:** Ürünler kargo ile şirkete geldi.
- **İşlem:** Kartı sürükleyip en sağdaki "Depoya Girdi" sütununa bırakın.
- **Otomatik Stok Girişi:** Sistem size sorar: _"Bu ürünleri stoğa eklemek istiyor musunuz?"_. Onaylarsanız:
  - Ürün stoğu artar.
  - Maliyet sistemine (Costing) bu parti mal, alış fiyatıyla bir "Lot" olarak kaydedilir.

---

## 💼 Satış ve CRM Döngüsü

Müşteriyi bulmaktan parayı tahsil etmeye kadar geçen süreçtir.

### Adım 1: Müşteri ve Görüşme

- **Görüşme Kaydı:** Müşteriyle yapılan her temas (Telefon, Ziyaret) "Görüşmeler" altına kaydedilmelidir.
- **İlgilenilen Ürünler:** Görüşme esnasında müşterinin sorduğu ürünleri kaydedin. Bu, ileride "Kime ne satabilirim?" analizi için kritiktir.

### Adım 2: Teklif Hazırlama (Smart Quote)

- **Teklif Oluştur:** Görüşme sonucunda müşteriye özel fiyatlarla teklif hazırlayın.
- **PDF Paylaşımı:** Teklifi profesyonel PDF formatında indirin ve gönderin.
- **Teklif Reddedilirse (Önemli!):** Müşteri teklifi reddederse, durumu "Reddedildi" yapın. Sistem size nedenini soracaktır:
  - _Fiyat Yüksek:_ Müşterinin hedef fiyatını ve varsa rakip firma ismini girin. Bu veri, **Kayıp Analizi** raporlarında "Fiyat yüzünden X TL kaybettik" şeklinde karşınıza çıkar.

### Adım 3: Sipariş ve Sevkiyat

- **Dönüştürme:** Onaylanan teklifi tek tıkla "Siparişe Dönüştür" diyerek siparişleştirin.
- **Sevkiyat Planı:** Sipariş "Hazırlanıyor" aşamasındayken stoktan rezerve edilir. "Gönderildi" olduğunda stoktan kalıcı olarak düşer.

---

## 🏭 Stok ve Maliyet Yönetimi (Costing)

Sistem, basit bir stok takibi değil, muhasebe standartlarına uygun **Hibrit Maliyet Sistemi** kullanır.

### Lot (Parti) Takibi Nedir?

Satınalma yoluyla stoğa giren her parti malın maliyeti farklı olabilir (Örn: Ocak'ta 100 TL, Şubat'ta 110 TL). Sistem bunları ayrı "Lot"lar olarak saklar.

### Maliyet Yöntemleri

Satış yaparken maliyetin nasıl hesaplanacağını "Ayarlar" veya ürün bazında seçebilirsiniz:

1.  **FIFO (İlk Giren İlk Çıkar):** Varsayılan ve en yaygın yöntemdir. Sistem otomatik olarak en eski tarihli stoğu düşer.
2.  **LIFO (Son Giren İlk Çıkar):** En son alınan malı maliyet olarak düşer.
3.  **Ağırlıklı Ortalama:** Tüm stoğun ortalama maliyetini baz alır.

### Varyans Analizi

Fiziksel sayım ile sistem stoğu tutmadığında "Stok Düzeltme" yaparsınız. Sistem bu farkı (Varyans) parasal değer olarak raporlar, böylece kayıp/kaçak takibi yapabilirsiniz.

---

## 💰 Finansal İşlemler ve Cari Takip

### Cari Hesap Yönetimi

Her müşterinin bir "Bakiyesi" vardır.

- Sipariş (Vadeli) -> Borç Artar (+).
- Tahsilat -> Borç Azalır (-).
- İade -> Borç Azalır (-).

### Tahsilat Girişi

"Ödemeler" sayfasından veya müşteri detayından tahsilat girebilirsiniz.

- **Kısmi Ödeme:** 10.000 TL'lik siparişin 3.000 TL'sini nakit alıp, kalanı açık hesap bırakabilirsiniz.
- **Çek/Senet:** Vadeli çekleri sisteme girdiğinizde, vade tarihi geldiğinde sistem sizi uyarır.

---

## 📊 Raporlama ve İş Zekası

Verileriniz anlamlı bilgilere dönüşür.

### Kritik Raporlar

1.  **Kayıp Analizi (Loss Analysis):** Neden satış kaçırıyoruz? (Fiyat, Stok, Rakip). Rakiplerimiz kimler ve hangi fiyattan veriyorlar?
2.  **Satış Performansı:** Hangi personel ne kadar sattı? Hangi ürün en çok kazandırıyor?
3.  **Stok Yaşlandırma:** Hangi ürünler rafta çok bekledi? (Atıl stok analizi).
4.  **Finansal Durum:** Vadesi geçen alacaklar ve gelecek nakit akışı tahmini.

---

_Bu rehber yaşayan bir dokümandır. Yeni özellikler eklendikçe güncellenecektir._
