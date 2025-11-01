/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {Array} headers - Optional custom headers
 */
export const exportToCSV = (data, filename, headers = null) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        // Header row
        csvHeaders.join(','),
        // Data rows
        ...data.map(row =>
            csvHeaders.map(header => {
                const value = row[header];
                // Handle values with commas, quotes, or newlines
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',')
        )
    ].join('\n');

    // Add BOM for UTF-8 encoding (fixes Turkish characters in Excel)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export orders to CSV with Turkish headers
 */
export const exportOrdersToCSV = (orders, customers) => {
    const data = orders.map(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return {
            'Müşteri': customer?.name || 'Bilinmiyor',
            'Sipariş Tarihi': order.order_date,
            'Toplam Tutar': order.total_amount,
            'KDV': order.vatAmount,
            'Ara Toplam': order.subtotal,
            'Durum': order.status
        };
    });

    exportToCSV(data, `siparisler_${new Date().toISOString().slice(0, 10)}`);
};

/**
 * Export customers to CSV
 */
export const exportCustomersToCSV = (customers) => {
    const data = customers.map(customer => ({
        'Müşteri Adı': customer.name,
        'Yetkili Kişi': customer.contact_person || '',
        'Telefon': customer.phone || '',
        'E-posta': customer.email || '',
        'Adres': customer.address || ''
    }));

    exportToCSV(data, `musteriler_${new Date().toISOString().slice(0, 10)}`);
};

/**
 * Export products to CSV
 */
export const exportProductsToCSV = (products) => {
    const data = products.map(product => ({
        'Ürün Adı': product.name,
        'Ürün Kodu': product.code || '',
        'Maliyet Fiyatı': product.cost_price,
        'Satış Fiyatı': product.selling_price,
        'Açıklama': product.description || ''
    }));

    exportToCSV(data, `urunler_${new Date().toISOString().slice(0, 10)}`);
};

/**
 * Export quotes to CSV
 */
export const exportQuotesToCSV = (quotes, customers) => {
    const data = quotes.map(quote => {
        const customer = customers.find(c => c.id === quote.customerId);
        return {
            'Müşteri': customer?.name || 'Bilinmiyor',
            'Teklif Tarihi': quote.teklif_tarihi,
            'Geçerlilik Tarihi': quote.gecerlilik_tarihi,
            'Toplam Tutar': quote.total_amount,
            'Durum': quote.status
        };
    });

    exportToCSV(data, `teklifler_${new Date().toISOString().slice(0, 10)}`);
};

/**
 * Export meetings to CSV
 */
export const exportMeetingsToCSV = (meetings, customers) => {
    const data = meetings.map(meeting => {
        const customer = customers.find(c => c.id === meeting.customerId);
        return {
            'Müşteri': customer?.name || 'Bilinmiyor',
            'Görüşme Tarihi': meeting.date,
            'Notlar': meeting.notes || '',
            'Sonuç': meeting.outcome,
            'Sonraki Eylem Tarihi': meeting.next_action_date || '',
            'Sonraki Eylem': meeting.next_action_notes || ''
        };
    });

    exportToCSV(data, `gorusmeler_${new Date().toISOString().slice(0, 10)}`);
};
