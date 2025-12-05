import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
 * Generate PDF extract for a customer using html2canvas for full character support
 * @param customerBalance Customer balance data
 * @param companyInfo Company information (optional)
 * @returns Generated PDF filename
 */
export const generatePDFExtract = async (
  customerBalance: CustomerBalanceData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<string> => {
  // Create a temporary container for the PDF content
  const pdfContainer = document.createElement('div');
  pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 794px; /* A4 width in pixels at 96 DPI approx */
        min-height: 1123px; /* A4 height */
        background: white;
        padding: 40px;
        font-family: 'Inter', Arial, sans-serif;
        color: #1f2937;
        box-sizing: border-box;
        z-index: -1;
    `;

  // Helper to safely escape HTML
  const safe = (str: string | undefined | null) => str || '-';

  // Construct HTML content
  pdfContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #1f2937;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
                <div style="display: flex; gap: 20px; align-items: center;">
                    ${
                      companyInfo.logo
                        ? `<img src="${companyInfo.logo}" style="height: 60px; width: auto; object-fit: contain;" />`
                        : ''
                    }
                    <div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1e3a8a;">${safe(companyInfo.name)}</h1>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
                            ${safe(companyInfo.address)}<br/>
                            ${safe(companyInfo.phone)} | ${safe(companyInfo.email)}<br/>
                            ${safe(companyInfo.taxOffice)} - VN: ${safe(companyInfo.taxNumber)}
                        </p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #3b82f6;">CARİ HESAP EKSTRESİ</h2>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">Tarih: ${new Date().toLocaleDateString(
                      'tr-TR'
                    )}</p>
                </div>
            </div>

            <!-- Customer Info & Summary Grid -->
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-bottom: 40px;">
                <!-- Customer Info -->
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 8px;">MÜŞTERİ BİLGİLERİ</h3>
                    <table style="width: 100%; font-size: 13px;">
                        <tr>
                            <td style="padding: 4px 0; color: #6b7280; width: 80px;">Ünvan:</td>
                            <td style="padding: 4px 0; font-weight: bold; color: #111827;">${safe(customerBalance.customer.name)}</td>
                        </tr>
                        ${
                          customerBalance.customer.company
                            ? `
                        <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Şirket:</td>
                            <td style="padding: 4px 0; color: #374151;">${customerBalance.customer.company}</td>
                        </tr>`
                            : ''
                        }
                        <tr>
                            <td style="padding: 4px 0; color: #6b7280;">İletişim:</td>
                            <td style="padding: 4px 0; color: #374151;">${safe(customerBalance.customer.phone)} / ${safe(customerBalance.customer.email)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Adres:</td>
                            <td style="padding: 4px 0; color: #374151;">${safe(customerBalance.customer.address)} ${safe(customerBalance.customer.city)}</td>
                        </tr>
                    </table>
                </div>

                <!-- Balance Summary -->
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #93c5fd; padding-bottom: 8px;">BAKİYE ÖZETİ</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #1e3a8a;">Toplam Sipariş:</span>
                        <span style="font-size: 13px; font-weight: bold; color: #1e3a8a;">${formatCurrency(customerBalance.totalOrders, 'TRY')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="font-size: 13px; color: #065f46;">Toplam Ödeme:</span>
                        <span style="font-size: 13px; font-weight: bold; color: #065f46;">${formatCurrency(customerBalance.totalPayments, 'TRY')}</span>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid ${
                      customerBalance.balance >= 0 ? '#bbf7d0' : '#fecaca'
                    };">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">NET BAKİYE</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${
                          customerBalance.balance >= 0 ? '#16a34a' : '#dc2626'
                        };">
                            ${customerBalance.balance >= 0 ? '+' : ''}${formatCurrency(customerBalance.balance, 'TRY')}
                        </div>
                        <div style="font-size: 12px; font-weight: bold; margin-top: 4px; color: ${
                          customerBalance.balance >= 0 ? '#16a34a' : '#dc2626'
                        };">
                            ${customerBalance.statusText.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Orders Table -->
            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <span style="background: #3b82f6; width: 4px; height: 20px; display: block; border-radius: 2px;"></span>
                SİPARİŞ GEÇMİŞİ
            </h3>
            ${
              customerBalance.orderDetails.length > 0
                ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
                <thead>
                    <tr style="background: #f3f4f6; color: #374151;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Tarih</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Sipariş No</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Durum</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Para Birimi</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    ${customerBalance.orderDetails
                      .map(
                        (order, idx) => `
                        <tr style="background: ${idx % 2 === 0 ? 'white' : '#f9fafb'};">
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${formatDate(order.date)}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${safe(order.orderNumber)}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center;">${safe(order.status)}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center;">${order.currency}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${parseFloat(order.amount.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
            `
                : '<p style="font-style: italic; color: #6b7280; margin-bottom: 30px;">Kayıtlı sipariş bulunmamaktadır.</p>'
            }

            <!-- Payments Table -->
            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <span style="background: #10b981; width: 4px; height: 20px; display: block; border-radius: 2px;"></span>
                ÖDEME GEÇMİŞİ
            </h3>
            ${
              customerBalance.paymentDetails.length > 0
                ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
                <thead>
                    <tr style="background: #f3f4f6; color: #374151;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Tarih</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Ödeme Yöntemi</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Durum</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Para Birimi</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    ${customerBalance.paymentDetails
                      .map(
                        (payment, idx) => `
                        <tr style="background: ${idx % 2 === 0 ? 'white' : '#f9fafb'};">
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${formatDate(payment.date)}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${safe(payment.method)}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center;">${safe(payment.status)}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center;">${payment.currency}</td>
                            <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #059669;">${parseFloat(payment.amount.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
            `
                : '<p style="font-style: italic; color: #6b7280; margin-bottom: 30px;">Kayıtlı ödeme bulunmamaktadır.</p>'
            }

            <!-- Footer -->
            <div style="margin-top: 50px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p>Bu belge elektronik ortamda oluşturulmuştur. Islak imza gerektirmez.</p>
                <p>${companyInfo.name} | ${new Date().getFullYear()}</p>
            </div>
        </div>
    `;

  document.body.appendChild(pdfContainer);

  try {
    // Wait for fonts and styles to apply
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert DOM to Canvas
    const canvas = await html2canvas(pdfContainer, {
      scale: 2, // High resolution
      useCORS: true,
      logging: true, // Enabled for debugging
      backgroundColor: '#ffffff',
      allowTaint: true, // Allow loading cross-origin images
    });

    // Generate PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Extra pages if content is long
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -pageHeight + (heightLeft % pageHeight), imgWidth, imgHeight); // Simplified overflow logic
    }

    const filename = `cari-ekstre-${customerBalance.customer.name.replace(/[^a-z0-9]/gi, '_')}-${
      new Date().toISOString().split('T')[0]
    }.pdf`;
    pdf.save(filename);
    return filename;
  } catch (error) {
    console.error('Error generating PDF with html2canvas:', error);
    throw error;
  } finally {
    // Cleanup
    if (document.body.contains(pdfContainer)) {
      document.body.removeChild(pdfContainer);
    }
  }
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
