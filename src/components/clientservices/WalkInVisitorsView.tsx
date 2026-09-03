import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import {
  ClientInteraction,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface WalkInVisitorsViewProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (initialType: 'Walk-in Visitor') => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onCheckOutVisitor: (interaction: ClientInteraction) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const WalkInVisitorsView: React.FC<WalkInVisitorsViewProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onCheckOutVisitor,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const visitors = interactions.filter(
    (i) => i.interactionType === 'Walk-in Visitor' || i.channel === 'In-Person / Reception'
  );

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      searchTerm === '' ||
      v.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.visitorPassNumber && v.visitorPassNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.hostAdvocateName && v.hostAdvocateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'In Chambers' && !['Resolved', 'Closed'].includes(v.status)) ||
      (statusFilter === 'Checked Out' && ['Resolved', 'Closed'].includes(v.status));

    return matchesSearch && matchesStatus;
  });

  const activeInChambers = visitors.filter((v) => !['Resolved', 'Closed'].includes(v.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span>Chambers Reception & Walk-in Visitors Log</span>
          </h2>
          <p className="text-xs text-stone-500">
            Real-time front desk visitor badging, host advocate notifications, security sign-in and check-out
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewModal('Walk-in Visitor')}
          className="flex items-center space-x-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Check-in New Visitor</span>
        </button>
      </div>

      {/* Active In-Chambers Summary Banner */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base">
            {activeInChambers.length}
          </div>
          <div>
            <h3 className="font-bold text-purple-950 text-xs tracking-wider">
              Visitors Currently in Chambers
            </h3>
            <p className="text-[11px] text-purple-800">
              Active badges issued at reception awaiting advocate clearance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-purple-900 font-medium">
          <ShieldCheck className="h-4 w-4 text-purple-600" />
          <span>Security access control logged at Milimani Westlands HQ</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by visitor name, pass number, host advocate..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Visitors</option>
              <option value="In Chambers">Currently in Chambers (Active)</option>
              <option value="Checked Out">Checked Out / Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Pass # & Ref</th>
                <th className="px-4 py-3">Visitor Name & ID</th>
                <th className="px-4 py-3">Purpose of Visit</th>
                <th className="px-4 py-3">Host Advocate / Officer</th>
                <th className="px-4 py-3">Check-in Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredVisitors.length > 0 ? (
                filteredVisitors.map((vis) => (
                  <tr
                    key={vis.id}
                    onClick={() => onSelectInteraction(vis)}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-xs block">
                        {vis.visitorPassNumber || vis.id}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">{vis.id}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <strong className="text-stone-900 block font-semibold text-xs">{vis.clientName}</strong>
                      {vis.visitorIdNumber && (
                        <span className="text-[10px] text-stone-500 font-mono block">{vis.visitorIdNumber}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <strong className="text-stone-900 block line-clamp-1">{vis.subject}</strong>
                      <span className="text-[11px] text-stone-500 line-clamp-1">{vis.description}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <strong className="text-stone-900 block font-medium">
                        {vis.hostAdvocateName || vis.assignedStaffName || 'General Reception'}
                      </strong>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-stone-700">
                      <span>
                        {vis.checkInTime || vis.time} ({vis.date})
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          vis.status === 'Resolved' || vis.status === 'Closed'
                            ? 'bg-stone-100 text-stone-700'
                            : 'bg-purple-100 text-purple-900 animate-pulse'
                        }`}
                      >
                        {vis.status === 'Resolved' || vis.status === 'Closed' ? 'Checked Out' : 'In Chambers'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {!['Resolved', 'Closed'].includes(vis.status) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCheckOutVisitor(vis);
                          }}
                          className="flex items-center space-x-1 rounded-lg bg-stone-800 hover:bg-stone-900 text-white px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ml-auto"
                        >
                          <LogOut className="h-3 w-3" />
                          <span>Check Out</span>
                        </button>
                      ) : (
                        <span className="text-stone-400 text-xs">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Building2 className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-semibold text-stone-600">No visitor records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
