import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Briefcase,
  X,
  Trash2,
  Flame,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Mail,
  ArrowUpDown,
  Calendar,
  Clock,
  User,
  Filter,
  Check,
  Send,
  SlidersHorizontal,
  BarChart3,
} from 'lucide-react';
import { TaskItem, Advocate, LegalMatter, NotificationItem } from '../../types';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';
import {
  generateTaskEmailPayload,
  createTaskAssignmentNotification,
  getAdvocateEmailByName,
  dispatchAssignmentEmail,
  TaskEmailPayload,
} from '../../utils/taskNotificationHelper';
import { TaskEmailNotificationModal } from '../TaskEmailNotificationModal';
import { TaskPerformanceCard } from '../TaskPerformanceCard';

// Priority Level Definition (High, Medium, Low)
export type TaskPriorityLevel = 'High' | 'Medium' | 'Low';

export const normalizePriority = (priority: string): TaskPriorityLevel => {
  const lower = (priority || '').toLowerCase();
  if (lower === 'critical' || lower === 'urgent' || lower === 'high') return 'High';
  if (lower === 'medium' || lower === 'normal' || lower === 'moderate') return 'Medium';
  return 'Low';
};

// Helper to normalize status values to open | running | closed
export const normalizeStatus = (status: string): 'open' | 'running' | 'closed' => {
  const lower = (status || '').toLowerCase();
  if (lower === 'running' || lower === 'in progress') return 'running';
  if (lower === 'closed' || lower === 'completed') return 'closed';
  return 'open';
};

export type TaskSortOption =
  | 'priority-desc'
  | 'priority-asc'
  | 'due-asc'
  | 'due-desc'
  | 'status-open'
  | 'title-asc'
  | 'created-desc';

const priorityWeights: Record<TaskPriorityLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

interface TasksViewProps {
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  matters?: LegalMatter[];
  onOpenNewMatter?: () => void;
  tasks?: TaskItem[];
  onUpdateTasks?: (tasks: TaskItem[]) => void;
  onSelectMatter?: (matter: LegalMatter) => void;
  onAddNotification?: (notification: NotificationItem) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  currentAdvocate,
  isManagingAdvocate = true,
  matters = [],
  onOpenNewMatter,
  tasks: propTasks,
  onUpdateTasks,
  onSelectMatter,
  onAddNotification,
}) => {
  const staffList = loadVisibleStaffRoster();
  const [internalTasks, setInternalTasks] = useState<TaskItem[]>([]);
  const tasks = propTasks !== undefined ? propTasks : internalTasks;

  const updateTasksList = (newTasks: TaskItem[]) => {
    if (onUpdateTasks) {
      onUpdateTasks(newTasks);
    } else {
      setInternalTasks(newTasks);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedMatterFilter, setSelectedMatterFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<TaskSortOption>('priority-desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showPerformanceCard, setShowPerformanceCard] = useState(false);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    actionLabel?: string;
    actionPayload?: TaskEmailPayload;
  } | null>(null);

  // Email Preview Modal State
  const [selectedEmailPayload, setSelectedEmailPayload] = useState<TaskEmailPayload | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMatterId, setNewMatterId] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState(
    currentAdvocate?.name || staffList[0]?.name || 'Advocate'
  );
  const [newPriority, setNewPriority] = useState<TaskPriorityLevel>('High');
  const [newStatus, setNewStatus] = useState<'open' | 'running' | 'closed'>('open');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);

  // When matters change or modal opens, default newMatterId if needed
  useEffect(() => {
    if (matters.length > 0 && !newMatterId) {
      setNewMatterId(matters[0].id);
      if (matters[0].responsibleAdvocateName) {
        setNewAssignedTo(matters[0].responsibleAdvocateName);
      }
    }
  }, [matters, newMatterId]);

  const triggerToast = (text: string, actionLabel?: string, actionPayload?: TaskEmailPayload) => {
    setToastMessage({ text, actionLabel, actionPayload });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Status transition handler
  const handleStatusChange = (taskId: string, newStatusVal: 'open' | 'running' | 'closed') => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const statusText =
          newStatusVal === 'running'
            ? 'In Progress'
            : newStatusVal === 'closed'
            ? 'Completed'
            : 'Not Started';
        return { ...t, status: statusText as any };
      }
      return t;
    });
    updateTasksList(updated);
    const label =
      newStatusVal === 'running'
        ? 'In Progress'
        : newStatusVal === 'closed'
        ? 'Completed'
        : 'Open (Not Started)';
    triggerToast(`Task status updated to "${label}"`);
  };

  // Priority quick change handler
  const handlePriorityChange = (taskId: string, newPrio: TaskPriorityLevel) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, priority: newPrio as any };
      }
      return t;
    });
    updateTasksList(updated);
    triggerToast(`Priority changed to ${newPrio} for task.`);
  };

  // Subtask completion toggle
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    });
    updateTasksList(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    updateTasksList(updated);
    triggerToast('Task deleted from assignment board.');
  };

  const handleAddSubtaskItem = () => {
    if (!newSubtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtaskItem = (index: number) => {
    setNewSubtasks(newSubtasks.filter((_, i) => i !== index));
  };

  const handleOpenEmailPreviewForTask = (task: TaskItem) => {
    const connectedMatter = matters.find((m) => m.id === task.matterId);
    const payload = generateTaskEmailPayload(task, staffList, connectedMatter);
    setSelectedEmailPayload(payload);
    setIsEmailModalOpen(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const selectedMatter = matters.find((m) => m.id === newMatterId);

    const mappedStatus =
      newStatus === 'running' ? 'In Progress' : newStatus === 'closed' ? 'Completed' : 'Not Started';

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      matterId: selectedMatter?.id || 'general-task',
      matterRef: selectedMatter?.referenceNumber || 'General Chambers Task',
      clientName: selectedMatter?.clientName || 'General Administration',
      assignedTo: newAssignedTo,
      createdBy: `${currentAdvocate?.name || 'Advocate'} (${currentAdvocate?.title || 'Chambers'})`,
      priority: newPriority as any,
      status: mappedStatus as any,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      estimatedHours: 4,
      actualHours: 0,
      subtasks: newSubtasks.map((s, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        text: s,
        completed: false,
      })),
      commentsCount: 0,
    };

    updateTasksList([newTask, ...tasks]);

    // Dispatch automated Email Notification & In-App notification
    const emailPayload = generateTaskEmailPayload(newTask, staffList, selectedMatter);
    dispatchAssignmentEmail(emailPayload);
    const inAppNotif = createTaskAssignmentNotification(newTask, staffList);
    
    if (onAddNotification) {
      onAddNotification(inAppNotif);
    }

    setIsAssignModalOpen(false);
    setNewTitle('');
    setNewDescription('');

    const assigneeEmail = getAdvocateEmailByName(newAssignedTo, staffList).email;
    triggerToast(
      `Task assigned to ${newAssignedTo}. Automated notification email dispatched to ${assigneeEmail}`,
      'View Dispatched Email',
      emailPayload
    );
  };

  // Scoped tasks based on role
  const scopedTasks = isManagingAdvocate
    ? tasks
    : tasks.filter((t) =>
        currentAdvocate?.name
          ? t.assignedTo
              .toLowerCase()
              .includes(currentAdvocate.name.toLowerCase())
          : true
      );

  // Filter and Sort logic
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = scopedTasks.filter((t) => {
      const normStat = normalizeStatus(t.status);
      const normPrio = normalizePriority(t.priority);

      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.matterRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || normStat === selectedStatus;

      const matchesPriority =
        selectedPriority === 'all' || normPrio.toLowerCase() === selectedPriority.toLowerCase();

      const matchesAssignee =
        !isManagingAdvocate ||
        selectedAssignee === 'all' ||
        t.assignedTo === selectedAssignee;

      const matchesMatter =
        selectedMatterFilter === 'all' ||
        t.matterId === selectedMatterFilter ||
        (selectedMatterFilter === 'general' && (t.matterId === 'general-task' || !t.matterId));

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesMatter;
    });

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      const prioA = normalizePriority(a.priority);
      const prioB = normalizePriority(b.priority);

      switch (sortBy) {
        case 'priority-desc':
          return priorityWeights[prioB] - priorityWeights[prioA];
        case 'priority-asc':
          return priorityWeights[prioA] - priorityWeights[prioB];
        case 'due-asc':
          return new Date(a.dueDate || '2099-01-01').getTime() - new Date(b.dueDate || '2099-01-01').getTime();
        case 'due-desc':
          return new Date(b.dueDate || '1970-01-01').getTime() - new Date(a.dueDate || '1970-01-01').getTime();
        case 'status-open':
          return (a.status === 'Completed' ? 1 : 0) - (b.status === 'Completed' ? 1 : 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'created-desc':
          return (b.id || '').localeCompare(a.id || '');
        default:
          return 0;
      }
    });
  }, [
    scopedTasks,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedAssignee,
    selectedMatterFilter,
    isManagingAdvocate,
    sortBy,
  ]);

  // Statistics
  const totalCount = tasks.length;
  const openCount = tasks.filter((t) => normalizeStatus(t.status) === 'open').length;
  const runningCount = tasks.filter((t) => normalizeStatus(t.status) === 'running').length;
  const closedCount = tasks.filter((t) => normalizeStatus(t.status) === 'closed').length;
  const highPriorityCount = tasks.filter((t) => normalizePriority(t.priority) === 'High').length;
  const mediumPriorityCount = tasks.filter((t) => normalizePriority(t.priority) === 'Medium').length;
  const lowPriorityCount = tasks.filter((t) => normalizePriority(t.priority) === 'Low').length;

  const currentSelectedMatterObj = matters.find((m) => m.id === newMatterId);
  const currentAssignedAdvocateInfo = getAdvocateEmailByName(newAssignedTo, staffList);

  const activeFilterCount =
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedPriority !== 'all' ? 1 : 0) +
    (selectedAssignee !== 'all' ? 1 : 0) +
    (selectedMatterFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chambers workload — prioritized, assigned, and tracked.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPerformanceCard(!showPerformanceCard)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-2xs transition cursor-pointer ${
              showPerformanceCard
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
            <span>Task Performance</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (matters.length > 0 && !newMatterId) {
                setNewMatterId(matters[0].id);
                if (matters[0].responsibleAdvocateName) {
                  setNewAssignedTo(matters[0].responsibleAdvocateName);
                }
              }
              setIsAssignModalOpen(true);
            }}
            className="rounded-lg bg-[#121c2b] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition cursor-pointer"
          >
            Assign task
          </button>
        </div>
      </div>

      {/* Optional Expandable Task Performance Dashboard Card */}
      {showPerformanceCard && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <TaskPerformanceCard tasks={tasks} />
        </div>
      )}

      {/* Interactive Toast Banner with Action Button */}
      {toastMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 shrink-0">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          {toastMessage.actionLabel && toastMessage.actionPayload && (
            <button
              type="button"
              onClick={() => {
                setSelectedEmailPayload(toastMessage.actionPayload!);
                setIsEmailModalOpen(true);
              }}
              className="shrink-0 inline-flex items-center space-x-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 cursor-pointer shadow-2xs transition"
            >
              <ExternalLink className="h-3 w-3" />
              <span>{toastMessage.actionLabel}</span>
            </button>
          )}
        </div>
      )}

      {/* 4-Metric Connected Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/90 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="p-5">
          <p className="font-heading font-bold text-2xl text-slate-900">{totalCount}</p>
          <p className="text-xs text-slate-500 mt-1">Total tasks</p>
        </div>
        <div className="p-5">
          <p className="font-heading font-bold text-2xl text-amber-600">{openCount}</p>
          <p className="text-xs text-slate-500 mt-1">Open / pending</p>
        </div>
        <div className="p-5">
          <p className="font-heading font-bold text-2xl text-blue-600">{runningCount}</p>
          <p className="text-xs text-slate-500 mt-1">In progress</p>
        </div>
        <div className="p-5">
          <p className="font-heading font-bold text-2xl text-emerald-600">{closedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Closed</p>
        </div>
      </div>

      {/* Priority Pills Container */}
      <div className="rounded-xl border border-slate-200/90 bg-white px-5 py-3 shadow-2xs flex items-center gap-2.5 flex-wrap">
        <span className="text-xs text-slate-500 mr-1.5 font-normal">Priority</span>
        <button
          type="button"
          onClick={() => setSelectedPriority('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
            selectedPriority === 'all'
              ? 'bg-slate-950 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setSelectedPriority('high')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
            selectedPriority === 'high'
              ? 'bg-rose-600 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              selectedPriority === 'high' ? 'bg-white' : 'bg-rose-500'
            }`}
          />
          <span>High ({highPriorityCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedPriority('medium')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
            selectedPriority === 'medium'
              ? 'bg-amber-500 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              selectedPriority === 'medium' ? 'bg-white' : 'bg-amber-500'
            }`}
          />
          <span>Medium ({mediumPriorityCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedPriority('low')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
            selectedPriority === 'low'
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              selectedPriority === 'low' ? 'bg-white' : 'bg-blue-500'
            }`}
          />
          <span>Low ({lowPriorityCount})</span>
        </button>
      </div>

      {/* Search, More Filters, & Sort Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none w-56 shadow-2xs"
              />
            </div>

            {/* More Filters Toggle */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <span>{isFiltersOpen ? '▴ Less filters' : '▾ More filters'}</span>
              {activeFilterCount > (selectedPriority !== 'all' ? 1 : 0) && (
                <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-bold">
                  {activeFilterCount - (selectedPriority !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TaskSortOption)}
              className="bg-transparent border-0 py-1 pl-1 pr-6 text-xs text-slate-700 hover:text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="priority-desc">Priority, high → low</option>
              <option value="priority-asc">Priority, low → high</option>
              <option value="due-asc">Due date, soonest</option>
              <option value="due-desc">Due date, latest</option>
              <option value="status-open">Open & in progress first</option>
              <option value="title-asc">Title, A to Z</option>
              <option value="created-desc">Newest created</option>
            </select>
          </div>
        </div>

        {/* Collapsible More Filters panel */}
        {isFiltersOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 animate-in fade-in duration-150 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Legal Matter File
              </label>
              <select
                value={selectedMatterFilter}
                onChange={(e) => setSelectedMatterFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="all">All Legal Matters ({tasks.length})</option>
                {matters.length > 0 && (
                  <optgroup label="Active Chambers Matters">
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.referenceNumber} - {m.clientName}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="general">General Administrative Tasks</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses (Open, Running, Closed)</option>
                <option value="open">Open (Not Started)</option>
                <option value="running">In Progress (Running)</option>
                <option value="closed">Closed (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Assigned Advocate / Staff
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="all">All Assigned Staff</option>
                {staffList.map((adv) => (
                  <option key={adv.id} value={adv.name}>
                    {adv.name} ({adv.title})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Board Container: Empty state or Tasks Grid */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-16 sm:p-20 text-center space-y-4 shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100/70 text-amber-600">
            <Check className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-slate-900 text-base">
              {tasks.length === 0 ? 'No tasks assigned yet' : 'No matching tasks found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {tasks.length === 0
                ? "Create a task and connect it to a matter, research file, or client instruction to get your chamber's board moving."
                : 'No task records match your active search keywords or filter criteria.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (matters.length > 0 && !newMatterId) {
                  setNewMatterId(matters[0].id);
                }
                setIsAssignModalOpen(true);
              }}
              className="rounded-lg bg-[#121c2b] hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
            >
              Assign new task
            </button>
          </div>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            {filteredAndSortedTasks.map((task) => {
              const currentNormStatus = normalizeStatus(task.status);
              const currentNormPriority = normalizePriority(task.priority);
              const subtasksDone = task.subtasks.filter((s) => s.completed).length;
              const subtasksTotal = task.subtasks.length;
              const subtaskPercent =
                subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

              const connectedMatter = matters.find((m) => m.id === task.matterId);
              const assigneeInfo = getAdvocateEmailByName(task.assignedTo, staffList);

              // Priority Border & Background Styling
              const isHigh = currentNormPriority === 'High';
              const isMedium = currentNormPriority === 'Medium';
              const isLow = currentNormPriority === 'Low';

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Top Badges & Actions Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Indicator Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide border ${
                          isHigh
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : isMedium
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-sky-50 text-sky-900 border-sky-200'
                        }`}
                      >
                        {isHigh ? (
                          <Flame className="h-3 w-3 text-rose-600" />
                        ) : isMedium ? (
                          <Clock className="h-3 w-3 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-sky-600" />
                        )}
                        <span>{currentNormPriority} Priority</span>
                      </span>

                      {/* Status Indicator */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          currentNormStatus === 'open'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : currentNormStatus === 'running'
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            currentNormStatus === 'open'
                              ? 'bg-amber-500'
                              : currentNormStatus === 'running'
                              ? 'bg-blue-600 animate-pulse'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <span className="capitalize">
                          {currentNormStatus === 'running' ? 'In Progress' : currentNormStatus === 'open' ? 'Open' : 'Completed'}
                        </span>
                      </span>
                    </div>

                    {/* Quick Priority & Status Switcher Dropdown */}
                    <div className="flex items-center gap-1.5">
                      {/* Priority Inline Switcher */}
                      <select
                        value={currentNormPriority}
                        onChange={(e) => handlePriorityChange(task.id, e.target.value as TaskPriorityLevel)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-none shadow-2xs"
                        title="Change Priority Level"
                      >
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>

                      {/* Status Setter Dropdown */}
                      <select
                        value={currentNormStatus}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-none shadow-2xs"
                      >
                        <option value="open">Set Open</option>
                        <option value="running">Set In Progress</option>
                        <option value="closed">Set Completed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Title & Description */}
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-base leading-snug">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Attached Legal Matter & Client Context */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {task.matterRef}
                        </span>
                      </div>
                      {connectedMatter && onSelectMatter && (
                        <button
                          type="button"
                          onClick={() => onSelectMatter(connectedMatter)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
                        >
                          <span>Open Matter</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Client:</span>
                        <span className="font-semibold text-slate-800">{task.clientName}</span>
                      </div>
                      {connectedMatter && (
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                          {connectedMatter.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignee & Dates Bar + Email Dispatch Indicator */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400">
                          Assigned Advocate:
                        </span>
                        <span className="font-semibold text-slate-900">{task.assignedTo}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400">
                          Target Due Date:
                        </span>
                        <span className="font-mono font-bold text-slate-800">{task.dueDate}</span>
                      </div>
                    </div>

                    {/* Email Notification Dispatch Link */}
                    <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-lg px-2.5 py-1.5 text-[11px]">
                      <div className="flex items-center space-x-1.5 text-blue-900">
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                        <span>Email Sent to: <strong className="font-mono">{assigneeInfo.email}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEmailPreviewForTask(task)}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center space-x-0.5"
                      >
                        <span>Preview Email</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Checklist / Subtasks */}
                  {subtasksTotal > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Checklist Subtasks ({subtasksDone}/{subtasksTotal})</span>
                        <span>{subtaskPercent}%</span>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-900 h-1.5 transition-all duration-300"
                          style={{ width: `${subtaskPercent}%` }}
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        {task.subtasks.map((st) => (
                          <label
                            key={st.id}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition"
                          >
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => handleToggleSubtask(task.id, st.id)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                            />
                            <span className={st.completed ? 'line-through text-slate-400' : ''}>
                              {st.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Task Creation Modal with Priority Selector & Email Dispatch */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base">Assign New Case Task / Workload</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Task Title / Action Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Replying Affidavit & E-file on Judiciary CTS Portal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Associated Legal Matter Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Attach to Legal Matter / Case File *
                  </label>
                  {matters.length > 0 && (
                    <span className="text-[10px] font-semibold text-amber-800">
                      {matters.length} active cases available
                    </span>
                  )}
                </div>

                <select
                  value={newMatterId}
                  onChange={(e) => {
                    const mid = e.target.value;
                    setNewMatterId(mid);
                    const matched = matters.find((m) => m.id === mid);
                    if (matched?.responsibleAdvocateName) {
                      setNewAssignedTo(matched.responsibleAdvocateName);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  {matters.length === 0 ? (
                    <option value="">General Chambers Task (No Active Cases)</option>
                  ) : (
                    <>
                      <option value="">-- General Administrative Task (No Matter Attached) --</option>
                      {matters.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.referenceNumber} — {m.title} ({m.clientName})
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {/* Selected Matter Preview Information Card */}
                {currentSelectedMatterObj && (
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-600" />
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {currentSelectedMatterObj.referenceNumber}
                        </span>
                      </div>
                      <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {currentSelectedMatterObj.practiceArea}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 text-xs">
                      {currentSelectedMatterObj.title}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">
                          Represented Client
                        </span>
                        <span className="font-semibold text-slate-900">
                          {currentSelectedMatterObj.clientName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">
                          Assigned Lead Advocate
                        </span>
                        <span className="font-semibold text-slate-900">
                          {currentSelectedMatterObj.responsibleAdvocateName}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignee & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Assign To Advocate / Staff *
                  </label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    {staffList.map((adv) => (
                      <option key={adv.id} value={adv.name}>
                        {adv.name} ({adv.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Target Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Priority Level System (High, Medium, Low) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Priority Level Urgency *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewPriority('High')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer ${
                      newPriority === 'High'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-2xs ring-2 ring-rose-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center space-x-1 font-bold text-xs">
                      <Flame className="h-3.5 w-3.5 text-rose-600" />
                      <span>High Priority</span>
                    </div>
                    <span className="text-[10px] text-rose-700 mt-0.5">Court / Injunction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPriority('Medium')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer ${
                      newPriority === 'Medium'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center space-x-1 font-bold text-xs">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>Medium</span>
                    </div>
                    <span className="text-[10px] text-amber-700 mt-0.5">Standard Case Brief</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPriority('Low')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer ${
                      newPriority === 'Low'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-2xs ring-2 ring-sky-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="flex items-center space-x-1 font-bold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                      <span>Low Priority</span>
                    </div>
                    <span className="text-[10px] text-sky-700 mt-0.5">Administrative</span>
                  </button>
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="open">Open (Not Started)</option>
                  <option value="running">In Progress (Active)</option>
                  <option value="closed">Closed (Completed)</option>
                </select>
              </div>

              {/* Automated Email Dispatch Notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 flex items-start space-x-2.5">
                <Mail className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <p className="font-bold text-blue-900">
                    Automated Staff Email Notification
                  </p>
                  <p className="text-blue-800">
                    Upon assignment, an automated task briefing email will be transmitted to{' '}
                    <strong className="font-mono">{currentAssignedAdvocateInfo.name} ({currentAssignedAdvocateInfo.email})</strong> with the case details and deadline.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Detailed Instructions & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide background, legal strategy, or specific filing requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Subtasks checklist input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Subtask Checklist Items
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist step..."
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskItem}
                    className="rounded-xl bg-slate-900 text-white px-3.5 py-1.5 font-semibold text-xs hover:bg-slate-800 cursor-pointer shadow-2xs transition"
                  >
                    Add Step
                  </button>
                </div>

                {newSubtasks.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {newSubtasks.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-slate-800">{st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtaskItem(idx)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800 cursor-pointer transition shadow-sm"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>Confirm, Assign & Dispatch Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Email Notification Modal */}
      <TaskEmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        emailPayload={selectedEmailPayload}
      />
    </div>
  );
};
