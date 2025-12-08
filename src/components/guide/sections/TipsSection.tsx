import React from 'react';

const TipsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        💡 İpuçları ve Püf Noktalar
      </h2>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg border-l-4 border-yellow-500">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⌨️ Klavye Kısayolları
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'Ctrl + K', desc: 'Global arama' },
            { key: 'Ctrl + N', desc: 'Yeni kayıt' },
            { key: 'Ctrl + S', desc: 'Kaydet' },
            { key: 'Esc', desc: 'Modal kapat' },
            { key: 'Ctrl + P', desc: 'Yazdır' },
            { key: 'F5', desc: 'Sayfayı yenile' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded shadow"
            >
              <kbd className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded font-mono text-sm">
                {item.key}
              </kbd>
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⚡ Verimlilik İpuçları
        </h3>

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
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              📝 Müşteri Takibi
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>Her görüşmeyi mutlaka kaydedin</li>
              <li>Hatırlatma tarihleri belirleyin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipsSection;
