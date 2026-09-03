export type PracticeArea =
  | 'Succession Law'
  | 'Conveyancing Law'
  | 'Commercial Law'
  | 'Civil Litigation'
  | 'Bank Securities'
  | 'Constitutional & Tax'
  | 'Employment & Labour'
  | 'Intellectual Property';

export type MatterStatus =
  | 'Active - In Court'
  | 'Filing Pending'
  | 'Interlocutory'
  | 'Settlement Negotiation'
  | 'Completed'
  | 'Archived';

export type UserRole =
  | 'Managing Advocate'
  | 'Office Manager'
  | 'Legal Support Clerk'
  | 'Advocate'
  | 'Consultant Advocate'
  | 'System Admin';

export interface AdvocatePermissions {
  canViewAllMatters?: boolean;
  canManageStaff?: boolean;
  canEditBilling?: boolean; // Can manage fee notes, generate & dispatch fee notes (Invoicing & Billing Role)
  canViewFinancialInsights?: boolean; // Detailed firm revenue, executive financial insights, aging reports (Senior / Managing Partner only)
  canAccessTrustAudit?: boolean; // Trust and retainer account reconciliation
  canExportReports?: boolean;
}

export interface Advocate {
  id: string;
  name: string;
  title: string;
  lskRollNo: string;
  avatar: string;
  email: string;
  phone: string;
  practiceArea: PracticeArea;
  activeCasesCount: number;
  billableHoursThisMonth: number;
  billingRatePerHour: number; // in KES
  isDeveloper?: boolean;
  isSystemAdmin?: boolean;
  role?: UserRole;
  password?: string;
  activeOtp?: {
    code: string;
    expiresAt: string;
  };
  status?: 'Active' | 'Inactive' | 'Suspended' | 'On Leave';
  joinedDate?: string;
  notes?: string;
  permissions?: AdvocatePermissions;
}

export type MatterPriority = 'High' | 'Medium' | 'Low';

export type CourtDatePurpose =
  | 'Mention'
  | 'Hearing'
  | 'Ruling'
  | 'Judgement'
  | 'Directions'
  | 'Pre-Trial Conference'
  | 'Compliance'
  | 'Other';

export interface LegalMatter {
  id: string;
  referenceNumber: string; // e.g. MAA/HC/COM/2026/0142
  title: string;
  clientName: string;
  clientId: string;
  practiceArea: PracticeArea;
  courtRegistry?: string; // e.g. High Court Commercial Div. - Milimani
  courtCaseNumber?: string; // e.g. Civil Suit No. E142 of 2026
  ctsFilingId?: string; // Court Tracking System Ref
  responsibleAdvocateId: string;
  responsibleAdvocateName: string;
  status: MatterStatus;
  nextDeadlineDate: string; // Next Court Date
  nextDeadlineDescription: string;
  nextCourtDate?: string; // Alias for Next Court Date
  courtDatePurpose?: CourtDatePurpose | string; // Mention, Hearing, Ruling, Judgement, etc.
  estimatedFeeKES: number;
  billedKES: number;
  paidKES: number;
  createdDate: string;
  lodgedDate?: string; // Date when matter is lodged / entered in chambers registry or court
  description: string;
  priority: MatterPriority;
  documentsCount: number;
  opposingParty?: string;
  conflictCheckStatus?: 'Cleared' | 'Potential Conflict' | 'Direct Conflict' | 'Waiver Recorded';
  conflictCertificateRef?: string;
  tags?: string[];
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}

export type DeadlineCategory = 'Court Filing' | 'Client Meeting' | 'Court Hearing' | 'Document Review' | 'Hearing' | 'Mention' | 'Ruling' | 'Judgment' | 'Filing' | 'Case Conference';

export interface DeadlineItem {
  id: string;
  title: string;
  matterId: string;
  matterRef?: string;
  matterTitle: string;
  category: DeadlineCategory;
  dueDate: string; // ISO or formatted
  time: string;
  courtLocation?: string;
  presidingJudge?: string;
  advocateName: string;
  priority: 'Urgent' | 'High' | 'Medium';
  completed: boolean;
}

export interface Client {
  id: string;
  name: string;
  type: 'Corporate' | 'Individual' | 'State Entity';
  industry: string;
  kraPin: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string; // Nairobi, Mombasa, Eldoret, Nakuru
  activeMattersCount: number;
  totalBilledKES: number;
  retainerStatus: 'Active Retainer' | 'Per-Matter' | 'Pending Deposit';
}

export interface ActivityLog {
  id: string;
  type: 'Document' | 'Status Change' | 'Billing' | 'Team Action' | 'Court Event';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  matterId?: string;
  matterRef?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  category?: 'Professional Fees' | 'Court Filing / CTS' | 'Disbursement' | 'Legal Research' | 'Consultation' | 'Drafting Pleading' | 'Other' | string;
  quantity: number; // e.g. hours or units
  unitPriceKES: number; // e.g. rate per hour or item cost
  discountPercent?: number; // optional line item discount
  discountKES?: number;
  totalPriceKES: number;
  isTaxable?: boolean; // whether VAT (16%) is charged on this specific item/row
  vatAmountKES?: number; // calculated VAT for this line item
}

export type FeeNoteStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Pending';

export interface FeeNote {
  id: string;
  invoiceNumber: string; // e.g. MAA-INV-2026-088
  clientName: string;
  clientId?: string;
  clientEmail?: string;
  clientKraPin?: string;
  clientAddress?: string;
  matterId?: string;
  matterRef?: string;
  matterTitle: string;
  dateIssued: string;
  dueDate: string;
  items?: InvoiceLineItem[];
  subtotalKES?: number;
  discountKES?: number;
  taxableAmountKES?: number; // Net amount of VAT-chargeable items
  nonTaxableAmountKES?: number; // Net amount of zero-rated / exempt items (e.g. CTS filing, stamp duty)
  disbursementsKES?: number;
  amountKES: number; // Total net amount before VAT
  vatRatePercent?: number; // standard VAT percentage (default 16%)
  vatKES: number;
  totalKES: number;
  amountPaidKES?: number; // Total cumulative payments received
  balanceKES?: number; // Remaining balance payable (totalKES - amountPaidKES)
  status: FeeNoteStatus;
  paymentRef?: string;
  quoteId?: string; // linked quotation ID if converted
  quoteNumber?: string;
  notes?: string;
  bankDetails?: string;
  paymentsCount?: number;
}

export type PaymentMethod = 'M-Pesa' | 'Bank Transfer' | 'Cheque';

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // e.g. "MAA-RCP-2026-001"
  paymentReference: string; // e.g. "MPESA-QWE12345", "TXN98231", "CHQ-88214"
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  matterTitle?: string;
  amountKES: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  receivedBy?: string;
  createdAt: string;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted to Fee Note' | 'Converted to Invoice';

export interface QuoteLineItem {
  id: string;
  description: string;
  category?: 'Professional Fees' | 'Court Filing / CTS' | 'Disbursement' | 'Legal Research' | 'Consultation' | 'Drafting Pleading' | 'Other' | string;
  quantity: number;
  unitPriceKES: number;
  discountPercent?: number;
  discountKES?: number;
  totalPriceKES: number;
  isTaxable?: boolean;
  vatAmountKES?: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string; // e.g. "MAA-QUO-2026-001"
  title: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientKraPin?: string;
  matterId?: string;
  matterRef?: string;
  matterTitle?: string;
  quoteDate: string;
  expiryDate: string;
  items: QuoteLineItem[];
  subtotalKES: number;
  discountPercent?: number;
  discountKES?: number;
  taxableAmountKES: number;
  nonTaxableAmountKES?: number;
  vatKES: number;
  totalKES: number;
  status: QuoteStatus;
  notes?: string;
  termsAndConditions?: string;
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  convertedDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: string; // e.g. "v3.0", "v2.0", "v1.0"
  title: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  ctsReceiptNo?: string;
  changeSummary: string;
  isCurrent: boolean;
  diffNotes?: string[];
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null; // null for root level, folderId for subfolder
  matterRef?: string;
  createdDate: string;
  itemCount?: number;
}

export interface DocumentDraft {
  id: string;
  title: string;
  matterRef: string;
  folderId?: string;
  category: 'Pleading' | 'Affidavit' | 'Contract' | 'Legal Opinion' | 'Brief';
  content: string;
  author: string;
  lastModified: string;
  status: 'Draft' | 'Under Partner Review' | 'Approved' | 'e-Filed';
}

export interface ClientOnboardingSubmission {
  id: string;
  clientName: string;
  clientType: 'Individual' | 'Corporate / SME' | 'Government / State Agency';
  idOrRegNo: string;
  email: string;
  phone: string;
  address: string;
  matterType: string;
  assignedAdvocate: string;
  retainerFeeKES: number;
  status: 'Pending Review' | 'KYC Verified' | 'Onboarded & Matter Opened' | 'Rejected';
  submittedDate: string;
  notes?: string;
}

export type FiledDocumentType =
  | 'Plaint'
  | 'Notice of Motion'
  | 'Chamber Summons'
  | 'Affidavit'
  | 'Replying Affidavit'
  | 'Supplementary Affidavit'
  | 'Statement of Defence'
  | 'Memorandum of Appearance'
  | 'Written Submissions'
  | 'Court Order'
  | 'Witness Statement'
  | 'List & Bundle of Documents'
  | 'Decree'
  | 'Notice of Appeal'
  | 'Other Pleading';

export type FiledDocumentStatus =
  | 'Filed & Endorsed'
  | 'Pending Assessment'
  | 'Served on Parties'
  | 'Awaiting Response'
  | 'Listed for Hearing';

export interface CaseFiledDocument {
  id: string;
  matterId: string;
  matterRef: string;
  title: string;
  docType: FiledDocumentType | string;
  filingDate: string; // YYYY-MM-DD or readable
  ctsReference?: string; // e.g. CTS-2026-NBI-8492
  filedBy: string; // e.g. "Adv. Costa Kimathi (Counsel for Plaintiff)"
  status: FiledDocumentStatus | string;
  pageCount?: number;
  fileSize?: string;
  summaryOrPrayer?: string;
  servedDate?: string;
  pdfUrl?: string;
  createdDate?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  matterRef: string;
  category: 'Pleading' | 'Affidavit' | 'Contract' | 'Title Deed' | 'Legal Opinion' | 'Court Order';
  fileSize: string;
  uploadedBy: string;
  uploadedDate: string;
  ctsReceiptNo?: string;
  currentVersion?: string;
  versions?: DocumentVersion[];
  folderId?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'Court' | 'Billing' | 'Filing' | 'System';
}

export type MatterHealthScore = 'Healthy' | 'Attention Required' | 'Critical';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  matterId: string;
  matterRef: string;
  clientName: string;
  assignedTo: string;
  createdBy: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Waiting' | 'Completed' | 'Overdue';
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  subtasks: { id: string; text: string; completed: boolean }[];
  commentsCount: number;
}

export interface ConflictCheckRecord {
  id: string;
  entityName: string;
  entityType: 'Individual' | 'Company' | 'Opposing Party' | 'Director';
  searchedBy: string;
  searchDate: string;
  matchesFound: number;
  matchDetails: string[];
  status: 'Pending Review' | 'Cleared' | 'Potential Conflict' | 'Conflict Confirmed' | 'Waiver Recorded';
  notes: string;
  certificateRef: string;
}

export interface CourtAppearance {
  id: string;
  matterId: string;
  matterRef: string;
  caseNumber: string;
  courtName: string; // e.g. High Court Commercial Div - Milimani
  station: string;
  presidingJudge: string;
  appearanceType: 'Hearing' | 'Mention' | 'Ruling' | 'Judgment' | 'Chamber Summons';
  date: string;
  time: string;
  leadAdvocate: string;
  opposingCounsel: string;
  directionsGiven?: string;
  nextHearingDate?: string;
  status: 'Scheduled' | 'Adjourned' | 'Concluded' | 'Judgment Reserved';
}

export interface CommunicationLog {
  id: string;
  matterId: string;
  matterRef: string;
  clientName: string;
  type: 'Phone Call' | 'Email' | 'Court Letter' | 'In-Person Meeting' | 'Client Portal Msg';
  subject: string;
  summary: string;
  date: string;
  user: string;
  followUpRequired: boolean;
  followUpDueDate?: string;
}

export interface TimeEntry {
  id: string;
  matterId: string;
  matterRef: string;
  advocateName: string;
  date: string;
  activityType: 'Court Appearance' | 'Legal Research' | 'Document Drafting' | 'Client Consultation' | 'Negotiation';
  description: string;
  durationMinutes: number;
  billable: boolean;
  hourlyRateKES: number;
  totalFeeKES: number;
  billed: boolean;
}

export interface TrustTransaction {
  id: string;
  receiptNo: string;
  clientId: string;
  clientName: string;
  matterRef: string;
  transactionType: 'Deposit' | 'Disbursement' | 'Fee Transfer' | 'Refund';
  amountKES: number;
  date: string;
  paymentMethod: 'M-Pesa Paybill' | 'RTGS Bank Transfer' | 'Cheque' | 'Cash';
  referenceNo: string;
  purpose: string;
  approvedBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'Matter' | 'Client' | 'Document' | 'Fee Note' | 'Invoice' | 'Task' | 'Trust Account' | 'Conflict Check' | 'Authentication';
  entityRef: string;
  details: string;
  ipAddress: string;
}

export interface LoginAuditEntry {
  id: string;
  timestamp: string;
  identifier: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  ipAddress: string;
  location?: string;
  deviceInfo: string;
  loginMethod: 'Password Credentials' | 'Profile Selector' | 'Password Reset' | 'Direct Admin' | 'Session Resume';
}

export interface MonthlyRevenueTrend {
  month: string;
  billedKES: number;
  collectedKES: number;
  targetKES: number;
}

export interface AgingBucket {
  category: string;
  amountKES: number;
  count: number;
  color: string;
}

export interface TopBillingClient {
  clientName: string;
  billedKES: number;
  paidKES: number;
  outstandingKES: number;
  mattersCount: number;
  category: string;
}

export interface PracticeAreaRevenue {
  practiceArea: PracticeArea;
  revenueKES: number;
  percentage: number;
  activeMattersCount: number;
}

export type TemplateCategory = 'Pleading' | 'Affidavit' | 'Contract' | 'Letter / Notice' | 'Retainer' | 'General';

export interface LegalTemplateVariable {
  key: string; // e.g. "client_name"
  label: string; // e.g. "Client Name"
  category: 'Client' | 'Matter' | 'Firm' | 'Court';
  example: string; // e.g. "Safaricom PLC"
}

export interface LegalTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  practiceArea?: PracticeArea | 'All Practice Areas';
  variables: string[]; // e.g. ["client_name", "matter_title"]
  content: string; // text content with placeholders like {{client_name}}
  createdDate: string;
  lastModified: string;
  author: string;
  isSystemDefault?: boolean;
}

export interface FeeNoteLineItemTemplate {
  id: string;
  description: string;
  category: 'Professional Fees' | 'Court Filing / CTS' | 'Disbursement' | 'Legal Research' | 'Consultation' | 'Drafting Pleading' | 'Other' | string;
  quantity: number;
  unitPriceKES: number;
  isTaxable: boolean;
  statutoryReference?: string; // e.g. "Advocates (Remuneration) Order Schedule 6"
}

export interface FeeNoteTemplate {
  id: string;
  title: string;
  description: string;
  practiceArea: PracticeArea | 'All Practice Areas';
  items: FeeNoteLineItemTemplate[];
  defaultNotes?: string;
  author: string;
  createdDate: string;
  lastModified: string;
  isSystemDefault?: boolean;
  tags?: string[];
}

export interface StandardServiceItem {
  id: string;
  description: string;
  category: 'Professional Fees' | 'Court Filing / CTS' | 'Disbursement' | 'Legal Research' | 'Consultation' | 'Drafting Pleading' | 'Other' | string;
  unitPriceKES: number;
  isTaxable: boolean;
  statutoryReference?: string;
  practiceArea?: PracticeArea | 'All Practice Areas';
}

export interface ChambersSettings {
  firmName: string;
  tagline: string;
  logoUrl: string | null;
  lskFirmRegNo: string;
  kraPin: string;
  physicalAddress: string;
  postalAddress: string;
  phone: string;
  email: string;
  billingEmail: string;
  website: string;
  managingPartner: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    swiftCode?: string;
    paybillNumber?: string;
  };
  integrations: {
    ctsAutoSync: boolean;
    ctsApiKey?: string;
    ardhiSasaSync: boolean;
    brsAutoSearch: boolean;
    syncFrequencyMinutes: number;
  };
  compliance: {
    lskLicenseActive: boolean;
    rollRef: string;
    auditLoggingEnforced: boolean;
    amlThresholdKES: number;
    requireConflictCheckApproval: boolean;
  };
  displayPreferences: {
    defaultCurrency: string;
    dateFormat: string;
  };
  lastSaved?: string;
}

export type NoticeCategory = 'Announcements' | 'Holidays' | 'Birthdays' | 'Company News';
export type NoticePriority = 'Normal' | 'Important' | 'Urgent';

export interface NoticeReaction {
  emoji: string;
  count: number;
  users: string[]; // names of users
}

export interface NoticeBoardItem {
  id: string;
  title: string;
  category: NoticeCategory;
  content: string;
  postedBy: string;
  postedRole?: string;
  date: string; // formatted date or ISO
  priority: NoticePriority;
  pinned?: boolean;
  targetAudience?: 'All Staff' | 'Advocates' | 'Legal Assistants' | 'Partners';
  eventDate?: string; // Optional target date for birthdays or holidays (e.g. 2026-08-28)
  location?: string; // e.g. "Main Chambers Boardroom / Virtual"
  acknowledgedBy?: string[]; // Advocate/user names who confirmed reading
  reactions?: NoticeReaction[];
  tags?: string[];
}

// ----------------------------------------------------
// CLIENT SERVICES MODULE TYPES
// ----------------------------------------------------

export type ClientInteractionType =
  | 'Call'
  | 'Enquiry'
  | 'Client Request'
  | 'Appointment'
  | 'Complaint / Feedback'
  | 'Walk-in Visitor'
  | 'Email'
  | 'SMS'
  | 'WhatsApp'
  | 'Letter'
  | 'Other';

export type CallSubtype = 'Incoming Call' | 'Outgoing Call' | 'Missed Call' | 'Callback Request';

export type EnquiryCategory =
  | 'Legal Service Enquiry'
  | 'New Client Onboarding'
  | 'Fee Estimate / Quotation'
  | 'Case Status Enquiry'
  | 'Document Request'
  | 'Conveyancing & Land Search'
  | 'Succession & Probate'
  | 'Commercial & Retainer'
  | 'General Enquiry';

export type EnquiryStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Client'
  | 'Resolved'
  | 'Closed';

export type ClientRequestType =
  | 'Case Update'
  | 'Document Copy'
  | 'Speak with Advocate'
  | 'Schedule Consultation'
  | 'Fee Note / Receipt Copy'
  | 'Certified True Copies'
  | 'Fee Estimate / Quotation'
  | 'Court Order Status'
  | 'Other Request';

export type AppointmentSubtype =
  | 'New Consultation'
  | 'Case Briefing'
  | 'Document Execution / Signing'
  | 'Follow-up Consultation'
  | 'Virtual / Zoom Conference'
  | 'Chambers Meeting'
  | 'Rescheduling'
  | 'Cancellation';

export type ComplaintCategory =
  | 'Communication Delay'
  | 'Fee / Billing Dispute'
  | 'Service Quality'
  | 'Court Filing Delay'
  | 'Staff Conduct'
  | 'Document Error'
  | 'Other';

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Received'
  | 'Under Review'
  | 'Action Required'
  | 'Response Sent'
  | 'Resolved'
  | 'Closed';

export type InteractionChannel =
  | 'Phone'
  | 'In-Person / Reception'
  | 'Email'
  | 'WhatsApp'
  | 'SMS'
  | 'Web Portal'
  | 'Postal Letter'
  | 'Court / Registry Encounter';

export type InteractionDirection = 'Incoming' | 'Outgoing' | 'Internal';

export type InteractionPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export type InteractionStatus =
  | 'Open'
  | 'In Progress'
  | 'Awaiting Client'
  | 'Action Required'
  | 'Resolved'
  | 'Closed'
  | 'Cancelled';

export type FollowUpStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';

export interface InteractionAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: 'Created' | 'Updated' | 'Status Changed' | 'Assigned' | 'Follow-up Created' | 'Converted to Client' | 'Converted to Matter' | 'Resolved' | 'Archived';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}

export interface ClientInteraction {
  id: string; // e.g. INT-2026-0042
  interactionType: ClientInteractionType;
  subtype?: string; // e.g. "Incoming Call", "New Consultation", "Document Copy"
  date: string; // YYYY-MM-DD or readable
  time: string; // e.g. "10:30 AM"
  durationMinutes?: number; // e.g. 15 for calls/meetings
  channel: InteractionChannel;
  direction: InteractionDirection;
  status: InteractionStatus;
  priority: InteractionPriority;
  isConfidential?: boolean; // sensitive complaints/notes restricted to partners/admin

  // Parties & Linkages
  clientId?: string;
  clientName: string; // can be prospective client name or existing client
  isExistingClient: boolean;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  kraPin?: string;
  
  // Prospective Client Conversion tracking
  isProspectiveClient?: boolean;
  convertedToClientId?: string;
  convertedToMatterId?: string;

  // Matter Linkage
  matterId?: string;
  matterRef?: string;
  matterTitle?: string;

  // Staff Handling & Assignment
  handledById: string;
  handledByName: string;
  assignedStaffId?: string;
  assignedStaffName?: string;

  // Interaction Content & Details
  subject: string;
  description: string;
  clientRequestOrEnquiry?: string;
  responseProvided?: string;
  outcome?: string;
  actionRequired?: string;
  internalNotes?: string;

  // Follow-up Details
  followUpRequired: boolean;
  followUpAssignedToId?: string;
  followUpAssignedToName?: string;
  followUpDueDate?: string;
  followUpStatus?: FollowUpStatus;
  followUpNotes?: string;
  followUpCompletedDate?: string;
  linkedTaskId?: string;

  // Enquiry Specific
  enquiryCategory?: EnquiryCategory;
  enquirySource?: 'Phone Call' | 'Walk-in' | 'Email' | 'Website' | 'WhatsApp' | 'Referral' | 'LSK Directory';
  enquiryStatus?: EnquiryStatus;
  enquiryDeadline?: string;
  enquiryResolution?: string;

  // Complaint Specific
  complaintCategory?: ComplaintCategory;
  complaintSeverity?: ComplaintSeverity;
  complaintStatus?: ComplaintStatus;
  complaintInvestigationNotes?: string;
  complaintResolution?: string;
  complaintDateResolved?: string;
  clientSatisfaction?: 'Very Satisfied' | 'Satisfied' | 'Neutral' | 'Dissatisfied';

  // Walk-in Specific
  visitorPassNumber?: string;
  visitorIdNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  hostAdvocateName?: string;

  // Attachments / Documents
  attachments?: {
    id: string;
    fileName: string;
    fileSize: string;
    uploadedAt: string;
  }[];

  // Audit
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  auditTrail: InteractionAuditEntry[];
}

export type ClientServicesTab =
  | 'Dashboard'
  | 'Interactions'
  | 'Calls'
  | 'Enquiries'
  | 'Requests'
  | 'Appointments'
  | 'Complaints'
  | 'WalkIns'
  | 'FollowUps'
  | 'Timeline'
  | 'Reports';


