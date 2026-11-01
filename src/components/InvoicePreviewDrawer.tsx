import React, { useState } from 'react';
import { X, Download, Printer, Send, FileText, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { FeeNote } from '../types';
import { loadChambersSettings } from '../utils/settingsStorage';
import { generateInvoicePdf } from '../utils/invoicePdfGenerator';

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  if (!feeNote) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">No invoice selected to preview.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const settings = loadChambersSettings();
  const feeNoteToUse = feeNote;

  const invoiceNumber = feeNoteToUse.invoiceNumber || 'INV-000000';
  const clientName = feeNoteToUse.clientName || 'Client';
  const projectOrSubject = feeNoteToUse.subject || feeNoteToUse.matterTitle || 'Invoice Services';
  const dateIssued = feeNoteToUse.dateIssued || '';
  const terms = feeNoteToUse.terms || 'Due on Receipt';
  const dueDate = feeNoteToUse.dueDate || '';

  const items = feeNoteToUse.items || [];
  const subTotal = feeNoteToUse.subtotalKES || items.reduce((acc, it) => acc + (it.totalPriceKES || 0), 0);
  const shipping = feeNoteToUse.shippingChargesKES || feeNoteToUse.disbursementsKES || 0;
  const adjustment = feeNoteToUse.adjustmentKES || 0;
  const totalAmount = feeNoteToUse.totalKES || subTotal + shipping + adjustment;
  const balanceDue = feeNoteToUse.balanceKES !== undefined ? feeNoteToUse.balanceKES : totalAmount;

  const handleDownloadPdf = () => {
    try {
      const doc = generateInvoicePdf(feeNoteToUse, settings);
      doc.save(`${invoiceNumber}.pdf`);
      setToastMessage(`Downloaded ${invoiceNumber}.pdf successfully!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Failed to generate PDF.');
    }
  };

  const handlePrint = () => {
    try {
      const doc = generateInvoicePdf(feeNoteToUse, settings);
      const blobUrl = URL.createObjectURL(doc.output('blob'));
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } catch (err) {
      window.print();
    }
  };

  const handleSendEmail = () => {
    setToastMessage(`Invoice ${invoiceNumber} emailed to ${clientName}.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const companyName = settings.firmName || 'Ceatron Technologies Ltd';
  const phone = settings.phone || '+254 786 652 032 / +254 724833192';
  const email = settings.email || settings.billingEmail || 'info@ceatrontechnologies.com';
  const paybill = settings.bankDetails?.paybillNumber || '603685';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#0098db]" />
            <h2 className="font-heading text-base font-bold text-white">
              Fee Note {invoiceNumber} - {clientName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {showToast && (
          <div className="m-4 rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Invoice Preview Document matching attached PDF */}
        <div className="p-6 md:p-8 flex-1 bg-slate-100 overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-md p-8 md:p-12 text-slate-800 space-y-6 text-xs max-w-2xl mx-auto min-h-[750px] flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Top Header Grid */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Left: Official Logo & Company Address */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <img
                      src="/ma-law-logo.jpg"
                      alt={companyName}
                      className="h-14 w-auto object-contain rounded-xs border border-slate-100"
                    />
                  </div>

                  <div className="text-[11px] text-slate-600 leading-tight space-y-0.5 pt-1">
                    <p>The Triple Two Address,</p>
                    <p>Block B, 1st Floor</p>
                    <p>Phone {phone}</p>
                    <p>Email: {email}</p>
                  </div>
                </div>

                {/* Right: Fee Note Title, Number, Balance Due & Dates */}
                <div className="text-right sm:self-start space-y-1">
                  <h1 className="text-3xl font-extrabold text-[#0098db] leading-none">
                    Fee Note
                  </h1>
                  <p className="font-bold text-slate-900 text-xs mt-1"># {invoiceNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Balance Due</p>
                  <p className="font-heading text-lg font-bold text-slate-900">
                    KES{balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>

                  <div className="pt-4 text-[11px] space-y-1">
                    <div className="flex justify-end space-x-4">
                      <span className="text-slate-500">Invoice Date :</span>
                      <span className="font-medium text-slate-800">{dateIssued}</span>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <span className="text-slate-500">Terms :</span>
                      <span className="font-medium text-slate-800">{terms}</span>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <span className="text-slate-500">Due Date :</span>
                      <span className="font-medium text-slate-800">{dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To & Project Section */}
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-[11px] font-bold text-slate-900 uppercase">BILL TO:</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{clientName}</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-900">Project :</p>
                  <p className="text-xs text-slate-800 mt-0.5">{projectOrSubject}</p>
                </div>
              </div>

              {/* Items Table matching Cyan Bar style */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0098db] text-white font-bold text-[11px]">
                      <th className="py-2 px-3 w-8 text-center">#</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right w-16">Qty</th>
                      <th className="py-2 px-3 text-right w-24">Rate</th>
                      <th className="py-2 px-3 text-right w-20">Discount</th>
                      <th className="py-2 px-3 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center text-slate-700">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{it.description}</p>
                          {it.subDescription && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{it.subDescription}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          {(it.quantity || 1).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {(it.unitPriceKES || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {it.discountPercent ? `${it.discountPercent.toFixed(2)}%` : '0.00%'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                          {(it.totalPriceKES || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end pt-3">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Sub Total</span>
                    <span className="font-mono">
                      {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {(feeNoteToUse.discountKES || 0) > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Discount</span>
                      <span className="font-mono text-emerald-600">
                        - {(feeNoteToUse.discountKES || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total</span>
                    <span className="font-mono">
                      KES{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-2 rounded">
                    <span>Balance Due</span>
                    <span className="font-mono">
                      KES{balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Notes & Payment Options */}
              <div className="pt-4 text-xs space-y-4">
                <p className="text-slate-800">{feeNoteToUse.customerNotes || 'Thanks for your business.'}</p>

                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 text-xs">PAYMENT OPTIONS:</p>
                  <p className="text-slate-700 text-[11px]">Cash payments can be done via</p>
                  <p className="font-bold text-slate-900 text-xs">
                    MPESA | BUY GOODS: {paybill}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Line */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
              <span>{companyName} | {phone} | {email} | {settings.website || 'www.ceatrontechnologies.com'}</span>
              <span>1</span>
            </div>

          </div>
        </div>

        {/* Drawer Actions */}
        <div className="border-t border-slate-200 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Invoice Total: <strong className="font-mono text-slate-900 text-sm">KES {totalAmount.toLocaleString()}</strong>
            {balanceDue > 0 && balanceDue !== totalAmount && (
              <span className="ml-2 text-amber-700 font-semibold">(Bal: KES {balanceDue.toLocaleString()})</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onReceivePayment && balanceDue > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReceivePayment(feeNoteToUse);
                }}
                className="flex items-center space-x-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <CreditCard className="h-4 w-4" />
                <span>Receive Payment</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 rounded border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="flex items-center space-x-1.5 rounded border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Email Client</span>
            </button>

            <button
              onClick={handleDownloadPdf}
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
