import React from 'react';

const IntroSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🚀 Hızlı Başlangıç
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Takip CRM'e hoş geldiniz. Bu platform, işletmenizin satış, satınalma, stok ve finans
          süreçlerini tek bir yerden yönetmenizi sağlar.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Dashboard Ne Anlatır?
        </h3>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <strong className="text-gray-900 dark:text-white block">
                "Bugün ne yapmalıyım?"
              </strong>
              <span className="text-sm text-gray-500">
                Bekleyen İşler ve Yaklaşan Görüşmeler listesini kontrol edin.
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <strong className="text-gray-900 dark:text-white block">"Durumumuz ne?"</strong>
              <span className="text-sm text-gray-500">
                Toplam Satış, Açık Siparişler ve Kritik Stok uyarılarına göz atın.
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <strong className="text-gray-900 dark:text-white block">
                "Aksiyon almam gerekenler"
              </strong>
              <span className="text-sm text-gray-500">
                Ödemesi Gecikenler ve Onay Bekleyen Teklifler hemen müdahale bekler.
              </span>
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
          ⚡ Hızlı Erişim (Quick Actions)
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Ekranın sağ alt köşesindeki buton veya klavye kısayolları ile hız kazanın:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono mr-2">
              Ctrl + K
            </code>
            <span className="text-sm font-medium">Global Arama</span>
            <p className="text-xs text-gray-500 mt-1">
              Müşteri, sipariş, ürün... Her şeyi anında bulun.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
            <span className="text-xl mr-2">➕</span>
            <span className="text-sm font-medium">Hızlı Ekle Menüsü</span>
            <p className="text-xs text-gray-500 mt-1">
              Tek tıkla Müşteri, Sipariş veya Teklif oluşturun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
