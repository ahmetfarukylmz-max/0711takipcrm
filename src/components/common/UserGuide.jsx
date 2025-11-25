/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';

const UserGuide = () => {
    const [activeSection, setActiveSection] = useState('giris');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sections = [
        { id: 'giris', title: '🔐 Giriş Yapma', icon: '🔐' },
        { id: 'dashboard', title: '🏠 Ana Sayfa', icon: '🏠' },
        { id: 'musteriler', title: '👥 Müşteri Yönetimi', icon: '👥' },
        { id: 'urunler', title: '🏭 Ürün Yönetimi', icon: '🏭' },
        { id: 'siparisler', title: '📦 Sipariş Yönetimi', icon: '📦' },
        { id: 'teklifler', title: '📄 Teklif Hazırlama', icon: '📄' },
        { id: 'gorusmeler', title: '💬 Görüşme Takibi', icon: '💬' },
        { id: 'kargo', title: '🚚 Kargo Yönetimi', icon: '🚚' },
        { id: 'raporlar', title: '📊 Raporlar', icon: '📊' },
        { id: 'mobil', title: '📱 Mobil Kullanım', icon: '📱' },
        { id: 'ipuclari', title: '💡 İpuçları', icon: '💡' },
    ];

    const content = {
        giris: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🔐 Giriş Yapma</h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">İlk Giriş</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Tarayıcınızda uygulamayı açın</li>
                        <li>E-posta adresinizi ve şifrenizi girin</li>
                        <li>"Giriş Yap" butonuna tıklayın</li>
                    </ol>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Şifremi Unuttum</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>"Şifremi Unuttum" linkine tıklayın</li>
                        <li>E-posta adresinizi girin</li>
                        <li>Gelen maildeki linke tıklayarak yeni şifre oluşturun</li>
                    </ol>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">💡 İpucu</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                        Oturumunuz açık kalır, tekrar giriş yapmanıza gerek yoktur. Güvenli çıkış için
                        sağ üst köşedeki kullanıcı menüsünden "Çıkış Yap"ı kullanın.
                    </p>
                </div>
            </div>
        ),

        dashboard: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🏠 Ana Sayfa (Dashboard)</h2>

                <p className="text-gray-700 dark:text-gray-300 text-lg">
                    Dashboard, işinizin özet görünümünü sunar ve önemli metriklere hızlı erişim sağlar.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Özet Kartlar</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            <li>Toplam Müşteri Sayısı</li>
                            <li>Bekleyen Siparişler</li>
                            <li>Toplam Satış</li>
                            <li>Açık Teklifler</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Grafikler</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            <li>Aylık satış trendi</li>
                            <li>Sipariş durum dağılımı</li>
                            <li>Müşteri bazlı satış</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔄 Yenileme</h3>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                        <li><strong>Otomatik:</strong> Dashboard real-time güncellenir</li>
                        <li><strong>Mobilde:</strong> Aşağı çekerek yenileyin</li>
                        <li><strong>Masaüstünde:</strong> F5 tuşuna basın</li>
                    </ul>
                </div>
            </div>
        ),

        musteriler: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">👥 Müşteri Yönetimi</h2>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">➕ Yeni Müşteri Ekleme</h3>

                        <div className="space-y-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Yöntem 1: Quick Actions (Hızlı)</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Sağ alt köşedeki <strong>mavi yuvarlak butona</strong> tıklayın</li>
                                    <li><strong>"➕ Yeni Müşteri"</strong> seçeneğini seçin</li>
                                    <li>Formu doldurun ve kaydedin</li>
                                </ol>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Yöntem 2: Müşteriler Sayfasından</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Sol menüden <strong>"Müşteriler"</strong> sekmesine gidin</li>
                                    <li>Yukarıdaki <strong>"+ Yeni Müşteri"</strong> butonuna tıklayın</li>
                                    <li>Formu doldurun ve kaydedin</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">✏️ Müşteri Düzenleme</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">💻 Masaüstünde:</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Müşteri satırındaki ✏️ Düzenle butonuna tıklayın
                                </p>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
                                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">📱 Mobilde:</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Müşteri satırını <strong>sağa kaydırın 👉</strong> - Mavi düzenle butonu görünecek
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">🗑️ Müşteri Silme</h3>

                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">📱 Mobilde Swipe ile Silme:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                <li>Müşteri satırını <strong>sola kaydırın 👈</strong></li>
                                <li>Kırmızı sil butonu görünecek</li>
                                <li><strong>"Geri Al"</strong> butonu ile 3 saniye içinde geri alabilirsiniz</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        ),

        urunler: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🏭 Ürün Yönetimi</h2>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">➕ Yeni Ürün Ekleme</h3>

                    <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                        <li>Quick Actions menüsünden <strong>"🏭 Yeni Ürün"</strong> seçin</li>
                        <li className="ml-4">
                            <strong>Ürün bilgilerini girin:</strong>
                            <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-sm">
                                <li>Ürün Adı (Zorunlu)</li>
                                <li>Ürün Kodu (SKU)</li>
                                <li>Birim Fiyat (Zorunlu)</li>
                                <li>Birim (Adet, Kg, Litre, vb.)</li>
                                <li>Stok Miktarı</li>
                                <li>Kategori</li>
                            </ul>
                        </li>
                        <li>"Kaydet" butonuna tıklayın</li>
                    </ol>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📂 Ürün Kategorileri</h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Hammadde', 'Yarı Mamul', 'Mamul', 'Hizmet', 'Diğer'].map(cat => (
                            <div key={cat} className="bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded text-center text-gray-700 dark:text-gray-200">
                                {cat}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Toplu Ürün İçe Aktarma</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Excel'den toplu ürün ekleyebilirsiniz:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>"Excel'den İçe Aktar" butonuna tıklayın</li>
                        <li>Şablon dosyasını indirin</li>
                        <li>Excel'i doldurun ve yükleyin</li>
                    </ol>
                </div>
            </div>
        ),

        siparisler: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📦 Sipariş Yönetimi</h2>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">➕ Yeni Sipariş Oluşturma</h3>

                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Adım 1: Sipariş Başlat</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Quick Actions → <strong>"📦 Yeni Sipariş"</strong></li>
                                <li>Müşteri seçin</li>
                                <li>Tarih otomatik eklenir</li>
                            </ul>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Adım 2: Ürün Ekle</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>"+ Ürün Ekle" butonuna tıklayın</li>
                                <li>Ürün listesinden seçin</li>
                                <li>Miktar ve fiyat girin</li>
                                <li>İndirim ekleyebilirsiniz</li>
                            </ul>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Adım 3: KDV ve Durum</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>KDV oranı seçin (0%, 1%, 8%, 10%, 18%, 20%)</li>
                                <li>Sipariş durumu belirleyin</li>
                                <li>Toplam otomatik hesaplanır</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🎯 Sipariş Durumları</h3>

                    <div className="space-y-2">
                        {[
                            { emoji: '🟡', text: 'Beklemede - Yeni sipariş', color: 'yellow' },
                            { emoji: '🔵', text: 'Onaylandı - Müşteri onayı alındı', color: 'blue' },
                            { emoji: '🟢', text: 'Hazırlanıyor - Üretim/hazırlık', color: 'green' },
                            { emoji: '🚚', text: 'Kargoya Verildi - Gönderim yapıldı', color: 'purple' },
                            { emoji: '✅', text: 'Tamamlandı - Teslimat tamamlandı', color: 'green' },
                            { emoji: '❌', text: 'İptal Edildi - Sipariş iptal', color: 'red' },
                        ].map(item => (
                            <div key={item.text} className={`flex items-center gap-2 p-2 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded`}>
                                <span className="text-xl">{item.emoji}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),

        teklifler: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📄 Teklif Hazırlama</h2>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📝 Teklif Oluşturma Adımları</h3>

                    <div className="space-y-3">
                        {[
                            { step: 1, title: 'Teklif Başlat', desc: 'Quick Actions → "📄 Yeni Teklif" → Müşteri seçin' },
                            { step: 2, title: 'Ürünleri Ekle', desc: 'Birden fazla ürün ekleyebilir, her birine indirim tanımlayabilirsiniz' },
                            { step: 3, title: 'Notlar Ekle', desc: 'Teslimat koşulları, ödeme şartları, özel koşullar' },
                            { step: 4, title: 'PDF İndir', desc: 'Teklifi PDF olarak kaydedin ve müşteriye gönderin' },
                        ].map(item => (
                            <div key={item.step} className="flex gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                    {item.step}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔄 Teklifi Siparişe Dönüştürme</h3>

                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Onaylanan teklifi açın</li>
                            <li><strong>"Siparişe Dönüştür"</strong> butonuna tıklayın</li>
                            <li>Bilgiler otomatik aktarılır</li>
                            <li>Gerekli düzenlemeleri yapın</li>
                            <li>Siparişi kaydedin</li>
                        </ol>
                    </div>
                </div>
            </div>
        ),

        gorusmeler: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">💬 Görüşme Takibi</h2>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">➕ Yeni Görüşme Kaydı</h3>

                    <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300">Müşteri etkileşimlerinizi kaydedin:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li><strong>Müşteri</strong> - Kimle görüşüldü</li>
                            <li><strong>Tarih</strong> - Görüşme tarihi</li>
                            <li><strong>Görüşme Şekli</strong> - Telefon, Yüz yüze, E-posta, Online</li>
                            <li><strong>Konu</strong> - Ne konuşuldu</li>
                            <li><strong>Notlar</strong> - Detaylı açıklama</li>
                            <li><strong>Sonraki Adım</strong> - Takip gerekli mi?</li>
                            <li><strong>Hatırlatma</strong> - Gelecek aksiyon tarihi</li>
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { icon: '📞', text: 'Telefon' },
                        { icon: '🤝', text: 'Yüz Yüze' },
                        { icon: '📧', text: 'E-posta' },
                        { icon: '💻', text: 'Online' },
                    ].map(item => (
                        <div key={item.text} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow text-center">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.text}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⏰ Hatırlatmalar</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                        Sistem, belirlediğiniz tarihte hatırlatma yapar. Dashboard'da yaklaşan görüşmeler görünür.
                    </p>
                </div>
            </div>
        ),

        kargo: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🚚 Kargo Yönetimi</h2>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📦 Kargo Kaydı Oluşturma</h3>

                    <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                        <li><strong>Sipariş Seçin</strong> - Hangi siparişi gönderiyorsunuz</li>
                        <li><strong>Kargo Firması</strong> - Aras, MNG, Yurtiçi, UPS, vb.</li>
                        <li><strong>Takip Numarası</strong> - Kargo takip kodu</li>
                        <li><strong>Gönderim Tarihi</strong> - Ne zaman gönderildi</li>
                        <li><strong>Tahmini Teslimat</strong> - Ne zaman teslim edilecek</li>
                    </ol>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📍 Kargo Durumları</h3>

                    <div className="space-y-2">
                        {[
                            { emoji: '📦', text: 'Hazırlanıyor - Paketleme aşamasında' },
                            { emoji: '🚚', text: 'Kargoda - Yolda' },
                            { emoji: '🏪', text: 'Dağıtım Merkezinde - Bölge merkezinde' },
                            { emoji: '✅', text: 'Teslim Edildi - Teslim tamamlandı' },
                            { emoji: '❌', text: 'İade - Kargo iade edildi' },
                        ].map(item => (
                            <div key={item.text} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded">
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-200">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),

        raporlar: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📊 Raporlar</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg shadow">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <span className="text-xl">💰</span> Satış Raporu
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li>Tarih aralığındaki satışlar</li>
                            <li>Toplam ciro</li>
                            <li>Ürün bazlı satış</li>
                            <li>Müşteri bazlı satış</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg shadow">
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                            <span className="text-xl">👥</span> Müşteri Raporu
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li>En çok alım yapan müşteriler</li>
                            <li>Yeni müşteriler</li>
                            <li>Pasif müşteriler</li>
                            <li>Müşteri sayısı trendi</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg shadow">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                            <span className="text-xl">🏭</span> Ürün Raporu
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li>En çok satan ürünler</li>
                            <li>Stok durumu</li>
                            <li>Kar marjı analizi</li>
                            <li>Kategori bazlı satış</li>
                        </ul>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg shadow">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                            <span className="text-xl">💳</span> Finansal Rapor
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li>Aylık gelir</li>
                            <li>Tahsilat durumu</li>
                            <li>Bekleyen ödemeler</li>
                            <li>Kar/Zarar</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📥 Rapor Dışa Aktarma</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Excel Formatı</h4>
                            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Rapor oluşturun</li>
                                <li>"Excel'e Aktar" butonuna tıklayın</li>
                                <li>XLSX dosyası indirilir</li>
                            </ol>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">PDF Formatı</h4>
                            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Rapor oluşturun</li>
                                <li>"PDF İndir" butonuna tıklayın</li>
                                <li>Profesyonel formatta rapor</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        ),

        mobil: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📱 Mobil Kullanım</h2>

                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-3">PWA Yükleme</h3>
                    <p className="mb-4">Uygulamayı telefonunuza yükleyin ve uygulama gibi kullanın!</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/20 backdrop-blur p-4 rounded">
                            <h4 className="font-semibold mb-2">📱 Android:</h4>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                                <li>Chrome'da siteyi açın</li>
                                <li>Menü → "Ana ekrana ekle"</li>
                                <li>Ana ekranda simge belirir</li>
                            </ol>
                        </div>

                        <div className="bg-white/20 backdrop-blur p-4 rounded">
                            <h4 className="font-semibold mb-2">🍎 iOS:</h4>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                                <li>Safari'de siteyi açın</li>
                                <li>Paylaş → "Ana Ekrana Ekle"</li>
                                <li>Ana ekranda simge belirir</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">👆 Swipe Gestures</h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-4xl">👉</span>
                            <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Sağa Kaydır - Düzenle</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Liste öğesini sağa kaydırın, mavi düzenle butonu görünür
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <span className="text-4xl">👈</span>
                            <div>
                                <h4 className="font-semibold text-red-900 dark:text-red-100">Sola Kaydır - Sil</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Liste öğesini sola kaydırın, kırmızı sil butonu görünür. 3 saniye içinde geri alabilirsiniz!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">⚡ Quick Actions FAB</h3>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-lg text-white">
                        <p className="mb-3">Sağ alt köşedeki mavi yuvarlak butona dokunun:</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/20 p-3 rounded">➕ Yeni Müşteri</div>
                            <div className="bg-white/20 p-3 rounded">📦 Yeni Sipariş</div>
                            <div className="bg-white/20 p-3 rounded">📄 Yeni Teklif</div>
                            <div className="bg-white/20 p-3 rounded">🏭 Yeni Ürün</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔄 Pull to Refresh</h3>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Liste sayfasında <strong>en üstte</strong> olun</li>
                            <li>Parmağınızla <strong>aşağı doğru çekin</strong></li>
                            <li>Yenileme simgesi görünür</li>
                            <li><strong>Bırakın</strong> - sayfa yenilenir</li>
                        </ol>
                    </div>
                </div>
            </div>
        ),

        ipuclari: (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">💡 İpuçları ve Püf Noktalar</h2>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">⌨️ Klavye Kısayolları</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { key: 'Ctrl + K', desc: 'Global arama' },
                            { key: 'Ctrl + N', desc: 'Yeni kayıt' },
                            { key: 'Ctrl + S', desc: 'Kaydet' },
                            { key: 'Esc', desc: 'Modal kapat' },
                            { key: 'Ctrl + P', desc: 'Yazdır' },
                            { key: 'F5', desc: 'Sayfayı yenile' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded shadow">
                                <kbd className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded font-mono text-sm">
                                    {item.key}
                                </kbd>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">⚡ Verimlilik İpuçları</h3>

                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🌅 Sabah Rutini</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Dashboard'u kontrol edin</li>
                                <li>Bekleyen siparişleri görüntüleyin</li>
                                <li>Günlük görevleri planlayın</li>
                            </ul>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">📝 Müşteri Takibi</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Her görüşmeyi mutlaka kaydedin</li>
                                <li>Hatırlatma tarihleri belirleyin</li>
                                <li>Notlarınızı detaylı tutun</li>
                            </ul>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">📊 Düzenli Raporlama</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Haftalık satış raporu çıkarın</li>
                                <li>Aylık performans analizi yapın</li>
                                <li>Stok durumunu kontrol edin</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">⚠️ Sık Yapılan Hatalar</h3>

                    <div className="space-y-3">
                        {[
                            { wrong: 'Swipe yönünü karıştırmak', right: 'Sağa: düzenle, Sola: sil' },
                            { wrong: 'Siparişi tekrar tekrar aramak', right: 'Global arama (Ctrl+K) kullanın' },
                            { wrong: 'PDF\'leri manuel oluşturmak', right: '"PDF İndir" butonunu kullanın' },
                            { wrong: 'Verileri manuel kopyalamak', right: '"Excel\'e Aktar" özelliğini kullanın' },
                        ].map((item, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded">
                                <div className="flex-shrink-0">
                                    <span className="text-red-500 text-xl">❌</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm text-red-600 dark:text-red-400 line-through">{item.wrong}</p>
                                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                                        ✅ {item.right}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-3">🎯 Başarı İçin Son Tavsiyeler</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span>✓</span>
                            <span>Sistemi düzenli kullanın</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>✓</span>
                            <span>Tüm verileri eksiksiz girin</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>✓</span>
                            <span>Mobil özellikleri aktif kullanın</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>✓</span>
                            <span>Düzenli yedek alın (Excel export)</span>
                        </li>
                    </ul>
                </div>
            </div>
        ),
    };

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSectionClick = (sectionId) => {
        setActiveSection(sectionId);
        setSidebarOpen(false); // Close sidebar on mobile after selection
    };

    return (
        <div className="flex h-[80vh] bg-gray-50 dark:bg-gray-900 relative">
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-blue-500 text-white p-3 rounded-lg shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
                aria-label="Toggle menu"
            >
                {sidebarOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Sidebar Navigation */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                overflow-y-auto transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kullanıcı Rehberi</h2>
                    <input
                        type="text"
                        placeholder="Rehberde ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <nav className="p-2">
                    {filteredSections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => handleSectionClick(section.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                                activeSection === section.id
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <span className="mr-2">{section.icon}</span>
                            <span className="text-sm font-medium">
                                {section.title.replace(/^[^\s]+ /, '')}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 pt-16 lg:pt-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {content[activeSection]}
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
