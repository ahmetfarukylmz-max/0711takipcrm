import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useStore from '../../store/useStore';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Zustand Store'dan veri sayılarını alalım
  const collections = useStore((state) => state.collections);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      setLogs((prev) => [...prev, `❌ ${args.join(' ')}`].slice(-5));
      originalError(...args);
    };

    console.warn = (...args) => {
      setLogs((prev) => [...prev, `⚠️ ${args.join(' ')}`].slice(-5));
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible)
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-0 left-0 bg-red-600 text-white p-1 text-xs z-50"
      >
        Debug
      </button>
    );

  return (
    <div className="fixed bottom-0 left-0 w-96 bg-black/95 text-green-400 p-4 z-50 text-xs font-mono border-t-2 border-green-500 max-h-96 overflow-auto shadow-2xl">
      <div className="flex justify-between mb-2 border-b border-gray-700 pb-1">
        <span className="font-bold text-white">Sistem Tanı Aracı v2</span>
        <button onClick={() => setIsVisible(false)} className="text-red-400 hover:text-red-300">
          [Kapat]
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="text-gray-400">API Key (İlk 5):</div>
          <div className="text-white">
            {import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 5) || 'YOK'}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Auth Domain:</div>
          <div className="text-white">{import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOK'}</div>
        </div>
      </div>

      <div className="mb-3 border-b border-gray-800 pb-2">
        <div className="text-gray-400">Kullanıcı Durumu:</div>
        {user ? (
          <div className="text-green-300">
            <span className="text-gray-500">UID:</span> {user.uid}
            <br />
            <span className="text-gray-500">Email:</span> {user.email}
          </div>
        ) : (
          <div className="text-yellow-500">Giriş Yapılmadı</div>
        )}
      </div>

      <div className="mb-3 border-b border-gray-800 pb-2">
        <div className="text-white font-bold mb-1">Store Verileri (Zustand):</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
          <div>
            Müşteriler:{' '}
            <span className="text-white font-bold">{collections.customers?.length || 0}</span>
          </div>
          <div>
            Siparişler:{' '}
            <span className="text-white font-bold">{collections.orders?.length || 0}</span>
          </div>
          <div>
            Ürünler:{' '}
            <span className="text-white font-bold">{collections.products?.length || 0}</span>
          </div>
          <div>
            Teklifler:{' '}
            <span className="text-white font-bold">{collections.teklifler?.length || 0}</span>
          </div>
          <div>
            Görüşmeler:{' '}
            <span className="text-white font-bold">{collections.gorusmeler?.length || 0}</span>
          </div>
          <div>
            Ödemeler:{' '}
            <span className="text-white font-bold">{collections.payments?.length || 0}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-gray-400 mb-1">Konsol (Son 5):</div>
        {logs.length === 0 ? (
          <div className="text-gray-600 italic">Temiz.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-xs mb-1 break-all font-mono">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
