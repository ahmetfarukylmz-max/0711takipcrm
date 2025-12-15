import React from 'react';

const CostingSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        🏭 Stok ve Maliyet Yönetimi
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Sistem, basit bir stok takibi değil, muhasebe standartlarına uygun{' '}
        <strong>Hibrit Maliyet Sistemi</strong> kullanır.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Lot (Parti) Takibi
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Satınalma yoluyla stoğa giren her parti malın maliyeti farklı olabilir. Sistem bunları
            ayrı "Lot"lar olarak saklar (Örn: Ocak girişi 100 TL, Şubat girişi 110 TL).
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Varyans Analizi</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fiziksel sayım ile sistem stoğu tutmadığında "Stok Düzeltme" yaparsınız. Sistem bu farkı
            (Varyans) parasal değer olarak raporlar.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
          Maliyet Yöntemleri
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              <strong>FIFO (İlk Giren İlk Çıkar):</strong> Varsayılan yöntemdir. Sistem otomatik
              olarak en eski tarihli stoğu düşer.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              <strong>LIFO (Son Giren İlk Çıkar):</strong> En son alınan malı maliyet olarak düşer.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Ağırlıklı Ortalama:</strong> Tüm stoğun ortalama maliyetini baz alır.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CostingSection;
