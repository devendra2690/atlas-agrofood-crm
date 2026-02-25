import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface QuoteTier {
    weight: string;
    mult: string;
    price: number;
}

export interface PDFQuoteItem {
    productName: string;
    tiers: QuoteTier[];
}

export interface PDFClientDetails {
    quotationNo?: string;
    date?: string;
    clientName: string;
    company: string;
    phone: string;
}

export const generateQuotationPDF = async (
    clientDetails: PDFClientDetails,
    items: PDFQuoteItem[],
    logoBase64?: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const PRIMARY_COLOR: [number, number, number] = [84, 130, 53]; // The Green color from the screenshot (#548235 approximate)
    const TEXT_DARK: [number, number, number] = [64, 64, 64];

    // --- HELPER CONSTANTS ---
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    let startY = 15;
    let currentY = startY;

    // --- 1. Top Decorative Wave Header (Approximation using lines for now) ---
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(3);
    doc.line(0, 5, pageWidth, 5);
    doc.setDrawColor(197, 151, 0); // Gold
    doc.setLineWidth(1.5);
    doc.line(0, 8, pageWidth, 8);

    currentY = 25;

    // --- 2. Logo & Company Title ---
    if (logoBase64) {
        try {
            // Adjust dimensions based on your actual logo aspect ratio
            doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 15, currentY, 30, 30);
            currentY += 35;
        } catch (e) {
            console.error("Failed to add logo", e);
            currentY += 10;
        }
    } else {
        // Placeholder for logo
        currentY += 15;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text("Atlas AgroFood", pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.text("Private Limited", pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SN-115, Plot No-56, Gajanan Colony, Khamgaon,", pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text("District Buldhana, Maharashtra - 444303", pageWidth / 2, currentY, { align: 'center' });

    currentY += 20;

    // --- 3. Client Details Table ---
    const defaultQuotationNo = clientDetails.quotationNo || `AAF/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const defaultDate = clientDetails.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        body: [
            ['Quotation No:', defaultQuotationNo],
            ['Date:', defaultDate],
            ['Client Name:', clientDetails.clientName || '-'],
            ['Company:', clientDetails.company || '-'],
            ['Phone:', clientDetails.phone || '-']
        ],
        tableWidth: 140,
        margin: { left: (pageWidth - 140) / 2 },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: TEXT_DARK,
            font: 'helvetica',
        },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'normal', fillColor: [248, 248, 248] }, // Very light grey bg for labels
            1: { cellWidth: 90, fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 25;

    // --- 4. Product Pricing Tables ---
    for (const item of items) {
        // Check if we need to add a new page
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }

        // Product Sub-heading
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        doc.text(item.productName, leftMargin, currentY);
        currentY += 5;

        // Pricing Table for this product
        const tableData = item.tiers.map(t => [
            t.weight === '1000kg' ? '1 MT (1000 kg)' : t.weight,
            `Rs. ${t.price.toFixed(0)}`
        ]);

        autoTable(doc, {
            startY: currentY,
            theme: 'grid',
            head: [['Order Quantity', 'Price (Rs./kg)']],
            body: tableData,
            margin: { left: leftMargin },
            tableWidth: 120,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                font: 'helvetica',
                textColor: TEXT_DARK
            },
            headStyles: {
                fillColor: PRIMARY_COLOR,
                textColor: [255, 255, 255],
                fontStyle: 'normal',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 60, halign: 'center' },
                1: { cellWidth: 60, halign: 'center' }
            },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 20;
    }

    // --- 5. Commercial Terms ---
    // Make sure we have enough space for terms, else new page
    if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text("Commercial Terms", leftMargin, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const bulletPoint = '• ';
    const terms = [
        "Prices are Ex-Factory.",
        "GST extra as applicable.",
        "Transportation extra at actual.",
        "Payment Terms: 50% advance, balance before dispatch.",
        "Prices are linked to prevailing commodity market prices and may vary accordingly."
    ];

    for (const term of terms) {
        doc.text(`${bulletPoint}${term}`, leftMargin + 2, currentY);
        currentY += 6;
    }

    // --- 6. Footer (Add to every page) ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(leftMargin, pageHeight - 15, rightMargin, pageHeight - 15);

        // Footer Text
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");

        // Layout: Email (Left) | Phone (Center) | Web (Right)
        doc.text("sales@atlasagrofood.co.in", leftMargin + 5, pageHeight - 8);
        doc.text("+91-9867630682", pageWidth / 2, pageHeight - 8, { align: 'center' }); // Used default phone, adjust if needed
        doc.text("www.atlasagrofood.co.in", rightMargin - 5, pageHeight - 8, { align: 'right' });
    }

    // --- Save ---
    const safeClientName = (clientDetails.clientName || 'Draft').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    doc.save(`Quotation_${safeClientName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
