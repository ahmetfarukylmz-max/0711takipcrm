import React from 'react';

const MeetingSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">💬 Görüşme Takibi</h2>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ➕ Yeni Görüşme Kaydı
        </h3>

        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">Müşteri etkileşimlerinizi kaydedin:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Müşteri</strong> - Kimle görüşüldü
            </li>
            <li>
              <strong>Tarih</strong> - Görüşme tarihi
            </li>
            <li>
              <strong>Görüşme Şekli</strong> - Telefon, Yüz yüze, E-posta, Online
            </li>
            <li>
              <strong>Konu</strong> - Ne konuşuldu
            </li>
            <li>
              <strong>Notlar</strong> - Detaylı açıklama
            </li>
            <li>
              <strong>Sonraki Adım</strong> - Takip gerekli mi?
            </li>
            <li>
              <strong>Hatırlatma</strong> - Gelecek aksiyon tarihi
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '📞', text: 'Telefon' },
          { icon: '🤝', text: 'Yüz Yüze' },
          { icon: '📧', text: 'E-posta' },
          { icon: '💻', text: 'Online' },
        ].map((item) => (
          <div
            key={item.text}
            className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow text-center"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.text}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          ⏰ Hatırlatmalar
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          Sistem, belirlediğiniz tarihte hatırlatma yapar. Dashboard'da yaklaşan görüşmeler görünür.
        </p>
      </div>
    </div>
  );
};

export default MeetingSection;
