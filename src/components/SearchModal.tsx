import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Briefcase, Users, UserCheck, ChevronRight, Filter, Tag, RotateCcw } from 'lucide-react';
import { LegalMatter, PracticeArea, Client, Advocate } from '../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../utils/staffStorage';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMatter: (matter: LegalMatter) => void;
  matters?: LegalMatter[];
  clients?: Client[];
  advocates?: Advocate[];
}

const CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Categories', value: 'All' },
  { label: 'Succession Law', value: 'Succession Law' },
  { label: 'Conveyancing Law', value: 'Conveyancing Law' },
  { label: 'Commercial Law', value: 'Commercial Law' },
  { label: 'Civil Litigation', value: 'Civil Litigation' },
  { label: 'Bank Securities', value: 'Bank Securities' },
  { label: 'Constitutional & Tax', value: 'Constitutional & Tax' },
  { label: 'Employment & Labour', value: 'Employment & Labour' },
  { label: 'Intellectual Property', value: 'Intellectual Property' },
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMatter,
  matters = [],
  clients = [],
  advocates = [],
}) => {
  const staffList = (advocates.length > 0 ? advocates : loadVisibleStaffRoster()).filter(
    (a) => !isSysAdminUser(a)
  );
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Extract all unique tags across matters
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    matters.forEach((m) => {
      if (m.tags) {
        m.tags.forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet).sort();
  }, [matters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedTag('All');
  };

  const matchingMatters = matters.filter((m) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.referenceNumber.toLowerCase().includes(q) ||
      m.clientName.toLowerCase().includes(q) ||
      m.courtCaseNumber?.toLowerCase().includes(q) ||
      m.ctsFilingId?.toLowerCase().includes(q) ||
      m.practiceArea.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.tags?.some((t) => t.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'All' ||
      m.practiceArea === selectedCategory ||
      (selectedCategory === 'Succession' && m.practiceArea === 'Succession Law') ||
      (selectedCategory === 'Conveyancing' && m.practiceArea === 'Conveyancing Law');

    const matchesTag =
      selectedTag === 'All' || (m.tags && m.tags.includes(selectedTag));

    return matchesQuery && matchesCategory && matchesTag;
  });

  const matchingClients = clients.filter((c) => {
    const q = query.toLowerCase();
    if (!q && (selectedCategory !== 'All' || selectedTag !== 'All')) return false;
    return (
      c.name.toLowerCase().includes(q) ||
      c.kraPin.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q)
    );
  });

  const matchingAdvocates = staffList.filter((a) => {
    const q = query.toLowerCase();
    if (!q && (selectedCategory !== 'All' || selectedTag !== 'All')) return false;
    return (
      a.name.toLowerCase().includes(q) ||
      a.practiceArea.toLowerCase().includes(q)
    );
  });

  const isFiltered = selectedCategory !== 'All' || selectedTag !== 'All' || query !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Input Bar */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
          <Search className="h-4 w-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search matters, clients, Advocates, tags (e.g. Urgent, High Value)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 mr-2 shadow-2xs">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Specific Matter Category & Tag Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center space-x-1.5 bg-white rounded-lg border border-slate-200 px-2.5 py-1 shadow-2xs">
              <Filter className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] font-medium text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 text-xs focus:outline-none cursor-pointer pr-1"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center space-x-1.5 bg-white rounded-lg border border-slate-200 px-2.5 py-1 shadow-2xs">
              <Tag className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-[11px] font-medium text-slate-500">Tag:</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Quick Category Chips for Fast Filtering */}
        <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-400 font-semibold text-[9px] shrink-0">Quick Filter:</span>
          {['All', 'Succession Law', 'Conveyancing Law', 'Commercial Law', 'Civil Litigation', 'Bank Securities'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat === 'All' ? 'All' : cat.replace(' Law', '')}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Legal Matters Section */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-wider mb-2">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                <span>Legal Matters ({matchingMatters.length})</span>
              </div>
              {selectedCategory !== 'All' && (
                <span className="text-blue-600 font-semibold lowercase">
                  filtered by: {selectedCategory}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {matchingMatters.length === 0 ? (
                <div className="py-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                  <p className="text-slate-600 font-semibold text-xs">No matching legal matters found</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Try adjusting your category filter or tag criteria
                  </p>
                </div>
              ) : (
                matchingMatters.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMatter(m);
                      onClose();
                    }}
                    className="group flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-blue-50/40 hover:border-blue-300 cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {m.referenceNumber}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-700">
                          {m.practiceArea}
                        </span>
                        {m.priority === 'High' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                            High Priority
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 text-xs transition-colors">
                        {m.title}
                      </p>

                      <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <span>Client: <strong className="text-slate-700 font-medium">{m.clientName}</strong></span>
                        {m.courtCaseNumber && <span>• {m.courtCaseNumber}</span>}
                      </p>

                      {/* Tags */}
                      {m.tags && m.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {m.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(tag);
                              }}
                              className={`text-[9px] font-medium px-1.5 py-0.2 rounded cursor-pointer transition-colors ${
                                selectedTag === tag
                                  ? 'bg-amber-600 text-white font-bold'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clients Section */}
          {matchingClients.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 tracking-wider mb-2">
                <Users className="h-3.5 w-3.5 text-teal-600" />
                <span>Clients & Corporations ({matchingClients.length})</span>
              </div>
              <div className="space-y-1">
                {matchingClients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-500">
                        KRA PIN: <span className="font-mono font-medium text-slate-700">{c.kraPin}</span> • {c.industry}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {c.retainerStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advocates Section */}
          {matchingAdvocates.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 tracking-wider mb-2">
                <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                <span>Firm Workspace Advocates ({matchingAdvocates.length})</span>
              </div>
              <div className="space-y-1">
                {matchingAdvocates.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center space-x-3 p-2 rounded-lg border border-slate-200/80 bg-white"
                  >
                    <img src={a.avatar} alt={a.name} className="h-7 w-7 rounded-full object-cover border border-slate-200" />
                    <div>
                      <p className="font-semibold text-slate-900">{a.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {a.practiceArea || 'Staff Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

