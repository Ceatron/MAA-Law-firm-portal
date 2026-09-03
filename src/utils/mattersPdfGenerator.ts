import jsPDF from 'jspdf';
import { LegalMatter, Advocate } from '../types';
import { loadChambersSettings } from './settingsStorage';

export interface MattersPdfExportOptions {
  matters: LegalMatter[];
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  filterSummary?: {
    practiceArea?: string;
    priority?: string;
    status?: string;
    staff?: string;
    searchTerm?: string;
  };
  customRemarks?: string;
  includeFinancials?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export const generateMattersPdf = (options: MattersPdfExportOptions): jsPDF => {
  const settings = loadChambersSettings();
  const {
    matters,
    currentAdvocate,
    isManagingAdvocate = true,
    filterSummary,
    customRemarks,
    includeFinancials = true,
    orientation = 'landscape',
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Colors
  const primaryNavy = [22, 42, 69] as const; // #162a45
  const secondaryGold = [180, 83, 9] as const; // #b45309
  const textDark = [30, 41, 59] as const; // #1e293b
  const textMuted = [100, 116, 139] as const; // #64748b
  const lightGrayBg = [248, 250, 252] as const; // #f8fafc
  const borderColor = [226, 232, 240] as const; // #e2e8f0

  // Header Letterhead
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, currentY, contentWidth, 1.5, 'F');
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryNavy);
  doc.text((settings.firmName || 'MUTHONI AHAGO ADVOCATES').toUpperCase(), margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  const letterheadSub = 'COMMISSIONERS FOR OATHS • NOTARIES PUBLIC • PATENT & TRADEMARK AGENTS';
  doc.text(letterheadSub, margin, currentY + 4);

  const contactText = `${settings.physicalAddress || '1st Floor, The Triple Two Address, Ruiru'} | Tel: ${settings.phone || '+254 (0)20 271 9900'} | ${settings.email || 'info@muthoniahago.co.ke'}`;
  doc.text(contactText, pageWidth - margin, currentY + 4, { align: 'right' });

  currentY += 8;
  doc.setDrawColor(...borderColor);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryNavy);
  doc.text('LEGAL MATTERS REGISTRY & CASE AUDIT REPORT', margin, currentY);

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text(`Generated: ${todayStr} • Electronic Registry Extract`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 5;

  // Scope & Filter Summary Meta Box
  doc.setFillColor(...lightGrayBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text('AUDIT PARAMETERS & REGISTRY SCOPE:', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);

  const advocateLabel = currentAdvocate ? `${currentAdvocate.name} (${isManagingAdvocate ? 'Managing Advocate' : 'Staff Advocate'})` : 'Firm Workspace Registry';
  const practiceFilter = filterSummary?.practiceArea || 'All Practice Areas';
  const priorityFilter = filterSummary?.priority || 'All Priorities';
  const statusFilter = filterSummary?.status || 'All Statuses';
  const searchFilter = filterSummary?.searchTerm ? `"${filterSummary.searchTerm}"` : 'None';

  const col1 = `Prepared By: ${advocateLabel}`;
  const col2 = `Practice Area: ${practiceFilter} | Priority: ${priorityFilter}`;
  const col3 = `Status: ${statusFilter} | Search Query: ${searchFilter}`;

  doc.text(col1, margin + 3, currentY + 9);
  doc.text(col2, margin + 3, currentY + 13);
  doc.text(col3, margin + contentWidth / 2 + 10, currentY + 9);

  const totalFeeKES = matters.reduce((acc, m) => acc + (m.estimatedFeeKES || 0), 0);
  const billedFeeKES = matters.reduce((acc, m) => acc + (m.billedKES || 0), 0);
  const highCount = matters.filter((m) => m.priority === 'High').length;
  const mediumCount = matters.filter((m) => m.priority === 'Medium').length;
  const lowCount = matters.filter((m) => m.priority === 'Low').length;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryGold);
  doc.text(`Total Matters: ${matters.length} (High: ${highCount} | Medium: ${mediumCount} | Low: ${lowCount})`, margin + contentWidth / 2 + 10, currentY + 13);

  currentY += 19;

  // Custom Remarks if provided
  if (customRemarks && customRemarks.trim().length > 0) {
    doc.setFillColor(254, 249, 195); // light yellow
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(margin, currentY, contentWidth, 10, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(133, 77, 14);
    doc.text('ADVOCATE AUDIT REMARKS:', margin + 3, currentY + 4);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(68, 64, 60);
    const splitRemarks = doc.splitTextToSize(customRemarks, contentWidth - 45);
    doc.text(splitRemarks[0] || '', margin + 43, currentY + 4);
    if (splitRemarks[1]) {
      doc.text(splitRemarks[1], margin + 43, currentY + 7.5);
    }
    currentY += 13;
  }

  // Table Column Definitions
  interface ColumnDef {
    header: string;
    width: number;
    align?: 'left' | 'center' | 'right';
  }

  const columns: ColumnDef[] = orientation === 'landscape'
    ? [
        { header: 'REF NO', width: 22, align: 'left' },
        { header: 'MATTER TITLE & COURT CAUSE', width: 62, align: 'left' },
        { header: 'PRIORITY', width: 22, align: 'center' },
        { header: 'CLIENT', width: 42, align: 'left' },
        { header: 'PRACTICE AREA', width: 34, align: 'left' },
        { header: 'LEAD ADVOCATE', width: 32, align: 'left' },
        { header: 'STATUS', width: 30, align: 'left' },
        { header: 'NEXT COURT DATE & PURPOSE', width: 35, align: 'left' },
      ]
    : [
        { header: 'REF NO', width: 22, align: 'left' },
        { header: 'MATTER TITLE & COURT CAUSE', width: 46, align: 'left' },
        { header: 'PRIORITY', width: 18, align: 'center' },
        { header: 'CLIENT', width: 32, align: 'left' },
        { header: 'PRACTICE AREA', width: 24, align: 'left' },
        { header: 'STATUS', width: 22, align: 'left' },
        { header: 'NEXT COURT DATE', width: 26, align: 'left' },
      ];

  const rowHeight = 11;
  const headerHeight = 7;

  const renderTableHeader = (yPos: number) => {
    doc.setFillColor(...primaryNavy);
    doc.rect(margin, yPos, contentWidth, headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    columns.forEach((col) => {
      const textX = col.align === 'center'
        ? curX + col.width / 2
        : col.align === 'right'
        ? curX + col.width - 2
        : curX + 2;
      doc.text(col.header, textX, yPos + 4.8, { align: col.align || 'left' });
      curX += col.width;
    });
  };

  const renderFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 8;
    doc.setDrawColor(...borderColor);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      'CONFIDENTIAL & PRIVILEGED • Eldred & Associates Advocates Integrated Practice Management System',
      margin,
      footerY + 1.5
    );
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY + 1.5, { align: 'right' });
  };

  // Draw initial header
  renderTableHeader(currentY);
  currentY += headerHeight;

  let pageNumber = 1;

  if (matters.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 16, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text('No legal matters match the current filter selection.', margin + contentWidth / 2, currentY + 9, {
      align: 'center',
    });
    currentY += 16;
  } else {
    matters.forEach((matter, idx) => {
      // Check if new page is needed
      if (currentY + rowHeight > pageHeight - 16) {
        doc.addPage();
        pageNumber++;
        currentY = margin;

        // Page continuation header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...primaryNavy);
        doc.text(`ELDRED & ASSOCIATES — Legal Matters Registry (Continued, Page ${pageNumber})`, margin, currentY);
        currentY += 4.5;

        renderTableHeader(currentY);
        currentY += headerHeight;
      }

      // Background row
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(...lightGrayBg);
      } else {
        doc.setFillColor(255, 255, 255);
      }

      // If matter is High Priority, give subtle tint
      if (matter.priority === 'High') {
        doc.setFillColor(254, 242, 242); // very subtle rose
      }

      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      doc.setDrawColor(...borderColor);
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

      let curX = margin;

      // 1. Ref Number & Lodged Date
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...primaryNavy);
      doc.text(matter.referenceNumber, curX + 2, currentY + 4.5);
      if (matter.lodgedDate || matter.createdDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...textMuted);
        doc.text(`Lodged: ${matter.lodgedDate || matter.createdDate}`, curX + 2, currentY + 8.5);
      }
      curX += columns[0].width;

      // 2. Matter Title & Court Ref
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...textDark);
      const titleLines = doc.splitTextToSize(matter.title, columns[1].width - 4);
      doc.text(titleLines[0] || '', curX + 2, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      const courtText = matter.courtCaseNumber || (titleLines[1] ? titleLines[1] : 'Firm Workspace Advisory');
      const truncatedCourt = courtText.length > 40 ? courtText.substring(0, 37) + '...' : courtText;
      doc.text(truncatedCourt, curX + 2, currentY + 8.5);
      curX += columns[1].width;

      // 3. Priority Badge
      const priority = matter.priority || 'Low';
      const pColWidth = columns[2].width;
      if (priority === 'High') {
        doc.setFillColor(254, 226, 226); // rose-100
        doc.setDrawColor(248, 113, 113); // rose-400
        doc.roundedRect(curX + 2, currentY + 2.5, pColWidth - 4, 5.5, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(185, 28, 28); // rose-700
        doc.text('HIGH / URGENT', curX + pColWidth / 2, currentY + 6.2, { align: 'center' });
      } else if (priority === 'Medium') {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.setDrawColor(251, 191, 36); // amber-400
        doc.roundedRect(curX + 2, currentY + 2.5, pColWidth - 4, 5.5, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(180, 83, 9); // amber-700
        doc.text('MEDIUM', curX + pColWidth / 2, currentY + 6.2, { align: 'center' });
      } else {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.roundedRect(curX + 2, currentY + 2.5, pColWidth - 4, 5.5, 1, 1, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text('LOW', curX + pColWidth / 2, currentY + 6.2, { align: 'center' });
      }
      curX += columns[2].width;

      // 4. Client
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      const clientText = matter.clientName.length > 24 ? matter.clientName.substring(0, 22) + '..' : matter.clientName;
      doc.text(clientText, curX + 2, currentY + 5.5);
      curX += columns[3].width;

      // 5. Practice Area
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      const areaText = matter.practiceArea.length > 22 ? matter.practiceArea.substring(0, 20) + '..' : matter.practiceArea;
      doc.text(areaText, curX + 2, currentY + 5.5);
      curX += columns[4].width;

      if (orientation === 'landscape') {
        // 6. Lead Advocate
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...textDark);
        const advText = matter.responsibleAdvocateName.length > 20 ? matter.responsibleAdvocateName.substring(0, 18) + '..' : matter.responsibleAdvocateName;
        doc.text(advText, curX + 2, currentY + 5.5);
        curX += columns[5].width;

        // 7. Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        if (matter.status === 'Active - In Court') {
          doc.setTextColor(0, 112, 186);
        } else if (matter.status === 'Filing Pending') {
          doc.setTextColor(180, 83, 9);
        } else if (matter.status === 'Settlement Negotiation') {
          doc.setTextColor(27, 99, 56);
        } else {
          doc.setTextColor(92, 111, 132);
        }
        doc.text(matter.status, curX + 2, currentY + 5.5);
        curX += columns[6].width;

        // 8. Next Court Date & Purpose
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(...textDark);
        const courtDate = matter.nextCourtDate || matter.nextDeadlineDate || 'N/A';
        doc.text(courtDate, curX + 2, currentY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...secondaryGold);
        const purposeText = matter.courtDatePurpose
          ? `[${matter.courtDatePurpose}] ${matter.nextDeadlineDescription || ''}`
          : matter.nextDeadlineDescription || 'Court Mention';
        const truncPurpose = purposeText.length > 26 ? purposeText.substring(0, 24) + '..' : purposeText;
        doc.text(truncPurpose, curX + 2, currentY + 8.5);
      } else {
        // Portrait columns: 6. Status, 7. Next Court Date
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 112, 186);
        doc.text(matter.status.substring(0, 14), curX + 2, currentY + 5.5);
        curX += columns[5].width;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...textDark);
        doc.text(matter.nextCourtDate || matter.nextDeadlineDate || 'N/A', curX + 2, currentY + 5.5);
      }

      currentY += rowHeight;
    });
  }

  // Summary Portfolio Financial Footer if included
  if (includeFinancials && currentY + 22 < pageHeight - 16) {
    currentY += 4;
    doc.setFillColor(...lightGrayBg);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryNavy);
    doc.text('FINANCIAL PORTFOLIO AGGREGATES (FILTERED MATTERS):', margin + 3, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(
      `Estimated Legal Fees: KES ${totalFeeKES.toLocaleString()}  |  Billed Fees: KES ${billedFeeKES.toLocaleString()}  |  Average Fee / Matter: KES ${matters.length ? Math.round(totalFeeKES / matters.length).toLocaleString() : '0'}`,
      margin + 3,
      currentY + 10
    );

    currentY += 16;
  }

  // Set total page count for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderFooter(i, totalPages);
  }

  return doc;
};
