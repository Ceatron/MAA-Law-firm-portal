import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  User,
  ChevronRight,
  Briefcase,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ClientInteraction,
  ComplaintCategory,
  ComplaintSeverity,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface ComplaintsFeedbackViewProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (initialType: 'Complaint / Feedback') => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onUpdateStatus: (id: string, newStatus: InteractionStatus) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
  isManagingAdvocate: boolean;
}

export const ComplaintsFeedbackView: React.FC<ComplaintsFeedbackViewProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onUpdateStatus,
  advocates,
  clients,
  matters,
  currentAdvocate,
  isManagingAdvocate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const complaints = interactions.filter((i) => i.interactionType === 'Complaint / Feedback');

  const filteredComplaints = complaints.filter((comp) => {
    const matchesSearch =
      searchTerm === '' ||
      comp.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || comp.complaintSeverity === severityFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Open' && !['Resolved', 'Closed'].includes(comp.status)) ||
      (statusFilter === 'Resolved' && ['Resolved', 'Closed'].includes(comp.status));

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const canViewFullDetails =
    isManagingAdvocate ||
    currentAdvocate.title.toLowerCase().includes('partner') ||
    currentAdvocate.title.toLowerCase().includes('admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <span>Complaints & Quality Assurance Registry</span>
            </h2>
            <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-bold tracking-wider">
              Restricted Access
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Confidential incident logging, client grievance investigations, service recovery, and root-cause analysis
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewModal('Complaint / Feedback')}
          className="flex items-center space-x-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Log Client Complaint</span>
        </button>
      </div>

      {/* Confidentiality Notice Banner */}
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50/40 p-4 flex items-start space-x-3 text-xs text-rose-950">
        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Confidential Quality & Ethics Oversight</h4>
          <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
            In compliance with Law Society of Kenya practice rules, client grievances are tracked under strict partner
            supervision. All records maintain permanent immutable audit logging.
          </p>
        </div>
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
              placeholder="Search complaints by client, subject..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Severity Levels</option>
              <option value="Critical">Critical (Immediate Partner Escalation)</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Under Investigation / Action Required</option>
              <option value="Resolved">Resolved / Satisfactorily Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Incident Ref</th>
                <th className="px-4 py-3">Client / Complainant</th>
                <th className="px-4 py-3">Category & Summary</th>
                <th className="px-4 py-3">Severity Rating</th>
                <th className="px-4 py-3">Assigned Partner / Lead</th>
                <th className="px-4 py-3">Investigation & Action</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((comp) => (
                  <tr
                    key={comp.id}
                    onClick={() => onSelectInteraction(comp)}
                    className="hover:bg-rose-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-rose-700 block text-xs">{comp.id}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {comp.date} {comp.time}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <strong className="text-stone-900 block font-semibold text-xs">{comp.clientName}</strong>
                      {comp.phoneNumber && (
                        <span className="text-[10px] text-stone-400 font-mono block">{comp.phoneNumber}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <strong className="text-stone-900 block line-clamp-1">{comp.subject}</strong>
                      <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 rounded px-1.5 py-0.2">
                        {comp.complaintCategory || 'Service Issue'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          comp.complaintSeverity === 'Critical'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : comp.complaintSeverity === 'High'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {comp.complaintSeverity || 'Medium'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-stone-900 block">{comp.assignedStaffName}</span>
                      <span className="text-[10px] text-stone-400">Logged by: {comp.handledByName}</span>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      {canViewFullDetails ? (
                        <p className="text-[11px] text-stone-700 line-clamp-2">
                          {comp.actionRequired || comp.description}
                        </p>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic flex items-center space-x-1">
                          <Lock className="h-3 w-3" />
                          <span>Confidential details restricted to partners</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          comp.status === 'Resolved' || comp.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : comp.status === 'Action Required'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInteraction(comp);
                        }}
                        className="rounded-lg bg-stone-100 hover:bg-rose-600 hover:text-white px-3 py-1 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                      >
                        Review Incident
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-semibold text-stone-600">No active complaints or service grievances.</p>
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
