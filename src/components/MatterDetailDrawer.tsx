import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  User,
  Shield,
  Download,
  PlusCircle,
  Edit,
  CheckCircle,
  Bell,
  Mail,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  StickyNote,
  Pin,
  MessageSquare,
  Mic,
  Archive,
  ArchiveRestore,
  FolderArchive,
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  RotateCcw,
  Save,
  PhoneCall,
  Zap,
  Copy,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Flame,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react';
import { LegalMatter, TaskItem, Advocate, Client } from '../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../utils/staffStorage';
import { MatterTimeline } from './MatterTimeline';
import { CaseReportModal } from './CaseReportModal';
import { MatterTagModal, getTagColorClass } from './MatterTagModal';
import { FiledDocumentsList } from './FiledDocumentsList';
import { EditMatterModal } from './EditMatterModal';
import {
  generateTaskAssignmentEmail,
  dispatchAssignmentEmail,
  resolveStaffEmail,
} from '../utils/assignmentNotificationService';

interface MatterDetailDrawerProps {
  matter: LegalMatter | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: any) => void;
  onUpdateTags?: (id: string, newTags: string[]) => void;
  onUpdateMatter?: (updatedMatter: LegalMatter) => void;
  clients?: Client[];
  advocates?: Advocate[];
  tasks?: TaskItem[];
  onUpdateTasks?: (tasks: TaskItem[]) => void;
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  onDeleteMatter?: (matterId: string) => void;
}

export const MatterDetailDrawer: React.FC<MatterDetailDrawerProps> = ({
  matter,
  onClose,
  onUpdateStatus,
  onUpdateTags,
  onUpdateMatter,
  clients = [],
  advocates = [],
  tasks = [],
  onUpdateTasks,
  currentAdvocate,
  isManagingAdvocate = true,
  onDeleteMatter,
}) => {
  if (!matter) return null;

  const isSysAdmin = isSysAdminUser(currentAdvocate);
  const isManagingUser =
    isSysAdmin ||
    Boolean(isManagingAdvocate) ||
    currentAdvocate?.role === 'Managing Advocate' ||
    currentAdvocate?.id === 'adv-1' ||
    Boolean(currentAdvocate?.title?.toLowerCase().includes('managing'));
  const canAssignTasks = isSysAdmin || isManagingUser;
  const canDeleteMatter = isSysAdmin || isManagingUser;

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'documents' | 'billing' | 'reminders' | 'notes'>('overview');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);
  const [isQuickNoteFocused, setIsQuickNoteFocused] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [archiveReasonInput, setArchiveReasonInput] = useState('');
  const [archiveToast, setArchiveToast] = useState<string | null>(null);
  const [editToast, setEditToast] = useState<string | null>(null);

  // In-Matter Task Assignment State
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState(
    matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'
  );
  const [taskPriority, setTaskPriority] = useState<'Urgent' | 'High' | 'Normal' | 'Low'>('High');
  const [taskStatus, setTaskStatus] = useState<'open' | 'running' | 'closed'>('open');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskSubtasks, setTaskSubtasks] = useState<string[]>([]);
  const [taskSubtaskInput, setTaskSubtaskInput] = useState('');
  const [taskToast, setTaskToast] = useState<string | null>(null);
  const [taskSearchFilter, setTaskSearchFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');

  // Filter tasks belonging to this matter
  const matterTasks = (tasks || []).filter(
    (t) => t.matterId === matter.id || t.matterRef === matter.referenceNumber
  );

  const normalizeTaskStatus = (status: string): 'open' | 'running' | 'closed' => {
    const lower = status.toLowerCase();
    if (lower === 'running' || lower === 'in progress') return 'running';
    if (lower === 'closed' || lower === 'completed') return 'closed';
    return 'open';
  };

  const handleCreateMatterTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const mappedStatus =
      taskStatus === 'running' ? 'In Progress' : taskStatus === 'closed' ? 'Completed' : 'Not Started';

    const mappedPriority =
      taskPriority === 'Urgent' ? 'Critical' : taskPriority === 'Normal' ? 'Medium' : taskPriority;

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      matterId: matter.id,
      matterRef: matter.referenceNumber,
      clientName: matter.clientName,
      assignedTo: taskAssignedTo,
      createdBy: `${currentAdvocate?.name || 'Advocate'} (${currentAdvocate?.title || 'Firm Workspace'})`,
      priority: mappedPriority as any,
      status: mappedStatus as any,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: taskDueDate || new Date().toISOString().split('T')[0],
      estimatedHours: 4,
      actualHours: 0,
      subtasks: taskSubtasks.map((s, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        text: s,
        completed: false,
      })),
      commentsCount: 0,
    };

    if (onUpdateTasks) {
      onUpdateTasks([newTask, ...(tasks || [])]);
    }

    const recipient = resolveStaffEmail(taskAssignedTo, advocates);
    setIsAssignTaskModalOpen(false);
    setTaskTitle('');
    setTaskDescription('');
    setTaskSubtasks([]);
    setTaskToast(`Task assigned to ${recipient.name}!`);
    setTimeout(() => setTaskToast(null), 5000);
  };

  const handleToggleMatterSubtask = (taskId: string, subtaskId: string) => {
    if (!onUpdateTasks || !tasks) return;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const handleMatterTaskStatusChange = (taskId: string, newStatusVal: 'open' | 'running' | 'closed') => {
    if (!onUpdateTasks || !tasks) return;
    const statusText =
      newStatusVal === 'running'
        ? 'In Progress'
        : newStatusVal === 'closed'
        ? 'Completed'
        : 'Not Started';
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: statusText as any };
      }
      return t;
    });
    onUpdateTasks(updated);
    setTaskToast(`Task status updated to ${newStatusVal === 'running' ? 'In Progress' : newStatusVal === 'closed' ? 'Completed' : 'Open'}`);
    setTimeout(() => setTaskToast(null), 3000);
  };

  const handleDeleteMatterTask = (taskId: string) => {
    if (!onUpdateTasks || !tasks) return;
    const updated = tasks.filter((t) => t.id !== taskId);
    onUpdateTasks(updated);
    setTaskToast('Task removed from matter workload.');
    setTimeout(() => setTaskToast(null), 3000);
  };

  const handleAddMatterSubtaskItem = () => {
    if (!taskSubtaskInput.trim()) return;
    setTaskSubtasks([...taskSubtasks, taskSubtaskInput.trim()]);
    setTaskSubtaskInput('');
  };

  const handleRemoveMatterSubtaskItem = (index: number) => {
    setTaskSubtasks(taskSubtasks.filter((_, i) => i !== index));
  };

  // Quick Notes State
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteCategory, setQuickNoteCategory] = useState<'Client Call' | 'Court Observation' | 'Strategy' | 'General Thoughts' | 'Hearing Debrief'>('Client Call');
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Notes & Activity Feed State
  const [caseNotes, setCaseNotes] = useState<Array<{
    id: string;
    author: string;
    date: string;
    timestamp: number;
    category: 'Client Call' | 'Court Observation' | 'Strategy' | 'General Thoughts' | 'Hearing Debrief';
    title: string;
    content: string;
    pinned: boolean;
    audioRecorded?: boolean;
    duration?: string;
    editedAt?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(`chambers_matter_notes_${matter.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`chambers_matter_notes_${matter.id}`, JSON.stringify(caseNotes));
    } catch (e) {
      console.warn('Failed to save matter notes:', e);
    }
  }, [caseNotes, matter.id]);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Client Call' | 'Court Observation' | 'Strategy' | 'General Thoughts' | 'Hearing Debrief'>('Client Call');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [noteToast, setNoteToast] = useState<string | null>(null);

  // Edit Note State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteCategory, setEditNoteCategory] = useState<'Client Call' | 'Court Observation' | 'Strategy' | 'General Thoughts' | 'Hearing Debrief'>('Client Call');
  const [editNotePinned, setEditNotePinned] = useState(false);

  // Filter & Chronological Sorting State
  const [notesSortOrder, setNotesSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [notesSearchTerm, setNotesSearchTerm] = useState('');
  const [notesCategoryFilter, setNotesCategoryFilter] = useState<string>('All');

  const handleAddQuickNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickNoteText.trim()) return;

    const now = new Date();
    const dateStr =
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNote = {
      id: `quick-note-${Date.now()}`,
      author: matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate',
      date: dateStr,
      timestamp: now.getTime(),
      category: quickNoteCategory,
      title: quickNoteTitle.trim() || `${quickNoteCategory} Observation`,
      content: quickNoteText.trim(),
      pinned: false,
    };

    setCaseNotes([newNote, ...caseNotes]);
    setQuickNoteText('');
    setQuickNoteTitle('');
    setNoteToast('Quick observation jotted to matter file!');
    setTimeout(() => setNoteToast(null), 3000);
  };

  const handleCopyNote = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedNoteId(id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const now = new Date();
    const newNote = {
      id: `note-${Date.now()}`,
      author: matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate',
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      category: newNoteCategory,
      title: newNoteTitle.trim() || `${newNoteCategory} Note`,
      content: newNoteContent,
      pinned: newNotePinned,
    };

    setCaseNotes([newNote, ...caseNotes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNotePinned(false);
    setNoteToast('Case note recorded in matter log!');
    setTimeout(() => setNoteToast(null), 3000);
  };

  const handleStartEditNote = (note: typeof caseNotes[0]) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setEditNoteCategory(note.category);
    setEditNotePinned(note.pinned);
  };

  const handleSaveEditNote = (id: string) => {
    if (!editNoteContent.trim()) return;
    const now = new Date();
    const editedStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCaseNotes(
      caseNotes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            title: editNoteTitle.trim() || n.title,
            content: editNoteContent,
            category: editNoteCategory,
            pinned: editNotePinned,
            editedAt: editedStr,
          };
        }
        return n;
      })
    );
    setEditingNoteId(null);
    setNoteToast('Case note successfully updated and saved!');
    setTimeout(() => setNoteToast(null), 3000);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
  };

  const togglePinNote = (id: string) => {
    setCaseNotes(caseNotes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const deleteNote = (id: string) => {
    setCaseNotes(caseNotes.filter((n) => n.id !== id));
  };

  // Reminders state
  const [reminders, setReminders] = useState([
    {
      id: 'rem-1',
      title: matter.nextDeadlineDescription || 'Court Filing Deadline',
      date: matter.nextDeadlineDate || '2026-08-18',
      time: '09:00',
      leadTime: '1 Day Before',
      channels: { email: true, browser: true, sms: false },
      recipient: matter.responsibleAdvocateName || 'Adv. Michael Mburu',
      active: true,
    },
    {
      id: 'rem-2',
      title: 'Mentions & Injunction Hearing Status Check',
      date: '2026-08-22',
      time: '08:30',
      leadTime: '3 Days Before',
      channels: { email: true, browser: false, sms: true },
      recipient: 'billing@mburuachieng.co.ke',
      active: true,
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newLeadTime, setNewLeadTime] = useState('1 Day Before');
  const [newChannelEmail, setNewChannelEmail] = useState(true);
  const [newChannelBrowser, setNewChannelBrowser] = useState(true);
  const [newChannelSMS, setNewChannelSMS] = useState(false);
  const [newRecipient, setNewRecipient] = useState(matter.responsibleAdvocateName || 'Adv. Michael Mburu');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const item = {
      id: `rem-${Date.now()}`,
      title: newTitle,
      date: newDate,
      time: newTime,
      leadTime: newLeadTime,
      channels: { email: newChannelEmail, browser: newChannelBrowser, sms: newChannelSMS },
      recipient: newRecipient,
      active: true,
    };

    setReminders([item, ...reminders]);
    setNewTitle('');
    setNewDate('');
    setReminderToast(`Automated notification scheduled for "${item.title}"`);
    setTimeout(() => setReminderToast(null), 3500);
  };

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-2xl bg-[#fbf9f4] shadow-2xl h-full flex flex-col border-l border-[#dedbc5] animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="bg-[#16181b] p-6 text-white flex items-start justify-between border-b border-stone-800">
          <div className="flex-1 pr-4">
            {/* Collapsed Badges and Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#60A5FA] bg-[#60A5FA]/10 border border-[#60A5FA]/25 px-2.5 py-0.5 rounded-full">
                {matter.referenceNumber}
              </span>
              <span className="rounded-full bg-[#0B63E5]/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#60A5FA] border border-[#0B63E5]/30">
                {matter.practiceArea}
              </span>
              <span
                className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                  matter.priority === 'High'
                    ? 'bg-rose-900/40 text-rose-300 border-rose-700/60'
                    : matter.priority === 'Medium'
                    ? 'bg-amber-900/40 text-amber-300 border-amber-700/60'
                    : 'bg-stone-800 text-stone-300 border-stone-700'
                }`}
              >
                {matter.priority === 'High' ? (
                  <AlertTriangle className="h-2.5 w-2.5 text-rose-400" />
                ) : matter.priority === 'Medium' ? (
                  <Clock className="h-2.5 w-2.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-2.5 w-2.5 text-stone-400" />
                )}
                <span>{matter.priority} Priority</span>
              </span>

              {/* Tags Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                  className="inline-flex items-center space-x-1 rounded-full border border-stone-700 bg-stone-800/90 px-2.5 py-0.5 text-[10px] font-medium text-stone-300 hover:border-stone-500 hover:text-white transition cursor-pointer"
                  title="View and manage matter keyword tags"
                >
                  <Tag className="h-2.5 w-2.5 text-stone-400" />
                  <span>Tags {matter.tags && matter.tags.length > 0 ? `(${matter.tags.length})` : ''} ▾</span>
                </button>

                {showTagsDropdown && (
                  <div className="absolute left-0 mt-1.5 z-30 w-60 rounded-xl border border-stone-700 bg-stone-900 text-white p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      <span>Assigned Tags</span>
                      <button
                        type="button"
                        onClick={() => setShowTagsDropdown(false)}
                        className="text-stone-400 hover:text-white cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {matter.tags && matter.tags.length > 0 ? (
                        matter.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getTagColorClass(
                              tag
                            )}`}
                          >
                            <Tag className="h-2.5 w-2.5 opacity-60" />
                            <span>{tag}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-400 italic py-1">No tags assigned yet</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowTagsDropdown(false);
                        setShowTagModal(true);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 py-1.5 text-xs font-semibold text-white cursor-pointer transition shadow-2xs"
                    >
                      <Plus className="h-3 w-3 text-[#60A5FA]" />
                      <span>Manage Tags</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="mt-2 font-serif-title text-lg font-bold text-stone-100 leading-snug">
              {matter.title}
            </h2>
            <p className="mt-1 text-xs text-stone-400">
              Client: <span className="font-semibold text-stone-200">{matter.clientName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-[#f1eee4] px-6 py-2.5 border-b border-[#e2dfd5] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-stone-500 font-medium">Status:</span>
            <select
              value={matter.status}
              onChange={(e) => onUpdateStatus(matter.id, e.target.value)}
              className="rounded border border-[#dcd8c9] bg-white px-2.5 py-1 font-semibold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="Active - In Court">Active - In Court</option>
              <option value="Filing Pending">Filing Pending</option>
              <option value="Interlocutory">Interlocutory</option>
              <option value="Settlement Negotiation">Settlement Negotiation</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* Primary Action 1: Edit Matter */}
            <button
              id="drawer-edit-matter-button"
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-1.5 rounded border border-stone-300 bg-white px-3 py-1 font-bold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shadow-2xs"
              title="Edit matter details, court dates, financial estimates, and counsel assignment"
            >
              <Edit className="h-3.5 w-3.5 text-stone-600" />
              <span>Edit Matter</span>
            </button>

            {/* Primary Action 2: Assign Task */}
            {canAssignTasks && (
              <button
                onClick={() => {
                  setTaskAssignedTo(
                    matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'
                  );
                  setIsAssignTaskModalOpen(true);
                }}
                className="flex items-center space-x-1.5 rounded border border-[#0B63E5] bg-[#0B63E5] px-3 py-1 font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer"
                title="Assign a new task / workload directly to an advocate on this matter"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>+ Assign Task</span>
              </button>
            )}

            {/* Overflow Menu: ⋯ More Actions */}
            <div className="relative">
              <button
                onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
                className="flex items-center space-x-1 rounded border border-stone-300 bg-white px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>More ▾</span>
              </button>

              {showMoreActionsMenu && (
                <div className="absolute right-0 mt-1.5 z-30 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowMoreActionsMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-blue-50 hover:text-[#0B63E5] transition text-left cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-[#0B63E5]" />
                    <span>Export PDF Report</span>
                  </button>

                  {matter.status === 'Archived' ? (
                    <button
                      onClick={() => {
                        setShowMoreActionsMenu(false);
                        onUpdateStatus(matter.id, 'Completed');
                        setArchiveToast('Matter restored from Archive to Active Workspace');
                        setTimeout(() => setArchiveToast(null), 3000);
                      }}
                      className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition text-left cursor-pointer"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5 text-amber-700" />
                      <span>Restore to Active</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMoreActionsMenu(false);
                        setShowArchiveModal(true);
                      }}
                      className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-purple-900 hover:bg-purple-50 transition text-left cursor-pointer"
                    >
                      <Archive className="h-3.5 w-3.5 text-purple-700" />
                      <span>Move to Archive</span>
                    </button>
                  )}

                  {canDeleteMatter && onDeleteMatter && (
                    <div className="border-t border-stone-100 pt-1 mt-1">
                      <button
                        id="drawer-delete-matter-button"
                        onClick={() => {
                          setShowMoreActionsMenu(false);
                          setShowDeleteConfirmModal(true);
                        }}
                        className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition text-left cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        <span>Delete Matter</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Condensed Fee Note Bar */}
        <div className="bg-[#fcfbf9] px-6 py-2 border-b border-[#e2dfd5] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-3 text-stone-600">
            <div className="flex items-center space-x-1 text-stone-900 font-bold">
              <DollarSign className="h-3.5 w-3.5 text-[#0B63E5]" />
              <span>Fee Note:</span>
            </div>
            <span>
              {matter.feeToBeDiscussedLater || !matter.estimatedFeeKES || matter.estimatedFeeKES === 0 ? (
                <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                  TBD Later
                </span>
              ) : (
                <span className="font-mono font-bold text-stone-900">
                  KES {matter.estimatedFeeKES >= 1000000 ? `${(matter.estimatedFeeKES / 1000000).toFixed(2)}M` : matter.estimatedFeeKES.toLocaleString()}
                </span>
              )}
            </span>
            <span className="text-stone-300">|</span>
            <span>
              Billed: <strong className="font-mono text-[#0B63E5]">KES {((matter.billedKES || 0) >= 1000000 ? `${((matter.billedKES || 0) / 1000000).toFixed(2)}M` : (matter.billedKES || 0).toLocaleString())}</strong>
            </span>
            <span className="text-stone-300">|</span>
            <span>
              Paid: <strong className="font-mono text-emerald-700">KES {((matter.paidKES || 0) >= 1000000 ? `${((matter.paidKES || 0) / 1000000).toFixed(2)}M` : (matter.paidKES || 0).toLocaleString())}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className="text-[11px] font-bold text-[#0B63E5] hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>Full Ledger →</span>
          </button>
        </div>

        {archiveToast && (
          <div className="bg-purple-50 border-b border-purple-200 px-6 py-2 text-xs font-bold text-purple-900 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span>{archiveToast}</span>
          </div>
        )}

        {taskToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{taskToast}</span>
          </div>
        )}

        {editToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{editToast}</span>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex border-b border-[#e2dfd5] bg-white px-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Quick Notes' },
            { id: 'tasks', label: `Assigned Tasks (${matterTasks.length})` },
            { id: 'timeline', label: 'Chronological Timeline' },
            { id: 'documents', label: 'Pleadings & Documents' },
            { id: 'billing', label: 'Fee Notes & Financials' },
            { id: 'reminders', label: 'Reminders & Alerts' },
            { id: 'notes', label: `Case Notes (${caseNotes.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#0B63E5] text-[#0B63E5]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === 'overview' && (
            <>
              {/* Key Case Details Grid */}
              <div className="rounded-lg border border-[#e2dfd5] bg-white p-4">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0eee6]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-xs">Key Case Details</span>
                    <span className="text-[10px] text-stone-500 font-mono">({matter.referenceNumber})</span>
                  </div>
                  <button
                    id="overview-edit-details-btn"
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B63E5] hover:text-[#0256D0] hover:underline cursor-pointer"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit Details</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold tracking-wider">
                    Court Forum & Registry
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5">
                    {matter.courtRegistry || 'High Court Commercial Division'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 font-semibold tracking-wider">
                    Court Suit / Petition No.
                  </span>
                  <p className="font-mono font-semibold text-[#0B63E5] mt-0.5">
                    {matter.courtCaseNumber || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 font-semibold tracking-wider">
                    Date Lodged / Entered
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5 flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-[#0B63E5]" />
                    <span>{matter.lodgedDate || matter.createdDate || 'N/A'}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 font-semibold tracking-wider">
                    Judiciary CTS Filing Ref
                  </span>
                  <p className="font-mono text-stone-700 mt-0.5">
                    {matter.ctsFilingId || 'CTS-2026-NBI-001'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 font-semibold tracking-wider">
                    Lead Advocate
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5">
                    {matter.responsibleAdvocateName}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 font-semibold tracking-wider">
                    Next Court Date & Purpose
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-amber-900 flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-700" />
                      <span>{matter.nextCourtDate || matter.nextDeadlineDate || 'N/A'}</span>
                    </span>
                    {matter.courtDatePurpose && (
                      <span className="rounded bg-amber-100 text-amber-900 px-1.5 py-0.2 text-[10px] font-semibold border border-amber-200">
                        {matter.courtDatePurpose}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              </div>

              {/* Quick Notes & Call Observations Panel */}
              <div className="rounded-lg border-2 border-[#c3e1f7] bg-gradient-to-br from-[#ebf5fc]/80 to-white p-4 space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c3e1f7] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-md bg-[#0070ba] p-1.5 text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-[#1c2d3d] text-sm">
                          Quick Notes & Call Observations
                        </h3>
                        <span className="rounded-full bg-[#0070ba] px-2 py-0.2 text-[10px] font-bold text-white font-mono">
                          {caseNotes.length} Notes
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5c6f84]">
                        Jot down rapid, non-task observations, client telephone impressions & spontaneous strategy remarks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('notes')}
                      className="text-[11px] font-bold text-[#0070ba] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>Full Register →</span>
                    </button>
                  </div>
                </div>

                {/* Quick Note Input Box - Shrinks to single-line input and expands on focus */}
                {!isQuickNoteFocused && !quickNoteText.trim() ? (
                  <div
                    onClick={() => setIsQuickNoteFocused(true)}
                    className="rounded-lg border border-[#c3e1f7] bg-white p-2.5 shadow-2xs cursor-text flex items-center justify-between hover:border-[#0070ba] transition"
                  >
                    <input
                      type="text"
                      readOnly
                      placeholder="Jot a quick note..."
                      className="w-full bg-transparent text-xs text-[#1c2d3d] placeholder:text-[#8c9ba8] focus:outline-none cursor-text"
                    />
                    <Zap className="h-3.5 w-3.5 text-[#0070ba] shrink-0 opacity-60" />
                  </div>
                ) : (
                  <form
                    onSubmit={handleAddQuickNote}
                    className="rounded-lg border border-[#c3e1f7] bg-white p-3 space-y-2.5 shadow-2xs animate-in fade-in duration-150"
                  >
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Optional brief headline (e.g. Call with MD regarding escrow release)"
                        value={quickNoteTitle}
                        onChange={(e) => setQuickNoteTitle(e.target.value)}
                        className="w-full rounded border border-[#d1d7dc] bg-[#fbfcfd] px-2.5 py-1 text-xs text-[#1c2d3d] focus:bg-white focus:border-[#0070ba] focus:outline-none"
                      />

                      <textarea
                        rows={2}
                        autoFocus
                        required
                        placeholder="Jot a quick note..."
                        value={quickNoteText}
                        onChange={(e) => setQuickNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuickNote();
                          }
                        }}
                        className="w-full rounded border border-[#d1d7dc] bg-white p-2.5 text-xs text-[#1c2d3d] placeholder:text-[#8c9ba8] focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] focus:outline-none resize-y"
                      />
                    </div>

                    {/* Category Pills appear AFTER typing */}
                    {quickNoteText.trim().length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                        <span className="text-[10px] font-bold text-[#5c6f84] tracking-wider mr-1">
                          Observation Tag:
                        </span>
                        {(
                          [
                            { id: 'Client Call', label: '📞 Client Call', color: 'border-purple-300 bg-purple-50 text-purple-800' },
                            { id: 'Court Observation', label: '🏛️ Court / Registry', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                            { id: 'Strategy', label: '💡 Strategy Idea', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                            { id: 'Hearing Debrief', label: '⚖️ Hearing Debrief', color: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
                            { id: 'General Thoughts', label: '📝 General Thought', color: 'border-stone-300 bg-stone-50 text-stone-800' },
                          ] as const
                        ).map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setQuickNoteCategory(tag.id)}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                              quickNoteCategory === tag.id
                                ? `${tag.color} ring-2 ring-[#0070ba] font-extrabold shadow-2xs`
                                : 'border-[#e2e7eb] bg-white text-[#5c6f84] hover:bg-[#f4f6f8]'
                            }`}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickNoteFocused(false);
                          if (!quickNoteText.trim()) {
                            setQuickNoteTitle('');
                          }
                        }}
                        className="text-[10px] text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Collapse
                      </button>

                      <button
                        type="submit"
                        disabled={!quickNoteText.trim()}
                        className="flex items-center space-x-1.5 rounded-md bg-[#0070ba] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Save Quick Note</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Stream of Recent Observations */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1c2d3d]">
                    <span className="flex items-center space-x-1">
                      <StickyNote className="h-3.5 w-3.5 text-[#0070ba]" />
                      <span>Recent Call & Matter Observations ({caseNotes.slice(0, 3).length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('notes')}
                      className="text-[10px] text-[#0070ba] hover:underline font-semibold"
                    >
                      View all {caseNotes.length} notes in register →
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {caseNotes.slice(0, 3).map((note) => (
                      <div
                        key={note.id}
                        className={`rounded-lg border p-2.5 transition-all text-xs space-y-1.5 ${
                          note.pinned
                            ? 'border-[#c3e1f7] bg-[#ebf5fc]/90 shadow-2xs'
                            : 'border-[#e2e7eb] bg-white hover:border-[#c3e1f7]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {note.pinned && (
                              <Pin className="h-3 w-3 text-[#0070ba] fill-[#0070ba] shrink-0" />
                            )}
                            <span className="font-bold text-[#1c2d3d] text-[11px]">
                              {note.title}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                note.category === 'Client Call'
                                  ? 'bg-purple-100 text-purple-800'
                                  : note.category === 'Court Observation'
                                  ? 'bg-amber-100 text-amber-800'
                                  : note.category === 'Strategy'
                                  ? 'bg-blue-100 text-blue-800'
                                  : note.category === 'Hearing Debrief'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {note.category}
                            </span>
                            {note.audioRecorded && (
                              <span className="inline-flex items-center space-x-1 rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-700">
                                <Mic className="h-2.5 w-2.5 text-red-600" />
                                <span>Voice Dictation</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyNote(note.id, `${note.title}\n\n${note.content}`)}
                              className="rounded p-1 text-[#5c6f84] hover:text-[#0070ba] hover:bg-[#ebf5fc] transition-colors cursor-pointer"
                              title="Copy observation to clipboard"
                            >
                              {copiedNoteId === note.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePinNote(note.id)}
                              className={`rounded p-1 transition-colors cursor-pointer ${
                                note.pinned
                                  ? 'text-[#0070ba] bg-[#ebf5fc]'
                                  : 'text-[#5c6f84] hover:text-[#1c2d3d]'
                              }`}
                              title={note.pinned ? 'Unpin' : 'Pin note'}
                            >
                              <Pin className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNote(note.id)}
                              className="rounded p-1 text-[#5c6f84] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#1c2d3d] leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {note.content}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-[#5c6f84] pt-0.5 border-t border-stone-100">
                          <span>By: <strong className="text-[#1c2d3d]">{note.author}</strong></span>
                          <span className="font-mono">{note.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Normalized Summary Cards: Next High Court Deadline, Case Timeline, and Client PDF Report */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[#0B63E5]">
                        <Calendar className="h-4 w-4" />
                        <span className="font-bold text-xs text-stone-900">Next High Court Deadline</span>
                      </div>
                      <span className="font-bold text-[#0B63E5] font-mono text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {matter.nextDeadlineDate}
                      </span>
                    </div>
                    <p className="text-stone-700 font-medium text-xs line-clamp-2">
                      {matter.nextDeadlineDescription}
                    </p>
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium">
                    Priority court hearing calendar
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[#0B63E5]">
                      <Clock className="h-4 w-4" />
                      <span className="font-bold text-xs text-stone-900">Case Timeline</span>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      Map court hearings, e-filed pleadings & client meetings.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="self-start text-xs font-bold text-[#0B63E5] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <span>View Vertical Timeline →</span>
                  </button>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[#0B63E5]">
                      <FileText className="h-4 w-4" />
                      <span className="font-bold text-xs text-stone-900">Client PDF Report</span>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      Formal law firm letterhead summary for board updates.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="self-start text-xs font-bold text-[#0B63E5] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <span>Export PDF Report →</span>
                  </button>
                </div>
              </div>

              {/* Tracked Filed Documents for this Case */}
              <FiledDocumentsList
                matter={matter}
                currentAdvocate={currentAdvocate}
                compact={true}
                onViewAllTab={() => setActiveTab('documents')}
              />

              {/* Assigned Matter Tasks & Workload Section */}
              <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-md bg-[#0B63E5] p-1.5 text-white">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-stone-900 text-sm">
                          Assigned Workload & Tasks
                        </h3>
                        <span className="rounded-full bg-blue-100 text-[#0B63E5] px-2 py-0.2 text-[10px] font-bold font-mono">
                          {matterTasks.length} {matterTasks.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Action items, research briefs, pleadings drafts & chamber tasks linked to this case file.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTaskAssignedTo(
                          matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'
                        );
                        setIsAssignTaskModalOpen(true);
                      }}
                      className="flex items-center space-x-1 rounded bg-[#0B63E5] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Assign Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tasks')}
                      className="text-[11px] font-bold text-[#0B63E5] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>Full Register ({matterTasks.length}) →</span>
                    </button>
                  </div>
                </div>

                {matterTasks.length === 0 ? (
                  <div className="flex items-center justify-between rounded-lg border border-dashed border-stone-200 bg-stone-50/70 px-3.5 py-2.5">
                    <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-stone-400" />
                      <span>No tasks assigned to this case file yet.</span>
                    </span>
                    {canAssignTasks && (
                      <button
                        type="button"
                        onClick={() => {
                          setTaskAssignedTo(
                            matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'
                          );
                          setIsAssignTaskModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-[#0B63E5] hover:underline cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Assign Task</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matterTasks.slice(0, 3).map((task) => {
                      const completedCount = task.subtasks.filter((s) => s.completed).length;
                      const progress = task.subtasks.length > 0
                        ? Math.round((completedCount / task.subtasks.length) * 100)
                        : task.status === 'Completed' ? 100 : 0;
                      const currentStatusNorm = normalizeTaskStatus(task.status);

                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border border-stone-200 bg-stone-50/60 p-3 space-y-2 hover:border-blue-300 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                    task.priority === 'Critical'
                                      ? 'bg-rose-100 text-rose-800'
                                      : task.priority === 'High'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {task.priority === 'Critical' ? '🔥 Critical' : `${task.priority} Priority`}
                                </span>
                                <span className="font-bold text-stone-900 text-xs">{task.title}</span>
                              </div>
                              <p className="text-[11px] text-stone-600 line-clamp-1">{task.description}</p>
                            </div>

                            <select
                              value={currentStatusNorm}
                              onChange={(e) =>
                                handleMatterTaskStatusChange(
                                  task.id,
                                  e.target.value as 'open' | 'running' | 'closed'
                                )
                              }
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none ${
                                currentStatusNorm === 'closed'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : currentStatusNorm === 'running'
                                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                                  : 'border-blue-300 bg-blue-50 text-blue-800'
                              }`}
                            >
                              <option value="open">⚪ Open / Pending</option>
                              <option value="running">🟡 In Progress</option>
                              <option value="closed">🟢 Completed</option>
                            </select>
                          </div>

                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-stone-200/60">
                              <div className="flex items-center justify-between text-[10px] text-stone-500">
                                <span>Checklist ({completedCount}/{task.subtasks.length})</span>
                                <span className="font-mono font-bold">{progress}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    progress === 100 ? 'bg-emerald-500' : 'bg-[#0B63E5]'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="space-y-1 pt-1">
                                {task.subtasks.map((st) => (
                                  <label
                                    key={st.id}
                                    className="flex items-center space-x-2 text-[11px] text-stone-700 cursor-pointer hover:text-stone-900"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={st.completed}
                                      onChange={() => handleToggleMatterSubtask(task.id, st.id)}
                                      className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5] cursor-pointer"
                                    />
                                    <span className={st.completed ? 'line-through text-stone-400' : ''}>
                                      {st.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-stone-400" />
                              <span>Assigned: <strong className="text-stone-700">{task.assignedTo}</strong></span>
                            </span>
                            <span className="flex items-center space-x-1 font-mono">
                              <Calendar className="h-3 w-3 text-stone-400" />
                              <span>Due: {task.dueDate}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Case Summary */}
              <div>
                <h3 className="font-serif-title font-bold text-stone-900 text-sm mb-1.5">
                  Case Background & Summary
                </h3>
                <p className="text-stone-700 leading-relaxed bg-white p-3.5 rounded-lg border border-[#e2dfd5]">
                  {matter.description}
                </p>
              </div>

              {/* Financial Snapshot */}
              <div className="rounded-lg border border-[#e2dfd5] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-title font-bold text-stone-900 text-sm">
                    Fee Note Snapshot (Kenyan Shillings)
                  </h3>
                  {(matter.feeToBeDiscussedLater || !matter.estimatedFeeKES || matter.estimatedFeeKES === 0) && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Fee TBD Later
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-semibold">Agreed Fee</span>
                    <p className="font-bold text-stone-900 text-sm mt-0.5">
                      {matter.feeToBeDiscussedLater || !matter.estimatedFeeKES || matter.estimatedFeeKES === 0 ? (
                        <span className="text-amber-800 text-xs font-semibold">To be discussed</span>
                      ) : matter.estimatedFeeKES >= 1000000 ? (
                        `KES ${(matter.estimatedFeeKES / 1000000).toFixed(2)}M`
                      ) : (
                        `KES ${matter.estimatedFeeKES.toLocaleString()}`
                      )}
                    </p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-semibold">Billed</span>
                    <p className="font-bold text-[#0B63E5] text-sm mt-0.5">
                      {matter.billedKES >= 1000000
                        ? `KES ${(matter.billedKES / 1000000).toFixed(2)}M`
                        : `KES ${(matter.billedKES || 0).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-semibold">Paid</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5">
                      {matter.paidKES >= 1000000
                        ? `KES ${(matter.paidKES / 1000000).toFixed(2)}M`
                        : `KES ${(matter.paidKES || 0).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Tasks Tab Header Banner */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-white p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="rounded-lg bg-[#0B63E5] p-2 text-white shadow-2xs">
                        <CheckSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-serif-title font-bold text-base text-stone-900">
                          Matter Workload & Action Register
                        </h3>
                        <p className="text-xs text-stone-600">
                          Case file: <strong className="font-mono text-[#0B63E5]">{matter.referenceNumber}</strong> • Client: <strong>{matter.clientName}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {canAssignTasks && (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskAssignedTo(
                          matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'
                        );
                        setIsAssignTaskModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0256D0] transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Assign New Task</span>
                    </button>
                  )}
                </div>

                {/* Status Badges Row */}
                <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-blue-100 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-stone-200 text-center shadow-2xs">
                    <span className="text-[10px] text-stone-500 font-semibold">Total Tasks</span>
                    <p className="font-mono font-bold text-stone-900 text-sm mt-0.5">{matterTasks.length}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-stone-200 text-center shadow-2xs">
                    <span className="text-[10px] text-blue-600 font-semibold">Open / Pending</span>
                    <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                      {matterTasks.filter((t) => normalizeTaskStatus(t.status) === 'open').length}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-stone-200 text-center shadow-2xs">
                    <span className="text-[10px] text-amber-600 font-semibold">In Progress</span>
                    <p className="font-mono font-bold text-amber-700 text-sm mt-0.5">
                      {matterTasks.filter((t) => normalizeTaskStatus(t.status) === 'running').length}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-stone-200 text-center shadow-2xs">
                    <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
                    <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                      {matterTasks.filter((t) => normalizeTaskStatus(t.status) === 'closed').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-stone-200">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search tasks by action title, instructions, or advocate..."
                    value={taskSearchFilter}
                    onChange={(e) => setTaskSearchFilter(e.target.value)}
                    className="w-full rounded-md border border-stone-200 pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'open', label: 'Open' },
                    { id: 'running', label: 'In Progress' },
                    { id: 'closed', label: 'Completed' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      type="button"
                      onClick={() => setTaskStatusFilter(filterTab.id)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        taskStatusFilter === filterTab.id
                          ? 'bg-[#0B63E5] text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              {(() => {
                const filtered = matterTasks.filter((t) => {
                  if (taskStatusFilter !== 'all') {
                    if (normalizeTaskStatus(t.status) !== taskStatusFilter) return false;
                  }
                  if (taskSearchFilter.trim()) {
                    const q = taskSearchFilter.toLowerCase();
                    return (
                      t.title.toLowerCase().includes(q) ||
                      t.description.toLowerCase().includes(q) ||
                      t.assignedTo.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white p-8 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0B63E5]">
                        <CheckSquare className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-stone-800 text-sm">
                        {matterTasks.length === 0
                          ? 'No tasks assigned to this case file'
                          : 'No tasks match your filter criteria'}
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        {matterTasks.length === 0
                          ? 'Click the button below to assign legal research, document drafting, client consultation, or court appearance preparations.'
                          : 'Try changing your search term or switching the status filter.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTaskAssignedTo(
                            matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'
                          );
                          setIsAssignTaskModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0256D0] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Assign Task to Case</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((task) => {
                      const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                      const progressPct = task.subtasks.length > 0
                        ? Math.round((completedSubtasks / task.subtasks.length) * 100)
                        : task.status === 'Completed' ? 100 : 0;
                      const currentStatus = normalizeTaskStatus(task.status);

                      return (
                        <div
                          key={task.id}
                          className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 shadow-xs hover:border-[#0B63E5]/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                                    task.priority === 'Critical'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : task.priority === 'High'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {task.priority === 'Critical' ? (
                                    <>
                                      <Flame className="h-3 w-3 text-rose-600" />
                                      <span>Critical Priority</span>
                                    </>
                                  ) : (
                                    <span>{task.priority} Priority</span>
                                  )}
                                </span>

                                <span className="font-bold text-stone-900 text-sm">{task.title}</span>
                              </div>

                              {task.description && (
                                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  handleMatterTaskStatusChange(
                                    task.id,
                                    e.target.value as 'open' | 'running' | 'closed'
                                  )
                                }
                                className={`rounded-md border px-2.5 py-1 text-xs font-bold cursor-pointer focus:outline-none shadow-2xs ${
                                  currentStatus === 'closed'
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                    : currentStatus === 'running'
                                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                                    : 'border-blue-400 bg-blue-50 text-blue-800'
                                }`}
                              >
                                <option value="open">⚪ Open</option>
                                <option value="running">🟡 In Progress</option>
                                <option value="closed">🟢 Completed</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleDeleteMatterTask(task.id)}
                                className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Subtasks Checklist */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="space-y-2 rounded-lg bg-stone-50 p-3 border border-stone-200/80">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-stone-700 flex items-center space-x-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0B63E5]" />
                                  <span>Action Steps & Checklist</span>
                                </span>
                                <span className="font-mono text-stone-500 font-bold">
                                  {completedSubtasks} / {task.subtasks.length} ({progressPct}%)
                                </span>
                              </div>

                              <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    progressPct === 100 ? 'bg-emerald-500' : 'bg-[#0B63E5]'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {task.subtasks.map((st) => (
                                  <label
                                    key={st.id}
                                    className="flex items-start space-x-2.5 text-xs text-stone-800 cursor-pointer hover:bg-white p-1.5 rounded transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={st.completed}
                                      onChange={() => handleToggleMatterSubtask(task.id, st.id)}
                                      className="mt-0.5 rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5] cursor-pointer"
                                    />
                                    <span
                                      className={`flex-1 ${
                                        st.completed ? 'line-through text-stone-400' : 'font-medium'
                                      }`}
                                    >
                                      {st.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center space-x-1">
                                <User className="h-3.5 w-3.5 text-stone-400" />
                                <span>
                                  Assigned to: <strong className="text-stone-800">{task.assignedTo}</strong>
                                </span>
                              </span>

                              <span className="flex items-center space-x-1 font-mono">
                                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                                <span>Due: <strong className="text-stone-800">{task.dueDate}</strong></span>
                              </span>
                            </div>

                            <span className="text-[10px] text-stone-400">
                              By: {task.createdBy}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'timeline' && (
            <MatterTimeline matter={matter} />
          )}

          {activeTab === 'documents' && (
            <FiledDocumentsList matter={matter} currentAdvocate={currentAdvocate} />
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#e2dfd5] bg-white p-4 space-y-3">
                <h3 className="font-bold text-stone-900">Fee Note Ledger (#MAA-2026-088)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span>Professional Legal Fees</span>
                    <span className="font-bold">KES 3,500,000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>VAT (16%)</span>
                    <span className="font-bold">KES 560,000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Disbursements & High Court Filing Fees</span>
                    <span className="font-bold">KES 140,000</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-stone-900 text-sm">
                    <span>Total Invoice Amount</span>
                    <span className="text-[#0B63E5]">KES 4,200,000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#e2dfd5] pb-3">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-[#0B63E5]" />
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Automated Filing & Milestone Reminders</h3>
                    <p className="text-[11px] text-stone-500">
                      Configure email, browser, and SMS alerts for court deadlines & client deliverables.
                    </p>
                  </div>
                </div>
              </div>

              {reminderToast && (
                <div className="rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{reminderToast}</span>
                </div>
              )}

              {/* Set New Reminder Form */}
              <form onSubmit={handleAddReminder} className="rounded-lg border border-[#e2dfd5] bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-stone-800 text-xs flex items-center space-x-1.5">
                    <Plus className="h-4 w-4 text-[#0B63E5]" />
                    <span>Set Milestone / Court Deadline Reminder</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Ref: {matter.referenceNumber}</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700">Milestone or Court Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. File Replying Affidavit or Prepare Trial Bundle"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700">Due Date</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-1.5 text-xs text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700">Time</label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-1.5 text-xs text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700">Advance Lead Alert</label>
                      <select
                        value={newLeadTime}
                        onChange={(e) => setNewLeadTime(e.target.value)}
                        className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-1.5 text-xs font-medium text-stone-900 focus:bg-white focus:outline-none"
                      >
                        <option value="On Event Date">On Event Date</option>
                        <option value="1 Day Before">1 Day Before</option>
                        <option value="3 Days Before">3 Days Before</option>
                        <option value="1 Week Before">1 Week Before</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700">Recipient Email / Advocate</label>
                    <input
                      type="text"
                      required
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="advocate@firm.co.ke"
                      className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="block text-[11px] font-bold text-stone-700 mb-1.5">Automated Channels</span>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newChannelEmail}
                          onChange={(e) => setNewChannelEmail(e.target.checked)}
                          className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                        />
                        <Mail className="h-3.5 w-3.5 text-stone-600" />
                        <span className="text-stone-800 font-medium">Email Alert</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newChannelBrowser}
                          onChange={(e) => setNewChannelBrowser(e.target.checked)}
                          className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                        />
                        <Bell className="h-3.5 w-3.5 text-stone-600" />
                        <span className="text-stone-800 font-medium">Browser Push</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newChannelSMS}
                          onChange={(e) => setNewChannelSMS(e.target.checked)}
                          className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                        />
                        <Smartphone className="h-3.5 w-3.5 text-stone-600" />
                        <span className="text-stone-800 font-medium">SMS Broadcast</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0] cursor-pointer shadow-2xs"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Set Automated Notification</span>
                  </button>
                </div>
              </form>

              {/* Active Reminders List */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-xs">Active Scheduled Reminders ({reminders.length})</h4>

                {reminders.length === 0 ? (
                  <p className="text-stone-500 italic text-center py-4">No active reminders configured for this matter.</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-lg border p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          r.active
                            ? 'border-[#e2dfd5] bg-white'
                            : 'border-stone-200 bg-stone-50 opacity-60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[9px] font-bold  tracking-wider ${
                                r.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {r.active ? 'Active Schedule' : 'Paused'}
                            </span>
                            <span className="font-bold text-stone-900 text-xs">{r.title}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3.5 w-3.5 text-[#0B63E5]" />
                              <span className="font-mono font-bold text-stone-800">{r.date}</span> at {r.time}
                            </span>
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                              Alert: {r.leadTime}
                            </span>
                            <span className="text-stone-500">To: {r.recipient}</span>
                          </div>

                          <div className="flex items-center space-x-3 text-[10px] text-stone-500 pt-0.5">
                            <span className="font-semibold text-stone-400">Delivery Channels:</span>
                            {r.channels.email && (
                              <span className="flex items-center space-x-0.5 text-stone-700">
                                <Mail className="h-3 w-3 text-[#0B63E5]" />
                                <span>Email</span>
                              </span>
                            )}
                            {r.channels.browser && (
                              <span className="flex items-center space-x-0.5 text-stone-700">
                                <Bell className="h-3 w-3 text-[#0B63E5]" />
                                <span>Browser</span>
                              </span>
                            )}
                            {r.channels.sms && (
                              <span className="flex items-center space-x-0.5 text-stone-700">
                                <Smartphone className="h-3 w-3 text-[#0B63E5]" />
                                <span>SMS</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <button
                            onClick={() => toggleReminder(r.id)}
                            className="rounded border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100"
                          >
                            {r.active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteReminder(r.id)}
                            className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete reminder"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-5">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2dfd5] pb-3">
                <div className="flex items-center space-x-2">
                  <StickyNote className="h-5 w-5 text-[#0B63E5]" />
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Chronological Advocate Case Notes</h3>
                    <p className="text-[11px] text-stone-500">
                      Record, edit, and organize trial notes, client telephone debriefs, and case strategies in chronological order.
                    </p>
                  </div>
                </div>
              </div>

              {noteToast && (
                <div className="rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{noteToast}</span>
                </div>
              )}

              {/* Search, Filter & Sort Controls */}
              <div className="rounded-lg border border-[#e2dfd5] bg-white p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search notes content, title, or author..."
                      value={notesSearchTerm}
                      onChange={(e) => setNotesSearchTerm(e.target.value)}
                      className="w-full rounded-md border border-[#dcd8c9] bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:bg-white focus:border-[#0B63E5] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Filter className="h-3.5 w-3.5 text-stone-500" />
                      <select
                        value={notesCategoryFilter}
                        onChange={(e) => setNotesCategoryFilter(e.target.value)}
                        className="rounded-md border border-[#dcd8c9] bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        <option value="Client Call">Client Call</option>
                        <option value="Court Observation">Court Observation</option>
                        <option value="Strategy">Strategy</option>
                        <option value="Hearing Debrief">Hearing Debrief</option>
                        <option value="General Thoughts">General Thoughts</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setNotesSortOrder(notesSortOrder === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center space-x-1 rounded-md border border-[#dcd8c9] bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Toggle chronological sorting"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-[#0B63E5]" />
                      <span>{notesSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Create New Case Note Form */}
              <form onSubmit={handleAddNote} className="rounded-lg border border-[#e2dfd5] bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-stone-800 text-xs flex items-center space-x-1.5">
                    <Plus className="h-4 w-4 text-[#0B63E5]" />
                    <span>Add New Case Note</span>
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700">Note Headline / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Call with Lead Counsel or Injunction Discussion"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700">Category Classification</label>
                      <select
                        value={newNoteCategory}
                        onChange={(e) => setNewNoteCategory(e.target.value as any)}
                        className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="Client Call">Client Call</option>
                        <option value="Court Observation">Court Observation</option>
                        <option value="Strategy">Strategy</option>
                        <option value="Hearing Debrief">Hearing Debrief</option>
                        <option value="General Thoughts">General Thoughts</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700">Note Details & Instructions</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Type brief notes, phone conversation details, or key instructions..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="mt-1 w-full rounded border border-[#dcd8c9] bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newNotePinned}
                        onChange={(e) => setNewNotePinned(e.target.checked)}
                        className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                      />
                      <Pin className="h-3.5 w-3.5 text-[#0B63E5]" />
                      <span className="text-stone-800 font-semibold text-[11px]">Pin Note to Top of Registry</span>
                    </label>

                    <button
                      type="submit"
                      className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0] cursor-pointer shadow-2xs"
                    >
                      <StickyNote className="h-4 w-4" />
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Chronological Saved Notes List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#0B63E5]" />
                    <span>Case Note Timeline Register ({caseNotes.length})</span>
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Order: {notesSortOrder === 'newest' ? 'Most Recent → Oldest' : 'Oldest → Most Recent'}
                  </span>
                </div>

                {(() => {
                  const filtered = caseNotes.filter((n) => {
                    const matchesSearch =
                      n.title.toLowerCase().includes(notesSearchTerm.toLowerCase()) ||
                      n.content.toLowerCase().includes(notesSearchTerm.toLowerCase()) ||
                      n.author.toLowerCase().includes(notesSearchTerm.toLowerCase());
                    const matchesCat = notesCategoryFilter === 'All' || n.category === notesCategoryFilter;
                    return matchesSearch && matchesCat;
                  });

                  const sorted = [...filtered].sort((a, b) => {
                    // Pinned notes still take priority at top if any
                    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
                    return notesSortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
                  });

                  if (sorted.length === 0) {
                    return (
                      <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center bg-stone-50">
                        <StickyNote className="mx-auto h-8 w-8 text-stone-400 mb-2" />
                        <p className="text-stone-600 font-bold text-xs">No matching case notes found.</p>
                        <p className="text-stone-400 text-[11px] mt-1">Try adjusting your search query or category filter.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {sorted.map((note) => {
                        const isEditing = editingNoteId === note.id;

                        if (isEditing) {
                          return (
                            <div key={note.id} className="rounded-lg border-2 border-[#0B63E5] bg-blue-50/70 p-4 space-y-3 shadow-md">
                              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                                <span className="font-bold text-blue-900 text-xs flex items-center space-x-1">
                                  <Edit className="h-3.5 w-3.5 text-[#0B63E5]" />
                                  <span>Editing Note: {note.title}</span>
                                </span>
                                <span className="text-[10px] text-blue-700 font-mono">Created: {note.date}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-stone-700">Title</label>
                                  <input
                                    type="text"
                                    value={editNoteTitle}
                                    onChange={(e) => setEditNoteTitle(e.target.value)}
                                    className="mt-1 w-full rounded border border-blue-300 bg-white p-2 text-xs font-semibold text-stone-900 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-stone-700">Category</label>
                                  <select
                                    value={editNoteCategory}
                                    onChange={(e) => setEditNoteCategory(e.target.value as any)}
                                    className="mt-1 w-full rounded border border-blue-300 bg-white p-2 text-xs font-semibold text-stone-900 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Client Call">Client Call</option>
                                    <option value="Court Observation">Court Observation</option>
                                    <option value="Strategy">Strategy</option>
                                    <option value="Hearing Debrief">Hearing Debrief</option>
                                    <option value="General Thoughts">General Thoughts</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-stone-700">Content</label>
                                <textarea
                                  rows={4}
                                  value={editNoteContent}
                                  onChange={(e) => setEditNoteContent(e.target.value)}
                                  className="mt-1 w-full rounded border border-blue-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editNotePinned}
                                    onChange={(e) => setEditNotePinned(e.target.checked)}
                                    className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                                  />
                                  <Pin className="h-3.5 w-3.5 text-[#0B63E5]" />
                                  <span className="text-stone-800 font-bold text-[11px]">Keep Note Pinned</span>
                                </label>

                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={handleCancelEditNote}
                                    className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditNote(note.id)}
                                    className="flex items-center space-x-1 rounded bg-[#0B63E5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0256D0] cursor-pointer shadow-2xs"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={note.id}
                            className={`rounded-lg border p-4 transition-all space-y-2.5 ${
                              note.pinned
                                ? 'border-[#0B63E5]/40 bg-blue-50/50 shadow-2xs'
                                : 'border-[#e2dfd5] bg-white hover:border-[#0B63E5]/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {note.pinned && <Pin className="h-3.5 w-3.5 text-[#0B63E5] fill-[#0B63E5] flex-shrink-0" />}
                                <span className="font-bold text-stone-900 text-xs">{note.title}</span>
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                    note.category === 'Client Call'
                                      ? 'bg-purple-100 text-purple-800'
                                      : note.category === 'Court Observation'
                                      ? 'bg-amber-100 text-amber-800'
                                      : note.category === 'Strategy'
                                      ? 'bg-blue-100 text-blue-800'
                                      : note.category === 'Hearing Debrief'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {note.category}
                                </span>
                                {note.audioRecorded && (
                                  <span className="inline-flex items-center space-x-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                                    <Mic className="h-3 w-3 text-red-600" />
                                    <span>Voice Dictation ({note.duration || 'Recorded'})</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyNote(note.id, `${note.title}\n\n${note.content}`)}
                                  title="Copy note to clipboard"
                                  className="rounded p-1 text-stone-400 hover:text-[#0B63E5] hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  {copiedNoteId === note.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleStartEditNote(note)}
                                  title="Edit note content"
                                  className="rounded p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5 text-stone-600" />
                                </button>
                                <button
                                  onClick={() => togglePinNote(note.id)}
                                  title={note.pinned ? 'Unpin note' : 'Pin note'}
                                  className={`rounded p-1 transition-colors cursor-pointer ${
                                    note.pinned ? 'text-[#0B63E5] bg-blue-100' : 'text-stone-400 hover:text-stone-700'
                                  }`}
                                >
                                  <Pin className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  title="Delete note"
                                  className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>

                            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                              <span>
                                Author: <strong className="text-stone-600">{note.author}</strong>
                              </span>
                              <div className="flex items-center space-x-2 font-mono">
                                {note.editedAt && (
                                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Edited: {note.editedAt}
                                  </span>
                                )}
                                <span>{note.date}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client PDF Report Export Modal */}
      <CaseReportModal
        matter={matter}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2 text-purple-800">
                <FolderArchive className="h-5 w-5" />
                <h3 className="font-serif-title font-bold text-base text-stone-900">
                  Move Matter to Archived Register
                </h3>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="rounded p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 text-xs space-y-1 text-purple-950">
              <p className="font-bold">{matter.referenceNumber} - {matter.title}</p>
              <p className="text-[11px] text-purple-800">
                Archiving will move this case out of the active advocates' daily workspace and store it in the LSK-compliant <strong>Archived Matters Register</strong>.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Closing Summary / Archival Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Consent judgment recorded, fee notes settled, and deed plans delivered to client."
                  value={archiveReasonInput}
                  onChange={(e) => setArchiveReasonInput(e.target.value)}
                  className="w-full rounded-md border border-[#dcd8c9] bg-stone-50 p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>Archived By: <strong className="text-stone-700">{matter.responsibleAdvocateName || currentAdvocate?.name || 'Advocate'}</strong></span>
                <span>Date: <strong className="text-stone-700 font-mono">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(matter.id, 'Archived');
                  setShowArchiveModal(false);
                  setArchiveReasonInput('');
                  setArchiveToast(`Matter ${matter.referenceNumber} archived and moved to Archived Register.`);
                  setTimeout(() => setArchiveToast(null), 4000);
                }}
                className="flex items-center space-x-1.5 rounded-lg bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 shadow-md cursor-pointer"
              >
                <Archive className="h-4 w-4" />
                <span>Confirm & Archive File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Matter Task Assignment Modal */}
      {isAssignTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between bg-stone-900 px-6 py-4 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-[#0B63E5] p-2 text-white shadow-2xs">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-title font-bold text-base text-white">
                    Assign Task to Case File
                  </h3>
                  <p className="text-xs text-stone-300">
                    Delegate action items, drafting workload, and hearing preparations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignTaskModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Matter Context Ribbon */}
            <div className="bg-blue-50/80 border-b border-blue-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#0B63E5] font-mono">{matter.referenceNumber}</span>
                <span className="text-stone-400">•</span>
                <span className="font-semibold text-stone-800 line-clamp-1">{matter.title}</span>
              </div>
              <span className="text-stone-600">
                Client: <strong className="text-stone-900">{matter.clientName}</strong>
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateMatterTask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Task Title / Action Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draft Replying Affidavit on Injunction Application"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Assigned Advocate <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    required
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                  >
                    {loadVisibleStaffRoster().map((adv) => (
                      <option key={adv.id} value={adv.name}>
                        {adv.name} — {adv.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Target Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Critical">🔥 Critical (Urgent High Court / Trial Deadline)</option>
                    <option value="High">⚠️ High Priority (Pleadings Filing)</option>
                    <option value="Normal">🔷 Normal Priority (Routine Brief)</option>
                    <option value="Low">⚪ Low Priority (Administrative / Archival)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                  >
                    <option value="open">⚪ Open / Pending Assignment</option>
                    <option value="running">🟡 In Progress (Work Active)</option>
                    <option value="closed">🟢 Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Briefing Notes & Case Strategy Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Include specific instructions, statutory citations (e.g. Order 40 CPR), key documents in case bundle, and advocate expectations..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white p-3 text-xs text-stone-900 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              {/* Subtasks / Checklist builder */}
              <div className="space-y-2 rounded-lg bg-stone-50 p-3.5 border border-stone-200">
                <label className="block text-xs font-bold text-stone-800">
                  Checklist Steps & Action Milestones
                </label>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add step (e.g. Conduct LSK precedent search, File via CTS)..."
                    value={taskSubtaskInput}
                    onChange={(e) => setTaskSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMatterSubtaskItem();
                      }
                    }}
                    className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#0B63E5]"
                  />
                  <button
                    type="button"
                    onClick={handleAddMatterSubtaskItem}
                    className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-300 cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>

                {taskSubtasks.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {taskSubtasks.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-stone-200 text-xs"
                      >
                        <span className="text-stone-700 font-medium">{st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMatterSubtaskItem(idx)}
                          className="text-stone-400 hover:text-red-600 p-0.5 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAssignTaskModalOpen(false)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-5 py-2 text-xs font-bold text-white hover:bg-[#0256D0] shadow-md transition-all cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Confirm & Assign Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matter Tag Modal */}
      <MatterTagModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        matter={matter}
        onUpdateTags={(matterId, newTags) => {
          if (onUpdateTags) {
            onUpdateTags(matterId, newTags);
          }
        }}
      />

      {/* Edit Matter Modal */}
      <EditMatterModal
        isOpen={showEditModal}
        matter={matter}
        onClose={() => setShowEditModal(false)}
        onSaveMatter={(updated) => {
          onUpdateMatter?.(updated);
          setEditToast('Matter details updated successfully');
          setTimeout(() => setEditToast(null), 3500);
        }}
        clients={clients}
        advocates={advocates}
        currentAdvocate={currentAdvocate}
        isManagingAdvocate={isManagingUser}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-slate-900 text-base">
                  Delete Legal Matter
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Action restricted to System Admin & Managing Advocate
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">
                Are you sure you want to permanently delete this matter?
              </p>
              <p className="font-mono text-slate-600">
                {matter.referenceNumber} — {matter.title}
              </p>
              <p className="text-[11px] text-rose-800">
                Client: {matter.clientName}
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This action will permanently delete the matter record from the firm workspace and cloud storage. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-matter"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  onDeleteMatter?.(matter.id);
                  onClose();
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
              >
                Yes, Delete Matter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
