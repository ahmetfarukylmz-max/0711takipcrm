import React from 'react';

const CustomerSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">👥 Müşteri Yönetimi</h2>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            ➕ Yeni Müşteri Ekleme
          </h3>

          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Yöntem 1: Quick Actions (Hızlı)
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Sağ alt köşedeki <strong>mavi yuvarlak butona</strong> tıklayın
                </li>
                <li>
                  <strong>"➕ Yeni Müşteri"</strong> seçeneğini seçin
                </li>
                <li>Formu doldurun ve kaydedin</li>
              </ol>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Yöntem 2: Müşteriler Sayfasından
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Sol menüden <strong>"Müşteriler"</strong> sekmesine gidin
                </li>
                <li>
                  Yukarıdaki <strong>"+ Yeni Müşteri"</strong> butonuna tıklayın
                </li>
                <li>Formu doldurun ve kaydedin</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            ✏️ Müşteri Düzenleme
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                💻 Masaüstünde:
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Müşteri satırındaki ✏️ Düzenle butonuna tıklayın
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                📱 Mobilde:
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Müşteri satırını <strong>sağa kaydırın 👉</strong> - Mavi düzenle butonu görünecek
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            🗑️ Müşteri Silme
          </h3>

          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              📱 Mobilde Swipe ile Silme:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Müşteri satırını <strong>sola kaydırın 👈</strong>
              </li>
              <li>Kırmızı sil butonu görünecek</li>
              <li>
                <strong>"Geri Al"</strong> butonu ile 3 saniye içinde geri alabilirsiniz
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSection;
