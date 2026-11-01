import jsPDF from 'jspdf';
import { FeeNote, ChambersSettings } from '../types';
import { loadChambersSettings } from './settingsStorage';

export const generateInvoicePdf = (feeNote: FeeNote, customSettings?: ChambersSettings): jsPDF => {
  const settings = customSettings || loadChambersSettings();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Primary colors matching the attached PDF
  const skyBlue = [0, 152, 219] as const; // #0098db
  const textDark = [24, 30, 42] as const; // #181e2a
  const textMuted = [100, 116, 139] as const; // #64748b
  const borderColor = [226, 232, 240] as const; // #e2e8f0
  const shadedBg = [243, 244, 246] as const; // #f3f4f6

  let currentY = 18;

  // 1. Draw Company Logo on Top Left
  // Geometric stylish arcs logo like the PDF
  doc.setFillColor(...skyBlue);
  doc.circle(margin + 5, currentY + 5, 5, 'F');
  doc.setFillColor(30, 41, 59);
  doc.circle(margin + 8, currentY + 8, 4, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 6, currentY + 6, 2.5, 'F');

  // Company Name next to logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  const companyName = settings.firmName || 'Ceatron Technologies Ltd';
  doc.text(companyName, margin + 14, currentY + 4);

  // Top Right: "Invoice", "# INV-000544", "Balance Due", "KES1,000.00"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...skyBlue);
  doc.text('Invoice', pageWidth - margin, currentY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  const invNumber = feeNote.invoiceNumber || 'INV-000544';
  doc.text(`# ${invNumber}`, pageWidth - margin, currentY + 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Balance Due', pageWidth - margin, currentY + 17, { align: 'right' });

  const totalAmount = feeNote.totalKES || feeNote.amountKES || 0;
  const balanceDue = feeNote.balanceKES !== undefined ? feeNote.balanceKES : totalAmount;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(...textDark);
  doc.text(`KES${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, currentY + 23, { align: 'right' });

  // Company Address Lines (under company logo)
  currentY += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textDark);
  doc.text(companyName, margin, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  const addr1 = 'The Triple Two Address,';
  const addr2 = 'Block B, 1st Floor';
  doc.text(addr1, margin, currentY);
  currentY += 4;
  doc.text(addr2, margin, currentY);
  currentY += 4;
  const phone = settings.phone || '+254 786 652 032 / +254 724833192';
  doc.text(`Phone ${phone}`, margin, currentY);
  currentY += 4;
  const email = settings.email || settings.billingEmail || 'info@ceatrontechnologies.com';
  doc.text(`Email: ${email}`, margin, currentY);

  // Right-aligned Invoice Date, Terms, Due Date
  const metaYStart = currentY - 14;
  const metaLabelX = pageWidth - margin - 50;
  const metaValueX = pageWidth - margin;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);

  doc.text('Invoice Date :', metaLabelX, metaYStart);
  doc.text(feeNote.dateIssued || '30 Oct 2026', metaValueX, metaYStart, { align: 'right' });

  doc.text('Terms :', metaLabelX, metaYStart + 5.5);
  doc.text(feeNote.terms || 'Due on Receipt', metaValueX, metaYStart + 5.5, { align: 'right' });

  doc.text('Due Date :', metaLabelX, metaYStart + 11);
  doc.text(feeNote.dueDate || '30 Oct 2026', metaValueX, metaYStart + 11, { align: 'right' });

  currentY += 12;

  // BILL TO & PROJECT / SUBJECT SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('BILL TO:', margin, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(feeNote.clientName || 'Client', margin, currentY);

  if (feeNote.clientAddress && feeNote.clientAddress !== 'Nairobi, Kenya') {
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(feeNote.clientAddress, margin, currentY);
  }

  const projectOrSubject = feeNote.subject || feeNote.matterTitle;
  if (projectOrSubject) {
    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text('Project :', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text(projectOrSubject, margin, currentY);
  }

  currentY += 8;

  // ITEMS TABLE HEADER
  // Sky Blue bar across table
  const colX = {
    num: margin + 3,
    desc: margin + 12,
    qty: margin + 98,
    rate: margin + 122,
    discount: margin + 148,
    amount: pageWidth - margin - 3,
  };

  doc.setFillColor(...skyBlue);
  doc.rect(margin, currentY, contentWidth, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  doc.text('#', colX.num, currentY + 5);
  doc.text('Description', colX.desc, currentY + 5);
  doc.text('Qty', colX.qty, currentY + 5, { align: 'right' });
  doc.text('Rate', colX.rate, currentY + 5, { align: 'right' });
  doc.text('Discount', colX.discount, currentY + 5, { align: 'right' });
  doc.text('Amount', colX.amount, currentY + 5, { align: 'right' });

  currentY += 7.5;

  // ITEMS ROWS
  const rawItems = feeNote.items || [];

  rawItems.forEach((it, idx) => {
    const itemNum = `${idx + 1}`;
    const title = it.description || 'Service Delivery';
    const subDesc = it.subDescription || (it.category && it.category !== 'Other' ? it.category : '');
    const qtyStr = (it.quantity || 1).toFixed(2);
    const rateStr = (it.unitPriceKES || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const discountStr = it.discountPercent ? `${it.discountPercent.toFixed(2)}%` : '0.00%';
    const amountStr = (it.totalPriceKES || (it.quantity || 1) * (it.unitPriceKES || 0)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const rowHeight = subDesc ? 11 : 8.5;

    // Row bottom separator line
    doc.setDrawColor(...borderColor);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    // Text output
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(itemNum, colX.num, currentY + 5);

    // Item title
    doc.setFont('helvetica', 'bold');
    doc.text(title, colX.desc, currentY + 5);

    // Sub-description
    if (subDesc) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text(subDesc, colX.desc, currentY + 9);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(qtyStr, colX.qty, currentY + 5, { align: 'right' });
    doc.text(rateStr, colX.rate, currentY + 5, { align: 'right' });
    doc.text(discountStr, colX.discount, currentY + 5, { align: 'right' });
    doc.text(amountStr, colX.amount, currentY + 5, { align: 'right' });

    currentY += rowHeight;
  });

  currentY += 4;

  // TOTALS SECTION (Right aligned)
  const totalsLabelX = pageWidth - margin - 48;
  const totalsValueX = pageWidth - margin - 3;

  const subTotal = feeNote.subtotalKES || rawItems.reduce((acc, it) => acc + (it.totalPriceKES || 0), 0);
  const shipping = feeNote.shippingChargesKES || feeNote.disbursementsKES || 0;
  const adjustment = feeNote.adjustmentKES || 0;
  const finalTotal = feeNote.totalKES || (subTotal + shipping + adjustment);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('Sub Total', totalsLabelX, currentY + 4);
  doc.text(subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalsValueX, currentY + 4, { align: 'right' });
  currentY += 6.5;

  if (shipping > 0) {
    doc.text('Shipping Charges', totalsLabelX, currentY + 4);
    doc.text(shipping.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalsValueX, currentY + 4, { align: 'right' });
    currentY += 6.5;
  }

  if (adjustment !== 0) {
    doc.text('Adjustment', totalsLabelX, currentY + 4);
    doc.text(adjustment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalsValueX, currentY + 4, { align: 'right' });
    currentY += 6.5;
  }

  // Total Row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textDark);
  doc.text('Total', totalsLabelX, currentY + 4);
  doc.text(`KES${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValueX, currentY + 4, { align: 'right' });
  currentY += 7.5;

  // Shaded Balance Due Row
  const boxWidth = 65;
  const boxX = pageWidth - margin - boxWidth;
  doc.setFillColor(...shadedBg);
  doc.rect(boxX, currentY, boxWidth, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textDark);
  doc.text('Balance Due', boxX + 4, currentY + 5.2);
  doc.text(`KES${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValueX, currentY + 5.2, { align: 'right' });

  // BOTTOM LEFT: Customer Notes & Payment Options
  const notesY = currentY - (shipping > 0 ? 12 : 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const custNotes = feeNote.customerNotes || feeNote.notes || 'Thanks for your business.';
  doc.text(custNotes, margin, notesY);

  const payY = notesY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAYMENT OPTIONS:', margin, payY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Cash payments can be done via', margin, payY + 4.5);
  const paybill = settings.bankDetails?.paybillNumber || '603685';
  doc.setFont('helvetica', 'bold');
  doc.text(`MPESA | BUY GOODS: ${paybill}`, margin, payY + 8.5);

  // FOOTER
  const footerY = pageHeight - 12;
  doc.setDrawColor(...borderColor);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  const footerText = `${companyName} | ${phone} | ${email} | ${settings.website || 'www.ceatrontechnologies.com'}`;
  doc.text(footerText, margin, footerY);
  doc.text('1', pageWidth - margin, footerY, { align: 'right' });

  return doc;
};
