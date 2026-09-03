import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  HelpCircle,
  FileText,
  Calendar,
  AlertTriangle,
  UserCheck,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Paperclip,
} from 'lucide-react';
import {
  ClientInteraction,
  ClientInteractionType,
  InteractionChannel,
  InteractionDirection,
  InteractionPriority,
  InteractionStatus,
  EnquiryCategory,
  ComplaintCategory,
  ComplaintSeverity,
  ClientRequestType,
  Client,
  LegalMatter,
  Advocate,
} from '../../types';
import { generateInteractionId, createAuditLogEntry } from '../../utils/clientServicesStorage';

interface NewInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (interaction: ClientInteraction, saveAndNew?: boolean) => void;
  initialType?: ClientInteractionType;
  clients: Client[];
  matters: LegalMatter[];
  advocates: Advocate[];
  currentAdvocate: Advocate;
  editingInteraction?: ClientInteraction | null;
}

export const NewInteractionModal: React.FC<NewInteractionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'Call',
  clients,
  matters,
  advocates,
  currentAdvocate,
  editingInteraction,
}) => {
  const isEditing = !!editingInteraction;

  // Form State
  const [interactionType, setInteractionType] = useState<ClientInteractionType>(initialType);
  const [subtype, setSubtype] = useState<string>('Incoming Call');
  const [channel, setChannel] = useState<InteractionChannel>('Phone');
  const [direction, setDirection] = useState<InteractionDirection>('Incoming');
  const [status, setStatus] = useState<InteractionStatus>('Open');
  const [priority, setPriority] = useState<InteractionPriority>('Normal');
  const [isConfidential, setIsConfidential] = useState<boolean>(false);

  // Client Linkage
  const [isExistingClient, setIsExistingClient] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [kraPin, setKraPin] = useState<string>('');

  // Matter Linkage
  const [selectedMatterId, setSelectedMatterId] = useState<string>('');
  const [matterRef, setMatterRef] = useState<string>('');
  const [matterTitle, setMatterTitle] = useState<string>('');

  // Staff handling
  const [handledById, setHandledById] = useState<string>(currentAdvocate.id);
  const [handledByName, setHandledByName] = useState<string>(currentAdvocate.name);
  const [assignedStaffId, setAssignedStaffId] = useState<string>(currentAdvocate.id);
  const [assignedStaffName, setAssignedStaffName] = useState<string>(currentAdvocate.name);

  // Content
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [clientRequestOrEnquiry, setClientRequestOrEnquiry] = useState<string>('');
  const [responseProvided, setResponseProvided] = useState<string>('');
  const [outcome, setOutcome] = useState<string>('');
  const [actionRequired, setActionRequired] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(10);

  // Follow-up
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpAssignedToId, setFollowUpAssignedToId] = useState<string>(currentAdvocate.id);
  const [followUpAssignedToName, setFollowUpAssignedToName] = useState<string>(currentAdvocate.name);
  const [followUpDueDate, setFollowUpDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [followUpNotes, setFollowUpNotes] = useState<string>('');

  // Enquiry Specific
  const [enquiryCategory, setEnquiryCategory] = useState<EnquiryCategory>('General Enquiry');
  const [enquirySource, setEnquirySource] = useState<
    'Phone Call' | 'Walk-in' | 'Email' | 'Website' | 'WhatsApp' | 'Referral' | 'LSK Directory'
  >('Phone Call');
  const [enquiryDeadline, setEnquiryDeadline] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );

  // Complaint Specific
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('Communication Delay');
  const [complaintSeverity, setComplaintSeverity] = useState<ComplaintSeverity>('Medium');
  const [complaintInvestigationNotes, setComplaintInvestigationNotes] = useState<string>('');

  // Walk-in Specific
  const [visitorPassNumber, setVisitorPassNumber] = useState<string>(
    `VIS-${Math.floor(100 + Math.random() * 900)}`
  );
  const [visitorIdNumber, setVisitorIdNumber] = useState<string>('');
  const [hostAdvocateName, setHostAdvocateName] = useState<string>(currentAdvocate.name);

  // Sync with initial or editing data
  useEffect(() => {
    if (editingInteraction) {
      setInteractionType(editingInteraction.interactionType);
      setSubtype(editingInteraction.subtype || '');
      setChannel(editingInteraction.channel);
      setDirection(editingInteraction.direction);
      setStatus(editingInteraction.status);
      setPriority(editingInteraction.priority);
      setIsConfidential(!!editingInteraction.isConfidential);

      setIsExistingClient(editingInteraction.isExistingClient);
      setSelectedClientId(editingInteraction.clientId || '');
      setClientName(editingInteraction.clientName || '');
      setContactPerson(editingInteraction.contactPerson || '');
      setPhoneNumber(editingInteraction.phoneNumber || '');
      setEmail(editingInteraction.email || '');
      setCompanyName(editingInteraction.companyName || '');
      setKraPin(editingInteraction.kraPin || '');

      setSelectedMatterId(editingInteraction.matterId || '');
      setMatterRef(editingInteraction.matterRef || '');
      setMatterTitle(editingInteraction.matterTitle || '');

      setHandledById(editingInteraction.handledById);
      setHandledByName(editingInteraction.handledByName);
      setAssignedStaffId(editingInteraction.assignedStaffId || editingInteraction.handledById);
      setAssignedStaffName(editingInteraction.assignedStaffName || editingInteraction.handledByName);

      setSubject(editingInteraction.subject);
      setDescription(editingInteraction.description);
      setClientRequestOrEnquiry(editingInteraction.clientRequestOrEnquiry || '');
      setResponseProvided(editingInteraction.responseProvided || '');
      setOutcome(editingInteraction.outcome || '');
      setActionRequired(editingInteraction.actionRequired || '');
      setInternalNotes(editingInteraction.internalNotes || '');
      setDurationMinutes(editingInteraction.durationMinutes || 10);

      setFollowUpRequired(editingInteraction.followUpRequired);
      setFollowUpAssignedToId(editingInteraction.followUpAssignedToId || currentAdvocate.id);
      setFollowUpAssignedToName(editingInteraction.followUpAssignedToName || currentAdvocate.name);
      setFollowUpDueDate(
        editingInteraction.followUpDueDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
      );
      setFollowUpNotes(editingInteraction.followUpNotes || '');

      if (editingInteraction.enquiryCategory) setEnquiryCategory(editingInteraction.enquiryCategory);
      if (editingInteraction.enquirySource) setEnquirySource(editingInteraction.enquirySource);
      if (editingInteraction.enquiryDeadline) setEnquiryDeadline(editingInteraction.enquiryDeadline);

      if (editingInteraction.complaintCategory) setComplaintCategory(editingInteraction.complaintCategory);
      if (editingInteraction.complaintSeverity) setComplaintSeverity(editingInteraction.complaintSeverity);
      if (editingInteraction.complaintInvestigationNotes)
        setComplaintInvestigationNotes(editingInteraction.complaintInvestigationNotes);

      if (editingInteraction.visitorPassNumber) setVisitorPassNumber(editingInteraction.visitorPassNumber);
      if (editingInteraction.visitorIdNumber) setVisitorIdNumber(editingInteraction.visitorIdNumber);
      if (editingInteraction.hostAdvocateName) setHostAdvocateName(editingInteraction.hostAdvocateName);
    } else {
      const targetType: ClientInteractionType = (initialType as ClientInteractionType) || 'Call';
      setInteractionType(targetType);
      resetFormForType(targetType);
    }
  }, [editingInteraction, initialType, isOpen]);

  const resetFormForType = (type: ClientInteractionType) => {
    setInteractionType(type);
    if (type === 'Call') {
      setSubtype('Incoming Call');
      setChannel('Phone');
      setDirection('Incoming');
    } else if (type === 'Enquiry') {
      setSubtype('Legal Service Enquiry');
      setChannel('Phone');
      setDirection('Incoming');
    } else if (type === 'Client Request') {
      setSubtype('Case Update');
      setChannel('Phone');
      setDirection('Incoming');
    } else if (type === 'Appointment') {
      setSubtype('New Consultation');
      setChannel('In-Person / Reception');
      setDirection('Incoming');
      setDurationMinutes(45);
    } else if (type === 'Complaint / Feedback') {
      setSubtype('Communication Delay');
      setChannel('Phone');
      setDirection('Incoming');
      setPriority('High');
    } else if (type === 'Walk-in Visitor') {
      setSubtype('Visitor Check-in');
      setChannel('In-Person / Reception');
      setDirection('Incoming');
      setDurationMinutes(30);
    } else if (type === 'WhatsApp') {
      setSubtype('WhatsApp Message');
      setChannel('WhatsApp');
      setDirection('Incoming');
    } else if (type === 'Email') {
      setSubtype('Email Correspondence');
      setChannel('Email');
      setDirection('Incoming');
    }
  };

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setContactPerson(client.contactPerson);
      setPhoneNumber(client.phone);
      setEmail(client.email);
      setCompanyName(client.type === 'Corporate' ? client.name : '');
      setKraPin(client.kraPin);

      // Auto-filter or select first matter for this client
      const clientMatters = matters.filter((m) => m.clientId === clientId || m.clientName === client.name);
      if (clientMatters.length > 0) {
        setSelectedMatterId(clientMatters[0].id);
        setMatterRef(clientMatters[0].referenceNumber);
        setMatterTitle(clientMatters[0].title);
        setAssignedStaffId(clientMatters[0].responsibleAdvocateId || currentAdvocate.id);
        setAssignedStaffName(clientMatters[0].responsibleAdvocateName || currentAdvocate.name);
      } else {
        setSelectedMatterId('');
        setMatterRef('');
        setMatterTitle('');
      }
    }
  };

  // Handle matter selection
  const handleMatterSelect = (mId: string) => {
    setSelectedMatterId(mId);
    const matter = matters.find((m) => m.id === mId);
    if (matter) {
      setMatterRef(matter.referenceNumber);
      setMatterTitle(matter.title);
      if (!selectedClientId && matter.clientId) {
        handleClientSelect(matter.clientId);
      }
      if (matter.responsibleAdvocateName) {
        setAssignedStaffId(matter.responsibleAdvocateId || currentAdvocate.id);
        setAssignedStaffName(matter.responsibleAdvocateName);
      }
    } else {
      setMatterRef('');
      setMatterTitle('');
    }
  };

  const handleStaffChange = (advId: string) => {
    setAssignedStaffId(advId);
    const adv = advocates.find((a) => a.id === advId);
    if (adv) {
      setAssignedStaffName(adv.name);
      if (followUpRequired) {
        setFollowUpAssignedToId(adv.id);
        setFollowUpAssignedToName(adv.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent, saveAndNew = false) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert('Please enter a subject for the interaction.');
      return;
    }
    if (!clientName.trim()) {
      alert('Please provide a client or prospective client name.');
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toISOString().slice(0, 10);

    const auditEntry = createAuditLogEntry(
      currentAdvocate.id,
      currentAdvocate.name,
      currentAdvocate.title,
      isEditing ? 'Updated' : 'Created',
      {
        notes: isEditing
          ? `Updated interaction details for ${interactionType}`
          : `Recorded new ${interactionType} interaction (${direction})`,
      }
    );

    const newRecord: ClientInteraction = {
      id: editingInteraction ? editingInteraction.id : generateInteractionId(),
      interactionType,
      subtype,
      date: editingInteraction ? editingInteraction.date : formattedDate,
      time: editingInteraction ? editingInteraction.time : formattedTime,
      durationMinutes,
      channel,
      direction,
      status,
      priority,
      isConfidential,

      clientId: isExistingClient ? selectedClientId || undefined : undefined,
      clientName: clientName.trim(),
      isExistingClient,
      isProspectiveClient: !isExistingClient,
      contactPerson: contactPerson.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
      companyName: companyName.trim() || undefined,
      kraPin: kraPin.trim() || undefined,

      matterId: selectedMatterId || undefined,
      matterRef: matterRef || undefined,
      matterTitle: matterTitle || undefined,

      handledById,
      handledByName,
      assignedStaffId,
      assignedStaffName,

      subject: subject.trim(),
      description: description.trim(),
      clientRequestOrEnquiry: clientRequestOrEnquiry.trim() || undefined,
      responseProvided: responseProvided.trim() || undefined,
      outcome: outcome.trim() || undefined,
      actionRequired: actionRequired.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,

      followUpRequired,
      followUpAssignedToId: followUpRequired ? followUpAssignedToId : undefined,
      followUpAssignedToName: followUpRequired ? followUpAssignedToName : undefined,
      followUpDueDate: followUpRequired ? followUpDueDate : undefined,
      followUpStatus: followUpRequired ? 'Pending' : undefined,
      followUpNotes: followUpRequired ? followUpNotes.trim() || undefined : undefined,

      enquiryCategory: interactionType === 'Enquiry' ? enquiryCategory : undefined,
      enquirySource: interactionType === 'Enquiry' ? enquirySource : undefined,
      enquiryStatus: interactionType === 'Enquiry' ? 'Assigned' : undefined,
      enquiryDeadline: interactionType === 'Enquiry' ? enquiryDeadline : undefined,

      complaintCategory: interactionType === 'Complaint / Feedback' ? complaintCategory : undefined,
      complaintSeverity: interactionType === 'Complaint / Feedback' ? complaintSeverity : undefined,
      complaintStatus: interactionType === 'Complaint / Feedback' ? 'Received' : undefined,
      complaintInvestigationNotes:
        interactionType === 'Complaint / Feedback' ? complaintInvestigationNotes.trim() || undefined : undefined,

      visitorPassNumber: interactionType === 'Walk-in Visitor' ? visitorPassNumber : undefined,
      visitorIdNumber: interactionType === 'Walk-in Visitor' ? visitorIdNumber : undefined,
      checkInTime: interactionType === 'Walk-in Visitor' ? formattedTime : undefined,
      hostAdvocateName: interactionType === 'Walk-in Visitor' ? hostAdvocateName : undefined,

      createdBy: editingInteraction ? editingInteraction.createdBy : currentAdvocate.name,
      createdDate: editingInteraction ? editingInteraction.createdDate : now.toISOString(),
      lastModifiedBy: currentAdvocate.name,
      lastModifiedDate: now.toISOString(),
      auditTrail: editingInteraction
        ? [auditEntry, ...(editingInteraction.auditTrail || [])]
        : [auditEntry],
    };

    onSave(newRecord, saveAndNew);

    if (saveAndNew) {
      setSubject('');
      setDescription('');
      setClientRequestOrEnquiry('');
      setResponseProvided('');
      setActionRequired('');
      setFollowUpNotes('');
      setVisitorPassNumber(`VIS-${Math.floor(100 + Math.random() * 900)}`);
      setVisitorIdNumber('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-gradient-to-r from-[#132c3f] to-[#1c4766] text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 border border-white/20">
              {interactionType === 'Call' && <Phone className="h-5 w-5" />}
              {interactionType === 'Enquiry' && <HelpCircle className="h-5 w-5" />}
              {interactionType === 'Client Request' && <FileText className="h-5 w-5" />}
              {interactionType === 'Appointment' && <Calendar className="h-5 w-5" />}
              {interactionType === 'Complaint / Feedback' && <AlertTriangle className="h-5 w-5" />}
              {interactionType === 'Walk-in Visitor' && <Building2 className="h-5 w-5" />}
              {!['Call', 'Enquiry', 'Client Request', 'Appointment', 'Complaint / Feedback', 'Walk-in Visitor'].includes(
                interactionType
              ) && <Send className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-title">
                {isEditing ? 'Edit Client Interaction' : 'Record Client Interaction'}
              </h2>
              <p className="text-xs text-blue-200">
                Centralized registry for calls, enquiries, requests, visits & complaints
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form
          id="client-interaction-form"
          onSubmit={(e) => handleSubmit(e, false)}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-stone-800"
        >
          {/* Top Selection: Interaction Category & Subtype */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
            <label className="block text-[11px] font-bold tracking-wider text-stone-500">
              Interaction Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { type: 'Call', label: 'Call Log', icon: Phone },
                { type: 'Enquiry', label: 'Enquiry', icon: HelpCircle },
                { type: 'Client Request', label: 'Request', icon: FileText },
                { type: 'Appointment', label: 'Appointment', icon: Calendar },
                { type: 'Complaint / Feedback', label: 'Complaint', icon: AlertTriangle },
                { type: 'Walk-in Visitor', label: 'Walk-in', icon: Building2 },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => resetFormForType(item.type as ClientInteractionType)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    interactionType === item.type
                      ? 'border-[#0B63E5] bg-[#0B63E5] text-white shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <item.icon className="h-4 w-4 mb-1" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Subtype / Action</label>
                <select
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                >
                  {interactionType === 'Call' && (
                    <>
                      <option value="Incoming Call">Incoming Call</option>
                      <option value="Outgoing Call">Outgoing Call</option>
                      <option value="Missed Call">Missed Call</option>
                      <option value="Callback Request">Callback Request</option>
                    </>
                  )}
                  {interactionType === 'Enquiry' && (
                    <>
                      <option value="Legal Service Enquiry">Legal Service Enquiry</option>
                      <option value="New Client Onboarding">New Client Onboarding</option>
                      <option value="Fee Estimate / Quotation">Fee Estimate / Quotation</option>
                      <option value="Case Status Enquiry">Case Status Enquiry</option>
                      <option value="General Enquiry">General Enquiry</option>
                    </>
                  )}
                  {interactionType === 'Client Request' && (
                    <>
                      <option value="Case Update">Case Update</option>
                      <option value="Document Copy">Document Copy</option>
                      <option value="Speak with Advocate">Speak with Advocate</option>
                      <option value="Fee Note / Receipt Copy">Fee Note / Receipt Copy</option>
                      <option value="Certified True Copies">Certified True Copies</option>
                      <option value="Other Request">Other Request</option>
                    </>
                  )}
                  {interactionType === 'Appointment' && (
                    <>
                      <option value="New Consultation">New Consultation</option>
                      <option value="Case Briefing">Case Briefing</option>
                      <option value="Document Execution / Signing">Document Execution / Signing</option>
                      <option value="Chambers Meeting">Chambers Meeting</option>
                      <option value="Virtual / Zoom Conference">Virtual / Zoom Conference</option>
                    </>
                  )}
                  {interactionType === 'Complaint / Feedback' && (
                    <>
                      <option value="Communication Delay">Communication Delay</option>
                      <option value="Fee / Billing Dispute">Fee / Billing Dispute</option>
                      <option value="Service Quality">Service Quality</option>
                      <option value="Court Filing Delay">Court Filing Delay</option>
                      <option value="Staff Conduct">Staff Conduct</option>
                    </>
                  )}
                  {interactionType === 'Walk-in Visitor' && (
                    <>
                      <option value="Visitor Check-in">Visitor Check-in</option>
                      <option value="Document Delivery / Drop-off">Document Delivery / Drop-off</option>
                      <option value="Walk-in Consultation">Walk-in Consultation</option>
                      <option value="Vendor / Service Provider">Vendor / Service Provider</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 mb-1">Communication Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as InteractionChannel)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                >
                  <option value="Phone">Phone Call</option>
                  <option value="In-Person / Reception">In-Person / Reception</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="Web Portal">Web Portal</option>
                  <option value="Postal Letter">Postal Letter</option>
                  <option value="Court / Registry Encounter">Court / Registry Encounter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 mb-1">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as InteractionDirection)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                >
                  <option value="Incoming">Incoming (Client → Firm)</option>
                  <option value="Outgoing">Outgoing (Firm → Client)</option>
                  <option value="Internal">Internal Note</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as InteractionPriority)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent / Immediate Action</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Client & Matter Identification */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
              <span className="text-[11px] font-bold tracking-wider text-stone-600 flex items-center space-x-1.5">
                <UsersIcon className="h-3.5 w-3.5 text-[#0B63E5]" />
                <span>Client & Matter Identification</span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExistingClient(true);
                    if (clients.length > 0 && !selectedClientId) {
                      handleClientSelect(clients[0].id);
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    isExistingClient
                      ? 'bg-[#132c3f] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Existing Client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExistingClient(false);
                    setSelectedClientId('');
                    setSelectedMatterId('');
                    setMatterRef('');
                    setMatterTitle('');
                  }}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    !isExistingClient
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Prospective Client / New Intake
                </button>
              </div>
            </div>

            {isExistingClient ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Select Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    required
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type} • {c.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Related Case / Legal Matter (Optional)
                  </label>
                  <select
                    value={selectedMatterId}
                    onChange={(e) => handleMatterSelect(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  >
                    <option value="">-- General Firm Interaction (No specific matter) --</option>
                    {matters
                      .filter((m) => !selectedClientId || m.clientId === selectedClientId || m.clientName === clientName)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.referenceNumber}: {m.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Prospective Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Dr. James Mwangi / Apex Energy Ltd"
                    required
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Nairobi Spine Clinic Ltd"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Mary Wanjiku"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@domain.co.ke"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">KRA PIN (If available)</label>
                  <input
                    type="text"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                    placeholder="P05XXXXXXXX"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Quick Contact & Matter summary pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {phoneNumber && (
                <span className="inline-flex items-center space-x-1 rounded-md bg-stone-100 px-2.5 py-1 text-[11px] text-stone-700 font-mono">
                  <Phone className="h-3 w-3 text-stone-400" />
                  <span>{phoneNumber}</span>
                </span>
              )}
              {email && (
                <span className="inline-flex items-center space-x-1 rounded-md bg-stone-100 px-2.5 py-1 text-[11px] text-stone-700 font-mono">
                  <span>{email}</span>
                </span>
              )}
              {matterRef && (
                <span className="inline-flex items-center space-x-1 rounded-md bg-blue-50 text-[#0B63E5] border border-blue-200 px-2.5 py-1 text-[11px] font-semibold">
                  <Briefcase className="h-3 w-3" />
                  <span>{matterRef}</span>
                </span>
              )}
            </div>
          </div>

          {/* Section: Interaction Subject, Content & Discussion */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-stone-600 block border-b border-stone-100 pb-2">
              Interaction Details & Notes
            </span>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block font-semibold text-stone-700 mb-1">
                  Subject / Summary Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Urgent status inquiry on High Court injunction ruling"
                  required
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 5)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Detailed Discussion / Interaction Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Record what was discussed during the call, meeting or visit..."
                className="w-full rounded-lg border border-stone-300 p-3 text-xs focus:border-[#0B63E5] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Client's Specific Request / Enquiry
                </label>
                <input
                  type="text"
                  value={clientRequestOrEnquiry}
                  onChange={(e) => setClientRequestOrEnquiry(e.target.value)}
                  placeholder="e.g. Provide extracted court order before 3:00 PM"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Response / Advice Provided</label>
                <input
                  type="text"
                  value={responseProvided}
                  onChange={(e) => setResponseProvided(e.target.value)}
                  placeholder="e.g. Advised that Advocate Kimathi is in court and will transmit document"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Action Required</label>
                <input
                  type="text"
                  value={actionRequired}
                  onChange={(e) => setActionRequired(e.target.value)}
                  placeholder="e.g. Download CTS receipt and email to Safaricom Legal"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Assigned Staff / Lead Advocate
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => handleStaffChange(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                >
                  {advocates.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name} ({adv.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Type-Specific Modules */}
          {interactionType === 'Enquiry' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <span className="text-[11px] font-bold tracking-wider text-amber-900 block border-b border-amber-200/60 pb-1.5">
                Enquiry Management Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Enquiry Category</label>
                  <select
                    value={enquiryCategory}
                    onChange={(e) => setEnquiryCategory(e.target.value as EnquiryCategory)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
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
                  <label className="block font-semibold text-stone-700 mb-1">Lead Source</label>
                  <select
                    value={enquirySource}
                    onChange={(e) => setEnquirySource(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Email">Email</option>
                    <option value="Website">Website Intake</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Referral">Client Referral</option>
                    <option value="LSK Directory">LSK Directory</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Response SLA Deadline</label>
                  <input
                    type="date"
                    value={enquiryDeadline}
                    onChange={(e) => setEnquiryDeadline(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {interactionType === 'Complaint / Feedback' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-1.5">
                <span className="text-[11px] font-bold tracking-wider text-rose-900 flex items-center space-x-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                  <span>Complaint & Quality Assurance Controls</span>
                </span>
                <label className="flex items-center space-x-2 text-xs text-rose-900 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Confidential / Restricted to Partners</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Complaint Category</label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value as ComplaintCategory)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="Communication Delay">Communication Delay</option>
                    <option value="Fee / Billing Dispute">Fee / Billing Dispute</option>
                    <option value="Service Quality">Service Quality</option>
                    <option value="Court Filing Delay">Court Filing Delay</option>
                    <option value="Staff Conduct">Staff Conduct</option>
                    <option value="Document Error">Document Error</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Severity Rating</label>
                  <select
                    value={complaintSeverity}
                    onChange={(e) => setComplaintSeverity(e.target.value as ComplaintSeverity)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="Low">Low (Minor grievance)</option>
                    <option value="Medium">Medium (Attention required)</option>
                    <option value="High">High (Urgent partner escalation)</option>
                    <option value="Critical">Critical (Risk of formal dispute)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Investigation & Root Cause Notes
                </label>
                <textarea
                  rows={2}
                  value={complaintInvestigationNotes}
                  onChange={(e) => setComplaintInvestigationNotes(e.target.value)}
                  placeholder="Record internal investigation findings, staff involved, system delay logs..."
                  className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {interactionType === 'Walk-in Visitor' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <span className="text-[11px] font-bold tracking-wider text-blue-900 block border-b border-blue-200/60 pb-1.5">
                Front Desk Visitor Badging
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Visitor Pass #</label>
                  <input
                    type="text"
                    value={visitorPassNumber}
                    onChange={(e) => setVisitorPassNumber(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">National ID / Passport No.</label>
                  <input
                    type="text"
                    value={visitorIdNumber}
                    onChange={(e) => setVisitorIdNumber(e.target.value)}
                    placeholder="e.g. ID No. 28910442"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Host Advocate / Officer</label>
                  <input
                    type="text"
                    value={hostAdvocateName}
                    onChange={(e) => setHostAdvocateName(e.target.value)}
                    placeholder="e.g. Adv. Costa Kimathi"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Follow-up & Task Automation */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <label className="flex items-center space-x-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                />
                <span>Follow-up Action Required & Auto-Assign Task</span>
              </label>
              <span className="text-[10px] text-stone-500">
                Creates a linked task on the assigned staff member’s queue
              </span>
            </div>

            {followUpRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Assign Follow-up To</label>
                  <select
                    value={followUpAssignedToId}
                    onChange={(e) => {
                      setFollowUpAssignedToId(e.target.value);
                      const a = advocates.find((adv) => adv.id === e.target.value);
                      if (a) setFollowUpAssignedToName(a.name);
                    }}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    {advocates.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name} ({adv.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Follow-up Due Date</label>
                  <input
                    type="date"
                    value={followUpDueDate}
                    onChange={(e) => setFollowUpDueDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Follow-up Instructions</label>
                  <input
                    type="text"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. Call client back with hearing dates"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Internal Confidential Notes */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Internal Chambers Notes (Private)
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Private notes for chambers staff only (not visible to client)..."
              className="w-full rounded-lg border border-stone-300 p-2.5 text-xs focus:outline-hidden"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-stone-200 px-6 py-4 bg-stone-50 rounded-b-2xl gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-stone-500">
            <UserCheck className="h-4 w-4 text-[#0B63E5]" />
            <span>
              Recorded by: <strong className="text-stone-800">{currentAdvocate.name}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!isEditing && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="rounded-lg border border-[#0B63E5] bg-blue-50 px-4 py-2 text-xs font-semibold text-[#0B63E5] hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Save & New
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0256D0] transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isEditing ? 'Save Changes' : 'Save Interaction'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
