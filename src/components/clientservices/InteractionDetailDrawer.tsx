import React, { useState } from 'react';
import {
  X,
  Phone,
  HelpCircle,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  Send,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Edit,
  Trash2,
  ExternalLink,
  CheckSquare,
  ArrowRight,
  History,
  MessageSquare,
  Share2,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  ClientInteraction,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface InteractionDetailDrawerProps {
  interaction: ClientInteraction | null;
  onClose: () => void;
  onEdit: (interaction: ClientInteraction) => void;
  onUpdateStatus: (id: string, newStatus: InteractionStatus) => void;
  onConvertClient?: (interaction: ClientInteraction) => void;
  onCreateTask?: (interaction: ClientInteraction) => void;
  onToggleFollowUpComplete?: (interaction: ClientInteraction) => void;
  currentAdvocate: Advocate;
  isManagingAdvocate: boolean;
}

export const InteractionDetailDrawer: React.FC<InteractionDetailDrawerProps> = ({
  interaction,
  onClose,
  onEdit,
  onUpdateStatus,
  onConvertClient,
  onCreateTask,
  onToggleFollowUpComplete,
  currentAdvocate,
  isManagingAdvocate,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'followup' | 'audit'>('details');

  if (!interaction) return null;

  // Check confidentiality permissions
  const isConfidential = interaction.isConfidential;
  const canViewConfidential =
    isManagingAdvocate ||
    currentAdvocate.title.toLowerCase().includes('partner') ||
    currentAdvocate.title.toLowerCase().includes('admin') ||
    interaction.handledById === currentAdvocate.id ||
    interaction.assignedStaffId === currentAdvocate.id;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-2xs">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-[#132c3f] text-white px-6 py-5 flex items-center justify-between border-b border-[#1c4766]">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 border border-white/20">
                {interaction.interactionType === 'Call' && <Phone className="h-5 w-5" />}
                {interaction.interactionType === 'Enquiry' && <HelpCircle className="h-5 w-5" />}
                {interaction.interactionType === 'Client Request' && <FileText className="h-5 w-5" />}
                {interaction.interactionType === 'Appointment' && <Calendar className="h-5 w-5" />}
                {interaction.interactionType === 'Complaint / Feedback' && <AlertTriangle className="h-5 w-5" />}
                {interaction.interactionType === 'Walk-in Visitor' && <Building2 className="h-5 w-5" />}
                {!['Call', 'Enquiry', 'Client Request', 'Appointment', 'Complaint / Feedback', 'Walk-in Visitor'].includes(
                  interaction.interactionType
                ) && <Send className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-amber-300 font-semibold">{interaction.id}</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-stone-200">
                    {interaction.interactionType}
                  </span>
                  {interaction.direction && (
                    <span className="rounded-full bg-blue-500/20 text-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                      {interaction.direction}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold font-serif-title text-white mt-1 line-clamp-1">
                  {interaction.subject}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onEdit(interaction)}
                className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Edit Interaction"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-stone-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sub-header status bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-stone-200 px-6 py-3 bg-stone-50 text-xs gap-2">
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-stone-500">Status:</span>
              <select
                value={interaction.status}
                onChange={(e) => onUpdateStatus(interaction.id, e.target.value as InteractionStatus)}
                className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold focus:border-[#0B63E5] focus:outline-hidden"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Client">Awaiting Client</option>
                <option value="Action Required">Action Required</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 text-stone-600">
              <span className="flex items-center space-x-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <span>
                  {interaction.date} at {interaction.time}
                </span>
              </span>
              {interaction.durationMinutes ? (
                <span className="rounded bg-stone-200/80 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                  {interaction.durationMinutes} mins
                </span>
              ) : null}
            </div>
          </div>

          {/* Tabs bar */}
          <div className="flex border-b border-stone-200 px-6 bg-white text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'border-[#0B63E5] text-[#0B63E5]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Details & Content
            </button>
            <button
              onClick={() => setActiveTab('followup')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'followup'
                  ? 'border-[#0B63E5] text-[#0B63E5]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>Follow-up & Tasks</span>
              {interaction.followUpRequired && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    interaction.followUpStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {interaction.followUpStatus || 'Pending'}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
                activeTab === 'audit'
                  ? 'border-[#0B63E5] text-[#0B63E5]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Audit Trail ({interaction.auditTrail?.length || 0})</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-stone-700">
            {activeTab === 'details' && (
              <>
                {/* Confidentiality Warning if applicable */}
                {isConfidential && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-900 flex items-start space-x-3">
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">Confidential Client Service Record</h4>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Access restricted to Managing Partners, Assigned Advocates, and Quality Officers.
                      </p>
                    </div>
                  </div>
                )}

                {/* Client & Matter Snapshot */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-stone-500">
                      Client Profile & Legal Matter
                    </span>
                    {interaction.isProspectiveClient && onConvertClient && (
                      <button
                        type="button"
                        onClick={() => onConvertClient(interaction)}
                        className="flex items-center space-x-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <span>Convert to Official Client</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Client Name:</span>
                      <strong className="text-stone-900 text-sm font-serif-title">
                        {interaction.clientName}
                      </strong>
                      {interaction.contactPerson && (
                        <p className="text-stone-600 mt-0.5">Contact: {interaction.contactPerson}</p>
                      )}
                      {interaction.phoneNumber && (
                        <p className="text-stone-600 font-mono mt-0.5">Tel: {interaction.phoneNumber}</p>
                      )}
                      {interaction.email && (
                        <p className="text-stone-600 font-mono mt-0.5">Email: {interaction.email}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Related Matter:</span>
                      {interaction.matterRef ? (
                        <div>
                          <span className="inline-block font-semibold text-[#0B63E5] font-mono text-[11px]">
                            {interaction.matterRef}
                          </span>
                          <p className="text-stone-800 font-medium mt-0.5 line-clamp-2">
                            {interaction.matterTitle || 'Active Matter'}
                          </p>
                        </div>
                      ) : (
                        <span className="italic text-stone-400">
                          General Client Interaction (No specific court matter linked)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Handled & Assigned Staff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-stone-200 p-4">
                  <div>
                    <span className="text-stone-400 block text-[10px] font-bold">
                      Recorded / Handled By:
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-[#0B63E5] flex items-center justify-center font-bold text-[10px]">
                        {interaction.handledByName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-stone-900">{interaction.handledByName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] font-bold">
                      Assigned Staff / Lead:
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                        {(interaction.assignedStaffName || interaction.handledByName).slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-stone-900">
                        {interaction.assignedStaffName || interaction.handledByName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Discussion Notes */}
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-xs tracking-wider">
                    Discussion & Interaction Notes
                  </h3>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 leading-relaxed text-stone-800 whitespace-pre-wrap shadow-2xs">
                    {interaction.description || 'No detailed discussion notes recorded.'}
                  </div>
                </div>

                {/* Specifics: Request, Response, Action */}
                <div className="space-y-3">
                  {interaction.clientRequestOrEnquiry && (
                    <div className="rounded-xl border border-stone-200 p-3.5 bg-stone-50/50">
                      <span className="text-[10px] font-bold tracking-wider text-stone-500 block mb-1">
                        Client Request / Specific Enquiry
                      </span>
                      <p className="text-stone-800 font-medium">{interaction.clientRequestOrEnquiry}</p>
                    </div>
                  )}

                  {interaction.responseProvided && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3.5">
                      <span className="text-[10px] font-bold tracking-wider text-blue-700 block mb-1">
                        Response / Advice Provided
                      </span>
                      <p className="text-stone-800 font-medium">{interaction.responseProvided}</p>
                    </div>
                  )}

                  {interaction.actionRequired && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3.5">
                      <span className="text-[10px] font-bold tracking-wider text-amber-700 block mb-1">
                        Action Required
                      </span>
                      <p className="text-stone-800 font-medium">{interaction.actionRequired}</p>
                    </div>
                  )}
                </div>

                {/* Enquiry Specific Info */}
                {interaction.interactionType === 'Enquiry' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
                    <h4 className="font-bold text-amber-900 text-xs tracking-wider">
                      Enquiry Workflow Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Category:</span>
                        <span className="font-semibold text-stone-800">{interaction.enquiryCategory || 'General'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Lead Source:</span>
                        <span className="font-semibold text-stone-800">{interaction.enquirySource || 'Direct'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">SLA Response Deadline:</span>
                        <span className="font-semibold text-amber-800 font-mono">
                          {interaction.enquiryDeadline || 'None set'}
                        </span>
                      </div>
                    </div>
                    {interaction.enquiryResolution && (
                      <div className="pt-2 border-t border-amber-200/60">
                        <span className="text-stone-400 block text-[10px]">Resolution Summary:</span>
                        <p className="text-stone-800 mt-0.5">{interaction.enquiryResolution}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Complaint Specific Info */}
                {interaction.interactionType === 'Complaint / Feedback' && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-2">
                    <h4 className="font-bold text-rose-900 text-xs tracking-wider">
                      Complaint & Quality Investigation
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Category:</span>
                        <span className="font-semibold text-stone-800">
                          {interaction.complaintCategory || 'Service Issue'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Severity Rating:</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            interaction.complaintSeverity === 'Critical' || interaction.complaintSeverity === 'High'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {interaction.complaintSeverity || 'Medium'}
                        </span>
                      </div>
                    </div>
                    {interaction.complaintInvestigationNotes && (
                      <div className="pt-2 border-t border-rose-200/60">
                        <span className="text-stone-400 block text-[10px]">Investigation Findings:</span>
                        <p className="text-stone-800 mt-0.5">{interaction.complaintInvestigationNotes}</p>
                      </div>
                    )}
                    {interaction.complaintResolution && (
                      <div className="pt-2 border-t border-rose-200/60">
                        <span className="text-stone-400 block text-[10px]">Resolution & Client Outcome:</span>
                        <p className="text-stone-800 mt-0.5">{interaction.complaintResolution}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Walk-in Badge */}
                {interaction.interactionType === 'Walk-in Visitor' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
                    <h4 className="font-bold text-blue-900 text-xs tracking-wider mb-2">
                      Front Desk Visitor Record
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Visitor Pass:</span>
                        <span className="font-mono font-bold text-blue-800">{interaction.visitorPassNumber}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">ID / Passport:</span>
                        <span className="font-mono font-semibold text-stone-800">
                          {interaction.visitorIdNumber || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Host Advocate:</span>
                        <span className="font-semibold text-stone-800">
                          {interaction.hostAdvocateName || 'Chambers'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Internal Notes */}
                {interaction.internalNotes && canViewConfidential && (
                  <div className="rounded-xl border border-stone-200 bg-amber-50/30 p-4">
                    <span className="text-[10px] font-bold tracking-wider text-amber-900 block mb-1">
                      Internal Private Notes (Chambers Only)
                    </span>
                    <p className="text-stone-800">{interaction.internalNotes}</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'followup' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-900 text-sm">Follow-up Action Status</h3>
                    {interaction.followUpRequired && onToggleFollowUpComplete && (
                      <button
                        type="button"
                        onClick={() => onToggleFollowUpComplete(interaction)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          interaction.followUpStatus === 'Completed'
                            ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {interaction.followUpStatus === 'Completed' ? 'Reopen Follow-up' : 'Mark Completed'}
                      </button>
                    )}
                  </div>

                  {interaction.followUpRequired ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Assigned Owner:</span>
                        <strong className="text-stone-900">
                          {interaction.followUpAssignedToName || interaction.assignedStaffName}
                        </strong>
                      </div>

                      <div>
                        <span className="text-stone-400 block text-[11px]">Due Date:</span>
                        <span className="font-mono font-bold text-stone-800">
                          {interaction.followUpDueDate || 'Immediate'}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-stone-400 block text-[11px]">Follow-up Instructions:</span>
                        <p className="text-stone-800 mt-0.5">
                          {interaction.followUpNotes || interaction.actionRequired || 'No specific notes'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-stone-500">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                      <p>No follow-up action was flagged for this interaction.</p>
                      <button
                        type="button"
                        onClick={() => onEdit(interaction)}
                        className="mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold text-[#0B63E5] hover:underline cursor-pointer"
                      >
                        <span>Schedule a Follow-up Action</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {onCreateTask && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#0B63E5]">Link to Chambers Task Engine</h4>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Create an official tracked task in the firm’s Tasks module with subtasks and deadline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCreateTask(interaction)}
                      className="flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0256D0] transition-colors cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>Sync as Task</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-3">
                <h3 className="font-bold text-stone-900 text-xs tracking-wider">
                  Audit Log & Modification History
                </h3>
                <div className="space-y-3">
                  {interaction.auditTrail && interaction.auditTrail.length > 0 ? (
                    interaction.auditTrail.map((entry, idx) => (
                      <div
                        key={entry.id || idx}
                        className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 flex items-center space-x-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-[#0B63E5]" />
                            <span>{entry.action}</span>
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-stone-600">
                          By: <strong className="text-stone-800">{entry.userName}</strong> ({entry.userRole || 'Staff'})
                        </p>
                        {entry.notes && <p className="text-stone-700 italic pt-0.5">{entry.notes}</p>}
                        {entry.fieldChanged && (
                          <p className="text-[11px] text-stone-500 font-mono">
                            Changed {entry.fieldChanged} from "{entry.oldValue}" to "{entry.newValue}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-stone-400 italic">No audit history entries found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-stone-200 px-6 py-4 bg-stone-50 flex items-center justify-between">
            <div className="text-[11px] text-stone-500">
              Created on {interaction.createdDate.slice(0, 10)} by {interaction.createdBy}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center space-x-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Record</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#132c3f] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1c4766] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
