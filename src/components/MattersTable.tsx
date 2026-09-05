import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  Building2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Folder,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { LegalMatter, MatterStatus, Advocate, MatterPriority } from '../types';
import { mockAdvocates } from '../data/mockData';
import { isMatterVisibleToUser, canUserViewAll } from '../utils/visibilityRules';
import { isSysAdminUser } from '../utils/staffStorage';

interface MattersTableProps {
  matters: LegalMatter[];
  onSelectMatter: (matter: LegalMatter) => void;
  onOpenNewMatter: () => void;
  onUpdateMatterTags?: (matterId: string, tags: string[]) => void;
  onEditMatter?: (matter: LegalMatter) => void;
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  allAdvocates?: Advocate[];
  isArchivedView?: boolean;
  onTriggerExport?: () => void;
  onDeleteMatter?: (matterId: string) => void;
}

export const MattersTable: React.FC<MattersTableProps> = ({
  matters,
  onSelectMatter,
  onOpenNewMatter,
  onUpdateMatterTags,
  onEditMatter,
  currentAdvocate,
  isManagingAdvocate = true,
  allAdvocates = mockAdvocates,
  isArchivedView = false,
  onDeleteMatter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('All');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('All');
  
  // Toggle states
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showMorePracticeAreas, setShowMorePracticeAreas] = useState(false);
  const [matterToDelete, setMatterToDelete] = useState<LegalMatter | null>(null);

  const isSysAdmin = isSysAdminUser(currentAdvocate);
  const isManagingUser =
    isSysAdmin ||
    Boolean(isManagingAdvocate) ||
    currentAdvocate?.role === 'Managing Advocate' ||
    currentAdvocate?.id === 'adv-1' ||
    Boolean(currentAdvocate?.title?.toLowerCase().includes('managing'));
  const canDeleteMatter = isSysAdmin || isManagingUser;

  // Top 4 practice areas as shown in screenshot + remaining areas
  const primaryPracticeAreas = [
    { label: 'All', value: 'All' },
    { label: 'Succession', value: 'Succession' },
    { label: 'Conveyancing', value: 'Conveyancing' },
    { label: 'Commercial', value: 'Commercial' },
    { label: 'Civil litigation', value: 'Civil Litigation' },
  ];

  const secondaryPracticeAreas = [
    { label: 'Bank Securities', value: 'Bank Securities' },
    { label: 'Constitutional & Tax', value: 'Constitutional & Tax' },
    { label: 'Employment & Labour', value: 'Employment & Labour' },
    { label: 'Intellectual Property', value: 'Intellectual Property' },
  ];

  // Base matters based on role permission (Managing Advocate & System Admin see ALL matters)
  const effectiveCanViewAll = isManagingAdvocate || canUserViewAll(currentAdvocate);

  const scopedMatters = effectiveCanViewAll
    ? matters
    : matters.filter((m) => isMatterVisibleToUser(m, currentAdvocate));

  // Filter count for badge
  const activeDropdownFiltersCount = [
    selectedStatus !== 'All',
    selectedPriority !== 'All',
    selectedPurpose !== 'All',
    effectiveCanViewAll && selectedStaffFilter !== 'All',
  ].filter(Boolean).length;

  const filteredMatters = scopedMatters.filter((m) => {
    const matchesSearch =
      !searchTerm.trim() ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.responsibleAdvocateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.courtDatePurpose && m.courtDatePurpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.nextDeadlineDescription && m.nextDeadlineDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.nextDeadlineDate && m.nextDeadlineDate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.nextCourtDate && m.nextCourtDate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesArea =
      selectedPracticeArea === 'All' ||
      m.practiceArea.toLowerCase().includes(selectedPracticeArea.toLowerCase()) ||
      selectedPracticeArea.toLowerCase().includes(m.practiceArea.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' || m.status === selectedStatus;

    const matchesPriority =
      selectedPriority === 'All' || m.priority === selectedPriority;

    const matchesPurpose =
      selectedPurpose === 'All' ||
      (m.courtDatePurpose && m.courtDatePurpose.toLowerCase() === selectedPurpose.toLowerCase()) ||
      (m.nextDeadlineDescription && m.nextDeadlineDescription.toLowerCase().includes(selectedPurpose.toLowerCase()));

    const matchesStaff =
      !isManagingAdvocate ||
      selectedStaffFilter === 'All' ||
      m.responsibleAdvocateId === selectedStaffFilter ||
      m.responsibleAdvocateName.toLowerCase().includes(selectedStaffFilter.toLowerCase());

    return matchesSearch && matchesArea && matchesStatus && matchesPriority && matchesPurpose && matchesStaff;
  });

  const getStatusBadgeStyle = (status: MatterStatus) => {
    switch (status) {
      case 'Active - In Court':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Filing Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Interlocutory':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Settlement Negotiation':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Completed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Archived':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadgeConfig = (priority: MatterPriority | string) => {
    switch (priority) {
      case 'High':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
          dot: 'bg-rose-500',
          icon: AlertTriangle,
          label: 'High Priority',
        };
      case 'Medium':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
          dot: 'bg-amber-500',
          icon: Clock,
          label: 'Medium',
        };
      case 'Low':
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Low',
        };
    }
  };

  const getCourtPurposeBadgeConfig = (purpose?: string, description?: string) => {
    const raw = (purpose || '').trim();
    const desc = (description || '').toLowerCase();

    // If explicit purpose given
    if (raw) {
      const lower = raw.toLowerCase();
      if (lower.includes('mention')) {
        return { label: raw, badge: 'bg-sky-50 text-sky-800 border-sky-200 font-medium' };
      }
      if (lower.includes('hearing')) {
        return { label: raw, badge: 'bg-amber-50 text-amber-800 border-amber-200 font-medium' };
      }
      if (lower.includes('ruling')) {
        return { label: raw, badge: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-medium' };
      }
      if (lower.includes('judgement') || lower.includes('judgment')) {
        return { label: raw, badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' };
      }
      if (lower.includes('direction')) {
        return { label: raw, badge: 'bg-purple-50 text-purple-800 border-purple-200 font-medium' };
      }
      if (lower.includes('compliance')) {
        return { label: raw, badge: 'bg-teal-50 text-teal-800 border-teal-200 font-medium' };
      }
      return { label: raw, badge: 'bg-slate-100 text-slate-700 border-slate-200 font-medium' };
    }

    // Fallback: derive purpose from nextDeadlineDescription
    if (desc.includes('mention')) {
      return { label: 'Mention', badge: 'bg-sky-50 text-sky-800 border-sky-200 font-medium' };
    }
    if (desc.includes('hearing') || desc.includes('trial')) {
      return { label: 'Hearing', badge: 'bg-amber-50 text-amber-800 border-amber-200 font-medium' };
    }
    if (desc.includes('ruling')) {
      return { label: 'Ruling', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-medium' };
    }
    if (desc.includes('judgement') || desc.includes('judgment')) {
      return { label: 'Judgement', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' };
    }
    if (desc.includes('direction')) {
      return { label: 'Directions', badge: 'bg-purple-50 text-purple-800 border-purple-200 font-medium' };
    }
    if (desc.includes('compliance') || desc.includes('valuation') || desc.includes('filing')) {
      return { label: 'Compliance', badge: 'bg-teal-50 text-teal-800 border-teal-200 font-medium' };
    }

    return { label: '—', badge: 'text-slate-400' };
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedPracticeArea('All');
    setSelectedStatus('All');
    setSelectedPriority('All');
    setSelectedPurpose('All');
    setSelectedStaffFilter('All');
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Top Card Header */}
      <div className="p-6 pb-4 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-bold text-slate-900">
              {isArchivedView ? 'Archived Register' : 'Register'}
            </h2>
            <span className="text-xs text-slate-400 font-normal">
              {filteredMatters.length} {isManagingAdvocate ? 'firm-wide' : 'assigned'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {isArchivedView
              ? 'Archived and closed case files preserved for statutory compliance.'
              : 'Search, filter, or register a new file below.'}
          </p>
        </div>

        {/* Practice Area Filter Pills: Top 4 + "+4 more" toggle */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {primaryPracticeAreas.map((area) => (
            <button
              key={area.label}
              type="button"
              onClick={() => setSelectedPracticeArea(area.value)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition cursor-pointer ${
                selectedPracticeArea === area.value || (area.value === 'All' && selectedPracticeArea === 'All')
                  ? 'bg-[#121c2b] text-white font-semibold shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {area.label}
            </button>
          ))}

          {/* Secondary practice areas when expanded */}
          {showMorePracticeAreas && (
            <>
              {secondaryPracticeAreas.map((area) => (
                <button
                  key={area.label}
                  type="button"
                  onClick={() => setSelectedPracticeArea(area.value)}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition cursor-pointer animate-in fade-in duration-150 ${
                    selectedPracticeArea === area.value
                      ? 'bg-[#121c2b] text-white font-semibold shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </>
          )}

          {/* +4 more / Show less Toggle Pill */}
          <button
            type="button"
            onClick={() => setShowMorePracticeAreas(!showMorePracticeAreas)}
            className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
          >
            <span>{showMorePracticeAreas ? 'Show less' : '+4 more'}</span>
          </button>
        </div>

        {/* Search Bar + Filters Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, ref no., client, or advocate"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium shadow-2xs transition cursor-pointer shrink-0 ${
              isFiltersOpen || activeDropdownFiltersCount > 0
                ? 'bg-slate-50 border-slate-300 text-slate-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Filters</span>
            {activeDropdownFiltersCount > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-900 px-1.5 py-0.2 text-[10px] text-white">
                {activeDropdownFiltersCount}
              </span>
            )}
            {isFiltersOpen ? (
              <ChevronUp className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            )}
          </button>
        </div>

        {/* Collapsible Dropdown Filters Panel */}
        {isFiltersOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Managing Advocate Staff Filter */}
              {isManagingAdvocate ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Lead Advocate
                  </label>
                  <select
                    value={selectedStaffFilter}
                    onChange={(e) => setSelectedStaffFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="All">All Advocates ({allAdvocates.length})</option>
                    {allAdvocates.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Scope
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                    {currentAdvocate?.name || 'Assigned Matters'}
                  </div>
                </div>
              )}

              {/* Purpose Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Court Purpose
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="All">All Purposes</option>
                  <option value="Mention">Mention</option>
                  <option value="Hearing">Hearing</option>
                  <option value="Ruling">Ruling</option>
                  <option value="Judgement">Judgement</option>
                  <option value="Directions">Directions</option>
                  <option value="Compliance">Compliance</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low / Routine</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active - In Court">Active - In Court</option>
                  <option value="Filing Pending">Filing Pending</option>
                  <option value="Interlocutory">Interlocutory</option>
                  <option value="Settlement Negotiation">Settlement Negotiation</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {(activeDropdownFiltersCount > 0 || searchTerm || selectedPracticeArea !== 'All') && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Filters applied: {activeDropdownFiltersCount + (searchTerm ? 1 : 0) + (selectedPracticeArea !== 'All' ? 1 : 0)}
                </span>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proper Semantic Table with horizontal scroll container to guarantee no wrapping or clutter */}
      <div className="overflow-x-auto">
        {filteredMatters.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              {/* Yellow folder box icon matching design */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#b45309] border border-[#fde68a] shadow-2xs mb-3.5">
                <Folder className="h-6 w-6 fill-[#fde68a] stroke-[#92400e] stroke-[1.75]" />
              </div>

              <h3 className="font-heading text-base font-bold text-slate-900">
                {matters.length === 0
                  ? isArchivedView
                    ? 'No archived matters'
                    : 'No active matters or cases'
                  : 'No matching legal matters'}
              </h3>

              <p className="mt-1 text-xs text-slate-500 text-center leading-relaxed">
                {matters.length === 0
                  ? isArchivedView
                    ? 'The archived matters register is currently empty.'
                    : 'The firm workspace register is empty. Register your first case or dispute file to start tracking it here.'
                  : 'No matters match your selected filter criteria. Try adjusting or clearing search filters.'}
              </p>

              {matters.length === 0 ? (
                <button
                  type="button"
                  onClick={onOpenNewMatter}
                  className="mt-4 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Register new matter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-3 text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1040px]">
            <thead>
              <tr className="border-t border-b border-slate-100 bg-slate-50/50 text-[11px] font-medium text-slate-400 select-none">
                <th className="py-2.5 px-6 font-medium text-left">Matter reference & title</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Priority</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Client</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Practice area</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Lead advocate</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Next Court Date</th>
                <th className="py-2.5 px-3 font-medium text-left whitespace-nowrap">Purpose</th>
                <th className="py-2.5 px-6 font-medium text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMatters.map((matter) => {
                const priorityConfig = getPriorityBadgeConfig(matter.priority);
                const PriorityIcon = priorityConfig.icon;
                const purposeConfig = getCourtPurposeBadgeConfig(matter.courtDatePurpose, matter.nextDeadlineDescription);

                return (
                  <tr
                    key={matter.id}
                    onClick={() => onSelectMatter(matter)}
                    className="group cursor-pointer transition hover:bg-slate-50/70"
                  >
                    {/* Reference, Title & Pill Tags */}
                    <td className="py-3 px-6 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                          {matter.referenceNumber}
                        </span>
                        {matter.courtCaseNumber && (
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]" title={matter.courtCaseNumber}>
                            {matter.courtCaseNumber}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-semibold text-slate-900 group-hover:text-amber-800 transition truncate" title={matter.title}>
                        {matter.title}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] ${priorityConfig.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${priorityConfig.dot}`}
                        />
                        <PriorityIcon className="h-2.5 w-2.5 shrink-0" />
                        <span className="whitespace-nowrap">{priorityConfig.label}</span>
                      </span>
                    </td>

                    {/* Client */}
                    <td className="py-3 px-3 max-w-[160px] align-middle">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate" title={matter.clientName}>
                        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{matter.clientName}</span>
                      </div>
                    </td>

                    {/* Practice Area */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {matter.practiceArea}
                      </span>
                    </td>

                    {/* Lead Advocate */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <span className="text-slate-800 font-medium">
                        {matter.responsibleAdvocateName}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeStyle(
                           matter.status
                        )}`}
                      >
                        {matter.status}
                      </span>
                    </td>

                    {/* Next Court Date */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1 text-slate-700 text-[11px] font-medium">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{matter.nextCourtDate || matter.nextDeadlineDate || '—'}</span>
                      </div>
                    </td>

                    {/* Purpose of Date */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      {purposeConfig.label !== '—' ? (
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] ${purposeConfig.badge}`}
                          title={matter.nextDeadlineDescription || purposeConfig.label}
                        >
                          {purposeConfig.label}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-6 text-right whitespace-nowrap align-middle">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {onEditMatter && (
                          <button
                            id={`matter-table-edit-${matter.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditMatter(matter);
                            }}
                            title="Edit matter details"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold transition cursor-pointer shadow-2xs text-[11px]"
                          >
                            <Edit className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canDeleteMatter && onDeleteMatter && (
                          <button
                            id={`matter-table-delete-${matter.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMatterToDelete(matter);
                            }}
                            title="Delete matter (System Admin & Managing Advocate only)"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/70 px-2 py-1 text-rose-700 hover:bg-rose-100 font-semibold transition cursor-pointer shadow-2xs text-[11px]"
                          >
                            <Trash2 className="h-3 w-3 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        )}
                        <button
                          id={`matter-table-open-${matter.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMatter(matter);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 font-semibold transition cursor-pointer shadow-2xs text-[11px]"
                        >
                          <span>Open</span>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info if matters exist */}
      {filteredMatters.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
          <span>Showing {filteredMatters.length} of {matters.length} legal matters</span>
          <button
            type="button"
            onClick={onOpenNewMatter}
            className="text-amber-800 font-semibold hover:underline cursor-pointer"
          >
            + Register new matter
          </button>
        </div>
      )}

      {/* Delete Matter Confirmation Modal */}
      {matterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-slate-900 text-base">
                  Delete Legal Matter
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Action restricted to System Admin & Managing Advocate
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">
                Are you sure you want to delete this matter?
              </p>
              <p className="font-mono text-slate-600">
                {matterToDelete.referenceNumber} — {matterToDelete.title}
              </p>
              <p className="text-[11px] text-rose-800">
                Client: {matterToDelete.clientName}
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This action will permanently delete the matter record from the firm workspace and cloud storage. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMatterToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-table-delete-matter"
                onClick={() => {
                  if (onDeleteMatter && matterToDelete) {
                    onDeleteMatter(matterToDelete.id);
                  }
                  setMatterToDelete(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
              >
                Yes, Delete Matter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
