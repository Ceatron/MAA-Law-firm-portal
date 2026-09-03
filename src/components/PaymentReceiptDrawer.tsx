import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Receipt,
  Building,
  ShieldCheck,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { PaymentRecord, FeeNote } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface PaymentReceiptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
  linkedInvoice?: FeeNote | null;
}

export const PaymentReceiptDrawer: React.FC<PaymentReceiptDrawerProps> = ({
  isOpen,
  onClose,
  payment,
  linkedInvoice,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert(`Payment Receipt ${payment.receiptNumber} downloaded successfully as PDF.`);
  };

  // Convert numbers to words helper (for Kenyan legal receipts)
  const numberToWordsKES = (amount: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero';
    
    function convertLessThanOneThousand(n: number): string {
      let current = '';
      if (n >= 100) {
        current += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        current += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        current += units[n] + ' ';
      }
      return current.trim();
    }

    let wholeAmount = Math.floor(amount);
    let words = '';

    if (wholeAmount >= 1000000) {
      words += convertLessThanOneThousand(Math.floor(wholeAmount / 1000000)) + ' Million ';
      wholeAmount %= 1000000;
    }
    if (wholeAmount >= 1000) {
      words += convertLessThanOneThousand(Math.floor(wholeAmount / 1000)) + ' Thousand ';
      wholeAmount %= 1000;
    }
    if (wholeAmount > 0) {
      words += convertLessThanOneThousand(wholeAmount);
    }

    return `${words.trim()} Kenya Shillings Only`;
  };

  const totalInvoiceAmount = linkedInvoice?.totalKES ?? payment.amountKES;
  const currentPaid = linkedInvoice?.amountPaidKES ?? payment.amountKES;
  const balanceDue = linkedInvoice?.balanceKES ?? Math.max(0, totalInvoiceAmount - currentPaid);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-stone-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0098db]/20 text-[#0098db] border border-[#0098db]/40">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif-title text-base font-bold text-white">
                  Chambers Official Payment Receipt
                </h2>
                <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold font-mono">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-stone-300 font-mono">
                {payment.receiptNumber} • {payment.paymentReference}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-stone-100/70">
          <div
            ref={receiptRef}
            className="mx-auto max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-stone-200 space-y-6 text-stone-800"
          >
            
            {/* Law Firm Header */}
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
                      Upper Hill Chambers, 4th Floor, 2nd Ngong Ave, Nairobi • Tel: +254 20 271 0000
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-stone-200 sm:pl-4">
                  <span className="inline-block rounded bg-emerald-100 text-emerald-900 px-2.5 py-1 text-xs font-bold font-mono uppercase tracking-wider">
                    OFFICIAL RECEIPT
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-900 mt-1">
                    {payment.receiptNumber}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Date: {new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Client & Matter Particulars */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-stone-50 p-4 border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Received From (Client)
                </span>
                <p className="font-bold text-stone-900 text-sm">{payment.clientName}</p>
                {linkedInvoice?.clientKraPin && (
                  <p className="text-[11px] font-mono text-stone-600">KRA PIN: {linkedInvoice.clientKraPin}</p>
                )}
                {linkedInvoice?.clientAddress && (
                  <p className="text-[11px] text-stone-500 truncate">{linkedInvoice.clientAddress}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Against Invoice / Matter
                </span>
                <p className="font-mono font-bold text-[#0098db]">{payment.invoiceNumber}</p>
                <p className="text-[11px] font-medium text-stone-700 mt-0.5 line-clamp-2">
                  {payment.matterTitle || linkedInvoice?.matterTitle || 'General Legal Representation'}
                </p>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Payment Method</th>
                    <th className="py-2.5 px-4 font-mono">Reference / Trans No.</th>
                    <th className="py-2.5 px-4 text-right">Amount Received (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-stone-900 flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-[#0098db]" />
                      <span>{payment.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-800">
                      {payment.paymentReference}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-base text-emerald-800">
                      KES {payment.amountKES.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words */}
            <div className="rounded-lg bg-blue-50/70 border border-blue-200/80 p-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-blue-900 block">
                Amount in Words:
              </span>
              <p className="font-serif italic font-bold text-blue-950 text-sm mt-0.5">
                {numberToWordsKES(payment.amountKES)}
              </p>
            </div>

            {/* Notes if any */}
            {payment.notes && (
              <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <strong className="text-stone-800 block text-[11px] mb-0.5">Particulars / Notes:</strong>
                <p>{payment.notes}</p>
              </div>
            )}

            {/* Invoice Settlement Status */}
            <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-stone-500">Invoice Total: <strong className="font-mono text-stone-800">KES {totalInvoiceAmount.toLocaleString()}</strong></span>
                <br />
                <span className="text-stone-500">Total Paid to Date: <strong className="font-mono text-emerald-700">KES {currentPaid.toLocaleString()}</strong></span>
              </div>

              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200 text-right sm:min-w-48">
                <span className="text-[11px] text-stone-500 block">Remaining Invoice Balance</span>
                <span className={`font-mono text-base font-bold ${balanceDue === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                  KES {balanceDue.toLocaleString()}
                </span>
                <p className="text-[10px] font-bold mt-0.5">
                  {balanceDue === 0 ? '✓ Fully Settled' : '⚠️ Partial Settlement'}
                </p>
              </div>
            </div>

            {/* Sign-off and Stamp block */}
            <div className="pt-6 border-t-2 border-stone-200 grid grid-cols-2 gap-6 text-[11px]">
              <div>
                <p className="font-bold text-stone-800">Received By:</p>
                <div className="h-10 flex items-end">
                  <span className="font-serif italic text-stone-600 text-sm font-semibold">
                    {payment.receivedBy || 'Finance & Accounts Desk'}
                  </span>
                </div>
                <p className="border-t border-stone-300 pt-1 text-stone-400">Authorized Signature & Date</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-stone-800">Chambers Stamp:</p>
                <div className="h-10 flex items-center justify-end">
                  <span className="inline-block rounded-full border-2 border-dashed border-[#0098db]/60 text-[#0098db] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                    ★ MUTHONI AHAGO CASH RECEIVED ★
                  </span>
                </div>
                <p className="border-t border-stone-300 pt-1 text-stone-400">Advocates Client Trust Account</p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Footer */}
        <div className="border-t border-stone-200 p-4 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500">
            Receipt: <strong className="font-mono text-stone-900">{payment.receiptNumber}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center space-x-1.5 rounded-lg bg-[#0098db] text-white px-4 py-2 text-xs font-bold hover:bg-[#0087c2] transition-colors cursor-pointer shadow-xs"
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
