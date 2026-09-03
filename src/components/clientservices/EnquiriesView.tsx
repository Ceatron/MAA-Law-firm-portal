import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  UserPlus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Briefcase,
  ChevronRight,
  User,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  ClientInteraction,
  EnquiryCategory,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface EnquiriesViewProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (initialType: 'Enquiry') => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onConvertClient: (interaction: ClientInteraction) => void;
  onUpdateStatus: (id: string, newStatus: InteractionStatus) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onConvertClient,
  onUpdateStatus,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const enquiries = interactions.filter((i) => i.interactionType === 'Enquiry');

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      e.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.phoneNumber && e.phoneNumber.includes(searchTerm)) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || e.enquiryCategory === categoryFilter;
    const matchesSource = sourceFilter === 'all' || e.enquirySource === sourceFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Open' && !['Resolved', 'Closed'].includes(e.status)) ||
      (statusFilter === 'Resolved' && ['Resolved', 'Closed'].includes(e.status)) ||
      e.status === statusFilter;

    return matchesSearch && matchesCategory && matchesSource && matchesStatus;
  });

  const stages: { status: InteractionStatus; title: string; color: string }[] = [
    { status: 'Open', title: 'New & Intake', color: 'border-amber-400 bg-amber-50/40 text-amber-900' },
    { status: 'In Progress', title: 'Assessment & Follow-up', color: 'border-blue-400 bg-blue-50/40 text-blue-900' },
    { status: 'Awaiting Client', title: 'Awaiting Client Docs / Deposit', color: 'border-purple-400 bg-purple-50/40 text-purple-900' },
    { status: 'Resolved', title: 'Onboarded / Closed', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & New Enquiry Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-amber-600" />
            <span>Prospective Client & Legal Services Enquiries</span>
          </h2>
          <p className="text-xs text-stone-500">
            Intake pipeline for prospective clients, fee estimates, case status queries & direct onboarding
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Pipeline Kanban View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewModal('Enquiry')}
            className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search enquiries by client, matter, keyword..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Enquiry Categories</option>
              <option value="Legal Service Enquiry">Legal Service Enquiry</option>
              <option value="New Client Onboarding">New Client Onboarding</option>
              <option value="Fee Estimate / Quotation">Fee Estimate / Quotation</option>
              <option value="Case Status Enquiry">Case Status Enquiry</option>
              <option value="Conveyancing & Land Search">Conveyancing & Land Search</option>
              <option value="Succession & Probate">Succession & Probate</option>
              <option value="Commercial & Retainer">Commercial & Retainer</option>
              <option value="General Enquiry">General Enquiry</option>
            </select>
          </div>

          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Lead Sources</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
              <option value="Referral">Client Referral</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open / Pending Response</option>
              <option value="In Progress">In Assessment</option>
              <option value="Awaiting Client">Awaiting Client</option>
              <option value="Resolved">Resolved / Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Pipeline Kanban vs Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageItems = filteredEnquiries.filter((e) => {
              if (stage.status === 'Open') return e.status === 'Open' || !e.status;
              if (stage.status === 'In Progress') return e.status === 'In Progress' || e.status === 'Action Required';
              if (stage.status === 'Awaiting Client') return e.status === 'Awaiting Client';
              if (stage.status === 'Resolved') return e.status === 'Resolved' || e.status === 'Closed';
              return e.status === stage.status;
            });

            return (
              <div key={stage.status} className="flex flex-col rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-3">
                <div className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between ${stage.color}`}>
                  <span>{stage.title}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px]">{stageItems.length}</span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectInteraction(item)}
                      className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs hover:border-[#0B63E5] hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-[#0B63E5]">{item.id}</span>
                        <span className="bg-stone-100 text-stone-600 rounded px-1.5 py-0.2 font-medium">
                          {item.enquirySource || 'Direct'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#0B63E5] line-clamp-1">
                        {item.subject}
                      </h4>

                      <div className="text-[11px] text-stone-600">
                        <strong className="text-stone-800 block line-clamp-1">{item.clientName}</strong>
                        {item.phoneNumber && (
                          <span className="font-mono text-[10px] text-stone-400">{item.phoneNumber}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-stone-100 text-stone-500">
                        <span>{item.assignedStaffName}</span>
                        {item.isProspectiveClient && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onConvertClient(item);
                            }}
                            className="flex items-center space-x-1 rounded bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 font-semibold text-[10px] transition-colors cursor-pointer"
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>Onboard</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageItems.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-stone-400 italic">No enquiries in stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3">Enquiry Ref</th>
                  <th className="px-4 py-3">Client / Prospective Entity</th>
                  <th className="px-4 py-3">Subject & Practice Inquiry</th>
                  <th className="px-4 py-3">Lead Source</th>
                  <th className="px-4 py-3">Assigned Lead</th>
                  <th className="px-4 py-3">SLA Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredEnquiries.length > 0 ? (
                  filteredEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      onClick={() => onSelectInteraction(enquiry)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-700 block text-xs">{enquiry.id}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {enquiry.date} {enquiry.time}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <strong className="text-stone-900 block font-semibold text-xs">{enquiry.clientName}</strong>
                        {enquiry.phoneNumber && (
                          <span className="font-mono text-[10px] text-stone-500 block">{enquiry.phoneNumber}</span>
                        )}
                        {enquiry.isProspectiveClient && (
                          <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-100 rounded px-1.5 py-0.2 mt-0.5">
                            Prospective Intake
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <strong className="text-stone-900 block line-clamp-1">{enquiry.subject}</strong>
                        <span className="text-[11px] text-stone-500 line-clamp-1">
                          Category: {enquiry.enquiryCategory || 'General'}
                        </span>
                        {enquiry.clientRequestOrEnquiry && (
                          <p className="text-[10px] text-amber-800 italic line-clamp-1 mt-0.5">
                            "{enquiry.clientRequestOrEnquiry}"
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                          {enquiry.enquirySource || enquiry.channel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-stone-900 block">{enquiry.assignedStaffName}</span>
                        <span className="text-[10px] text-stone-400">By: {enquiry.handledByName}</span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-stone-700 text-[11px] block">
                          {enquiry.enquiryDeadline || 'Standard 24h'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            enquiry.status === 'Resolved' || enquiry.status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : enquiry.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {enquiry.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {enquiry.isProspectiveClient && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConvertClient(enquiry);
                              }}
                              className="flex items-center space-x-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>Onboard</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInteraction(enquiry);
                            }}
                            className="rounded-lg bg-stone-100 hover:bg-[#0B63E5] hover:text-white px-3 py-1 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      <HelpCircle className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                      <p className="text-xs font-semibold text-stone-600">No legal service enquiries recorded.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
