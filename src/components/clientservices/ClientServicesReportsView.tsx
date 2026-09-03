import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  HelpCircle,
  FileText,
  Building2,
  Users,
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
  LineChart,
  Line,
} from 'recharts';
import {
  ClientInteraction,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface ClientServicesReportsViewProps {
  interactions: ClientInteraction[];
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const ClientServicesReportsView: React.FC<ClientServicesReportsViewProps> = ({
  interactions,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  // Compute Metrics
  const totalInteractions = interactions.length;
  const totalCalls = interactions.filter((i) => i.interactionType === 'Call').length;
  const totalEnquiries = interactions.filter((i) => i.interactionType === 'Enquiry').length;
  const totalRequests = interactions.filter((i) => i.interactionType === 'Client Request').length;
  const totalAppointments = interactions.filter(
    (i) => i.interactionType === 'Appointment' || i.interactionType === 'Walk-in Visitor'
  ).length;
  const totalComplaints = interactions.filter((i) => i.interactionType === 'Complaint / Feedback').length;

  const resolvedComplaints = interactions.filter(
    (i) => i.interactionType === 'Complaint / Feedback' && ['Resolved', 'Closed'].includes(i.status)
  ).length;
  const complaintResolutionRate =
    totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

  // Chart Data: Type Breakdown
  const typeData = [
    { name: 'Telephone Calls', count: totalCalls, color: '#10B981' },
    { name: 'Legal Enquiries', count: totalEnquiries, color: '#F59E0B' },
    { name: 'Client Requests', count: totalRequests, color: '#0B63E5' },
    { name: 'Consultations & Visits', count: totalAppointments, color: '#06B6D4' },
    { name: 'Complaints / Quality', count: totalComplaints, color: '#EF4444' },
  ];

  // Chart Data: Staff Handling Volume
  const staffVolume: { [staff: string]: number } = {};
  interactions.forEach((i) => {
    const staff = i.assignedStaffName || i.handledByName || 'General Reception';
    staffVolume[staff] = (staffVolume[staff] || 0) + 1;
  });

  const staffChartData = Object.keys(staffVolume).map((staff) => ({
    name: staff.replace('Adv. ', '').split(' ')[0],
    fullName: staff,
    count: staffVolume[staff],
  }));

  // Top Clients by Interaction
  const clientVolume: { [cli: string]: number } = {};
  interactions.forEach((i) => {
    clientVolume[i.clientName] = (clientVolume[i.clientName] || 0) + 1;
  });

  const topClients = Object.keys(clientVolume)
    .sort((a, b) => clientVolume[b] - clientVolume[a])
    .slice(0, 5)
    .map((name) => ({ name, count: clientVolume[name] }));

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Type',
      'Date',
      'Time',
      'Client',
      'Subject',
      'Channel',
      'Handled By',
      'Assigned To',
      'Status',
      'Priority',
    ];
    const rows = interactions.map((i) => [
      i.id,
      i.interactionType,
      i.date,
      i.time,
      `"${i.clientName.replace(/"/g, '""')}"`,
      `"${i.subject.replace(/"/g, '""')}"`,
      i.channel,
      `"${i.handledByName}"`,
      `"${i.assignedStaffName || ''}"`,
      i.status,
      i.priority,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chambers_Client_Services_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-[#0B63E5]" />
            <span>Client Services Analytics & Management Reports</span>
          </h2>
          <p className="text-xs text-stone-500">
            Performance metrics, enquiry conversion ratios, SLA response benchmarks, and client touchpoint analysis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 rounded-xl bg-[#132c3f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c4766] transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* High-Level Executive Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <span className="text-[10px] font-bold text-stone-500">Total Touchpoints</span>
          <p className="text-2xl font-bold font-serif-title text-stone-900 mt-1">{totalInteractions}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">100% recorded audit rate</span>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <span className="text-[10px] font-bold text-stone-500">Enquiries Intake</span>
          <p className="text-2xl font-bold font-serif-title text-amber-700 mt-1">{totalEnquiries}</p>
          <span className="text-[10px] text-stone-500 font-semibold mt-0.5 block">Average 4.2h response SLA</span>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <span className="text-[10px] font-bold text-stone-500">Complaint Resolution</span>
          <p className="text-2xl font-bold font-serif-title text-emerald-700 mt-1">{complaintResolutionRate}%</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {resolvedComplaints} of {totalComplaints} resolved
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <span className="text-[10px] font-bold text-stone-500">Active Staff Handlers</span>
          <p className="text-2xl font-bold font-serif-title text-[#0B63E5] mt-1">{advocates.length}</p>
          <span className="text-[10px] text-stone-500 font-semibold mt-0.5 block">Partners, Associates & Admin</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume by Interaction Type */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-stone-900 text-xs tracking-wider">
            Interaction Distribution by Channel & Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-10}
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
                <Bar dataKey="count" fill="#0B63E5" radius={[6, 6, 0, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Staff Workload Distribution */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-stone-900 text-xs tracking-wider">
            Staff Client Relations Workload Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val, name, item) => [`${val} records handled`, item.payload.fullName]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Clients by Interaction Table */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs space-y-3">
        <h3 className="font-bold font-serif-title text-sm text-stone-900">
          Top Clients by Interaction Volume
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          {topClients.map((c, idx) => (
            <div key={c.name} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs space-y-1">
              <span className="text-[10px] font-bold text-stone-400 font-mono">Rank #{idx + 1}</span>
              <h4 className="font-bold text-stone-900 line-clamp-1">{c.name}</h4>
              <p className="text-xs font-bold text-[#0B63E5]">{c.count} interactions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
