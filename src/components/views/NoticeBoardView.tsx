import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Calendar,
  Gift,
  Newspaper,
  Pin,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Sparkles,
  Trash2,
  ThumbsUp,
  PartyPopper,
  Flame,
  Printer,
  X,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { NoticeBoardItem, NoticeCategory, NoticePriority, Advocate } from '../../types';

interface NoticeBoardViewProps {
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
}

const CATEGORIES: { id: NoticeCategory | 'All'; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'All', label: 'All Notices', icon: Megaphone, color: 'text-stone-700' },
  { id: 'Announcements', label: 'Announcements', icon: Megaphone, color: 'text-[#0070ba]' },
  { id: 'Holidays', label: 'Holidays & Recess', icon: Calendar, color: 'text-emerald-700' },
  { id: 'Birthdays', label: 'Birthdays & Welfare', icon: Gift, color: 'text-pink-600' },
  { id: 'Company News', label: 'Company News', icon: Newspaper, color: 'text-amber-700' },
];

const QUICK_EMOJIS = ['👍', '🎉', '🎂', '👏', '❤️', '📌'];

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({
  currentAdvocate,
  isManagingAdvocate = false,
}) => {
  // Persistence via localStorage with fallback to empty list
  const [notices, setNotices] = useState<NoticeBoardItem[]>(() => {
    try {
      const stored = localStorage.getItem('chambers_notice_board_items_v3');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  });

  const saveNotices = (newNotices: NoticeBoardItem[]) => {
    setNotices(newNotices);
    try {
      localStorage.setItem('chambers_notice_board_items_v3', JSON.stringify(newNotices));
    } catch {}
  };

  const [activeCategory, setActiveCategory] = useState<NoticeCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Urgent' | 'Important' | 'Pinned'>('All');
  const [audienceFilter, setAudienceFilter] = useState<'All' | 'All Staff' | 'Advocates' | 'Legal Assistants' | 'Partners'>('All');
  const [isNewNoticeModalOpen, setIsNewNoticeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Form State for New Notice
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<NoticeCategory>('Announcements');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<NoticePriority>('Normal');
  const [newPinned, setNewPinned] = useState(false);
  const [newTargetAudience, setNewTargetAudience] = useState<'All Staff' | 'Advocates' | 'Legal Assistants' | 'Partners'>('All Staff');
  const [newEventDate, setNewEventDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTagsInput, setNewTagsInput] = useState('');

  // Handle create notice
  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToast('Please fill in both title and description');
      return;
    }

    const tags = newTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newItem: NoticeBoardItem = {
      id: `nb-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      postedBy: currentAdvocate?.name || 'Advocate Staff',
      postedRole: currentAdvocate?.title || 'Chambers Advocate',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      priority: newPriority,
      pinned: newPinned,
      targetAudience: newTargetAudience,
      eventDate: newEventDate ? newEventDate : undefined,
      location: newLocation.trim() ? newLocation.trim() : undefined,
      tags: tags.length > 0 ? tags : [newCategory],
      acknowledgedBy: currentAdvocate ? [currentAdvocate.name] : [],
      reactions: [
        { emoji: '👍', count: 1, users: currentAdvocate ? [currentAdvocate.name] : ['Staff'] },
      ],
    };

    const updated = [newItem, ...notices];
    saveNotices(updated);
    setIsNewNoticeModalOpen(false);
    showToast(`Notice posted successfully under ${newCategory}`);

    // Reset Form
    setNewTitle('');
    setNewCategory('Announcements');
    setNewContent('');
    setNewPriority('Normal');
    setNewPinned(false);
    setNewTargetAudience('All Staff');
    setNewEventDate('');
    setNewLocation('');
    setNewTagsInput('');
  };

  // Toggle Reaction
  const handleToggleReaction = (noticeId: string, emoji: string) => {
    const userName = currentAdvocate?.name || 'Current User';
    const updated = notices.map((notice) => {
      if (notice.id !== noticeId) return notice;

      const reactions = notice.reactions ? [...notice.reactions] : [];
      const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);

      if (existingReactionIndex > -1) {
        const reaction = reactions[existingReactionIndex];
        const userIndex = reaction.users.indexOf(userName);

        if (userIndex > -1) {
          // Remove user reaction
          const newUsers = reaction.users.filter((u) => u !== userName);
          if (newUsers.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          } else {
            reactions[existingReactionIndex] = {
              ...reaction,
              count: newUsers.length,
              users: newUsers,
            };
          }
        } else {
          // Add user to existing emoji
          reactions[existingReactionIndex] = {
            ...reaction,
            count: reaction.count + 1,
            users: [...reaction.users, userName],
          };
        }
      } else {
        // New emoji reaction
        reactions.push({
          emoji,
          count: 1,
          users: [userName],
        });
      }

      return { ...notice, reactions };
    });

    saveNotices(updated);
  };

  // Toggle Acknowledgment
  const handleToggleAcknowledge = (noticeId: string) => {
    const userName = currentAdvocate?.name || 'Current User';
    const updated = notices.map((notice) => {
      if (notice.id !== noticeId) return notice;

      const acknowledgedBy = notice.acknowledgedBy ? [...notice.acknowledgedBy] : [];
      const index = acknowledgedBy.indexOf(userName);

      if (index > -1) {
        acknowledgedBy.splice(index, 1);
      } else {
        acknowledgedBy.push(userName);
      }

      return { ...notice, acknowledgedBy };
    });

    saveNotices(updated);
  };

  // Toggle Pin
  const handleTogglePin = (noticeId: string) => {
    const updated = notices.map((notice) =>
      notice.id === noticeId ? { ...notice, pinned: !notice.pinned } : notice
    );
    saveNotices(updated);
    showToast('Notice pinned status updated');
  };

  // Delete Notice
  const handleDeleteNotice = (noticeId: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      const updated = notices.filter((n) => n.id !== noticeId);
      saveNotices(updated);
      showToast('Notice deleted');
    }
  };

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      // Category Filter
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }

      // Priority Filter
      if (priorityFilter === 'Urgent' && item.priority !== 'Urgent') return false;
      if (priorityFilter === 'Important' && item.priority !== 'Important' && item.priority !== 'Urgent') return false;
      if (priorityFilter === 'Pinned' && !item.pinned) return false;

      // Audience Filter
      if (audienceFilter !== 'All' && item.targetAudience && item.targetAudience !== 'All Staff' && item.targetAudience !== audienceFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesContent = item.content.toLowerCase().includes(q);
        const matchesAuthor = item.postedBy.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [notices, activeCategory, priorityFilter, audienceFilter, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    return {
      All: notices.length,
      Announcements: notices.filter((n) => n.category === 'Announcements').length,
      Holidays: notices.filter((n) => n.category === 'Holidays').length,
      Birthdays: notices.filter((n) => n.category === 'Birthdays').length,
      'Company News': notices.filter((n) => n.category === 'Company News').length,
    };
  }, [notices]);

  // Pinned items
  const pinnedNotices = useMemo(() => {
    return notices.filter((n) => n.pinned);
  }, [notices]);

  // Upcoming Birthdays & Holidays Quick Cards
  const upcomingEvents = useMemo(() => {
    return notices
      .filter((n) => (n.category === 'Birthdays' || n.category === 'Holidays') && n.eventDate)
      .sort((a, b) => (a.eventDate! > b.eventDate! ? 1 : -1))
      .slice(0, 3);
  }, [notices]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-lg bg-[#132c3f] text-white px-4 py-2.5 text-xs font-semibold shadow-xl border border-blue-400/30 flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2dfd5] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-[#0098db]/15 text-[#0070ba]">
              <Megaphone className="h-5 w-5" />
            </span>
            <h2 className="font-serif-title text-2xl font-bold text-[#1a1d20]">
              Notice Board & Announcements
            </h2>
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Chambers news, official announcements, court vacation & holiday schedules, and team birthdays
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handlePrint}
            title="Print Chambers Notices"
            className="flex items-center space-x-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-stone-500" />
            <span className="hidden sm:inline">Print Memo</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewNoticeModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-md bg-[#0098db] hover:bg-[#0087c2] active:bg-[#0070ba] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Post Notice</span>
          </button>
        </div>
      </div>

      {/* Highlights & Upcoming Milestones Carousel / Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Urgent / Pinned Banner */}
        <div className="md:col-span-2 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold tracking-wider">
                <Flame className="h-4 w-4 text-amber-600 animate-pulse" />
                <span>Chambers Highlights & Urgent Notices</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {pinnedNotices.length} Pinned
              </span>
            </div>

            {pinnedNotices.length > 0 ? (
              <div className="mt-3 space-y-2">
                {pinnedNotices.slice(0, 2).map((pin) => (
                  <div
                    key={pin.id}
                    className="p-2.5 rounded-lg bg-white/90 border border-amber-200/60 shadow-2xs flex items-start space-x-2.5"
                  >
                    <Pin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 rotate-45" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {pin.title}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                          {pin.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">
                        {pin.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone-500">
                No pinned notices at this moment. You can pin important dates or announcements here.
              </p>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span>Firm Notice Board</span>
            <span className="font-mono text-stone-500">
              Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Upcoming Birthdays & Public Holidays Quick Widget */}
        <div className="rounded-xl border border-pink-200/70 bg-gradient-to-br from-pink-50/80 via-rose-50/30 to-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-pink-900 text-xs font-bold tracking-wider">
                <PartyPopper className="h-4 w-4 text-pink-600" />
                <span>Upcoming Milestones</span>
              </div>
              <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                Calendar
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2 rounded-lg bg-white border border-pink-100 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {evt.category === 'Birthdays' ? (
                        <Gift className="h-4 w-4 text-pink-500 shrink-0" />
                      ) : (
                        <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {evt.title}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {evt.eventDate
                            ? new Date(evt.eventDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : evt.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500">No scheduled birthdays or holidays recorded.</p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-pink-200/50 flex items-center justify-between text-[10px] text-pink-800 font-semibold">
            <span>Chambers Welfare Committee</span>
            <span>All Staff</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/60 p-1.5 rounded-xl text-xs font-bold">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id as keyof typeof categoryCounts] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? (cat.id === 'All' ? 'text-[#0098db]' : cat.color) : 'text-stone-400'
                }`}
              />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-stone-900 text-white' : 'bg-stone-300/80 text-stone-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#e2dfd5] shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices by title, content, or tag..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30 focus:border-[#0098db]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-500 font-medium shrink-0">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent Only</option>
            <option value="Important">Important & Urgent</option>
            <option value="Pinned">Pinned Only</option>
          </select>
        </div>

        {/* Audience Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-500 font-medium shrink-0">Audience:</span>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value as any)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30"
          >
            <option value="All">All Audiences</option>
            <option value="All Staff">All Staff</option>
            <option value="Advocates">Advocates Only</option>
            <option value="Legal Assistants">Legal Assistants</option>
            <option value="Partners">Partners Only</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotices.map((notice) => {
            const isUserAcknowledged = currentAdvocate
              ? notice.acknowledgedBy?.includes(currentAdvocate.name)
              : false;

            const categoryStyle =
              notice.category === 'Announcements'
                ? { bg: 'bg-blue-50', text: 'text-[#0070ba]', border: 'border-blue-200', icon: Megaphone }
                : notice.category === 'Holidays'
                ? { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: Calendar }
                : notice.category === 'Birthdays'
                ? { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: Gift }
                : { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Newspaper };

            const CategoryIcon = categoryStyle.icon;

            return (
              <div
                key={notice.id}
                className={`rounded-xl bg-white border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group ${
                  notice.pinned
                    ? 'border-amber-300 ring-1 ring-amber-300/60 bg-gradient-to-b from-amber-50/20 to-white'
                    : 'border-[#e2dfd5] hover:border-stone-400'
                }`}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Category Badge */}
                      <span
                        className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}
                      >
                        <CategoryIcon className="h-3 w-3" />
                        <span>{notice.category}</span>
                      </span>

                      {/* Priority Badge */}
                      {notice.priority === 'Urgent' && (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                          <span>Urgent Notice</span>
                        </span>
                      )}

                      {notice.priority === 'Important' && (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                          <span>Important</span>
                        </span>
                      )}

                      {/* Target Audience */}
                      {notice.targetAudience && (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 text-[10px] font-medium">
                          <Users className="h-3 w-3" />
                          <span>{notice.targetAudience}</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Pin / Delete Action Buttons */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(notice.id)}
                        title={notice.pinned ? 'Unpin notice' : 'Pin notice to top'}
                        className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                          notice.pinned
                            ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                            : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5 rotate-45" />
                      </button>

                      {(isManagingAdvocate || notice.postedBy === currentAdvocate?.name) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(notice.id)}
                          title="Delete notice"
                          className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notice Title */}
                  <h3 className="mt-3 font-serif-title text-base font-bold text-stone-900 leading-snug">
                    {notice.title}
                  </h3>

                  {/* Event Date or Location Highlight */}
                  {(notice.eventDate || notice.location) && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                      {notice.eventDate && (
                        <div className="flex items-center space-x-1 font-semibold text-emerald-800">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                          <span>
                            Event Date:{' '}
                            {new Date(notice.eventDate).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {notice.location && (
                        <div className="flex items-center space-x-1 text-stone-600">
                          <MapPin className="h-3.5 w-3.5 text-stone-500" />
                          <span>{notice.location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notice Content Body */}
                  <p className="mt-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {notice.content}
                  </p>

                  {/* Tags */}
                  {notice.tags && notice.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {notice.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                        >
                          <Tag className="h-2.5 w-2.5 text-stone-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Section: Author, Acknowledgment & Reactions */}
                <div className="mt-5 pt-3.5 border-t border-stone-100 space-y-3">
                  {/* Author & Date metadata */}
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-[#132c3f] text-white flex items-center justify-center text-[10px] font-bold">
                        {notice.postedBy.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">{notice.postedBy}</span>
                        {notice.postedRole && (
                          <span className="text-stone-400 text-[10px] ml-1.5">• {notice.postedRole}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-stone-400">
                      <Clock className="h-3 w-3" />
                      <span>{notice.date}</span>
                    </div>
                  </div>

                  {/* Reactions & Acknowledge Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Reaction Buttons */}
                    <div className="flex flex-wrap items-center gap-1">
                      {QUICK_EMOJIS.map((emoji) => {
                        const reaction = notice.reactions?.find((r) => r.emoji === emoji);
                        const hasReacted = currentAdvocate
                          ? reaction?.users.includes(currentAdvocate.name)
                          : false;

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(notice.id, emoji)}
                            className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs transition-all cursor-pointer ${
                              hasReacted
                                ? 'bg-[#0098db]/15 border border-[#0098db]/40 text-[#0070ba] font-bold'
                                : 'bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 text-stone-600'
                            }`}
                          >
                            <span>{emoji}</span>
                            {reaction && reaction.count > 0 && (
                              <span className="text-[10px] font-semibold">{reaction.count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mark as Read / Acknowledge Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAcknowledge(notice.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isUserAcknowledged
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${
                          isUserAcknowledged ? 'text-emerald-600' : 'text-stone-400'
                        }`}
                      />
                      <span>{isUserAcknowledged ? 'Acknowledged' : 'Mark Read'}</span>
                      {notice.acknowledgedBy && notice.acknowledgedBy.length > 0 && (
                        <span className="ml-1 text-[10px] font-mono opacity-80">
                          ({notice.acknowledgedBy.length})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <Megaphone className="h-6 w-6 text-[#0098db]" />
          </div>
          <h3 className="mt-3 text-base font-bold text-stone-900 font-serif-title">
            No Notices in Selected Category
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            There are currently no active announcements, holiday updates, or birthdays matching your filter.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All');
                setPriorityFilter('All');
                setAudienceFilter('All');
                setSearchQuery('');
              }}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setIsNewNoticeModalOpen(true)}
              className="rounded-md bg-[#0098db] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0087c2] cursor-pointer"
            >
              Post Notice
            </button>
          </div>
        </div>
      )}

      {/* Post New Notice Modal */}
      {isNewNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-lg bg-[#0098db]/15 text-[#0070ba]">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-stone-900">
                    Post Notice to Chambers Board
                  </h3>
                  <p className="text-xs text-stone-500">
                    Publish official news, court recess & holiday schedules, or birthday greetings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewNoticeModalOpen(false)}
                className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="mt-4 space-y-4 text-xs">
              {/* Category Picker */}
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Notice Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Announcements', 'Holidays', 'Birthdays', 'Company News'] as NoticeCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        newCategory === cat
                          ? 'border-[#0098db] bg-blue-50/80 text-[#0070ba] shadow-2xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Notice Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Court Recess Schedule / Birthday Greeting / Policy Update"
                  className="w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30 focus:border-[#0098db]"
                />
              </div>

              {/* Content Body */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Notice Content & Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Provide comprehensive details, instructions, event timings, or chambers directives..."
                  className="w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30 focus:border-[#0098db]"
                />
              </div>

              {/* Event Date & Location (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Event Date (For Holidays / Birthdays / Meetings)
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Location / Venue (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Executive Boardroom / Main Chambers"
                    className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30"
                  />
                </div>
              </div>

              {/* Priority & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as NoticePriority)}
                    className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30 bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent (Red Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={newTargetAudience}
                    onChange={(e) => setNewTargetAudience(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30 bg-white"
                  >
                    <option value="All Staff">All Staff</option>
                    <option value="Advocates">Advocates Only</option>
                    <option value="Legal Assistants">Legal Assistants</option>
                    <option value="Partners">Partners Only</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  placeholder="e.g. Judiciary, Recess, Compliance, Welfare"
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0098db]/30"
                />
              </div>

              {/* Pin to top checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pinToTop"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[#0098db] focus:ring-[#0098db]"
                />
                <label htmlFor="pinToTop" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  Pin this notice to top of the board
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewNoticeModalOpen(false)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0098db] hover:bg-[#0087c2] active:bg-[#0070ba] px-5 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
