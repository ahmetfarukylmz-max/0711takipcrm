import React from 'react';

const ConnectionStatusIndicator = ({ status }) => {
    const getStatusStyles = () => {
        switch (status) {
            case 'Bağlandı':
                return { dot: 'bg-green-500', text: 'text-gray-300' };
            case 'Bağlanılıyor...':
                return { dot: 'bg-yellow-500 animate-pulse', text: 'text-gray-400' };
            case 'Bağlantı Hatası':
                return { dot: 'bg-red-500', text: 'text-red-400' };
            default:
                return { dot: 'bg-gray-500', text: 'text-gray-400' };
        }
    };

    const { dot, text } = getStatusStyles();

    return (
        <div className="mt-auto pt-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-2">
                <span className={`w-3 h-3 rounded-full ${dot}`}></span>
                <span className={`text-sm ${text}`}>{status}</span>
            </div>
        </div>
    );
};

export default ConnectionStatusIndicator;
