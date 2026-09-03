import React, { useState } from 'react';
import {
  Activity,
  FileText,
  Banknote,
  RotateCcw,
  UserCheck,
  Scale,
  Clock,
  User,
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityFeedProps {
  activities: ActivityLog[];
  onOpenActivityDetail?: (activity: ActivityLog) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  onOpenActivityDetail,
}) => {
  const [filter, setFilter] = useState<string>('All');

  const filteredActivities = activities.filter((act) => {
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

  return (
    <div className="rounded-lg border border-[#e2e7eb] bg-white p-4.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#e2e7eb] pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#1c2d3d]">
              Audit Trail & Activity Log
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[#5c6f84]">
            Real-time e-filing logs, fee note payments, pleadings & status changes
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-3 flex flex-wrap gap-1.5 border-b border-[#e2e7eb]/60 pb-3">
        {['All', 'Court', 'Documents', 'Financials', 'Status'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              filter === tab
                ? 'bg-[#132c3f] text-white font-semibold shadow-xs'
                : 'bg-[#e8edf1] text-[#283a4a] hover:bg-[#dde4ea]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8c9ba8]">
          No activity logs recorded yet.
        </div>
      ) : (
        <div className="mt-3.5 relative space-y-3 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e7eb]">
          {filteredActivities.map((act) => (
            <div key={act.id} className="relative flex items-start space-x-3 pl-0.5">
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e2e7eb] bg-white shadow-xs">
                {getActivityIcon(act.type)}
              </div>

              <div className="flex-1 rounded-md border border-[#e2e7eb] bg-[#f8fafc] p-3 text-xs transition-colors hover:border-[#0070ba] hover:bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1c2d3d]">{act.title}</span>
                  <span className="text-[10px] text-[#8c9ba8] font-mono flex items-center space-x-1">
                    <Clock className="h-3 w-3 inline" />
                    <span>{act.timestamp}</span>
                  </span>
                </div>

                <p className="mt-1 text-[#5c6f84] leading-relaxed text-xs">
                  {act.description}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-[#5c6f84] pt-1.5 border-t border-[#e2e7eb]/60">
                  <span className="flex items-center space-x-1 font-medium text-[#0070ba]">
                    <User className="h-3 w-3 text-[#8c9ba8]" />
                    <span>{act.user}</span>
                  </span>
                  {act.matterRef && (
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded text-[#1c2d3d] border border-[#d1d7dc] font-bold">
                      {act.matterRef}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

