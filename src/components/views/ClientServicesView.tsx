import React, { useState, useEffect } from 'react';
import {
  Headphones,
  LayoutDashboard,
  Phone,
  HelpCircle,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  CheckSquare,
  History,
  BarChart3,
  Plus,
  Settings,
  Filter,
  Search,
  CheckCircle2,
  PhoneCall,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import {
  ClientInteraction,
  ClientInteractionType,
  InteractionDirection,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
  TaskItem,
} from '../../types';
import {
  getStoredInteractions,
  saveStoredInteractions,
  getStoredConfig,
  saveStoredConfig,
  ClientServicesConfig,
  createAuditLogEntry,
  createFollowUpTaskFromInteraction,
} from '../../utils/clientServicesStorage';

import { ClientServicesDashboard } from '../clientservices/ClientServicesDashboard';
import { CallsView } from '../clientservices/CallsView';
import { EnquiriesView } from '../clientservices/EnquiriesView';
import { ClientRequestsView } from '../clientservices/ClientRequestsView';
import { AppointmentsCallbacksView } from '../clientservices/AppointmentsCallbacksView';
import { ComplaintsFeedbackView } from '../clientservices/ComplaintsFeedbackView';
import { WalkInVisitorsView } from '../clientservices/WalkInVisitorsView';
import { FollowUpsTasksView } from '../clientservices/FollowUpsTasksView';
import { CommunicationTimelineView } from '../clientservices/CommunicationTimelineView';
import { ClientServicesReportsView } from '../clientservices/ClientServicesReportsView';

import { NewInteractionModal } from '../clientservices/NewInteractionModal';
import { InteractionDetailDrawer } from '../clientservices/InteractionDetailDrawer';
import { ConvertClientModal } from '../clientservices/ConvertClientModal';
import { ClientServicesConfigModal } from '../clientservices/ClientServicesConfigModal';

interface ClientServicesViewProps {
  currentAdvocate: Advocate;
  isManagingAdvocate: boolean;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  onAddClient: (newClient: Client) => void;
  onAddMatter: (newMatter: LegalMatter) => void;
  onAddTask: (newTask: TaskItem) => void;
}

type SubTabId =
  | 'dashboard'
  | 'calls'
  | 'enquiries'
  | 'requests'
  | 'appointments'
  | 'complaints'
  | 'walkins'
  | 'followups'
  | 'timeline'
  | 'reports';

export const ClientServicesView: React.FC<ClientServicesViewProps> = ({
  currentAdvocate,
  isManagingAdvocate,
  advocates,
  clients,
  matters,
  onAddClient,
  onAddMatter,
  onAddTask,
}) => {
  // Core Interactions and Config State with Storage
  const [interactions, setInteractions] = useState<ClientInteraction[]>(() => {
    return getStoredInteractions();
  });
  const [config, setConfig] = useState<ClientServicesConfig>(() => {
    return getStoredConfig();
  });

  // Current active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('dashboard');

  // Modals and Drawer state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalType, setNewModalType] = useState<ClientInteractionType>('Call');
  const [editingInteraction, setEditingInteraction] = useState<ClientInteraction | null>(null);

  const [selectedInteraction, setSelectedInteraction] = useState<ClientInteraction | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingInteraction, setConvertingInteraction] = useState<ClientInteraction | null>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Sync to localStorage whenever interactions change
  useEffect(() => {
    saveStoredInteractions(interactions);
  }, [interactions]);

  // Sync config
  const handleSaveConfig = (newConfig: ClientServicesConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    setIsConfigModalOpen(false);
  };

  // Open New Interaction Modal
  const handleOpenNewModal = (type: ClientInteractionType = 'Call', direction?: InteractionDirection) => {
    setEditingInteraction(null);
    setNewModalType(type);
    setIsNewModalOpen(true);
  };

  // Save new / edited interaction
  const handleSaveInteraction = (savedItem: ClientInteraction, saveAndNew?: boolean) => {
    setInteractions((prev) => {
      const exists = prev.some((i) => i.id === savedItem.id);
      if (exists) {
        return prev.map((i) => (i.id === savedItem.id ? savedItem : i));
      }
      return [savedItem, ...prev];
    });

    // Auto create follow-up task if requested and configured
    if (
      savedItem.followUpRequired &&
      savedItem.followUpStatus !== 'Completed' &&
      config.autoCreateTasksForFollowups
    ) {
      const task = createFollowUpTaskFromInteraction(savedItem, currentAdvocate.name);
      onAddTask(task);
    }

    if (selectedInteraction && selectedInteraction.id === savedItem.id) {
      setSelectedInteraction(savedItem);
    }

    if (saveAndNew) {
      // Re-trigger blank modal for rapid reception entry
      setEditingInteraction(null);
      setIsNewModalOpen(true);
    } else {
      setIsNewModalOpen(false);
      setEditingInteraction(null);
    }
  };

  // Update Status of an interaction
  const handleUpdateStatus = (id: string, newStatus: InteractionStatus) => {
    setInteractions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const auditEntry = createAuditLogEntry(
            currentAdvocate.id,
            currentAdvocate.name,
            currentAdvocate.title,
            'Status Changed',
            {
              fieldChanged: 'status',
              oldValue: item.status,
              newValue: newStatus,
              notes: `Status changed from ${item.status} to ${newStatus}`,
            }
          );
          const updated = {
            ...item,
            status: newStatus,
            resolvedDate: ['Resolved', 'Closed'].includes(newStatus) ? new Date().toISOString() : item.resolvedDate,
            auditTrail: [...(item.auditTrail || []), auditEntry],
          };
          if (selectedInteraction && selectedInteraction.id === id) {
            setSelectedInteraction(updated);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Toggle callback completed
  const handleToggleCallbackReturned = (item: ClientInteraction) => {
    const nextStatus: InteractionStatus = item.status === 'Resolved' ? 'In Progress' : 'Resolved';
    handleUpdateStatus(item.id, nextStatus);
  };

  // Toggle follow-up complete
  const handleToggleFollowUpComplete = (item: ClientInteraction) => {
    const isNowComplete = item.followUpStatus !== 'Completed';
    setInteractions((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const audit = createAuditLogEntry(
            currentAdvocate.id,
            currentAdvocate.name,
            currentAdvocate.title,
            'Follow-up Created',
            {
              fieldChanged: 'followUpStatus',
              oldValue: i.followUpStatus,
              newValue: isNowComplete ? 'Completed' : 'Pending',
              notes: isNowComplete ? 'Follow-up marked as fulfilled' : 'Follow-up reopened',
            }
          );
          const updated: ClientInteraction = {
            ...i,
            followUpStatus: isNowComplete ? 'Completed' : 'Pending',
            auditTrail: [...(i.auditTrail || []), audit],
          };
          if (selectedInteraction && selectedInteraction.id === item.id) {
            setSelectedInteraction(updated);
          }
          return updated;
        }
        return i;
      })
    );
  };

  // Check-out Visitor
  const handleCheckOutVisitor = (item: ClientInteraction) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInteractions((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const audit = createAuditLogEntry(
            currentAdvocate.id,
            currentAdvocate.name,
            currentAdvocate.title,
            'Updated',
            {
              fieldChanged: 'visitorCheckOutTime',
              newValue: nowTime,
              notes: `Visitor logged exit at ${nowTime}`,
            }
          );
          const updated: ClientInteraction = {
            ...i,
            visitorCheckOutTime: nowTime,
            status: 'Completed',
            auditTrail: [...(i.auditTrail || []), audit],
          };
          if (selectedInteraction && selectedInteraction.id === item.id) {
            setSelectedInteraction(updated);
          }
          return updated;
        }
        return i;
      })
    );
  };

  // Convert Prospective Lead to Client & Optional Legal Matter
  const handleStartConvertClient = (interaction: ClientInteraction) => {
    setConvertingInteraction(interaction);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvertClient = (newClient: Client, newMatter?: LegalMatter) => {
    onAddClient(newClient);
    if (newMatter) {
      onAddMatter(newMatter);
    }

    if (convertingInteraction) {
      setInteractions((prev) =>
        prev.map((i) => {
          if (i.id === convertingInteraction.id) {
            const audit = createAuditLogEntry(
              currentAdvocate.id,
              currentAdvocate.name,
              currentAdvocate.title,
              'Converted to Client',
              {
                notes: `Prospective inquiry successfully converted into official client record (${newClient.id} - ${newClient.name})`,
              }
            );
            return {
              ...i,
              isExistingClient: true,
              isProspectiveClient: false,
              clientId: newClient.id,
              clientName: newClient.name,
              matterId: newMatter ? newMatter.id : i.matterId,
              matterRef: newMatter ? newMatter.referenceNumber : i.matterRef,
              status: 'Converted to Client / Retainer',
              auditTrail: [...(i.auditTrail || []), audit],
            };
          }
          return i;
        })
      );
    }

    setIsConvertModalOpen(false);
    setConvertingInteraction(null);
  };

  // Create follow-up task manually
  const handleCreateTask = (interaction: ClientInteraction) => {
    const task = createFollowUpTaskFromInteraction(interaction, currentAdvocate.name);
    onAddTask(task);

    // Update interaction record with task link
    setInteractions((prev) =>
      prev.map((i) => {
        if (i.id === interaction.id) {
          const audit = createAuditLogEntry(
            currentAdvocate.id,
            currentAdvocate.name,
            currentAdvocate.title,
            'Follow-up Created',
            { notes: `Created linked matter action task (${task.id})` }
          );
          return {
            ...i,
            linkedTaskId: task.id,
            followUpRequired: true,
            followUpStatus: 'Pending',
            auditTrail: [...(i.auditTrail || []), audit],
          };
        }
        return i;
      })
    );
  };

  // Edit from Drawer
  const handleEditFromDrawer = (interaction: ClientInteraction) => {
    setSelectedInteraction(null);
    setEditingInteraction(interaction);
    setNewModalType(interaction.interactionType);
    setIsNewModalOpen(true);
  };

  // Badges & Counters calculation
  const totalCalls = interactions.filter((i) => i.interactionType === 'Call').length;
  const openEnquiries = interactions.filter(
    (i) => i.interactionType === 'Enquiry' && !['Resolved', 'Closed', 'Converted to Client / Retainer'].includes(i.status)
  ).length;
  const pendingRequests = interactions.filter(
    (i) => i.interactionType === 'Client Request' && !['Resolved', 'Closed'].includes(i.status)
  ).length;
  const openAppointments = interactions.filter(
    (i) => i.interactionType === 'Appointment' && !['Completed', 'Cancelled'].includes(i.status)
  ).length;
  const openComplaints = interactions.filter(
    (i) => i.interactionType === 'Complaint / Feedback' && !['Resolved', 'Closed'].includes(i.status)
  ).length;
  const activeWalkIns = interactions.filter(
    (i) => i.interactionType === 'Walk-in Visitor' && !i.visitorCheckOutTime
  ).length;
  const openFollowUps = interactions.filter(
    (i) => i.followUpRequired && i.followUpStatus !== 'Completed'
  ).length;

  const subTabs = [
    { id: 'dashboard' as SubTabId, label: 'Overview Hub', icon: LayoutDashboard },
    { id: 'calls' as SubTabId, label: 'Calls Log', icon: Phone, count: totalCalls },
    {
      id: 'enquiries' as SubTabId,
      label: 'Prospective Leads',
      icon: HelpCircle,
      badge: openEnquiries > 0 ? `${openEnquiries} open` : undefined,
    },
    {
      id: 'requests' as SubTabId,
      label: 'Service Requests',
      icon: FileText,
      badge: pendingRequests > 0 ? `${pendingRequests} pending` : undefined,
    },
    { id: 'appointments' as SubTabId, label: 'Appointments & Callbacks', icon: Calendar, count: openAppointments },
    {
      id: 'complaints' as SubTabId,
      label: 'Complaints / QA',
      icon: AlertTriangle,
      badge: openComplaints > 0 ? `${openComplaints} review` : undefined,
    },
    {
      id: 'walkins' as SubTabId,
      label: 'Reception Walk-ins',
      icon: Building2,
      badge: activeWalkIns > 0 ? `${activeWalkIns} in chambers` : undefined,
    },
    {
      id: 'followups' as SubTabId,
      label: 'Follow-ups & Tasks',
      icon: CheckSquare,
      badge: openFollowUps > 0 ? `${openFollowUps} due` : undefined,
    },
    { id: 'timeline' as SubTabId, label: '360° Timeline', icon: History },
    { id: 'reports' as SubTabId, label: 'SLA Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#d1d7dc] pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B63E5] to-[#132c3f] text-white shadow-md">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold font-serif-title text-[#1c2d3d]">
                Client Services & Front Desk Hub
              </h1>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                Live Register
              </span>
            </div>
            <p className="text-xs text-[#5c6f84] mt-0.5">
              Omnichannel telephone logging, prospective onboarding, client service requests, visitor reception & SLA compliance
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {isManagingAdvocate && (
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-lg border border-[#d1d7dc] bg-white px-3 py-2 text-xs font-bold text-[#1c2d3d] hover:bg-[#f4f6f8] shadow-2xs cursor-pointer transition-colors"
              title="Configure SLA & Categories"
            >
              <Settings className="h-3.5 w-3.5 text-[#5c6f84]" />
              <span>SLA Settings</span>
            </button>
          )}

          <div className="relative group">
            <button
              type="button"
              onClick={() => handleOpenNewModal('Call')}
              className="flex items-center space-x-2 rounded-lg bg-[#0B63E5] hover:bg-[#0951bd] text-white px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Log New Interaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-thin border-b border-[#e2e7eb]">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#132c3f] text-white shadow-2xs font-bold'
                  : 'text-[#5c6f84] hover:text-[#1c2d3d] hover:bg-[#ebf0f5]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-300' : 'text-[#7a8b9e]'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive
                      ? 'bg-amber-400 text-[#132c3f] font-bold'
                      : 'bg-rose-100 text-rose-700 font-bold'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && !tab.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#e2e7eb] text-[#5c6f84]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Views Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <ClientServicesDashboard
            interactions={interactions}
            onOpenNewModal={handleOpenNewModal}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onNavigateTab={(tab) => {
              if (tab === 'calls') setActiveSubTab('calls');
              else if (tab === 'enquiries') setActiveSubTab('enquiries');
              else if (tab === 'requests') setActiveSubTab('requests');
              else if (tab === 'appointments') setActiveSubTab('appointments');
              else if (tab === 'complaints') setActiveSubTab('complaints');
              else if (tab === 'walkins') setActiveSubTab('walkins');
              else if (tab === 'followups') setActiveSubTab('followups');
              else if (tab === 'timeline') setActiveSubTab('timeline');
              else if (tab === 'reports') setActiveSubTab('reports');
            }}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'calls' && (
          <CallsView
            interactions={interactions}
            onOpenNewModal={(type, dir) => handleOpenNewModal(type, dir)}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onToggleCallbackReturned={handleToggleCallbackReturned}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'enquiries' && (
          <EnquiriesView
            interactions={interactions}
            onOpenNewModal={(type) => handleOpenNewModal(type)}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onConvertClient={handleStartConvertClient}
            onUpdateStatus={handleUpdateStatus}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'requests' && (
          <ClientRequestsView
            interactions={interactions}
            onOpenNewModal={(type) => handleOpenNewModal(type)}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onUpdateStatus={handleUpdateStatus}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'appointments' && (
          <AppointmentsCallbacksView
            interactions={interactions}
            onOpenNewModal={(type) => handleOpenNewModal(type)}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onUpdateStatus={handleUpdateStatus}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'complaints' && (
          <ComplaintsFeedbackView
            interactions={interactions}
            onOpenNewModal={(type) => handleOpenNewModal(type)}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onUpdateStatus={handleUpdateStatus}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
            isManagingAdvocate={isManagingAdvocate}
          />
        )}

        {activeSubTab === 'walkins' && (
          <WalkInVisitorsView
            interactions={interactions}
            onOpenNewModal={(type) => handleOpenNewModal(type)}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onCheckOutVisitor={handleCheckOutVisitor}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'followups' && (
          <FollowUpsTasksView
            interactions={interactions}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onToggleFollowUpComplete={handleToggleFollowUpComplete}
            onCreateTask={handleCreateTask}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'timeline' && (
          <CommunicationTimelineView
            interactions={interactions}
            onSelectInteraction={(i) => setSelectedInteraction(i)}
            onOpenNewModal={(type) => handleOpenNewModal(type)}
            advocates={advocates}
            clients={clients}
            matters={matters}
            currentAdvocate={currentAdvocate}
          />
        )}

        {activeSubTab === 'reports' && (
          <ClientServicesReportsView
            interactions={interactions}
            advocates={advocates}
            clients={clients}
            matters={matters}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <NewInteractionModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingInteraction(null);
        }}
        onSave={handleSaveInteraction}
        initialType={newModalType}
        clients={clients}
        matters={matters}
        advocates={advocates}
        currentAdvocate={currentAdvocate}
        editingInteraction={editingInteraction}
      />

      <InteractionDetailDrawer
        interaction={selectedInteraction}
        onClose={() => setSelectedInteraction(null)}
        onEdit={handleEditFromDrawer}
        onUpdateStatus={handleUpdateStatus}
        onConvertClient={handleStartConvertClient}
        onCreateTask={handleCreateTask}
        onToggleFollowUpComplete={handleToggleFollowUpComplete}
        currentAdvocate={currentAdvocate}
        isManagingAdvocate={isManagingAdvocate}
      />

      <ConvertClientModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setConvertingInteraction(null);
        }}
        interaction={convertingInteraction}
        advocates={advocates}
        onConfirm={handleConfirmConvertClient}
      />

      <ClientServicesConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
};
