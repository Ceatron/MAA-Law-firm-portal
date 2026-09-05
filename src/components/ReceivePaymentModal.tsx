import React, { useState, useEffect, useId } from 'react';
import {
  X,
  CreditCard,
  Building,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Smartphone,
  Landmark,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { Client, FeeNote, PaymentMethod, PaymentRecord } from '../types';
import { DraggableModal } from './common/DraggableModal';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: FeeNote[];
  clients: Client[];
  onRecordPayment: (payment: PaymentRecord) => void;
  initialInvoiceId?: string;
  initialClientId?: string;
  onViewReceipt?: (payment: PaymentRecord) => void;
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  isOpen,
  onClose,
  invoices,
  clients,
  onRecordPayment,
  initialInvoiceId,
  initialClientId,
  onViewReceipt,
}) => {
  const invoiceSelectId = useId();
  const clientSelectId = useId();
  const amountInputId = useId();
  const dateInputId = useId();
  const refInputId = useId();
  const notesInputId = useId();

  // State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastRecordedPayment, setLastRecordedPayment] = useState<PaymentRecord | null>(null);

  // Initialize or update selection when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage('');
      setLastRecordedPayment(null);

      if (initialInvoiceId) {
        const inv = invoices.find((i) => i.id === initialInvoiceId);
        if (inv) {
          setSelectedInvoiceId(inv.id);
          setSelectedClientId(inv.clientId || '');
          const remaining = inv.balanceKES !== undefined ? inv.balanceKES : Math.max(0, inv.totalKES - (inv.amountPaidKES || 0));
          setAmountPaid(remaining > 0 ? String(remaining) : '');
          setPaymentReference(generateDefaultRef('M-Pesa', inv.invoiceNumber));
          return;
        }
      }

      if (initialClientId) {
        setSelectedClientId(initialClientId);
        const clientInvoices = invoices.filter(
          (i) => (i.clientId === initialClientId || i.clientName === clients.find((c) => c.id === initialClientId)?.name) &&
                 (i.balanceKES === undefined || i.balanceKES > 0)
        );
        if (clientInvoices.length > 0) {
          setSelectedInvoiceId(clientInvoices[0].id);
          const remaining = clientInvoices[0].balanceKES !== undefined
            ? clientInvoices[0].balanceKES
            : Math.max(0, clientInvoices[0].totalKES - (clientInvoices[0].amountPaidKES || 0));
          setAmountPaid(remaining > 0 ? String(remaining) : '');
          setPaymentReference(generateDefaultRef('M-Pesa', clientInvoices[0].invoiceNumber));
        } else {
          setSelectedInvoiceId('');
          setAmountPaid('');
        }
        return;
      }

      // Default: pick first outstanding invoice if available
      const unpaidInv = invoices.find((i) => (i.balanceKES === undefined ? i.status !== 'Paid' : i.balanceKES > 0)) || invoices[0];
      if (unpaidInv) {
        setSelectedInvoiceId(unpaidInv.id);
        setSelectedClientId(unpaidInv.clientId || '');
        const remaining = unpaidInv.balanceKES !== undefined
          ? unpaidInv.balanceKES
          : Math.max(0, unpaidInv.totalKES - (unpaidInv.amountPaidKES || 0));
        setAmountPaid(remaining > 0 ? String(remaining) : '');
        setPaymentReference(generateDefaultRef('M-Pesa', unpaidInv.invoiceNumber));
      } else {
        setSelectedInvoiceId('');
        setSelectedClientId('');
        setAmountPaid('');
      }
    }
  }, [isOpen, initialInvoiceId, initialClientId, invoices, clients]);

  // Helper to generate realistic reference numbers based on method
  const generateDefaultRef = (method: PaymentMethod, invNumber?: string) => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (method === 'M-Pesa') {
      return `QWE${randomHex.substring(0, 5)}`;
    }
    if (method === 'Bank Transfer') {
      return `TXN${Math.floor(10000 + Math.random() * 90000)}`;
    }
    return `CHQ-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  // When client changes, filter available invoices
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setErrorMessage('');
    if (!clientId) {
      return;
    }
    const clientInvoices = invoices.filter(
      (i) => i.clientId === clientId || i.clientName === clients.find((c) => c.id === clientId)?.name
    );
    if (clientInvoices.length > 0) {
      const activeInv = clientInvoices.find((i) => (i.balanceKES ?? i.totalKES) > 0) || clientInvoices[0];
      setSelectedInvoiceId(activeInv.id);
      const remaining = activeInv.balanceKES !== undefined ? activeInv.balanceKES : Math.max(0, activeInv.totalKES - (activeInv.amountPaidKES || 0));
      setAmountPaid(remaining > 0 ? String(remaining) : '');
      setPaymentReference(generateDefaultRef(paymentMethod, activeInv.invoiceNumber));
    } else {
      setSelectedInvoiceId('');
      setAmountPaid('');
    }
  };

  // When invoice changes
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    setErrorMessage('');
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      if (inv.clientId) setSelectedClientId(inv.clientId);
      const remaining = inv.balanceKES !== undefined ? inv.balanceKES : Math.max(0, inv.totalKES - (inv.amountPaidKES || 0));
      setAmountPaid(remaining > 0 ? String(remaining) : '');
      setPaymentReference(generateDefaultRef(paymentMethod, inv.invoiceNumber));
    }
  };

  // When payment method changes
  const handleMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    const activeInv = invoices.find((i) => i.id === selectedInvoiceId);
    setPaymentReference(generateDefaultRef(method, activeInv?.invoiceNumber));
  };

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const invoiceTotal = selectedInvoice ? selectedInvoice.totalKES : 0;
  const invoicePaid = selectedInvoice ? (selectedInvoice.amountPaidKES || (selectedInvoice.status === 'Paid' ? selectedInvoice.totalKES : 0)) : 0;
  const invoiceRemainingBalance = selectedInvoice
    ? (selectedInvoice.balanceKES !== undefined ? selectedInvoice.balanceKES : Math.max(0, invoiceTotal - invoicePaid))
    : 0;

  const parsedAmount = parseFloat(amountPaid) || 0;
  const newProjectedBalance = Math.max(0, invoiceRemainingBalance - parsedAmount);

  // Validation
  const validateForm = (): boolean => {
    setErrorMessage('');

    if (!selectedInvoiceId || !selectedInvoice) {
      setErrorMessage('Please select a valid invoice against which to record this payment.');
      return false;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Payment amount must be greater than KES 0.');
      return false;
    }

    // Scenario 5: Payment validation - prevent overpayment
    if (parsedAmount > invoiceRemainingBalance) {
      setErrorMessage(
        `Payment amount (KES ${parsedAmount.toLocaleString()}) cannot exceed the remaining invoice balance of KES ${invoiceRemainingBalance.toLocaleString()}.`
      );
      return false;
    }

    if (!paymentReference.trim()) {
      setErrorMessage('Please enter a payment reference or transaction number (e.g. M-Pesa code, Bank reference, or Cheque number).');
      return false;
    }

    if (!paymentDate) {
      setErrorMessage('Please specify the date when payment was received.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedInvoice) return;

    const receiptNum = `MAA-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber: receiptNum,
      paymentReference: paymentReference.trim().toUpperCase(),
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      clientId: selectedInvoice.clientId || selectedClientId || 'client-gen',
      clientName: selectedInvoice.clientName,
      matterTitle: selectedInvoice.matterTitle,
      amountKES: parsedAmount,
      paymentMethod: paymentMethod,
      paymentDate: paymentDate,
      notes: notes.trim() || undefined,
      receivedBy: 'Firm Workspace Invoicing Desk',
      createdAt: new Date().toISOString(),
    };

    onRecordPayment(newPayment);
    setLastRecordedPayment(newPayment);
    setIsSuccess(true);
  };

  const handlePayFullBalance = () => {
    if (invoiceRemainingBalance > 0) {
      setAmountPaid(String(invoiceRemainingBalance));
      setErrorMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <DraggableModal
        gripLabel="RECEIVE CLIENT PAYMENT"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div
          data-drag-handle="true"
          className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0098db]/20 text-[#0098db] border border-[#0098db]/40">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-base font-bold text-white">
                Receive Client Payment
              </h2>
              <p className="text-xs text-stone-300">
                Record M-Pesa, Bank Transfer, or Cheque remittance
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

        {/* Success Confirmation State */}
        {isSuccess && lastRecordedPayment ? (
          <div className="p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 font-mono uppercase tracking-wider mb-2">
                Receipt {lastRecordedPayment.receiptNumber} Generated
              </span>
              <h3 className="font-serif-title text-2xl font-bold text-stone-900">
                Payment Recorded Successfully!
              </h3>
              <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
                Received <strong className="font-mono text-stone-900">KES {lastRecordedPayment.amountKES.toLocaleString()}</strong> from{' '}
                <strong>{lastRecordedPayment.clientName}</strong> against Invoice <strong>{lastRecordedPayment.invoiceNumber}</strong>.
              </p>
            </div>

            {/* Financial State Summary */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Payment Method:</span>
                <span className="font-bold text-stone-900">{lastRecordedPayment.paymentMethod} ({lastRecordedPayment.paymentReference})</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Invoice Total:</span>
                <span className="font-mono font-semibold">KES {invoiceTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Cumulative Paid:</span>
                <span className="font-mono font-bold text-emerald-700">KES {(invoicePaid + lastRecordedPayment.amountKES).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-800 font-bold pt-2 border-t border-stone-200">
                <span>Remaining Balance Due:</span>
                <span className={`font-mono text-sm ${invoiceRemainingBalance - lastRecordedPayment.amountKES === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  KES {(invoiceRemainingBalance - lastRecordedPayment.amountKES).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onViewReceipt && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewReceipt(lastRecordedPayment);
                  }}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#132c3f] text-white px-4 py-2 text-xs font-bold hover:bg-[#1a3a52] transition-colors cursor-pointer shadow-sm"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>View Official Payment Receipt</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Close & Return to Billing
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            
            {/* Error banner */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start space-x-2 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Client and Invoice Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={clientSelectId} className="block text-xs font-bold text-stone-700 mb-1.5">
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  id={clientSelectId}
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                >
                  <option value="">-- All Clients with Invoices --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={invoiceSelectId} className="block text-xs font-bold text-stone-700 mb-1.5">
                  Select Invoice <span className="text-red-500">*</span>
                </label>
                <select
                  id={invoiceSelectId}
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                >
                  <option value="">-- Select an Invoice --</option>
                  {invoices
                    .filter((inv) => !selectedClientId || inv.clientId === selectedClientId || inv.clientName === clients.find((c) => c.id === selectedClientId)?.name)
                    .map((inv) => {
                      const bal = inv.balanceKES !== undefined ? inv.balanceKES : Math.max(0, inv.totalKES - (inv.amountPaidKES || 0));
                      return (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} • {inv.clientName} (Bal: KES {bal.toLocaleString()}) - {inv.status}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {/* Selected Invoice Financial Banner */}
            {selectedInvoice && (
              <div className="rounded-xl border border-stone-200 bg-gradient-to-r from-stone-50 via-sky-50/40 to-stone-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-[#0098db]">
                        {selectedInvoice.invoiceNumber}
                      </span>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          selectedInvoice.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedInvoice.status === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedInvoice.status === 'Overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedInvoice.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 font-medium truncate max-w-sm mt-0.5">
                      {selectedInvoice.matterTitle}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 font-medium">Invoice Total</span>
                    <p className="font-mono text-base font-bold text-stone-900">
                      KES {invoiceTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 3-Column Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                  <div className="rounded-lg bg-white p-2 border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-semibold block">Total Invoiced</span>
                    <span className="font-mono text-xs font-bold text-stone-800">
                      KES {invoiceTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-2 border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-semibold block">Already Paid</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      KES {invoicePaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-2 border border-amber-200 bg-amber-50/50">
                    <span className="text-[10px] text-amber-800 font-semibold block">Remaining Balance</span>
                    <span className="font-mono text-xs font-bold text-amber-900">
                      KES {invoiceRemainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {invoiceRemainingBalance === 0 && (
                  <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center text-xs text-emerald-800 font-semibold">
                    ✓ This invoice is already fully paid. No outstanding balance remains.
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleMethodChange('M-Pesa')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'M-Pesa'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Smartphone className={`h-5 w-5 mb-1 ${paymentMethod === 'M-Pesa' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  <span className="text-xs font-semibold">M-Pesa</span>
                  <span className="text-[9px] text-stone-500">Paybill / Express</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMethodChange('Bank Transfer')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'Bank Transfer'
                      ? 'border-[#0098db] bg-blue-50 text-[#132c3f] ring-2 ring-blue-500/20 font-bold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Landmark className={`h-5 w-5 mb-1 ${paymentMethod === 'Bank Transfer' ? 'text-[#0098db]' : 'text-stone-400'}`} />
                  <span className="text-xs font-semibold">Bank Transfer</span>
                  <span className="text-[9px] text-stone-500">RTGS / EFT / Wire</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMethodChange('Cheque')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'Cheque'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 font-bold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Receipt className={`h-5 w-5 mb-1 ${paymentMethod === 'Cheque' ? 'text-purple-700' : 'text-stone-400'}`} />
                  <span className="text-xs font-semibold">Cheque</span>
                  <span className="text-[9px] text-stone-500">Banker's / Corporate</span>
                </button>
              </div>
            </div>

            {/* Amount and Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={amountInputId} className="text-xs font-bold text-stone-700">
                  Amount Received (KES) <span className="text-red-500">*</span>
                </label>
                {invoiceRemainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={handlePayFullBalance}
                    className="text-[11px] font-bold text-[#0098db] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Pay Full Balance (KES {invoiceRemainingBalance.toLocaleString()})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-mono text-xs font-bold text-stone-400">
                  KES
                </span>
                <input
                  id={amountInputId}
                  type="number"
                  min="1"
                  max={invoiceRemainingBalance > 0 ? invoiceRemainingBalance : undefined}
                  step="1"
                  placeholder={invoiceRemainingBalance > 0 ? `e.g. ${invoiceRemainingBalance}` : '0'}
                  value={amountPaid}
                  onChange={(e) => {
                    setAmountPaid(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-white pl-12 pr-3 py-2 text-sm font-mono font-bold text-stone-900 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                />
              </div>

              {/* Dynamic balance projection */}
              {parsedAmount > 0 && selectedInvoice && (
                <div className="mt-2 text-xs flex items-center justify-between text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200">
                  <span>Projected Status after Payment:</span>
                  <span className="font-semibold">
                    {newProjectedBalance === 0 ? (
                      <span className="text-emerald-700 font-bold">Paid in Full (Balance KES 0)</span>
                    ) : (
                      <span className="text-blue-700 font-bold">
                        Partially Paid (Balance KES {newProjectedBalance.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Reference Number & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={refInputId} className="block text-xs font-bold text-stone-700 mb-1.5">
                  Payment Reference / Trans. No. <span className="text-red-500">*</span>
                </label>
                <input
                  id={refInputId}
                  type="text"
                  placeholder={
                    paymentMethod === 'M-Pesa'
                      ? 'e.g. QWE12345'
                      : paymentMethod === 'Bank Transfer'
                      ? 'e.g. TXN98231'
                      : 'e.g. CHQ-4091'
                  }
                  value={paymentReference}
                  onChange={(e) => {
                    setPaymentReference(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  M-Pesa code, Bank confirmation ref, or Cheque serial #
                </p>
              </div>

              <div>
                <label htmlFor={dateInputId} className="block text-xs font-bold text-stone-700 mb-1.5">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  id={dateInputId}
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                />
              </div>
            </div>

            {/* Notes / Remarks */}
            <div>
              <label htmlFor={notesInputId} className="block text-xs font-bold text-stone-700 mb-1.5">
                Notes & Remittance Details (Optional)
              </label>
              <textarea
                id={notesInputId}
                rows={2}
                placeholder="e.g. Deposit for court process server disbursements and initial retainer."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedInvoice || invoiceRemainingBalance <= 0}
                className="rounded-lg bg-[#0098db] hover:bg-[#0087c2] disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Record Payment
              </button>
            </div>
          </form>
        )}
      </DraggableModal>
    </div>
  );
};
