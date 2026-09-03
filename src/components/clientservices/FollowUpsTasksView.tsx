import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  CheckSquare,
  User,
  Calendar,
  Briefcase,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import {
  ClientInteraction,
  Advocate,
  Client,
  LegalMatter,
  TaskItem,
} from '../../types';

interface FollowUpsTasksViewProps {
  interactions: ClientInteraction[];
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onToggleFollowUpComplete: (interaction: ClientInteraction) => void;
  onCreateTask: (interaction: ClientInteraction) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const FollowUpsTasksView: React.FC<FollowUpsTasksViewProps> = ({
  interactions,
  onSelectInteraction,
  onToggleFollowUpComplete,
  onCreateTask,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [staffFilter, setStaffFilter] = useState('all');

  const todayStr = new Date().toISOString().slice(0, 10);

  // All follow-up items
  const followUpItems = interactions.filter((i) => i.followUpRequired);

  const filteredItems = followUpItems.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.followUpNotes && item.followUpNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStaff =
      staffFilter === 'all' ||
      item.followUpAssignedToId === staffFilter ||
      item.assignedStaffId === staffFilter;

    const isDone = item.followUpStatus === 'Completed';
    const isOverdue = !isDone && item.followUpDueDate && item.followUpDueDate < todayStr;

    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = !isDone;
    else if (statusFilter === 'completed') matchesStatus = isDone;
    else if (statusFilter === 'overdue') matchesStatus = isOverdue;

    return matchesSearch && matchesStaff && matchesStatus;
  });

  const pendingCount = followUpItems.filter((i) => i.followUpStatus !== 'Completed').length;
  const overdueCount = followUpItems.filter(
    (i) => i.followUpStatus !== 'Completed' && i.followUpDueDate && i.followUpDueDate < todayStr
  ).length;
  const completedCount = followUpItems.filter((i) => i.followUpStatus === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>Follow-up Actions & Task Integration</span>
          </h2>
          <p className="text-xs text-stone-500">
            Ensure no client inquiry or callback falls through the cracks with automated deadline tracking
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'border-amber-500 bg-amber-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500">Pending Actions</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-serif-title text-amber-900 mt-1">{pendingCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'overdue'
              ? 'border-rose-500 bg-rose-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500">Overdue Follow-ups</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-serif-title text-rose-700 mt-1">{overdueCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500">Completed Actions</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-serif-title text-emerald-700 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search follow-ups by client, note..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Assigned Staff</option>
              {advocates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="pending">Pending Follow-ups</option>
              <option value="overdue">Overdue Only</option>
              <option value="completed">Completed Follow-ups</option>
              <option value="all">All Follow-ups</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Ref & Type</th>
                <th className="px-4 py-3">Client & Contact</th>
                <th className="px-4 py-3">Follow-up Instructions</th>
                <th className="px-4 py-3">Assigned Owner</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isDone = item.followUpStatus === 'Completed';
                  const isOverdue = !isDone && item.followUpDueDate && item.followUpDueDate < todayStr;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectInteraction(item)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#0B63E5] block text-xs">{item.id}</span>
                        <span className="text-[10px] text-stone-400 font-semibold">
                          {item.interactionType}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <strong className="text-stone-900 block font-semibold text-xs">{item.clientName}</strong>
                        {item.phoneNumber && (
                          <span className="text-[10px] text-stone-400 font-mono block">{item.phoneNumber}</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <strong className="text-stone-900 block line-clamp-1">{item.subject}</strong>
                        <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 font-medium">
                          {item.followUpNotes || item.actionRequired || item.description}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <strong className="text-stone-900 block font-medium">
                          {item.followUpAssignedToName || item.assignedStaffName}
                        </strong>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1 font-mono">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          <span
                            className={`text-xs font-bold ${
                              isOverdue ? 'text-rose-600' : isDone ? 'text-stone-400 line-through' : 'text-stone-800'
                            }`}
                          >
                            {item.followUpDueDate || 'Immediate'}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 block mt-0.5">OVERDUE</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDone ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFollowUpComplete(item);
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isDone ? 'Reopen' : 'Mark Done'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateTask(item);
                            }}
                            className="rounded-lg bg-blue-50 text-[#0B63E5] hover:bg-blue-100 border border-blue-200 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                            title="Sync as Task"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-semibold text-stone-600">No follow-up action items found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
