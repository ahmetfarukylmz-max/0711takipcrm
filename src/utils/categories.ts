/**
 * Product Categories Configuration
 *
 * Metal sac türleri için kategori tanımlamaları
 */

export interface CategoryDefinition {
  id: string;
  name: string;
  icon?: string;
  prefix?: string;
}

/**
 * Metal sac türleri kategorileri
 */
export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'galvaniz',
    name: 'Galvaniz',
    icon: '🔷',
    prefix: 'GLV'
  },
  {
    id: 'dkp',
    name: 'DKP',
    icon: '⚪',
    prefix: 'DKP'
  },
  {
    id: 'siyah',
    name: 'Siyah',
    icon: '⚫',
    prefix: 'SYH'
  },
  {
    id: 'boyali',
    name: 'Boyalı',
    icon: '🎨',
    prefix: 'BYL'
  },
  {
    id: 'baklavali-sac',
    name: 'Baklavalı Sac',
    icon: '◆',
    prefix: 'BKL'
  },
  {
    id: 'hrp',
    name: 'HRP',
    icon: '🔶',
    prefix: 'HRP'
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
