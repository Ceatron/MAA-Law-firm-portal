import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  Circle,
  ListTodo,
  Building2,
  Phone,
  MapPin,
  Shield,
  FileText,
  Info,
} from 'lucide-react';
import { TaskItem, Advocate, LegalMatter, NotificationItem, Client } from '../../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../../utils/staffStorage';
import {
  generateTaskEmailPayload,
  createTaskAssignmentNotification,
  getAdvocateEmailByName,
  dispatchAssignmentEmail,
  TaskEmailPayload,
} from '../../utils/taskNotificationHelper';
import { TaskEmailNotificationModal } from '../TaskEmailNotificationModal';
import { TaskPerformanceCard } from '../TaskPerformanceCard';
import { isTaskVisibleToUser, canUserViewAll, namesMatch } from '../../utils/visibilityRules';
import { deleteStoredTask, loadSavedClients } from '../../utils/chambersDataStorage';

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
  clients?: Client[];
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
  clients: propClients = [],
  onOpenNewMatter,
  tasks: propTasks,
  onUpdateTasks,
  onSelectMatter,
  onAddNotification,
}) => {
  const staffList = loadVisibleStaffRoster();
  const [internalClients] = useState<Client[]>(() => loadSavedClients());
  const clients = propClients.length > 0 ? propClients : internalClients;
  const isSysAdmin = isSysAdminUser(currentAdvocate);
  const isManagingUser =
    isSysAdmin ||
    Boolean(isManagingAdvocate) ||
    currentAdvocate?.role === 'Managing Advocate' ||
    currentAdvocate?.id === 'adv-1' ||
    Boolean(currentAdvocate?.title?.toLowerCase().includes('managing'));
  const canAssignTasks = isSysAdmin || isManagingUser;
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when '/' is pressed, or clear with 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedMatterFilter, setSelectedMatterFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<TaskSortOption>('priority-desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showPerformanceCard, setShowPerformanceCard] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    actionLabel?: string;
    actionPayload?: TaskEmailPayload;
  } | null>(null);

  // Email Preview Modal State
  const [selectedEmailPayload, setSelectedEmailPayload] = useState<TaskEmailPayload | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Sanitize matters across Chambers tasks
  const sanitizedMatters = useMemo(() => {
    return (matters || []).filter(
      (m) => m && m.referenceNumber !== 'MAA/CIV/2026/735' && !m.referenceNumber?.includes('735')
    );
  }, [matters]);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId] = useState('');
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

  // Interactive Client Details Modal state
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Deletion Confirmation Dialog States
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [subtaskToDelete, setSubtaskToDelete] = useState<{
    taskId: string;
    subtaskId: string;
    text: string;
  } | null>(null);
  const [formSubtaskIndexToRemove, setFormSubtaskIndexToRemove] = useState<number | null>(null);

  // Available transactions for currently selected client in Task Assignment Modal
  const availableTransactionsForClient = useMemo(() => {
    if (!newClientId) return sanitizedMatters;
    const selClient = clients.find((c) => c.id === newClientId);
    const clientNameNorm = selClient?.name.toLowerCase() || '';
    return sanitizedMatters.filter(
      (m) =>
        (m.clientId && m.clientId === newClientId) ||
        (clientNameNorm && m.clientName.toLowerCase() === clientNameNorm)
    );
  }, [newClientId, clients, sanitizedMatters]);

  // When client changes in the task assignment modal
  const handleClientSelectionChange = (clientId: string) => {
    setNewClientId(clientId);
    if (!clientId) return;
    const selClient = clients.find((c) => c.id === clientId);
    const clientNameNorm = selClient?.name.toLowerCase() || '';
    const clientMatters = sanitizedMatters.filter(
      (m) =>
        (m.clientId && m.clientId === clientId) ||
        (clientNameNorm && m.clientName.toLowerCase() === clientNameNorm)
    );
    if (clientMatters.length > 0) {
      setNewMatterId(clientMatters[0].id);
      if (clientMatters[0].responsibleAdvocateName) {
        setNewAssignedTo(clientMatters[0].responsibleAdvocateName);
      }
    } else {
      setNewMatterId('');
    }
  };

  // When transaction/matter changes in the task assignment modal
  const handleMatterSelectionChange = (matterId: string) => {
    setNewMatterId(matterId);
    if (!matterId) return;
    const m = sanitizedMatters.find((item) => item.id === matterId);
    if (m) {
      if (m.responsibleAdvocateName) {
        setNewAssignedTo(m.responsibleAdvocateName);
      }
      const matchedClient = clients.find(
        (c) =>
          (m.clientId && c.id === m.clientId) ||
          c.name.toLowerCase() === m.clientName.toLowerCase()
      );
      if (matchedClient) {
        setNewClientId(matchedClient.id);
      }
    }
  };

  // Default initial matter and client when modal opens or matters change
  useEffect(() => {
    if (sanitizedMatters.length > 0 && !newMatterId) {
      setNewMatterId(sanitizedMatters[0].id);
      if (sanitizedMatters[0].responsibleAdvocateName) {
        setNewAssignedTo(sanitizedMatters[0].responsibleAdvocateName);
      }
      if (sanitizedMatters[0].clientId) {
        setNewClientId(sanitizedMatters[0].clientId);
      } else {
        const matchingClient = clients.find(
          (c) => c.name.toLowerCase() === sanitizedMatters[0].clientName.toLowerCase()
        );
        if (matchingClient) {
          setNewClientId(matchingClient.id);
        }
      }
    }
  }, [sanitizedMatters, newMatterId, clients]);

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

  // Delete task initiating confirmation dialogue
  const handleDeleteTask = (taskOrId: TaskItem | string) => {
    const task = typeof taskOrId === 'string' ? tasks.find((t) => t.id === taskOrId) : taskOrId;
    if (task) {
      setTaskToDelete(task);
    }
  };

  // Confirmed task deletion
  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    deleteStoredTask(taskToDelete.id);
    const updated = tasks.filter((t) => t.id !== taskToDelete.id);
    updateTasksList(updated);
    triggerToast(`Task "${taskToDelete.title}" deleted.`);
    setTaskToDelete(null);
  };

  // Confirmed subtask deletion
  const handleConfirmDeleteSubtask = () => {
    if (!subtaskToDelete) return;
    const updated = tasks.map((t) => {
      if (t.id === subtaskToDelete.taskId) {
        return {
          ...t,
          subtasks: t.subtasks.filter((s) => s.id !== subtaskToDelete.subtaskId),
        };
      }
      return t;
    });
    updateTasksList(updated);
    triggerToast(`Checklist step deleted.`);
    setSubtaskToDelete(null);
  };

  // Confirmed removal of subtask from creation form
  const handleConfirmRemoveFormSubtask = () => {
    if (formSubtaskIndexToRemove === null) return;
    setNewSubtasks(newSubtasks.filter((_, i) => i !== formSubtaskIndexToRemove));
    setFormSubtaskIndexToRemove(null);
  };

  // Open Client Details Modal
  const handleOpenClientDetails = (clientName?: string, clientId?: string) => {
    if (!clientName && !clientId) return;
    let found = clients.find(
      (c) => (clientId && c.id === clientId) || (clientName && c.name.toLowerCase() === clientName.toLowerCase())
    );
    if (!found && clientName) {
      found = {
        id: clientId || `client-ref-${Date.now()}`,
        name: clientName,
        type: clientName.toLowerCase().includes('ltd') ||
              clientName.toLowerCase().includes('bank') ||
              clientName.toLowerCase().includes('properties') ||
              clientName.toLowerCase().includes('limited')
                ? 'Corporate'
                : 'Individual',
        industry: 'Commercial Practice / Retainer Client',
        contactPerson: clientName,
        email: `info@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.co.ke`,
        phone: '+254 700 000 000',
        city: 'Nairobi, Kenya',
        activeMattersCount: sanitizedMatters.filter((m) => m.clientName.toLowerCase() === clientName.toLowerCase()).length || 1,
        totalBilledKES: 0,
      };
    }
    if (found) {
      setViewingClient(found);
    }
  };

  // Open Transaction / Legal Matter Details Drawer
  const handleOpenTransactionDetails = (matter?: LegalMatter, task?: TaskItem) => {
    let targetMatter =
      matter ||
      (task
        ? sanitizedMatters.find(
            (m) =>
              (task.matterId && m.id === task.matterId) ||
              (task.matterRef && m.referenceNumber === task.matterRef) ||
              (task.matterTitle && m.title.toLowerCase() === task.matterTitle.toLowerCase()) ||
              (task.transactionTitle && m.title.toLowerCase() === task.transactionTitle.toLowerCase())
          )
        : undefined);

    if (!targetMatter && task) {
      targetMatter = sanitizedMatters.find(
        (m) => task.clientName && m.clientName.toLowerCase() === task.clientName.toLowerCase()
      );
    }

    if (!targetMatter && task) {
      targetMatter = {
        id: task.matterId || `matter-trx-${task.id}`,
        referenceNumber: task.matterRef || `MAA/TRX/2026/${task.id.slice(-3)}`,
        title: task.matterTitle || task.transactionTitle || `${task.title} (Transaction File)`,
        clientName: task.clientName || 'General Client',
        practiceArea: 'Commercial Practice & Advisory',
        status: 'Active',
        description: task.description || `Transaction workspace file for ${task.title}. Client: ${task.clientName}.`,
        responsibleAdvocateId: task.assignedToId || currentAdvocate?.id || 'adv-1',
        responsibleAdvocateName: task.assignedTo || currentAdvocate?.name || 'Adv. Paul Ahago',
        createdDate: task.startDate || new Date().toISOString().split('T')[0],
        nextDeadlineDate: task.dueDate || new Date().toISOString().split('T')[0],
        nextDeadlineDescription: task.title,
        priority: (task.priority === 'Critical' ? 'Critical' : task.priority === 'High' ? 'High' : 'Medium') as any,
        documentsCount: 0,
        billedKES: 0,
        paidKES: 0,
        estimatedFeeKES: 0,
      };
    }

    if (targetMatter && onSelectMatter) {
      onSelectMatter(targetMatter);
    } else if (task) {
      triggerToast(`Transaction: ${task.matterTitle || task.matterRef} (${task.clientName})`);
    }
  };

  const handleAddSubtaskItem = () => {
    if (!newSubtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput('');
  };

  const handleOpenEmailPreviewForTask = (task: TaskItem) => {
    const connectedMatter = sanitizedMatters.find(
      (m) => (task.matterId && m.id === task.matterId) || (task.matterRef && m.referenceNumber === task.matterRef)
    );
    const payload = generateTaskEmailPayload(task, staffList, connectedMatter);
    setSelectedEmailPayload(payload);
    setIsEmailModalOpen(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const selectedMatter = sanitizedMatters.find((m) => m.id === newMatterId);
    const chosenClient =
      clients.find((c) => c.id === newClientId) ||
      (selectedMatter?.clientName
        ? clients.find((c) => c.name.toLowerCase() === selectedMatter.clientName.toLowerCase())
        : undefined);

    const clientDisplayName =
      chosenClient?.name ||
      selectedMatter?.clientName ||
      (newClientId ? clients.find((c) => c.id === newClientId)?.name : '') ||
      'General Chambers Client';

    const matterReference =
      selectedMatter?.referenceNumber ||
      (chosenClient ? `TRX-${chosenClient.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}` : 'General Task');

    const matterTitle = selectedMatter?.title || (newMatterId ? 'Matter Action' : undefined);

    const mappedStatus =
      newStatus === 'running' ? 'In Progress' : newStatus === 'closed' ? 'Completed' : 'Not Started';

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      matterId: selectedMatter?.id || (newMatterId ? newMatterId : 'general-task'),
      matterRef: matterReference,
      matterTitle: matterTitle,
      transactionTitle: matterTitle,
      clientName: clientDisplayName,
      clientId: chosenClient?.id || selectedMatter?.clientId || (newClientId || undefined),
      assignedTo: newAssignedTo,
      assignedToId: staffList.find((a) => namesMatch(a.name, newAssignedTo))?.id,
      assignedToEmail: getAdvocateEmailByName(newAssignedTo, staffList).email,
      createdBy: `${currentAdvocate?.name || 'Advocate'} (${currentAdvocate?.title || 'Chambers'})`,
      createdById: currentAdvocate?.id,
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

    // Record in-app notification
    const inAppNotif = createTaskAssignmentNotification(newTask, staffList);
    if (onAddNotification) {
      onAddNotification(inAppNotif);
    }

    // Dispatch automated assignment email via server gateway
    try {
      const emailPayload = generateTaskEmailPayload(newTask, staffList, selectedMatter);
      dispatchAssignmentEmail(emailPayload).catch((err) => {
        console.warn('[TasksView] Task assignment email dispatch notice:', err);
      });
    } catch (err) {
      console.warn('[TasksView] Failed to generate task assignment email payload:', err);
    }

    setIsAssignModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewSubtasks([]);
    setNewSubtaskInput('');

    triggerToast(`Task assigned to ${newAssignedTo} under transaction ${matterReference}.`);
  };

  // Matters and Tasks for the currently viewed client in Client Details modal
  const clientMattersForViewing = useMemo(() => {
    if (!viewingClient) return [];
    return (sanitizedMatters || []).filter(
      (m) =>
        m.clientId === viewingClient.id ||
        m.clientName.toLowerCase() === viewingClient.name.toLowerCase()
    );
  }, [viewingClient, sanitizedMatters]);

  const clientTasksForViewing = useMemo(() => {
    if (!viewingClient) return [];
    return (tasks || []).filter(
      (t) =>
        t.clientId === viewingClient.id ||
        t.clientName.toLowerCase() === viewingClient.name.toLowerCase()
    );
  }, [viewingClient, tasks]);

  // Scoped tasks based on role (Managing Advocate & System Admin see ALL tasks)
  const effectiveCanViewAll = isManagingAdvocate || canUserViewAll(currentAdvocate);

  const scopedTasks = (effectiveCanViewAll
    ? tasks
    : tasks.filter((t) => isTaskVisibleToUser(t, currentAdvocate, sanitizedMatters))
  ).filter(
    (t) =>
      t &&
      t.matterRef !== 'MAA/CIV/2026/735' &&
      !t.matterRef?.includes('735') &&
      !t.title?.includes('735') &&
      !t.description?.includes('735')
  );

  // Filter and Sort logic
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = scopedTasks.filter((t) => {
      const normStat = normalizeStatus(t.status);
      const normPrio = normalizePriority(t.priority);

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        t.title?.toLowerCase().includes(query) ||
        t.matterRef?.toLowerCase().includes(query) ||
        t.clientName?.toLowerCase().includes(query) ||
        t.assignedTo?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.priority?.toLowerCase().includes(query) ||
        t.status?.toLowerCase().includes(query) ||
        t.subtasks?.some((st) => st.title?.toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === 'all' || normStat === selectedStatus;

      const matchesPriority =
        selectedPriority === 'all' || normPrio.toLowerCase() === selectedPriority.toLowerCase();

      const matchesAssignee =
        !effectiveCanViewAll ||
        selectedAssignee === 'all' ||
        namesMatch(t.assignedTo, selectedAssignee);

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

          {canAssignTasks && (
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
          )}
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

      {/* Search, Filters & Quick Actions Toolbar */}
      <div className="space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Prominent Search Bar */}
          <div className="relative flex-1 max-w-xl group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks by title, matter ref, client, advocate, or checklist item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-14 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none shadow-2xs transition"
            />
            {/* Clear button or shortcut hint */}
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Clear search query"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200 select-none">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Quick Filter Buttons & Sort Control */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick 'My Tasks' shortcut if current user has an advocate identity */}
            {currentAdvocate?.name && (
              <button
                type="button"
                onClick={() => {
                  if (selectedAssignee === currentAdvocate.name) {
                    setSelectedAssignee('all');
                  } else {
                    setSelectedAssignee(currentAdvocate.name);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-2xs transition cursor-pointer ${
                  selectedAssignee === currentAdvocate.name
                    ? 'bg-[#121c2b] border-[#121c2b] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>My Tasks</span>
              </button>
            )}

            {/* More Filters Toggle */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-2xs transition cursor-pointer ${
                isFiltersOpen || activeFilterCount > (selectedPriority !== 'all' ? 1 : 0)
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
              <span>Filters</span>
              {activeFilterCount > (selectedPriority !== 'all' ? 1 : 0) && (
                <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-bold">
                  {activeFilterCount - (selectedPriority !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs text-xs text-slate-700">
              <span className="text-slate-400 mr-1.5 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TaskSortOption)}
                aria-label="Sort tasks by"
                className="bg-transparent border-0 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="priority-desc">Priority (High → Low)</option>
                <option value="priority-asc">Priority (Low → High)</option>
                <option value="due-asc">Due Date (Soonest)</option>
                <option value="due-desc">Due Date (Latest)</option>
                <option value="status-open">Open & In Progress First</option>
                <option value="title-asc">Title (A to Z)</option>
                <option value="created-desc">Newest Created</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Search & Filters Info Bar */}
        {(searchQuery.trim() !== '' || activeFilterCount > 0) && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200/80 text-xs text-slate-700 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">
                {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'} found
              </span>
              {searchQuery.trim() !== '' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] text-slate-700 font-medium shadow-2xs">
                  matching &ldquo;<span className="font-bold text-amber-700">{searchQuery.trim()}</span>&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Remove search query"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedAssignee !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] text-slate-700 font-medium shadow-2xs">
                  Assigned to: <strong className="text-slate-900">{selectedAssignee}</strong>
                  <button
                    type="button"
                    onClick={() => setSelectedAssignee('all')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Clear assignee filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedMatterFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] text-slate-700 font-medium shadow-2xs">
                  Matter filtered
                  <button
                    type="button"
                    onClick={() => setSelectedMatterFilter('all')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Clear matter filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedPriority('all');
                setSelectedAssignee('all');
                setSelectedMatterFilter('all');
              }}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer ml-auto shrink-0"
            >
              Reset all filters
            </button>
          </div>
        )}

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
                {sanitizedMatters.length > 0 && (
                  <optgroup label="Active Chambers Matters">
                    {sanitizedMatters.map((m) => (
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
            {searchQuery.trim() ? (
              <Search className="h-6 w-6 stroke-[2.5]" />
            ) : (
              <Check className="h-6 w-6 stroke-[2.5]" />
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-slate-900 text-base">
              {tasks.length === 0
                ? 'No tasks assigned yet'
                : searchQuery.trim()
                ? `No tasks matching "${searchQuery.trim()}"`
                : 'No matching tasks found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {tasks.length === 0
                ? "Create a task and connect it to a matter, research file, or client instruction to get your chamber's board moving."
                : searchQuery.trim()
                ? 'No task records matched your search query across titles, matters, clients, assignees, or subtasks.'
                : 'No task records match your active filter criteria.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {searchQuery.trim() || activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSelectedAssignee('all');
                  setSelectedMatterFilter('all');
                  searchInputRef.current?.focus();
                }}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
              >
                Clear search & filters
              </button>
            ) : null}
            {canAssignTasks && (
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
            )}
          </div>
        </div>
      ) : (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            {/* Desktop List Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3 bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-4">Task & Matter Details</div>
              <div className="col-span-2">Assigned Advocate</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-1 text-center">Checklist</div>
              <div className="col-span-2 text-right">Quick Actions</div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-slate-100">
              {filteredAndSortedTasks.map((task) => {
                const currentNormStatus = normalizeStatus(task.status);
                const currentNormPriority = normalizePriority(task.priority);
                const subtasksDone = task.subtasks.filter((s) => s.completed).length;
                const subtasksTotal = task.subtasks.length;
                const subtaskPercent =
                  subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

                const connectedMatter = matters.find((m) => m.id === task.matterId);
                const assigneeInfo = getAdvocateEmailByName(task.assignedTo, staffList);

                const isHigh = currentNormPriority === 'High';
                const isMedium = currentNormPriority === 'Medium';
                const isLow = currentNormPriority === 'Low';

                const isClosed = currentNormStatus === 'closed';
                const isRunning = currentNormStatus === 'running';

                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = !isClosed && task.dueDate && task.dueDate < todayStr;
                const isDueToday = !isClosed && task.dueDate === todayStr;

                const isExpanded = Boolean(expandedTaskIds[task.id]);

                return (
                  <div
                    key={task.id}
                    className={`transition-colors ${
                      isClosed ? 'bg-slate-50/40 hover:bg-slate-50/80' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Primary Row Content */}
                    <div className="p-4 lg:px-5 lg:py-3.5 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center">
                      {/* 1. Quick Complete & Status (Col 1) */}
                      <div className="lg:col-span-1 flex items-center justify-between lg:justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(task.id, isClosed ? 'open' : 'closed')}
                          className="cursor-pointer transition-transform active:scale-90 inline-flex items-center gap-1.5 group"
                          title={isClosed ? 'Mark task as open' : 'Mark task as completed'}
                        >
                          {isClosed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : isRunning ? (
                            <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-50 group-hover:border-emerald-500">
                              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse group-hover:bg-emerald-500" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                          )}
                          <span className="lg:hidden text-xs font-semibold text-slate-700">
                            {isClosed ? 'Completed' : isRunning ? 'In Progress' : 'Open'}
                          </span>
                        </button>

                        {/* Mobile-only delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="lg:hidden rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* 2. Task Details, Badges & Matter (Col 4) */}
                      <div className="lg:col-span-4 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Priority Pill */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide border ${
                              isHigh
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : isMedium
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-sky-50 text-sky-900 border-sky-200'
                            }`}
                          >
                            {isHigh ? (
                              <Flame className="h-2.5 w-2.5 text-rose-600" />
                            ) : isMedium ? (
                              <Clock className="h-2.5 w-2.5 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="h-2.5 w-2.5 text-sky-600" />
                            )}
                            <span>{currentNormPriority}</span>
                          </span>

                          {/* Status Pill (desktop) */}
                          <span
                            className={`hidden lg:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              isClosed
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isRunning
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isClosed
                                  ? 'bg-emerald-600'
                                  : isRunning
                                  ? 'bg-blue-600 animate-pulse'
                                  : 'bg-amber-500'
                              }`}
                            />
                            <span>{isClosed ? 'Closed' : isRunning ? 'Running' : 'Open'}</span>
                          </span>

                        </div>

                        {/* Title & Description - Task title is clickable to open transaction details */}
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenTransactionDetails(connectedMatter, task)}
                            className="text-left font-bold text-slate-900 leading-snug hover:text-amber-800 hover:underline cursor-pointer group inline-flex items-start gap-1.5 text-sm"
                            title="Click task title to open transaction details"
                          >
                            <span className={isClosed ? 'line-through text-slate-400' : ''}>
                              {task.title}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-amber-800 shrink-0 mt-0.5" />
                          </button>
                          {task.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Linked Client & Linked Transaction Context */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px]">
                          {/* Clickable Client Badge */}
                          <div className="inline-flex items-center gap-1 text-slate-500">
                            <span className="text-slate-400 font-medium text-[10px]">Client:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenClientDetails(task.clientName, task.clientId)}
                              className="font-semibold text-slate-800 hover:text-amber-800 hover:underline cursor-pointer inline-flex items-center gap-1 group bg-slate-100/80 hover:bg-amber-50 px-2 py-0.5 rounded-md transition border border-slate-200/70"
                              title={`Click to view client details for ${task.clientName}`}
                            >
                              <Building2 className="h-2.5 w-2.5 text-slate-500 group-hover:text-amber-700" />
                              <span>{task.clientName}</span>
                            </button>
                          </div>

                          <span className="text-slate-300">•</span>

                          {/* Clickable Transaction Badge */}
                          <div className="inline-flex items-center gap-1 text-slate-500">
                            <span className="text-slate-400 font-medium text-[10px]">Transaction:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenTransactionDetails(connectedMatter, task)}
                              className="font-semibold text-amber-900 hover:text-amber-950 hover:underline cursor-pointer inline-flex items-center gap-1 group bg-amber-50/90 hover:bg-amber-100 px-2 py-0.5 rounded-md transition border border-amber-200/80 max-w-full"
                              title={`Click to open transaction details: ${task.matterRef} - ${task.matterTitle || task.transactionTitle || connectedMatter?.title || ''}`}
                            >
                              <Briefcase className="h-2.5 w-2.5 text-amber-700 shrink-0" />
                              <span className="font-mono text-[10px] font-bold shrink-0">{task.matterRef}</span>
                              {(task.matterTitle || task.transactionTitle || connectedMatter?.title) && (
                                <span className="truncate max-w-[190px] text-slate-700 font-medium text-[11px]">
                                  — {task.matterTitle || task.transactionTitle || connectedMatter?.title}
                                </span>
                              )}
                              <ExternalLink className="h-2.5 w-2.5 text-amber-700 opacity-60 group-hover:opacity-100 shrink-0" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Assigned Advocate & Email (Col 2) */}
                      <div className="lg:col-span-2 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 shrink-0">
                            {task.assignedTo.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-slate-800 truncate" title={task.assignedTo}>
                            {task.assignedTo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEmailPreviewForTask(task)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 hover:text-blue-900 hover:underline bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded cursor-pointer transition"
                          title={`Preview notification email for ${assigneeInfo.email}`}
                        >
                          <Mail className="h-2.5 w-2.5 text-blue-600" />
                          <span className="truncate max-w-[130px]">{assigneeInfo.email}</span>
                        </button>
                      </div>

                      {/* 4. Due Date & Timeline Status (Col 2) */}
                      <div className="lg:col-span-2 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {task.dueDate || 'No due date'}
                          </span>
                        </div>
                        <div>
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              <span>Overdue</span>
                            </span>
                          ) : isDueToday ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              <Clock className="h-2.5 w-2.5" />
                              <span>Due Today</span>
                            </span>
                          ) : isClosed ? (
                            <span className="text-[10px] font-medium text-emerald-700">Completed</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">On Track</span>
                          )}
                        </div>
                      </div>

                      {/* 5. Checklist / Subtasks (Col 1) */}
                      <div className="lg:col-span-1 lg:text-center">
                        {subtasksTotal > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleTaskExpand(task.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition cursor-pointer ${
                              isExpanded
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                            }`}
                            title="Toggle action checklist subtasks"
                          >
                            <CheckSquare className="h-3 w-3" />
                            <span>
                              {subtasksDone}/{subtasksTotal}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">—</span>
                        )}
                      </div>

                      {/* 6. Inline Selectors & Actions (Col 2) */}
                      <div className="lg:col-span-2 flex items-center lg:justify-end gap-1.5 flex-wrap">

                        {/* Status Setter */}
                        <select
                          value={currentNormStatus}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer focus:outline-none shadow-2xs"
                          title="Update Task Status"
                        >
                          <option value="open">Open</option>
                          <option value="running">In Progress</option>
                          <option value="closed">Completed</option>
                        </select>

                        {/* Delete Button (desktop) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="hidden lg:inline-flex rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Subtasks Checklist Panel */}
                    {isExpanded && subtasksTotal > 0 && (
                      <div className="bg-slate-50/90 px-5 py-3 border-t border-slate-200/70 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span>
                            Action Checklist Items ({subtasksDone}/{subtasksTotal} completed)
                          </span>
                          <span className="font-mono">{subtaskPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 h-1.5 transition-all duration-200"
                            style={{ width: `${subtaskPercent}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between gap-2 text-xs text-slate-700 hover:bg-white p-2 rounded-lg border border-slate-200/70 transition bg-white/70 group"
                            >
                              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={st.completed}
                                  onChange={() => handleToggleSubtask(task.id, st.id)}
                                  className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer shrink-0"
                                />
                                <span
                                  className={
                                    st.completed
                                      ? 'line-through text-slate-400 truncate'
                                      : 'font-medium truncate'
                                  }
                                >
                                  {st.text}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setSubtaskToDelete({
                                    taskId: task.id,
                                    subtaskId: st.id,
                                    text: st.text,
                                  })
                                }
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer shrink-0"
                                title="Delete checklist step"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

              {/* Client Selection (First step of linking) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Client / Corporate Entity *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Select client to filter transactions
                  </span>
                </div>
                <select
                  value={newClientId}
                  onChange={(e) => handleClientSelectionChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="">-- All Clients / Chambers General --</option>
                  {clients.map((c) => {
                    const clientMattersCount = sanitizedMatters.filter(
                      (m) =>
                        (m.clientId && m.clientId === c.id) ||
                        m.clientName.toLowerCase() === c.name.toLowerCase()
                    ).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type}) — {clientMattersCount} {clientMattersCount === 1 ? 'transaction' : 'transactions'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Transaction / Legal Matter Selector (Linked to Client) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Linked Transaction / Case File *
                  </label>
                  <span className="text-[10px] font-semibold text-amber-800">
                    {newClientId
                      ? `${availableTransactionsForClient.length} transaction(s) for this client`
                      : `${sanitizedMatters.length} transactions available firm-wide`}
                  </span>
                </div>

                <select
                  value={newMatterId}
                  onChange={(e) => handleMatterSelectionChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  {availableTransactionsForClient.length === 0 ? (
                    <option value="">-- No active transactions for this client (General Task) --</option>
                  ) : (
                    <>
                      <option value="">-- Select Transaction / Legal Matter --</option>
                      {availableTransactionsForClient.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.referenceNumber} — {m.title} [{m.practiceArea}]
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <p className="text-[10px] text-slate-500 mt-1">
                  A client can have multiple active transactions (e.g. conveyancing, litigation, corporate advisory). Linking the task to the exact transaction ensures seamless workspace tracking and billing.
                </p>

                {newClientId && availableTransactionsForClient.length === 0 && (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-800 flex items-center justify-between">
                    <span>This client currently has no active transactions registered.</span>
                    <button
                      type="button"
                      onClick={() => setNewClientId('')}
                      className="text-amber-900 font-bold hover:underline ml-2 cursor-pointer"
                    >
                      Show all firm transactions
                    </button>
                  </div>
                )}

                {/* Selected Matter Preview Information Card */}
                {currentSelectedMatterObj && (
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5 animate-in fade-in duration-100">
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
                          onClick={() => setFormSubtaskIndexToRemove(idx)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer transition"
                          title="Remove checklist item"
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

      {/* Interactive Client Details Modal */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base">{viewingClient.name}</h3>
                    <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                      {viewingClient.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewingClient.industry || 'Chambers Retainer & Advisory Client'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingClient(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close client details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Contact & Profile Information Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Contact Person</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-semibold">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="truncate">{viewingClient.contactPerson || 'Managing Officer'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Email Address</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-semibold">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <a href={`mailto:${viewingClient.email}`} className="text-blue-700 hover:underline truncate">
                      {viewingClient.email}
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Phone Contact</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-semibold">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{viewingClient.phone || '+254 700 000 000'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Location / City</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-semibold">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="truncate">{viewingClient.city || 'Nairobi, Kenya'}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-700" />
                    <span>Transactions & Matters for this Client ({clientMattersForViewing.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Client's individual case files
                  </span>
                </div>

                {clientMattersForViewing.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-500 bg-slate-50/50">
                    <p className="font-medium text-xs">No active transactions registered for this client yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientMattersForViewing.map((matter) => (
                      <div
                        key={matter.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 hover:border-amber-400 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {matter.referenceNumber}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {matter.practiceArea}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                matter.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {matter.status}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-slate-900 leading-snug">
                            {matter.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Lead Counsel: <strong className="text-slate-700">{matter.responsibleAdvocateName}</strong>
                          </p>
                        </div>

                        {onSelectMatter && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMatter(matter);
                              setViewingClient(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-2xs shrink-0 self-start sm:self-center"
                          >
                            <span>Open Transaction</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks for this Client */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-slate-700" />
                    <span>Tasks Linked to this Client ({clientTasksForViewing.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Click any task to view its transaction file
                  </span>
                </div>

                {clientTasksForViewing.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-500 bg-slate-50/50">
                    <p className="font-medium text-xs">No active tasks recorded for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {clientTasksForViewing.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenTransactionDetails(undefined, t);
                              setViewingClient(null);
                            }}
                            className="text-left font-bold text-slate-900 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                            title="Open transaction file"
                          >
                            <span>{t.title}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                          </button>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-mono font-semibold text-slate-700">
                              {t.matterRef}
                            </span>
                            <span>•</span>
                            <span>Assigned to: <strong className="text-slate-700">{t.assignedTo}</strong></span>
                            <span>•</span>
                            <span>Due: {t.dueDate || 'No due date'}</span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                            t.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : t.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setNewClientId(viewingClient.id);
                  const clientMatters = sanitizedMatters.filter(
                    (m) =>
                      (m.clientId && m.clientId === viewingClient.id) ||
                      m.clientName.toLowerCase() === viewingClient.name.toLowerCase()
                  );
                  if (clientMatters.length > 0) {
                    setNewMatterId(clientMatters[0].id);
                  }
                  setIsAssignModalOpen(true);
                  setViewingClient(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer transition shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 text-amber-400" />
                <span>Assign Task for this Client</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingClient(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Task Deletion Dialogue Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Confirm Task Deletion
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to permanently delete this task from Chambers records? This action cannot be reversed.
                  </p>
                </div>
              </div>

              {/* Task summary details */}
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs space-y-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Task Title
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {taskToDelete.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-100/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px]">Client</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {taskToDelete.clientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px]">Transaction File</span>
                    <span className="font-mono font-semibold text-slate-800 truncate block">
                      {taskToDelete.matterRef}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px]">Assigned Advocate</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {taskToDelete.assignedTo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px]">Due Date</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {taskToDelete.dueDate || 'No due date'}
                    </span>
                  </div>
                </div>

                {taskToDelete.subtasks && taskToDelete.subtasks.length > 0 && (
                  <p className="text-[11px] text-rose-700 font-medium pt-1">
                    Note: {taskToDelete.subtasks.length} action checklist subtask(s) will also be deleted.
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                >
                  Cancel, Keep Task
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-xs text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Task Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Subtask Deletion Dialogue Modal */}
      {subtaskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900">
                    Delete Checklist Item?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Are you sure you want to remove this checklist step from the task?
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800">
                "{subtaskToDelete.text}"
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubtaskToDelete(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSubtask}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-xs text-white hover:bg-rose-700 cursor-pointer"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Form Subtask Removal Dialogue Modal */}
      {formSubtaskIndexToRemove !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900">
                    Remove Checklist Step?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Are you sure you want to remove this checklist step from the new task?
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800">
                "{newSubtasks[formSubtaskIndexToRemove]}"
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormSubtaskIndexToRemove(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Keep Step
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveFormSubtask}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-xs text-white hover:bg-rose-700 cursor-pointer"
                >
                  Remove Step
                </button>
              </div>
            </div>
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
