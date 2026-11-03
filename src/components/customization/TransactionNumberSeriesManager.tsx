import React, { useState } from 'react';
import { Hash, Save, RotateCcw, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { ChambersSettings, TransactionSeriesItem } from '../../types';

interface TransactionNumberSeriesManagerProps {
  settings: ChambersSettings;
  onUpdateSettings: (newSettings: ChambersSettings) => void;
  showToast: (msg: string) => void;
}

export const TransactionNumberSeriesManager: React.FC<TransactionNumberSeriesManagerProps> = ({
  settings,
  onUpdateSettings,
  showToast,
}) => {
  const currentSeries = settings.customization?.transactionSeries || {
    invoices: { prefix: 'INV-', nextNumber: 1, padding: 6 },
    quotes: { prefix: 'QT-', nextNumber: 101, padding: 4 },
    receipts: { prefix: 'MAA-RCP-', nextNumber: 1, padding: 4 },
    creditNotes: { prefix: 'CN-', nextNumber: 1, padding: 4 },
  };

  const [invoices, setInvoices] = useState<TransactionSeriesItem>(currentSeries.invoices);
  const [quotes, setQuotes] = useState<TransactionSeriesItem>(currentSeries.quotes);
  const [receipts, setReceipts] = useState<TransactionSeriesItem>(currentSeries.receipts);
  const [creditNotes, setCreditNotes] = useState<TransactionSeriesItem>(currentSeries.creditNotes);

  const formatPreview = (item: TransactionSeriesItem) => {
    const numStr = String(item.nextNumber).padStart(item.padding || 4, '0');
    return `${item.prefix || ''}${numStr}${item.suffix || ''}`;
  };

  const handleSave = () => {
    const updatedSettings: ChambersSettings = {
      ...settings,
      customization: {
        ...(settings.customization || ({} as any)),
        selectedTemplates: settings.customization?.selectedTemplates || {},
        customTemplates: settings.customization?.customTemplates || [],
        emailNotifications: settings.customization?.emailNotifications || ({} as any),
        transactionSeries: {
          invoices,
          quotes,
          receipts,
          creditNotes,
        },
      },
    };

    onUpdateSettings(updatedSettings);
    showToast('Transaction number series configurations saved successfully!');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h3 className="text-xl font-serif-title font-bold text-slate-900 flex items-center space-x-2">
            <Hash className="w-5 h-5 text-[#0070ba]" />
            <span>Transaction Number Series</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Set default prefixes, sequence padding, and sequential numbering rules for Chambers financial documents
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0070ba] hover:bg-[#005a96] rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Series</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Fee Notes / Invoices */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h4 className="text-sm font-bold text-slate-900">Fee Notes & Invoices</h4>
            <span className="text-[11px] font-mono font-bold text-[#0070ba] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Preview: {formatPreview(invoices)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefix</label>
              <input
                type="text"
                value={invoices.prefix}
                onChange={(e) => setInvoices({ ...invoices, prefix: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Number</label>
              <input
                type="number"
                min={1}
                value={invoices.nextNumber}
                onChange={(e) => setInvoices({ ...invoices, nextNumber: Number(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Padding Digits</label>
              <input
                type="number"
                min={2}
                max={8}
                value={invoices.padding}
                onChange={(e) => setInvoices({ ...invoices, padding: Number(e.target.value) || 4 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Used when drafting Fee Notes from Matters or billing dashboard.
          </p>
        </div>

        {/* Quotes & Retainer Estimates */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h4 className="text-sm font-bold text-slate-900">Quotes & Fee Estimates</h4>
            <span className="text-[11px] font-mono font-bold text-[#0070ba] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Preview: {formatPreview(quotes)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefix</label>
              <input
                type="text"
                value={quotes.prefix}
                onChange={(e) => setQuotes({ ...quotes, prefix: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Number</label>
              <input
                type="number"
                min={1}
                value={quotes.nextNumber}
                onChange={(e) => setQuotes({ ...quotes, nextNumber: Number(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Padding Digits</label>
              <input
                type="number"
                min={2}
                max={8}
                value={quotes.padding}
                onChange={(e) => setQuotes({ ...quotes, padding: Number(e.target.value) || 4 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Used when creating formal retainer quotations for client proposals.
          </p>
        </div>

        {/* Payment Receipts */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h4 className="text-sm font-bold text-slate-900">Payment Receipts</h4>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Preview: {formatPreview(receipts)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefix</label>
              <input
                type="text"
                value={receipts.prefix}
                onChange={(e) => setReceipts({ ...receipts, prefix: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Number</label>
              <input
                type="number"
                min={1}
                value={receipts.nextNumber}
                onChange={(e) => setReceipts({ ...receipts, nextNumber: Number(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Padding Digits</label>
              <input
                type="number"
                min={2}
                max={8}
                value={receipts.padding}
                onChange={(e) => setReceipts({ ...receipts, padding: Number(e.target.value) || 4 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Generated upon recording client payments into trust or office accounts.
          </p>
        </div>

        {/* Credit Notes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h4 className="text-sm font-bold text-slate-900">Credit Notes</h4>
            <span className="text-[11px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Preview: {formatPreview(creditNotes)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefix</label>
              <input
                type="text"
                value={creditNotes.prefix}
                onChange={(e) => setCreditNotes({ ...creditNotes, prefix: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Number</label>
              <input
                type="number"
                min={1}
                value={creditNotes.nextNumber}
                onChange={(e) => setCreditNotes({ ...creditNotes, nextNumber: Number(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Padding Digits</label>
              <input
                type="number"
                min={2}
                max={8}
                value={creditNotes.padding}
                onChange={(e) => setCreditNotes({ ...creditNotes, padding: Number(e.target.value) || 4 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Issued for billing adjustments, cancellations, and tax credit reconciliation.
          </p>
        </div>
      </div>
    </div>
  );
};
