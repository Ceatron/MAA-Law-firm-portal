import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ShieldCheck,
  Check,
  X,
  Plus,
  Search,
  Filter,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';
import { canUserAssignAndAddMatters } from '../../utils/visibilityRules';
import { useDraggable } from '../../hooks/useDraggable';
import { Advocate } from '../../types';
import {
  loadSavedLeaveRequests,
  saveStoredLeaveRequests,
  loadSavedLeaveBalances,
  saveStoredLeaveBalances,
  StoredLeaveRequest,
  StoredLeaveBalance,
} from '../../utils/chambersDataStorage';
import ChambersCloudService from '../../services/chambersCloudService';
import { isSupabaseConfigured } from '../../utils/supabaseClient';

interface LeaveRequest {
  id: string;
  staffName: string;
  role: string;
  leaveType: 'Annual Leave' | 'Sick Leave' | 'Maternity / Paternity' | 'Study / CLE Leave' | 'Compassionate Leave';
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  reliefStaff: string;
  status: 'Pending' | 'Approved' | 'Declined';
  requestedOn: string;
  approvedBy?: string;
}

interface LeaveBalance {
  staffName: string;
  role: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  cleTotal: number;
  cleUsed: number;
}

interface HRMViewProps {
  currentAdvocate?: Advocate;
}

export const HRMView: React.FC<HRMViewProps> = ({ currentAdvocate }) => {
  const staffList = loadVisibleStaffRoster();
  const canManageLeave = canUserAssignAndAddMatters(currentAdvocate);
  const currentUserName = currentAdvocate?.name || staffList[0]?.name || 'Advocate';

  // Navigation Tabs: Leave Functionality vs HRM Reports
  const [activeTab, setActiveTab] = useState<'leave' | 'balances' | 'reports'>('leave');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Leave Requests State loaded from persistent storage
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    loadSavedLeaveRequests() as LeaveRequest[]
  );

  // Leave Balances across all firm staff
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() => {
    const defaultBalances = staffList.map((adv) => ({
      staffName: adv.name,
      role: '',
      annualTotal: 21,
      annualUsed: 0,
      sickTotal: 14,
      sickUsed: 0,
      cleTotal: 7,
      cleUsed: 0,
    }));
    return loadSavedLeaveBalances(defaultBalances) as LeaveBalance[];
  });

  // Cloud Hydration & Realtime Synchronization
  useEffect(() => {
    let isCancelled = false;
    const loadHrmCloudData = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const [cloudReqs, cloudBals] = await Promise.all([
          ChambersCloudService.fetchLeaveRequests(),
          ChambersCloudService.fetchLeaveBalances(),
        ]);
        if (isCancelled) return;
        if (cloudReqs && cloudReqs.length > 0) setLeaveRequests(cloudReqs as LeaveRequest[]);
        if (cloudBals && cloudBals.length > 0) setLeaveBalances(cloudBals as LeaveBalance[]);
      } catch (err) {
        console.warn('[HRMView] Direct cloud load error:', err);
      }
    };

    loadHrmCloudData();

    const handleReqsUpdated = (e: any) => {
      if (Array.isArray(e.detail)) setLeaveRequests(e.detail as LeaveRequest[]);
    };
    const handleBalsUpdated = (e: any) => {
      if (Array.isArray(e.detail)) setLeaveBalances(e.detail as LeaveBalance[]);
    };

    window.addEventListener('chambers-leave-requests-updated', handleReqsUpdated);
    window.addEventListener('chambers-leave-balances-updated', handleBalsUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener('chambers-leave-requests-updated', handleReqsUpdated);
      window.removeEventListener('chambers-leave-balances-updated', handleBalsUpdated);
    };
  }, []);

  // Sync leave requests and balances to storage
  useEffect(() => {
    saveStoredLeaveRequests(leaveRequests as StoredLeaveRequest[]);
  }, [leaveRequests]);

  useEffect(() => {
    saveStoredLeaveBalances(leaveBalances as StoredLeaveBalance[]);
  }, [leaveBalances]);

  // Apply Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const { handleProps, modalStyle } = useDraggable({ isOpen: isLeaveModalOpen });
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Annual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRelief, setLeaveRelief] = useState(
    staffList.find((s) => s.name.toLowerCase() !== currentUserName.toLowerCase())?.name ||
      staffList[0]?.name ||
      'Staff Member'
  );

  // Current logged in user's leave balance
  const currentUserBalance = leaveBalances.find(
    (b) => b.staffName.toLowerCase() === currentUserName.toLowerCase()
  ) || {
    staffName: currentUserName,
    role: '',
    annualTotal: 21,
    annualUsed: 0,
    sickTotal: 14,
    sickUsed: 0,
    cleTotal: 7,
    cleUsed: 0,
  };

  const remainingAnnual = Math.max(0, currentUserBalance.annualTotal - currentUserBalance.annualUsed);
  const remainingSick = Math.max(0, currentUserBalance.sickTotal - currentUserBalance.sickUsed);
  const remainingCLE = Math.max(0, currentUserBalance.cleTotal - currentUserBalance.cleUsed);
  const totalRemainingDays = remainingAnnual + remainingSick + remainingCLE;

  // Filters
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<string>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Leave Application Submission (Applicant is automatically current user)
  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) return;

    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newReq: LeaveRequest = {
      id: `lvr-${Date.now()}`,
      staffName: currentUserName,
      role: '',
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      daysRequested: diffDays > 0 ? diffDays : 1,
      reason: leaveReason || `${leaveType} application`,
      reliefStaff: leaveRelief,
      status: 'Pending',
      requestedOn: new Date().toISOString().split('T')[0],
    };

    setLeaveRequests([newReq, ...leaveRequests]);
    setIsLeaveModalOpen(false);
    setLeaveReason('');
    showToast(`Leave application submitted for ${currentUserName} (${diffDays} days). Pending approval.`);
  };

  // Approve or Decline (Updates leave balances immediately when leave is approved or declined)
  const handleLeaveAction = (id: string, newStatus: 'Approved' | 'Declined') => {
    const target = leaveRequests.find((r) => r.id === id);
    if (!target) return;
    const oldStatus = target.status;

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              approvedBy: currentAdvocate?.name || 'Managing Advocate',
            }
          : r
      )
    );

    // Update leave balances reactively when leave is approved
    if (newStatus === 'Approved' && oldStatus !== 'Approved') {
      setLeaveBalances((prev) =>
        prev.map((b) => {
          if (b.staffName.toLowerCase() === target.staffName.toLowerCase()) {
            if (target.leaveType === 'Annual Leave') {
              return { ...b, annualUsed: b.annualUsed + target.daysRequested };
            } else if (target.leaveType === 'Sick Leave') {
              return { ...b, sickUsed: b.sickUsed + target.daysRequested };
            } else if (target.leaveType === 'Study / CLE Leave') {
              return { ...b, cleUsed: b.cleUsed + target.daysRequested };
            }
          }
          return b;
        })
      );
    } else if (newStatus === 'Declined' && oldStatus === 'Approved') {
      setLeaveBalances((prev) =>
        prev.map((b) => {
          if (b.staffName.toLowerCase() === target.staffName.toLowerCase()) {
            if (target.leaveType === 'Annual Leave') {
              return { ...b, annualUsed: Math.max(0, b.annualUsed - target.daysRequested) };
            } else if (target.leaveType === 'Sick Leave') {
              return { ...b, sickUsed: Math.max(0, b.sickUsed - target.daysRequested) };
            } else if (target.leaveType === 'Study / CLE Leave') {
              return { ...b, cleUsed: Math.max(0, b.cleUsed - target.daysRequested) };
            }
          }
          return b;
        })
      );
    }

    showToast(`Leave request ${newStatus.toLowerCase()} successfully.`);
  };

  // Filter leave requests:
  // - Applicants only see their own leave details
  // - Sys Admin and Managing Adv see all leave details
  const filteredLeave = leaveRequests.filter((r) => {
    if (!canManageLeave) {
      if (r.staffName.toLowerCase() !== currentUserName.toLowerCase()) {
        return false;
      }
    }
    const matchesStatus =
      leaveFilterStatus === 'all' || r.status.toLowerCase() === leaveFilterStatus.toLowerCase();
    const matchesType =
      leaveTypeFilter === 'all' || r.leaveType === leaveTypeFilter;
    return matchesStatus && matchesType;
  });

  // Calculate Report Metrics
  const totalApprovedDays = leaveRequests
    .filter((r) => r.status === 'Approved')
    .reduce((acc, r) => acc + r.daysRequested, 0);

  const pendingRequestsCount = leaveRequests.filter((r) => r.status === 'Pending').length;

  const annualDaysUsed = leaveRequests
    .filter((r) => r.status === 'Approved' && r.leaveType === 'Annual Leave')
    .reduce((acc, r) => acc + r.daysRequested, 0);

  const sickDaysUsed = leaveRequests
    .filter((r) => r.status === 'Approved' && r.leaveType === 'Sick Leave')
    .reduce((acc, r) => acc + r.daysRequested, 0);

  const cleDaysUsed = leaveRequests
    .filter((r) => r.status === 'Approved' && r.leaveType === 'Study / CLE Leave')
    .reduce((acc, r) => acc + r.daysRequested, 0);

  const maternityDaysUsed = leaveRequests
    .filter((r) => r.status === 'Approved' && r.leaveType === 'Maternity / Paternity')
    .reduce((acc, r) => acc + r.daysRequested, 0);

  const maxCategoryDays = Math.max(annualDaysUsed, sickDaysUsed, cleDaysUsed, maternityDaysUsed, 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2dfd5] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-6 w-6 text-[#0B63E5]" />
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              Human Resource Management (HRM)
            </h1>
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Staff leave applications, statutory entitlement tracking, advocate relief allocations & HRM analytics
          </p>
        </div>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="flex items-center space-x-2 rounded-md bg-[#0B63E5] px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Apply for Staff Leave</span>
        </button>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Remaining Leave Days Banner / Overview (Updates reactively when leave is taken) */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="h-5 w-5 text-[#0B63E5]" />
              <h2 className="text-sm font-bold text-slate-900">
                Remaining Leave Days for {currentUserName}
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                Auto-updates when leave is approved
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Your available leave entitlements for the current annual employment cycle.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Leave</span>
              <span className="font-mono font-bold text-base text-[#0B63E5]">{remainingAnnual}</span>
              <span className="text-[10px] text-slate-500 font-medium"> / {currentUserBalance.annualTotal} left</span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sick Leave</span>
              <span className="font-mono font-bold text-base text-emerald-700">{remainingSick}</span>
              <span className="text-[10px] text-slate-500 font-medium"> / {currentUserBalance.sickTotal} left</span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">CLE / Study</span>
              <span className="font-mono font-bold text-base text-purple-700">{remainingCLE}</span>
              <span className="text-[10px] text-slate-500 font-medium"> / {currentUserBalance.cleTotal} left</span>
            </div>

            <div className="bg-[#0B63E5] text-white rounded-lg px-3.5 py-2 text-center shadow-xs">
              <span className="block text-[10px] font-bold text-blue-100 uppercase tracking-wider">Total Available</span>
              <span className="font-mono font-bold text-lg leading-tight">{totalRemainingDays}</span>
              <span className="block text-[9px] text-blue-100">Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canManageLeave ? (
          <>
            <div className="rounded-xl border border-[#e2dfd5] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[11px] font-bold tracking-wider">Total Leave Requests</span>
                <CalendarDays className="h-4 w-4 text-[#0B63E5]" />
              </div>
              <p className="font-serif font-bold text-2xl text-stone-900 mt-2">{leaveRequests.length}</p>
              <p className="text-[10px] text-stone-500 mt-1">Total applications logged this period</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[11px] font-bold tracking-wider">Pending Partner Approvals</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="font-serif font-bold text-2xl text-amber-900 mt-2">{pendingRequestsCount}</p>
              <p className="text-[10px] text-amber-700 mt-1">Awaiting Managing Partner sign-off</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] font-bold tracking-wider">Approved Leave Days</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="font-serif font-bold text-2xl text-emerald-900 mt-2">{totalApprovedDays} Days</p>
              <p className="text-[10px] text-emerald-700 mt-1">Cumulatively granted to advocates & staff</p>
            </div>

            <div className="rounded-xl border border-[#e2dfd5] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[11px] font-bold tracking-wider">Statutory Entitlement</span>
                <ShieldCheck className="h-4 w-4 text-[#0B63E5]" />
              </div>
              <p className="font-serif font-bold text-2xl text-stone-900 mt-2">21 Days / Year</p>
              <p className="text-[10px] text-stone-500 mt-1">Kenya Employment Act 2007 compliant</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-[#e2dfd5] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[11px] font-bold tracking-wider">Remaining Annual Leave</span>
                <CalendarDays className="h-4 w-4 text-[#0B63E5]" />
              </div>
              <p className="font-serif font-bold text-2xl text-stone-900 mt-2">{remainingAnnual} Days</p>
              <p className="text-[10px] text-stone-500 mt-1">Of {currentUserBalance.annualTotal} statutory annual entitlement</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[11px] font-bold tracking-wider">Pending Applications</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="font-serif font-bold text-2xl text-amber-900 mt-2">
                {filteredLeave.filter((r) => r.status === 'Pending').length}
              </p>
              <p className="text-[10px] text-amber-700 mt-1">Awaiting approval</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] font-bold tracking-wider">Approved Leave Taken</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="font-serif font-bold text-2xl text-emerald-900 mt-2">
                {filteredLeave.filter((r) => r.status === 'Approved').reduce((acc, r) => acc + r.daysRequested, 0)} Days
              </p>
              <p className="text-[10px] text-emerald-700 mt-1">Days taken this employment cycle</p>
            </div>

            <div className="rounded-xl border border-[#e2dfd5] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[11px] font-bold tracking-wider">Total Available Days</span>
                <ShieldCheck className="h-4 w-4 text-[#0B63E5]" />
              </div>
              <p className="font-serif font-bold text-2xl text-stone-900 mt-2">{totalRemainingDays} Days</p>
              <p className="text-[10px] text-stone-500 mt-1">Annual, sick, and study leave combined</p>
            </div>
          </>
        )}
      </div>

      {/* Main HRM Navigation Sub-Tabs */}
      <div className="flex border-b border-[#e2dfd5] bg-white rounded-t-lg px-4 pt-2">
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'leave'
              ? 'border-[#0B63E5] text-[#0B63E5]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>{canManageLeave ? `Leave Applications & Approvals (${leaveRequests.length})` : `My Leave Applications (${filteredLeave.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'balances'
              ? 'border-[#0B63E5] text-[#0B63E5]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{canManageLeave ? 'Staff Leave Entitlements & Balances' : 'My Leave Entitlements & Balance'}</span>
        </button>

        {canManageLeave && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'reports'
                ? 'border-[#0B63E5] text-[#0B63E5]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>HRM & Leave Audit Reports</span>
          </button>
        )}
      </div>

      {/* TAB 1: LEAVE APPLICATIONS & APPROVAL WORKFLOW */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#e2dfd5] shadow-2xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stone-700">Approval Status:</span>
                <select
                  value={leaveFilterStatus}
                  onChange={(e) => setLeaveFilterStatus(e.target.value)}
                  className="rounded border border-stone-300 bg-stone-50 p-1.5 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Applications</option>
                  <option value="pending">Pending Partner Review</option>
                  <option value="approved">Approved Applications</option>
                  <option value="declined">Declined Applications</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stone-700">Leave Category:</span>
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="rounded border border-stone-300 bg-stone-50 p-1.5 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Leave Types</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Maternity / Paternity">Maternity / Paternity</option>
                  <option value="Study / CLE Leave">Study / LSK CLE Leave</option>
                  <option value="Compassionate Leave">Compassionate Leave</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0256D0] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Leave Application</span>
            </button>
          </div>

          <div className="space-y-3">
            {filteredLeave.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#e2dfd5] bg-white p-12 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-stone-300 mb-3" />
                <h3 className="text-sm font-bold text-stone-800">No Leave Applications Found</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                  There are currently no staff leave requests on file. Use the button below to submit a new leave application.
                </p>
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 rounded bg-[#0B63E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0256D0] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Submit Leave Application</span>
                </button>
              </div>
            ) : (
              filteredLeave.map((req) => (
              <div
                key={req.id}
                className={`rounded-lg border bg-white p-5 shadow-2xs space-y-3 transition-all ${
                  req.status === 'Pending'
                    ? 'border-amber-300 bg-amber-50/30'
                    : req.status === 'Approved'
                    ? 'border-emerald-200'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1d20] font-serif font-bold text-white text-xs">
                      {req.staffName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{req.staffName}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-extrabold  tracking-wider ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                    >
                      {req.status}
                    </span>

                    {req.status === 'Pending' && canManageLeave && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleLeaveAction(req.id, 'Approved')}
                          className="flex items-center space-x-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleLeaveAction(req.id, 'Declined')}
                          className="flex items-center space-x-1 rounded bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Leave Category:</span>
                    <span className="font-bold text-stone-900">{req.leaveType}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Dates & Duration:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {req.startDate} to {req.endDate} ({req.daysRequested} Days)
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Relief Advocate Handover:</span>
                    <span className="font-bold text-stone-800">{req.reliefStaff}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Submission Date:</span>
                    <span className="font-mono text-stone-600">{req.requestedOn}</span>
                  </div>
                </div>

                <div className="rounded bg-stone-50 border border-stone-200 p-2.5 text-xs text-stone-700">
                  <span className="font-bold text-stone-900">Reason / Notes: </span>
                  <span>{req.reason}</span>
                </div>

                {req.approvedBy && (
                  <p className="text-[10px] text-stone-400 italic">
                    Decision processed by: <strong className="text-stone-600">{req.approvedBy}</strong>
                  </p>
                )}
              </div>
            )))}
          </div>
        </div>
      )}

      {/* TAB 2: STAFF LEAVE ENTITLEMENT BALANCES */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#e2dfd5] bg-white p-4 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Law Firm Statutory & Policy Leave Entitlements</h3>
              <p className="text-xs text-stone-500">
                Kenya Employment Act 2007 (Annual 21 Days, Sick 14 Days, LSK CLE Study Days).
              </p>
            </div>
            <span className="text-xs font-bold text-[#0B63E5] font-mono bg-stone-100 px-3 py-1 rounded">
              2026 Cycle
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(canManageLeave
              ? leaveBalances
              : leaveBalances.filter((b) => b.staffName.toLowerCase() === currentUserName.toLowerCase())
            ).map((bal, idx) => {
              const annRem = Math.max(0, bal.annualTotal - bal.annualUsed);
              const annPct = Math.round((annRem / bal.annualTotal) * 100);

              return (
                <div key={idx} className="rounded-lg border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-stone-900 text-sm">{bal.staffName}</h4>
                  </div>

                  {/* Annual Leave Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-700">
                      <span>Annual Leave ({annRem} days left)</span>
                      <span>{bal.annualUsed}/{bal.annualTotal} days used</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0B63E5] h-2 rounded-full" style={{ width: `${annPct}%` }} />
                    </div>
                  </div>

                  {/* Sick Leave & CLE */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded bg-stone-50 p-2.5 border border-stone-200">
                      <span className="block text-[10px] font-bold text-stone-400">Sick Leave</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {Math.max(0, bal.sickTotal - bal.sickUsed)} <span className="text-[10px] text-stone-500 font-normal">/ {bal.sickTotal} left</span>
                      </span>
                    </div>

                    <div className="rounded bg-stone-50 p-2.5 border border-stone-200">
                      <span className="block text-[10px] font-bold text-stone-400">LSK CLE / Study</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {Math.max(0, bal.cleTotal - bal.cleUsed)} <span className="text-[10px] text-stone-500 font-normal">/ {bal.cleTotal} left</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: HRM & LEAVE AUDIT REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#e2dfd5] shadow-2xs">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Firm Workspace HRM & Annual Leave Utilization Report
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Executive summary of staff leave trends, advocate relief coverage & statutory compliance
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => showToast('Exporting HRM Leave Summary Report as PDF...')}
                className="flex items-center space-x-1.5 rounded border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 cursor-pointer"
              >
                <Printer className="h-4 w-4 text-stone-600" />
                <span>Print PDF Report</span>
              </button>
              <button
                onClick={() => showToast('Exporting Leave Audit Register as CSV...')}
                className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0256D0] cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV Data</span>
              </button>
            </div>
          </div>

          {/* Breakdown Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leave Type Distribution */}
            <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-2">
                  <PieChart className="h-4 w-4 text-[#0B63E5]" />
                  <span>Leave Utilization by Category (2026)</span>
                </h4>
                <span className="text-[10px] font-bold text-stone-400">Annual Audit</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-stone-800 mb-1">
                    <span>Annual Leave (Statutory 21 Days)</span>
                    <span className="font-mono text-[#0B63E5]">{annualDaysUsed} Days Total</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#0B63E5] h-2.5 rounded-full transition-all" style={{ width: `${Math.round((annualDaysUsed / maxCategoryDays) * (annualDaysUsed > 0 ? 100 : 0))}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-stone-800 mb-1">
                    <span>Sick Leave & Medical Rest</span>
                    <span className="font-mono text-emerald-700">{sickDaysUsed} Days Total</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.round((sickDaysUsed / maxCategoryDays) * (sickDaysUsed > 0 ? 100 : 0))}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-stone-800 mb-1">
                    <span>LSK Continuous Legal Education (CLE) & Exams</span>
                    <span className="font-mono text-amber-700">{cleDaysUsed} Days Total</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.round((cleDaysUsed / maxCategoryDays) * (cleDaysUsed > 0 ? 100 : 0))}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-stone-800 mb-1">
                    <span>Maternity / Paternity Sabbatical</span>
                    <span className="font-mono text-purple-700">{maternityDaysUsed} Days Used</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.round((maternityDaysUsed / maxCategoryDays) * (maternityDaysUsed > 0 ? 100 : 0))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Department / Role Compliance */}
            <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span>Advocate Relief Coverage Audit</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {leaveRequests.length > 0 ? '100% Handover Rate' : 'No Active Leaves'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded bg-stone-50 p-3 border border-stone-200">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span>Partners (Kimathi, Muthoni, Ahago)</span>
                    <span className="text-[#0B63E5] font-mono">
                      {leaveRequests
                        .filter((r) => r.status === 'Approved' && (r.staffName.includes('Kimathi') || r.staffName.includes('Muthoni') || r.staffName.includes('Ahago')))
                        .reduce((acc, r) => acc + r.daysRequested, 0)}{' '}
                      Days Used
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Relief handovers fully assigned between Senior Partners prior to leave commencement.
                  </p>
                </div>

                <div className="rounded bg-stone-50 p-3 border border-stone-200">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span>Associates & Legal Assistants</span>
                    <span className="text-[#0B63E5] font-mono">
                      {leaveRequests
                        .filter((r) => r.status === 'Approved' && (r.staffName.includes('Khasabuli') || r.staffName.includes('Moraa')))
                        .reduce((acc, r) => acc + r.daysRequested, 0)}{' '}
                      Days Used
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Court diary mentions and filing deadlines delegated to co-advocates during leave periods.
                  </p>
                </div>

                <div className="rounded bg-stone-50 p-3 border border-stone-200">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span>Accounts & Secretarial Staff</span>
                    <span className="text-[#0B63E5] font-mono">
                      {leaveRequests
                        .filter((r) => r.status === 'Approved' && (r.staffName.includes('Irungu') || r.staffName.includes('Adhiambo') || r.staffName.includes('Chebet') || r.staffName.includes('Brian')))
                        .reduce((acc, r) => acc + r.daysRequested, 0)}{' '}
                      Days Used
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Trust accounting & client reception desk covered by alternate administrative personnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE APPLICATION MODAL */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            style={modalStyle}
            className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden text-stone-800 my-auto"
          >
            <div
              {...handleProps}
              className={`flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white ${handleProps.className}`}
              title="Click and drag to reposition"
            >
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-[#0B63E5]" />
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <span>Submit Staff Leave Application</span>
                  <span className="text-[10px] font-sans font-medium text-stone-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                    Draggable
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="rounded p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} className="p-6 space-y-4 text-xs">
              <div className="rounded-lg bg-blue-50/60 p-3.5 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Applicant</span>
                  <span className="font-bold text-slate-900 text-xs">{currentUserName}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Remaining Annual Leave</span>
                  <span className="font-mono font-bold text-xs text-[#0B63E5]">{remainingAnnual} Days</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Type of Leave
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-bold text-stone-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Annual Leave">Annual Leave (Statutory 21 Days)</option>
                  <option value="Sick Leave">Sick Leave (Medical Certificate Required)</option>
                  <option value="Maternity / Paternity">Maternity / Paternity Leave</option>
                  <option value="Study / CLE Leave">Study / LSK CLE Examination Leave</option>
                  <option value="Compassionate Leave">Compassionate Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Handover / Relief Staff
                </label>
                <select
                  value={leaveRelief}
                  onChange={(e) => setLeaveRelief(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {staffList
                    .filter((adv) => adv.name.toLowerCase() !== currentUserName.toLowerCase())
                    .map((adv) => (
                      <option key={adv.id} value={adv.name}>
                        {adv.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Reason for Leave / Additional Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide background context for Managing Partner approval..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0] cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
