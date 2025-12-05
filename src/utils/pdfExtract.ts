import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

/**
 * Company information for PDF header
 */
interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxOffice?: string;
  taxNumber?: string;
  logo?: string; // Base64 image data
}

/**
 * Customer balance data for PDF
 */
interface CustomerBalanceData {
  customer: {
    id: string;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    taxOffice?: string;
    taxNumber?: string;
  };
  totalOrders: number;
  totalPayments: number;
  balance: number;
  status: 'alacak' | 'borc' | 'dengede';
  statusText: string;
  orderDetails: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    orderNumber?: string;
    status?: string;
  }>;
  paymentDetails: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
  }>;
}

/**
 * Default company information
 */
const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Şirket Adı',
  address: 'Şirket Adresi',
  phone: '0XXX XXX XX XX',
  email: 'info@sirket.com',
  taxOffice: 'Vergi Dairesi',
  taxNumber: 'XXXXXXXXXX',
};

/**
 * Generate PDF extract for a customer
 * @param customerBalance Customer balance data
 * @param companyInfo Company information (optional)
 * @returns Generated PDF filename
 */
export const generatePDFExtract = async (
  customerBalance: CustomerBalanceData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<string> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 20;

  // ===== HEADER SECTION =====
  // Company Logo (if provided)
  if (companyInfo.logo) {
    try {
      doc.addImage(companyInfo.logo, 'PNG', 15, 10, 30, 30);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Company Information (Top Right)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  if (companyInfo.name) {
    doc.text(companyInfo.name, pageWidth - 15, 12, { align: 'right' });
  }
  if (companyInfo.address) {
    doc.text(companyInfo.address, pageWidth - 15, 17, { align: 'right' });
  }
  if (companyInfo.phone) {
    doc.text(`Tel: ${companyInfo.phone}`, pageWidth - 15, 22, { align: 'right' });
  }
  if (companyInfo.email) {
    doc.text(companyInfo.email, pageWidth - 15, 27, { align: 'right' });
  }
  if (companyInfo.taxOffice && companyInfo.taxNumber) {
    doc.text(`${companyInfo.taxOffice} - VN: ${companyInfo.taxNumber}`, pageWidth - 15, 32, {
      align: 'right',
    });
  }

  // Main Title
  yPos = 50;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CARİ HESAP EKSTRESİ', pageWidth / 2, yPos, { align: 'center' });

  // Divider line
  yPos += 5;
  doc.setDrawColor(59, 130, 246); // Blue color
  doc.setLineWidth(0.8);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // ===== CUSTOMER INFORMATION =====
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Müşteri Bilgileri', 15, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const customerInfoLines = [
    { label: 'Müşteri Adı:', value: customerBalance.customer.name },
    { label: 'Şirket:', value: customerBalance.customer.company || '-' },
    { label: 'Telefon:', value: customerBalance.customer.phone || '-' },
    { label: 'E-posta:', value: customerBalance.customer.email || '-' },
    { label: 'Adres:', value: customerBalance.customer.address || '-' },
    { label: 'Şehir:', value: customerBalance.customer.city || '-' },
  ];

  customerInfoLines.forEach((info) => {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, 45, yPos);
    yPos += 5;
  });

  // Extract Date
  yPos += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Ekstre Tarihi:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('tr-TR'), 45, yPos);

  // ===== SUMMARY BOX =====
  yPos += 8;
  const boxHeight = 38;

  // Background box
  doc.setFillColor(240, 247, 255); // Light blue background
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, boxHeight, 'FD');

  yPos += 10;

  // Summary data - Left column
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('Toplam Sipariş:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(customerBalance.totalOrders, 'TRY'), 70, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Toplam Ödeme:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(customerBalance.totalPayments, 'TRY'), 70, yPos);

  yPos += 7;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');

  // Color based on balance
  if (customerBalance.balance >= 0) {
    doc.setTextColor(0, 128, 0); // Green for credit
  } else {
    doc.setTextColor(255, 0, 0); // Red for debit
  }

  doc.text('NET BAKİYE:', 20, yPos);
  const balanceText =
    (customerBalance.balance >= 0 ? '+' : '') + formatCurrency(customerBalance.balance, 'TRY');
  doc.text(balanceText, 70, yPos);

  doc.setTextColor(0, 0, 0);

  // Summary data - Right column
  yPos -= 14;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sipariş Sayısı:', pageWidth / 2 + 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(customerBalance.orderDetails.length), pageWidth - 30, yPos, { align: 'right' });

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Ödeme Sayısı:', pageWidth / 2 + 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(customerBalance.paymentDetails.length), pageWidth - 30, yPos, { align: 'right' });

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Durum:', pageWidth / 2 + 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(customerBalance.statusText, pageWidth - 30, yPos, { align: 'right' });

  // ===== ORDER DETAILS TABLE =====
  yPos += 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('📦 Sipariş Detayları', 15, yPos);

  yPos += 5;

  if (customerBalance.orderDetails.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Tarih', 'Sipariş No', 'Tutar', 'Para Birimi', 'Durum']],
      body: customerBalance.orderDetails.map((order) => [
        formatDate(order.date),
        order.orderNumber || '-',
        parseFloat(order.amount.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        order.currency,
        order.status || 'Bekliyor',
      ]),
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center' as const,
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { halign: 'left' as const, cellWidth: 25 },
        1: { halign: 'center' as const, cellWidth: 30 },
        2: { halign: 'right' as const, cellWidth: 30 },
        3: { halign: 'center' as const, cellWidth: 25 },
        4: { halign: 'center' as const, cellWidth: 'auto' as any },
      },
      margin: { left: 15, right: 15 },
      theme: 'grid' as const,
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Henüz sipariş bulunmamaktadır.', 15, yPos + 10);
    yPos += 20;
  }

  // ===== PAYMENT DETAILS TABLE =====
  // Check if we need a new page
  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('💰 Ödeme Detayları', 15, yPos);

  yPos += 5;

  if (customerBalance.paymentDetails.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Tarih', 'Tutar', 'Para Birimi', 'Ödeme Yöntemi', 'Durum']],
      body: customerBalance.paymentDetails.map((payment) => [
        formatDate(payment.date),
        parseFloat(payment.amount.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        payment.currency,
        payment.method,
        payment.status,
      ]),
      headStyles: {
        fillColor: [16, 185, 129], // Green
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center' as const,
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { halign: 'left' as const, cellWidth: 25 },
        1: { halign: 'right' as const, cellWidth: 30 },
        2: { halign: 'center' as const, cellWidth: 25 },
        3: { halign: 'left' as const, cellWidth: 35 },
        4: { halign: 'center' as const, cellWidth: 'auto' as any },
      },
      margin: { left: 15, right: 15 },
      theme: 'grid' as const,
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Henüz ödeme bulunmamaktadır.', 15, yPos + 10);
  }

  // ===== FOOTER =====
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);

    // Page number (center)
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Generation date (left)
    doc.text(`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, 15, pageHeight - 10);

    // Company name (right)
    doc.text(companyInfo.name, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  // Generate filename
  const customerName = customerBalance.customer.name.replace(/[^a-z0-9]/gi, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `cari-ekstre-${customerName}-${dateStr}.pdf`;

  // Save PDF
  doc.save(filename);

  return filename;
};

/**
 * Generate bulk PDF extracts for multiple customers
 * @param customerBalances Array of customer balance data
 * @param companyInfo Company information
 * @returns Array of generated filenames
 */
export const generateBulkPDFExtracts = async (
  customerBalances: CustomerBalanceData[],
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<string[]> => {
  const filenames: string[] = [];

  for (const customerBalance of customerBalances) {
    try {
      const filename = await generatePDFExtract(customerBalance, companyInfo);
      filenames.push(filename);

      // Small delay to prevent browser from blocking multiple downloads
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error generating PDF for ${customerBalance.customer.name}:`, error);
    }
  }

  return filenames;
};
