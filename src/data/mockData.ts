import {
  Advocate,
  LegalMatter,
  DeadlineItem,
  Client,
  ActivityLog,
  FeeNote,
  PaymentRecord,
  Quotation,
  DocumentItem,
  NotificationItem,
  TaskItem,
  ConflictCheckRecord,
  CourtAppearance,
  CommunicationLog,
  TimeEntry,
  TrustTransaction,
  AuditLogEntry,
  DocumentFolder,
  DocumentDraft,
  ClientOnboardingSubmission,
  MonthlyRevenueTrend,
  AgingBucket,
  TopBillingClient,
  PracticeAreaRevenue,
  NoticeBoardItem,
} from '../types';

export const mockAdvocates: Advocate[] = [
  {
    id: 'adv-1',
    name: 'Adv. Costa Kimathi',
    title: 'Managing Advocate & Senior Partner',
    lskRollNo: 'P.105/18492/18',
    avatar: '/avatars/african_lawyer.jpg',
    email: 'muthoni@muthoniahagolaw.co.ke',
    phone: '+254 722 410 890',
    practiceArea: 'Civil Litigation',
    activeCasesCount: 0,
    billableHoursThisMonth: 0,
    billingRatePerHour: 0,
    role: 'Managing Advocate',
    status: 'Active',
    joinedDate: '2020-03-01',
    password: 'password123',
    isSystemAdmin: true,
    permissions: {
      canViewAllMatters: true,
      canManageStaff: true,
      canEditBilling: true,
      canViewFinancialInsights: true,
      canAccessTrustAudit: true,
      canExportReports: true,
    },
  },
  {
    id: 'adv-allan',
    name: 'Allan Khasabuli',
    title: 'Consultant Advocate (Public Policy, Energy & Tax Advisory)',
    lskRollNo: 'P.105/15904/14',
    avatar: '/avatars/african_consultant.jpg',
    email: 'allan@muthoniahagolaw.co.ke',
    phone: '+254 733 812 770',
    practiceArea: 'Constitutional & Tax',
    activeCasesCount: 0,
    billableHoursThisMonth: 0,
    billingRatePerHour: 0,
    role: 'Consultant Advocate',
    status: 'Active',
    joinedDate: '2021-06-01',
    password: 'password123',
    permissions: {
      canViewAllMatters: false,
      canManageStaff: false,
      canEditBilling: false,
      canViewFinancialInsights: false,
      canAccessTrustAudit: false,
      canExportReports: true,
    },
  },
  {
    id: 'adv-moraa',
    name: 'Wendy Moraa',
    title: 'Advocate (Commercial & Conveyancing Transactions)',
    lskRollNo: 'P.105/23114/23',
    avatar: '/avatars/african_female_lawyer.jpg',
    email: 'wendy@muthoniahagolaw.co.ke',
    phone: '+254 718 440 293',
    practiceArea: 'Conveyancing Law',
    activeCasesCount: 0,
    billableHoursThisMonth: 0,
    billingRatePerHour: 0,
    role: 'Advocate',
    status: 'Active',
    joinedDate: '2023-08-15',
    password: 'password123',
    permissions: {
      canViewAllMatters: false,
      canManageStaff: false,
      canEditBilling: false,
      canViewFinancialInsights: false,
      canAccessTrustAudit: false,
      canExportReports: true,
    },
  },
  {
    id: 'staff-clerk-1',
    name: 'Enrique Irungu',
    title: 'Senior Court Registry & Legal Support Clerk',
    lskRollNo: 'CLK/CTS/2025',
    avatar: '/avatars/african_clerk.jpg',
    email: 'irungu@muthoniahagolaw.co.ke',
    phone: '+254 723 552 119',
    practiceArea: 'Civil Litigation',
    activeCasesCount: 0,
    billableHoursThisMonth: 0,
    billingRatePerHour: 0,
    role: 'Legal Support Clerk',
    status: 'Active',
    joinedDate: '2025-01-10',
    password: 'password123',
    permissions: {
      canViewAllMatters: false,
      canManageStaff: false,
      canEditBilling: false,
      canViewFinancialInsights: false,
      canAccessTrustAudit: false,
      canExportReports: false,
    },
  },
  {
    id: 'staff-om-1',
    name: 'Phylis Adhiambo',
    title: 'Office Manager & Head of Chambers Operations',
    lskRollNo: 'OPS/MGR/2024',
    avatar: '/avatars/african_operations_mgr.jpg',
    email: 'phylis@muthoniahagolaw.co.ke',
    phone: '+254 722 314 908',
    practiceArea: 'Commercial Law',
    activeCasesCount: 0,
    billableHoursThisMonth: 0,
    billingRatePerHour: 0,
    role: 'Office Manager',
    status: 'Active',
    joinedDate: '2024-02-01',
    password: 'password123',
    permissions: {
      canViewAllMatters: true,
      canManageStaff: false,
      canEditBilling: true,
      canViewFinancialInsights: false,
      canAccessTrustAudit: false,
      canExportReports: true,
    },
  },
];

export const mockClients: Client[] = [];

export const mockMatters: LegalMatter[] = [];
export const mockFeeNotes: FeeNote[] = [];
export const mockPayments: PaymentRecord[] = [];
export const mockQuotes: Quotation[] = [];
export const mockDeadlines: DeadlineItem[] = [];
export const mockActivities: ActivityLog[] = [];
export const mockDocuments: DocumentItem[] = [];
export const mockNotifications: NotificationItem[] = [];
export const mockTasks: TaskItem[] = [];
export const mockConflictRecords: ConflictCheckRecord[] = [];
export const mockCourtAppearances: CourtAppearance[] = [];
export const mockCommunications: CommunicationLog[] = [];
export const mockTimeEntries: TimeEntry[] = [];
export const mockTrustTransactions: TrustTransaction[] = [];
export const mockAuditLogs: AuditLogEntry[] = [];
export const mockFolders: DocumentFolder[] = [];
export const mockDrafts: DocumentDraft[] = [];
export const mockOnboardingSubmissions: ClientOnboardingSubmission[] = [];
export const mockMonthlyRevenue: MonthlyRevenueTrend[] = [];
export const mockAgingBuckets: AgingBucket[] = [];
export const mockTopBillingClients: TopBillingClient[] = [];
export const mockPracticeAreaRevenue: PracticeAreaRevenue[] = [];
export const mockNotices: NoticeBoardItem[] = [];
