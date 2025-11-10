/**
 * Excel Import Utilities
 *
 * Bu dosya Excel/CSV import işlemlerini ve validasyonlarını yönetir.
 */

import * as XLSX from 'xlsx';
import type { Customer, Product, Order, ImportResult, ExcelColumn } from '../types';

/**
 * Validation fonksiyonları
 */
const validators = {
  required: (value: any): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  email: (value: any): boolean => {
    if (!value) return true; // Optional email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(value));
  },

  phone: (value: any): boolean => {
    if (!value) return false;
    // Türkiye telefon formatı: 05XX XXX XXXX veya 5XXXXXXXXX
    const phoneRegex = /^(0?5\d{9})$/;
    const cleanPhone = String(value).replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
  },

  number: (value: any): boolean => {
    return !isNaN(Number(value));
  },

  positiveNumber: (value: any): boolean => {
    return !isNaN(Number(value)) && Number(value) >= 0;
  },
};

/**
 * Excel dosyasını oku
 */
export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // İlk sheet'i al
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // JSON'a çevir
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Dosya okunamadı: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Column mapping ve validation
 */
const validateRow = (
  row: any,
  columns: ExcelColumn[],
  rowIndex: number
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  columns.forEach(column => {
    const value = row[column.header];

    // Required check
    if (column.required && !validators.required(value)) {
      errors.push(`Satır ${rowIndex + 2}: "${column.header}" alanı zorunludur`);
    }

    // Type validation
    if (value && column.type) {
      switch (column.type) {
        case 'email':
          if (!validators.email(value)) {
            errors.push(`Satır ${rowIndex + 2}: "${column.header}" geçerli bir email değil`);
          }
          break;
        case 'phone':
          if (!validators.phone(value)) {
            errors.push(`Satır ${rowIndex + 2}: "${column.header}" geçerli bir telefon numarası değil`);
          }
          break;
        case 'number':
          if (!validators.number(value)) {
            errors.push(`Satır ${rowIndex + 2}: "${column.header}" geçerli bir sayı değil`);
          }
          break;
      }
    }

    // Custom validation
    if (value && column.validate) {
      const result = column.validate(value);
      if (typeof result === 'string') {
        errors.push(`Satır ${rowIndex + 2}: ${result}`);
      } else if (!result) {
        errors.push(`Satır ${rowIndex + 2}: "${column.header}" geçersiz değer`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Müşteri Import
 */
export const importCustomers = async (
  file: File
): Promise<{ customers: Partial<Customer>[]; result: ImportResult }> => {
  const columns: ExcelColumn[] = [
    { header: 'Müşteri Adı', key: 'name', required: true, type: 'string' },
    { header: 'Yetkili Kişi', key: 'contact_person', type: 'string' },
    { header: 'Telefon', key: 'phone', required: true, type: 'phone' },
    { header: 'E-posta', key: 'email', type: 'email' },
    { header: 'Adres', key: 'address', type: 'string' },
    { header: 'Şehir', key: 'city', type: 'string' },
  ];

  try {
    const rows = await readExcelFile(file);

    if (rows.length === 0) {
      return {
        customers: [],
        result: {
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, message: 'Dosya boş' }],
        },
      };
    }

    const customers: Partial<Customer>[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    let imported = 0;
    let failed = 0;

    rows.forEach((row, index) => {
      const validation = validateRow(row, columns, index);

      if (validation.valid) {
        // Telefonu temizle
        const cleanPhone = String(row['Telefon']).replace(/[\s-]/g, '');

        customers.push({
          name: row['Müşteri Adı'],
          contact_person: row['Yetkili Kişi'] || '',
          phone: cleanPhone,
          email: row['E-posta'] || '',
          address: row['Adres'] || '',
          city: row['Şehir'] || '',
          createdAt: new Date().toISOString(),
        });
        imported++;
      } else {
        validation.errors.forEach(error => {
          errors.push({ row: index + 2, message: error });
        });
        failed++;
      }
    });

    return {
      customers,
      result: {
        success: errors.length === 0,
        imported,
        failed,
        errors,
      },
    };
  } catch (error) {
    return {
      customers: [],
      result: {
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, message: (error as Error).message }],
      },
    };
  }
};

/**
 * Ürün Import
 */
export const importProducts = async (
  file: File
): Promise<{ products: Partial<Product>[]; result: ImportResult }> => {
  const columns: ExcelColumn[] = [
    { header: 'Ürün Adı', key: 'name', required: true, type: 'string' },
    {
      header: 'Maliyet Fiyatı',
      key: 'cost_price',
      required: true,
      type: 'number',
      validate: (v) => Number(v) >= 0 || 'Maliyet fiyatı negatif olamaz',
    },
    {
      header: 'Satış Fiyatı',
      key: 'selling_price',
      required: true,
      type: 'number',
      validate: (v) => Number(v) >= 0 || 'Satış fiyatı negatif olamaz',
    },
    { header: 'Birim', key: 'unit', required: true, type: 'string' },
    { header: 'Açıklama', key: 'description', type: 'string' },
  ];

  try {
    const rows = await readExcelFile(file);

    if (rows.length === 0) {
      return {
        products: [],
        result: {
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, message: 'Dosya boş' }],
        },
      };
    }

    const products: Partial<Product>[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    let imported = 0;
    let failed = 0;

    rows.forEach((row, index) => {
      const validation = validateRow(row, columns, index);

      if (validation.valid) {
        const costPrice = Number(row['Maliyet Fiyatı']);
        const sellingPrice = Number(row['Satış Fiyatı']);

        // Ek validasyon: Satış fiyatı maliyet fiyatından düşükse uyarı
        if (sellingPrice < costPrice) {
          errors.push({
            row: index + 2,
            message: `Uyarı: Satış fiyatı (${sellingPrice}) maliyet fiyatından (${costPrice}) düşük`,
          });
        }

        products.push({
          name: row['Ürün Adı'],
          cost_price: costPrice,
          selling_price: sellingPrice,
          unit: row['Birim'],
          description: row['Açıklama'] || '',
          createdAt: new Date().toISOString(),
        });
        imported++;
      } else {
        validation.errors.forEach(error => {
          errors.push({ row: index + 2, message: error });
        });
        failed++;
      }
    });

    return {
      products,
      result: {
        success: errors.length === 0 || (imported > 0 && failed === 0),
        imported,
        failed,
        errors,
      },
    };
  } catch (error) {
    return {
      products: [],
      result: {
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, message: (error as Error).message }],
      },
    };
  }
};

/**
 * Excel Template İndirme
 */
export const downloadCustomerTemplate = (): void => {
  const template = [
    {
      'Müşteri Adı': 'Örnek Şirket A.Ş.',
      'Yetkili Kişi': 'Ahmet Yılmaz',
      'Telefon': '05551234567',
      'E-posta': 'ahmet@ornek.com',
      'Adres': 'Örnek Mahalle No:1',
      'Şehir': 'İstanbul',
    },
    {
      'Müşteri Adı': 'Demo Ltd.',
      'Yetkili Kişi': 'Ayşe Demir',
      'Telefon': '05559876543',
      'E-posta': 'ayse@demo.com',
      'Adres': 'Demo Sokak No:5',
      'Şehir': 'Ankara',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(template);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteriler');
  XLSX.writeFile(workbook, 'musteri-import-sablonu.xlsx');
};

export const downloadProductTemplate = (): void => {
  const template = [
    {
      'Ürün Adı': 'Ürün A',
      'Maliyet Fiyatı': 100,
      'Satış Fiyatı': 150,
      'Birim': 'Adet',
      'Açıklama': 'Örnek ürün açıklaması',
    },
    {
      'Ürün Adı': 'Ürün B',
      'Maliyet Fiyatı': 200,
      'Satış Fiyatı': 280,
      'Birim': 'Kg',
      'Açıklama': 'Başka bir örnek ürün',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(template);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');
  XLSX.writeFile(workbook, 'urun-import-sablonu.xlsx');
};

/**
 * CSV formatını Excel'e çevir
 */
export const convertCSVtoExcel = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
