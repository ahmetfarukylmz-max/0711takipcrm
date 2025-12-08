import React from 'react';

const QuoteSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📄 Teklif Hazırlama</h2>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📝 Teklif Oluşturma Adımları
        </h3>

        <div className="space-y-3">
          {[
            {
              step: 1,
              title: 'Teklif Başlat',
              desc: 'Quick Actions → "📄 Yeni Teklif" → Müşteri seçin',
            },
            {
              step: 2,
              title: 'Ürünleri Ekle',
              desc: 'Birden fazla ürün ekleyebilir, her birine indirim tanımlayabilirsiniz',
            },
            {
              step: 3,
              title: 'Notlar Ekle',
              desc: 'Teslimat koşulları, ödeme şartları, özel koşullar',
            },
            {
              step: 4,
              title: 'PDF İndir',
              desc: 'Teklifi PDF olarak kaydedin ve müşteriye gönderin',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
            >
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔄 Teklifi Siparişe Dönüştürme
        </h3>

        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Onaylanan teklifi açın</li>
            <li>
              <strong>"Siparişe Dönüştür"</strong> butonuna tıklayın
            </li>
            <li>Bilgiler otomatik aktarılır</li>
            <li>Gerekli düzenlemeleri yapın</li>
            <li>Siparişi kaydedin</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default QuoteSection;
