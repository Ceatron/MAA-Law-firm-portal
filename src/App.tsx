import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { OverviewDashboard } from './components/OverviewDashboard';
import { MattersTable } from './components/MattersTable';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { WorkloadChart } from './components/WorkloadChart';
import { CaseLifecycleChart } from './components/CaseLifecycleChart';
import { ActivityFeed } from './components/ActivityFeed';
import { NewMatterModal } from './components/NewMatterModal';
import { MatterDetailDrawer } from './components/MatterDetailDrawer';
import { SearchModal } from './components/SearchModal';
import { NotificationsPopover } from './components/NotificationsPopover';
import { TaskEmailNotificationModal } from './components/TaskEmailNotificationModal';
import { AdminBackupModal } from './components/AdminBackupModal';
import { Briefcase, ShieldAlert, RotateCcw, Mail, Check, CheckCircle2, X as CloseIcon } from 'lucide-react';
import {
  AssignmentEmailPayload,
  generateMatterAssignmentEmail,
  generateTaskAssignmentEmail,
  dispatchAssignmentEmail,
  createMatterAssignmentNotification,
  createTaskAssignmentNotification,
  resolveStaffEmail,
} from './utils/assignmentNotificationService';

import { MattersView } from './components/views/MattersView';
import { ClientsView } from './components/views/ClientsView';
import { TasksView } from './components/views/TasksView';
import { NoticeBoardView } from './components/views/NoticeBoardView';
import { HRMView } from './components/views/HRMView';
import { CalendarView } from './components/views/CalendarView';
import { BillingView } from './components/views/BillingView';
import { DocumentsView } from './components/views/DocumentsView';
import { TeamView } from './components/views/TeamView';
import { SettingsView } from './components/views/SettingsView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ClientServicesView } from './components/views/ClientServicesView';
import { Sparkles } from 'lucide-react';

import {
  mockMatters,
  mockDeadlines,
  mockActivities,
  mockAdvocates,
  mockNotifications,
  mockClients,
  mockTasks,
} from './data/mockData';
import {
  LegalMatter,
  DeadlineItem,
  MatterStatus,
  Advocate,
  Client,
  TaskItem,
} from './types';
import { LandingPage } from './components/LandingPage';
import { loadStaffRoster } from './utils/staffStorage';
import {
  getStoredAuthSession,
  saveAuthSession,
  clearAuthSession,
} from './utils/authStorage';
import {
  loadSavedMatters,
  saveStoredMatters,
  loadSavedClients,
  saveStoredClients,
  loadSavedTasks,
  saveStoredTasks,
  loadSavedDeadlines,
  saveStoredDeadlines,
  loadSavedActivities,
  saveStoredActivities,
  loadSavedNotifications,
  saveStoredNotifications,
} from './utils/chambersDataStorage';

export default function App() {
  // Authentication State: Read from persistent session if previously signed in
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = getStoredAuthSession();
    return Boolean(session?.isAuthenticated);
  });

  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chambers_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Active User / Advocate Context State
  const [advocates, setAdvocates] = useState<Advocate[]>(() => loadStaffRoster());
  const [currentAdvocate, setCurrentAdvocate] = useState<Advocate>(() => {
    const session = getStoredAuthSession();
    if (session?.advocate) {
      const roster = loadStaffRoster();
      const fresh = roster.find((a) => a.id === session.advocate.id || a.email.toLowerCase() === session.advocate.email?.toLowerCase());
      if (fresh) return fresh;
      return session.advocate;
    }
    const list = loadStaffRoster();
    return list[0] || mockAdvocates[0];
  });
  
  const userRole =
    currentAdvocate.role ||
    (currentAdvocate.isSystemAdmin || currentAdvocate.isDeveloper
      ? 'System Admin'
      : currentAdvocate.title.toLowerCase().includes('managing')
      ? 'Managing Advocate'
      : currentAdvocate.title.toLowerCase().includes('consultant')
      ? 'Consultant Advocate'
      : currentAdvocate.title.toLowerCase().includes('manager')
      ? 'Office Manager'
      : currentAdvocate.title.toLowerCase().includes('clerk') ||
        currentAdvocate.title.toLowerCase().includes('assistant')
      ? 'Legal Support Clerk'
      : 'Advocate');

  const isSystemAdmin =
    userRole === 'System Admin' ||
    Boolean(currentAdvocate.isSystemAdmin) ||
    Boolean(currentAdvocate.isDeveloper) ||
    currentAdvocate.id === 'dev-admin';

  const isManagingAdvocate =
    isSystemAdmin ||
    userRole === 'Managing Advocate' ||
    currentAdvocate.id === 'adv-1' ||
    currentAdvocate.title.toLowerCase().includes('managing');

  const hasExplicitBillingRight =
    Boolean(currentAdvocate.permissions?.canEditBilling) ||
    Boolean(currentAdvocate.permissions?.canViewFinancialInsights);

  // Billing is visible only to SYS admin, Managing advocate, or any other person granted billing rights
  const canAccessBilling =
    isSystemAdmin ||
    isManagingAdvocate ||
    hasExplicitBillingRight;

  const canManageStaff =
    isSystemAdmin ||
    isManagingAdvocate ||
    userRole === 'Office Manager' ||
    Boolean(currentAdvocate.permissions?.canManageStaff);

  const canAccessInvoicing = canAccessBilling;

  // Executive revenue insights view
  const canAccessFinancialInsights =
    isSystemAdmin ||
    isManagingAdvocate ||
    Boolean(currentAdvocate.permissions?.canViewFinancialInsights);

  // Fallback if current active tab is Billing but user doesn't have billing rights
  useEffect(() => {
    if (activeTab === 'Billing' && !canAccessBilling) {
      setActiveTab('Overview');
    }
  }, [activeTab, canAccessBilling]);

  // Sync staff roster state across application when updated
  useEffect(() => {
    const handleStaffUpdated = (e: CustomEvent<Advocate[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAdvocates(e.detail);
        setCurrentAdvocate((prev) => {
          const matched = e.detail.find((a) => a.id === prev.id || a.email.toLowerCase() === prev.email?.toLowerCase());
          return matched || prev;
        });
      }
    };
    window.addEventListener('chambers-staff-updated', handleStaffUpdated as EventListener);
    return () => {
      window.removeEventListener('chambers-staff-updated', handleStaffUpdated as EventListener);
    };
  }, []);

  // Auth Handlers
  const handleLogin = (advocate: Advocate) => {
    setCurrentAdvocate(advocate);
    setIsAuthenticated(true);
    saveAuthSession(advocate, true);
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  const handleSwitchAdvocate = (advocate: Advocate) => {
    setCurrentAdvocate(advocate);
    saveAuthSession(advocate, true);
  };

  // Core Datasets State loaded from persistent storage
  const [matters, setMatters] = useState<LegalMatter[]>(() => loadSavedMatters());
  const [clients, setClients] = useState<Client[]>(() => loadSavedClients());
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadSavedTasks());
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(() => loadSavedDeadlines());
  const [activities, setActivities] = useState(() => loadSavedActivities());
  const [notifications, setNotifications] = useState(() => loadSavedNotifications());

  // Automatically sync datasets to persistent local storage whenever changed
  useEffect(() => {
    saveStoredMatters(matters);
  }, [matters]);

  useEffect(() => {
    saveStoredClients(clients);
  }, [clients]);

  useEffect(() => {
    saveStoredTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveStoredDeadlines(deadlines);
  }, [deadlines]);

  useEffect(() => {
    saveStoredActivities(activities);
  }, [activities]);

  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  // Dialog & Drawer Controls
  const [selectedMatter, setSelectedMatter] = useState<LegalMatter | null>(null);
  const [isNewMatterOpen, setIsNewMatterOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAIAssistantDrawerOpen, setIsAIAssistantDrawerOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [backupSuccessToast, setBackupSuccessToast] = useState<string | null>(null);

  // Automated Email Notification Preview Modal & Live Toast
  const [selectedEmailPayload, setSelectedEmailPayload] = useState<AssignmentEmailPayload | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailToast, setEmailToast] = useState<{
    id: string;
    message: string;
    payload: AssignmentEmailPayload;
  } | null>(null);

  // Listen for automated email dispatch events across all components
  useEffect(() => {
    const handleEmailDispatched = (e: any) => {
      if (e?.detail?.payload) {
        const payload: AssignmentEmailPayload = e.detail.payload;
        const msg =
          payload.type === 'matter_assignment'
            ? `Case matter ${payload.matterRef || ''} assigned to ${payload.toName}. Email dispatched to ${payload.toEmail}.`
            : `Workload task assigned to ${payload.toName}. Email dispatched to ${payload.toEmail}.`;
        setEmailToast({
          id: `toast-${Date.now()}`,
          message: msg,
          payload,
        });
      }
    };

    window.addEventListener('chambers-email-dispatched', handleEmailDispatched as EventListener);
    return () => {
      window.removeEventListener('chambers-email-dispatched', handleEmailDispatched as EventListener);
    };
  }, []);

  // Auto-dismiss email toast after 8 seconds
  useEffect(() => {
    if (!emailToast) return;
    const timer = setTimeout(() => {
      setEmailToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [emailToast]);

  // Auto-dismiss backup success toast after 8 seconds
  useEffect(() => {
    if (!backupSuccessToast) return;
    const timer = setTimeout(() => {
      setBackupSuccessToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [backupSuccessToast]);

  // Scoped active & archived matters for counts & badges
  const scopedActiveMatters = isManagingAdvocate
    ? matters.filter((m) => m.status !== 'Archived')
    : matters.filter(
        (m) =>
          m.status !== 'Archived' &&
          (m.responsibleAdvocateId === currentAdvocate.id ||
            m.responsibleAdvocateName
              .toLowerCase()
              .includes(currentAdvocate.name.toLowerCase()))
      );

  const scopedArchivedMatters = isManagingAdvocate
    ? matters.filter((m) => m.status === 'Archived')
    : matters.filter(
        (m) =>
          m.status === 'Archived' &&
          (m.responsibleAdvocateId === currentAdvocate.id ||
            m.responsibleAdvocateName
              .toLowerCase()
              .includes(currentAdvocate.name.toLowerCase()))
      );

  // Handlers
  const handleAddMatter = (newMatter: LegalMatter) => {
    setMatters([newMatter, ...matters]);

    // Automated Email Dispatch to assigned advocate
    try {
      const emailPayload = generateMatterAssignmentEmail(
        newMatter,
        currentAdvocate.name,
        advocates,
        false
      );
      dispatchAssignmentEmail(emailPayload);
      const inAppNotif = createMatterAssignmentNotification(
        newMatter,
        currentAdvocate.name,
        advocates,
        false
      );
      setNotifications((prev) => [inAppNotif, ...prev]);
    } catch (err) {
      console.warn('Failed to dispatch matter assignment email:', err);
    }

    // Log Activity
    setActivities([
      {
        id: `act-${Date.now()}`,
        type: 'Court Event',
        title: 'New Matter Registered in Firm Workspace',
        description: `${newMatter.referenceNumber}: ${newMatter.title} assigned to ${newMatter.responsibleAdvocateName}`,
        timestamp: 'Just now',
        user: currentAdvocate.name,
        matterId: newMatter.id,
        matterRef: newMatter.referenceNumber,
      },
      ...activities,
    ]);
  };

  const handleUpdateMatter = (updatedMatter: LegalMatter) => {
    const prevMatter = matters.find((m) => m.id === updatedMatter.id);
    const isReassigned =
      prevMatter &&
      (prevMatter.responsibleAdvocateId !== updatedMatter.responsibleAdvocateId ||
        prevMatter.responsibleAdvocateName !== updatedMatter.responsibleAdvocateName);

    // If assigned advocate changed, dispatch automated reassignment email
    if (isReassigned) {
      try {
        const emailPayload = generateMatterAssignmentEmail(
          updatedMatter,
          currentAdvocate.name,
          advocates,
          true
        );
        dispatchAssignmentEmail(emailPayload);
        const inAppNotif = createMatterAssignmentNotification(
          updatedMatter,
          currentAdvocate.name,
          advocates,
          true
        );
        setNotifications((prev) => [inAppNotif, ...prev]);
      } catch (err) {
        console.warn('Failed to dispatch matter reassignment email:', err);
      }
    }

    setMatters((prev) =>
      prev.map((m) => (m.id === updatedMatter.id ? updatedMatter : m))
    );
    if (selectedMatter && selectedMatter.id === updatedMatter.id) {
      setSelectedMatter(updatedMatter);
    }
    // Log Activity
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'Status Change',
        title: isReassigned ? 'Matter Counsel Reassigned' : 'Matter Record Updated',
        description: isReassigned
          ? `${updatedMatter.referenceNumber} reassigned to ${updatedMatter.responsibleAdvocateName} by ${currentAdvocate.name}`
          : `${updatedMatter.referenceNumber}: ${updatedMatter.title} (${updatedMatter.status}) updated by ${currentAdvocate.name}`,
        timestamp: 'Just now',
        user: currentAdvocate.name,
        matterId: updatedMatter.id,
        matterRef: updatedMatter.referenceNumber,
      },
      ...prev,
    ]);
  };

  const handleAddTask = (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);

    // Automated Email Dispatch to assigned advocate
    try {
      const targetMatter = matters.find(
        (m) => m.id === newTask.matterId || m.referenceNumber === newTask.matterRef
      );
      const emailPayload = generateTaskAssignmentEmail(
        newTask,
        advocates,
        targetMatter,
        currentAdvocate.name
      );
      dispatchAssignmentEmail(emailPayload);
      const inAppNotif = createTaskAssignmentNotification(
        newTask,
        advocates,
        targetMatter,
        currentAdvocate.name
      );
      setNotifications((prev) => [inAppNotif, ...prev]);
    } catch (err) {
      console.warn('Failed to dispatch task assignment email:', err);
    }
  };

  const handleUpdateMatterStatus = (id: string, newStatus: MatterStatus) => {
    setMatters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    if (selectedMatter && selectedMatter.id === id) {
      setSelectedMatter({ ...selectedMatter, status: newStatus });
    }
  };

  const handleUpdateMatterTags = (id: string, newTags: string[]) => {
    setMatters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, tags: newTags } : m))
    );
    if (selectedMatter && selectedMatter.id === id) {
      setSelectedMatter({ ...selectedMatter, tags: newTags });
    }
  };

  const handleToggleDeadline = (id: string) => {
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d))
    );
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const pendingTasksCount = tasks.filter((t) => t.status !== 'Completed').length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} advocates={advocates} />;
  }

  return (
    <div className="flex h-screen bg-[#f4f6f8] text-[#1c2d3d] font-sans overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onOpenNewMatter={() => setIsNewMatterOpen(true)}
        onLogout={handleLogout}
        mattersCount={scopedActiveMatters.length}
        clientsCount={clients.length}
        openTasksCount={pendingTasksCount}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        canAccessBilling={canAccessBilling}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header with Role Switcher */}
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAIAssistant={() => setIsAIAssistantDrawerOpen(true)}
          setMobileOpen={setMobileSidebarOpen}
          unreadCount={unreadNotifCount}
          currentAdvocate={currentAdvocate}
          onSelectAdvocate={handleSwitchAdvocate}
          onLogout={handleLogout}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'Overview' && (
            <OverviewDashboard
              onNavigateTab={setActiveTab}
              matters={matters}
              deadlines={deadlines}
              clients={clients}
              activities={activities}
              tasks={tasks}
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
              canAccessBilling={canAccessBilling}
              onOpenNewMatter={() => setIsNewMatterOpen(true)}
              onToggleDeadline={handleToggleDeadline}
              onSelectMatter={(m) => setSelectedMatter(m)}
            />
          )}

          {activeTab === 'Matters' && (
            <MattersView
              matters={matters}
              clients={clients}
              onSelectMatter={(m) => setSelectedMatter(m)}
              onOpenNewMatter={() => setIsNewMatterOpen(true)}
              onUpdateMatter={handleUpdateMatter}
              onUpdateMatterTags={handleUpdateMatterTags}
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
              allAdvocates={advocates}
            />
          )}

          {activeTab === 'NoticeBoard' && (
            <NoticeBoardView
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
            />
          )}

          {activeTab === 'Clients' && (
            <ClientsView
              clients={clients}
              onUpdateClients={setClients}
              matters={matters}
              onOpenNewMatter={() => setIsNewMatterOpen(true)}
            />
          )}

          {activeTab === 'ClientServices' && (
            <ClientServicesView
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
              advocates={advocates}
              clients={clients}
              matters={matters}
              onAddClient={(newClient) => setClients((prev) => [newClient, ...prev])}
              onAddMatter={handleAddMatter}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === 'Tasks' && (
            <TasksView
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
              tasks={tasks}
              onUpdateTasks={setTasks}
              matters={matters}
              onOpenNewMatter={() => setIsNewMatterOpen(true)}
              onSelectMatter={(m) => setSelectedMatter(m)}
              onAddNotification={(newNotif) => setNotifications((prev) => [newNotif, ...prev])}
            />
          )}

          {activeTab === 'HRM' && <HRMView />}

          {activeTab === 'Calendar' && (
            <CalendarView
              deadlines={deadlines}
              matters={matters}
              currentAdvocate={currentAdvocate}
              onAddDeadline={(newDl) => setDeadlines((prev) => [newDl, ...prev])}
            />
          )}

          {activeTab === 'Billing' && canAccessBilling && (
            <BillingView
              clients={clients}
              matters={matters}
              onAddClient={(newClient) => setClients((prev) => [newClient, ...prev])}
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
              canAccessFinancialInsights={canAccessFinancialInsights}
              canAccessInvoicing={canAccessInvoicing}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'Documents' && <DocumentsView />}

          {activeTab === 'Team' && (
            <TeamView
              currentAdvocate={currentAdvocate}
              isManagingAdvocate={isManagingAdvocate}
              advocates={advocates}
              onUpdateAdvocates={setAdvocates}
            />
          )}

          {activeTab === 'Settings' && (
            <SettingsView
              currentAdvocate={currentAdvocate}
              isSystemAdmin={isSystemAdmin}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
            />
          )}

          {activeTab === 'AIAssistant' && (
            <AIAssistantView
              currentAdvocate={currentAdvocate}
              selectedMatterId={selectedMatter?.id}
              matters={matters}
            />
          )}
        </main>
      </div>

      {/* Slide-over Modals & Drawers */}
      <NewMatterModal
        isOpen={isNewMatterOpen}
        onClose={() => setIsNewMatterOpen(false)}
        onAddMatter={handleAddMatter}
        clients={clients}
        matters={matters}
        onAddClient={(newClient) => setClients((prev) => [newClient, ...prev])}
      />

      <MatterDetailDrawer
        matter={selectedMatter}
        onClose={() => setSelectedMatter(null)}
        onUpdateStatus={handleUpdateMatterStatus}
        onUpdateTags={handleUpdateMatterTags}
        onUpdateMatter={handleUpdateMatter}
        clients={clients}
        advocates={advocates}
        tasks={tasks}
        onUpdateTasks={setTasks}
        currentAdvocate={currentAdvocate}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMatter={(m) => setSelectedMatter(m)}
      />

      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkNotificationsRead}
        onViewEmail={(payload) => {
          setSelectedEmailPayload(payload);
          setIsEmailModalOpen(true);
        }}
      />

      {/* Automated Email Preview Modal (Matters & Tasks) */}
      <TaskEmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedEmailPayload(null);
        }}
        emailPayload={selectedEmailPayload}
      />

      {/* Floating Automated Email Dispatched Toast Banner */}
      {emailToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-70 flex max-w-md items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100">Automated Email Dispatched</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 font-mono text-[10px] text-emerald-300 border border-emerald-500/30">
                Delivered
              </span>
            </div>
            <p className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
              {emailToast.message}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedEmailPayload(emailToast.payload);
                setIsEmailModalOpen(true);
                setEmailToast(null);
              }}
              className="rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-300 transition cursor-pointer shadow-xs"
            >
              View Email
            </button>
            <button
              type="button"
              onClick={() => setEmailToast(null)}
              className="text-slate-400 hover:text-white cursor-pointer p-0.5"
              aria-label="Close notification"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Wakili AI Floating Side Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantDrawerOpen}
        onClose={() => setIsAIAssistantDrawerOpen(false)}
        currentAdvocate={currentAdvocate}
        activeMatter={selectedMatter}
        onOpenFullView={() => {
          setIsAIAssistantDrawerOpen(false);
          setActiveTab('AIAssistant');
        }}
      />

      {/* Admin-Only Data Backup Modal */}
      <AdminBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentAdvocate={currentAdvocate}
        onSuccessNotification={(msg) => setBackupSuccessToast(msg)}
      />

      {/* Backup Export Success Toast */}
      {backupSuccessToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-5 z-70 flex max-w-md items-center gap-3 rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-0.5 text-xs">
            <p className="font-bold text-slate-100">Data Backup Exported</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {backupSuccessToast}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBackupSuccessToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer p-1"
            aria-label="Close notification"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </aside>
      )}
    </div>
  );
}
