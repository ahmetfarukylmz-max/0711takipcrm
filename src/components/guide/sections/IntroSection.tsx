import React from 'react';

const IntroSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🔐 Giriş Yapma</h2>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">İlk Giriş</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Tarayıcınızda uygulamayı açın</li>
          <li>E-posta adresinizi ve şifrenizi girin</li>
          <li>"Giriş Yap" butonuna tıklayın</li>
        </ol>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Şifremi Unuttum</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>"Şifremi Unuttum" linkine tıklayın</li>
          <li>E-posta adresinizi girin</li>
          <li>Gelen maildeki linke tıklayarak yeni şifre oluşturun</li>
        </ol>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">💡 İpucu</h3>
        <p className="text-gray-700 dark:text-gray-300">
          Oturumunuz açık kalır, tekrar giriş yapmanıza gerek yoktur. Güvenli çıkış için sağ üst
          köşedeki kullanıcı menüsünden "Çıkış Yap"ı kullanın.
        </p>
      </div>
    </div>
  );
};

export default IntroSection;
