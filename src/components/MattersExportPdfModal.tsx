import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Check,
  Building2,
  Calendar,
  User,
  Shield,
  Filter,
  DollarSign,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { LegalMatter, Advocate } from '../types';
import { generateMattersPdf, MattersPdfExportOptions } from '../utils/mattersPdfGenerator';

interface MattersExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export const MattersExportPdfModal: React.FC<MattersExportPdfModalProps> = ({
  isOpen,
  onClose,
  matters,
  currentAdvocate,
  isManagingAdvocate = true,
  filterSummary,
}) => {
  if (!isOpen) return null;

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [customRemarks, setCustomRemarks] = useState(
    `Official Chambers status extract prepared for litigation committee review and registry compliance check on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`
  );
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const highCount = matters.filter((m) => m.priority === 'High').length;
  const mediumCount = matters.filter((m) => m.priority === 'Medium').length;
  const lowCount = matters.filter((m) => m.priority === 'Low').length;
  const totalEstKES = matters.reduce((sum, m) => sum + (m.estimatedFeeKES || 0), 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadPdf = () => {
    setIsExporting(true);
    showToast('Generating official PDF report...');

    try {
      const doc = generateMattersPdf({
        matters,
        currentAdvocate,
        isManagingAdvocate,
        filterSummary,
        customRemarks,
        includeFinancials,
        orientation,
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `Muthoni_Ahago_Advocates_Matters_Registry_Report_${todayStr}.pdf`;
      doc.save(filename);
      showToast(`Report downloaded: ${filename}`);
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Error generating PDF report.');
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      const doc = generateMattersPdf({
        matters,
        currentAdvocate,
        isManagingAdvocate,
        filterSummary,
        customRemarks,
        includeFinancials,
        orientation,
      });
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4.5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white flex items-center gap-2.5">
                <span>Export Matters Registry PDF Report</span>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-md font-mono font-semibold border border-amber-500/30">
                  {matters.length} Matters
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-resolution, formal chambers audit report matching active filters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in shadow-2xs">
            <Check className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Filter Scope Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-2.5">
            <h3 className="text-[11px] font-semibold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-amber-700" />
              <span>Current Table Filters to be Exported</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Practice Area:</span>
                <span className="font-semibold text-slate-900 truncate block mt-0.5">
                  {filterSummary?.practiceArea || 'All Practice Areas'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Priority:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                  {filterSummary?.priority === 'High' ? (
                    <span className="text-rose-700 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>High ({highCount})</span>
                    </span>
                  ) : filterSummary?.priority === 'Medium' ? (
                    <span className="text-amber-800 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>Medium ({mediumCount})</span>
                    </span>
                  ) : filterSummary?.priority === 'Low' ? (
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>Low ({lowCount})</span>
                    </span>
                  ) : (
                    <span>All ({matters.length})</span>
                  )}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Court Status:</span>
                <span className="font-semibold text-slate-900 truncate block mt-0.5">
                  {filterSummary?.status || 'All Statuses'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Estimated Value:</span>
                <span className="font-bold text-amber-900 font-mono block mt-0.5">
                  KES {totalEstKES.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Export Configurations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paper Orientation */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-white shadow-2xs">
              <label className="block text-xs font-semibold text-slate-800 mb-2.5">
                Page Layout & Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    orientation === 'landscape'
                      ? 'border-slate-900 bg-slate-950 text-white shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Landscape (Wide)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    orientation === 'portrait'
                      ? 'border-slate-900 bg-slate-950 text-white shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Portrait (Compact)</span>
                </button>
              </div>
            </div>

            {/* Financial Summary Option */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Portfolio Financial Summary
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Include aggregate estimated fees and fee notes audit footer in the generated PDF report.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="rounded border-slate-300 text-slate-950 focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold">Include Financial Portfolio Aggregates</span>
              </label>
            </div>
          </div>

          {/* Custom Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Chambers Audit Remarks & Instructions (Header Note)
            </label>
            <textarea
              rows={2}
              value={customRemarks}
              onChange={(e) => setCustomRemarks(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none transition shadow-2xs"
              placeholder="Enter advocate remarks to appear on the official certified header..."
            />
          </div>

          {/* Quick Table Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 tracking-wider">
                Registry Report Sample ({matters.length} records total)
              </span>
              <span className="text-[11px] text-slate-400">Showing first {Math.min(matters.length, 5)} rows</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Ref No</th>
                    <th className="py-2.5 px-3">Title & Court Ref</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Lead Counsel</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {matters.slice(0, 5).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.referenceNumber}</td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate">{m.title}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.priority === 'High'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : m.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {m.priority}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 truncate max-w-[120px]">{m.clientName}</td>
                      <td className="py-2 px-3 text-slate-700">{m.responsibleAdvocateName}</td>
                      <td className="py-2 px-3 text-slate-600">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4.5 py-2 text-xs font-semibold text-white bg-slate-950 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Generating PDF...' : `Download PDF (${matters.length} Matters)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
