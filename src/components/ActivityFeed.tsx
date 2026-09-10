import React, { useState } from 'react';
import {
  Activity,
  FileText,
  Banknote,
  RotateCcw,
  UserCheck,
  Scale,
  Calendar,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { ActivityLog } from '../types';
import { formatActivityDateTime } from '../utils/activityDateFormatter';

interface ActivityFeedProps {
  activities: ActivityLog[];
  onOpenActivityDetail?: (activity: ActivityLog) => void;
  onViewFullPage?: () => void;
  defaultCollapsed?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  onOpenActivityDetail,
  onViewFullPage,
  defaultCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [filter, setFilter] = useState<string>('All');

  // Filter out any mock/test item containing 735 or MAA/CIV/2026/735
  const sanitizedActivities = activities.filter(
    (act) =>
      act &&
      act.matterRef !== 'MAA/CIV/2026/735' &&
      !act.matterRef?.includes('735') &&
      !act.description?.includes('735') &&
      !act.title?.includes('735')
  );

  const filteredActivities = sanitizedActivities.filter((act) => {
    if (filter === 'All') return true;
    if (filter === 'Documents' && act.type === 'Document') return true;
    if (filter === 'Financials' && act.type === 'Billing') return true;
    if (filter === 'Status' && act.type === 'Status Change') return true;
    if (filter === 'Court' && act.type === 'Court Event') return true;
    return true;
  });

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'Document':
        return <FileText className="h-3.5 w-3.5 text-[#0070ba]" />;
      case 'Billing':
        return <Banknote className="h-3.5 w-3.5 text-[#1b6338]" />;
      case 'Status Change':
        return <RotateCcw className="h-3.5 w-3.5 text-[#e9572b]" />;
      case 'Court Event':
        return <Scale className="h-3.5 w-3.5 text-[#0070ba]" />;
      case 'Team Action':
        return <UserCheck className="h-3.5 w-3.5 text-[#5c6f84]" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-[#5c6f84]" />;
    }
  };

  // When collapsed, display up to 2 items in compact mode
  const displayedActivities = isCollapsed
    ? filteredActivities.slice(0, 2)
    : filteredActivities;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs transition-all">
      {/* Header with Collapsible Toggle and Full Page Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Audit Trail & Activity Log
            </h2>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Real-time e-filing logs, fee note payments, pleadings & status changes
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewFullPage && (
            <button
              type="button"
              onClick={onViewFullPage}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              title="Open full-page dedicated audit trail"
            >
              <span>Full Page</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
            aria-expanded={!isCollapsed}
          >
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs (only shown when expanded) */}
      {!isCollapsed && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {['All', 'Court', 'Documents', 'Financials', 'Status'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No activity logs recorded yet.
        </div>
      ) : (
        <div className="mt-3 relative space-y-3 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {displayedActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => onOpenActivityDetail?.(act)}
              className="relative flex items-start space-x-3 pl-0.5"
            >
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs">
                {getActivityIcon(act.type)}
              </div>

              <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs transition-colors hover:border-slate-300 hover:bg-white cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="font-semibold text-slate-900">{act.title}</span>
                  {(() => {
                    const dt = formatActivityDateTime(act.timestamp);
                    return (
                      <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{dt.date}</span>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{dt.time}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <p className="mt-1 text-slate-600 leading-relaxed text-xs">
                  {act.description}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                  <span className="flex items-center space-x-1 font-medium text-slate-700">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>{act.user}</span>
                  </span>
                  {act.matterRef && (
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded text-slate-800 border border-slate-200 font-bold">
                      {act.matterRef}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed Footer Banner with Action */}
      {isCollapsed && filteredActivities.length > 2 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Showing 2 of {filteredActivities.length} logs (collapsed)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="text-xs font-semibold text-slate-800 hover:text-slate-950 transition cursor-pointer"
            >
              Expand All ({filteredActivities.length})
            </button>
            {onViewFullPage && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={onViewFullPage}
                  className="text-xs font-semibold text-[#0070ba] hover:underline cursor-pointer"
                >
                  Open Full Page →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!isCollapsed && filteredActivities.length > 2 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            ▲ Collapse trail
          </button>
          {onViewFullPage && (
            <button
              type="button"
              onClick={onViewFullPage}
              className="text-xs font-semibold text-[#0070ba] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Open Full Page</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
