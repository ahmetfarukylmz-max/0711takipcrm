import React, { useState, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import useStore from '../../store/useStore';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon,
  UsersIcon,
  BoxIcon as CubeIcon, // Re-map BoxIcon to CubeIcon for semantic clarity
  DocumentTextIcon,
  TruckIcon,
  CreditCardIcon,
  ChartBarIcon,
  PlusIcon,
} from '../icons';

// Missing icons defined locally for now to fix build error
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

// --- TYPES ---

type CommandGroup = 'Sayfalar' | 'İşlemler' | 'Müşteriler' | 'Ürünler' | 'Siparişler';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  group: CommandGroup;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[]; // For better search matching (aliases)
}

// --- ICONS ---
// (We reuse existing icons or simple SVGs for the palette)

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Store Data
  const customers = useStore((state) => state.collections.customers) || [];
  const products = useStore((state) => state.collections.products) || [];
  const orders = useStore((state) => state.collections.orders) || [];
  const quotes = useStore((state) => state.collections.teklifler) || [];

  // Toggle Logic
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

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
        icon: <ShoppingCartIcon className="w-5 h-5" />, // Using shopping cart for purchasing too
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

    // 2. Global Actions (Shortcuts)
    // We navigate to the page and use state/query params to trigger the modal
    // Note: For this to work perfectly, pages need to listen to location state.
    // As a simple v1, we just navigate to the page.
    items.push(
      {
        id: 'act-new-customer',
        title: 'Yeni Müşteri Ekle',
        group: 'İşlemler',
        icon: <PlusIcon className="w-5 h-5" />,
        action: () => {
          navigate('/customers');
          // In a real app, we would dispatch an event or use context to open the modal
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

    // 3. Data: Customers
    customers.forEach((c) => {
      items.push({
        id: `cust-${c.id}`,
        title: c.name,
        subtitle: c.phone || c.email || 'İletişim bilgisi yok',
        group: 'Müşteriler',
        icon: <UsersIcon className="w-4 h-4 text-gray-500" />,
        action: () => {
          // Navigate to customers page - ideally would filter or open detail
          navigate('/customers');
          // We can improve this later to open specific customer detail
        },
        keywords: [c.contact_person || '', c.email || '', c.phone || ''],
      });
    });

    // 4. Data: Products
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

  // --- FUZZY SEARCH LOGIC ---

  const filteredItems = useMemo(() => {
    if (!search) return allCommands;

    const fuse = new Fuse(allCommands, {
      keys: ['title', 'keywords', 'subtitle'],
      threshold: 0.3, // 0.0 = perfect match, 1.0 = match anything. 0.3 is good for fuzzy.
      distance: 100,
    });

    return fuse.search(search).map((result) => result.item);
  }, [search, allCommands]);

  // Group items for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      Sayfalar: [],
      İşlemler: [],
      Müşteriler: [],
      Ürünler: [],
      Siparişler: [],
    };

    filteredItems.forEach((item) => {
      if (groups[item.group]) {
        groups[item.group].push(item);
      }
    });

    return groups;
  }, [filteredItems]);

  const handleSelect = (item: CommandItem) => {
    item.action();
    setOpen(false);
    setSearch('');
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className={isDarkMode ? 'dark' : ''}
    >
      <div className="flex items-center border-b border-gray-100 dark:border-gray-700 px-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Ne yapmak istiyorsunuz? (Sayfa, Müşteri, Ürün...)"
        />
        <div className="flex items-center gap-1">
          <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>
      </div>

      <Command.List>
        <Command.Empty>Sonuç bulunamadı.</Command.Empty>

        {/* Render Groups */}
        {Object.entries(groupedItems).map(([groupName, items]) => {
          if (items.length === 0) return null;

          return (
            <Command.Group key={groupName} heading={groupName}>
              {items.slice(0, 5).map(
                (
                  item // Limit to 5 items per group to avoid clutter
                ) => (
                  <Command.Item
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    value={item.title + ' ' + (item.keywords?.join(' ') || '')} // Value used for internal filtering if we didn't use Fuse
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                        {item.icon}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </Command.Item>
                )
              )}
            </Command.Group>
          );
        })}
      </Command.List>

      <div className="border-t border-gray-100 dark:border-gray-700 p-2 flex justify-between items-center text-xs text-gray-400 px-4 bg-gray-50 dark:bg-gray-800/50">
        <span>Takip CRM</span>
        <div className="flex gap-2">
          <span>Seçmek için ↵</span>
          <span>Gezinmek için ↑↓</span>
        </div>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
