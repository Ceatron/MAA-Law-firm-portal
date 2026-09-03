import React, { useState } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneForwarded,
  Plus,
  Search,
  Filter,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import {
  ClientInteraction,
  InteractionDirection,
  InteractionPriority,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface CallsViewProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (initialType: 'Call', direction?: InteractionDirection) => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onToggleCallbackReturned: (interaction: ClientInteraction) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const CallsView: React.FC<CallsViewProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onToggleCallbackReturned,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter only Call interactions
  const allCalls = interactions.filter((i) => i.interactionType === 'Call');

  const filteredCalls = allCalls.filter((c) => {
    const matchesSearch =
      searchTerm === '' ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phoneNumber && c.phoneNumber.includes(searchTerm)) ||
      (c.matterRef && c.matterRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDirection =
      directionFilter === 'all' ||
      (directionFilter === 'Incoming' && c.direction === 'Incoming') ||
      (directionFilter === 'Outgoing' && c.direction === 'Outgoing') ||
      (directionFilter === 'Missed' && (c.subtype?.toLowerCase().includes('missed') || c.direction === 'Missed Call' as any)) ||
      (directionFilter === 'Callback' && (c.subtype?.toLowerCase().includes('callback') || c.followUpRequired));

    const matchesStaff =
      staffFilter === 'all' ||
      c.handledById === staffFilter ||
      c.assignedStaffId === staffFilter ||
      c.handledByName.toLowerCase().includes(staffFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Open' && !['Resolved', 'Closed'].includes(c.status)) ||
      (statusFilter === 'Resolved' && ['Resolved', 'Closed'].includes(c.status));

    return matchesSearch && matchesDirection && matchesStaff && matchesStatus;
  });

  // KPI counters
  const incomingCount = allCalls.filter((c) => c.direction === 'Incoming').length;
  const outgoingCount = allCalls.filter((c) => c.direction === 'Outgoing').length;
  const missedCount = allCalls.filter((c) => c.subtype?.toLowerCase().includes('missed')).length;
  const callbacksQueue = allCalls.filter(
    (c) =>
      (c.subtype?.toLowerCase().includes('callback') || c.followUpRequired) &&
      c.followUpStatus !== 'Completed' &&
      !['Resolved', 'Closed'].includes(c.status)
  );

  return (
    <div className="space-y-6">
      {/* Header & Quick Call Logging Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <Phone className="h-5 w-5 text-[#0B63E5]" />
            <span>Chambers Telephone & Call Management</span>
          </h2>
          <p className="text-xs text-stone-500">
            Log incoming inquiries, outgoing client advisories, missed calls, and callback requests
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenNewModal('Call', 'Incoming')}
            className="flex items-center space-x-1.5 rounded-xl bg-[#0B63E5] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0256D0] transition-all cursor-pointer"
          >
            <PhoneIncoming className="h-4 w-4" />
            <span>Log Incoming Call</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewModal('Call', 'Outgoing')}
            className="flex items-center space-x-1.5 rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-900 transition-all cursor-pointer"
          >
            <PhoneOutgoing className="h-4 w-4" />
            <span>Log Outgoing Call</span>
          </button>
        </div>
      </div>

      {/* Callback Queue Notice if any pending */}
      {callbacksQueue.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 animate-bounce" />
              <h3 className="font-bold text-amber-900 text-xs tracking-wider">
                Pending Callback Requests Queue ({callbacksQueue.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-semibold">Immediate telephone follow-up required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {callbacksQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-amber-800">{item.id}</span>
                    <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 font-semibold">
                      {item.followUpDueDate || 'Due Today'}
                    </span>
                  </div>
                  <strong className="text-xs font-bold text-stone-900 block mt-1 line-clamp-1">
                    {item.clientName}
                  </strong>
                  <p className="text-[11px] text-stone-600 font-mono mt-0.5">{item.phoneNumber || 'No phone recorded'}</p>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 italic">
                    "{item.actionRequired || item.subject}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400">
                    To: {item.followUpAssignedToName || item.assignedStaffName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleCallbackReturned(item)}
                    className="flex items-center space-x-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Mark Returned</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setDirectionFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            directionFilter === 'all'
              ? 'border-[#0B63E5] bg-blue-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <span className="text-[10px] font-bold text-stone-500">Total Calls Logged</span>
          <p className="text-xl font-bold font-serif-title text-stone-900 mt-1">{allCalls.length}</p>
        </div>

        <div
          onClick={() => setDirectionFilter('Incoming')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            directionFilter === 'Incoming'
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500">Incoming Calls</span>
            <PhoneIncoming className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-serif-title text-emerald-700 mt-1">{incomingCount}</p>
        </div>

        <div
          onClick={() => setDirectionFilter('Outgoing')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            directionFilter === 'Outgoing'
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500">Outgoing Calls</span>
            <PhoneOutgoing className="h-4 w-4 text-[#0B63E5]" />
          </div>
          <p className="text-xl font-bold font-serif-title text-[#0B63E5] mt-1">{outgoingCount}</p>
        </div>

        <div
          onClick={() => setDirectionFilter('Callback')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            directionFilter === 'Callback'
              ? 'border-amber-500 bg-amber-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500">Pending Callbacks</span>
            <PhoneForwarded className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-serif-title text-amber-700 mt-1">{callbacksQueue.length}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client, telephone, matter..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          {/* Direction Filter */}
          <div>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Call Types & Directions</option>
              <option value="Incoming">Incoming Calls Only</option>
              <option value="Outgoing">Outgoing Calls Only</option>
              <option value="Callback">Callbacks & Follow-ups Only</option>
            </select>
          </div>

          {/* Staff Filter */}
          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Handled Staff</option>
              {advocates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open / Pending Action</option>
              <option value="Resolved">Resolved / Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calls Master Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Call Ref & Direction</th>
                <th className="px-4 py-3">Client / Caller</th>
                <th className="px-4 py-3">Discussion Subject & Notes</th>
                <th className="px-4 py-3">Related Matter</th>
                <th className="px-4 py-3">Handled By</th>
                <th className="px-4 py-3">Duration & Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCalls.length > 0 ? (
                filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => onSelectInteraction(call)}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {call.direction === 'Incoming' ? (
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <PhoneIncoming className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#0B63E5] flex items-center justify-center">
                            <PhoneOutgoing className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="font-mono font-bold text-[#0B63E5] block text-[11px]">{call.id}</span>
                          <span className="text-[10px] text-stone-400 font-semibold">
                            {call.subtype || call.direction}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <strong className="text-stone-900 block font-semibold text-xs">{call.clientName}</strong>
                      {call.phoneNumber && (
                        <span className="font-mono text-[10px] text-stone-500 block">{call.phoneNumber}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <strong className="text-stone-900 block line-clamp-1">{call.subject}</strong>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{call.description}</p>
                      {call.actionRequired && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded px-1.5 py-0.2">
                          Action: {call.actionRequired}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {call.matterRef ? (
                        <div>
                          <span className="font-mono font-semibold text-[#0B63E5] text-[10px] block">
                            {call.matterRef}
                          </span>
                          <span className="text-[11px] text-stone-600 line-clamp-1">{call.matterTitle}</span>
                        </div>
                      ) : (
                        <span className="italic text-stone-400 text-[11px]">General Call</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <strong className="text-stone-900 block font-medium">{call.handledByName}</strong>
                      {call.assignedStaffName !== call.handledByName && (
                        <span className="text-[10px] text-stone-400">Assigned: {call.assignedStaffName}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1 font-mono text-stone-700 text-[11px]">
                        <Clock className="h-3 w-3 text-stone-400" />
                        <span>{call.durationMinutes || 5} min</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono block">
                        {call.date} {call.time}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          call.status === 'Resolved' || call.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : call.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInteraction(call);
                        }}
                        className="rounded-lg bg-stone-100 hover:bg-[#0B63E5] hover:text-white px-3 py-1 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Phone className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-semibold text-stone-600">No call records found matching criteria.</p>
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
