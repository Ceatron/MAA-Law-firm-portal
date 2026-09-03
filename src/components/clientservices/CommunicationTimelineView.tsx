import React, { useState } from 'react';
import {
  Clock,
  Phone,
  HelpCircle,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  Send,
  Search,
  Filter,
  User,
  Briefcase,
  ChevronRight,
  Printer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ClientInteraction,
  ClientInteractionType,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface CommunicationTimelineViewProps {
  interactions: ClientInteraction[];
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onOpenNewModal: (type: ClientInteractionType) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const CommunicationTimelineView: React.FC<CommunicationTimelineViewProps> = ({
  interactions,
  onSelectInteraction,
  onOpenNewModal,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedMatterId, setSelectedMatterId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sort interactions chronologically descending
  const sortedInteractions = [...interactions].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time.replace(/\s*(AM|PM)/i, '') || '00:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.time.replace(/\s*(AM|PM)/i, '') || '00:00'}`).getTime();
    return (timeB || new Date(b.createdDate).getTime()) - (timeA || new Date(a.createdDate).getTime());
  });

  const filteredInteractions = sortedInteractions.filter((item) => {
    const matchesClient = selectedClientId === 'all' || item.clientId === selectedClientId || item.clientName === selectedClientId;
    const matchesMatter = selectedMatterId === 'all' || item.matterId === selectedMatterId || item.matterRef === selectedMatterId;
    const matchesType = typeFilter === 'all' || item.interactionType === typeFilter;
    const matchesSearch =
      searchTerm === '' ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesClient && matchesMatter && matchesType && matchesSearch;
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId || c.name === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-[#0B63E5]" />
            <span>Complete Client Communication Timeline</span>
          </h2>
          <p className="text-xs text-stone-500">
            Chronological audit trail of all telephone calls, correspondence, reception encounters, requests & complaints
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print History</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-stone-600 mb-1">Filter by Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSelectedMatterId('all');
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Chambers Clients & Contacts</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-600 mb-1">Filter by Legal Matter</label>
            <select
              value={selectedMatterId}
              onChange={(e) => setSelectedMatterId(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Linked Matters</option>
              {matters
                .filter((m) => selectedClientId === 'all' || m.clientId === selectedClientId || m.clientName === selectedClientId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.referenceNumber}: {m.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-600 mb-1">Interaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Interaction Types</option>
              <option value="Call">Telephone Calls</option>
              <option value="Enquiry">Enquiries</option>
              <option value="Client Request">Client Requests</option>
              <option value="Appointment">Appointments & Briefings</option>
              <option value="Complaint / Feedback">Complaints</option>
              <option value="Walk-in Visitor">Reception Walk-ins</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-600 mb-1">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes, subject..."
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Client Profile Header if client selected */}
      {selectedClient && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#0B63E5]">
              Active Client Profile
            </span>
            <h3 className="text-base font-bold font-serif-title text-stone-900 mt-0.5">{selectedClient.name}</h3>
            <p className="text-xs text-stone-600">
              {selectedClient.type} • Contact: {selectedClient.contactPerson} • {selectedClient.phone} •{' '}
              {selectedClient.email}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="rounded-lg bg-white border border-blue-200 px-3 py-1.5 font-semibold text-stone-700">
              Retainer: <strong className="text-emerald-700">{selectedClient.retainerStatus}</strong>
            </span>
            <span className="rounded-lg bg-white border border-blue-200 px-3 py-1.5 font-semibold text-stone-700">
              Active Matters: <strong className="text-[#0B63E5]">{selectedClient.activeMattersCount}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Chronological Timeline Feed */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
        {filteredInteractions.length > 0 ? (
          filteredInteractions.map((item) => {
            const isCall = item.interactionType === 'Call';
            const isEnquiry = item.interactionType === 'Enquiry';
            const isComplaint = item.interactionType === 'Complaint / Feedback';
            const isAppointment = item.interactionType === 'Appointment';
            const isRequest = item.interactionType === 'Client Request';

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Icon Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                    isCall
                      ? 'bg-emerald-500 text-white'
                      : isEnquiry
                      ? 'bg-amber-500 text-white'
                      : isComplaint
                      ? 'bg-rose-600 text-white'
                      : isAppointment
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#0B63E5] text-white'
                  }`}
                >
                  {isCall && <Phone className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {isEnquiry && <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {isComplaint && <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {isAppointment && <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {!isCall && !isEnquiry && !isComplaint && !isAppointment && (
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>

                {/* Timeline Card */}
                <div
                  onClick={() => onSelectInteraction(item)}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-[#0B63E5] hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-[#0B63E5]">{item.id}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold  ${
                          isCall
                            ? 'bg-emerald-50 text-emerald-800'
                            : isEnquiry
                            ? 'bg-amber-50 text-amber-900'
                            : isComplaint
                            ? 'bg-rose-50 text-rose-900'
                            : 'bg-blue-50 text-blue-900'
                        }`}
                      >
                        {item.subtype || item.interactionType}
                      </span>
                      {item.channel && (
                        <span className="text-[10px] text-stone-500 font-semibold">• {item.channel}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-stone-500 font-mono">
                      <span>
                        {item.date} at {item.time}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Resolved' || item.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold font-serif-title text-stone-900 group-hover:text-[#0B63E5] transition-colors">
                      {item.subject}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                      <span>
                        Client: <strong className="text-stone-800">{item.clientName}</strong>
                      </span>
                      {item.matterRef && (
                        <span className="inline-flex items-center space-x-1 font-semibold text-[#0B63E5] bg-blue-50 px-2 py-0.5 rounded">
                          <Briefcase className="h-3 w-3" />
                          <span>{item.matterRef}</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>

                  {/* Specific Action / Response callout */}
                  {(item.actionRequired || item.responseProvided) && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs space-y-1">
                      {item.responseProvided && (
                        <p className="text-stone-800">
                          <strong className="text-emerald-700">Response:</strong> {item.responseProvided}
                        </p>
                      )}
                      {item.actionRequired && (
                        <p className="text-stone-800">
                          <strong className="text-amber-700">Action Required:</strong> {item.actionRequired}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-[#0B63E5] flex items-center justify-center font-bold text-[9px]">
                        {item.handledByName.slice(0, 2).toUpperCase()}
                      </div>
                      <span>
                        Handled by <strong className="text-stone-800">{item.handledByName}</strong>
                        {item.assignedStaffName !== item.handledByName && ` • Assigned to ${item.assignedStaffName}`}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-[#0B63E5] flex items-center group-hover:underline">
                      <span>View Full Record</span>
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            <Clock className="h-10 w-10 mx-auto text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-600">No communication timeline records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
