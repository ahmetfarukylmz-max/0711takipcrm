import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      setLogs((prev) => [...prev, args.join(' ')].slice(-5));
      originalError(...args);
    };

    return () => {
      console.error = originalError;
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
    <div className="fixed bottom-0 left-0 w-96 bg-black/90 text-green-400 p-4 z-50 text-xs font-mono border-t-2 border-green-500 max-h-64 overflow-auto">
      <div className="flex justify-between mb-2 border-b border-gray-700 pb-1">
        <span className="font-bold text-white">Sistem Tanı Aracı</span>
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

      <div className="mb-3">
        <div className="text-gray-400">Kullanıcı Durumu:</div>
        {user ? (
          <div className="text-green-300">
            UID: {user.uid}
            <br />
            Email: {user.email}
          </div>
        ) : (
          <div className="text-yellow-500">Giriş Yapılmadı</div>
        )}
      </div>

      <div>
        <div className="text-gray-400 mb-1">Son Hatalar:</div>
        {logs.length === 0 ? (
          <div className="text-gray-600 italic">Hata kaydı yok.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-red-400 border-l-2 border-red-900 pl-2 mb-1 break-all">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
