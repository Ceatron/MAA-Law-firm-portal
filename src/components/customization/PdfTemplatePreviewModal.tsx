import React from 'react';
import { X, Download, Star, Check, FileText, Printer } from 'lucide-react';
import { PdfTemplateConfig, ChambersSettings } from '../../types';
import { generateInvoicePdf, downloadInvoicePdf } from '../../utils/invoicePdfGenerator';

interface PdfTemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: PdfTemplateConfig | null;
  settings: ChambersSettings;
  onSetDefault: (templateId: string) => void;
}

export const PdfTemplatePreviewModal: React.FC<PdfTemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  settings,
  onSetDefault,
}) => {
  if (!isOpen || !template) return null;

  const sampleFeeNote = {
    id: 'preview-inv-001',
    invoiceNumber: 'INV-000544',
    dateIssued: '2026-11-01',
    dueDate: '2026-11-02',
    terms: 'Due on Receipt',
    clientId: 'cl-101',
    clientName: 'Caroline Wambui Kibunja',
    clientAddress: 'The Mirage Tower, 4th Floor, Westlands, Nairobi, Kenya',
    matterId: 'mat-001',
    matterTitle: 'Breach of Contract by Samuel Henia Muthoni',
    subject: 'Breach of contract recovery and dispute resolution follow-up',
    items: [
      {
        id: 'item-1',
        description: 'Professional Legal Fees towards follow-up on the refund of Kshs. 460,189.00 arising from breach of contract',
        quantity: 1,
        unitPriceKES: 50000,
        totalPriceKES: 50000,
        isTaxable: false,
      },
    ],
    amountKES: 50000,
    subtotalKES: 50000,
    vatKES: 0,
    totalKES: 50000,
    balanceKES: template.headerStyle === 'paid-invoice' ? 0 : 50000,
    amountPaidKES: template.headerStyle === 'paid-invoice' ? 50000 : 0,
    status: template.headerStyle === 'paid-invoice' ? ('Paid' as const) : ('Unpaid' as const),
    notes: 'Thanks for your business.',
    customerNotes: 'Thanks for your business.',
    termsAndConditions: 'Governed by Advocates (Remuneration) Order. Payable immediately on presentation.',
  };

  const handleDownloadSample = () => {
    // Generate with custom settings reflecting this template
    const previewSettings: ChambersSettings = {
      ...settings,
      customization: {
        ...(settings.customization || ({} as any)),
        selectedTemplates: {
          ...(settings.customization?.selectedTemplates || {}),
          invoices: template.id,
        },
        customTemplates: [
          template,
          ...(settings.customization?.customTemplates?.filter((t) => t.id !== template.id) || []),
        ],
        transactionSeries: settings.customization?.transactionSeries || ({} as any),
        emailNotifications: settings.customization?.emailNotifications || ({} as any),
      },
    };
    downloadInvoicePdf(sampleFeeNote, previewSettings);
  };

  const getFontFamilyClass = () => {
    if (template.fontFamily === 'times') return 'font-serif';
    if (template.fontFamily === 'courier') return 'font-mono';
    return 'font-sans';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>{template.name}</span>
                {template.isDefault && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>DEFAULT</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Template Preview &bull; {template.fontFamily} &bull; {template.headerStyle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!template.isDefault && (
              <button
                type="button"
                onClick={() => onSetDefault(template.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-slate-500" />
                <span>Set as Default</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition-colors cursor-pointer"
              style={{ backgroundColor: template.accentColor }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container: Rendered A4 Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center items-start">
          <div
            className={`w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-300 p-8 sm:p-10 space-y-6 ${getFontFamilyClass()}`}
          >
            {/* Top Row: Logo & Invoice Header */}
            <div className="flex items-start justify-between border-b pb-5 border-slate-200">
              <div>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: template.accentColor }}
                  >
                    MA
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Muthoni Ahago Advocates
                    </h2>
                    <p className="text-xs text-slate-500">Exceptional Legal Insight</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                  The Triple Two Address, Ruiru<br />
                  Block B, 1st Floor<br />
                  Phone: {settings.phone || '+254 (0)20 271 9900'}<br />
                  Email: {settings.email || 'info@muthoniahago.co.ke'}<br />
                  KRA PIN: {settings.kraPin || 'P0512839401Z'}
                </div>
              </div>

              <div className="text-right">
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight uppercase"
                  style={{ color: template.accentColor }}
                >
                  {template.headerStyle === 'tax-invoice'
                    ? 'TAX INVOICE'
                    : template.headerStyle === 'paid-invoice'
                    ? 'PAID INVOICE'
                    : template.headerStyle === 'classic-law'
                    ? 'BILL OF COSTS'
                    : 'FEE NOTE'}
                </h1>
                <div className="text-sm font-bold text-slate-900 mt-1"># INV-000544</div>

                <div className="mt-2 text-xs text-slate-500">
                  Balance Due:
                  <div className="text-lg font-bold text-slate-900">
                    {template.headerStyle === 'paid-invoice' ? 'KES 0.00' : 'KES 50,000.00'}
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                  <div>Invoice Date: 2026-11-01</div>
                  <div>Terms: Due on Receipt</div>
                  <div>Due Date: 2026-11-02</div>
                </div>
              </div>
            </div>

            {/* Bill To & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  BILL TO:
                </span>
                <p className="font-bold text-slate-900 text-sm">Caroline Wambui Kibunja</p>
                <p className="text-slate-600">The Mirage Tower, Westlands, Nairobi</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  PROJECT / MATTER:
                </span>
                <p className="font-medium text-slate-800">
                  Breach of contract by Samuel Henia Muthoni & Recovery Proceedings
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead
                  className="text-white text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: template.accentColor }}
                >
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center">#</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 text-right w-16">Qty</th>
                    <th className="px-3 py-2.5 text-right w-24">Rate (KES)</th>
                    <th className="px-3 py-2.5 text-right w-28">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr className="bg-white">
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">1</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">
                        Professional Legal Fees towards breach of contract recovery
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Demand notice, legal analysis, settlement meetings & litigation preparation
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">1.00</td>
                    <td className="px-3 py-3 text-right font-medium">50,000.00</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900">50,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Subtotals & Balances */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Notes:</p>
                <p className="italic">Thanks for your business.</p>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span className="font-semibold">50,000.00</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-300 pt-1.5">
                  <span>Total (KES):</span>
                  <span>KES 50,000.00</span>
                </div>
                {template.headerStyle === 'paid-invoice' && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                    <span>Payment Received:</span>
                    <span>-KES 50,000.00</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t-2 border-slate-900 pt-1">
                  <span>Balance Due:</span>
                  <span style={{ color: template.accentColor }}>
                    {template.headerStyle === 'paid-invoice' ? 'KES 0.00' : 'KES 50,000.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Particulars Box (if enabled) */}
            {template.showBankDetails && (
              <div
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs"
                style={{ borderLeftWidth: '4px', borderLeftColor: template.accentColor }}
              >
                <div
                  className="font-bold uppercase tracking-wider text-[11px] mb-2"
                  style={{ color: template.accentColor }}
                >
                  Chambers Bank Payment Particulars
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900">Bank Name:</span> KCB Bank Kenya
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Account Name:</span> Muthoni Ahago Advocates Client Trust A/C
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Account Number:</span> 1289405821
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Branch:</span> Ruiru Branch
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">M-Pesa Paybill:</span> 522522
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">SWIFT Code:</span> KCBLKENX
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions (if enabled) */}
            {template.showTermsAndConditions && (
              <div className="text-[11px] text-slate-500 bg-slate-50/80 p-3 rounded-lg border border-slate-200 leading-relaxed">
                <span className="font-bold text-slate-700">Terms & Conditions: </span>
                Payable immediately upon presentation. In accordance with the Advocates (Remuneration) Order,
                unsettled fees carry statutory interest. All payments to be credited to the official client trust account.
              </div>
            )}

            {/* Signature Block (if enabled) */}
            {template.showSignatureBlock && (
              <div className="pt-4 flex justify-end">
                <div className="text-right border-t-2 border-slate-800 pt-2 w-56">
                  <p className="text-xs font-bold text-slate-900">{template.signatureLabel || 'Authorized Signatory'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Muthoni Ahago Advocates</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
              {template.footerNotes || 'Muthoni Ahago Advocates | +254 (0)20 271 9900 | info@muthoniahago.co.ke | www.muthoniahago.co.ke'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
