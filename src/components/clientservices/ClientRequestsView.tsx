import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  User,
  ChevronRight,
  Send,
  AlertCircle,
  FileCheck,
  Calendar,
} from 'lucide-react';
import {
  ClientInteraction,
  ClientRequestType,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface ClientRequestsViewProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (initialType: 'Client Request') => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onUpdateStatus: (id: string, newStatus: InteractionStatus) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const ClientRequestsView: React.FC<ClientRequestsViewProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onUpdateStatus,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const requests = interactions.filter((i) => i.interactionType === 'Client Request');

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.matterRef && r.matterRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubtype = subtypeFilter === 'all' || r.subtype === subtypeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Open' && !['Resolved', 'Closed'].includes(r.status)) ||
      (statusFilter === 'Resolved' && ['Resolved', 'Closed'].includes(r.status)) ||
      r.status === statusFilter;

    return matchesSearch && matchesSubtype && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#0B63E5]" />
            <span>Client Requests & Service Fulfillment</span>
          </h2>
          <p className="text-xs text-stone-500">
            Track routine client requests for case updates, certified copies, advocate callbacks, and billing summaries
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewModal('Client Request')}
          className="flex items-center space-x-1.5 rounded-xl bg-[#0B63E5] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0256D0] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Log Client Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requests by client, matter, keyword..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={subtypeFilter}
              onChange={(e) => setSubtypeFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Request Types</option>
              <option value="Case Update">Case Update</option>
              <option value="Document Copy">Document Copy</option>
              <option value="Speak with Advocate">Speak with Advocate</option>
              <option value="Fee Note / Receipt Copy">Fee Note / Receipt Copy</option>
              <option value="Certified True Copies">Certified True Copies</option>
              <option value="Other Request">Other Request</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Pending Fulfillment</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Client">Awaiting Client</option>
              <option value="Resolved">Fulfilled / Closed</option>
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
                <th className="px-5 py-3">Request Ref & Type</th>
                <th className="px-4 py-3">Client & Contact</th>
                <th className="px-4 py-3">Subject & Details</th>
                <th className="px-4 py-3">Linked Matter</th>
                <th className="px-4 py-3">Assigned Officer</th>
                <th className="px-4 py-3">Action Required</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => onSelectInteraction(req)}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0B63E5] block text-xs">{req.id}</span>
                      <span className="rounded bg-blue-50 text-[#0B63E5] border border-blue-200 px-2 py-0.2 text-[10px] font-semibold inline-block mt-0.5">
                        {req.subtype || 'Request'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <strong className="text-stone-900 block font-semibold text-xs">{req.clientName}</strong>
                      {req.contactPerson && (
                        <span className="text-[10px] text-stone-500 block">{req.contactPerson}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <strong className="text-stone-900 block line-clamp-1">{req.subject}</strong>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{req.description}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      {req.matterRef ? (
                        <div>
                          <span className="font-mono font-semibold text-[#0B63E5] text-[10px] block">
                            {req.matterRef}
                          </span>
                          <span className="text-[11px] text-stone-600 line-clamp-1">{req.matterTitle}</span>
                        </div>
                      ) : (
                        <span className="italic text-stone-400 text-[11px]">General Request</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-stone-900 block">{req.assignedStaffName}</span>
                      <span className="text-[10px] text-stone-400">By: {req.handledByName}</span>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="text-[11px] text-stone-800 font-medium line-clamp-1">
                        {req.actionRequired || 'Fulfill client request'}
                      </span>
                      {req.responseProvided && (
                        <span className="text-[10px] text-emerald-700 block line-clamp-1">
                          Resp: {req.responseProvided}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'Resolved' || req.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInteraction(req);
                        }}
                        className="rounded-lg bg-stone-100 hover:bg-[#0B63E5] hover:text-white px-3 py-1 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                      >
                        View & Fulfill
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <FileText className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-semibold text-stone-600">No client service requests recorded.</p>
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
