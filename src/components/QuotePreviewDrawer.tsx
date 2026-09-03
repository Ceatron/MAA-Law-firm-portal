import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  ShieldCheck,
  ArrowRightCircle,
  Edit3,
} from 'lucide-react';
import { Quotation } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface QuotePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quotation | null;
  onConvertToInvoice?: (quote: Quotation) => void;
  onEditQuote?: (quote: Quotation) => void;
  onUpdateStatus?: (quoteId: string, status: Quotation['status']) => void;
}

export const QuotePreviewDrawer: React.FC<QuotePreviewDrawerProps> = ({
  isOpen,
  onClose,
  quote,
  onConvertToInvoice,
  onEditQuote,
  onUpdateStatus,
}) => {
  const quoteRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !quote) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert(`Quotation ${quote.quoteNumber} downloaded as PDF.`);
  };

  const isConverted = quote.status === 'Converted to Invoice';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-stone-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0098db]/20 text-[#0098db] border border-[#0098db]/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif-title text-base font-bold text-white">
                  Legal Fee Quotation & Proforma
                </h2>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider ${
                    quote.status === 'Accepted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : quote.status === 'Converted to Invoice'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                      : quote.status === 'Sent'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : quote.status === 'Rejected'
                      ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                      : 'bg-stone-500/20 text-stone-300 border border-stone-400/30'
                  }`}
                >
                  {quote.status}
                </span>
              </div>
              <p className="text-xs text-stone-300 font-mono">
                {quote.quoteNumber} • Valid until {new Date(quote.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onConvertToInvoice && !isConverted && (
              <button
                type="button"
                onClick={() => onConvertToInvoice(quote)}
                className="flex items-center space-x-1.5 rounded-lg bg-[#0098db] hover:bg-[#0087c2] text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <ArrowRightCircle className="h-4 w-4" />
                <span>Convert to Invoice</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-stone-100/70">
          <div
            ref={quoteRef}
            className="mx-auto max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-stone-200 space-y-6 text-stone-800"
          >
            
            {/* Firm Header */}
            <div className="border-b-2 border-[#132c3f] pb-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <CompanyLogo className="h-12 w-12 text-[#132c3f]" />
                  <div>
                    <h1 className="font-serif-title text-lg font-bold text-[#132c3f] tracking-tight">
                      MUTHONI AHAGO & ASSOCIATES
                    </h1>
                    <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                      Advocates • Commissioners for Oaths • Notaries Public
                    </p>
                    <p className="text-[10px] text-stone-500">
                      Upper Hill Chambers, 4th Floor, Nairobi • Tel: +254 20 271 0000 • Email: billing@muthoniahago.co.ke
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-stone-200 sm:pl-4">
                  <span className="inline-block rounded bg-blue-100 text-blue-900 px-2.5 py-1 text-xs font-bold font-mono uppercase tracking-wider">
                    FEE QUOTATION
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-900 mt-1">
                    {quote.quoteNumber}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Date: {new Date(quote.quoteDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold">
                    Valid Until: {new Date(quote.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Client Particulars & Subject Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-stone-50 p-4 border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Prepared For (Client)
                </span>
                <p className="font-bold text-stone-900 text-sm">{quote.clientName}</p>
                {quote.clientKraPin && (
                  <p className="text-[11px] font-mono text-stone-600">KRA PIN: {quote.clientKraPin}</p>
                )}
                {quote.clientEmail && (
                  <p className="text-[11px] text-stone-600">{quote.clientEmail}</p>
                )}
                {quote.clientPhone && (
                  <p className="text-[11px] text-stone-500">{quote.clientPhone}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Subject / Instruction Matter
                </span>
                <p className="font-bold text-stone-900">{quote.title}</p>
                {quote.matterTitle && (
                  <p className="text-[11px] text-[#0098db] font-medium mt-1">
                    Matter Ref: {quote.matterTitle}
                  </p>
                )}
                {isConverted && (
                  <div className="mt-2 rounded bg-purple-100 text-purple-900 p-1.5 text-[10px] font-bold">
                    ✓ Converted into Invoice: {quote.convertedInvoiceNumber || 'INV Generated'}
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Fee Schedule */}
            <div className="rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 w-16 text-center">Qty / Hrs</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Rate (KES)</th>
                    <th className="py-2.5 px-2 w-20 text-center">Tax Status</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {quote.items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-3">
                        <p className="font-bold text-stone-900">{item.description}</p>
                        <p className="text-[10px] text-stone-500">{item.category}</p>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{item.unitPriceKES.toLocaleString()}</td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                            item.isTaxable !== false
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {item.isTaxable !== false ? '16% VAT' : 'Exempt'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                        {item.totalPriceKES.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2 border-t border-stone-200">
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-semibold">KES {quote.subtotalKES.toLocaleString()}</span>
                </div>
                {quote.discountKES > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">- KES {quote.discountKES.toLocaleString()}</span>
                  </div>
                )}
                {quote.taxableAmountKES > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Professional Fees:</span>
                    <span className="font-mono">KES {quote.taxableAmountKES.toLocaleString()}</span>
                  </div>
                )}
                {quote.nonTaxableAmountKES > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Exempt CTS & Disbursements:</span>
                    <span className="font-mono">KES {quote.nonTaxableAmountKES.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-700 font-semibold pt-1 border-t border-stone-200">
                  <span>VAT (16% on taxable fees):</span>
                  <span className="font-mono font-bold text-stone-800">KES {quote.vatKES.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-[#132c3f] text-white p-2.5 rounded-lg font-bold text-sm mt-2">
                  <span>TOTAL ESTIMATE:</span>
                  <span className="font-mono text-[#00c0ef]">KES {quote.totalKES.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            {quote.termsAndConditions && (
              <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3.5 text-xs text-stone-700 space-y-1">
                <p className="font-bold flex items-center space-x-1.5 text-stone-900">
                  <ShieldCheck className="h-4 w-4 text-[#0098db]" />
                  <span>Terms of Engagement & Validity</span>
                </p>
                <div className="text-[11px] leading-relaxed whitespace-pre-line text-stone-600">
                  {quote.termsAndConditions}
                </div>
              </div>
            )}

            {/* Client Acceptance Sign-off block */}
            <div className="pt-6 border-t-2 border-stone-200 grid grid-cols-2 gap-6 text-[11px]">
              <div>
                <p className="font-bold text-stone-800">For: Muthoni Ahago & Associates</p>
                <div className="h-10 flex items-end">
                  <span className="font-serif italic text-stone-600 text-sm font-semibold">
                    Managing Partner / Invoicing Desk
                  </span>
                </div>
                <p className="border-t border-stone-300 pt-1 text-stone-400">Authorized Signature</p>
              </div>

              <div>
                <p className="font-bold text-stone-800">Client Acceptance Sign-off:</p>
                <div className="h-10 flex items-end">
                  <span className="font-serif italic text-stone-400 text-xs">
                    (Sign here to confirm formal instruction)
                  </span>
                </div>
                <p className="border-t border-stone-300 pt-1 text-stone-400">Name, Designation & Date</p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Footer */}
        <div className="border-t border-stone-200 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            {onUpdateStatus && (
              <select
                value={quote.status}
                onChange={(e) => onUpdateStatus(quote.id, e.target.value as Quotation['status'])}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                <option value="Draft">Status: Draft</option>
                <option value="Sent">Status: Sent</option>
                <option value="Accepted">Status: Accepted</option>
                <option value="Rejected">Status: Rejected</option>
                <option value="Expired">Status: Expired</option>
                <option value="Converted to Invoice">Status: Converted</option>
              </select>
            )}
            {onEditQuote && !isConverted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditQuote(quote);
                }}
                className="flex items-center space-x-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Quote</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center space-x-1.5 rounded-lg bg-[#132c3f] text-white px-4 py-2 text-xs font-bold hover:bg-[#1a3a52] transition-colors cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            {onConvertToInvoice && !isConverted && (
              <button
                type="button"
                onClick={() => onConvertToInvoice(quote)}
                className="flex items-center space-x-1.5 rounded-lg bg-[#0098db] text-white px-4 py-2 text-xs font-bold hover:bg-[#0087c2] transition-colors cursor-pointer shadow-xs"
              >
                <ArrowRightCircle className="h-4 w-4" />
                <span>Convert to Invoice</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
