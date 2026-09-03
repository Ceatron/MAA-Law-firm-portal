import React from 'react';
import {
  Briefcase,
  Clock,
  Users,
  CircleDollarSign,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { Advocate, LegalMatter, DeadlineItem, Client, FeeNote } from '../types';

interface MetricCardsProps {
  onNavigateTab: (tab: string) => void;
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  canAccessBilling?: boolean;
  matters?: LegalMatter[];
  deadlines?: DeadlineItem[];
  clients?: Client[];
  feeNotes?: FeeNote[];
  onOpenNewMatter?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  onNavigateTab,
  currentAdvocate,
  isManagingAdvocate = true,
  canAccessBilling = true,
  matters = [],
  deadlines = [],
  clients = [],
  feeNotes = [],
}) => {
  // Scoped matters based on role
  const userMatters = isManagingAdvocate
    ? matters.filter((m) => m.status !== 'Archived')
    : matters.filter(
        (m) =>
          m.status !== 'Archived' &&
          (m.responsibleAdvocateId === currentAdvocate?.id ||
            (currentAdvocate?.name &&
              m.responsibleAdvocateName
                .toLowerCase()
                .includes(currentAdvocate.name.toLowerCase())))
      );

  // Scoped deadlines
  const userDeadlines = isManagingAdvocate
    ? deadlines.filter((d) => !d.completed)
    : deadlines.filter(
        (d) =>
          !d.completed &&
          (currentAdvocate?.name &&
            d.advocateName
              .toLowerCase()
              .includes(currentAdvocate.name.toLowerCase()))
      );

  // Financial estimation & Total Receivables calculations
  const unpaidFeeNotes = (feeNotes || []).filter(
    (fn) => fn.status !== 'Paid' || (fn.balanceKES !== undefined && fn.balanceKES > 0)
  );
  const totalUnpaidInvoicesCount = unpaidFeeNotes.length;

  const mattersReceivablesKES = userMatters.reduce(
    (acc, m) => acc + Math.max(0, (m.billedKES || m.estimatedFeeKES || 0) - (m.paidKES || 0)),
    0
  );
  const feeNotesReceivablesKES = unpaidFeeNotes.reduce(
    (acc, fn) => acc + (fn.balanceKES !== undefined ? fn.balanceKES : (fn.status === 'Paid' ? 0 : fn.totalKES)),
    0
  );
  const totalReceivablesKES = mattersReceivablesKES + feeNotesReceivablesKES;

  const formatCurrencyM = (amount: number) => {
    if (!amount || amount <= 0) {
      return 'KES 0';
    }
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}m`;
    }
    if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(0)}k`;
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const highPriorityMattersCount = userMatters.filter((m) => m.priority === 'High').length;
  const dueTodayDeadlinesCount = userDeadlines.filter((d) => d.dueDate?.toLowerCase().includes('today') || false).length;

  const kpis = [
    {
      id: 'active-matters',
      title: 'Active matters',
      value: userMatters.length,
      subtext: `${highPriorityMattersCount} updated this week`,
      icon: Briefcase,
      iconBg: 'bg-blue-50 text-blue-700',
      dotColor: 'bg-blue-500',
      tab: 'Matters',
    },
    {
      id: 'open-tasks',
      title: 'Open tasks',
      value: userDeadlines.length,
      subtext: `${dueTodayDeadlinesCount} due today`,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-700',
      dotColor: 'bg-amber-500',
      tab: 'Tasks',
    },
    {
      id: 'active-clients',
      title: 'Active clients',
      value: clients.length,
      subtext: `${clients.length} new this month`,
      icon: Users,
      iconBg: 'bg-violet-50 text-violet-700',
      dotColor: 'bg-violet-500',
      tab: 'Clients',
    },
    {
      id: 'total-receivables',
      title: canAccessBilling ? 'Total Receivables' : 'Legal documents',
      value: canAccessBilling ? formatCurrencyM(totalReceivablesKES) : `${userMatters.length * 3}`,
      subtext: canAccessBilling ? `Total Unpaid Invoices: ${totalUnpaidInvoicesCount}` : 'Active CTS pleadings',
      icon: Receipt,
      iconBg: 'bg-emerald-50 text-emerald-700',
      dotColor: 'bg-emerald-500',
      tab: canAccessBilling ? 'Billing' : 'Documents',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <button
            key={kpi.id}
            type="button"
            onClick={() => onNavigateTab(kpi.tab)}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{kpi.title}</p>
                <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-900">
                  {kpi.value}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${kpi.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${kpi.dotColor || 'bg-emerald-500'}`} />
              <span>{kpi.subtext}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

