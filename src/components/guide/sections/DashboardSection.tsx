import React from 'react';

const DashboardSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        🏠 Ana Sayfa (Dashboard)
      </h2>

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
          <li>
            <strong>Otomatik:</strong> Dashboard real-time güncellenir
          </li>
          <li>
            <strong>Mobilde:</strong> Aşağı çekerek yenileyin
          </li>
          <li>
            <strong>Masaüstünde:</strong> F5 tuşuna basın
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardSection;
