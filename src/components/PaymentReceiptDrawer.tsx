import React, { useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PaymentRecord, FeeNote } from '../types';
import { loadChambersSettings } from '../utils/settingsStorage';
import { loadSavedPayments } from '../utils/chambersDataStorage';

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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !payment) return null;

  const settings = loadChambersSettings();
  const navyColor = settings.brandNavyColor || '#14233C';
  const slateColor = '#5A6475';
  const lightGreyColor = '#F5F6F8';
  const hairlineColor = '#D9DDE4';

  const shortAddress =
    settings.physicalAddress ||
    '1st Floor, The Triple Two Address, Along the Eastern Bypass, Ruiru';

  // Format Date: "3 November 2026"
  const formatReceiptDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Format Currency: "KES 25,000.00"
  const formatCurrencyKES = (amount: number): string => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `KES ${formatted}`;
  };

  // Amount in words with hyphenated compound numbers e.g. "Twenty-Five"
  const numberToWordsKES = (amount: number): string => {
    const units = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    if (amount === 0) return 'Zero Kenya Shillings Only';

    const convertLessThanOneThousand = (n: number): string => {
      let result = '';
      if (n >= 100) {
        result += units[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n > 0) result += ' ';
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)];
        if (n % 10 > 0) {
          result += '-' + units[n % 10]; // Hyphenate compound numbers per design spec
        }
      } else if (n > 0) {
        result += units[n];
      }
      return result.trim();
    };

    const whole = Math.floor(Math.abs(amount));
    let words = '';

    if (whole >= 1000000) {
      const millions = Math.floor(whole / 1000000);
      words += convertLessThanOneThousand(millions) + ' Million ';
    }
    const remainderAfterMillions = whole % 1000000;
    if (remainderAfterMillions >= 1000) {
      const thousands = Math.floor(remainderAfterMillions / 1000);
      words += convertLessThanOneThousand(thousands) + ' Thousand ';
    }
    const remainderAfterThousands = remainderAfterMillions % 1000;
    if (remainderAfterThousands > 0) {
      words += convertLessThanOneThousand(remainderAfterThousands) + ' ';
    }

    const trimmed = words.trim();
    return `${trimmed || 'Zero'} Kenya Shillings Only`;
  };

  // Derive firm monogram initials if no uploaded logo
  const getFirmInitials = (name?: string): string => {
    if (!name) return 'MA';
    const words = name
      .replace(/\s+Advocates$/i, '')
      .trim()
      .split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  };

  // Data Rule: Balance due = invoice total minus ALL payments recorded including this one
  const allSavedPayments = loadSavedPayments();
  const matchingPayments = allSavedPayments.filter(
    (p) =>
      (payment.invoiceId && p.invoiceId === payment.invoiceId) ||
      (payment.invoiceNumber && p.invoiceNumber === payment.invoiceNumber) ||
      (linkedInvoice && (p.invoiceId === linkedInvoice.id || p.invoiceNumber === linkedInvoice.invoiceNumber))
  );

  const hasCurrentPayment = matchingPayments.some(
    (p) => p.id === payment.id || (p.receiptNumber && p.receiptNumber === payment.receiptNumber)
  );
  const allRecordedPayments = hasCurrentPayment
    ? matchingPayments
    : [...matchingPayments, payment];

  const activePayments = allRecordedPayments.filter((p) => p.status !== 'VOID' || p.id === payment.id);
  const totalPaidToDate = activePayments.reduce((sum, p) => sum + (Number(p.amountKES) || 0), 0);

  const totalInvoiceAmount =
    (linkedInvoice?.totalKES && linkedInvoice.totalKES > 0)
      ? linkedInvoice.totalKES
      : (payment.invoiceTotalKES && payment.invoiceTotalKES > 0)
      ? payment.invoiceTotalKES
      : (linkedInvoice?.balanceKES !== undefined && linkedInvoice?.amountPaidKES !== undefined)
      ? linkedInvoice.amountPaidKES + linkedInvoice.balanceKES
      : payment.amountKES;

  const balanceDue = Math.max(0, totalInvoiceAmount - totalPaidToDate);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(pageHeight, imgHeight));
      pdf.save(`Receipt-${payment.receiptNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:rounded-none overflow-hidden">
        {/* Minimal Modal Header */}
        <div className="receipt-modal-chrome flex items-center justify-between border-b border-stone-200 px-6 py-3.5 bg-white text-slate-800 shrink-0">
          <h2 className="font-sans text-sm font-semibold text-slate-800 tracking-tight">Receipt</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close receipt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Body containing the A4 Printable Sheet */}
        <div className="receipt-print-container flex-1 overflow-y-auto p-4 sm:p-8 bg-[#EDF0F4] print:bg-white print:p-0">
          {/* Official Formal Legal Receipt Paper Sheet */}
          <div
            ref={receiptRef}
            id="official-receipt-sheet"
            style={{
              borderTopColor: navyColor,
              borderTopWidth: '8px',
              borderTopStyle: 'solid',
            }}
            className="receipt-print-sheet mx-auto w-full max-w-[794px] min-h-[1050px] p-[56px] sm:p-[64px] bg-white flex flex-col justify-between font-inter text-slate-800 shadow-sm print:shadow-none print:min-h-0"
          >
            <div>
              {/* 1. Letterhead */}
              <div className="flex items-center gap-5">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.firmName}
                    className="w-16 h-16 object-contain shrink-0"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: navyColor }}
                    className="w-14 h-14 shrink-0 flex items-center justify-center text-white font-playfair font-bold text-xl tracking-wider select-none"
                  >
                    {getFirmInitials(settings.firmName)}
                  </div>
                )}
                <div className="min-w-0">
                  <h1
                    style={{ color: navyColor }}
                    className="font-playfair text-[25px] font-bold leading-tight tracking-tight"
                  >
                    {settings.firmName || 'Muthoni Ahago Advocates'}
                  </h1>
                  <p
                    style={{ color: slateColor }}
                    className="text-[11px] font-medium uppercase tracking-[0.2em] mt-1"
                  >
                    Advocates · Commissioners for Oaths · Notaries Public
                  </p>
                  <p style={{ color: slateColor }} className="text-[12px] mt-0.5">
                    {shortAddress}
                  </p>
                </div>
              </div>

              {/* 2. Thin Divider */}
              <div
                style={{ borderColor: hairlineColor }}
                className="border-b my-7"
              />

              {/* 3. Title Row */}
              <div className="flex items-baseline justify-between mb-8">
                <h2
                  style={{ color: navyColor }}
                  className="font-playfair text-[34px] font-bold leading-none tracking-tight"
                >
                  Official Receipt
                </h2>
                <div className="text-right text-[13px] space-y-1">
                  <div>
                    <span style={{ color: slateColor }}>Receipt No. </span>
                    <span style={{ color: navyColor }} className="font-semibold">
                      {payment.receiptNumber}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: slateColor }}>Date </span>
                    <span style={{ color: navyColor }} className="font-semibold">
                      {formatReceiptDate(payment.paymentDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Two Columns */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <span
                    style={{ color: slateColor }}
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] block"
                  >
                    RECEIVED FROM
                  </span>
                  <p
                    style={{ color: navyColor }}
                    className="text-[17px] font-semibold mt-1 leading-snug"
                  >
                    {payment.clientName}
                  </p>
                </div>
                <div>
                  <span
                    style={{ color: slateColor }}
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] block"
                  >
                    IN RESPECT OF
                  </span>
                  <p
                    style={{ color: navyColor }}
                    className="text-[17px] font-semibold mt-1 leading-snug"
                  >
                    Invoice {payment.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* 5. Payment Table */}
              <div className="mb-6">
                <div
                  style={{ borderTopColor: navyColor, borderTopWidth: '2px', borderTopStyle: 'solid' }}
                  className="pt-2"
                >
                  <div
                    className="grid grid-cols-12 py-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: slateColor }}
                  >
                    <div className="col-span-7">Payment method</div>
                    <div className="col-span-5 text-right">Amount received</div>
                  </div>
                  <div
                    style={{ borderColor: hairlineColor }}
                    className="grid grid-cols-12 py-4 border-b items-baseline"
                  >
                    <div className="col-span-7 text-[15px] font-medium" style={{ color: navyColor }}>
                      {payment.paymentMethod}
                      {payment.paymentReference ? ` · ${payment.paymentReference}` : ''}
                    </div>
                    <div
                      style={{ color: navyColor }}
                      className="col-span-5 text-right text-[20px] font-semibold leading-none"
                    >
                      {formatCurrencyKES(payment.amountKES)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Light Grey Strip: Amount in words */}
              <div
                style={{ backgroundColor: lightGreyColor, borderColor: hairlineColor }}
                className="px-5 py-3.5 mb-8 border flex items-center justify-between gap-4"
              >
                <span
                  style={{ color: slateColor }}
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] shrink-0"
                >
                  AMOUNT IN WORDS
                </span>
                <span
                  style={{ color: navyColor }}
                  className="font-playfair text-[15px] font-semibold text-right"
                >
                  {numberToWordsKES(payment.amountKES)}
                </span>
              </div>

              {/* 7. Right-aligned summary block, 340px wide */}
              <div className="w-[340px] ml-auto space-y-2 mb-12">
                <div className="flex justify-between items-baseline text-[14px]">
                  <span style={{ color: slateColor }}>Invoice total</span>
                  <span style={{ color: navyColor }} className="font-medium">
                    {formatCurrencyKES(totalInvoiceAmount)}
                  </span>
                </div>
                <div
                  style={{ borderTopColor: navyColor, borderTopWidth: '2px', borderTopStyle: 'solid' }}
                  className="pt-2 flex justify-between items-baseline text-[16px] font-bold"
                >
                  <span style={{ color: navyColor }}>Balance due</span>
                  <span style={{ color: navyColor }}>
                    {formatCurrencyKES(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. Pinned to the bottom: Empty signature line & simple navy RECEIVED stamp */}
            <div className="mt-auto pt-14 flex items-end justify-between">
              <div className="space-y-2">
                <div style={{ borderColor: navyColor }} className="w-56 border-b" />
                <p
                  style={{ color: slateColor }}
                  className="text-[10px] font-medium uppercase tracking-[0.18em]"
                >
                  Authorised signature & date
                </p>
              </div>
              <div
                style={{ borderColor: navyColor, color: navyColor }}
                className="border-2 px-5 py-2 font-playfair font-bold text-base tracking-[0.25em] uppercase select-none transform -rotate-3"
              >
                RECEIVED
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Action Footer */}
        <div className="receipt-modal-chrome flex items-center justify-end space-x-3 border-t border-stone-200 px-6 py-4 bg-white shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            style={{ backgroundColor: navyColor }}
            className="flex items-center space-x-1.5 rounded-lg text-white px-5 py-2 text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
