import React from 'react';

const MobileSection: React.FC = () => {
  return (
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          👆 Swipe Gestures
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-4xl">👉</span>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Sağa Kaydır - Düzenle
              </h4>
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
                Liste öğesini sola kaydırın, kırmızı sil butonu görünür. 3 saniye içinde geri
                alabilirsiniz!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⚡ Quick Actions FAB
        </h3>

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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔄 Pull to Refresh
        </h3>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Liste sayfasında <strong>en üstte</strong> olun
            </li>
            <li>
              Parmağınızla <strong>aşağı doğru çekin</strong>
            </li>
            <li>Yenileme simgesi görünür</li>
            <li>
              <strong>Bırakın</strong> - sayfa yenilenir
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MobileSection;
