import React, { useState } from 'react';
import {
  Gavel,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  X,
  CheckCircle2,
  Filter,
  Search,
} from 'lucide-react';
import { DeadlineItem, LegalMatter, Advocate } from '../../types';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';

interface CalendarViewProps {
  deadlines?: DeadlineItem[];
  onAddDeadline?: (deadline: DeadlineItem) => void;
  matters?: LegalMatter[];
  currentAdvocate?: Advocate;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  deadlines = [],
  onAddDeadline,
  matters = [],
  currentAdvocate,
}) => {
  const staffList = loadVisibleStaffRoster();
  const [selectedForum, setSelectedForum] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New hearing form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Hearing' | 'Mention' | 'Ruling' | 'Judgment' | 'Filing' | 'Case Conference'>('Hearing');
  const [newMatterRef, setNewMatterRef] = useState(matters[0]?.referenceNumber || '');
  const [newMatterTitle, setNewMatterTitle] = useState(matters[0]?.title || '');
  const [newCourtLocation, setNewCourtLocation] = useState('Milimani Law Courts - Court 4');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newAdvocateName, setNewAdvocateName] = useState(currentAdvocate?.name || staffList[0]?.name || 'Advocate');
  const [newPresidingJudge, setNewPresidingJudge] = useState('Hon. Justice Majanja');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMatterSelect = (matterRef: string) => {
    setNewMatterRef(matterRef);
    const selected = matters.find((m) => m.referenceNumber === matterRef);
    if (selected) {
      setNewMatterTitle(selected.title);
      if (selected.courtRegistry) {
        setNewCourtLocation(selected.courtRegistry);
      }
      if (selected.responsibleAdvocateName) {
        setNewAdvocateName(selected.responsibleAdvocateName);
      }
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const selectedMatter = matters.find((m) => m.referenceNumber === newMatterRef);

    const newDeadline: DeadlineItem = {
      id: `dl-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      matterId: selectedMatter?.id || `m-gen-${Date.now()}`,
      matterRef: newMatterRef || 'FIRM-GENERAL',
      matterTitle: newMatterTitle || newTitle.trim(),
      courtLocation: newCourtLocation,
      dueDate: newDueDate,
      time: newTime,
      advocateName: newAdvocateName,
      presidingJudge: newPresidingJudge,
      completed: false,
      priority: 'High',
    };

    if (onAddDeadline) {
      onAddDeadline(newDeadline);
    }

    setIsScheduleModalOpen(false);
    setNewTitle('');
    showToast(`Hearing scheduled for ${newDueDate} at ${newCourtLocation}`);
  };

  const filteredDeadlines = deadlines.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.matterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.matterRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courtLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.advocateName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesForum =
      selectedForum === 'All' ||
      (selectedForum === 'Hearings' && item.category === 'Hearing') ||
      (selectedForum === 'Mentions' && item.category === 'Mention') ||
      (selectedForum === 'Rulings' && (item.category === 'Ruling' || item.category === 'Judgment')) ||
      (selectedForum === 'Filings' && item.category === 'Filing');

    return matchesSearch && matchesForum;
  });

  const hearingsCount = deadlines.filter((d) => d.category === 'Hearing').length;
  const mentionsCount = deadlines.filter((d) => d.category === 'Mention').length;
  const rulingsCount = deadlines.filter((d) => d.category === 'Ruling' || d.category === 'Judgment').length;
  const filingsCount = deadlines.filter((d) => d.category === 'Filing').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-2xl border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2dfd5] pb-5">
        <div>
          <h2 className="font-serif-title text-2xl font-bold text-[#1a1d20]">
            Court Diary & Cause List Calendar
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            Milimani Law Courts, Environment & Land Court, ELRC, Commercial Division, and Arbitrations
          </p>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center space-x-1.5 rounded-md bg-[#0B2840] hover:bg-[#071E30] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Hearing / Mention</span>
        </button>
      </div>

      {/* Diary Category Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setSelectedForum('Hearings')}
          className={`rounded-xl border p-4 text-left transition cursor-pointer ${
            selectedForum === 'Hearings'
              ? 'border-[#0B2840] bg-[#0B2840] text-white shadow-sm'
              : 'border-[#e2dfd5] bg-white text-stone-900 hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Full Hearings</span>
            <Gavel className="h-4 w-4 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-1">{hearingsCount}</p>
          <p className="text-[10px] mt-0.5 opacity-70">Main trial appearances</p>
        </button>

        <button
          onClick={() => setSelectedForum('Mentions')}
          className={`rounded-xl border p-4 text-left transition cursor-pointer ${
            selectedForum === 'Mentions'
              ? 'border-[#0B2840] bg-[#0B2840] text-white shadow-sm'
              : 'border-[#e2dfd5] bg-white text-stone-900 hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Mentions & Pre-Trial</span>
            <CalendarIcon className="h-4 w-4 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-1">{mentionsCount}</p>
          <p className="text-[10px] mt-0.5 opacity-70">Directions & compliance</p>
        </button>

        <button
          onClick={() => setSelectedForum('Rulings')}
          className={`rounded-xl border p-4 text-left transition cursor-pointer ${
            selectedForum === 'Rulings'
              ? 'border-[#0B2840] bg-[#0B2840] text-white shadow-sm'
              : 'border-[#e2dfd5] bg-white text-stone-900 hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Rulings & Judgments</span>
            <Clock className="h-4 w-4 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-1">{rulingsCount}</p>
          <p className="text-[10px] mt-0.5 opacity-70">Decisions delivery</p>
        </button>

        <button
          onClick={() => setSelectedForum('Filings')}
          className={`rounded-xl border p-4 text-left transition cursor-pointer ${
            selectedForum === 'Filings'
              ? 'border-[#0B2840] bg-[#0B2840] text-white shadow-sm'
              : 'border-[#e2dfd5] bg-white text-stone-900 hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">CTS Registry Filings</span>
            <MapPin className="h-4 w-4 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-1">{filingsCount}</p>
          <p className="text-[10px] mt-0.5 opacity-70">Statutory deadlines</p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-[#e2dfd5]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diary by case, court, judge, advocate..."
            className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-1.5 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedForum('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              selectedForum === 'All'
                ? 'bg-[#0B2840] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All Entries ({deadlines.length})
          </button>
        </div>
      </div>

      {/* Hearings List */}
      <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-3">
        <h3 className="font-serif-title font-bold text-stone-900 text-base border-b border-stone-100 pb-3 flex items-center justify-between">
          <span>Scheduled Court Appearances & Filings ({filteredDeadlines.length})</span>
          <span className="text-xs font-normal text-stone-500 font-sans">
            Automatically synced with chambers diary
          </span>
        </h3>

        <div className="space-y-3">
          {filteredDeadlines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
              <CalendarIcon className="mx-auto h-8 w-8 text-stone-400 mb-2" />
              <p className="text-sm font-semibold text-stone-700">
                No court appearances or filings found
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Click &quot;Schedule Hearing / Mention&quot; above to add upcoming court sessions.
              </p>
            </div>
          ) : (
            filteredDeadlines.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-[#e2dfd5] bg-[#fdfcf9] p-4 hover:border-[#0B2840] transition-all"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B2840]/10 text-[#0B2840]">
                    <Gavel className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        {item.title}
                      </span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        {item.category}
                      </span>
                      {item.matterRef && (
                        <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                          {item.matterRef}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#0B2840] mt-0.5">
                      {item.matterTitle}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1 flex items-center space-x-2 flex-wrap">
                      <span>📍 {item.courtLocation}</span>
                      <span>•</span>
                      <span>👤 {item.advocateName}</span>
                      {item.presidingJudge && (
                        <>
                          <span>•</span>
                          <span>⚖️ {item.presidingJudge}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="font-bold text-stone-900 text-xs sm:text-sm">
                    {item.dueDate}
                  </div>
                  <div className="font-mono text-xs text-[#0B2840] font-semibold mt-0.5">
                    ⏰ {item.time}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Hearing Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-[#0B2840]" />
                <h3 className="font-bold text-stone-900 text-base">
                  Schedule Hearing or Mention
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Session Title / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hearing of Injunction Application"
                  required
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Session Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none bg-white"
                  >
                    <option value="Hearing">Hearing</option>
                    <option value="Mention">Mention</option>
                    <option value="Ruling">Ruling</option>
                    <option value="Judgment">Judgment</option>
                    <option value="Case Conference">Case Conference</option>
                    <option value="Filing">CTS Filing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Linked Matter
                  </label>
                  <select
                    value={newMatterRef}
                    onChange={(e) => handleMatterSelect(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none bg-white"
                  >
                    <option value="">-- Select Matter (Optional) --</option>
                    {matters.map((m) => (
                      <option key={m.id} value={m.referenceNumber}>
                        {m.referenceNumber} - {m.title.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Court Location / Station
                  </label>
                  <input
                    type="text"
                    value={newCourtLocation}
                    onChange={(e) => setNewCourtLocation(e.target.value)}
                    placeholder="e.g. Milimani Commercial Court 3"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Presiding Judge / Magistrate
                  </label>
                  <input
                    type="text"
                    value={newPresidingJudge}
                    onChange={(e) => setNewPresidingJudge(e.target.value)}
                    placeholder="e.g. Hon. Justice Majanja"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Assigned Advocate
                </label>
                <select
                  value={newAdvocateName}
                  onChange={(e) => setNewAdvocateName(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0B2840] focus:outline-none bg-white"
                >
                  {staffList.map((adv) => (
                    <option key={adv.id} value={adv.name}>
                      {adv.name} ({adv.role || adv.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B2840] hover:bg-[#071E30] text-white px-5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
