import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import useStore from '../../store/useStore';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon,
  UsersIcon,
  BoxIcon as CubeIcon,
  DocumentTextIcon,
  TruckIcon,
  CreditCardIcon,
  ChartBarIcon,
  PlusIcon,
} from '../icons';

// Missing icons defined locally
const PhoneIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const ShoppingCartIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const MagnifyingGlassIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

type CommandGroup = 'Sayfalar' | 'İşlemler' | 'Müşteriler' | 'Ürünler';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  group: CommandGroup;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Store Data
  const customers = useStore((state) => state.collections.customers) || [];
  const products = useStore((state) => state.collections.products) || [];

  // Toggle Logic
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  // --- COMMAND GENERATION ---
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Navigation Pages
    items.push(
      {
        id: 'nav-home',
        title: 'Ana Sayfa',
        group: 'Sayfalar',
        icon: <HomeIcon className="w-5 h-5" />,
        action: () => navigate('/'),
        keywords: ['dashboard', 'pano', 'özet'],
      },
      {
        id: 'nav-customers',
        title: 'Müşteriler',
        group: 'Sayfalar',
        icon: <UsersIcon className="w-5 h-5" />,
        action: () => navigate('/customers'),
        keywords: ['firma', 'kişi', 'rehber'],
      },
      {
        id: 'nav-products',
        title: 'Ürünler',
        group: 'Sayfalar',
        icon: <CubeIcon className="w-5 h-5" />,
        action: () => navigate('/products'),
        keywords: ['stok', 'malzeme', 'depo', 'envanter'],
      },
      {
        id: 'nav-orders',
        title: 'Siparişler',
        group: 'Sayfalar',
        icon: <ShoppingCartIcon className="w-5 h-5" />,
        action: () => navigate('/orders'),
        keywords: ['satış', 'bekleyen'],
      },
      {
        id: 'nav-quotes',
        title: 'Teklifler',
        group: 'Sayfalar',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        action: () => navigate('/quotes'),
        keywords: ['fiyat', 'proforma'],
      },
      {
        id: 'nav-meetings',
        title: 'Görüşmeler',
        group: 'Sayfalar',
        icon: <PhoneIcon className="w-5 h-5" />,
        action: () => navigate('/meetings'),
        keywords: ['randevu', 'toplantı', 'ziyaret'],
      },
      {
        id: 'nav-shipments',
        title: 'Sevkiyatlar',
        group: 'Sayfalar',
        icon: <TruckIcon className="w-5 h-5" />,
        action: () => navigate('/shipments'),
        keywords: ['lojistik', 'kargo', 'teslimat'],
      },
      {
        id: 'nav-payments',
        title: 'Ödemeler',
        group: 'Sayfalar',
        icon: <CreditCardIcon className="w-5 h-5" />,
        action: () => navigate('/payments'),
        keywords: ['tahsilat', 'çek', 'senet', 'finans'],
      },
      {
        id: 'nav-reports',
        title: 'Raporlar',
        group: 'Sayfalar',
        icon: <ChartBarIcon className="w-5 h-5" />,
        action: () => navigate('/reports'),
        keywords: ['analiz', 'grafik', 'istatistik', 'ciro'],
      },
      {
        id: 'nav-purchasing',
        title: 'Satınalma Yönetimi',
        group: 'Sayfalar',
        icon: <ShoppingCartIcon className="w-5 h-5" />,
        action: () => navigate('/purchasing'),
        keywords: ['tedarik', 'talep', 'giriş'],
      },
      {
        id: 'nav-balances',
        title: 'Cari Hesaplar',
        group: 'Sayfalar',
        icon: <CreditCardIcon className="w-5 h-5" />,
        action: () => navigate('/balances'),
        keywords: ['borç', 'alacak', 'bakiye', 'ekstre'],
      }
    );

    // 2. Global Actions
    items.push(
      {
        id: 'act-new-customer',
        title: 'Yeni Müşteri Ekle',
        group: 'İşlemler',
        icon: <PlusIcon className="w-5 h-5" />,
        action: () => {
          navigate('/customers');
          setTimeout(() => document.querySelector('[data-action="add-customer"]')?.click(), 100);
        },
        keywords: ['oluştur', 'kayıt'],
      },
      {
        id: 'act-new-order',
        title: 'Yeni Sipariş Oluştur',
        group: 'İşlemler',
        icon: <PlusIcon className="w-5 h-5" />,
        action: () => {
          navigate('/orders');
          setTimeout(() => document.querySelector('[data-action="add-order"]')?.click(), 100);
        },
        keywords: ['satış gir'],
      },
      {
        id: 'act-new-quote',
        title: 'Yeni Teklif Hazırla',
        group: 'İşlemler',
        icon: <PlusIcon className="w-5 h-5" />,
        action: () => {
          navigate('/quotes');
          setTimeout(() => document.querySelector('[data-action="add-quote"]')?.click(), 100);
        },
        keywords: ['fiyat ver'],
      }
    );

    // 3. Customers
    customers.forEach((c) => {
      items.push({
        id: `cust-${c.id}`,
        title: c.name,
        subtitle: c.phone || c.email || 'İletişim bilgisi yok',
        group: 'Müşteriler',
        icon: <UsersIcon className="w-4 h-4 text-gray-500" />,
        action: () => navigate('/customers'),
        keywords: [c.contact_person || '', c.email || '', c.phone || ''],
      });
    });

    // 4. Products
    products.forEach((p) => {
      items.push({
        id: `prod-${p.id}`,
        title: p.name,
        subtitle: `${p.stock_quantity || 0} ${p.unit} Stokta`,
        group: 'Ürünler',
        icon: <CubeIcon className="w-4 h-4 text-gray-500" />,
        action: () => navigate('/products'),
        keywords: [p.code || '', 'stok'],
      });
    });

    return items;
  }, [navigate, customers, products]);

  // --- FILTERING ---
  const filteredItems = useMemo(() => {
    if (!search) return allCommands.slice(0, 20); // Show recent/default items

    const fuse = new Fuse(allCommands, {
      keys: ['title', 'keywords', 'subtitle'],
      threshold: 0.3,
      distance: 100,
    });

    return fuse
      .search(search)
      .map((result) => result.item)
      .slice(0, 50);
  }, [search, allCommands]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          setOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [open, filteredItems, selectedIndex]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll to selected item
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden p-4 sm:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity bg-gray-900/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative mx-auto max-w-xl transform divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
            placeholder="Ne yapmak istiyorsunuz? (Sayfa, Müşteri, Ürün...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] scroll-py-3 overflow-y-auto p-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => {
                  item.action();
                  setOpen(false);
                }}
                className={`
                  group flex cursor-default select-none rounded-xl p-3 items-center gap-3
                  ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <div
                  className={`
                  flex h-10 w-10 flex-none items-center justify-center rounded-lg
                  ${
                    index === selectedIndex
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }
                `}
                >
                  {item.icon}
                </div>
                <div className="flex-auto truncate">
                  <p
                    className={`truncate text-sm font-medium ${index === selectedIndex ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}
                  >
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p
                      className={`truncate text-xs ${index === selectedIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {index === selectedIndex && (
                  <span className="text-xs text-blue-600 dark:text-blue-300 font-medium px-2">
                    Giriş ↵
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="py-14 text-center text-sm sm:px-14">
              <CubeIcon className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">Sonuç bulunamadı</p>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Farklı bir arama terimi deneyin.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
          <span>Takip CRM</span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <kbd className="font-sans text-gray-400 dark:text-gray-500">↑↓</kbd> Seç
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-sans text-gray-400 dark:text-gray-500">↵</kbd> Git
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-sans text-gray-400 dark:text-gray-500">ESC</kbd> Kapat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
