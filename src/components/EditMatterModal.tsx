import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  Calendar,
  User,
  DollarSign,
  Save,
  CheckCircle2,
  FileText,
  Gavel,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  LegalMatter,
  PracticeArea,
  MatterStatus,
  MatterPriority,
  CourtDatePurpose,
  Client,
  Advocate,
} from '../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../utils/staffStorage';
import { DraggableModal } from './common/DraggableModal';

interface EditMatterModalProps {
  isOpen: boolean;
  matter: LegalMatter | null;
  onClose: () => void;
  onSaveMatter: (updatedMatter: LegalMatter) => void;
  clients?: Client[];
  advocates?: Advocate[];
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
}

export const EditMatterModal: React.FC<EditMatterModalProps> = ({
  isOpen,
  matter,
  onClose,
  onSaveMatter,
  clients = [],
  advocates = [],
  currentAdvocate,
  isManagingAdvocate = true,
}) => {
  const staffList = (advocates.length > 0 ? advocates : loadVisibleStaffRoster()).filter(
    (a) => !isSysAdminUser(a)
  );

  const isSysAdmin = isSysAdminUser(currentAdvocate);
  const isManagingUser =
    isSysAdmin ||
    Boolean(isManagingAdvocate) ||
    currentAdvocate?.role === 'Managing Advocate' ||
    currentAdvocate?.id === 'adv-1' ||
    Boolean(currentAdvocate?.title?.toLowerCase().includes('managing'));
  const canAssignMatters = isSysAdmin || isManagingUser;

  const [activeTab, setActiveTab] = useState<'general' | 'court' | 'team' | 'financials'>('general');

  // Form State
  const [referenceNumber, setReferenceNumber] = useState('');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('Civil Litigation');
  const [description, setDescription] = useState('');

  // Court Forum & Dates
  const [courtRegistry, setCourtRegistry] = useState('');
  const [courtCaseNumber, setCourtCaseNumber] = useState('');
  const [ctsFilingId, setCtsFilingId] = useState('');
  const [nextCourtDate, setNextCourtDate] = useState('');
  const [courtDatePurpose, setCourtDatePurpose] = useState<CourtDatePurpose | string>('Mention');
  const [nextDeadlineDescription, setNextDeadlineDescription] = useState('');

  // Team & Status
  const [responsibleAdvocateId, setResponsibleAdvocateId] = useState('');
  const [status, setStatus] = useState<MatterStatus>('Active - In Court');
  const [priority, setPriority] = useState<MatterPriority>('Medium');
  const [lodgedDate, setLodgedDate] = useState('');

  // Financials
  const [estimatedFeeKES, setEstimatedFeeKES] = useState<number | string>('');
  const [feeToBeDiscussedLater, setFeeToBeDiscussedLater] = useState(false);
  const [billedKES, setBilledKES] = useState<number | string>(0);
  const [paidKES, setPaidKES] = useState<number | string>(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever matter changes or modal opens
  useEffect(() => {
    if (matter && isOpen) {
      setReferenceNumber(matter.referenceNumber || '');
      setTitle(matter.title || '');
      setClientId(matter.clientId || '');
      setClientName(matter.clientName || '');
      setOpposingParty(matter.opposingParty || '');
      setPracticeArea(matter.practiceArea || 'Civil Litigation');
      setDescription(matter.description || '');

      setCourtRegistry(matter.courtRegistry || '');
      setCourtCaseNumber(matter.courtCaseNumber || '');
      setCtsFilingId(matter.ctsFilingId || '');
      setNextCourtDate(matter.nextCourtDate || matter.nextDeadlineDate || '');
      setCourtDatePurpose(matter.courtDatePurpose || 'Mention');
      setNextDeadlineDescription(matter.nextDeadlineDescription || '');

      setResponsibleAdvocateId(matter.responsibleAdvocateId || staffList[0]?.id || '');
      setStatus(matter.status || 'Active - In Court');
      setPriority(matter.priority || 'Medium');
      setLodgedDate(matter.lodgedDate || matter.createdDate || '');

      setEstimatedFeeKES(matter.estimatedFeeKES ? matter.estimatedFeeKES : '');
      setFeeToBeDiscussedLater(Boolean(matter.feeToBeDiscussedLater) || (!matter.estimatedFeeKES && matter.estimatedFeeKES !== 0));
      setBilledKES(matter.billedKES || 0);
      setPaidKES(matter.paidKES || 0);
      setErrorMessage(null);
      setActiveTab('general');
    }
  }, [matter, isOpen]);

  if (!isOpen || !matter) return null;

  const handleClientSelect = (selectedId: string) => {
    setClientId(selectedId);
    if (selectedId === 'custom') {
      // Keep existing custom client name
    } else {
      const match = clients.find((c) => c.id === selectedId);
      if (match) {
        setClientName(match.name);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Matter title is required.');
      setActiveTab('general');
      return;
    }

    if (!clientName.trim()) {
      setErrorMessage('Client name is required.');
      setActiveTab('general');
      return;
    }

    const assignedStaff =
      staffList.find((a) => a.id === responsibleAdvocateId) ||
      staffList[0] || { id: 'adv-1', name: 'Adv. Costa Kimathi' };

    const updatedMatter: LegalMatter = {
      ...matter,
      referenceNumber: referenceNumber.trim() || matter.referenceNumber,
      title: title.trim(),
      clientName: clientName.trim(),
      clientId: clientId || matter.clientId,
      opposingParty: opposingParty.trim() || undefined,
      practiceArea,
      description: description.trim(),

      courtRegistry: courtRegistry.trim() || undefined,
      courtCaseNumber: courtCaseNumber.trim() || undefined,
      ctsFilingId: ctsFilingId.trim() || undefined,
      nextCourtDate: nextCourtDate.trim() || undefined,
      nextDeadlineDate: nextCourtDate.trim() || matter.nextDeadlineDate,
      courtDatePurpose: courtDatePurpose || undefined,
      nextDeadlineDescription: nextDeadlineDescription.trim() || `${courtDatePurpose || 'Court'} milestone`,

      responsibleAdvocateId: assignedStaff.id,
      responsibleAdvocateName: assignedStaff.name,
      status,
      priority,
      lodgedDate: lodgedDate || matter.lodgedDate,

      estimatedFeeKES: (!feeToBeDiscussedLater && estimatedFeeKES !== '') ? Number(estimatedFeeKES) || 0 : 0,
      feeToBeDiscussedLater: feeToBeDiscussedLater || !estimatedFeeKES || Number(estimatedFeeKES) === 0,
      billedKES: Number(billedKES) || 0,
      paidKES: Number(paidKES) || 0,
      tags: [],
    };

    onSaveMatter(updatedMatter);
    setToastMessage('Matter changes saved successfully');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 400);
  };

  return (
    <div
      id="edit-matter-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto"
    >
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-2xl border border-emerald-500/40 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <DraggableModal
        id="edit-matter-modal-container"
        gripLabel={`EDIT MATTER • ${matter.referenceNumber}`}
        className="relative w-full max-w-5xl rounded-xl border border-stone-300 bg-[#fbf9f4] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div
          data-drag-handle="true"
          className="flex items-center justify-between border-b border-stone-200 bg-[#16181b] px-6 py-4 text-white shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B2840] border border-amber-500/30 text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-bold text-stone-100">
                  Edit Legal Matter Details
                </h2>
                <span className="font-mono text-[11px] bg-stone-800 text-amber-300 px-2 py-0.5 rounded border border-stone-700">
                  {matter.referenceNumber}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Update case metadata, registry forums, assigned advocates, and schedule
              </p>
            </div>
          </div>

          <button
            id="edit-matter-close-button"
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200 bg-[#f4f0e6] px-6 py-2 gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'general', label: 'General & Parties', icon: FileText },
            { id: 'court', label: 'Court & Diary Dates', icon: Gavel },
            { id: 'team', label: 'Counsel & Status', icon: User },
            { id: 'financials', label: 'Financials & Billing', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`edit-matter-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#0B2840] shadow-2xs border border-stone-300 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5 opacity-75" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-xs font-semibold text-rose-800 flex items-center gap-2 shrink-0">
            <span className="font-bold">Error:</span> {errorMessage}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* TAB 1: GENERAL & PARTIES */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Matter Caption / Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="edit-matter-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter matter title"
                    required
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 font-semibold focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Matter File Ref No. <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="edit-matter-ref-input"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    required
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 font-mono text-xs focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Client <span className="text-rose-600">*</span>
                  </label>
                  {clients.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        id="edit-matter-client-select"
                        value={clientId || 'custom'}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                      >
                        <option value="custom">-- Enter / Edit Custom Client Name --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                      </select>
                      <input
                        id="edit-matter-client-name-input"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Client name"
                        required
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <input
                      id="edit-matter-client-name-input-direct"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client name"
                      required
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Opposing Party / Adversary
                  </label>
                  <input
                    id="edit-matter-opposing-input"
                    type="text"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    placeholder="Enter opposing party if applicable"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Leave as N/A if non-contentious or advisory matter
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Practice Area / Department
                  </label>
                  <select
                    id="edit-matter-practice-area-select"
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value as PracticeArea)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  >
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Commercial Law">Commercial Law</option>
                    <option value="Conveyancing Law">Conveyancing Law</option>
                    <option value="Succession Law">Succession Law</option>
                    <option value="Bank Securities">Bank Securities</option>
                    <option value="Constitutional & Tax">Constitutional & Tax</option>
                    <option value="Employment & Labour">Employment & Labour</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Registration / Lodged Date
                  </label>
                  <input
                    id="edit-matter-lodged-date-input"
                    type="date"
                    value={lodgedDate}
                    onChange={(e) => setLodgedDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Matter Synopsis / Case Narrative
                </label>
                <textarea
                  id="edit-matter-description-textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Case narrative and brief summary of instructions"
                  className="w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 focus:border-[#0B2840] focus:outline-none resize-y"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COURT & DIARY DATES */}
          {activeTab === 'court' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Court Registry / Tribunal / Forum
                  </label>
                  <input
                    id="edit-matter-registry-input"
                    type="text"
                    value={courtRegistry}
                    onChange={(e) => setCourtRegistry(e.target.value)}
                    placeholder="Enter court forum / registry"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Court Case / Suit Number
                  </label>
                  <input
                    id="edit-matter-case-number-input"
                    type="text"
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    placeholder="Enter case / suit number"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    CTS E-Filing ID / Ref
                  </label>
                  <input
                    id="edit-matter-cts-input"
                    type="text"
                    value={ctsFilingId}
                    onChange={(e) => setCtsFilingId(e.target.value)}
                    placeholder="Enter CTS reference"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Next Court Appearance Date
                  </label>
                  <input
                    id="edit-matter-next-court-date-input"
                    type="date"
                    value={nextCourtDate}
                    onChange={(e) => setNextCourtDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Purpose of Date
                  </label>
                  <select
                    id="edit-matter-purpose-select"
                    value={courtDatePurpose}
                    onChange={(e) => setCourtDatePurpose(e.target.value as CourtDatePurpose)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  >
                    <option value="Mention">Mention</option>
                    <option value="Hearing">Hearing</option>
                    <option value="Ruling">Ruling</option>
                    <option value="Judgement">Judgement</option>
                    <option value="Directions">Directions</option>
                    <option value="Pre-Trial Conference">Pre-Trial Conference</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Next Action / Deadline Instructions
                </label>
                <input
                  id="edit-matter-deadline-desc-input"
                  type="text"
                  value={nextDeadlineDescription}
                  onChange={(e) => setNextDeadlineDescription(e.target.value)}
                  placeholder="Action item or hearing milestone description"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: COUNSEL & STATUS */}
          {activeTab === 'team' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Lead / Responsible Advocate <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="edit-matter-advocate-select"
                    value={responsibleAdvocateId}
                    onChange={(e) => setResponsibleAdvocateId(e.target.value)}
                    disabled={!canAssignMatters}
                    className={`w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none ${
                      !canAssignMatters ? 'bg-stone-100 cursor-not-allowed opacity-80' : 'cursor-pointer'
                    }`}
                  >
                    {staffList.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name} ({adv.title || adv.role})
                      </option>
                    ))}
                  </select>
                  {!canAssignMatters && (
                    <p className="text-[10px] text-amber-800 mt-1 font-medium">
                      Only Managing Advocate and System Admin can reassign responsible counsel.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Matter Status
                  </label>
                  <select
                    id="edit-matter-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MatterStatus)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none font-semibold"
                  >
                    <option value="Active - In Court">Active - In Court</option>
                    <option value="Filing Pending">Filing Pending</option>
                    <option value="Interlocutory">Interlocutory</option>
                    <option value="Settlement Negotiation">Settlement Negotiation</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Priority with Distinct Colors */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Matter Priority
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setPriority('Low')}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border text-xs transition-all cursor-pointer ${
                      priority === 'Low'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold ring-2 ring-emerald-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${priority === 'Low' ? 'text-white' : 'text-emerald-600'}`} />
                      <span>Low Priority</span>
                    </div>
                    <span className={`text-[10px] mt-0.5 ${priority === 'Low' ? 'text-emerald-100' : 'text-emerald-700 font-normal'}`}>
                      Standard
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('Medium')}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border text-xs transition-all cursor-pointer ${
                      priority === 'Medium'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs font-bold ring-2 ring-amber-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${priority === 'Medium' ? 'text-white' : 'text-amber-600'}`} />
                      <span>Medium Priority</span>
                    </div>
                    <span className={`text-[10px] mt-0.5 ${priority === 'Medium' ? 'text-amber-100' : 'text-amber-700 font-normal'}`}>
                      Normal Track
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('High')}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border text-xs transition-all cursor-pointer ${
                      priority === 'High'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold ring-2 ring-rose-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`h-3.5 w-3.5 ${priority === 'High' ? 'text-white' : 'text-rose-600'}`} />
                      <span>High Priority</span>
                    </div>
                    <span className={`text-[10px] mt-0.5 ${priority === 'High' ? 'text-rose-100' : 'text-rose-700 font-normal'}`}>
                      Urgent / Court
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS & BILLING */}
          {activeTab === 'financials' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Agreed / Estimated Fee (KES)
                  </label>
                  <input
                    id="edit-matter-fee-input"
                    type="number"
                    min="0"
                    step="1000"
                    disabled={feeToBeDiscussedLater}
                    placeholder={feeToBeDiscussedLater ? 'Fee to be discussed later' : 'Enter agreed fee amount'}
                    value={feeToBeDiscussedLater ? '' : estimatedFeeKES}
                    onChange={(e) => setEstimatedFeeKES(e.target.value)}
                    className={`w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none font-medium ${
                      feeToBeDiscussedLater ? 'bg-stone-100 text-stone-400 cursor-not-allowed italic' : 'bg-white'
                    }`}
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                    <input
                      id="edit-matter-fee-tbd-checkbox"
                      type="checkbox"
                      checked={feeToBeDiscussedLater}
                      onChange={(e) => {
                        setFeeToBeDiscussedLater(e.target.checked);
                        if (e.target.checked) setEstimatedFeeKES('');
                      }}
                      className="h-3.5 w-3.5 rounded border-stone-300 text-[#0B2840] focus:ring-[#0B2840]"
                    />
                    <span className="text-[11px] text-stone-600 font-medium">Fee to be discussed later / TBD</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Billed to Date (KES)
                  </label>
                  <input
                    id="edit-matter-billed-fee-input"
                    type="number"
                    min="0"
                    step="1000"
                    value={billedKES}
                    onChange={(e) => setBilledKES(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Paid / Collected (KES)
                  </label>
                  <input
                    id="edit-matter-paid-fee-input"
                    type="number"
                    min="0"
                    step="1000"
                    value={paidKES}
                    onChange={(e) => setPaidKES(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <span className="text-[11px] text-stone-500 italic">
              Changes will be synchronized across all chambers registers
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 font-semibold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="edit-matter-save-button"
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0B2840] text-amber-300 font-bold text-xs hover:bg-[#081d2e] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </DraggableModal>
    </div>
  );
};
