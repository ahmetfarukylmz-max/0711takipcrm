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
  // 1. MERGE AND SORT TRANSACTIONS
  const allTransactions = [
    ...customerBalance.orderDetails.map((order) => ({
      date: order.date,
      type: 'order',
      description: `Sipariş #${order.orderNumber || '-'}`,
      debt: order.amount, // Borç (Müşteri borçlanır)
      credit: 0, // Alacak
      originalCurrency: order.currency,
    })),
    ...customerBalance.paymentDetails.map((payment) => ({
      date: payment.date,
      type: 'payment',
      description: `Ödeme (${payment.method})`,
      debt: 0,
      credit: payment.amount, // Alacak (Müşteri ödeme yapar, alacaklanır)
      originalCurrency: payment.currency,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. CALCULATE RUNNING BALANCE
  let runningBalance = 0;
  const transactionsWithBalance = allTransactions.map((t) => {
    // Borç artırır (+), Alacak azaltır (-) (Müşteri bakiyesi perspektifinden: Pozitif bakiye = Borçlu)
    // Ancak genellikle Cari Ekstrelerde:
    // Borç (Debt) = Mal/Hizmet Satışı
    // Alacak (Credit) = Ödeme/Tahsilat
    // Bakiye = Borç - Alacak
    runningBalance += t.debt - t.credit;
    return { ...t, balance: runningBalance };
  });

  // Create a temporary container for the PDF content
  const pdfContainer = document.createElement('div');
  pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 794px; /* A4 width in pixels at 96 DPI approx */
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        color: #1f2937;
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
                        ? `<img src="${companyInfo.logo}" style="height: 80px; width: auto; object-fit: contain;" crossorigin="anonymous" />`
                        : `<div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">${companyInfo.name.substring(0, 2).toUpperCase()}</div>`
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
                        <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Vergi D.:</td>
                            <td style="padding: 4px 0; color: #374151;">${safe(customerBalance.customer.taxOffice)} - ${safe(customerBalance.customer.taxNumber)}</td>
                        </tr>
                    </table>
                </div>

                <!-- Balance Summary -->
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #93c5fd; padding-bottom: 8px;">BAKİYE ÖZETİ</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #1e3a8a;">Toplam Borç (Sipariş):</span>
                        <span style="font-size: 13px; font-weight: bold; color: #1e3a8a;">${formatCurrency(customerBalance.totalOrders, 'TRY')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #1e3a8a;">İşlem Sayısı:</span>
                        <span style="font-size: 13px; font-weight: bold; color: #1e3a8a;">${transactionsWithBalance.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="font-size: 13px; color: #065f46;">Toplam Alacak (Ödeme):</span>
                        <span style="font-size: 13px; font-weight: bold; color: #065f46;">${formatCurrency(customerBalance.totalPayments, 'TRY')}</span>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid ${
                      customerBalance.balance > 0 ? '#fecaca' : '#bbf7d0'
                    };">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">GENEL BAKİYE</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${
                          customerBalance.balance > 0 ? '#dc2626' : '#16a34a'
                        };">
                            ${customerBalance.balance > 0 ? '(Borçlu) ' : '(Alacaklı) '}${formatCurrency(Math.abs(customerBalance.balance), 'TRY')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Consolidated Transactions Table -->
            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <span style="background: #3b82f6; width: 4px; height: 20px; display: block; border-radius: 2px;"></span>
                HESAP HAREKETLERİ
            </h3>
            ${
              transactionsWithBalance.length > 0
                ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
                <thead>
                    <tr style="background: #f3f4f6; color: #374151; border-bottom: 2px solid #e5e7eb;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; width: 15%;">Tarih</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; width: 35%;">Açıklama</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; width: 15%; color: #dc2626;">Borç</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; width: 15%; color: #16a34a;">Alacak</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; width: 20%;">Bakiye (B) / (A)</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactionsWithBalance
                      .map(
                        (t, idx) => `
                        <tr style="background: ${idx % 2 === 0 ? 'white' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 12px; color: #4b5563;">${formatDate(t.date)}</td>
                            <td style="padding: 10px 12px; color: #1f2937; font-weight: 500;">${t.description}</td>
                            <td style="padding: 10px 12px; text-align: right; color: #dc2626;">${t.debt > 0 ? formatCurrency(t.debt) : '-'}</td>
                            <td style="padding: 10px 12px; text-align: right; color: #16a34a;">${t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: ${t.balance > 0 ? '#dc2626' : '#16a34a'};">
                                ${formatCurrency(Math.abs(t.balance))} ${t.balance > 0 ? '(B)' : t.balance < 0 ? '(A)' : ''}
                            </td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
            `
                : '<p style="font-style: italic; color: #6b7280; margin-bottom: 30px; padding: 20px; text-align: center; background: #f9fafb; border-radius: 8px;">Bu dönem için kayıtlı hesap hareketi bulunmamaktadır.</p>'
            }

            <!-- Bank Details Placeholder -->
            <div style="margin-top: 40px; padding: 20px; border: 1px dashed #d1d5db; border-radius: 8px; background: #fff;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #374151;">Ödeme Bilgileri</h4>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    Lütfen ödemelerinizde cari hesap adını belirtiniz.<br>
                    <strong>IBAN:</strong> TRXX 0000 0000 0000 0000 0000 00<br>
                    <strong>Banka:</strong> X Bankası
                </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p>Bu belge elektronik ortamda oluşturulmuştur. Islak imza gerektirmez.</p>
                <p>${companyInfo.name} | ${new Date().getFullYear()}</p>
            </div>
        </div>
    `;

  document.body.appendChild(pdfContainer);

  try {
    // Wait for fonts and styles to apply (matches the working report logic implicitly via async nature, but adding explicit delay is safer for dynamic content)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert DOM to Canvas
    const canvas = await html2canvas(pdfContainer, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // Ensure window width matches container
      windowHeight: pdfContainer.scrollHeight,
    });

    // Generate PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px', // Working code uses 'px'
      format: 'a4',
      hotfixes: ['px_scaling'], // Working code uses this
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale image to fit PDF width
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Extra pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
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
