import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Building2,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  PieChart as PieIcon,
  RefreshCw,
  FileSpreadsheet,
  Send,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { FeeNote, LegalMatter, PaymentRecord, Client } from '../types';

interface FinancialInsightsReportProps {
  isManagingAdvocate?: boolean;
  feeNotes?: FeeNote[];
  matters?: LegalMatter[];
  payments?: PaymentRecord[];
  clients?: Client[];
}

export const FinancialInsightsReport: React.FC<FinancialInsightsReportProps> = ({
  isManagingAdvocate = true,
  feeNotes = [],
  matters = [],
  payments = [],
  clients = [],
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'FY2026' | 'Q3_2026' | 'Q2_2026'>('FY2026');
  const [clientCategoryFilter, setClientCategoryFilter] = useState<string>('All');
  const [activeChartTab, setActiveChartTab] = useState<'monthly' | 'aging' | 'clients'>('monthly');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isManagingAdvocate) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-8 sm:p-12 shadow-xs text-center max-w-3xl mx-auto my-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-200">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="font-serif-title text-2xl font-bold text-stone-900 mb-2">
          Financial Insights Restricted
        </h3>
        <p className="text-stone-600 text-sm max-w-lg mx-auto leading-relaxed mb-4">
          Detailed executive revenue trends, aging receivables, partner distributions, and financial analytics are strictly confidential and reserved for the <strong>Managing Advocate</strong>.
        </p>
        <span className="inline-block rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1">
          Managing Advocate Authorization Required
        </span>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculations from dynamic data incorporating fee notes, payments, clients & registered matter fees
  const actualFeeNotes = feeNotes || [];
  const actualMatters = matters || [];
  const actualPayments = payments || [];
  const actualClients = clients || [];

  const mattersWithFee = actualMatters.filter((m) => {
    const fee = m.billedKES || m.estimatedFeeKES || 0;
    return fee > 0;
  });

  const pendingMatters = actualMatters.filter((m) => {
    const fee = m.billedKES || m.estimatedFeeKES || 0;
    const paid = m.paidKES || 0;
    return Math.max(0, fee - paid) > 0;
  });

  const mattersReceivablesKES = actualMatters.reduce(
    (acc, m) => acc + Math.max(0, (m.billedKES || m.estimatedFeeKES || 0) - (m.paidKES || 0)),
    0
  );

  const mattersPaidKES = actualMatters.reduce(
    (acc, m) => acc + (m.paidKES || 0),
    0
  );

  const feeNotesBilledKES = actualFeeNotes.reduce((acc, f) => acc + (f.totalKES || 0), 0);
  const feeNotesPaidKES = actualFeeNotes
    .filter((f) => f.status === 'Paid' || (f.amountPaidKES && f.amountPaidKES > 0))
    .reduce((acc, f) => acc + (f.amountPaidKES !== undefined ? f.amountPaidKES : f.totalKES), 0);
  const feeNotesOutstandingVal = actualFeeNotes
    .filter((f) => f.status !== 'Paid')
    .reduce((acc, f) => acc + (f.balanceKES !== undefined ? f.balanceKES : f.totalKES), 0);

  const totalBilledVal = feeNotesBilledKES + mattersReceivablesKES;
  const totalPaidVal = feeNotesPaidKES + mattersPaidKES;
  const totalOutstandingVal = feeNotesOutstandingVal + mattersReceivablesKES;

  const unpaidFeeNotes = actualFeeNotes.filter(
    (fn) => fn.status !== 'Paid' && (fn.balanceKES === undefined || fn.balanceKES > 0)
  );
  const pendingInvoicesCount = unpaidFeeNotes.length;
  const pendingMattersCount = pendingMatters.length;

  // Real App Transactions: Dynamic Client Revenue Map
  const clientRevenueMap = new Map<
    string,
    {
      clientName: string;
      category: string;
      billedKES: number;
      paidKES: number;
      outstandingKES: number;
      activeMattersCount: number;
    }
  >();

  // Accumulate from matters
  actualMatters.forEach((m) => {
    const name = m.clientName || 'General Client';
    const cat = m.practiceArea || 'Commercial Law';
    const billed = m.billedKES || m.estimatedFeeKES || 0;
    const paid = m.paidKES || 0;
    const outstanding = Math.max(0, billed - paid);

    if (!clientRevenueMap.has(name)) {
      clientRevenueMap.set(name, {
        clientName: name,
        category: cat,
        billedKES: billed,
        paidKES: paid,
        outstandingKES: outstanding,
        activeMattersCount: 1,
      });
    } else {
      const rec = clientRevenueMap.get(name)!;
      rec.billedKES += billed;
      rec.paidKES += paid;
      rec.outstandingKES += outstanding;
      rec.activeMattersCount += 1;
    }
  });

  // Accumulate from fee notes
  actualFeeNotes.forEach((fn) => {
    const name = fn.clientName || 'General Client';
    const billed = fn.totalKES || 0;
    const paid = fn.amountPaidKES !== undefined ? fn.amountPaidKES : fn.status === 'Paid' ? billed : 0;
    const outstanding = fn.balanceKES !== undefined ? fn.balanceKES : Math.max(0, billed - paid);

    if (!clientRevenueMap.has(name)) {
      clientRevenueMap.set(name, {
        clientName: name,
        category: 'Corporate',
        billedKES: billed,
        paidKES: paid,
        outstandingKES: outstanding,
        activeMattersCount: 1,
      });
    } else {
      const rec = clientRevenueMap.get(name)!;
      if (!fn.matterId) {
        rec.billedKES += billed;
        rec.paidKES += paid;
        rec.outstandingKES += outstanding;
      }
    }
  });

  // Check registered clients with recorded totalBilledKES
  actualClients.forEach((cl) => {
    const name = cl.name;
    const billed = cl.totalBilledKES || 0;
    const cat = cl.industry || cl.type || 'Corporate';
    if (clientRevenueMap.has(name)) {
      const rec = clientRevenueMap.get(name)!;
      if (billed > rec.billedKES) {
        rec.billedKES = billed;
        rec.outstandingKES = Math.max(0, rec.billedKES - rec.paidKES);
      }
    } else if (billed > 0) {
      clientRevenueMap.set(name, {
        clientName: name,
        category: cat,
        billedKES: billed,
        paidKES: 0,
        outstandingKES: billed,
        activeMattersCount: cl.activeMattersCount || 1,
      });
    }
  });

  const realTopBillingClients = Array.from(clientRevenueMap.values())
    .filter((c) => c.billedKES > 0 || c.paidKES > 0)
    .sort((a, b) => b.billedKES - a.billedKES);

  const topClient = realTopBillingClients[0] || (actualClients.length > 0 ? {
    clientName: actualClients[0].name,
    category: actualClients[0].industry || 'Corporate',
    billedKES: actualClients[0].totalBilledKES || 0,
    paidKES: 0,
    outstandingKES: actualClients[0].totalBilledKES || 0,
    activeMattersCount: actualClients[0].activeMattersCount || 1,
  } : null);

  // Filter top clients if category is selected
  const filteredClients = clientCategoryFilter === 'All'
    ? realTopBillingClients
    : realTopBillingClients.filter((c) =>
        c.category.toLowerCase().includes(clientCategoryFilter.toLowerCase()) ||
        c.clientName.toLowerCase().includes(clientCategoryFilter.toLowerCase())
      );

  // Dynamic Monthly Revenue Trends from App Transactions
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, { month: string; billedKES: number; collectedKES: number }>();
  months.forEach((m) => monthlyMap.set(m, { month: m, billedKES: 0, collectedKES: 0 }));

  actualMatters.forEach((m) => {
    const dateStr = m.lodgedDate || m.createdDate;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const monthName = months[d.getMonth()];
        const entry = monthlyMap.get(monthName);
        if (entry) {
          entry.billedKES += m.billedKES || m.estimatedFeeKES || 0;
          entry.collectedKES += m.paidKES || 0;
        }
      }
    }
  });

  actualFeeNotes.forEach((fn) => {
    if (fn.dateIssued) {
      const d = new Date(fn.dateIssued);
      if (!isNaN(d.getTime())) {
        const monthName = months[d.getMonth()];
        const entry = monthlyMap.get(monthName);
        if (entry) {
          entry.billedKES += fn.totalKES || 0;
          entry.collectedKES += fn.amountPaidKES || (fn.status === 'Paid' ? fn.totalKES : 0);
        }
      }
    }
  });

  actualPayments.forEach((p) => {
    if (p.paymentDate) {
      const d = new Date(p.paymentDate);
      if (!isNaN(d.getTime())) {
        const monthName = months[d.getMonth()];
        const entry = monthlyMap.get(monthName);
        if (entry) {
          entry.collectedKES += p.amountKES || 0;
        }
      }
    }
  });

  const dynamicMonthlyRevenue = Array.from(monthlyMap.values());
  const hasMonthlyData = dynamicMonthlyRevenue.some((m) => m.billedKES > 0 || m.collectedKES > 0);

  // Dynamic Aging Buckets from App Transactions
  const dynamicAgingBuckets = [
    { category: '0-30 Days', amountKES: 0, count: 0, color: '#10b981' },
    { category: '31-60 Days', amountKES: 0, count: 0, color: '#0B63E5' },
    { category: '61-90 Days', amountKES: 0, count: 0, color: '#f59e0b' },
    { category: '90+ Days', amountKES: 0, count: 0, color: '#ef4444' },
  ];

  const now = Date.now();
  unpaidFeeNotes.forEach((fn) => {
    const issueDate = new Date(fn.dateIssued).getTime();
    const diffDays = Math.floor((now - (isNaN(issueDate) ? now : issueDate)) / (1000 * 60 * 60 * 24));
    const bal = fn.balanceKES !== undefined ? fn.balanceKES : fn.totalKES;
    if (diffDays <= 30) {
      dynamicAgingBuckets[0].amountKES += bal;
      dynamicAgingBuckets[0].count += 1;
    } else if (diffDays <= 60) {
      dynamicAgingBuckets[1].amountKES += bal;
      dynamicAgingBuckets[1].count += 1;
    } else if (diffDays <= 90) {
      dynamicAgingBuckets[2].amountKES += bal;
      dynamicAgingBuckets[2].count += 1;
    } else {
      dynamicAgingBuckets[3].amountKES += bal;
      dynamicAgingBuckets[3].count += 1;
    }
  });

  pendingMatters.forEach((m) => {
    const regDate = new Date(m.createdDate || m.lodgedDate || '').getTime();
    const diffDays = Math.floor((now - (isNaN(regDate) ? now : regDate)) / (1000 * 60 * 60 * 24));
    const bal = Math.max(0, (m.billedKES || m.estimatedFeeKES || 0) - (m.paidKES || 0));
    if (diffDays <= 30) {
      dynamicAgingBuckets[0].amountKES += bal;
      dynamicAgingBuckets[0].count += 1;
    } else if (diffDays <= 60) {
      dynamicAgingBuckets[1].amountKES += bal;
      dynamicAgingBuckets[1].count += 1;
    } else if (diffDays <= 90) {
      dynamicAgingBuckets[2].amountKES += bal;
      dynamicAgingBuckets[2].count += 1;
    } else {
      dynamicAgingBuckets[3].amountKES += bal;
      dynamicAgingBuckets[3].count += 1;
    }
  });

  const hasAgingData = dynamicAgingBuckets.some((b) => b.amountKES > 0);

  // Dynamic Actionable Pending Items
  const pendingActionItems = [
    ...unpaidFeeNotes.map((fn) => ({
      id: fn.id,
      number: fn.invoiceNumber,
      clientName: fn.clientName,
      title: fn.matterTitle || fn.subject || 'Fee Note Services',
      amountKES: fn.balanceKES !== undefined ? fn.balanceKES : fn.totalKES,
      status: fn.status || 'Unpaid',
      isInvoice: true,
    })),
    ...pendingMatters.map((m) => ({
      id: m.id,
      number: m.referenceNumber,
      clientName: m.clientName,
      title: m.title,
      amountKES: Math.max(0, (m.billedKES || m.estimatedFeeKES || 0) - (m.paidKES || 0)),
      status: 'Retainer Pending',
      isInvoice: false,
    })),
  ];

  // Dynamic Practice Area Revenue Distribution
  const practiceAreaMap = new Map<string, { revenueKES: number; activeMattersCount: number }>();
  actualMatters.forEach((m) => {
    const pa = m.practiceArea || 'General Practice';
    const rev = m.billedKES || m.estimatedFeeKES || 0;
    if (!practiceAreaMap.has(pa)) {
      practiceAreaMap.set(pa, { revenueKES: rev, activeMattersCount: 1 });
    } else {
      const existing = practiceAreaMap.get(pa)!;
      existing.revenueKES += rev;
      existing.activeMattersCount += 1;
    }
  });

  const totalPracticeRevenue = Array.from(practiceAreaMap.values()).reduce((sum, p) => sum + p.revenueKES, 0);

  const dynamicPracticeAreaRevenue = Array.from(practiceAreaMap.entries())
    .map(([practiceArea, data]) => ({
      practiceArea,
      revenueKES: data.revenueKES,
      activeMattersCount: data.activeMattersCount,
      percentage: totalPracticeRevenue > 0 ? Math.round((data.revenueKES / totalPracticeRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenueKES - a.revenueKES);

  const formatKES = (value: number) => {
    if (value >= 1000000) {
      return `KES ${(value / 1000000).toFixed(1)}M`;
    }
    return `KES ${value.toLocaleString()}`;
  };

  const formatFullKES = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-lg text-xs font-sans-body">
          <p className="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 font-medium text-stone-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-stone-900">
                {formatFullKES(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-lg bg-stone-900 px-4 py-3 text-xs text-white shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Filter Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-xl border border-[#e2dfd5] shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-md bg-[#0B63E5]/10 px-2.5 py-0.5 text-xs font-bold text-[#0B63E5]">
              <TrendingUp className="mr-1 h-3.5 w-3.5" /> Financial Insights
            </span>
            <span className="text-xs text-stone-400">• Real-Time Ledger</span>
          </div>
          <h2 className="font-serif-title text-xl font-bold text-[#1a1d20] mt-1">
            Revenue Trends, Outstanding Invoices & Top Client Analytics
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Executive ledger analysis, billings vs. cash collections, and realization rates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center space-x-1 rounded-md border border-stone-200 bg-stone-50 p-1">
            <button
              onClick={() => setSelectedPeriod('FY2026')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                selectedPeriod === 'FY2026'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              FY 2026 (YTD)
            </button>
            <button
              onClick={() => setSelectedPeriod('Q3_2026')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                selectedPeriod === 'Q3_2026'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Q3 2026
            </button>
            <button
              onClick={() => setSelectedPeriod('Q2_2026')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                selectedPeriod === 'Q2_2026'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Q2 2026
            </button>
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => showToast('Financial Insights report exported to PDF & Excel format.')}
            className="flex items-center space-x-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-stone-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold tracking-wider">Total Billed YTD</span>
            <div className="rounded-lg bg-stone-100 p-2 text-stone-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-stone-900">
            {formatKES(totalBilledVal)}
          </p>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-stone-500">
            <span>
              {actualFeeNotes.length > 0 && (
                <>
                  {actualFeeNotes.length} fee note{actualFeeNotes.length === 1 ? '' : 's'} issued
                  {mattersWithFee.length > 0 ? ' • ' : ''}
                </>
              )}
              {mattersWithFee.length > 0 && (
                <>{mattersWithFee.length} matter retainers billed</>
              )}
              {actualFeeNotes.length === 0 && mattersWithFee.length === 0 && (
                <>0 fee notes issued</>
              )}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold tracking-wider">Cash Collected</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-emerald-800">
            {formatKES(totalPaidVal)}
          </p>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-stone-600">
            <span className="text-emerald-700 font-bold">
              {totalBilledVal > 0 ? `${((totalPaidVal / totalBilledVal) * 100).toFixed(1)}% Realization` : '0% Realization'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold tracking-wider">Outstanding Receivables</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#0B63E5]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-[#0B63E5]">
            {formatKES(totalOutstandingVal)}
          </p>
          <div className="mt-2 flex items-center text-[11px] text-amber-800 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600 shrink-0" />
            <span>
              {pendingInvoicesCount > 0 && (
                <>
                  {pendingInvoicesCount} invoice{pendingInvoicesCount === 1 ? '' : 's'}
                  {pendingMattersCount > 0 ? ' + ' : ''}
                </>
              )}
              {pendingMattersCount > 0 && (
                <>{pendingMattersCount} matter retainers pending</>
              )}
              {pendingInvoicesCount === 0 && pendingMattersCount === 0 && (
                <>0 invoices pending</>
              )}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold tracking-wider">Top Client Revenue</span>
            <div className="rounded-lg bg-stone-100 p-2 text-stone-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-stone-900">
            {topClient && topClient.billedKES > 0 ? formatKES(topClient.billedKES) : 'KES 0'}
          </p>
          <div className="mt-2 flex items-center text-[11px] text-stone-600">
            <span className="font-semibold text-stone-800 truncate" title={topClient ? topClient.clientName : undefined}>
              {topClient && (topClient.billedKES > 0 || topClient.activeMattersCount > 0)
                ? `${topClient.clientName}${topClient.activeMattersCount > 0 ? ` (${topClient.activeMattersCount} matter${topClient.activeMattersCount === 1 ? '' : 's'})` : ''}`
                : 'No client transactions logged'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e2dfd5] pb-3 gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveChartTab('monthly')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeChartTab === 'monthly'
                ? 'bg-[#1a1d20] text-white shadow-2xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Monthly Revenue Trends
          </button>
          <button
            onClick={() => setActiveChartTab('aging')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeChartTab === 'aging'
                ? 'bg-[#1a1d20] text-white shadow-2xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Outstanding Invoices Aging
          </button>
          <button
            onClick={() => setActiveChartTab('clients')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeChartTab === 'clients'
                ? 'bg-[#1a1d20] text-white shadow-2xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Top-Billing Clients
          </button>
        </div>

        <div className="text-xs text-stone-500 flex items-center gap-2">
          <span>Chart View Mode:</span>
          <span className="font-bold text-stone-800">Comparative Bar Chart</span>
        </div>
      </div>

      {/* CHART 1: Monthly Revenue Trends Bar Chart */}
      {activeChartTab === 'monthly' && (
        <div className="rounded-xl border border-[#e2dfd5] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif-title font-bold text-stone-900 text-base">
                2026 Monthly Revenue & Cash Collection Trends
              </h3>
              <p className="text-xs text-stone-500">
                Comparison of total invoiced fee notes (Billed) vs. actual RTGS/M-Pesa cash received (Collected)
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#0B63E5]" />
                <span className="text-stone-700 font-medium">Billed Revenue (KES)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#10b981]" />
                <span className="text-stone-700 font-medium">Collected Cash (KES)</span>
              </div>
            </div>
          </div>

          {!hasMonthlyData ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
              <TrendingUp className="mx-auto h-8 w-8 text-stone-400 mb-2" />
              <p className="text-sm font-semibold text-stone-700">No monthly revenue data logged yet</p>
              <p className="text-xs text-stone-500 mt-1">Monthly metrics will populate as invoices and receipts are generated.</p>
            </div>
          ) : (
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dynamicMonthlyRevenue}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dfd5" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#e2dfd5' }}
                    tick={{ fill: '#57534e', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#78716c', fontSize: 10 }}
                    tickFormatter={(val) => `KES ${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="billedKES"
                    name="Billed Fee Notes"
                    fill="#0B63E5"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="collectedKES"
                    name="Cash Collected"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* CHART 2: Outstanding Invoices Aging Breakdown Bar Chart */}
      {activeChartTab === 'aging' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-[#e2dfd5] bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-serif-title font-bold text-stone-900 text-base">
                Outstanding Receivables Aging Analysis
              </h3>
              <p className="text-xs text-stone-500">
                Distribution of unpaid invoices by aging bracket
              </p>
            </div>

            {!hasAgingData ? (
              <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
                <Clock className="mx-auto h-8 w-8 text-stone-400 mb-2" />
                <p className="text-sm font-semibold text-stone-700">No overdue receivables recorded</p>
                <p className="text-xs text-stone-500 mt-1">All invoices are settled or none are currently outstanding.</p>
              </div>
            ) : (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dynamicAgingBuckets}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dfd5" />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={{ stroke: '#e2dfd5' }}
                      tick={{ fill: '#57534e', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#78716c', fontSize: 10 }}
                      tickFormatter={(val) => `KES ${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amountKES" name="Outstanding Amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {dynamicAgingBuckets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Actionable Overdue Invoices List */}
          <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-serif-title font-bold text-stone-900 text-sm">
                  Pending Billing Actions
                </h4>
                <p className="text-[11px] text-stone-500">Requires finance collection follow-up</p>
              </div>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {pendingActionItems.length} Pending
              </span>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {pendingActionItems.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  No invoices or matter retainers pending action.
                </div>
              ) : (
                pendingActionItems.slice(0, 15).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-stone-200 bg-stone-50/60 p-3 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#0B63E5]">
                          {item.number}
                        </span>
                        <h5 className="font-bold text-stone-900 text-xs mt-0.5">{item.clientName}</h5>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          item.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Pending' || item.status === 'Retainer Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 mt-1 line-clamp-1">{item.title}</p>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Total Due:</span>
                        <span className="font-mono font-bold text-stone-900">
                          KES {item.amountKES.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => showToast(`Payment reminder dispatch sent to ${item.clientName}`)}
                        className="flex items-center space-x-1 rounded bg-[#0B63E5]/10 px-2 py-1 text-[11px] font-semibold text-[#0B63E5] hover:bg-[#0B63E5]/20 cursor-pointer transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        <span>Remind</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHART 3: Top-Billing Clients Matrix Bar Chart */}
      {activeChartTab === 'clients' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#e2dfd5] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-title font-bold text-stone-900 text-base">
                  Top-Billing Clients Breakdown (2026 YTD)
                </h3>
                <p className="text-xs text-stone-500">
                  Key corporate and institutional clients ranked by total fees billed (KES)
                </p>
              </div>

              {/* Client Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-stone-500 font-medium">Filter Category:</span>
                <select
                  value={clientCategoryFilter}
                  onChange={(e) => setClientCategoryFilter(e.target.value)}
                  className="rounded-md border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0B63E5]"
                >
                  <option value="All">All Client Industries</option>
                  <option value="Corporate">Corporate & Telco</option>
                  <option value="Financial">Financial Services & Banking</option>
                  <option value="Real Estate">Real Estate & Construction</option>
                  <option value="Aviation">Aviation & Logistics</option>
                </select>
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
                <Building2 className="mx-auto h-8 w-8 text-stone-400 mb-2" />
                <p className="text-sm font-semibold text-stone-700">No client billing analytics recorded</p>
                <p className="text-xs text-stone-500 mt-1">Client ledger insights will appear as clients and matters are billed.</p>
              </div>
            ) : (
              <div className="h-84 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredClients}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2dfd5" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={{ stroke: '#e2dfd5' }}
                      tick={{ fill: '#57534e', fontSize: 10 }}
                      tickFormatter={(val) => `KES ${(val / 1000000).toFixed(0)}M`}
                    />
                    <YAxis
                      type="category"
                      dataKey="clientName"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#1a1d20', fontSize: 11, fontWeight: 700 }}
                      width={130}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => <span className="text-stone-700 font-semibold">{value}</span>}
                    />
                    <Bar
                      dataKey="billedKES"
                      name="Total Billed Fees"
                      fill="#1a1d20"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="paidKES"
                      name="Settled Cash (Paid)"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="outstandingKES"
                      name="Outstanding Balance"
                      fill="#0B63E5"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Practice Area Distribution Grid */}
      <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-serif-title font-bold text-stone-900 text-sm">
              Practice Area Revenue Contribution Matrix
            </h3>
            <p className="text-[11px] text-stone-500">Revenue split across firm practice departments</p>
          </div>
          <span className="text-xs font-semibold text-stone-600">{dynamicPracticeAreaRevenue.length} Practice Areas</span>
        </div>

        {dynamicPracticeAreaRevenue.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center bg-stone-50/50">
            <p className="text-xs text-stone-500">No practice area revenue records available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dynamicPracticeAreaRevenue.map((pa) => (
              <div key={pa.practiceArea} className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900">{pa.practiceArea}</span>
                  <span className="rounded-md bg-[#1a1d20] px-2 py-0.5 text-[10px] font-bold text-white">
                    {pa.percentage}%
                  </span>
                </div>

                <p className="font-mono text-lg font-bold text-[#0B63E5]">
                  KES {pa.revenueKES.toLocaleString()}
                </p>

                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0B63E5] h-full rounded-full"
                    style={{ width: `${pa.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-stone-500 pt-1">
                  <span>{pa.activeMattersCount} Active Matters</span>
                  <span>
                    Avg KES {pa.activeMattersCount > 0 ? (pa.revenueKES / pa.activeMattersCount / 1000000).toFixed(1) : 0}M / matter
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
