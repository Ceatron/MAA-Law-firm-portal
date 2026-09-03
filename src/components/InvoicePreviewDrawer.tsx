import React, { useState } from 'react';
import { X, Download, Printer, Send, FileText, CheckCircle2, Calculator, ShieldCheck, CreditCard } from 'lucide-react';
import { mockMatters } from '../data/mockData';
import { CompanyLogo } from './CompanyLogo';
import { FeeNote } from '../types';

interface InvoicePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feeNote?: FeeNote | null;
  onReceivePayment?: (feeNote: FeeNote) => void;
}

export const InvoicePreviewDrawer: React.FC<InvoicePreviewDrawerProps> = ({
  isOpen,
  onClose,
  feeNote,
  onReceivePayment,
}) => {
  const [selectedMatterId, setSelectedMatterId] = useState(mockMatters[0]?.id || '1');
  const [hours, setHours] = useState(14.5);
  const [hourlyRate, setHourlyRate] = useState(18000);
  const [disbursements, setDisbursements] = useState(25000);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  // Use feeNote if provided, otherwise fallback to calculated interactive matter
  const currentMatter = mockMatters.find((m) => m.id === selectedMatterId) || mockMatters[0] || {
    id: 'mat-gen',
    referenceNumber: 'MAA/HC/COM/2026/0001',
    title: 'General Commercial Legal Representation',
    clientName: 'Safaricom PLC',
    courtRegistry: 'High Court Commercial Division - Milimani',
  };

  // If viewing a real feeNote from the ledger
  const isCustomFeeNote = Boolean(feeNote);
  const invoiceNumber = feeNote?.invoiceNumber || 'MAA-INV-2026-0892';
  const clientName = feeNote?.clientName || currentMatter.clientName;
  const clientAddress = feeNote?.clientAddress || 'Legal Department, Corporate Headquarters\nNairobi, Kenya';
  const clientKraPin = feeNote?.clientKraPin || 'P051189201A';
  const matterTitle = feeNote?.matterTitle || currentMatter.title;
  const dateIssued = feeNote?.dateIssued || '12 Aug 2026';
  const dueDate = feeNote?.dueDate || '26 Aug 2026';
  const invoiceStatus = feeNote?.status || 'Unpaid';
  const amountPaid = feeNote?.amountPaidKES !== undefined
    ? feeNote.amountPaidKES
    : feeNote?.status === 'Paid' ? (feeNote.totalKES || 0) : 0;

  // Calculations
  const hasCustomItems = Boolean(isCustomFeeNote && feeNote?.items && feeNote.items.length > 0);
  const taxableSubtotal = hasCustomItems
    ? feeNote!.items!.filter((it) => it.isTaxable !== false).reduce((sum, it) => sum + (it.totalPriceKES || 0), 0)
    : feeNote?.taxableAmountKES || (isCustomFeeNote ? (feeNote?.vatKES ? Math.round((feeNote.vatKES / 16) * 100) : (feeNote?.amountKES || 0)) : hours * hourlyRate);

  const nonTaxableSubtotal = hasCustomItems
    ? feeNote!.items!.filter((it) => it.isTaxable === false).reduce((sum, it) => sum + (it.totalPriceKES || 0), 0)
    : feeNote?.nonTaxableAmountKES || (isCustomFeeNote ? Math.max(0, (feeNote?.amountKES || 0) - taxableSubtotal) : disbursements);

  const billableFees = isCustomFeeNote && feeNote?.items ? (feeNote.subtotalKES || feeNote.amountKES) : hours * hourlyRate;
  const netAmount = isCustomFeeNote ? (feeNote?.amountKES || billableFees) : billableFees + disbursements;
  const vatAmount = isCustomFeeNote ? (feeNote?.vatKES !== undefined ? feeNote.vatKES : Math.round(taxableSubtotal * 0.16)) : Math.round(billableFees * 0.16);
  const totalAmount = isCustomFeeNote ? (feeNote?.totalKES || netAmount + vatAmount) : netAmount + vatAmount;
  const balanceDue = feeNote?.balanceKES !== undefined ? feeNote.balanceKES : Math.max(0, totalAmount - amountPaid);

  const handleAction = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-stone-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#0098db]" />
            <h2 className="font-serif-title text-base font-bold">
              {isCustomFeeNote ? `Invoice ${invoiceNumber} - ${clientName}` : 'Kenyan Law Firm Tax Fee Note Generator'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Controls if not custom feeNote */}
        {!isCustomFeeNote && (
          <div className="bg-[#f8f6f0] p-6 border-b border-stone-200 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-stone-800 font-bold">
              <Calculator className="h-4 w-4 text-[#0098db]" />
              <span>Billable Hours & Fee Calculations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700">Select Client Matter</label>
                <select
                  value={selectedMatterId}
                  onChange={(e) => setSelectedMatterId(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-xs font-medium text-stone-800"
                >
                  {mockMatters.length === 0 && (
                    <option value="">General Billing (No Active Matters)</option>
                  )}
                  {mockMatters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.clientName} - {m.referenceNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">Billable Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-xs font-bold font-mono text-stone-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">Rate / Hour (KES)</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-xs font-bold font-mono text-stone-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">Court Disbursements (KES)</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={disbursements}
                  onChange={(e) => setDisbursements(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-xs font-bold font-mono text-stone-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {showToast && (
          <div className="m-4 rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Invoice Preview Document */}
        <div className="p-6 md:p-8 flex-1 bg-stone-100 overflow-y-auto">
          <div className="bg-white rounded-lg border border-stone-300 shadow-md p-8 text-stone-800 space-y-6 text-xs max-w-2xl mx-auto">
            
            {/* Firm Header */}
            <div className="border-b-2 border-[#0098db] pb-5 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CompanyLogo variant="horizontal" size="md" darkBg={false} />
                <div className="mt-3 text-[11px] text-stone-600 leading-tight space-y-0.5">
                  <p className="font-semibold text-stone-800">Muthoni Ahago Advocates</p>
                  <p>1st Floor, The Triple Two Address, Along the Eastern Bypass</p>
                  <p>Ruiru, Kenya</p>
                  <p>Tel: +254 (0)20 271 9900 | Email: billing@muthoniahago.co.ke</p>
                </div>
              </div>

              <div className="text-right sm:self-start space-y-1 text-[11px]">
                <div className="inline-block rounded bg-blue-50 border border-blue-200 px-3 py-1 font-mono font-extrabold text-[#0098db]">
                  TAX FEE NOTE / INVOICE
                </div>
                <p className="font-mono text-stone-700 font-bold mt-1">NO: {invoiceNumber}</p>
                <p className="text-stone-500">Date: {dateIssued}</p>
                <p className="text-stone-500">Due: {dueDate}</p>
              </div>
            </div>

            {/* KRA PIN & Client Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-md border border-stone-200">
              <div>
                <p className="text-[10px] font-bold text-stone-400 tracking-wider">Bill To Client:</p>
                <p className="font-bold text-stone-900 text-sm mt-0.5">{clientName}</p>
                <p className="text-stone-600 mt-0.5 whitespace-pre-line">{clientAddress}</p>
                <p className="font-mono text-[10px] text-stone-500 mt-1">Client KRA PIN: {clientKraPin}</p>
              </div>

              <div className="sm:text-right space-y-1">
                <p className="text-[10px] font-bold text-stone-400 tracking-wider">Matter Details:</p>
                {feeNote?.matterRef ? (
                  <p className="font-mono font-bold text-[#0098db] text-xs">{feeNote.matterRef}</p>
                ) : (
                  <p className="font-mono font-bold text-[#0098db] text-xs">{currentMatter.referenceNumber}</p>
                )}
                <p className="font-semibold text-stone-800 text-xs">{matterTitle}</p>
                <p className="text-stone-500 text-[11px]">{currentMatter.courtRegistry}</p>
                <p className="font-mono text-[10px] text-stone-500 mt-1">Firm KRA PIN: P0512839401Z</p>
              </div>
            </div>

            {/* Particulars Table */}
            <div>
              <p className="font-bold text-stone-900 mb-2 text-[11px] tracking-wider">
                Particulars of Professional Services Rendered & Statutory Disbursements
              </p>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-300 bg-stone-100 text-[10px] font-bold text-stone-600">
                    <th className="py-2 px-3">Description of Work</th>
                    <th className="py-2 px-3 text-center">Qty / Hours</th>
                    <th className="py-2 px-3 text-right">Rate (KES)</th>
                    <th className="py-2 px-3 text-center">VAT Rate</th>
                    <th className="py-2 px-3 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-[11px]">
                  {feeNote?.items && feeNote.items.length > 0 ? (
                    feeNote.items.map((it) => {
                      const isItemTaxable = it.isTaxable !== false;
                      return (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-stone-900">{it.description}</p>
                            {it.category && (
                              <p className="text-stone-500 text-[10px]">{it.category}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{it.unitPriceKES.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                                isItemTaxable
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {isItemTaxable ? '16%' : 'Exempt'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                            {it.totalPriceKES.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <>
                      <tr>
                        <td className="py-3 px-3">
                          <p className="font-bold text-stone-900">Legal Representation & Counsel Billing</p>
                          <p className="text-stone-500 text-[10px]">
                            Pleadings drafting, legal research, e-filing submissions, and court appearances.
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">{hours}</td>
                        <td className="py-3 px-3 text-right font-mono">{hourlyRate.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[9px] font-bold font-mono">
                            16%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                          {billableFees.toLocaleString()}
                        </td>
                      </tr>

                      {disbursements > 0 && (
                        <tr>
                          <td className="py-3 px-3">
                            <p className="font-bold text-stone-900">Judiciary CTS e-Filing Disbursements</p>
                            <p className="text-stone-500 text-[10px]">Official High Court filing fees and statutory registry charges.</p>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-stone-400">—</td>
                          <td className="py-3 px-3 text-right font-mono text-stone-400">—</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block rounded bg-stone-100 text-stone-600 px-1.5 py-0.5 text-[9px] font-bold font-mono">
                              Exempt
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                            {disbursements.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2 border-t border-stone-200">
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                {taxableSubtotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Professional Fees:</span>
                    <span className="font-mono font-bold">KES {taxableSubtotal.toLocaleString()}</span>
                  </div>
                )}
                {nonTaxableSubtotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Exempt CTS & Disbursements:</span>
                    <span className="font-mono font-bold">KES {nonTaxableSubtotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-700 font-semibold pt-1 border-t border-stone-200">
                  <span>Net Total Amount:</span>
                  <span className="font-mono">KES {netAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>16% VAT (Itemized):</span>
                  <span className="font-mono font-bold text-stone-800">KES {vatAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-[#132c3f] text-white p-2.5 rounded font-bold text-sm mt-2">
                  <span>TOTAL INVOICED:</span>
                  <span className="font-mono text-[#00c0ef]">KES {totalAmount.toLocaleString()}</span>
                </div>

                {/* Payment Breakdown if any payments recorded */}
                {amountPaid > 0 && (
                  <div className="pt-2 border-t border-stone-200 space-y-1">
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Total Paid:</span>
                      <span className="font-mono font-bold">KES {amountPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-800 font-bold bg-amber-50 p-2 rounded border border-amber-200">
                      <span>Balance Due:</span>
                      <span className={`font-mono ${balanceDue === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                        KES {balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Bank Remittance Instructions */}
            <div className="rounded border border-blue-200 bg-blue-50/60 p-3 text-[11px] text-blue-950 space-y-1">
              <p className="font-bold flex items-center space-x-1.5 text-stone-900">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0098db]" />
                <span>Bank Payment Instructions (Client Trust Account)</span>
              </p>
              <p>Bank: <strong className="text-stone-900">Stanbic Bank Kenya Ltd</strong> • Branch: <strong className="text-stone-900">Upper Hill Nairobi</strong></p>
              <p>Account Name: <strong className="text-stone-900">Muthoni Ahago Advocates Client Acc</strong></p>
              <p>Account No: <strong className="font-mono text-stone-900">0100004918239</strong> | Swift: <strong className="font-mono text-stone-900">SBKENXNA</strong></p>
            </div>

            {/* Footer stamp */}
            <div className="border-t border-stone-200 pt-4 flex items-center justify-between text-[10px] text-stone-400">
              <span>{feeNote?.quoteNumber ? `Generated from Quotation ${feeNote.quoteNumber}` : 'Direct Legal Fee Note'}</span>
              <p className="font-mono">Computer Generated Tax Invoice</p>
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="border-t border-stone-200 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            Invoice Total: <strong className="font-mono text-stone-900 text-sm">KES {totalAmount.toLocaleString()}</strong>
            {balanceDue > 0 && balanceDue !== totalAmount && (
              <span className="ml-2 text-amber-700 font-semibold">(Bal: KES {balanceDue.toLocaleString()})</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onReceivePayment && isCustomFeeNote && feeNote && balanceDue > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReceivePayment(feeNote);
                }}
                className="flex items-center space-x-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <CreditCard className="h-4 w-4" />
                <span>Receive Payment</span>
              </button>
            )}

            <button
              onClick={() => handleAction('Invoice printed successfully.')}
              className="flex items-center space-x-1.5 rounded border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            <button
              onClick={() => handleAction(`Fee Note emailed directly to ${clientName} Finance team.`)}
              className="flex items-center space-x-1.5 rounded border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Email Client</span>
            </button>

            <button
              onClick={() => handleAction(`Downloaded Tax Fee Note ${invoiceNumber}.pdf`)}
              className="flex items-center space-x-1.5 rounded bg-[#0098db] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#0087c2] cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

