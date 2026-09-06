import { Advocate, UserRole } from '../types';

export const SYS_ADMIN_ACCOUNT: Advocate = {
  id: 'dev-admin',
  name: 'Eric',
  title: 'Sys Admin & Technical Lead',
  lskRollNo: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=350&q=80',
  email: 'eahago@gmail.com',
  phone: '+254 700 000 000',
  practiceArea: 'Commercial Law',
  activeCasesCount: 0,
  billableHoursThisMonth: 0,
  billingRatePerHour: 0,
  role: 'System Admin',
  status: 'Active',
  joinedDate: '2020-01-01',
  password: 'password123',
  isSystemAdmin: true,
  isDeveloper: true,
  permissions: {
    canViewAllMatters: true,
    canManageStaff: true,
    canEditBilling: true,
    canViewFinancialInsights: true,
    canAccessTrustAudit: true,
    canExportReports: true,
  },
};

export const INITIAL_STAFF_ROSTER: Advocate[] = [
  SYS_ADMIN_ACCOUNT,
  {
    id: 'adv-1',
    name: 'Adv. Costa Kimathi',
    title: 'Managing Advocate & Senior Partner',
    lskRollNo: 'P.105/18492/18',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=350&q=80',
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
    isSystemAdmin: false,
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
    avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=350&q=80',
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
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=350&q=80',
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
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=350&q=80',
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
    avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=350&q=80',
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
      canEditBilling: true, // Invoicing Role assigned (can generate & send fee notes)
      canViewFinancialInsights: false, // Detailed financial details belong to senior / Managing Advocate!
      canAccessTrustAudit: false,
      canExportReports: true,
    },
  },
];

const STAFF_STORAGE_KEY = 'muthoni_ahago_staff_roster_v12';

// Email normalization map to ensure official emails persist
const EMAIL_CANONICAL_MAP: Record<string, string> = {
  'dev-admin': 'eahago@gmail.com',
  'adv-1': 'muthoni@muthoniahagolaw.co.ke',
  'adv-allan': 'allan@muthoniahagolaw.co.ke',
  'adv-moraa': 'wendy@muthoniahagolaw.co.ke',
  'staff-clerk-1': 'irungu@muthoniahagolaw.co.ke',
  'staff-om-1': 'phylis@muthoniahagolaw.co.ke',
};

export const isSysAdminUser = (adv: Advocate | null | undefined): boolean => {
  if (!adv) return false;
  return (
    adv.id === 'dev-admin' ||
    Boolean(adv.isDeveloper) ||
    adv.role === 'System Admin' ||
    adv.email?.toLowerCase() === 'eahago@gmail.com' ||
    adv.name?.toLowerCase() === 'eric' ||
    adv.title?.toLowerCase().includes('sys admin') ||
    adv.title?.toLowerCase().includes('system administrator')
  );
};

export const loadStaffRoster = (): Advocate[] => {
  try {
    const saved = localStorage.getItem(STAFF_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Normalize canonical emails if outdated in stored roster
        const normalized: Advocate[] = parsed.map((m: Advocate): Advocate => {
          const cleanRollNo = (m.lskRollNo === 'SYS/ADM/001' || m.lskRollNo?.includes('SYS/ADM')) ? '' : (m.lskRollNo || '');
          if (m.id === 'dev-admin' || m.email === 'eahago@gmail.com') {
            return {
              ...m,
              name: 'Eric',
              email: 'eahago@gmail.com',
              role: 'System Admin' as UserRole,
              title: 'Sys Admin & Technical Lead',
              lskRollNo: '',
              isSystemAdmin: true,
              isDeveloper: true,
              password: m.password || 'password123',
            };
          }
          if (m.id === 'adv-1') {
            return {
              ...m,
              lskRollNo: cleanRollNo,
              isSystemAdmin: false,
              role: 'Managing Advocate',
              email: EMAIL_CANONICAL_MAP[m.id],
              password: m.password || 'password123',
            };
          }
          if (EMAIL_CANONICAL_MAP[m.id]) {
            return {
              ...m,
              lskRollNo: cleanRollNo,
              email: EMAIL_CANONICAL_MAP[m.id],
              password: m.password || 'password123',
            };
          }
          return {
            ...m,
            lskRollNo: cleanRollNo,
            password: m.password || 'password123',
          };
        });

        // Ensure dev-admin Eric exists in full auth roster
        if (!normalized.some((m: Advocate) => m.id === 'dev-admin' || m.email === 'eahago@gmail.com')) {
          normalized.unshift(SYS_ADMIN_ACCOUNT);
        }

        return normalized;
      }
    }
  } catch (err) {
    console.error('Failed to load staff roster from storage:', err);
  }
  // Store and return initial roster
  saveStaffRoster(INITIAL_STAFF_ROSTER);
  return INITIAL_STAFF_ROSTER;
};

export const loadVisibleStaffRoster = (): Advocate[] => {
  const all = loadStaffRoster();
  return all.filter((s) => !isSysAdminUser(s));
};

export const saveStaffRoster = (roster: Advocate[]): void => {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(roster));
    window.dispatchEvent(new CustomEvent('chambers-staff-updated', { detail: roster }));
  } catch (err) {
    console.error('Failed to save staff roster to storage:', err);
  }
};

export const addStaffMember = (
  staffData: Omit<Advocate, 'id'> & { id?: string }
): Advocate => {
  const currentRoster = loadStaffRoster();
  const id = staffData.id || `staff-${Date.now()}`;
  
  const defaultPermissions = {
    canViewAllMatters:
      staffData.role === 'System Admin' ||
      staffData.role === 'Managing Advocate' ||
      staffData.role === 'Office Manager',
    canManageStaff: staffData.role === 'System Admin' || staffData.role === 'Managing Advocate',
    canEditBilling:
      staffData.role === 'System Admin' ||
      staffData.role === 'Managing Advocate' ||
      staffData.role === 'Office Manager',
    canAccessTrustAudit: staffData.role === 'System Admin' || staffData.role === 'Managing Advocate',
    canExportReports: true,
  };

  const newMember: Advocate = {
    ...staffData,
    id,
    avatar:
      staffData.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    activeCasesCount: staffData.activeCasesCount ?? 0,
    billableHoursThisMonth: staffData.billableHoursThisMonth ?? 0,
    billingRatePerHour: 0,
    status: staffData.status || 'Active',
    joinedDate: staffData.joinedDate || new Date().toISOString().split('T')[0],
    password: staffData.password || 'TemporaryPass2026!',
    permissions: staffData.permissions || defaultPermissions,
  };

  const updated = [newMember, ...currentRoster];
  saveStaffRoster(updated);
  return newMember;
};

export const updateStaffMember = (
  id: string,
  updates: Partial<Advocate>
): Advocate | null => {
  const currentRoster = loadStaffRoster();
  const index = currentRoster.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const existing = currentRoster[index];
  const updatedMember: Advocate = {
    ...existing,
    ...updates,
    permissions: {
      ...existing.permissions,
      ...(updates.permissions || {}),
    },
  };

  currentRoster[index] = updatedMember;
  saveStaffRoster(currentRoster);
  return updatedMember;
};

export const deleteStaffMember = (id: string): boolean => {
  const currentRoster = loadStaffRoster();
  // Prevent deleting primary dev-admin root account
  if (id === 'dev-admin') {
    return false;
  }
  const filtered = currentRoster.filter((s) => s.id !== id);
  if (filtered.length === currentRoster.length) return false;

  saveStaffRoster(filtered);
  return true;
};

export const resetStaffMemberPassword = (
  id: string,
  newPassword?: string
): { success: boolean; tempPassword?: string; staff?: Advocate } => {
  const currentRoster = loadStaffRoster();
  const member = currentRoster.find((s) => s.id === id);
  if (!member) return { success: false };

  const pass = newPassword || `Muthoni@${Math.floor(1000 + Math.random() * 9000)}`;
  member.password = pass;
  // Clear any existing active OTP
  member.activeOtp = undefined;
  saveStaffRoster(currentRoster);
  return { success: true, tempPassword: pass, staff: member };
};

export const generateStaffMemberOtp = (
  emailOrId: string
): { success: boolean; otp?: string; staff?: Advocate; message?: string } => {
  const currentRoster = loadStaffRoster();
  const cleanKey = emailOrId.trim().toLowerCase();
  const member = currentRoster.find(
    (s) =>
      s.id.toLowerCase() === cleanKey ||
      s.email.toLowerCase() === cleanKey ||
      s.name.toLowerCase() === cleanKey
  );

  if (!member) {
    return { success: false, message: `No active account found for ${emailOrId}` };
  }

  // Generate 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

  member.activeOtp = {
    code: otpCode,
    expiresAt,
  };

  saveStaffRoster(currentRoster);
  return {
    success: true,
    otp: otpCode,
    staff: member,
    message: `Secure 6-digit OTP dispatched to ${member.email}`,
  };
};

export const verifyStaffMemberOtp = (
  emailOrId: string,
  otp: string
): { success: boolean; staff?: Advocate; message?: string } => {
  const currentRoster = loadStaffRoster();
  const cleanKey = emailOrId.trim().toLowerCase();
  const member = currentRoster.find(
    (s) =>
      s.id.toLowerCase() === cleanKey ||
      s.email.toLowerCase() === cleanKey ||
      s.name.toLowerCase() === cleanKey
  );

  if (!member) {
    return { success: false, message: 'User profile not found.' };
  }

  if (!member.activeOtp || !member.activeOtp.code) {
    return { success: false, message: 'No active OTP requested. Please request a new code.' };
  }

  const isExpired = new Date(member.activeOtp.expiresAt).getTime() < Date.now();
  if (isExpired) {
    return { success: false, message: 'OTP has expired. Please request a fresh code.' };
  }

  if (member.activeOtp.code !== otp.trim()) {
    return { success: false, message: 'Invalid OTP entered. Please check your email and try again.' };
  }

  // Valid OTP - consume it
  member.activeOtp = undefined;
  saveStaffRoster(currentRoster);

  return { success: true, staff: member, message: 'Verification successful.' };
};

export const updateStaffPasswordDirectly = (
  emailOrUsername: string,
  newPassword: string
): { success: boolean; staff?: Advocate; message?: string } => {
  const currentRoster = loadStaffRoster();
  const cleanKey = emailOrUsername.trim().toLowerCase();
  const isDeveloperKeyword = ['dev', 'admin', 'developer', 'sysadmin', 'eahago', 'eric'].includes(cleanKey);

  const member = currentRoster.find(
    (s) =>
      (isDeveloperKeyword && (s.id === 'dev-admin' || s.isDeveloper || s.isSystemAdmin)) ||
      s.id.toLowerCase() === cleanKey ||
      s.email.toLowerCase() === cleanKey ||
      s.name.toLowerCase() === cleanKey ||
      s.email.toLowerCase().startsWith(cleanKey) ||
      (cleanKey === 'eahago@gmail.com' && (s.id === 'dev-admin' || s.email === 'eahago@gmail.com'))
  );

  if (!member) {
    return { success: false, message: `No registered account found for "${emailOrUsername}".` };
  }

  member.password = newPassword.trim();
  member.activeOtp = undefined;
  saveStaffRoster(currentRoster);
  return {
    success: true,
    staff: member,
    message: `Password successfully updated for ${member.name} (${member.email}).`,
  };
};

export interface PasswordResetEmailPayload {
  recipientEmail: string;
  recipientName: string;
  newPassword: string;
  subject: string;
  bodyText: string;
  sentAt: string;
}

export const generateSecurePassword = (): string => {
  const prefixes = ['Muthoni', 'Advocate', 'Chambers', 'Legal', 'Lex'];
  const symbols = ['!', '@', '#', '$'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  return `${prefix}@${num}${sym}`;
};

export const requestPasswordResetByEmail = (
  emailOrUsername: string
): { success: boolean; staff?: Advocate; newPassword?: string; emailPayload?: PasswordResetEmailPayload; message?: string } => {
  const currentRoster = loadStaffRoster();
  const cleanKey = emailOrUsername.trim().toLowerCase();
  const isDeveloperKeyword = ['dev', 'admin', 'developer', 'sysadmin', 'eahago', 'eric'].includes(cleanKey);

  const member = currentRoster.find(
    (s) =>
      (isDeveloperKeyword && (s.id === 'dev-admin' || s.isDeveloper || s.isSystemAdmin)) ||
      s.email.toLowerCase() === cleanKey ||
      s.name.toLowerCase() === cleanKey ||
      s.id.toLowerCase() === cleanKey ||
      s.email.toLowerCase().startsWith(cleanKey) ||
      (cleanKey === 'eahago@gmail.com' && (s.id === 'dev-admin' || s.email === 'eahago@gmail.com'))
  );

  if (!member) {
    return {
      success: false,
      message: `No active staff or advocate account registered for "${emailOrUsername}".`,
    };
  }

  const newPass = generateSecurePassword();
  member.password = newPass;
  member.activeOtp = undefined;
  saveStaffRoster(currentRoster);

  const sentAt = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });

  const emailPayload: PasswordResetEmailPayload = {
    recipientEmail: member.email,
    recipientName: member.name,
    newPassword: newPass,
    subject: `Password Reset - Muthoni Ahago Advocates Portal Credentials`,
    bodyText: `Dear ${member.name},\n\nYour portal login password has been reset per your request.\n\nYour New Temporary Password: ${newPass}\n\nPlease return to the sign-in portal and log in using your work email (${member.email}) and this new password.\n\nBest regards,\nMuthoni Ahago Advocates Security & System Administration`,
    sentAt,
  };

  return {
    success: true,
    staff: member,
    newPassword: newPass,
    emailPayload,
    message: `A new secure password has been generated and dispatched to ${member.email}.`,
  };
};

export const resetStaffToDefaults = (): Advocate[] => {
  saveStaffRoster(INITIAL_STAFF_ROSTER);
  return INITIAL_STAFF_ROSTER;
};
