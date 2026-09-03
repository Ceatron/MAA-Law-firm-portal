import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  Building2,
  Calendar,
  User,
  DollarSign,
  Tag,
  Save,
  Check,
  AlertCircle,
  FileText,
  Gavel,
  CheckCircle2,
  Plus,
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

interface EditMatterModalProps {
  isOpen: boolean;
  matter: LegalMatter | null;
  onClose: () => void;
  onSaveMatter: (updatedMatter: LegalMatter) => void;
  clients?: Client[];
  advocates?: Advocate[];
}

export const EditMatterModal: React.FC<EditMatterModalProps> = ({
  isOpen,
  matter,
  onClose,
  onSaveMatter,
  clients = [],
  advocates = [],
}) => {
  const staffList = (advocates.length > 0 ? advocates : loadVisibleStaffRoster()).filter(
    (a) => !isSysAdminUser(a)
  );

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

  // Financials & Tags
  const [estimatedFeeKES, setEstimatedFeeKES] = useState<number | string>('');
  const [feeToBeDiscussedLater, setFeeToBeDiscussedLater] = useState(false);
  const [billedKES, setBilledKES] = useState<number | string>(0);
  const [paidKES, setPaidKES] = useState<number | string>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

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
      setTags(matter.tags || []);
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

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const presetTags = [
    'Urgent',
    'High Value',
    'Commercial',
    'ArdhiSasa',
    'Court of Appeal',
    'Supreme Court',
    'Pro Bono',
    'Injunction',
    'Mediation',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Matter title is required.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage('Client name is required.');
      return;
    }

    const assignedStaff = staffList.find((a) => a.id === responsibleAdvocateId) || {
      id: responsibleAdvocateId,
      name: matter.responsibleAdvocateName,
    };

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
      tags,
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

      <div
        id="edit-matter-modal-container"
        className="relative w-full max-w-3xl rounded-xl border border-stone-300 bg-[#fbf9f4] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#16181b] px-6 py-4 text-white shrink-0">
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
            { id: 'financials', label: 'Financials & Tags', icon: DollarSign },
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: GENERAL & PARTIES */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Matter Title / Subject <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="edit-matter-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Kenya Commercial Bank Ltd v. Mwangi Holdings Ltd"
                      required
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 font-medium focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Firm Workspace Ref Number
                    </label>
                    <input
                      id="edit-matter-ref-input"
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. MAA/HC/COM/2026/0142"
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
                          placeholder="Client Name or Corporate Entity"
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
                        placeholder="Client Name"
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
                      placeholder="e.g. ABC Corporation / John Doe"
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
                    placeholder="Brief background of dispute, key prayers, commercial terms, or advisory scope..."
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
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
                      Court Registry / Forum
                    </label>
                    <input
                      id="edit-matter-registry-input"
                      type="text"
                      value={courtRegistry}
                      onChange={(e) => setCourtRegistry(e.target.value)}
                      placeholder="e.g. High Court Commercial & Tax Division - Milimani"
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
                      placeholder="e.g. Civil Suit No. E142 of 2026"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
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
                      placeholder="e.g. CTS-2026-NBI-4892"
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
                    placeholder="e.g. File and serve written submissions within 14 days"
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
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                    >
                      {staffList.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          {adv.name} ({adv.title || adv.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Matter Priority
                    </label>
                    <select
                      id="edit-matter-priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as MatterPriority)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:outline-none"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Matter Lifecycle Status
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
                    <option value="Completed">Completed / Concluded</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Changing status updates the active case file register and associated diary workflows.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: FINANCIALS & TAGS */}
            {activeTab === 'financials' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-800">
                        Estimated Agreed Fee (KES)
                      </label>
                      {feeToBeDiscussedLater && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Fee TBD
                        </span>
                      )}
                    </div>
                    <input
                      id="edit-matter-est-fee-input"
                      type="number"
                      min="0"
                      step="1000"
                      disabled={feeToBeDiscussedLater}
                      placeholder={feeToBeDiscussedLater ? 'Fee to be discussed later' : 'e.g. 150000'}
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

                {/* Tags Management */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Matter Tags & Classification
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      id="edit-matter-new-tag-input"
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(newTagInput);
                        }
                      }}
                      placeholder="Type a custom tag and press Enter"
                      className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
                    />
                    <button
                      id="edit-matter-add-tag-button"
                      type="button"
                      onClick={() => handleAddTag(newTagInput)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 text-white font-semibold text-xs hover:bg-stone-700 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Active Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px] p-2 bg-white rounded-lg border border-stone-200">
                    {tags.length === 0 ? (
                      <span className="text-[11px] text-stone-400 italic">No tags assigned</span>
                    ) : (
                      tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300"
                        >
                          <Tag className="h-2.5 w-2.5 opacity-60" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="ml-1 text-amber-700 hover:text-rose-600 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Suggested Preset Tags */}
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold block mb-1">
                      Quick Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {presetTags.map((pt) => {
                        const isSelected = tags.includes(pt);
                        return (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => (isSelected ? handleRemoveTag(pt) : handleAddTag(pt))}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition cursor-pointer ${
                              isSelected
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {pt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-stone-200 bg-[#f4f0e6] px-6 py-3.5 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-stone-500">
              Editing matter will update the firm workspace register, calendar, and financials.
            </div>

            <div className="flex items-center gap-2">
              <button
                id="edit-matter-cancel-button"
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="edit-matter-save-button"
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-[#0B2840] hover:bg-[#071E30] px-5 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
