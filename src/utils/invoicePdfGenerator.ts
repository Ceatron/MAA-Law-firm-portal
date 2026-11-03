import jsPDF from 'jspdf';
import { FeeNote, ChambersSettings } from '../types';
import { loadChambersSettings } from './settingsStorage';
import { MA_LAW_LOGO_DATA_URL } from '../assets/maLawLogoBase64';

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

  // -------------------------------------------------------------
  // RESOLVE ACTIVE PDF TEMPLATE CUSTOMIZATION
  // -------------------------------------------------------------
  const invoiceTemplateId = settings.customization?.selectedTemplates?.['invoices'] || 'tpl-inv-standard';
  const activeTemplate = settings.customization?.customTemplates?.find((t) => t.id === invoiceTemplateId);

  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return [r, g, b];
    }
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const primaryAccent: [number, number, number] = activeTemplate?.accentColor
    ? hexToRgb(activeTemplate.accentColor)
    : [0, 152, 219];
  const docFont = activeTemplate?.fontFamily || 'helvetica';
  const headerStyle = activeTemplate?.headerStyle || 'standard';
  const docTitle =
    headerStyle === 'tax-invoice'
      ? 'Tax Invoice'
      : headerStyle === 'paid-invoice'
      ? 'Paid Invoice'
      : headerStyle === 'classic-law'
      ? 'Bill of Costs'
      : 'Fee Note';

  // Primary colors matching the firm's brand and invoice style
  const skyBlue = primaryAccent;
  const textDark = [24, 30, 42] as const; // #181e2a
  const textMuted = [100, 116, 139] as const; // #64748b
  const borderColor = [226, 232, 240] as const; // #e2e8f0
  const shadedBg = [243, 244, 246] as const; // #f3f4f6

  let currentY = 18;

  // 1. Draw Official Firm Logo on Top Left
  try {
    doc.addImage(MA_LAW_LOGO_DATA_URL, 'JPEG', margin, currentY, 24, 22.3);
  } catch (err) {
    // Graceful fallback to styled initials if image embedding fails
    doc.setFillColor(...skyBlue);
    doc.circle(margin + 6, currentY + 6, 6, 'F');
    doc.setFont(docFont, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('MA', margin + 3.5, currentY + 8);
  }

  // Top Right: "Fee Note" / Template Title, "# INV-000544", "Balance Due", "KES50,000.00"
  doc.setFont(docFont, 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...skyBlue);
  doc.text(docTitle, pageWidth - margin, currentY + 5, { align: 'right' });

  doc.setFont(docFont, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  const invNumber = feeNote.invoiceNumber || 'INV-000001';
  doc.text(`# ${invNumber}`, pageWidth - margin, currentY + 12, { align: 'right' });

  doc.setFont(docFont, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Balance Due', pageWidth - margin, currentY + 18, { align: 'right' });

  const rawItems = feeNote.items || [];
  const totalAmount = feeNote.totalKES || feeNote.amountKES || 0;
  const balanceDue = feeNote.balanceKES !== undefined ? feeNote.balanceKES : totalAmount;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(...textDark);
  doc.text(
    `KES${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - margin,
    currentY + 24,
    { align: 'right' }
  );

  // Right-aligned Invoice Date, Terms, Due Date (placed strictly BELOW Balance Due to avoid overlap)
  const metaYStart = currentY + 32;
  const metaLabelX = pageWidth - margin - 52;
  const metaValueX = pageWidth - margin;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);

  doc.text('Invoice Date :', metaLabelX, metaYStart);
  doc.text(feeNote.dateIssued || new Date().toISOString().split('T')[0], metaValueX, metaYStart, { align: 'right' });

  doc.text('Terms :', metaLabelX, metaYStart + 5.5);
  doc.text(feeNote.terms || 'Due on Receipt', metaValueX, metaYStart + 5.5, { align: 'right' });

  doc.text('Due Date :', metaLabelX, metaYStart + 11);
  doc.text(feeNote.dueDate || new Date().toISOString().split('T')[0], metaValueX, metaYStart + 11, { align: 'right' });

  // Company Address Lines (under company logo, no duplicate firm name)
  const addrYStart = currentY + 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  const addr1 = 'The Triple Two Address,';
  const addr2 = 'Block B, 1st Floor';
  doc.text(addr1, margin, addrYStart);
  doc.text(addr2, margin, addrYStart + 4);
  const phone = settings.phone || '+254 (0)20 271 9900';
  doc.text(`Phone ${phone}`, margin, addrYStart + 8);
  const email = settings.email || settings.billingEmail || 'info@muthoniahago.co.ke';
  doc.text(`Email: ${email}`, margin, addrYStart + 12);

  currentY = Math.max(addrYStart + 18, metaYStart + 18);

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
    const projLines: string[] = doc.splitTextToSize(projectOrSubject, contentWidth);
    doc.text(projLines, margin, currentY);
    currentY += (projLines.length - 1) * 4.2;
  }

  currentY += 8;

  // -------------------------------------------------------------
  // CONDITIONAL DISCOUNT & TAX DETECTION
  // User Rule: "Discount title should only appear if a discount was applied. Same to Tax."
  // -------------------------------------------------------------
  const hasDiscount = Boolean(
    (feeNote.discountKES && feeNote.discountKES > 0) ||
    rawItems.some(
      (it) =>
        (it.discountKES && it.discountKES > 0) ||
        (it.discountPercent && it.discountPercent > 0) ||
        (it.discountAmount && it.discountAmount > 0)
    )
  );

  const hasTax = Boolean(
    (feeNote.vatKES && feeNote.vatKES > 0) ||
    (feeNote.taxableAmountKES && feeNote.taxableAmountKES > 0) ||
    rawItems.some((it) => it.isTaxable === true || (it.vatAmountKES && it.vatAmountKES > 0))
  );

  // Dynamically configure column coordinates and description width
  type TableCols = {
    num: number;
    desc: number;
    qty: number;
    rate: number;
    discount?: number;
    tax?: number;
    amount: number;
  };

  let colX: TableCols;
  let descMaxWidth: number;

  if (!hasDiscount && !hasTax) {
    // 4 Columns: #, Description, Qty, Rate, Amount (Generous description space)
    colX = {
      num: margin + 3,
      desc: margin + 10,
      qty: margin + 120,
      rate: margin + 150,
      amount: pageWidth - margin - 3,
    };
    descMaxWidth = 105;
  } else if (hasDiscount && !hasTax) {
    // 5 Columns: #, Description, Qty, Rate, Discount, Amount
    colX = {
      num: margin + 3,
      desc: margin + 10,
      qty: margin + 98,
      rate: margin + 124,
      discount: margin + 150,
      amount: pageWidth - margin - 3,
    };
    descMaxWidth = 82;
  } else if (!hasDiscount && hasTax) {
    // 5 Columns: #, Description, Qty, Rate, Tax, Amount
    colX = {
      num: margin + 3,
      desc: margin + 10,
      qty: margin + 98,
      rate: margin + 124,
      tax: margin + 150,
      amount: pageWidth - margin - 3,
    };
    descMaxWidth = 82;
  } else {
    // 6 Columns: #, Description, Qty, Rate, Discount, Tax, Amount
    colX = {
      num: margin + 3,
      desc: margin + 10,
      qty: margin + 84,
      rate: margin + 108,
      discount: margin + 130,
      tax: margin + 152,
      amount: pageWidth - margin - 3,
    };
    descMaxWidth = 68;
  }

  const renderTableHeader = (y: number) => {
    doc.setFillColor(...skyBlue);
    doc.rect(margin, y, contentWidth, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    doc.text('#', colX.num, y + 5);
    doc.text('Description', colX.desc, y + 5);
    doc.text('Qty', colX.qty, y + 5, { align: 'right' });
    doc.text('Rate', colX.rate, y + 5, { align: 'right' });
    if (hasDiscount && colX.discount !== undefined) {
      doc.text('Discount', colX.discount, y + 5, { align: 'right' });
    }
    if (hasTax && colX.tax !== undefined) {
      doc.text('Tax', colX.tax, y + 5, { align: 'right' });
    }
    doc.text('Amount', colX.amount, y + 5, { align: 'right' });
  };

  // Render initial table header
  renderTableHeader(currentY);
  currentY += 7.5;

  // ITEMS ROWS
  rawItems.forEach((it, idx) => {
    const itemNum = `${idx + 1}`;
    const title = it.description || 'Professional Legal Services';
    const subDesc = it.subDescription || (it.category && it.category !== 'Other' ? it.category : '');
    const qtyStr = (it.quantity || 1).toFixed(2);
    const rateStr = (it.unitPriceKES || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const discountStr = it.discountType === 'amount'
      ? (it.discountKES || it.discountAmount ? `KES ${(it.discountKES || it.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00')
      : (it.discountPercent ? `${it.discountPercent.toFixed(2)}%` : '0.00%');
    
    const taxStr = it.isTaxable ? '16%' : '0%';

    const amountStr = (it.totalPriceKES || (it.quantity || 1) * (it.unitPriceKES || 0)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const titleLines: string[] = doc.splitTextToSize(title, descMaxWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const subLines: string[] = subDesc ? doc.splitTextToSize(subDesc, descMaxWidth) : [];

    const lineHeight = 4.0;
    const subLineHeight = 3.5;
    const titleBlockHeight = titleLines.length * lineHeight;
    const subBlockHeight = subLines.length > 0 ? subLines.length * subLineHeight + 1 : 0;
    const rowHeight = Math.max(8.5, titleBlockHeight + subBlockHeight + 3);

    // Page overflow check
    if (currentY + rowHeight > pageHeight - 45) {
      doc.addPage();
      currentY = 18;
      renderTableHeader(currentY);
      currentY += 7.5;
    }

    // Number column
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(itemNum, colX.num, currentY + 5);

    // Title lines wrapped cleanly within descMaxWidth
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    titleLines.forEach((line: string, lIdx: number) => {
      doc.text(line, colX.desc, currentY + 5 + lIdx * lineHeight);
    });

    // Sub-description lines wrapped cleanly
    if (subLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      const subStartY = currentY + 5 + titleLines.length * lineHeight;
      subLines.forEach((line: string, sIdx: number) => {
        doc.text(line, colX.desc, subStartY + sIdx * subLineHeight);
      });
    }

    // Numerical columns aligned with first line of row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(qtyStr, colX.qty, currentY + 5, { align: 'right' });
    doc.text(rateStr, colX.rate, currentY + 5, { align: 'right' });
    if (hasDiscount && colX.discount !== undefined) {
      doc.text(discountStr, colX.discount, currentY + 5, { align: 'right' });
    }
    if (hasTax && colX.tax !== undefined) {
      doc.text(taxStr, colX.tax, currentY + 5, { align: 'right' });
    }
    doc.text(amountStr, colX.amount, currentY + 5, { align: 'right' });

    // Row bottom separator line
    doc.setDrawColor(...borderColor);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    currentY += rowHeight;
  });

  currentY += 4;

  // -------------------------------------------------------------
  // TOTALS SECTION (Right aligned)
  // -------------------------------------------------------------
  const totalsLabelX = pageWidth - margin - 48;
  const totalsValueX = pageWidth - margin - 3;

  const subTotal = feeNote.subtotalKES || rawItems.reduce((acc, it) => acc + (it.totalPriceKES || 0), 0);
  const discountAmount = feeNote.discountKES || (feeNote.adjustmentKES && feeNote.adjustmentKES < 0 ? Math.abs(feeNote.adjustmentKES) : 0);
  const vatAmount = feeNote.vatKES || (feeNote.taxableAmountKES ? feeNote.taxableAmountKES * 0.16 : 0);
  const finalTotal = feeNote.totalKES || Math.max(0, subTotal - (hasDiscount ? discountAmount : 0) + (hasTax ? vatAmount : 0));
  const companyName = settings.firmName || 'Muthoni Ahago Advocates';

  if (currentY + 65 > pageHeight - 15) {
    doc.addPage();
    currentY = 20;
  }

  const startTotalsY = currentY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('Sub Total', totalsLabelX, currentY + 4);
  doc.text(subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalsValueX, currentY + 4, { align: 'right' });
  currentY += 6.5;

  // Conditionally display discount row
  if (hasDiscount && discountAmount > 0) {
    doc.text('Discount', totalsLabelX, currentY + 4);
    doc.text(`- ${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValueX, currentY + 4, { align: 'right' });
    currentY += 6.5;
  }

  // Conditionally display tax/VAT row
  if (hasTax && vatAmount > 0) {
    doc.text('VAT (16%)', totalsLabelX, currentY + 4);
    doc.text(vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), totalsValueX, currentY + 4, { align: 'right' });
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
  currentY += 9;

  // -------------------------------------------------------------
  // LEFT COLUMN: Customer Notes & Terms and Conditions
  // -------------------------------------------------------------
  let leftY = startTotalsY;
  const leftColWidth = totalsLabelX - margin - 8;

  // Customer Notes
  const custNotes = feeNote.customerNotes || feeNote.notes || 'Thanks for your business.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const notesLines: string[] = doc.splitTextToSize(custNotes, Math.max(50, leftColWidth));
  doc.text(notesLines, margin, leftY + 4);
  leftY += notesLines.length * 4.2 + 4;

  // Terms & Conditions (User Rule: Terms & Conditions should be saved and appear on PDF invoice)
  const shouldShowTerms = activeTemplate ? activeTemplate.showTermsAndConditions : true;
  const termsText = (feeNote.termsAndConditions || '').trim();
  if (shouldShowTerms && termsText) {
    doc.setFont(docFont, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text('Terms & Conditions:', margin, leftY);
    leftY += 3.8;

    doc.setFont(docFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    const termsLines: string[] = doc.splitTextToSize(termsText, Math.max(50, leftColWidth));
    doc.text(termsLines, margin, leftY);
    leftY += termsLines.length * 3.4 + 4;
  }

  // -------------------------------------------------------------
  // BANK PAYMENT PARTICULARS BOX
  // -------------------------------------------------------------
  const footerY = pageHeight - 12;
  const shouldShowBank = activeTemplate ? activeTemplate.showBankDetails : true;

  if (shouldShowBank) {
    const bank = settings.bankDetails || {
      bankName: 'KCB Bank Kenya',
      accountName: 'Muthoni Ahago Advocates Client Trust A/C',
      accountNumber: '1289405821',
      branch: 'Ruiru Branch',
      paybillNumber: '522522',
    };

    const bankBoxHeight = 19;
    let bankBoxY = Math.max(currentY + 4, leftY + 2);

    // If bank box would overlap the footer, move to next page or anchor above footer
    if (bankBoxY + bankBoxHeight > footerY - 5) {
      if (currentY + 25 < footerY) {
        bankBoxY = footerY - 6 - bankBoxHeight;
      } else {
        doc.addPage();
        bankBoxY = 20;
      }
    }

    const bankBoxWidth = contentWidth;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, bankBoxY, bankBoxWidth, bankBoxHeight, 1.5, 1.5, 'FD');

    // Left accent bar
    doc.setFillColor(...skyBlue);
    doc.rect(margin, bankBoxY, 2.5, bankBoxHeight, 'F');

    // Title
    doc.setFont(docFont, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...skyBlue);
    doc.text('BANK PAYMENT PARTICULARS', margin + 5, bankBoxY + 4.5);

    // Row 1: Bank Name and Account Name
    doc.setFont(docFont, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text('Bank Name:', margin + 5, bankBoxY + 9.5);
    doc.setFont(docFont, 'normal');
    doc.text(bank.bankName || 'KCB Bank Kenya', margin + 22, bankBoxY + 9.5);

    doc.setFont(docFont, 'bold');
    doc.text('Account Name:', margin + 85, bankBoxY + 9.5);
    doc.setFont(docFont, 'normal');
    doc.text(bank.accountName || 'Muthoni Ahago Advocates Client Trust A/C', margin + 107, bankBoxY + 9.5);

    // Row 2: Account Number, Branch, Paybill
    doc.setFont(docFont, 'bold');
    doc.text('Account No:', margin + 5, bankBoxY + 15);
    doc.setFont(docFont, 'normal');
    doc.text(bank.accountNumber || '1289405821', margin + 22, bankBoxY + 15);

    doc.setFont(docFont, 'bold');
    doc.text('Branch:', margin + 85, bankBoxY + 15);
    doc.setFont(docFont, 'normal');
    doc.text(bank.branch || 'Ruiru Branch', margin + 97, bankBoxY + 15);

    if (bank.paybillNumber) {
      doc.setFont(docFont, 'bold');
      doc.text('M-Pesa Paybill:', margin + 135, bankBoxY + 15);
      doc.setFont(docFont, 'normal');
      doc.text(bank.paybillNumber, margin + 156, bankBoxY + 15);
    }
  }

  // Optional Advocate Signature Block
  if (activeTemplate?.showSignatureBlock) {
    const sigY = footerY - 24;
    doc.setDrawColor(...textDark);
    doc.line(pageWidth - margin - 55, sigY, pageWidth - margin, sigY);
    doc.setFont(docFont, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(activeTemplate.signatureLabel || 'Authorized Advocate Signature', pageWidth - margin, sigY + 4, { align: 'right' });
    doc.setFont(docFont, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(companyName, pageWidth - margin, sigY + 7.5, { align: 'right' });
  }

  // Watermark for Paid Invoices
  const isPaid = feeNote.status === 'Paid' || balanceDue <= 0;
  if (headerStyle === 'paid-invoice' || (activeTemplate?.showWatermarkWhenPaid && isPaid)) {
    doc.saveGraphicsState?.();
    doc.setDrawColor(5, 150, 105); // emerald-600
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(pageWidth / 2 - 28, pageHeight / 2 - 12, 56, 16, 2, 2, 'D');
    doc.setFont(docFont, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text('PAID IN FULL', pageWidth / 2, pageHeight / 2 - 1, { align: 'center' });
    doc.restoreGraphicsState?.();
  }

  // -------------------------------------------------------------
  // FOOTER LINE & BRANDING
  // -------------------------------------------------------------
  doc.setDrawColor(...borderColor);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont(docFont, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  const footerPhone = settings.phone || '+254 (0)20 271 9900';
  const footerEmail = settings.email || 'info@muthoniahago.co.ke';
  const defaultFooter = `${companyName} | ${footerPhone} | ${footerEmail} | ${settings.website || 'www.muthoniahago.co.ke'}`;
  const footerText = activeTemplate?.footerNotes || defaultFooter;
  doc.text(footerText, margin, footerY);
  doc.text('1', pageWidth - margin, footerY, { align: 'right' });

  return doc;
};

/**
 * Universal, sandboxed-iframe safe PDF download helper.
 * Uses a generated Blob + programmatic anchor link click with fallback to doc.save.
 */
export const downloadInvoicePdf = (feeNote: FeeNote, customSettings?: ChambersSettings): boolean => {
  try {
    const doc = generateInvoicePdf(feeNote, customSettings);
    const safeInvNum = (feeNote.invoiceNumber || 'INV-000001').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${safeInvNum}.pdf`;

    // 1. Try Blob URL + <a> download (most reliable across browsers and iframe environments)
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener noreferrer';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      try {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 2500);

    return true;
  } catch (err) {
    console.warn('[invoicePdfGenerator] Blob URL download had issue, attempting doc.save fallback:', err);
    try {
      const doc = generateInvoicePdf(feeNote, customSettings);
      const safeInvNum = (feeNote.invoiceNumber || 'INV-000001').replace(/[/\\?%*:|"<>]/g, '_');
      doc.save(`${safeInvNum}.pdf`);
      return true;
    } catch (saveErr) {
      console.error('[invoicePdfGenerator] Both download methods failed:', saveErr);
      return false;
    }
  }
};
