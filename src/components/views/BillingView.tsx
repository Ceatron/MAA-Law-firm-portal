import React, { useState, useEffect } from 'react';
import {
  Download,
  Plus,
  BarChart3,
  Receipt,
  Eye,
  CheckCircle2,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Building,
  CreditCard,
  FileText,
  Clock,
  ArrowRightCircle,
  Trash2,
  Edit3,
  Calendar,
  Smartphone,
  Landmark,
  FileCheck2,
  Printer,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { InvoicePreviewDrawer } from '../InvoicePreviewDrawer';
import { GenerateInvoiceModal } from '../GenerateInvoiceModal';
import { FinancialInsightsReport } from '../FinancialInsightsReport';
import { ReceivePaymentModal } from '../ReceivePaymentModal';
import { PaymentReceiptDrawer } from '../PaymentReceiptDrawer';
import { CreateQuoteModal } from '../CreateQuoteModal';
import { QuotePreviewDrawer } from '../QuotePreviewDrawer';
import { FeeNote, Client, LegalMatter, Advocate, PaymentRecord, Quotation, PaymentMethod, QuoteStatus } from '../../types';
import {
  loadSavedFeeNotes,
  saveStoredFeeNotes,
  loadSavedPayments,
  saveStoredPayments,
  loadSavedQuotes,
  saveStoredQuotes,
} from '../../utils/chambersDataStorage';

interface BillingViewProps {
  clients?: Client[];
  matters?: LegalMatter[];
  onAddClient?: (client: Client) => void;
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  canAccessFinancialInsights?: boolean;
  canAccessInvoicing?: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  clients = [],
  matters = [],
  onAddClient,
  currentAdvocate,
  isManagingAdvocate = true,
  canAccessFinancialInsights = true,
  canAccessInvoicing = true,
  onNavigateTab,
}) => {
  // Navigation sub-tabs: 'overview' | 'invoices' | 'payments' | 'quotes' | 'insights'
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'invoices' | 'payments' | 'quotes' | 'insights'>('overview');

  // Core Data States initialized from persistent storage
  const [feeNotes, setFeeNotes] = useState<FeeNote[]>(() => loadSavedFeeNotes());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadSavedPayments());
  const [quotes, setQuotes] = useState<Quotation[]>(() => loadSavedQuotes());

  // Automatically sync state to persistent storage
  useEffect(() => {
    saveStoredFeeNotes(feeNotes);
  }, [feeNotes]);

  useEffect(() => {
    saveStoredPayments(payments);
  }, [payments]);

  useEffect(() => {
    saveStoredQuotes(quotes);
  }, [quotes]);

  // Modals and Drawers States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isReceivePaymentModalOpen, setIsReceivePaymentModalOpen] = useState(false);
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FeeNote | null>(null);
  const [previewingFeeNote, setPreviewingFeeNote] = useState<FeeNote | null>(null);
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

  const [previewingPayment, setPreviewingPayment] = useState<PaymentRecord | null>(null);
  const [isPaymentReceiptDrawerOpen, setIsPaymentReceiptDrawerOpen] = useState(false);

  const [previewingQuote, setPreviewingQuote] = useState<Quotation | null>(null);
  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);

  // Search & Filter States
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue'>('ALL');

  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | 'M-Pesa' | 'Bank Transfer' | 'Cheque'>('ALL');

  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<'ALL' | 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted to Invoice'>('ALL');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ----------------------------------------------------
  // PAYMENT RECORDING & RECALCULATION LOGIC
  // ----------------------------------------------------
  const handleRecordPayment = (newPayment: PaymentRecord) => {
    // 1. Add to payments list
    setPayments((prev) => [newPayment, ...prev]);

    // 2. Find and update the linked invoice
    setFeeNotes((prev) =>
      prev.map((inv) => {
        if (inv.id === newPayment.invoiceId || inv.invoiceNumber === newPayment.invoiceNumber) {
          const prevPaid = inv.amountPaidKES !== undefined
            ? inv.amountPaidKES
            : inv.status === 'Paid' ? inv.totalKES : 0;
          const newAmountPaid = prevPaid + newPayment.amountKES;
          const newBalance = Math.max(0, inv.totalKES - newAmountPaid);
          
          let newStatus = inv.status;
          if (newBalance === 0) {
            newStatus = 'Paid';
          } else if (newAmountPaid > 0) {
            newStatus = 'Partially Paid';
          } else {
            newStatus = 'Unpaid';
          }

          return {
            ...inv,
            amountPaidKES: newAmountPaid,
            balanceKES: newBalance,
            status: newStatus,
            paymentRef: newPayment.paymentReference,
            paymentsCount: (inv.paymentsCount || 0) + 1,
          };
        }
        return inv;
      })
    );

    showToast(`Payment of KES ${newPayment.amountKES.toLocaleString()} recorded. Receipt ${newPayment.receiptNumber} generated.`);
  };

  const handleDeletePayment = (paymentId: string) => {
    const paymentToDelete = payments.find((p) => p.id === paymentId);
    if (!paymentToDelete) return;

    if (!window.confirm(`Are you sure you want to delete payment ${paymentToDelete.receiptNumber} (${paymentToDelete.paymentReference}) for KES ${paymentToDelete.amountKES.toLocaleString()}? The linked invoice balance will be recalculated automatically.`)) {
      return;
    }

    // 1. Remove from payments
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));

    // 2. Recalculate invoice
    setFeeNotes((prev) =>
      prev.map((inv) => {
        if (inv.id === paymentToDelete.invoiceId || inv.invoiceNumber === paymentToDelete.invoiceNumber) {
          const prevPaid = inv.amountPaidKES !== undefined ? inv.amountPaidKES : (inv.status === 'Paid' ? inv.totalKES : 0);
          const newAmountPaid = Math.max(0, prevPaid - paymentToDelete.amountKES);
          const newBalance = Math.max(0, inv.totalKES - newAmountPaid);
          
          let newStatus = inv.status;
          if (newBalance === 0) {
            newStatus = 'Paid';
          } else if (newAmountPaid > 0) {
            newStatus = 'Partially Paid';
          } else {
            newStatus = 'Unpaid';
          }

          return {
            ...inv,
            amountPaidKES: newAmountPaid,
            balanceKES: newBalance,
            status: newStatus,
            paymentsCount: Math.max(0, (inv.paymentsCount || 1) - 1),
          };
        }
        return inv;
      })
    );

    showToast(`Payment ${paymentToDelete.receiptNumber} deleted and invoice balance recalculated.`);
  };

  // ----------------------------------------------------
  // QUOTATION & CONVERSION TO INVOICE LOGIC
  // ----------------------------------------------------
  const handleSaveQuote = (quote: Quotation) => {
    setQuotes((prev) => {
      const exists = prev.some((q) => q.id === quote.id);
      if (exists) {
        return prev.map((q) => (q.id === quote.id ? quote : q));
      }
      return [quote, ...prev];
    });
    showToast(`Quotation ${quote.quoteNumber} saved successfully.`);
  };

  const handleUpdateQuoteStatus = (quoteId: string, newStatus: QuoteStatus) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus, updatedAt: new Date().toISOString() } : q))
    );
    showToast(`Quote status updated to "${newStatus}".`);
  };

  const handleConvertToInvoice = (quote: Quotation) => {
    // Check if already converted
    if (quote.status === 'Converted to Invoice' || (quote.status as any) === 'Converted to Fee Note') {
      showToast(`This quote was already converted into a Fee Note.`);
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newInvoiceNumber = `MAA-FN-2026-${randomNum}`;

    const newInvoice: FeeNote = {
      id: `fn-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientKraPin: quote.clientKraPin,
      clientAddress: quote.clientAddress,
      matterId: quote.matterId,
      matterTitle: quote.matterTitle || quote.title,
      dateIssued: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: quote.items.map((it) => ({
        id: `inv-${it.id}`,
        description: it.description,
        category: it.category,
        quantity: it.quantity,
        unitPriceKES: it.unitPriceKES,
        totalPriceKES: it.totalPriceKES,
        isTaxable: it.isTaxable !== false,
        vatAmountKES: it.vatAmountKES,
      })),
      subtotalKES: quote.subtotalKES,
      taxableAmountKES: quote.taxableAmountKES,
      nonTaxableAmountKES: quote.nonTaxableAmountKES,
      amountKES: quote.subtotalKES,
      vatRatePercent: 16,
      vatKES: quote.vatKES,
      totalKES: quote.totalKES,
      amountPaidKES: 0,
      balanceKES: quote.totalKES,
      status: 'Unpaid',
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      notes: `Converted from Quotation ${quote.quoteNumber}. ${quote.notes || ''}`,
      paymentsCount: 0,
    };

    // 1. Add new invoice
    setFeeNotes((prev) => [newInvoice, ...prev]);

    // 2. Update quote status to 'Converted to Fee Note'
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quote.id
          ? {
              ...q,
              status: 'Converted to Fee Note' as QuoteStatus,
              convertedInvoiceId: newInvoice.id,
              convertedInvoiceNumber: newInvoice.invoiceNumber,
              updatedAt: new Date().toISOString(),
            }
          : q
      )
    );

    // 3. Close quote preview and open new invoice drawer
    setIsQuoteDrawerOpen(false);
    setPreviewingFeeNote(newInvoice);
    setIsInvoiceDrawerOpen(true);
    showToast(`Quotation ${quote.quoteNumber} converted into Tax Fee Note ${newInvoice.invoiceNumber}!`);
  };

  // ----------------------------------------------------
  // FINANCIAL CALCULATIONS & TOTALS
  // ----------------------------------------------------
  const totalInvoicedKES = feeNotes.reduce((sum, fn) => sum + fn.totalKES, 0);
  
  const totalPaidKES = feeNotes.reduce((sum, fn) => {
    if (fn.amountPaidKES !== undefined) return sum + fn.amountPaidKES;
    return sum + (fn.status === 'Paid' ? fn.totalKES : 0);
  }, 0);

  const totalOutstandingKES = feeNotes.reduce((sum, fn) => {
    if (fn.balanceKES !== undefined) return sum + fn.balanceKES;
    return sum + (fn.status === 'Paid' ? 0 : fn.totalKES);
  }, 0);

  const paidInvoicesCount = feeNotes.filter((fn) => {
    const bal = fn.balanceKES !== undefined ? fn.balanceKES : (fn.status === 'Paid' ? 0 : fn.totalKES);
    return bal === 0 || fn.status === 'Paid';
  }).length;

  const partialInvoicesCount = feeNotes.filter((fn) => {
    const paid = fn.amountPaidKES || 0;
    const bal = fn.balanceKES !== undefined ? fn.balanceKES : fn.totalKES;
    return paid > 0 && bal > 0;
  }).length;

  const unpaidInvoicesCount = feeNotes.filter((fn) => {
    const paid = fn.amountPaidKES || 0;
    return paid === 0 && fn.status !== 'Paid';
  }).length;

  // Filtered Fee Notes
  const filteredFeeNotes = feeNotes.filter((fn) => {
    const matchesSearch =
      fn.clientName.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      fn.invoiceNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      fn.matterTitle.toLowerCase().includes(invoiceSearchQuery.toLowerCase());

    const bal = fn.balanceKES !== undefined ? fn.balanceKES : (fn.status === 'Paid' ? 0 : fn.totalKES);
    const paid = fn.amountPaidKES || 0;

    let derivedStatus = fn.status;
    if (bal === 0) derivedStatus = 'Paid';
    else if (paid > 0) derivedStatus = 'Partially Paid';
    else derivedStatus = 'Unpaid';

    const matchesStatus =
      invoiceStatusFilter === 'ALL' ||
      derivedStatus === invoiceStatusFilter ||
      (invoiceStatusFilter === 'Overdue' && fn.status === 'Overdue');

    return matchesSearch && matchesStatus;
  });

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.clientName.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      p.paymentReference.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(paymentSearchQuery.toLowerCase());

    const matchesMethod = paymentMethodFilter === 'ALL' || p.paymentMethod === paymentMethodFilter;
    return matchesSearch && matchesMethod;
  });

  // Filtered Quotes
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.clientName.toLowerCase().includes(quoteSearchQuery.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(quoteSearchQuery.toLowerCase()) ||
      q.title.toLowerCase().includes(quoteSearchQuery.toLowerCase());

    const matchesStatus = quoteStatusFilter === 'ALL' || q.status === quoteStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Quick Open Receive Payment for specific invoice
  const handleOpenReceivePayment = (inv?: FeeNote) => {
    setSelectedInvoiceForPayment(inv || null);
    setIsReceivePaymentModalOpen(true);
  };

  // Check if no billing permissions
  if (!canAccessInvoicing && !canAccessFinancialInsights && !isManagingAdvocate) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mb-6 border border-amber-200">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-stone-900 mb-3">
            This section is restricted
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#132c3f] text-white px-4 py-3 shadow-2xl border border-[#0098db]/40 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-[#00c0ef] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Billing Hub Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif-title text-2xl font-bold text-stone-900">
              Billing & Financial Management
            </h1>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold font-mono px-2.5 py-0.5 uppercase tracking-wider">
              LSK & KRA Compliant
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Fee Notes & Invoicing, Payment Remittances (M-Pesa, Bank, Cheque), and Fee Quotations
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenReceivePayment()}
            className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>Receive Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-lg bg-[#0098db] hover:bg-[#0087c2] text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Fee Note</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingQuote(null);
              setIsCreateQuoteModalOpen(true);
            }}
            className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#0098db]" />
            <span>Create Quote</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 overflow-x-auto pb-px">
        <div className="flex items-center space-x-2">
          
          {/* 1. Overview Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'border-[#0098db] text-[#0098db]'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Billing Overview</span>
          </button>

          {/* 2. Fee Notes Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('invoices')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'invoices'
                ? 'border-[#0098db] text-[#0098db]'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Fee Notes ({feeNotes.length})</span>
          </button>

          {/* 3. Payments Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('payments')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'payments'
                ? 'border-[#0098db] text-[#0098db]'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Payment History ({payments.length})</span>
          </button>

          {/* 4. Quotes Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('quotes')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'quotes'
                ? 'border-[#0098db] text-[#0098db]'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Quotes & Estimates ({quotes.length})</span>
          </button>

          {/* 5. Financial Insights (Managing Advocate Only) */}
          {canAccessFinancialInsights && (
            <button
              type="button"
              onClick={() => setActiveSubTab('insights')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'insights'
                  ? 'border-[#0098db] text-[#0098db]'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Partner Insights</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. OVERVIEW / DASHBOARD TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Invoiced */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Receivables</span>
                <div className="p-2 rounded-lg bg-blue-50 text-[#0098db]">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <p className="font-mono text-2xl font-bold text-stone-900">
                KES {totalInvoicedKES.toLocaleString()}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Across {feeNotes.length} tax fee notes
              </p>
            </div>

            {/* Total Paid */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="font-mono text-2xl font-bold text-emerald-900">
                KES {totalPaidKES.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                {totalInvoicedKES > 0 ? Math.round((totalPaidKES / totalInvoicedKES) * 100) : 0}% collection rate
              </p>
            </div>

            {/* Total Outstanding */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Outstanding</span>
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="font-mono text-2xl font-bold text-amber-900">
                KES {totalOutstandingKES.toLocaleString()}
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                {unpaidInvoicesCount + partialInvoicesCount} fee notes pending settlement
              </p>
            </div>

            {/* Fee Note Breakdown */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Fee Note Breakdown</span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <span className="text-emerald-700 font-bold">{paidInvoicesCount} Paid</span>
                <span className="text-blue-700 font-bold">{partialInvoicesCount} Partial</span>
                <span className="text-amber-700 font-bold">{unpaidInvoicesCount} Unpaid</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2 mt-3 flex overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${feeNotes.length ? (paidInvoicesCount / feeNotes.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${feeNotes.length ? (partialInvoicesCount / feeNotes.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${feeNotes.length ? (unpaidInvoicesCount / feeNotes.length) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>

          {/* Quick Actions & Recent Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Payments Received */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    Recent Payments Received
                  </h3>
                  <p className="text-xs text-stone-500">M-Pesa, Bank, and Cheque remittances</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('payments')}
                  className="text-xs font-bold text-[#0098db] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All ({payments.length})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {payments.slice(0, 4).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between hover:bg-stone-50/60 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        {p.paymentMethod === 'M-Pesa' ? 'MP' : p.paymentMethod === 'Bank Transfer' ? 'BT' : 'CH'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{p.clientName}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {p.invoiceNumber} • {p.paymentReference} • {new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-emerald-800">
                        + KES {p.amountKES.toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewingPayment(p);
                          setIsPaymentReceiptDrawerOpen(true);
                        }}
                        className="text-[10px] text-[#0098db] hover:underline font-semibold cursor-pointer"
                      >
                        Receipt {p.receiptNumber}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Quotations & Estimates */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    Active Quotes & Estimates
                  </h3>
                  <p className="text-xs text-stone-500">Proforma fee estimates for clients</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('quotes')}
                  className="text-xs font-bold text-[#0098db] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All ({quotes.length})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {quotes.slice(0, 4).map((q) => (
                  <div key={q.id} className="py-3 flex items-center justify-between hover:bg-stone-50/60 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#0098db]">{q.quoteNumber}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            q.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.status === 'Converted to Invoice'
                              ? 'bg-purple-100 text-purple-800'
                              : q.status === 'Sent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-stone-800 truncate max-w-xs mt-0.5">
                        {q.clientName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-stone-900">
                        KES {q.totalKES.toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewingQuote(q);
                          setIsQuoteDrawerOpen(true);
                        }}
                        className="text-[10px] text-[#0098db] hover:underline font-semibold cursor-pointer"
                      >
                        Preview Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FEE NOTES LEDGER TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by fee note #, client name, or matter..."
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-1.5 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              <span className="text-xs font-semibold text-stone-500 mr-1.5 flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filter:
              </span>
              {(['ALL', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInvoiceStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    invoiceStatusFilter === st
                      ? 'bg-[#132c3f] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Notes Table */}
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Fee Note #</th>
                    <th className="py-3 px-4">Client Particulars</th>
                    <th className="py-3 px-4">Matter Reference</th>
                    <th className="py-3 px-3 text-right">Total (KES)</th>
                    <th className="py-3 px-3 text-right">Paid (KES)</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredFeeNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-500">
                        No fee notes matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFeeNotes.map((fn) => {
                      const total = fn.totalKES;
                      const paid = fn.amountPaidKES !== undefined ? fn.amountPaidKES : (fn.status === 'Paid' ? total : 0);
                      const balance = fn.balanceKES !== undefined ? fn.balanceKES : Math.max(0, total - paid);

                      let statusBadge = fn.status;
                      if (balance === 0) statusBadge = 'Paid';
                      else if (paid > 0) statusBadge = 'Partially Paid';
                      else statusBadge = 'Unpaid';

                      return (
                        <tr key={fn.id} className="hover:bg-stone-50/70 transition-colors">
                          
                          {/* Fee Note # */}
                          <td className="py-3 px-4 font-mono font-bold text-[#0098db] whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewingFeeNote(fn);
                                setIsInvoiceDrawerOpen(true);
                              }}
                              className="hover:underline cursor-pointer flex items-center space-x-1"
                            >
                              <span>{fn.invoiceNumber}</span>
                            </button>
                            <span className="text-[10px] text-stone-400 block font-normal">
                              Issued: {fn.dateIssued}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-900">{fn.clientName}</p>
                            {fn.clientKraPin && (
                              <p className="text-[10px] text-stone-500 font-mono">PIN: {fn.clientKraPin}</p>
                            )}
                          </td>

                          {/* Matter */}
                          <td className="py-3 px-4 max-w-xs truncate text-stone-700">
                            <span className="font-medium truncate block">{fn.matterTitle}</span>
                            {fn.quoteNumber && (
                              <span className="text-[10px] text-purple-700 font-mono font-semibold">
                                From Quote: {fn.quoteNumber}
                              </span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                            {total.toLocaleString()}
                          </td>

                          {/* Paid */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {paid.toLocaleString()}
                          </td>

                          {/* Balance */}
                          <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className={balance === 0 ? 'text-emerald-700' : 'text-amber-800'}>
                              {balance.toLocaleString()}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                statusBadge === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : statusBadge === 'Partially Paid'
                                  ? 'bg-blue-100 text-blue-800'
                                  : statusBadge === 'Overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {statusBadge}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              {balance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceivePayment(fn)}
                                  className="flex items-center space-x-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Receive Payment"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  <span>Pay</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewingFeeNote(fn);
                                  setIsInvoiceDrawerOpen(true);
                                }}
                                className="flex items-center space-x-1 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Preview Fee Note"
                              >
                                <Eye className="h-3 w-3 text-stone-500" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PAYMENT HISTORY TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by client, invoice #, receipt #, or reference..."
                value={paymentSearchQuery}
                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-1.5 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>

            {/* Method Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              <span className="text-xs font-semibold text-stone-500 mr-1.5 flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Method:
              </span>
              {(['ALL', 'M-Pesa', 'Bank Transfer', 'Cheque'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethodFilter(m)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethodFilter === m
                      ? 'bg-[#132c3f] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Payments Table */}
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4 font-mono">Receipt #</th>
                    <th className="py-3 px-4 font-mono">Reference / Trans No.</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-3">Fee Note #</th>
                    <th className="py-3 px-3 text-right">Amount (KES)</th>
                    <th className="py-3 px-3 text-center">Payment Method</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-stone-500">
                        No payments found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        
                        {/* Date */}
                        <td className="py-3 px-4 font-medium text-stone-800 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Receipt # */}
                        <td className="py-3 px-4 font-mono font-bold text-[#0098db] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewingPayment(p);
                              setIsPaymentReceiptDrawerOpen(true);
                            }}
                            className="hover:underline cursor-pointer"
                          >
                            {p.receiptNumber}
                          </button>
                        </td>

                        {/* Reference */}
                        <td className="py-3 px-4 font-mono font-bold text-stone-800 whitespace-nowrap">
                          {p.paymentReference}
                        </td>

                        {/* Client */}
                        <td className="py-3 px-4 font-semibold text-stone-900 whitespace-nowrap">
                          {p.clientName}
                        </td>

                        {/* Invoice */}
                        <td className="py-3 px-3 font-mono font-bold text-stone-700 whitespace-nowrap">
                          {p.invoiceNumber}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm whitespace-nowrap">
                          KES {p.amountKES.toLocaleString()}
                        </td>

                        {/* Method */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              p.paymentMethod === 'M-Pesa'
                                ? 'bg-emerald-100 text-emerald-900'
                                : p.paymentMethod === 'Bank Transfer'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            <span>{p.paymentMethod}</span>
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 text-stone-500 max-w-xs truncate text-[11px]">
                          {p.notes || '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewingPayment(p);
                                setIsPaymentReceiptDrawerOpen(true);
                              }}
                              className="rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="View Official Receipt"
                            >
                              <FileCheck2 className="h-3 w-3 text-[#0098db] inline mr-1" />
                              <span>Receipt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.id)}
                              className="text-stone-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                              title="Delete Payment & Recalculate Balance"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. QUOTES & PROFORMA ESTIMATES TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'quotes' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by quote #, client, or subject matter..."
                value={quoteSearchQuery}
                onChange={(e) => setQuoteSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-1.5 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              <span className="text-xs font-semibold text-stone-500 mr-1.5 flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Status:
              </span>
              {(['ALL', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Converted to Invoice'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setQuoteStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    quoteStatusFilter === st
                      ? 'bg-[#132c3f] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Quotes Table */}
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Client Particulars</th>
                    <th className="py-3 px-4">Subject / Instruction</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Valid Until</th>
                    <th className="py-3 px-3 text-right">Estimated Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-500">
                        No quotes found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotes.map((q) => {
                      const isConverted = q.status === 'Converted to Invoice';

                      return (
                        <tr key={q.id} className="hover:bg-stone-50/70 transition-colors">
                          
                          {/* Quote # */}
                          <td className="py-3 px-4 font-mono font-bold text-[#0098db] whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewingQuote(q);
                                setIsQuoteDrawerOpen(true);
                              }}
                              className="hover:underline cursor-pointer"
                            >
                              {q.quoteNumber}
                            </button>
                          </td>

                          {/* Client */}
                          <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                            {q.clientName}
                          </td>

                          {/* Subject */}
                          <td className="py-3 px-4 max-w-xs truncate text-stone-700">
                            <span className="font-medium truncate block">{q.title}</span>
                            {isConverted && (
                              <span className="text-[10px] text-purple-700 font-mono font-bold">
                                Converted to: {q.convertedInvoiceNumber || 'INV Generated'}
                              </span>
                            )}
                          </td>

                          {/* Quote Date */}
                          <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                            {new Date(q.quoteDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Expiry Date */}
                          <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                            {new Date(q.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Estimated Total */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                            KES {q.totalKES.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                q.status === 'Accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.status === 'Converted to Invoice'
                                  ? 'bg-purple-100 text-purple-800'
                                  : q.status === 'Sent'
                                  ? 'bg-blue-100 text-blue-800'
                                  : q.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              {!isConverted && (
                                <button
                                  type="button"
                                  onClick={() => handleConvertToInvoice(q)}
                                  className="flex items-center space-x-1 rounded bg-[#0098db] hover:bg-[#0087c2] text-white px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Convert to Tax Invoice"
                                >
                                  <ArrowRightCircle className="h-3 w-3" />
                                  <span>Convert</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewingQuote(q);
                                  setIsQuoteDrawerOpen(true);
                                }}
                                className="rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Preview Quote Document"
                              >
                                <Eye className="h-3 w-3 text-stone-500 inline mr-1" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. FINANCIAL INSIGHTS TAB (Managing Advocate Only) */}
      {/* ======================================================== */}
      {activeSubTab === 'insights' && canAccessFinancialInsights && (
        <FinancialInsightsReport />
      )}

      {/* ======================================================== */}
      {/* MODALS & DRAWERS */}
      {/* ======================================================== */}
      
      {/* Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={isReceivePaymentModalOpen}
        onClose={() => {
          setIsReceivePaymentModalOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        invoices={feeNotes}
        clients={clients}
        onRecordPayment={handleRecordPayment}
        initialInvoiceId={selectedInvoiceForPayment?.id}
        initialClientId={selectedInvoiceForPayment?.clientId}
        onViewReceipt={(payment) => {
          setPreviewingPayment(payment);
          setIsPaymentReceiptDrawerOpen(true);
        }}
      />

      {/* Payment Receipt Drawer */}
      <PaymentReceiptDrawer
        isOpen={isPaymentReceiptDrawerOpen}
        onClose={() => {
          setIsPaymentReceiptDrawerOpen(false);
          setPreviewingPayment(null);
        }}
        payment={previewingPayment}
        linkedInvoice={previewingPayment ? feeNotes.find((i) => i.id === previewingPayment.invoiceId || i.invoiceNumber === previewingPayment.invoiceNumber) : null}
      />

      {/* Generate Invoice Modal */}
      <GenerateInvoiceModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        clients={clients}
        matters={matters}
        onAddInvoice={(newInvoice) => {
          setFeeNotes((prev) => [newInvoice, ...prev]);
          showToast(`Tax Fee Note ${newInvoice.invoiceNumber} created!`);
        }}
        onAddClient={onAddClient}
      />

      {/* Invoice Preview Drawer */}
      <InvoicePreviewDrawer
        isOpen={isInvoiceDrawerOpen}
        onClose={() => {
          setIsInvoiceDrawerOpen(false);
          setPreviewingFeeNote(null);
        }}
        feeNote={previewingFeeNote}
        onReceivePayment={(inv) => handleOpenReceivePayment(inv)}
      />

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={isCreateQuoteModalOpen}
        onClose={() => {
          setIsCreateQuoteModalOpen(false);
          setEditingQuote(null);
        }}
        clients={clients}
        matters={matters}
        onSaveQuote={handleSaveQuote}
        onAddClient={onAddClient}
        editingQuote={editingQuote}
      />

      {/* Quote Preview Drawer */}
      <QuotePreviewDrawer
        isOpen={isQuoteDrawerOpen}
        onClose={() => {
          setIsQuoteDrawerOpen(false);
          setPreviewingQuote(null);
        }}
        quote={previewingQuote}
        onConvertToInvoice={handleConvertToInvoice}
        onEditQuote={(q) => {
          setEditingQuote(q);
          setIsCreateQuoteModalOpen(true);
        }}
        onUpdateStatus={handleUpdateQuoteStatus}
      />

    </div>
  );
};
