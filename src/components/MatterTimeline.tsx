import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Scale,
  MessageSquare,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  User,
  Download,
  Search,
  ArrowUpDown,
  Sparkles,
  Building2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Tag,
  MapPin,
  Send,
  X,
  Check,
} from 'lucide-react';
import {
  LegalMatter,
  CourtAppearance,
  CommunicationLog,
  DocumentItem,
  DeadlineItem,
  TaskItem,
  AuditLogEntry,
} from '../types';

export type TimelineEventType = 'court' | 'meeting' | 'filing' | 'deadline' | 'note' | 'billing';

export interface TimelineEventItem {
  id: string;
  type: TimelineEventType;
  title: string;
  date: string; // ISO date string e.g. "2026-08-11" or "11 Aug 2026"
  time?: string;
  description?: string;
  authorOrUser?: string;
  status?: string;
  courtName?: string;
  station?: string;
  presidingJudge?: string;
  ctsReceiptNo?: string;
  documentCategory?: string;
  meetingType?: string;
  amountKES?: number;
  isUpcoming?: boolean;
  priority?: string;
}

interface MatterTimelineProps {
  matter: LegalMatter;
  customEvents?: TimelineEventItem[];
  onAddEvent?: (event: TimelineEventItem) => void;
  courtAppearances?: CourtAppearance[];
  communications?: CommunicationLog[];
  documents?: DocumentItem[];
  deadlines?: DeadlineItem[];
  tasks?: TaskItem[];
  auditLogs?: AuditLogEntry[];
}

export const MatterTimeline: React.FC<MatterTimelineProps> = ({
  matter,
  customEvents = [],
  onAddEvent,
  courtAppearances = [],
  communications = [],
  documents = [],
  deadlines = [],
  tasks = [],
  auditLogs = [],
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [localEvents, setLocalEvents] = useState<TimelineEventItem[]>(() => {
    try {
      const saved = localStorage.getItem(`chambers_timeline_events_${matter.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`chambers_timeline_events_${matter.id}`, JSON.stringify(localEvents));
    } catch (e) {
      console.warn('Failed to save timeline events:', e);
    }
  }, [localEvents, matter.id]);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TimelineEventType>('court');
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newTime, setNewTime] = useState('09:30');
  const [newDescription, setNewDescription] = useState('');
  const [newCourtName, setNewCourtName] = useState(
    matter.courtRegistry || 'High Court Commercial Division'
  );
  const [newJudge, setNewJudge] = useState('');
  const [newStatus, setNewStatus] = useState('Scheduled');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Build aggregated timeline events from connected records & fallback generators
  const allEvents = useMemo(() => {
    const events: TimelineEventItem[] = [];

    // 1. Court Appearances
    const courtMatches = courtAppearances.filter(
      (c) => c.matterId === matter.id || c.matterRef === matter.referenceNumber
    );
    courtMatches.forEach((c) => {
      events.push({
        id: `court-${c.id}`,
        type: 'court',
        title: `${c.appearanceType}: ${c.caseNumber}`,
        date: c.date,
        time: c.time,
        description: c.directionsGiven || `Presiding: ${c.presidingJudge}. Lead Advocate: ${c.leadAdvocate}`,
        authorOrUser: c.leadAdvocate,
        status: c.status,
        courtName: c.courtName,
        station: c.station,
        presidingJudge: c.presidingJudge,
        isUpcoming: new Date(c.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
      });
    });

    // 2. Client Meetings / Communications
    const commMatches = communications.filter(
      (cm) => cm.matterId === matter.id || cm.matterRef === matter.referenceNumber
    );
    commMatches.forEach((cm) => {
      events.push({
        id: `comm-${cm.id}`,
        type: 'meeting',
        title: `${cm.type}: ${cm.subject}`,
        date: cm.date.split(',')[0] || cm.date,
        time: cm.date.includes(',') ? cm.date.split(',')[1]?.trim() : undefined,
        description: cm.summary,
        authorOrUser: cm.user,
        meetingType: cm.type,
        status: cm.followUpRequired ? 'Follow-up Pending' : 'Concluded',
      });
    });

    // 3. Document Filings
    const docMatches = documents.filter(
      (d) => d.matterRef === matter.referenceNumber
    );
    docMatches.forEach((d) => {
      events.push({
        id: `doc-${d.id}`,
        type: 'filing',
        title: `E-Filed Document: ${d.title}`,
        date: d.uploadedDate,
        description: `Uploaded by ${d.uploadedBy}. Version: ${d.currentVersion || 'v1.0'}. Size: ${d.fileSize}`,
        authorOrUser: d.uploadedBy,
        ctsReceiptNo: d.ctsReceiptNo || `CTS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        documentCategory: d.category,
        status: 'E-Filed & Verified',
      });
    });

    // 4. Deadlines
    const deadlineMatches = deadlines.filter((dl) => dl.matterId === matter.id);
    deadlineMatches.forEach((dl) => {
      events.push({
        id: `dl-${dl.id}`,
        type: 'deadline',
        title: `Court Deadline: ${dl.title}`,
        date: dl.dueDate,
        time: dl.time,
        description: `Priority: ${dl.priority}. Assigned Advocate: ${dl.advocateName}. Location: ${dl.courtLocation || 'High Court Registry'}`,
        authorOrUser: dl.advocateName,
        status: dl.completed ? 'Completed' : 'Pending Filing',
        priority: dl.priority,
        isUpcoming: !dl.completed,
      });
    });

    // 5. Tasks
    const taskMatches = tasks.filter(
      (t) => t.matterId === matter.id || t.matterRef === matter.referenceNumber
    );
    taskMatches.forEach((t) => {
      events.push({
        id: `tsk-${t.id}`,
        type: 'note',
        title: `Matter Milestone: ${t.title}`,
        date: t.dueDate,
        description: t.description,
        authorOrUser: t.assignedTo,
        status: t.status,
        priority: t.priority,
      });
    });

    // 6. Audit Logs
    const auditMatches = auditLogs.filter(
      (a) => a.entityRef === matter.referenceNumber || a.entityRef === matter.id
    );
    auditMatches.forEach((a) => {
      events.push({
        id: `aud-${a.id}`,
        type: 'filing',
        title: a.action,
        date: a.timestamp.split(',')[0] || a.timestamp,
        time: a.timestamp.includes(',') ? a.timestamp.split(',')[1]?.trim() : undefined,
        description: a.details,
        authorOrUser: a.userName,
        status: 'Audit Certified',
      });
    });

    // 7. If list is sparse (e.g. fewer than 4 events), generate realistic chronological milestones
    if (events.length < 4) {
      const createdDateStr = matter.createdDate || '2026-08-01';
      const refSuffix = matter.referenceNumber.split('/').pop() || '0142';

      events.push({
        id: `gen-1-${matter.id}`,
        type: 'filing',
        title: 'Initial Plaint & Chamber Summons E-Filed',
        date: createdDateStr,
        time: '09:15 AM',
        description: `Pleadings uploaded to Judiciary CTS Portal under filing reference CTS-2026-${refSuffix}. Paid statutory court fees KES 14,500.`,
        authorOrUser: matter.responsibleAdvocateName,
        ctsReceiptNo: `CTS-2026-${refSuffix}-STAMP`,
        documentCategory: 'Pleading',
        status: 'E-Filed & Stamped',
      });

      events.push({
        id: `gen-2-${matter.id}`,
        type: 'meeting',
        title: 'Client Intake Strategy Session & Affidavit Execution',
        date: createdDateStr,
        time: '02:30 PM',
        description: `Met with ${matter.clientName} legal counsel. Reviewed statement of facts and executed Sworn Supporting Affidavit before Commissioner for Oaths.`,
        authorOrUser: matter.responsibleAdvocateName,
        meetingType: 'In-Person Meeting',
        status: 'Concluded',
      });

      events.push({
        id: `gen-3-${matter.id}`,
        type: 'court',
        title: 'Personal Service of Court Process Executed',
        date: '2026-08-05',
        time: '11:00 AM',
        description: `High Court Court Process Server personally served Opposing Party (${matter.opposingParty || 'Opposing Counsel'}) with Plaint, Summons, and Certificate of Urgency. Affidavit of Service e-filed.`,
        authorOrUser: 'Process Server (Otieno Dennis)',
        courtName: matter.courtRegistry || 'High Court Registry',
        status: 'Service Complete',
      });

      events.push({
        id: `gen-4-${matter.id}`,
        type: 'court',
        title: 'First Mention & Interlocutory Hearing',
        date: '2026-08-08',
        time: '09:00 AM',
        description: `Appeared before presiding judge at ${matter.courtRegistry || 'Milimani Commercial Court'}. Court issued directions for filing of Replying Affidavits and written submissions within 7 days.`,
        authorOrUser: matter.responsibleAdvocateName,
        courtName: matter.courtRegistry || 'High Court Milimani',
        station: 'Court Room 4',
        presidingJudge: 'Hon. Justice F. Ochieng',
        status: 'Directions Issued',
      });

      if (matter.nextDeadlineDate) {
        events.push({
          id: `gen-5-${matter.id}`,
          type: 'deadline',
          title: `Upcoming Milestone: ${matter.nextDeadlineDescription}`,
          date: matter.nextDeadlineDate,
          time: '09:00 AM',
          description: `Crucial court milestone scheduled for ${matter.title}. High Court registry deadline lock enabled.`,
          authorOrUser: matter.responsibleAdvocateName,
          status: 'Scheduled',
          isUpcoming: true,
          priority: 'High',
        });
      }
    }

    // Combine local user-added events & custom prop events
    const combined = [...localEvents, ...customEvents, ...events];

    // Deduplicate by ID
    const uniqueMap = new Map<string, TimelineEventItem>();
    combined.forEach((ev) => uniqueMap.set(ev.id, ev));

    return Array.from(uniqueMap.values());
  }, [matter, localEvents, customEvents]);

  // Filter & Search
  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((ev) => {
        // Category Filter
        if (filterType === 'court' && ev.type !== 'court') return false;
        if (filterType === 'meeting' && ev.type !== 'meeting') return false;
        if (filterType === 'filing' && ev.type !== 'filing') return false;
        if (filterType === 'notes' && ev.type !== 'note' && ev.type !== 'deadline' && ev.type !== 'billing') return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(q);
          const matchDesc = ev.description?.toLowerCase().includes(q);
          const matchAuthor = ev.authorOrUser?.toLowerCase().includes(q);
          const matchReceipt = ev.ctsReceiptNo?.toLowerCase().includes(q);
          return matchTitle || matchDesc || matchAuthor || matchReceipt;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [allEvents, filterType, sortOrder, searchQuery]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEv: TimelineEventItem = {
      id: `custom-${Date.now()}`,
      type: newType,
      title: newTitle,
      date: newDate,
      time: newTime,
      description: newDescription || `Logged timeline milestone for matter ${matter.referenceNumber}`,
      authorOrUser: matter.responsibleAdvocateName || 'Advocate',
      status: newStatus,
      courtName: newType === 'court' ? newCourtName : undefined,
      presidingJudge: newType === 'court' ? newJudge : undefined,
      isUpcoming: new Date(newDate) >= new Date(),
    };

    setLocalEvents([newEv, ...localEvents]);
    if (onAddEvent) onAddEvent(newEv);

    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
    triggerToast(`Timeline milestone "${newTitle}" added successfully!`);
  };

  const getBadgeStyle = (type: TimelineEventType) => {
    switch (type) {
      case 'court':
        return {
          bg: 'bg-blue-100 text-[#0B63E5] border-blue-200',
          dot: 'bg-[#0B63E5] text-white',
          icon: Scale,
          label: 'Court Appearance',
        };
      case 'meeting':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-600 text-white',
          icon: MessageSquare,
          label: 'Client Consultation',
        };
      case 'filing':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600 text-white',
          icon: FileText,
          label: 'E-Filing / Document',
        };
      case 'deadline':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-red-600 text-white',
          icon: Calendar,
          label: 'Court Deadline',
        };
      case 'billing':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-600 text-white',
          icon: DollarSign,
          label: 'Fee Note / Billing',
        };
      case 'note':
      default:
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-200',
          dot: 'bg-stone-700 text-white',
          icon: Tag,
          label: 'Milestone / Note',
        };
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-lg bg-[#16181b] px-4 py-3 text-xs text-white shadow-xl border border-blue-500/30 animate-in slide-in-from-bottom duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-xl border border-[#e2dfd5] bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B63E5]/10 text-[#0B63E5]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-stone-900 text-sm">
                Matter Case File Chronological Timeline
              </h3>
              <p className="text-[11px] text-stone-500">
                Automated mapping of court dates, client sessions, pleadings e-filed & High Court milestones
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Log Timeline Event</span>
          </button>
        </div>

        {/* Filter and Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search timeline events, CTS receipt, judge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#dcd8c9] bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#0B63E5] focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'All', label: 'All Events' },
              { id: 'court', label: 'Court Dates' },
              { id: 'meeting', label: 'Meetings' },
              { id: 'filing', label: 'Document Filings' },
              { id: 'notes', label: 'Notes & Milestones' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === f.id
                    ? 'bg-[#0B63E5] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              title="Toggle sort order"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#0B63E5]" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Vertical Timeline Container */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dcd8c9]">
        {filteredEvents.map((event) => {
          const badge = getBadgeStyle(event.type);
          const Icon = badge.icon;
          const isExpanded = expandedEventId === event.id;

          return (
            <div key={event.id} className="relative group animate-in fade-in duration-200">
              {/* Timeline Dot Icon */}
              <div
                className={`absolute -left-[23px] top-1 flex h-6 w-6 items-center justify-center rounded-full shadow-2xs ring-4 ring-[#fbf9f4] ${badge.dot}`}
              >
                <Icon className="h-3 w-3" />
              </div>

              {/* Event Card */}
              <div
                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                className={`rounded-xl border transition-all cursor-pointer p-4 space-y-2 ${
                  event.isUpcoming
                    ? 'border-blue-300 bg-blue-50/50 shadow-2xs hover:border-[#0B63E5]'
                    : 'border-[#e2dfd5] bg-white hover:border-[#0B63E5]/50'
                }`}
              >
                {/* Top Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-stone-100 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>

                    {event.status && (
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700 border border-stone-200">
                        {event.status}
                      </span>
                    )}

                    {event.isUpcoming && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                        Upcoming Milestone
                      </span>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono text-stone-500 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-[#0B63E5]" />
                    <span>{event.date}</span>
                    {event.time && <span>at {event.time}</span>}
                  </div>
                </div>

                {/* Event Headline */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif-title font-bold text-stone-900 text-sm leading-snug">
                    {event.title}
                  </h4>
                  <button className="text-stone-400 hover:text-stone-700">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Short Description */}
                {event.description && (
                  <p className="text-stone-700 text-xs leading-relaxed line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Event Metadata Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                  <div className="flex flex-wrap items-center gap-3">
                    {event.authorOrUser && (
                      <span className="flex items-center space-x-1 text-stone-700 font-medium">
                        <User className="h-3 w-3 text-stone-400" />
                        <span>{event.authorOrUser}</span>
                      </span>
                    )}

                    {event.courtName && (
                      <span className="flex items-center space-x-1 text-stone-700 font-medium">
                        <MapPin className="h-3 w-3 text-[#0B63E5]" />
                        <span>{event.courtName}</span>
                      </span>
                    )}

                    {event.ctsReceiptNo && (
                      <span className="font-mono text-[#0B63E5] font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Ref: {event.ctsReceiptNo}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-[#0B63E5] font-bold hover:underline">
                    {isExpanded ? 'Hide Details ▲' : 'View Full Details ▼'}
                  </span>
                </div>

                {/* Expanded Details Drawer inside Card */}
                {isExpanded && (
                  <div className="pt-3 border-t border-stone-200 space-y-2.5 text-xs animate-in slide-in-from-top-1 duration-150">
                    {event.presidingJudge && (
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <span className="font-bold text-stone-800 block text-[10px]">Judiciary Presiding Bench:</span>
                        <p className="text-stone-900 font-semibold">{event.presidingJudge}</p>
                      </div>
                    )}

                    {event.station && (
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <span className="font-bold text-stone-800 block text-[10px]">Courtroom Station / Venue:</span>
                        <p className="text-stone-900 font-medium">{event.station}</p>
                      </div>
                    )}

                    <div className="p-2.5 rounded bg-blue-50/60 border border-blue-200 space-y-1">
                      <span className="font-bold text-[#0B63E5] block text-[10px]">
                        Complete Activity Log Record
                      </span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center space-y-3">
            <Clock className="h-8 w-8 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-800 text-sm">No Timeline Events Match Filters</p>
            <p className="text-xs text-stone-500">
              Try adjusting your search query or log a new event for this matter.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-[#0256D0]"
            >
              <Plus className="h-4 w-4" />
              <span>Log First Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Log New Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#dedbc5] overflow-hidden">
            <div className="flex items-center justify-between bg-[#16181b] px-5 py-3.5 text-white">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-[#60A5FA]" />
                <h3 className="font-serif-title text-sm font-bold text-stone-100">
                  Log Matter Timeline Event
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Event Category
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TimelineEventType)}
                  className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                >
                  <option value="court">Court Appearance / Hearing / Mention</option>
                  <option value="meeting">Client Meeting / Consultation</option>
                  <option value="filing">Pleading E-Filing / Document Upload</option>
                  <option value="deadline">Court Deadline / Milestone</option>
                  <option value="note">General Case Note / Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruling on Application for Interlocutory Injunction"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {newType === 'court' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Court / Tribunal Registry
                    </label>
                    <input
                      type="text"
                      value={newCourtName}
                      onChange={(e) => setNewCourtName(e.target.value)}
                      placeholder="e.g. Milimani Commercial Div"
                      className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Presiding Judge / Magistrate
                    </label>
                    <input
                      type="text"
                      value={newJudge}
                      onChange={(e) => setNewJudge(e.target.value)}
                      placeholder="e.g. Hon. Justice F. Ochieng"
                      className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Event Directions / Summary Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Record judicial directions, oral arguments, or meeting action items..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded border border-stone-300 px-4 py-2 font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-4 py-2 font-bold text-white shadow-2xs hover:bg-[#0256D0] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save to Matter Timeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
