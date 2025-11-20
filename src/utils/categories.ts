/**
 * Product Categories Configuration
 *
 * Bu dosya ürün kategorilerini tanımlar.
 * Yeni kategori eklemek veya mevcut kategorileri düzenlemek için bu dosyayı güncelleyin.
 */

export interface CategoryDefinition {
  id: string;
  name: string;
  icon?: string; // Emoji or icon
  subcategories: string[];
}

/**
 * Predefined product categories
 * Türkiye pazarına uygun genel kategoriler
 */
export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'elektronik',
    name: 'Elektronik',
    icon: '💻',
    subcategories: [
      'Bilgisayar',
      'Telefon',
      'Tablet',
      'Aksesuar',
      'Ses Sistemleri',
      'Kamera',
      'Oyun Konsolları',
      'Akıllı Saat',
      'Diğer'
    ]
  },
  {
    id: 'gida',
    name: 'Gıda',
    icon: '🍎',
    subcategories: [
      'İçecek',
      'Atıştırmalık',
      'Temel Gıda',
      'Şeker & Şekerleme',
      'Baharat',
      'Organik Ürünler',
      'Dondurulmuş',
      'Diğer'
    ]
  },
  {
    id: 'tekstil',
    name: 'Tekstil',
    icon: '👕',
    subcategories: [
      'Giyim',
      'Ayakkabı',
      'Çanta',
      'Aksesuar',
      'Ev Tekstili',
      'Çocuk Giyim',
      'Spor Giyim',
      'Diğer'
    ]
  },
  {
    id: 'mobilya',
    name: 'Mobilya',
    icon: '🛋️',
    subcategories: [
      'Oturma Odası',
      'Yatak Odası',
      'Mutfak',
      'Banyo',
      'Çalışma Odası',
      'Çocuk Odası',
      'Bahçe Mobilyası',
      'Ofis Mobilyası',
      'Diğer'
    ]
  },
  {
    id: 'kozmetik',
    name: 'Kozmetik',
    icon: '💄',
    subcategories: [
      'Cilt Bakım',
      'Makyaj',
      'Saç Bakım',
      'Parfüm',
      'Kişisel Bakım',
      'Erkek Bakım',
      'Güneş Ürünleri',
      'Diğer'
    ]
  },
  {
    id: 'ev-yasam',
    name: 'Ev & Yaşam',
    icon: '🏠',
    subcategories: [
      'Beyaz Eşya',
      'Küçük Ev Aletleri',
      'Mutfak Gereçleri',
      'Temizlik Ürünleri',
      'Dekorasyon',
      'Aydınlatma',
      'Bahçe',
      'Diğer'
    ]
  },
  {
    id: 'otomotiv',
    name: 'Otomotiv',
    icon: '🚗',
    subcategories: [
      'Yedek Parça',
      'Aksesuar',
      'Bakım Ürünleri',
      'Lastik',
      'Akü',
      'Motor Yağı',
      'Araç İçi',
      'Diğer'
    ]
  },
  {
    id: 'spor-outdoor',
    name: 'Spor & Outdoor',
    icon: '⚽',
    subcategories: [
      'Fitness',
      'Futbol',
      'Basketbol',
      'Koşu',
      'Yüzme',
      'Kamp & Doğa',
      'Bisiklet',
      'Diğer'
    ]
  },
  {
    id: 'kitap-hobi',
    name: 'Kitap & Hobi',
    icon: '📚',
    subcategories: [
      'Kitap',
      'Dergi',
      'Kırtasiye',
      'Müzik Aletleri',
      'Sanat Malzemeleri',
      'Oyuncak',
      'Puzzle & Zeka Oyunları',
      'Diğer'
    ]
  },
  {
    id: 'insaat-yapi',
    name: 'İnşaat & Yapı',
    icon: '🔨',
    subcategories: [
      'Boya',
      'Elektrik Malzemeleri',
      'Hırdavat',
      'Alet & Takım',
      'Yapı Malzemeleri',
      'Isıtma & Soğutma',
      'Su Tesisatı',
      'Diğer'
    ]
  }
];

/**
 * Get category by ID
 */
export const getCategoryById = (id: string): CategoryDefinition | undefined => {
  return PRODUCT_CATEGORIES.find(cat => cat.id === id);
};

/**
 * Get category name by ID
 */
export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category ? category.name : 'Kategorisiz';
};

/**
 * Get subcategories by category ID
 */
export const getSubcategories = (categoryId: string): string[] => {
  const category = getCategoryById(categoryId);
  return category ? category.subcategories : [];
};

/**
 * Get all category IDs
 */
export const getAllCategoryIds = (): string[] => {
  return PRODUCT_CATEGORIES.map(cat => cat.id);
};

/**
 * Get category with icon
 */
export const getCategoryWithIcon = (id: string): string => {
  const category = getCategoryById(id);
  if (!category) return 'Kategorisiz';
  return category.icon ? `${category.icon} ${category.name}` : category.name;
};
