import React, { useState } from 'react';
import { X, Check, Eye, Palette, Type, Layout, Sliders, FileText, CheckCircle2 } from 'lucide-react';
import { PdfTemplateConfig, PdfDocumentCategory } from '../../types';

interface PdfTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: PdfTemplateConfig | null;
  onSave: (updatedTemplate: PdfTemplateConfig, setAsDefault?: boolean) => void;
  category: PdfDocumentCategory;
}

const PRESET_COLORS = [
  { name: 'Chambers Sky Blue', value: '#0098db' },
  { name: 'Royal Navy', value: '#1e3a8a' },
  { name: 'Deep Emerald', value: '#059669' },
  { name: 'Executive Slate', value: '#1e293b' },
  { name: 'Burgundy Crimson', value: '#991b1b' },
  { name: 'Classic Gold Bronze', value: '#b45309' },
  { name: 'Imperial Violet', value: '#581c87' },
  { name: 'Teal Blue', value: '#0f766e' },
];

export const PdfTemplateEditorModal: React.FC<PdfTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
  category,
}) => {
  if (!isOpen || !template) return null;

  const [name, setName] = useState(template.name);
  const [accentColor, setAccentColor] = useState(template.accentColor || '#0098db');
  const [fontFamily, setFontFamily] = useState<'helvetica' | 'times' | 'courier'>(template.fontFamily || 'helvetica');
  const [headerStyle, setHeaderStyle] = useState<'standard' | 'tax-invoice' | 'paid-invoice' | 'modern-minimal' | 'classic-law'>(
    template.headerStyle || 'standard'
  );
  const [showBankDetails, setShowBankDetails] = useState(template.showBankDetails);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(template.showTermsAndConditions);
  const [showTaxColumn, setShowTaxColumn] = useState(template.showTaxColumn);
  const [showDiscountColumn, setShowDiscountColumn] = useState(template.showDiscountColumn);
  const [showWatermarkWhenPaid, setShowWatermarkWhenPaid] = useState(template.showWatermarkWhenPaid);
  const [showSignatureBlock, setShowSignatureBlock] = useState(template.showSignatureBlock);
  const [signatureLabel, setSignatureLabel] = useState(template.signatureLabel || 'Authorized Advocate Signature');
  const [footerNotes, setFooterNotes] = useState(
    template.footerNotes || 'Muthoni Ahago Advocates | The Triple Two Address, Ruiru | info@muthoniahago.co.ke'
  );
  const [makeDefault, setMakeDefault] = useState(template.isDefault);

  const handleSave = () => {
    const updated: PdfTemplateConfig = {
      ...template,
      name: name.trim() || 'Untitled Template',
      accentColor,
      fontFamily,
      headerStyle,
      showBankDetails,
      showTermsAndConditions,
      showTaxColumn,
      showDiscountColumn,
      showWatermarkWhenPaid,
      showSignatureBlock,
      signatureLabel,
      footerNotes,
      status: 'active',
    };
    onSave(updated, makeDefault);
    onClose();
  };

  const getFontFamilyCss = () => {
    if (fontFamily === 'times') return 'font-serif';
    if (fontFamily === 'courier') return 'font-mono';
    return 'font-sans';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Customize Template: {template.name}
              </h3>
              <p className="text-xs text-slate-500 capitalize">
                Category: {category.replace(/-/g, ' ')} &bull; ID: {template.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two-column Layout (Settings left, Live Preview right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 p-6 space-y-6 overflow-y-auto">
            {/* Template Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:border-transparent font-medium"
                placeholder="e.g. Standard Corporate Invoice"
              />
            </div>

            {/* Accent Color Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Brand / Accent Color
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAccentColor(c.value)}
                    className={`flex items-center space-x-1.5 p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                      accentColor.toLowerCase() === c.value.toLowerCase()
                        ? 'border-slate-800 bg-slate-50 shadow-xs ring-1 ring-slate-800'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="truncate text-[11px] text-slate-700">{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-28 px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
                  placeholder="#0098DB"
                />
                <span className="text-xs text-slate-500">Custom Hex Code</span>
              </div>
            </div>

            {/* Typography / Font Family */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Document Typography
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'helvetica', label: 'Helvetica / Sans', font: 'font-sans' },
                  { id: 'times', label: 'Times / Serif', font: 'font-serif' },
                  { id: 'courier', label: 'Courier / Mono', font: 'font-mono' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontFamily(f.id as any)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      fontFamily === f.id
                        ? 'border-[#0070ba] bg-blue-50/50 text-[#0070ba] font-bold ring-1 ring-[#0070ba]'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className={`block text-sm ${f.font}`}>Aa</span>
                    <span className="text-[11px] block mt-0.5">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Layout Style */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Header Layout & Identity Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard', title: 'Standard Corporate', desc: 'Prominent balance due and header' },
                  { id: 'tax-invoice', title: 'KRA Tax Compliant', desc: 'Statutory VAT & KRA PIN emphasis' },
                  { id: 'paid-invoice', title: 'Paid Stamp Watermark', desc: 'Emerald receipt acknowledgment' },
                  { id: 'modern-minimal', title: 'Modern Minimalist', desc: 'Clean slate dividers and spacing' },
                  { id: 'classic-law', title: 'Classic Chambers', desc: 'Traditional advocate formal styling' },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHeaderStyle(h.id as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      headerStyle === h.id
                        ? 'border-[#0070ba] bg-blue-50/50 text-[#0070ba] font-bold ring-1 ring-[#0070ba]'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{h.title}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{h.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Toggles */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Document Sections & Visibility
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
                />
                <span className="font-medium">Display Chambers Bank Payment Particulars Box</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTermsAndConditions}
                  onChange={(e) => setShowTermsAndConditions(e.target.checked)}
                  className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
                />
                <span className="font-medium">Display Terms & Conditions Section</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWatermarkWhenPaid}
                  onChange={(e) => setShowWatermarkWhenPaid(e.target.checked)}
                  className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
                />
                <span className="font-medium">Render "PAID" Stamp Watermark When Balance is Zero</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatureBlock}
                  onChange={(e) => setShowSignatureBlock(e.target.checked)}
                  className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
                />
                <span className="font-medium">Include Advocate / Signatory Endorsement Block</span>
              </label>

              {showSignatureBlock && (
                <div className="pl-6 pt-1">
                  <input
                    type="text"
                    value={signatureLabel}
                    onChange={(e) => setSignatureLabel(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-medium"
                    placeholder="e.g. Advocate of the High Court of Kenya"
                  />
                </div>
              )}
            </div>

            {/* Custom Footer Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Custom Footer Text
              </label>
              <input
                type="text"
                value={footerNotes}
                onChange={(e) => setFooterNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
                placeholder="Firm name, address, contact details"
              />
            </div>

            {/* Set as Default Checkbox */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center space-x-2.5 text-xs text-slate-800 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
                />
                <span>Set this template as default for {category.replace(/-/g, ' ')}</span>
              </label>
            </div>
          </div>

          {/* Right Column: High-fidelity Live Document Preview */}
          <div className="lg:col-span-6 bg-slate-100/70 p-6 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full max-w-md mb-2 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Live PDF Layout Preview</span>
              </span>
              <span className="text-[11px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-mono">A4 Portrait</span>
            </div>

            {/* The Document Sheet */}
            <div
              className={`w-full max-w-md bg-white rounded-lg shadow-md border border-slate-300 p-5 space-y-4 text-slate-900 ${getFontFamilyCss()} transition-all`}
            >
              {/* Top Header */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-xs shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      MA
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">Muthoni Ahago Advocates</div>
                      <div className="text-[9px] text-slate-500">Exceptional Legal Insight</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-slate-500 leading-tight">
                    The Triple Two Address, Ruiru<br />
                    Phone: +254 (0)20 271 9900<br />
                    KRA PIN: P0512839401Z
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className="text-base font-bold uppercase tracking-tight"
                    style={{ color: accentColor }}
                  >
                    {headerStyle === 'tax-invoice'
                      ? 'TAX INVOICE'
                      : headerStyle === 'paid-invoice'
                      ? 'PAID INVOICE'
                      : headerStyle === 'classic-law'
                      ? 'BILL OF COSTS'
                      : 'FEE NOTE'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-800"># INV-000544</div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    Balance Due:{' '}
                    <span className="font-bold text-slate-900">
                      {headerStyle === 'paid-invoice' ? 'KES 0.00' : 'KES 50,000.00'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">Date: 2026-11-01</div>
                </div>
              </div>

              {/* Bill To & Project */}
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/70 p-2.5 rounded border border-slate-200/80">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Bill To:</span>
                  <p className="font-bold text-slate-800">Caroline Wambui Kibunja</p>
                  <p className="text-[9px] text-slate-500">Nairobi, Kenya</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Subject:</span>
                  <p className="font-medium text-slate-800 line-clamp-2">
                    Professional Legal Fees towards breach of contract follow-up
                  </p>
                </div>
              </div>

              {/* Table Preview */}
              <div>
                <div
                  className="px-2 py-1.5 rounded-t text-white text-[9px] font-bold flex justify-between items-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="w-8">#</span>
                  <span className="flex-1">Description</span>
                  <span className="w-12 text-right">Qty</span>
                  <span className="w-16 text-right">Rate</span>
                  <span className="w-16 text-right">Amount</span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b divide-y divide-slate-100 text-[9px]">
                  <div className="px-2 py-1.5 flex justify-between items-center text-slate-700">
                    <span className="w-8 font-medium">1</span>
                    <span className="flex-1 truncate">Legal consultation & document review</span>
                    <span className="w-12 text-right">1.00</span>
                    <span className="w-16 text-right">50,000.00</span>
                    <span className="w-16 text-right font-bold text-slate-900">50,000.00</span>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-1">
                <div className="w-48 text-[9px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>KES 50,000.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-[10px] border-t border-slate-200 pt-1">
                    <span>Total Amount:</span>
                    <span>KES 50,000.00</span>
                  </div>
                </div>
              </div>

              {/* Bank Particulars Box (if enabled) */}
              {showBankDetails && (
                <div
                  className="rounded border p-2 text-[8px] bg-slate-50/70"
                  style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
                >
                  <div className="font-bold uppercase text-[9px] mb-0.5" style={{ color: accentColor }}>
                    Bank Payment Particulars
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-600">
                    <div>
                      <span className="font-bold">Bank:</span> KCB Bank Kenya
                    </div>
                    <div>
                      <span className="font-bold">Account Name:</span> Client Trust A/C
                    </div>
                    <div>
                      <span className="font-bold">Account No:</span> 1289405821
                    </div>
                    <div>
                      <span className="font-bold">Paybill:</span> 522522
                    </div>
                  </div>
                </div>
              )}

              {/* Terms & Conditions (if enabled) */}
              {showTermsAndConditions && (
                <div className="text-[8px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                  <span className="font-bold text-slate-700">Terms & Conditions: </span>
                  Payable on presentation. Remuneration governed by Advocates Remuneration Order.
                </div>
              )}

              {/* Signature Block (if enabled) */}
              {showSignatureBlock && (
                <div className="pt-2 flex justify-end">
                  <div className="text-right border-t border-slate-400 pt-1 w-44">
                    <div className="text-[9px] font-bold text-slate-800">{signatureLabel}</div>
                    <div className="text-[8px] text-slate-500">Muthoni Ahago Advocates</div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-200 pt-2 text-center text-[7.5px] text-slate-400 truncate">
                {footerNotes}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white">
          <div className="text-xs text-slate-500">
            {makeDefault && (
              <span className="inline-flex items-center text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Will be set as active default
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: accentColor || '#0070ba' }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
