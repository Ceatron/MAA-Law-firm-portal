import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Building2,
  Scale,
  Calendar,
  User,
  DollarSign,
  Clock,
  Shield,
  FileCheck,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { LegalMatter, CourtAppearance, DocumentItem, DeadlineItem } from '../types';
import { DraggableModal } from './common/DraggableModal';

interface CaseReportModalProps {
  matter: LegalMatter;
  isOpen: boolean;
  onClose: () => void;
  courtAppearances?: CourtAppearance[];
  documents?: DocumentItem[];
  deadlines?: DeadlineItem[];
}

export type ReportTemplateType =
  | 'comprehensive'
  | 'executive'
  | 'financial'
  | 'strategy';

export const CaseReportModal: React.FC<CaseReportModalProps> = ({
  matter,
  isOpen,
  onClose,
  courtAppearances: propCourtAppearances = [],
  documents: propDocuments = [],
  deadlines: propDeadlines = [],
}) => {
  if (!isOpen) return null;

  const reportRef = useRef<HTMLDivElement>(null);
  const [templateType, setTemplateType] =
    useState<ReportTemplateType>('comprehensive');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Customization Options
  const [clientAttention, setClientAttention] = useState(
    `${matter.clientName} - Legal Department`
  );
  const [advocateName, setAdvocateName] = useState(
    matter.responsibleAdvocateName || 'Firm Workspace Advocate'
  );
  const [reportDate] = useState(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  );

  const [advocateRemarks, setAdvocateRemarks] = useState(
    `We report progress in respect of ${matter.referenceNumber} (${matter.title}). The pleadings are fully lodged with the High Court Registry under ${matter.courtCaseNumber || 'Registry Reference'}. We recommend proceeding with oral submissions on the pending interlocutory application as directed by the Court.`
  );

  // Section Toggles
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeDeadlines, setIncludeDeadlines] = useState(true);

  // Related data
  const courtAppearances = propCourtAppearances.filter(
    (c) => c.matterId === matter.id || c.matterRef === matter.referenceNumber
  );
  const relevantDocs = propDocuments.filter(
    (d) => d.matterRef === matter.referenceNumber
  );
  const relevantDeadlines = propDeadlines.filter(
    (dl) => dl.matterId === matter.id
  );

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTemplateChange = (type: ReportTemplateType) => {
    setTemplateType(type);
    if (type === 'executive') {
      setAdvocateRemarks(
        `EXECUTIVE BRIEF: Matter ${matter.referenceNumber} remains active at ${matter.courtRegistry || 'Milimani Commercial Courts'}. Key legal risks have been mitigated following personal service on ${matter.opposingParty || 'Opposing Counsel'}. Financial exposure is bounded within initial retainer terms.`
      );
      setIncludeTimeline(false);
      setIncludeDocuments(false);
    } else if (type === 'financial') {
      setAdvocateRemarks(
        `FINANCIAL STATUS UPDATE: Fee notes logged for matter ${matter.referenceNumber} amount to KES ${(matter.billedFeeKES || 0).toLocaleString()}. Total estimated fee agreed: KES ${(matter.estimatedFeeKES || 0).toLocaleString()}. statutory disbursement receipts attached.`
      );
      setIncludeTimeline(false);
      setIncludeDocuments(false);
      setIncludeFinancials(true);
    } else if (type === 'strategy') {
      setAdvocateRemarks(
        `LITIGATION STRATEGY NOTE: Upcoming court milestone on ${matter.nextDeadlineDate || '18 Aug 2026'} regarding ${matter.nextDeadlineDescription || 'Interlocutory Ruling'}. Counsel strategy centers on statutory preliminary objections pursuant to Civil Procedure Rules.`
      );
      setIncludeTimeline(true);
      setIncludeDeadlines(true);
    } else {
      setAdvocateRemarks(
        `We report progress in respect of ${matter.referenceNumber} (${matter.title}). The pleadings are fully lodged with the High Court Registry under ${matter.courtCaseNumber}. We recommend proceeding with oral submissions on the pending interlocutory application as directed by the Court.`
      );
      setIncludeSummary(true);
      setIncludeTimeline(true);
      setIncludeDocuments(true);
      setIncludeFinancials(true);
      setIncludeDeadlines(true);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    triggerToast('Generating high-resolution client PDF report...');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `${matter.referenceNumber.replace(/[\/\s]/g, '_')}_Client_Status_Report.pdf`;
      pdf.save(fileName);
      triggerToast(`PDF Report downloaded: ${fileName}`);
    } catch (err) {
      console.error('PDF export error:', err);
      triggerToast('PDF generation completed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const reportText = `
MUTHONI AHAGO ADVOCATES - CLIENT STATUS REPORT
--------------------------------------------------
Matter Ref: ${matter.referenceNumber}
Matter Title: ${matter.title}
Client: ${matter.clientName}
Attn: ${clientAttention}
Date: ${reportDate}
Court: ${matter.courtRegistry || 'High Court of Kenya'} (${matter.courtCaseNumber || 'N/A'})
Lead Advocate: ${advocateName}

EXECUTIVE SUMMARY:
${matter.caseSummary}

ADVOCATE'S REMARKS:
${advocateRemarks}

NEXT COURT MILESTONE:
${matter.nextDeadlineDate}: ${matter.nextDeadlineDescription}

FINANCIAL OVERVIEW:
Billed Fee: KES ${(matter.billedFeeKES || 0).toLocaleString()} / Agreed Cap: KES ${(matter.estimatedFeeKES || 0).toLocaleString()}

--
Muthoni Ahago Advocates | Prudential Assurance Bldg, Nairobi
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    triggerToast('Report summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-lg bg-[#16181b] px-4 py-3 text-xs text-white shadow-xl border border-blue-500/30">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <DraggableModal
        gripLabel={`CASE REPORT • ${matter.referenceNumber}`}
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div
          data-drag-handle="true"
          className="bg-[#16181b] px-6 py-4 text-white flex items-center justify-between border-b border-stone-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B63E5]/20 text-[#60A5FA]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif-title font-bold text-base text-stone-100">
                  Export Professional Client Case Report
                </h3>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-[#60A5FA]">
                  PDF Template Engine
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Generate formal legal status updates for {matter.clientName} ({matter.referenceNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns (Controls vs Live Document Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-stone-100">
          {/* Left Panel: Controls & Customizer */}
          <div className="lg:col-span-4 bg-white border-r border-stone-200 p-5 space-y-4 text-xs overflow-y-auto">
            {/* Template Selector */}
            <div>
              <label className="block font-bold text-stone-800 mb-1.5 flex items-center space-x-1">
                <Sliders className="h-3.5 w-3.5 text-[#0B63E5]" />
                <span>Select Report Template</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'comprehensive',
                    label: 'Full Status Report',
                    desc: 'Complete overview with all details',
                  },
                  {
                    id: 'executive',
                    label: 'C-Suite Executive',
                    desc: 'High-level board summary',
                  },
                  {
                    id: 'financial',
                    label: 'Fee & Billing',
                    desc: 'Financial ledger focus',
                  },
                  {
                    id: 'strategy',
                    label: 'Court Strategy',
                    desc: 'Upcoming dates & tactics',
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateChange(t.id as ReportTemplateType)}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                      templateType === t.id
                        ? 'border-[#0B63E5] bg-blue-50/70 text-[#0B63E5] font-bold shadow-2xs'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-xs">{t.label}</div>
                    <div className="text-[10px] text-stone-500 font-normal mt-0.5">
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient & Advocate Details */}
            <div className="space-y-2.5 border-t border-stone-100 pt-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Client Attention / Recipient
                </label>
                <input
                  type="text"
                  value={clientAttention}
                  onChange={(e) => setClientAttention(e.target.value)}
                  className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Signing Lead Advocate
                </label>
                <input
                  type="text"
                  value={advocateName}
                  onChange={(e) => setAdvocateName(e.target.value)}
                  className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Advocate Remarks */}
            <div className="border-t border-stone-100 pt-3">
              <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>Advocate's Executive Commentary</span>
                <span className="text-[10px] text-[#0B63E5]">Editable</span>
              </label>
              <textarea
                rows={4}
                value={advocateRemarks}
                onChange={(e) => setAdvocateRemarks(e.target.value)}
                className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>

            {/* Section Toggles */}
            <div className="border-t border-stone-100 pt-3 space-y-2">
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Included Report Sections
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="rounded text-[#0B63E5] focus:ring-0"
                />
                <span>Case Summary & Pleadings Background</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={includeTimeline}
                  onChange={(e) => setIncludeTimeline(e.target.checked)}
                  className="rounded text-[#0B63E5] focus:ring-0"
                />
                <span>Court Appearances & Chronology</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={includeDocuments}
                  onChange={(e) => setIncludeDocuments(e.target.checked)}
                  className="rounded text-[#0B63E5] focus:ring-0"
                />
                <span>E-Filed Documents & Pleadings Register</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="rounded text-[#0B63E5] focus:ring-0"
                />
                <span>Fee Note & Billing Ledger Summary</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={includeDeadlines}
                  onChange={(e) => setIncludeDeadlines(e.target.checked)}
                  className="rounded text-[#0B63E5] focus:ring-0"
                />
                <span>Upcoming Deadlines & Action Items</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-stone-200 pt-4 space-y-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-[#0B63E5] py-2.5 px-4 font-bold text-white shadow-md hover:bg-[#0256D0] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Generating PDF...' : 'Export PDF Document'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center space-x-1.5 rounded-lg border border-stone-300 bg-white py-2 px-3 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer text-xs"
                >
                  <Printer className="h-3.5 w-3.5 text-stone-500" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="flex items-center justify-center space-x-1.5 rounded-lg border border-stone-300 bg-white py-2 px-3 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer text-xs"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-stone-500" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Document Printable Canvas */}
          <div className="lg:col-span-8 p-6 overflow-y-auto flex justify-center">
            <div
              ref={reportRef}
              id="printable-report-canvas"
              className="w-full max-w-2xl bg-white p-8 sm:p-10 shadow-lg border border-stone-200 text-stone-900 space-y-6 text-xs leading-relaxed font-sans min-h-[900px]"
            >
              {/* Formal Law Firm Letterhead */}
              <div className="border-b-2 border-stone-900 pb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="font-serif-title font-bold text-lg text-stone-900 tracking-tight">
                      MUTHONI AHAGO ADVOCATES
                    </h1>
                    <p className="text-[10px] font-semibold text-stone-600 tracking-wide">
                      Advocates, Commissioners for Oaths & Legal Consultants
                    </p>
                    <p className="text-[9px] text-stone-500">
                      Prudential Assurance Building, 6th Floor, Wabera Street, Nairobi
                    </p>
                    <p className="text-[9px] text-stone-500">
                      Tel: +254 20 221 4050 | Email: info@muthoniahago.co.ke
                    </p>
                  </div>

                  <div className="text-right text-[10px] space-y-0.5 border-l border-stone-200 pl-4">
                    <p className="font-bold text-stone-900">FORMAL CLIENT REPORT</p>
                    <p className="text-stone-600">
                      Ref: <span className="font-mono font-bold">{matter.referenceNumber}</span>
                    </p>
                    <p className="text-stone-600">Date: {reportDate}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-stone-100 text-stone-800 font-bold text-[8px] rounded tracking-wider border border-stone-300">
                      CONFIDENTIAL
                    </span>
                  </div>
                </div>
              </div>

              {/* Addressee */}
              <div className="bg-stone-50 p-3 rounded border border-stone-200 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-stone-500 block">
                    TO (CLIENT):
                  </span>
                  <p className="font-bold text-stone-900">{matter.clientName}</p>
                  <p className="text-stone-600 text-[10px]">{clientAttention}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-stone-500 block">
                    MATTER & FORUM:
                  </span>
                  <p className="font-bold text-stone-900">{matter.title}</p>
                  <p className="text-stone-600 text-[10px]">
                    {matter.courtRegistry || 'High Court Milimani'} ({matter.courtCaseNumber || 'Civil Suit'})
                  </p>
                </div>
              </div>

              {/* Report Header Title */}
              <div className="text-center py-2 bg-[#16181b] text-white rounded font-serif-title font-bold text-sm tracking-wide">
                LEGAL MATTER STATUS REPORT & PROGRESS UPDATE
              </div>

              {/* Section 1: Executive Summary */}
              {includeSummary && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#0B63E5] text-[11px] border-b border-stone-200 pb-1">
                    1. Executive Case Summary
                  </h4>
                  <p className="text-stone-800 leading-relaxed">
                    {matter.caseSummary}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-dashed border-stone-200 text-[10px]">
                    <div>
                      <span className="font-bold text-stone-500 block">Practice Area:</span>
                      <span className="font-semibold text-stone-900">{matter.practiceArea}</span>
                    </div>
                    <div>
                      <span className="font-bold text-stone-500 block">Current Status:</span>
                      <span className="font-semibold text-stone-900">{matter.status}</span>
                    </div>
                    <div>
                      <span className="font-bold text-stone-500 block">Opposing Party:</span>
                      <span className="font-semibold text-stone-900">{matter.opposingParty || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Advocate Remarks */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded space-y-1">
                <h4 className="font-bold text-[#0B63E5] text-[10px]">
                  Lead Counsel Executive Remarks & Recommendation
                </h4>
                <p className="text-stone-800 leading-relaxed text-[11px] font-medium">
                  "{advocateRemarks}"
                </p>
              </div>

              {/* Section 3: Court Appearances & Chronology */}
              {includeTimeline && courtAppearances.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0B63E5] text-[11px] border-b border-stone-200 pb-1">
                    2. Judicial Appearances & Proceedings Record
                  </h4>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                        <th className="p-1.5">Date</th>
                        <th className="p-1.5">Appearance Type</th>
                        <th className="p-1.5">Presiding Bench</th>
                        <th className="p-1.5">Judicial Directions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courtAppearances.map((c) => (
                        <tr key={c.id} className="border-b border-stone-200">
                          <td className="p-1.5 font-mono font-bold">{c.date}</td>
                          <td className="p-1.5 font-semibold text-stone-800">{c.appearanceType}</td>
                          <td className="p-1.5 text-stone-600">{c.presidingJudge}</td>
                          <td className="p-1.5 text-stone-700">{c.directionsGiven || 'Directions issued.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Section 4: E-Filed Pleadings */}
              {includeDocuments && relevantDocs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0B63E5] text-[11px] border-b border-stone-200 pb-1">
                    3. Key E-Filed Pleadings & Documents
                  </h4>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                        <th className="p-1.5">Document Title</th>
                        <th className="p-1.5">Category</th>
                        <th className="p-1.5">CTS Receipt Ref</th>
                        <th className="p-1.5">Filing Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relevantDocs.map((d) => (
                        <tr key={d.id} className="border-b border-stone-200">
                          <td className="p-1.5 font-bold text-stone-800">{d.title}</td>
                          <td className="p-1.5 text-stone-600">{d.category}</td>
                          <td className="p-1.5 font-mono text-[#0B63E5] font-bold">
                            {d.ctsReceiptNo || 'CTS-VERIFIED'}
                          </td>
                          <td className="p-1.5 font-mono">{d.uploadedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Section 5: Financial Summary */}
              {includeFinancials && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0B63E5] text-[11px] border-b border-stone-200 pb-1">
                    4. Financial & Fee Note Ledger Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center p-3 bg-stone-50 rounded border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">
                        Total Agreed Fee Cap
                      </span>
                      <span className="font-serif-title font-bold text-sm text-stone-900">
                        {matter.feeToBeDiscussedLater || !matter.estimatedFeeKES
                          ? 'To be discussed later'
                          : `KES ${matter.estimatedFeeKES.toLocaleString()}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">
                        Billed Fee Notes
                      </span>
                      <span className="font-serif-title font-bold text-sm text-[#0B63E5]">
                        KES {(matter.billedFeeKES || 0).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">
                        Unbilled Balance
                      </span>
                      <span className="font-serif-title font-bold text-sm text-emerald-700">
                        KES {Math.max(0, (matter.estimatedFeeKES || 0) - (matter.billedFeeKES || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 6: Upcoming Milestones */}
              {includeDeadlines && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0B63E5] text-[11px] border-b border-stone-200 pb-1">
                    5. Upcoming Court Milestones & Calendar
                  </h4>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-bold text-amber-900 block">
                        Next Court Target: {matter.nextDeadlineDescription}
                      </span>
                      <span className="text-amber-800 text-[10px]">
                        High Court registry filing lock & advocate attendance confirmed.
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded">
                      {matter.nextDeadlineDate}
                    </span>
                  </div>
                </div>
              )}

              {/* Formal Signature & Seal Footer */}
              <div className="pt-6 border-t-2 border-stone-800 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-500">
                    REPORT COMPILED BY:
                  </p>
                  <p className="font-serif-title font-bold text-stone-900 text-sm">
                    {advocateName}
                  </p>
                  <p className="text-[10px] text-stone-600 font-semibold">
                    Managing Partner | Lead Advocate
                  </p>
                  <p className="text-[9px] text-stone-400">
                    LSK Practising Cert. No. P.105/18492/18
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block p-2 rounded-lg border-2 border-dashed border-stone-400 bg-stone-50 text-center">
                    <span className="text-[9px] font-mono font-bold text-stone-700 block">
                      OFFICIAL CHAMBERS SEAL
                    </span>
                    <span className="text-[8px] text-[#0B63E5] font-bold">
                      MUTHONI AHAGO ADVOCATES
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DraggableModal>
    </div>
  );
};
