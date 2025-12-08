import React from 'react';

const ShipmentSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🚚 Kargo Yönetimi</h2>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📦 Kargo Kaydı Oluşturma
        </h3>

        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Sipariş Seçin</strong> - Hangi siparişi gönderiyorsunuz
          </li>
          <li>
            <strong>Kargo Firması</strong> - Aras, MNG, Yurtiçi, UPS, vb.
          </li>
          <li>
            <strong>Takip Numarası</strong> - Kargo takip kodu
          </li>
          <li>
            <strong>Gönderim Tarihi</strong> - Ne zaman gönderildi
          </li>
          <li>
            <strong>Tahmini Teslimat</strong> - Ne zaman teslim edilecek
          </li>
        </ol>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📍 Kargo Durumları
        </h3>

        <div className="space-y-2">
          {[
            { emoji: '📦', text: 'Hazırlanıyor - Paketleme aşamasında' },
            { emoji: '🚚', text: 'Kargoda - Yolda' },
            { emoji: '🏪', text: 'Dağıtım Merkezinde - Bölge merkezinde' },
            { emoji: '✅', text: 'Teslim Edildi - Teslim tamamlandı' },
            { emoji: '❌', text: 'İade - Kargo iade edildi' },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm text-gray-700 dark:text-gray-200">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShipmentSection;
