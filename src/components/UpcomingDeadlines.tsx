import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Gavel,
  Users,
  CalendarDays,
  Plus,
  ArrowRight,
  MapPin,
  User,
  ChevronDown,
} from 'lucide-react';
import { DeadlineItem, DeadlineCategory, Advocate } from '../types';

interface UpcomingDeadlinesProps {
  deadlines: DeadlineItem[];
  onToggleComplete: (id: string) => void;
  onOpenNewDeadlineModal: () => void;
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  deadlines,
  onToggleComplete,
  onOpenNewDeadlineModal,
  currentAdvocate,
  isManagingAdvocate = true,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('All');

  const categories = [
    'All',
    'Court Filing',
    'Court Hearing',
    'Client Meeting',
    'Document Review',
  ];

  // Role-based filtering
  const scopedDeadlines = isManagingAdvocate
    ? deadlines
    : deadlines.filter((d) =>
        currentAdvocate?.name
          ? d.advocateName
              .toLowerCase()
              .includes(currentAdvocate.name.toLowerCase())
          : true
      );

  const filteredDeadlines = scopedDeadlines.filter((d) => {
    const matchesCategory = filter === 'All' || d.category === filter;
    const matchesStaff =
      !isManagingAdvocate ||
      selectedStaffFilter === 'All' ||
      d.advocateName
        .toLowerCase()
        .includes(selectedStaffFilter.toLowerCase());
    return matchesCategory && matchesStaff;
  });

  const parseDateDisplay = (dateStr: string) => {
    if (!dateStr) return { month: 'AUG', day: '28', formattedDate: '2026-08-28' };

    // ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const parts = dateStr.trim().split('-');
      const monthNum = parseInt(parts[1], 10) - 1;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return {
        month: months[monthNum] || 'AUG',
        day: parts[2],
        formattedDate: dateStr,
      };
    }

    if (dateStr.includes('Today')) return { month: 'AUG', day: '27', formattedDate: '2026-08-27' };
    if (dateStr.includes('Tomorrow')) return { month: 'AUG', day: '28', formattedDate: '2026-08-28' };

    const parts = dateStr.replace(/[()]/g, '').split(' ');
    if (parts.length >= 2) {
      return {
        month: parts[1].substring(0, 3).toUpperCase(),
        day: parts[0].padStart(2, '0'),
        formattedDate: dateStr,
      };
    }

    return { month: 'AUG', day: '28', formattedDate: dateStr };
  };

  const pendingCount = filteredDeadlines.filter((d) => !d.completed).length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Upcoming deadlines
            </h3>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Next seven days</p>
        </div>

        <button
          type="button"
          onClick={onOpenNewDeadlineModal}
          className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              filter === cat
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Deadlines List */}
      <div className="mt-4 space-y-3">
        {filteredDeadlines.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No upcoming deadlines found for this filter.
          </div>
        ) : (
          filteredDeadlines.slice(0, 5).map((item) => {
            const dateObj = parseDateDisplay(item.dueDate);

            return (
              <div
                key={item.id}
                className={`group flex items-start gap-3.5 rounded-xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50/50 ${
                  item.completed ? 'opacity-60 bg-slate-50' : 'bg-white'
                }`}
              >
                {/* Date Badge: Black Box with Amber Month */}
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs">
                  <span className="text-[10px] font-bold tracking-wider text-amber-400 leading-none">
                    {dateObj.month}
                  </span>
                  <span className="font-heading text-lg font-bold leading-tight mt-0.5">
                    {dateObj.day}
                  </span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-bold text-slate-900 leading-snug truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                      {item.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggleComplete(item.id)}
                      className="text-slate-300 hover:text-emerald-600 transition shrink-0 cursor-pointer"
                      title={item.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.matterTitle} · {item.time || '09:00 AM'}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item.category}
                    </span>
                    {item.courtLocation && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {item.courtLocation}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};



