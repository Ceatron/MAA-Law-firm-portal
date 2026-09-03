import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Mail,
  Phone,
  Scale,
  Award,
  ShieldCheck,
  Plus,
  Filter,
  CheckCircle2,
  Building2,
  Briefcase,
  FileCheck2,
  Headphones,
  Code2,
  Edit,
  Trash2,
  KeyRound,
  Shield,
  UserX,
  AlertCircle,
  Copy,
  Check,
  LayoutGrid,
  List,
  Lock,
  Sparkles,
  Search,
  X,
  UserPlus,
  RefreshCw,
  Send,
  History,
} from 'lucide-react';
import { Advocate, UserRole, PracticeArea, AdvocatePermissions } from '../../types';
import {
  loadStaffRoster,
  loadVisibleStaffRoster,
  isSysAdminUser,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  resetStaffMemberPassword,
  generateStaffMemberOtp,
  resetStaffToDefaults,
} from '../../utils/staffStorage';
import { LoginAuditLogViewer } from '../LoginAuditLogViewer';

interface TeamViewProps {
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  advocates?: Advocate[];
  onUpdateAdvocates?: (advocates: Advocate[]) => void;
}

const AVAILABLE_ROLES: UserRole[] = [
  'Managing Advocate',
  'Consultant Advocate',
  'Advocate',
  'Office Manager',
  'Legal Support Clerk',
];

export const AFRICAN_STAFF_AVATAR_PRESETS = [
  {
    id: 'av-1',
    label: 'Costa Kimathi (Managing Partner)',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-2',
    label: 'Allan Khasabuli (Consultant)',
    url: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-3',
    label: 'Wendy Moraa (Advocate)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-4',
    label: 'Phylis Adhiambo (Operations)',
    url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-5',
    label: 'Enrique Irungu (Registry Clerk)',
    url: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-6',
    label: 'Legal Associate (Female)',
    url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-7',
    label: 'Senior Counsel (Male)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'av-8',
    label: 'Managing Partner (Female)',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=350&q=80',
  },
];

const AVAILABLE_PRACTICE_AREAS: PracticeArea[] = [
  'Commercial Law',
  'Civil Litigation',
  'Conveyancing Law',
  'Constitutional & Tax',
  'Succession Law',
];

export const TeamView: React.FC<TeamViewProps> = ({
  currentAdvocate,
  isManagingAdvocate = false,
  advocates: propAdvocates,
  onUpdateAdvocates,
}) => {
  // Staff Roster State - excluding System Admin from staff members display
  const [roster, setRoster] = useState<Advocate[]>(() => {
    const list = propAdvocates && propAdvocates.length > 0 ? propAdvocates : loadStaffRoster();
    return list.filter((a) => !isSysAdminUser(a));
  });

  const [activeTeamTab, setActiveTeamTab] = useState<'roster' | 'login_audit'>('roster');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Advocate | null>(null);
  const [passwordResetStaff, setPasswordResetStaff] = useState<Advocate | null>(null);
  const [resetMethod, setResetMethod] = useState<'password' | 'otp'>('password');
  const [customResetPassword, setCustomResetPassword] = useState<string>('');
  const [deleteCandidate, setDeleteCandidate] = useState<Advocate | null>(null);

  // Temporary password/OTP display after reset
  const [tempPasswordResult, setTempPasswordResult] = useState<{
    userName: string;
    tempPass: string;
    type: 'password' | 'otp';
    email?: string;
  } | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    role: 'Advocate' as UserRole,
    lskRollNo: '',
    email: '',
    phone: '',
    practiceArea: 'Commercial Law' as PracticeArea,
    password: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Suspended' | 'On Leave',
    avatar: '',
    permissions: {
      canViewAllMatters: false,
      canManageStaff: false,
      canEditBilling: false,
      canViewFinancialInsights: false,
      canAccessTrustAudit: false,
      canExportReports: true,
    } as AdvocatePermissions,
  });

  // Check if current active user has staff management permissions
  const currentUserRole = currentAdvocate?.role;
  const isDevAdmin =
    currentAdvocate?.id === 'dev-admin' ||
    Boolean(currentAdvocate?.isDeveloper) ||
    Boolean(currentAdvocate?.isSystemAdmin) ||
    currentUserRole === 'System Admin';

  const isManagingPartner =
    currentUserRole === 'Managing Advocate' ||
    currentAdvocate?.id === 'adv-1' ||
    Boolean(currentAdvocate?.title?.toLowerCase().includes('managing'));

  const canManageUsers = isDevAdmin || isManagingPartner || isManagingAdvocate || Boolean(currentAdvocate?.permissions?.canManageStaff);

  // Password Reset Authorization: Restricted strictly to Managing Advocate and System Admin
  const canResetPasswords =
    isDevAdmin ||
    isManagingPartner ||
    currentUserRole === 'Managing Advocate' ||
    currentUserRole === 'System Admin' ||
    Boolean(currentAdvocate?.isSystemAdmin);

  // Sync with propAdvocates or custom event
  useEffect(() => {
    if (propAdvocates && propAdvocates.length > 0) {
      setRoster(propAdvocates);
    }
  }, [propAdvocates]);

  useEffect(() => {
    const handleStaffUpdated = (e: CustomEvent<Advocate[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRoster(e.detail);
        if (onUpdateAdvocates) {
          onUpdateAdvocates(e.detail);
        }
      }
    };
    window.addEventListener('chambers-staff-updated', handleStaffUpdated as EventListener);
    return () => {
      window.removeEventListener('chambers-staff-updated', handleStaffUpdated as EventListener);
    };
  }, [onUpdateAdvocates]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleBadge = (role?: UserRole, isDev?: boolean) => {
    if (isDev || role === 'System Admin') {
      return {
        label: 'System Admin',
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        ring: 'ring-indigo-400',
        icon: Code2,
      };
    }
    switch (role) {
      case 'Managing Advocate':
        return {
          label: 'Managing Advocate',
          bg: 'bg-blue-100 text-[#0070ba] border-blue-200',
          ring: 'ring-[#0070ba]/40',
          icon: ShieldCheck,
        };
      case 'Consultant Advocate':
        return {
          label: 'Consultant Advocate',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          ring: 'ring-purple-400/40',
          icon: Award,
        };
      case 'Advocate':
        return {
          label: 'Advocate',
          bg: 'bg-sky-100 text-sky-800 border-sky-200',
          ring: 'ring-sky-400/40',
          icon: Scale,
        };
      case 'Office Manager':
        return {
          label: 'Office Manager',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          ring: 'ring-emerald-400/40',
          icon: Building2,
        };
      case 'Legal Support Clerk':
        return {
          label: 'Legal Support Clerk',
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          ring: 'ring-teal-400/40',
          icon: Headphones,
        };
      default:
        return {
          label: role || 'Firm Workspace Staff',
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          ring: 'ring-stone-300',
          icon: UserCheck,
        };
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Inactive':
        return 'bg-stone-100 text-stone-600 border-stone-300';
      case 'Suspended':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'On Leave':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Active':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      title: 'Associate Advocate',
      role: 'Advocate',
      lskRollNo: `P.105/${Math.floor(20000 + Math.random() * 9000)}/26`,
      email: '',
      phone: '+254 7',
      practiceArea: 'Commercial Law',
      password: 'TemporaryPass2026!',
      status: 'Active',
      avatar: AFRICAN_STAFF_AVATAR_PRESETS[0].url,
      permissions: {
        canViewAllMatters: false,
        canManageStaff: false,
        canEditBilling: false,
        canViewFinancialInsights: false,
        canAccessTrustAudit: false,
        canExportReports: true,
      },
    });
    setIsAddModalOpen(true);
  };

  // Quick Role change handler that intelligently sets default permissions
  const handleRoleChange = (newRole: UserRole) => {
    const isAdminRole = newRole === 'System Admin' || newRole === 'Managing Advocate';
    const isOM = newRole === 'Office Manager';
    
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      title:
        prev.title === '' ||
        prev.title === 'Associate Advocate' ||
        prev.title.includes('Advocate') ||
        prev.title.includes('Clerk') ||
        prev.title.includes('Manager')
          ? newRole === 'Managing Advocate'
            ? 'Managing Advocate & Senior Partner'
            : newRole === 'System Admin'
            ? 'Systems Administrator & Legal Tech Officer'
            : newRole === 'Office Manager'
            ? 'Office Manager & Head of Firm Workspace Operations'
            : newRole === 'Legal Support Clerk'
            ? 'Registry & Legal Support Clerk'
            : newRole === 'Consultant Advocate'
            ? 'Consultant Advocate'
            : 'Advocate'
          : prev.title,
      permissions: {
        canViewAllMatters: isAdminRole || isOM,
        canManageStaff: isAdminRole,
        canEditBilling: isAdminRole || isOM, // Office Manager is assigned invoicing rights
        canViewFinancialInsights: isAdminRole, // Detailed financial details belong to senior / Managing Advocate!
        canAccessTrustAudit: isAdminRole,
        canExportReports: true,
      },
    }));
  };

  const handleGrantAllAdminRights = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        canViewAllMatters: true,
        canManageStaff: true,
        canEditBilling: true,
        canViewFinancialInsights: true,
        canAccessTrustAudit: true,
        canExportReports: true,
      },
    }));
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: Advocate) => {
    setEditingStaff(staff);
    const isDev = Boolean(staff.isDeveloper) || Boolean(staff.isSystemAdmin) || staff.id === 'dev-admin';
    const effectiveRole: UserRole = staff.role || (isDev ? 'System Admin' : 'Advocate');

    setFormData({
      name: staff.name,
      title: staff.title,
      role: effectiveRole,
      lskRollNo: staff.lskRollNo,
      email: staff.email,
      phone: staff.phone,
      practiceArea: staff.practiceArea || 'Commercial Law',
      password: staff.password || '',
      status: staff.status || 'Active',
      avatar: staff.avatar || AFRICAN_STAFF_AVATAR_PRESETS[0].url,
      permissions: staff.permissions || {
        canViewAllMatters: effectiveRole === 'System Admin' || effectiveRole === 'Managing Advocate' || effectiveRole === 'Office Manager',
        canManageStaff: effectiveRole === 'System Admin' || effectiveRole === 'Managing Advocate',
        canEditBilling: effectiveRole === 'System Admin' || effectiveRole === 'Managing Advocate' || effectiveRole === 'Office Manager',
        canViewFinancialInsights: effectiveRole === 'System Admin' || effectiveRole === 'Managing Advocate',
        canAccessTrustAudit: effectiveRole === 'System Admin' || effectiveRole === 'Managing Advocate',
        canExportReports: true,
      },
    });
  };

  // Handle Save New Staff
  const handleSaveNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please provide the full legal name.');
      return;
    }
    if (!formData.email.trim()) {
      alert('Please provide an email address.');
      return;
    }

    const newStaff = addStaffMember({
      name: formData.name.trim(),
      title: formData.title.trim() || `${formData.role} - Muthoni & Ahago Firm Workspace`,
      role: formData.role,
      lskRollNo: formData.lskRollNo.trim() || 'REG/PENDING',
      email: formData.email.trim(),
      phone: formData.phone.trim() || '+254 700 000 000',
      practiceArea: formData.practiceArea,
      billingRatePerHour: 0,
      activeCasesCount: formData.role.includes('Advocate') ? 2 : 0,
      billableHoursThisMonth: 0,
      avatar: formData.avatar || AFRICAN_STAFF_AVATAR_PRESETS[0].url,
      status: formData.status,
      password: formData.password || 'TemporaryPass2026!',
      permissions: formData.permissions,
      isSystemAdmin: formData.role === 'System Admin',
    });

    const updated = loadVisibleStaffRoster();
    setRoster(updated);
    if (onUpdateAdvocates) onUpdateAdvocates(loadStaffRoster());
    setIsAddModalOpen(false);
    showToast(`Staff member "${newStaff.name}" registered successfully.`);
  };

  // Handle Update Existing Staff
  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (!formData.name.trim()) {
      alert('Please provide the full legal name.');
      return;
    }

    const updated = updateStaffMember(editingStaff.id, {
      name: formData.name.trim(),
      title: formData.title.trim(),
      role: formData.role,
      lskRollNo: formData.lskRollNo.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      practiceArea: formData.practiceArea,
      billingRatePerHour: 0,
      status: formData.status,
      avatar: formData.avatar,
      permissions: formData.permissions,
      ...(formData.password ? { password: formData.password } : {}),
      isSystemAdmin: formData.role === 'System Admin',
    });

    if (updated) {
      const refreshed = loadVisibleStaffRoster();
      setRoster(refreshed);
      if (onUpdateAdvocates) onUpdateAdvocates(loadStaffRoster());
      setEditingStaff(null);
      showToast(`Personnel record for "${updated.name}" updated successfully.`);
    }
  };

  // Handle Delete Staff
  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;

    if (deleteCandidate.id === 'dev-admin') {
      alert('Cannot delete the primary System Administrator superuser account.');
      setDeleteCandidate(null);
      return;
    }

    if (currentAdvocate && currentAdvocate.id === deleteCandidate.id) {
      alert('You cannot delete your own active logged-in session account.');
      setDeleteCandidate(null);
      return;
    }

    const success = deleteStaffMember(deleteCandidate.id);
    if (success) {
      const refreshed = loadVisibleStaffRoster();
      setRoster(refreshed);
      if (onUpdateAdvocates) onUpdateAdvocates(loadStaffRoster());
      showToast(`User "${deleteCandidate.name}" removed from firm workspace roster.`);
    } else {
      showToast('Failed to remove user account.');
    }
    setDeleteCandidate(null);
  };

  // Handle Password Reset (Direct Password)
  const handleExecutePasswordReset = (staff: Advocate, customPass?: string) => {
    if (!canResetPasswords) {
      alert('Unauthorized: Password resets are restricted to Managing Advocates and System Administrators.');
      return;
    }
    const res = resetStaffMemberPassword(staff.id, customPass);
    if (res.success && res.tempPassword) {
      setTempPasswordResult({
        userName: staff.name,
        tempPass: res.tempPassword,
        type: 'password',
        email: staff.email,
      });
      setPasswordResetStaff(null);
      const refreshed = loadVisibleStaffRoster();
      setRoster(refreshed);
      if (onUpdateAdvocates) onUpdateAdvocates(loadStaffRoster());
      showToast(`Password for ${staff.name} reset successfully.`);
    }
  };

  // Handle Password Reset (OTP Sent to Email)
  const handleExecuteOtpReset = (staff: Advocate) => {
    if (!canResetPasswords) {
      alert('Unauthorized: Password resets are restricted to Managing Advocates and System Administrators.');
      return;
    }
    const res = generateStaffMemberOtp(staff.email);
    if (res.success && res.otp) {
      setTempPasswordResult({
        userName: staff.name,
        tempPass: res.otp,
        type: 'otp',
        email: staff.email,
      });
      setPasswordResetStaff(null);
      const refreshed = loadVisibleStaffRoster();
      setRoster(refreshed);
      if (onUpdateAdvocates) onUpdateAdvocates(loadStaffRoster());
      showToast(`6-digit OTP generated & dispatched to ${staff.email}.`);
    } else {
      showToast(res.message || 'Failed to dispatch OTP to user email.');
    }
  };

  // Filter Categories - Firm Workspace Staff Only
  const roleCategories = [
    { id: 'all', label: 'All Staff Personnel', count: roster.length },
    {
      id: 'Managing Advocate',
      label: 'Managing Advocates',
      count: roster.filter((a) => a.role === 'Managing Advocate' || (!a.role && a.title.toLowerCase().includes('managing'))).length,
    },
    {
      id: 'Advocate',
      label: 'Advocates',
      count: roster.filter((a) => a.role === 'Advocate' || (!a.role && a.title.toLowerCase().includes('advocate') && !a.title.toLowerCase().includes('consultant'))).length,
    },
    {
      id: 'Consultant Advocate',
      label: 'Consultant Advocates',
      count: roster.filter((a) => a.role === 'Consultant Advocate' || (!a.role && a.title.toLowerCase().includes('consultant'))).length,
    },
    {
      id: 'Office Manager',
      label: 'Office Managers',
      count: roster.filter((a) => a.role === 'Office Manager' || (!a.role && a.title.toLowerCase().includes('manager'))).length,
    },
    {
      id: 'Legal Support Clerk',
      label: 'Legal Support Clerks',
      count: roster.filter((a) => a.role === 'Legal Support Clerk' || (!a.role && (a.title.toLowerCase().includes('clerk') || a.title.toLowerCase().includes('assistant')))).length,
    },
  ];

  const filteredAdvocates = roster.filter((adv) => {
    if (isSysAdminUser(adv)) return false;
    const effectiveRole =
      adv.role ||
      (adv.title.toLowerCase().includes('managing')
        ? 'Managing Advocate'
        : adv.title.toLowerCase().includes('consultant')
        ? 'Consultant Advocate'
        : adv.title.toLowerCase().includes('manager')
        ? 'Office Manager'
        : adv.title.toLowerCase().includes('clerk') ||
          adv.title.toLowerCase().includes('assistant') ||
          adv.title.toLowerCase().includes('receptionist')
        ? 'Legal Support Clerk'
        : 'Advocate');

    const matchesRole =
      selectedRoleFilter === 'all' ||
      effectiveRole.toLowerCase() === selectedRoleFilter.toLowerCase();

    const matchesSearch =
      adv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adv.lskRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adv.practiceArea && adv.practiceArea.toLowerCase().includes(searchQuery.toLowerCase())) ||
      adv.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 rounded-lg bg-[#1c2d3d] px-4 py-3 text-xs font-semibold text-white shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Privileges Notice Banner */}
      {canManageUsers ? (
        <div className="rounded-xl border border-[#bce0fd] bg-gradient-to-r from-[#ebf5fc] via-[#f0f8ff] to-white p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="rounded-lg bg-[#0070ba] p-2 text-white shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif-title font-bold text-[#132c3f] text-sm">
                    Administrative & Staff Management Authority
                  </h3>
                  <span className="rounded bg-[#0070ba] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider">
                    {currentUserRole || 'Managing Rights'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5 max-w-3xl">
                  You possess authorization to register new firm workspace personnel, adjust role assignments (Advocates, Clerks, Office Managers), reset portal passwords, and modify practice rate schedules.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add User / Staff</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 flex items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center space-x-2.5">
            <Shield className="h-4 w-4 text-stone-500 shrink-0" />
            <span>
              Firm Workspace Staff Directory — Log in as <strong>System Admin</strong> or <strong>Managing Advocate</strong> to add users, edit roles, reset passwords, or remove personnel.
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation: Staff Directory vs. Login Audit Trail */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          type="button"
          id="tab-team-roster"
          onClick={() => setActiveTeamTab('roster')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTeamTab === 'roster'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-lg'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Staff Directory & Roster ({roster.length})</span>
        </button>

        <button
          type="button"
          id="tab-team-login-audit"
          onClick={() => setActiveTeamTab('login_audit')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTeamTab === 'login_audit'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-lg'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <History className="h-4 w-4 text-[#0070ba]" />
          <span>Login & Security Audit Trail</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2">
            Active
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: LOGIN AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTeamTab === 'login_audit' && (
        <LoginAuditLogViewer currentAdvocate={currentAdvocate} />
      )}

      {/* ========================================================================= */}
      {/* SECTION: STAFF ROSTER */}
      {/* ========================================================================= */}
      {activeTeamTab === 'roster' && (
        <>
          {/* Main Header & View Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2dfd5] pb-4">
            <div>
              <h2 className="font-serif-title text-2xl font-bold text-[#1a1d20] flex items-center space-x-2">
                <span>Advocates & Firm Workspace Staff Roster</span>
                <span className="rounded-full bg-stone-200 text-stone-700 text-xs px-2.5 py-0.5 font-sans font-bold">
                  {roster.length} Total
                </span>
              </h2>
              <p className="mt-1 text-xs text-stone-600">
                Managing Advocates, Consultant Advocates, Advocates, Office Managers, Legal Support Clerks & System Administrators
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-stone-300 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#1c2d3d] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#1c2d3d] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  title="Administrative Table View"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {canManageUsers && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Staff</span>
                </button>
              )}
            </div>
          </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-200 pb-3">
        {roleCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedRoleFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedRoleFilter === cat.id
                ? 'bg-[#1c2d3d] text-white font-bold shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedRoleFilter === cat.id
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Overview Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, role, email, phone, or LSK Roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#0070ba] focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs text-stone-500">
          <span>
            Showing <strong className="text-stone-900">{filteredAdvocates.length}</strong> of {roster.length} members
          </span>
        </div>
      </div>

      {/* Temp Password or OTP Dialog after Reset */}
      {tempPasswordResult && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-sm animate-in fade-in flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-800 shrink-0">
              {tempPasswordResult.type === 'otp' ? <Send className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-xs">
                {tempPasswordResult.type === 'otp'
                  ? `6-Digit Email OTP Dispatched for ${tempPasswordResult.userName}`
                  : `Temporary Password Generated for ${tempPasswordResult.userName}`}
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                {tempPasswordResult.type === 'otp'
                  ? `A secure one-time passcode has been sent to ${tempPasswordResult.email || 'user email'}. The user can sign in or reset credentials using this code.`
                  : 'Share this secure credential with the user. They can update it upon logging in.'}
              </p>
              <div className="mt-1.5 flex items-center space-x-2">
                <code className="bg-white px-2.5 py-1 rounded border border-emerald-300 font-mono text-emerald-900 font-bold text-sm tracking-wider">
                  {tempPasswordResult.tempPass}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tempPasswordResult.tempPass, 'temp-pass')}
                  className="flex items-center space-x-1 rounded bg-emerald-700 text-white px-2 py-1 text-[11px] font-semibold hover:bg-emerald-800 cursor-pointer"
                >
                  {copiedId === 'temp-pass' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedId === 'temp-pass' ? 'Copied' : tempPasswordResult.type === 'otp' ? 'Copy OTP' : 'Copy Password'}</span>
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTempPasswordResult(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Roster View (Grid or Table) */}
      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAdvocates.map((adv) => {
            const isDev = Boolean(adv.isDeveloper) || Boolean(adv.isSystemAdmin) || adv.id === 'dev-admin';
            const roleInfo = getRoleBadge(adv.role, isDev);
            const IconComp = roleInfo.icon;
            const statusClass = getStatusBadge(adv.status);

            return (
              <div
                key={adv.id}
                className={`rounded-xl border p-5 shadow-2xs transition-all flex flex-col justify-between ${
                  isDev
                    ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/30 to-white hover:border-indigo-400'
                    : 'border-[#e2dfd5] bg-white hover:border-[#0070ba]/50 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Profile Header */}
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={adv.avatar}
                      alt={adv.name}
                      className={`h-12 w-12 rounded-full object-cover ring-2 shrink-0 ${roleInfo.ring}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-serif-title font-bold text-stone-900 text-sm truncate">
                          {adv.name}
                        </h3>
                        <span className={`inline-flex items-center space-x-1 rounded px-1.5 py-0.5 text-[9px] font-bold border shrink-0 ${roleInfo.bg}`}>
                          <IconComp className="h-2.5 w-2.5" />
                          <span>{roleInfo.label}</span>
                        </span>
                      </div>

                      <p className={`text-xs font-semibold truncate mt-0.5 ${isDev ? 'text-indigo-700' : 'text-[#0070ba]'}`}>
                        {adv.title}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-stone-500 font-mono">
                          {isDev ? 'SYS ID' : 'LSK Roll / ID'}: {adv.lskRollNo}
                        </p>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${statusClass}`}>
                          {adv.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Attributes */}
                  <div className="mt-4 space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Department / Area:</span>
                      <span className="font-semibold text-stone-800">{adv.practiceArea || 'General Practice'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Email:</span>
                      <a
                        href={`mailto:${adv.email}`}
                        className="font-medium text-[#0070ba] hover:underline truncate max-w-[170px]"
                      >
                        {adv.email}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Phone:</span>
                      <span className="font-mono text-stone-700">{adv.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats & Admin Actions */}
                <div className="mt-4 border-t border-stone-100 pt-3">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-stone-400 font-semibold">Active Matters</span>
                      <p className="font-bold text-stone-900">{adv.activeCasesCount ?? 0} files</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 font-semibold">Department</span>
                      <p className="font-semibold text-stone-700">
                        {adv.practiceArea?.split(' ')[0] || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Action Controls for Admin/Managing Rights */}
                  {canManageUsers && (
                    <div className="flex items-center space-x-1.5 border-t border-stone-100 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(adv)}
                        className="flex-1 flex items-center justify-center space-x-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit personnel profile & role"
                      >
                        <Edit className="h-3 w-3 text-stone-600" />
                        <span>Edit Role</span>
                      </button>

                      {/* Password Reset is strictly reserved for Managing Advocate and System Admin */}
                      {canResetPasswords && (
                        <button
                          type="button"
                          onClick={() => setPasswordResetStaff(adv)}
                          className="flex items-center justify-center rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 p-1.5 text-xs transition-colors cursor-pointer"
                          title="Reset Password / Send OTP (Admin Only)"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                        </button>
                      )}

                      {adv.id !== 'dev-admin' && (
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(adv)}
                          className="flex items-center justify-center rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 p-1.5 text-xs transition-colors cursor-pointer"
                          title="Remove user account"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-xl border border-[#e2dfd5] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2dfd5] bg-stone-50/80 text-[11px] font-bold text-stone-600 tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Credentials</th>
                  <th className="py-3 px-4">Practice Domain</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Active Files</th>
                  <th className="py-3 px-4">Status</th>
                  {canManageUsers && <th className="py-3 px-4 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAdvocates.map((adv) => {
                  const isDev = Boolean(adv.isDeveloper) || Boolean(adv.isSystemAdmin) || adv.id === 'dev-admin';
                  const roleInfo = getRoleBadge(adv.role, isDev);
                  const IconComp = roleInfo.icon;
                  const statusClass = getStatusBadge(adv.status);

                  return (
                    <tr key={adv.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={adv.avatar}
                            alt={adv.name}
                            className={`h-9 w-9 rounded-full object-cover ring-1 ${roleInfo.ring}`}
                          />
                          <div>
                            <p className="font-bold text-stone-900 text-xs">{adv.name}</p>
                            <p className="text-[11px] text-stone-500 truncate max-w-[180px]">
                              {adv.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-[10px] font-bold border ${roleInfo.bg}`}>
                          <IconComp className="h-2.5 w-2.5" />
                          <span>{roleInfo.label}</span>
                        </span>
                        <p className="text-[10px] font-mono text-stone-500 mt-1">
                          Roll: {adv.lskRollNo}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800">{adv.practiceArea || 'General'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-mono text-stone-700">{adv.email}</p>
                        <p className="text-[11px] text-stone-500">{adv.phone}</p>
                      </td>

                      <td className="py-3 px-4 font-semibold text-stone-800">
                        {adv.activeCasesCount ?? 0} matters
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${statusClass}`}>
                          {adv.status || 'Active'}
                        </span>
                      </td>

                      {canManageUsers && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(adv)}
                              className="rounded p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {canResetPasswords && (
                              <button
                                type="button"
                                onClick={() => setPasswordResetStaff(adv)}
                                className="rounded p-1.5 text-amber-700 hover:bg-amber-50 cursor-pointer"
                                title="Reset Password / Send OTP (Admin Only)"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {adv.id !== 'dev-admin' && (
                              <button
                                type="button"
                                onClick={() => setDeleteCandidate(adv)}
                                className="rounded p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Remove User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* MODAL 1: ADD NEW STAFF MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-[#0070ba] p-1.5 text-white">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    Register New Firm Workspace Staff / Advocate
                  </h3>
                  <p className="text-xs text-stone-500">
                    Assign role rights, LSK credentials, African model avatar, and initial login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="mt-4 space-y-4 text-xs">
              {/* Avatar Selection Section */}
              <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>Profile Photo (African Professional Model)</span>
                  </label>
                  <span className="text-[11px] text-stone-500">Select preset or enter URL</span>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={formData.avatar || AFRICAN_STAFF_AVATAR_PRESETS[0].url}
                    alt="Preview"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-[#0070ba] shrink-0 bg-stone-200"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Or paste custom image URL..."
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0070ba] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AFRICAN_STAFF_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: preset.url })}
                      className={`relative rounded-lg p-1 transition-all flex flex-col items-center group cursor-pointer ${
                        formData.avatar === preset.url
                          ? 'ring-2 ring-[#0070ba] bg-blue-50/50'
                          : 'hover:bg-stone-200/60 border border-transparent'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-9 w-9 rounded-full object-cover bg-stone-200"
                      />
                      {formData.avatar === preset.url && (
                        <div className="absolute -top-1 -right-1 bg-[#0070ba] text-white rounded-full p-0.5 shadow-xs">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adv. Wendy Moraa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">System & Firm Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white font-medium"
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Firm Workspace Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Advocate (Commercial)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">LSK Roll No. / Staff ID</label>
                  <input
                    type="text"
                    placeholder="e.g. P.105/23114/23 or CLK/CTS/2025"
                    value={formData.lskRollNo}
                    onChange={(e) => setFormData({ ...formData, lskRollNo: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. wendy@muthoniahagolaw.co.ke"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +254 718 440 293"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Practice Department</label>
                  <select
                    value={formData.practiceArea}
                    onChange={(e) => setFormData({ ...formData, practiceArea: e.target.value as PracticeArea })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
                  >
                    {AVAILABLE_PRACTICE_AREAS.map((pa) => (
                      <option key={pa} value={pa}>
                        {pa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    placeholder="Set temporary password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions & Role Rights */}
              <div className="border-t border-stone-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800">Firm Workspace Access & Administrative Rights</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGrantAllAdminRights}
                      className="text-[11px] font-semibold text-[#0070ba] hover:underline cursor-pointer"
                    >
                      Grant All Admin Rights
                    </button>
                  </div>
                </div>

                {(formData.role === 'System Admin' || formData.role === 'Managing Advocate') && (
                  <div className="mb-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-2.5 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#0070ba] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      <strong>{formData.role} Rights Activated:</strong> This profile will have unrestricted firm oversight, personnel management, billing approvals, and system administration privileges.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewAllMatters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canViewAllMatters: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Full Access to All Firm Matters</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageStaff}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canManageStaff: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Can Manage Staff Roster & Rights</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canEditBilling}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canEditBilling: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Can Access & Manage Billing (Fee Notes, Invoices & Payments)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.role === 'Managing Advocate' || formData.role === 'System Admin' || formData.permissions.canViewFinancialInsights}
                      disabled={formData.role !== 'Managing Advocate' && formData.role !== 'System Admin'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canViewFinancialInsights: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba] disabled:opacity-50"
                    />
                    <span className={formData.role !== 'Managing Advocate' && formData.role !== 'System Admin' ? 'text-stone-400' : 'text-stone-700'}>
                      Financial Details & Revenue Reports <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 ml-1">Managing Advocate Only</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canAccessTrustAudit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canAccessTrustAudit: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Access Trust Account Audits</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canExportReports}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canExportReports: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Export Firm Workspace Reports & Lists</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] cursor-pointer"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STAFF MEMBER */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-[#0070ba] p-1.5 text-white">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    Edit Profile & Rights: {editingStaff.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Update role classification, credentials, African model avatar, practice area, or admin permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="mt-4 space-y-4 text-xs">
              {/* Avatar Selection Section */}
              <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>Profile Photo (African Professional Model)</span>
                  </label>
                  <span className="text-[11px] text-stone-500">Select preset or enter URL</span>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={formData.avatar || AFRICAN_STAFF_AVATAR_PRESETS[0].url}
                    alt="Preview"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-[#0070ba] shrink-0 bg-stone-200"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Or paste custom image URL..."
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0070ba] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AFRICAN_STAFF_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: preset.url })}
                      className={`relative rounded-lg p-1 transition-all flex flex-col items-center group cursor-pointer ${
                        formData.avatar === preset.url
                          ? 'ring-2 ring-[#0070ba] bg-blue-50/50'
                          : 'hover:bg-stone-200/60 border border-transparent'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-9 w-9 rounded-full object-cover bg-stone-200"
                      />
                      {formData.avatar === preset.url && (
                        <div className="absolute -top-1 -right-1 bg-[#0070ba] text-white rounded-full p-0.5 shadow-xs">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">System & Firm Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white font-medium"
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Firm Workspace Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">LSK Roll No. / Staff ID</label>
                  <input
                    type="text"
                    value={formData.lskRollNo}
                    onChange={(e) => setFormData({ ...formData, lskRollNo: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Practice Area</label>
                  <select
                    value={formData.practiceArea}
                    onChange={(e) => setFormData({ ...formData, practiceArea: e.target.value as PracticeArea })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
                  >
                    {AVAILABLE_PRACTICE_AREAS.map((pa) => (
                      <option key={pa} value={pa}>
                        {pa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Update Password (optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Permissions & Role Rights */}
              <div className="border-t border-stone-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800">Access & Operational Permissions</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGrantAllAdminRights}
                      className="text-[11px] font-semibold text-[#0070ba] hover:underline cursor-pointer"
                    >
                      Grant All Admin Rights
                    </button>
                  </div>
                </div>

                {(formData.role === 'System Admin' || formData.role === 'Managing Advocate') && (
                  <div className="mb-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-2.5 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#0070ba] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      <strong>{formData.role} Rights Activated:</strong> This profile has full administrative access to edit staff rosters, oversee all chamber matters, and approve financial records.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewAllMatters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canViewAllMatters: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Full Access to All Firm Matters</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageStaff}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canManageStaff: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Can Manage Staff Roster & Rights</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canEditBilling}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canEditBilling: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Can Access & Manage Billing (Fee Notes, Invoices & Payments)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.role === 'Managing Advocate' || formData.role === 'System Admin' || formData.permissions.canViewFinancialInsights}
                      disabled={formData.role !== 'Managing Advocate' && formData.role !== 'System Admin'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canViewFinancialInsights: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba] disabled:opacity-50"
                    />
                    <span className={formData.role !== 'Managing Advocate' && formData.role !== 'System Admin' ? 'text-stone-400' : 'text-stone-700'}>
                      Financial Details & Revenue Reports <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 ml-1">Managing Advocate Only</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canAccessTrustAudit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canAccessTrustAudit: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Access Trust Account Audits</span>
                  </label>

                  <label className="flex items-center space-x-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canExportReports}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canExportReports: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#0070ba] focus:ring-[#0070ba]"
                    />
                    <span>Export Firm Workspace Reports & Lists</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PASSWORD RESET (Restricted to Managing Advocate & System Admin) */}
      {passwordResetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    Reset Password / Security Credential
                  </h3>
                  <p className="text-xs text-stone-500">
                    Managing Advocate & System Administrator Authorization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordResetStaff(null);
                  setCustomResetPassword('');
                }}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Staff Summary */}
            <div className="mt-4 flex items-center space-x-3 rounded-lg border border-stone-200 bg-stone-50/80 p-3">
              <img
                src={passwordResetStaff.avatar}
                alt={passwordResetStaff.name}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-stone-300"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">{passwordResetStaff.name}</p>
                <p className="text-[11px] text-stone-500 truncate">{passwordResetStaff.title} • {passwordResetStaff.role}</p>
                <p className="text-[11px] font-mono text-stone-600 truncate">{passwordResetStaff.email}</p>
              </div>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                {passwordResetStaff.status || 'Active'}
              </span>
            </div>

            {/* Reset Method Selection Tabs */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-700 mb-1.5 tracking-wider">
                Select Reset Method:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResetMethod('password')}
                  className={`flex items-center justify-center space-x-2 rounded-lg border p-3 text-xs font-semibold transition-all cursor-pointer ${
                    resetMethod === 'password'
                      ? 'border-[#0070ba] bg-sky-50/70 text-[#0070ba] shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span>Enter New Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetMethod('otp')}
                  className={`flex items-center justify-center space-x-2 rounded-lg border p-3 text-xs font-semibold transition-all cursor-pointer ${
                    resetMethod === 'otp'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>Send OTP to Email</span>
                </button>
              </div>
            </div>

            {/* Option 1: Direct Password */}
            {resetMethod === 'password' && (
              <div className="mt-4 space-y-3 rounded-lg border border-stone-200 bg-stone-50/50 p-3.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-stone-800">
                    New Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomResetPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] font-semibold text-[#0070ba] hover:underline cursor-pointer"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter custom password or leave blank for auto-generated"
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0070ba] focus:outline-none font-mono text-xs shadow-2xs"
                />
                <p className="text-[11px] text-stone-500">
                  If left blank, a secure temporary password will be automatically generated and displayed for you to share.
                </p>
              </div>
            )}

            {/* Option 2: OTP Sent to Email */}
            {resetMethod === 'otp' && (
              <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs animate-in fade-in">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                  <Mail className="h-4 w-4 text-emerald-700" />
                  <span>One-Time Email Passcode (OTP)</span>
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  A 6-digit one-time authorization code valid for <strong>15 minutes</strong> will be generated and dispatched to <strong>{passwordResetStaff.email}</strong>.
                </p>
                <p className="text-[11px] text-stone-500">
                  The staff member can enter this OTP on their login screen to verify their identity and set a new password.
                </p>
              </div>
            )}

            {/* Security Confirmation Notice */}
            <div className="mt-4 flex items-center space-x-2 text-[11px] text-stone-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Authorized under Managing Advocate & System Admin security protocols.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-end space-x-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setPasswordResetStaff(null);
                  setCustomResetPassword('');
                }}
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>

              {resetMethod === 'password' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleExecutePasswordReset(
                      passwordResetStaff,
                      customResetPassword.trim() || undefined
                    );
                    setCustomResetPassword('');
                  }}
                  className="rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] cursor-pointer flex items-center space-x-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{customResetPassword.trim() ? 'Apply New Password' : 'Set Auto-Generated Password'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteOtpReset(passwordResetStaff);
                    setCustomResetPassword('');
                  }}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Generate & Send OTP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2.5 border-b border-rose-100 pb-3">
              <div className="rounded-lg bg-rose-100 p-2 text-rose-800 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-base font-bold text-stone-900">
                  Remove Personnel Account
                </h3>
                <p className="text-xs text-stone-500">
                  Confirm removal from firm workspace access registry
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-stone-600">
              <p>
                Are you sure you want to remove <strong>{deleteCandidate.name}</strong> ({deleteCandidate.role || 'Staff'}) from the firm roster?
              </p>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-800 text-[11px]">
                <strong>Warning:</strong> This user will lose access to all matter tracking, calendar schedules, and fee notes. Historical document audit logs will remain preserved under their name.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
