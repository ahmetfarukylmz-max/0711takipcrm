import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { PlusIcon } from '../icons'; // Re-using PlusIcon for 'Yeni Ekle' type actions

interface QuickAction {
  label: string;
  icon: string | React.ReactNode; // Can be emoji or SVG component
  onClick: () => void;
}

interface QuickActionBarProps {
  // Add any necessary props for actions, e.g., onNewQuote, onNewCustomer, etc.
}

const QuickActionBar: React.FC<QuickActionBarProps> = memo(() => {
  const navigate = useNavigate();
  const setActivePage = useStore((state) => state.setActivePage); // To navigate to specific pages

  const quickActions: QuickAction[] = [
    {
      label: 'Hızlı Teklif Ver',
      icon: '📄', // Emoji for now, can be replaced with SVG
      onClick: () => {
        setActivePage('Teklifler'); // Navigate to Quotes page
        // You might want to open a modal here directly
      },
    },
    {
      label: 'Müşteri Ekle',
      icon: '👥', // Emoji for now
      onClick: () => {
        setActivePage('Müşteriler'); // Navigate to Customers page
        // Or directly open CustomerForm modal via a prop
      },
    },
    {
      label: 'Ödeme Al',
      icon: '💰', // Emoji for now
      onClick: () => {
        setActivePage('Ödemeler');
      },
    },
    {
      label: 'Stok Sorgula',
      icon: '🔍', // Emoji for now
      onClick: () => {
        setActivePage('Ürünler');
      },
    },
    {
      label: 'Sevkiyat Planla',
      icon: '🚚', // Emoji for now
      onClick: () => {
        setActivePage('Sevkiyat');
      },
    },
    // Add more quick actions as needed
  ];

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Sık Kullanılan İşlemler</h3>
      <div className="flex gap-4 overflow-x-auto hide-scroll pb-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm whitespace-nowrap"
          >
            {typeof action.icon === 'string' ? (
              <span className="text-xl">{action.icon}</span>
            ) : (
              action.icon
            )}
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

QuickActionBar.displayName = 'QuickActionBar';

export default QuickActionBar;
