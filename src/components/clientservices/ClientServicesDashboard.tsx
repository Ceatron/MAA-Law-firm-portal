import React from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  HelpCircle,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Briefcase,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  ClientInteraction,
  ClientInteractionType,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface ClientServicesDashboardProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (type: ClientInteractionType) => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onNavigateTab: (tab: string) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const ClientServicesDashboard: React.FC<ClientServicesDashboardProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onNavigateTab,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute KPI metrics
  const callsToday = interactions.filter((i) => i.interactionType === 'Call' && i.date === todayStr).length;
  const totalCalls = interactions.filter((i) => i.interactionType === 'Call').length;
  const openEnquiries = interactions.filter(
    (i) => i.interactionType === 'Enquiry' && !['Resolved', 'Closed', 'Cancelled'].includes(i.status)
  ).length;
  const pendingRequests = interactions.filter(
    (i) => i.interactionType === 'Client Request' && !['Resolved', 'Closed', 'Cancelled'].includes(i.status)
  ).length;
  const followUpsDue = interactions.filter(
    (i) => i.followUpRequired && i.followUpStatus !== 'Completed' && (i.followUpDueDate === todayStr || (i.followUpDueDate && i.followUpDueDate < todayStr))
  ).length;
  const overdueFollowUps = interactions.filter(
    (i) => i.followUpRequired && i.followUpStatus !== 'Completed' && i.followUpDueDate && i.followUpDueDate < todayStr
  ).length;
  const appointmentsToday = interactions.filter(
    (i) => (i.interactionType === 'Appointment' || i.interactionType === 'Walk-in Visitor') && i.date === todayStr
  ).length;
  const openComplaints = interactions.filter(
    (i) => i.interactionType === 'Complaint / Feedback' && !['Resolved', 'Closed', 'Cancelled'].includes(i.status)
  ).length;

  // Chart Data: Interactions by Category
  const categoryCounts: { [key: string]: number } = {};
  interactions.forEach((i) => {
    categoryCounts[i.interactionType] = (categoryCounts[i.interactionType] || 0) + 1;
  });

  const categoryChartData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    count: categoryCounts[cat],
  }));

  const PIE_COLORS = ['#0B63E5', '#0284C7', '#D97706', '#10B981', '#E11D48', '#8B5CF6', '#64748B'];

  // Chart Data: Enquiries by Category
  const enquiryCats: { [key: string]: number } = {};
  interactions
    .filter((i) => i.interactionType === 'Enquiry' && i.enquiryCategory)
    .forEach((i) => {
      const cat = i.enquiryCategory || 'General Enquiry';
      enquiryCats[cat] = (enquiryCats[cat] || 0) + 1;
    });

  const enquiryChartData = Object.keys(enquiryCats).map((k) => ({
    name: k.replace('Enquiry', '').trim(),
    value: enquiryCats[k],
  }));

  // Chart Data: Staff Handling Distribution
  const staffCounts: { [key: string]: number } = {};
  interactions.forEach((i) => {
    const staff = i.assignedStaffName || i.handledByName || 'General Staff';
    staffCounts[staff] = (staffCounts[staff] || 0) + 1;
  });
  const staffChartData = Object.keys(staffCounts)
    .slice(0, 5)
    .map((staff) => ({
      name: staff.replace('Adv. ', '').split(' ')[0],
      fullName: staff,
      interactions: staffCounts[staff],
    }));

  // Immediate Action Items (Follow-ups due / overdue + urgent items)
  const urgentQueue = interactions
    .filter(
      (i) =>
        (i.priority === 'Urgent' && !['Resolved', 'Closed'].includes(i.status)) ||
        (i.followUpRequired && i.followUpStatus !== 'Completed')
    )
    .slice(0, 5);

  // Recent stream
  const recentInteractions = [...interactions]
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="rounded-2xl bg-gradient-to-r from-[#132c3f] via-[#1c4766] to-[#0B63E5] p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 border border-white/15 backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Front Desk & Client Relations Operations</span>
            </div>
            <h1 className="text-2xl font-bold font-serif-title tracking-tight text-white">
              Client Services & Interaction Center
            </h1>
            <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
              Centralized register for telephone calls, prospective client enquiries, routine case updates,
              reception consultations, client requests, and quality feedback across chambers.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenNewModal('Call')}
              className="flex items-center space-x-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Phone className="h-4 w-4 text-emerald-400" />
              <span>Log Call</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewModal('Enquiry')}
              className="flex items-center space-x-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <span>New Enquiry</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewModal('Client Request')}
              className="flex items-center space-x-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <FileText className="h-4 w-4 text-blue-300" />
              <span>Log Request</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewModal('Appointment')}
              className="flex items-center space-x-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Calendar className="h-4 w-4 text-cyan-300" />
              <span>Book Appointment</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewModal('Walk-in Visitor')}
              className="flex items-center space-x-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Building2 className="h-4 w-4 text-purple-300" />
              <span>Visitor Check-in</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewModal('Complaint / Feedback')}
              className="flex items-center space-x-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 border border-rose-400/40 px-3.5 py-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <AlertTriangle className="h-4 w-4 text-rose-300" />
              <span>Log Complaint</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Calls Card */}
        <div
          onClick={() => onNavigateTab('calls')}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-[#0B63E5]/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-500">Calls Today</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-serif-title text-stone-900">{callsToday}</span>
            <span className="text-[11px] text-stone-400">({totalCalls} total)</span>
          </div>
          <span className="mt-1 flex items-center text-[10px] font-semibold text-emerald-600">
            <span>View call logs</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>

        {/* Open Enquiries Card */}
        <div
          onClick={() => onNavigateTab('enquiries')}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-500">Open Enquiries</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-serif-title text-stone-900">{openEnquiries}</span>
            <span className="text-[10px] text-amber-700 font-medium">Pending intake</span>
          </div>
          <span className="mt-1 flex items-center text-[10px] font-semibold text-amber-700">
            <span>Enquiry pipeline</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>

        {/* Client Requests Card */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-500">Pending Requests</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#0B63E5] flex items-center justify-center group-hover:bg-[#0B63E5] group-hover:text-white transition-colors">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-serif-title text-stone-900">{pendingRequests}</span>
            <span className="text-[10px] text-blue-700 font-medium">In workflow</span>
          </div>
          <span className="mt-1 flex items-center text-[10px] font-semibold text-[#0B63E5]">
            <span>Manage requests</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>

        {/* Follow-ups Due Card */}
        <div
          onClick={() => onNavigateTab('followups')}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-500">Follow-ups Due</span>
            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-serif-title text-stone-900">{followUpsDue}</span>
            {overdueFollowUps > 0 && (
              <span className="text-[10px] font-bold text-rose-600">({overdueFollowUps} overdue)</span>
            )}
          </div>
          <span className="mt-1 flex items-center text-[10px] font-semibold text-orange-700">
            <span>Action queue</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>

        {/* Appointments Today */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-500">Today's Visits</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-700 group-hover:text-white transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-serif-title text-stone-900">{appointmentsToday}</span>
            <span className="text-[10px] text-cyan-800 font-medium">In chambers</span>
          </div>
          <span className="mt-1 flex items-center text-[10px] font-semibold text-cyan-800">
            <span>Reception calendar</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>

        {/* Open Complaints */}
        <div
          onClick={() => onNavigateTab('complaints')}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-500">Complaints</span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                openComplaints > 0
                  ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-700 group-hover:text-white'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-serif-title text-stone-900">{openComplaints}</span>
            <span className="text-[10px] text-rose-700 font-medium">Unresolved</span>
          </div>
          <span className="mt-1 flex items-center text-[10px] font-semibold text-rose-700">
            <span>QA registry</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Main Grid: Charts & Action Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Visual Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Interaction Distribution by Type */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-xs tracking-wider flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-[#0B63E5]" />
                  <span>Client Interactions by Category</span>
                </h3>
                <p className="text-[11px] text-stone-400">Total volume recorded across all channels</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-semibold text-[#0B63E5] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Full Reports</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" fill="#0B63E5" radius={[6, 6, 0, 0]} name="Interactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Staff Workload Distribution */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-xs tracking-wider flex items-center space-x-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span>Client Services Handling by Staff</span>
                </h3>
                <p className="text-[11px] text-stone-400">Assigned advocates and administrative officers</p>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={staffChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val, name, item) => [`${val} interactions`, item.payload.fullName]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="interactions" fill="#D97706" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Urgent Action Queue & Activity Stream */}
        <div className="space-y-6">
          {/* Urgent / Due Follow-up Queue */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="font-bold text-amber-900 text-xs tracking-wider">
                  Follow-ups & Due Actions ({urgentQueue.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('followups')}
                className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {urgentQueue.length > 0 ? (
                urgentQueue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectInteraction(item)}
                    className="p-3 rounded-xl border border-stone-200 bg-white hover:border-[#0B63E5] hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-amber-800">{item.id}</span>
                      <span
                        className={`font-semibold px-2 py-0.2 rounded-full ${
                          item.followUpDueDate && item.followUpDueDate < todayStr
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.followUpDueDate ? `Due: ${item.followUpDueDate}` : 'Priority Action'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 mt-1 line-clamp-1 group-hover:text-[#0B63E5]">
                      {item.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                      <span className="truncate max-w-[140px] font-medium text-stone-700">{item.clientName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {item.followUpAssignedToName || item.assignedStaffName}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-stone-400">
                  <CheckCircle2 className="h-7 w-7 mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs font-medium text-stone-600">All follow-ups up to date!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Reception Visitor Log Summary */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-[#0B63E5]" />
                <h3 className="font-bold text-stone-900 text-xs tracking-wider">
                  Front Desk Quick Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('visitors')}
                className="text-[11px] font-semibold text-[#0B63E5] hover:underline cursor-pointer"
              >
                Visitor Log
              </button>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-stone-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Reception Duty Officer:</span>
                <strong className="text-stone-900">Faith Chebet</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Main Chambers Line:</span>
                <span className="font-mono font-semibold text-[#0B63E5]">+254 20 221 4400</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Direct WhatsApp Line:</span>
                <span className="font-mono font-semibold text-emerald-600">+254 722 410 890</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Client Interactions Live Stream Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div>
            <h3 className="font-bold font-serif-title text-sm text-stone-900">
              Recent Client Interactions Stream
            </h3>
            <p className="text-xs text-stone-500">Latest communications recorded across all chambers desks</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('timeline')}
            className="flex items-center space-x-1 text-xs font-semibold text-[#0B63E5] hover:underline cursor-pointer"
          >
            <span>Complete Client Timeline</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Ref ID & Type</th>
                <th className="px-4 py-3">Client / Contact</th>
                <th className="px-4 py-3">Subject & Summary</th>
                <th className="px-4 py-3">Channel & Time</th>
                <th className="px-4 py-3">Handled By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentInteractions.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectInteraction(item)}
                  className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-mono font-bold text-stone-900 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#0B63E5]">{item.id}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.interactionType === 'Call'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.interactionType === 'Enquiry'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : item.interactionType === 'Complaint / Feedback'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.interactionType}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <strong className="text-stone-900 block font-medium line-clamp-1">{item.clientName}</strong>
                    {item.phoneNumber && (
                      <span className="text-[10px] text-stone-400 font-mono block">{item.phoneNumber}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    <strong className="text-stone-900 block line-clamp-1">{item.subject}</strong>
                    <span className="text-[11px] text-stone-500 line-clamp-1">{item.description}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-stone-800 block">{item.channel}</span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {item.date} {item.time}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-stone-900 block">{item.handledByName}</span>
                    <span className="text-[10px] text-stone-400">Assigned: {item.assignedStaffName}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Resolved' || item.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'Action Required'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectInteraction(item);
                      }}
                      className="rounded-lg bg-stone-100 hover:bg-[#0B63E5] hover:text-white px-3 py-1 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
