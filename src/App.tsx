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
import { Briefcase, ShieldAlert, RotateCcw } from 'lucide-react';

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
    // Log Activity
    setActivities([
      {
        id: `act-${Date.now()}`,
        type: 'Court Event',
        title: 'New Matter Registered in Chambers',
        description: `${newMatter.referenceNumber}: ${newMatter.title} assigned to ${newMatter.responsibleAdvocateName}`,
        timestamp: 'Just now',
        user: currentAdvocate.name,
        matterId: newMatter.id,
        matterRef: newMatter.referenceNumber,
      },
      ...activities,
    ]);
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
              onSelectMatter={(m) => setSelectedMatter(m)}
              onOpenNewMatter={() => setIsNewMatterOpen(true)}
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
              onAddTask={(newTask) => setTasks((prev) => [newTask, ...prev])}
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

          {activeTab === 'Settings' && <SettingsView />}

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
      />

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
    </div>
  );
}
