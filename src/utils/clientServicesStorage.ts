import {
  ClientInteraction,
  InteractionAuditEntry,
  Client,
  LegalMatter,
  TaskItem,
  EnquiryCategory,
  ComplaintCategory,
  ClientRequestType,
} from '../types';
import { initialClientInteractions } from '../data/mockClientServices';

const STORAGE_KEY = 'chambers_client_interactions_clean_v2';
const CONFIG_KEY = 'chambers_client_services_config_v1';

export interface ClientServicesConfig {
  interactionTypes: string[];
  enquiryCategories: EnquiryCategory[];
  complaintCategories: ComplaintCategory[];
  clientRequestTypes: ClientRequestType[];
  channels: string[];
  autoCreateTasksForFollowups: boolean;
  slaResponseHours: number;
}

export const defaultConfig: ClientServicesConfig = {
  interactionTypes: [
    'Call',
    'Enquiry',
    'Client Request',
    'Appointment',
    'Complaint / Feedback',
    'Walk-in Visitor',
    'Email',
    'SMS',
    'WhatsApp',
    'Letter',
    'Other',
  ],
  enquiryCategories: [
    'Legal Service Enquiry',
    'New Client Onboarding',
    'Fee Estimate / Quotation',
    'Case Status Enquiry',
    'Document Request',
    'Conveyancing & Land Search',
    'Succession & Probate',
    'Commercial & Retainer',
    'General Enquiry',
  ],
  complaintCategories: [
    'Communication Delay',
    'Fee / Billing Dispute',
    'Service Quality',
    'Court Filing Delay',
    'Staff Conduct',
    'Document Error',
    'Other',
  ],
  clientRequestTypes: [
    'Case Update',
    'Document Copy',
    'Speak with Advocate',
    'Schedule Consultation',
    'Fee Note / Receipt Copy',
    'Certified True Copies',
    'Fee Estimate / Quotation',
    'Court Order Status',
    'Other Request',
  ],
  channels: [
    'Phone',
    'In-Person / Reception',
    'Email',
    'WhatsApp',
    'SMS',
    'Web Portal',
    'Postal Letter',
    'Court / Registry Encounter',
  ],
  autoCreateTasksForFollowups: true,
  slaResponseHours: 24,
};

export function getStoredInteractions(): ClientInteraction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load client interactions from localStorage:', e);
    return [];
  }
}

export function saveStoredInteractions(interactions: ClientInteraction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interactions));
  } catch (e) {
    console.error('Failed to save client interactions:', e);
  }
}

export function getStoredConfig(): ClientServicesConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

export function saveStoredConfig(config: ClientServicesConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save client services config:', e);
  }
}

export function generateInteractionId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `INT-${year}-${randomNum}`;
}

export function createAuditLogEntry(
  userId: string,
  userName: string,
  userRole: string,
  action: InteractionAuditEntry['action'],
  options?: {
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    notes?: string;
  }
): InteractionAuditEntry {
  return {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    fieldChanged: options?.fieldChanged,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    notes: options?.notes,
  };
}

// Convert a prospective client from an enquiry/interaction into a real Client record
export function convertProspectiveClientToClient(
  interaction: ClientInteraction,
  extraData?: {
    type?: 'Corporate' | 'Individual' | 'State Entity';
    industry?: string;
    city?: string;
    kraPin?: string;
    retainerStatus?: 'Active Retainer' | 'Per-Matter' | 'Pending Deposit';
  }
): Client {
  const clientId = `cli-${Date.now().toString().slice(-4)}`;
  const isCorporate =
    extraData?.type === 'Corporate' ||
    (interaction.companyName && interaction.companyName.trim().length > 0) ||
    interaction.clientName.toLowerCase().includes('ltd') ||
    interaction.clientName.toLowerCase().includes('plc');

  return {
    id: clientId,
    name: interaction.companyName || interaction.clientName,
    type: extraData?.type || (isCorporate ? 'Corporate' : 'Individual'),
    industry: extraData?.industry || (isCorporate ? 'Commercial / Corporate' : 'Private Client'),
    kraPin: extraData?.kraPin || interaction.kraPin || `P05${Math.floor(10000000 + Math.random() * 90000000)}X`,
    contactPerson: interaction.contactPerson || interaction.clientName,
    email: interaction.email || 'client.contact@domain.co.ke',
    phone: interaction.phoneNumber || '+254 700 000 000',
    city: extraData?.city || 'Nairobi (Central)',
    activeMattersCount: 0,
    totalBilledKES: 0,
    retainerStatus: extraData?.retainerStatus || 'Pending Deposit',
  };
}

// Create a follow-up task directly for an interaction
export function createFollowUpTaskFromInteraction(
  interaction: ClientInteraction,
  creatorName: string
): TaskItem {
  const taskId = `task-cs-${Date.now().toString().slice(-4)}`;
  return {
    id: taskId,
    title: `[Client Services Follow-up] ${interaction.subject}`,
    description: `Follow-up on ${interaction.interactionType} (${interaction.id}) with ${interaction.clientName}.\nNotes: ${
      interaction.followUpNotes || interaction.actionRequired || interaction.description
    }`,
    matterId: interaction.matterId || 'FIRM-GENERAL',
    matterRef: interaction.matterRef || 'CHAMBERS-CLIENT-SERVICES',
    clientName: interaction.clientName,
    assignedTo: interaction.followUpAssignedToName || interaction.assignedStaffName || creatorName,
    createdBy: creatorName,
    priority:
      interaction.priority === 'Urgent'
        ? 'Critical'
        : interaction.priority === 'High'
        ? 'High'
        : 'Medium',
    status: 'In Progress',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: interaction.followUpDueDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    estimatedHours: 2,
    actualHours: 0,
    subtasks: [
      {
        id: `sub-${Date.now()}-1`,
        text: `Contact client (${interaction.phoneNumber || interaction.email || 'Phone/Email'})`,
        completed: false,
      },
      {
        id: `sub-${Date.now()}-2`,
        text: `Execute action: ${interaction.actionRequired || 'Provide requested assistance'}`,
        completed: false,
      },
      {
        id: `sub-${Date.now()}-3`,
        text: 'Record follow-up outcome in Client Services register',
        completed: false,
      },
    ],
    commentsCount: 0,
  };
}
