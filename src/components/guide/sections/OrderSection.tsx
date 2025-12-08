import React from 'react';

const OrderSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📦 Sipariş Yönetimi</h2>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ➕ Yeni Sipariş Oluşturma
        </h3>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Adım 1: Sipariş Başlat
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>
                Quick Actions → <strong>"📦 Yeni Sipariş"</strong>
              </li>
              <li>Müşteri seçin</li>
              <li>Tarih otomatik eklenir</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Adım 2: Ürün Ekle
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>"+ Ürün Ekle" butonuna tıklayın</li>
              <li>Ürün listesinden seçin</li>
              <li>Miktar ve fiyat girin</li>
              <li>İndirim ekleyebilirsiniz</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Adım 3: KDV ve Durum
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>KDV oranı seçin (0%, 1%, 8%, 10%, 18%, 20%)</li>
              <li>Sipariş durumu belirleyin</li>
              <li>Toplam otomatik hesaplanır</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Sipariş Durumları
        </h3>

        <div className="space-y-2">
          {[
            { emoji: '🟡', text: 'Beklemede - Yeni sipariş', color: 'yellow' },
            { emoji: '🔵', text: 'Onaylandı - Müşteri onayı alındı', color: 'blue' },
            { emoji: '🟢', text: 'Hazırlanıyor - Üretim/hazırlık', color: 'green' },
            { emoji: '🚚', text: 'Kargoya Verildi - Gönderim yapıldı', color: 'purple' },
            { emoji: '✅', text: 'Tamamlandı - Teslimat tamamlandı', color: 'green' },
            { emoji: '❌', text: 'İptal Edildi - Sipariş iptal', color: 'red' },
          ].map((item) => (
            <div
              key={item.text}
              className={`flex items-center gap-2 p-2 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderSection;
