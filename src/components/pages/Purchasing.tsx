import React from 'react';
import PageLoader from '../common/PageLoader';

const Purchasing: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Satınalma Yönetimi</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick={() => alert('Henüz aktif değil')}
        >
          <span>➕</span>
          <span>Yeni Talep</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center py-12">
        <div className="text-6xl mb-4">🏗️</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Kanban Panosu Hazırlanıyor
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sürükle bırak özellikli satınalma modülü kurulum aşamasındadır.
        </p>
      </div>
    </div>
  );
};

export default Purchasing;
