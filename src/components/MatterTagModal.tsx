import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Check, Sparkles, AlertCircle } from 'lucide-react';
import { LegalMatter } from '../types';
import { DraggableModal } from './common/DraggableModal';

interface MatterTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter: LegalMatter | null;
  onUpdateTags: (matterId: string, tags: string[]) => void;
}

const PRESET_SUGGESTED_TAGS = [
  'Urgent',
  'High Value',
  'Pro Bono',
  'Court of Appeal',
  'Supreme Court',
  'ArdhiSasa',
  'Commercial',
  'Arbitration',
  'Tax Advisory',
  'Injunction',
  'Succession',
  'Land Registry',
  'Mediation',
  'Public Interest',
  'Cross-Border',
  'Interlocutory',
];

export const getTagColorClass = (tag: string, isSelected: boolean = false) => {
  if (isSelected) {
    return 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold';
  }
  const lower = tag.toLowerCase();
  if (
    lower.includes('urgent') ||
    lower.includes('expedite') ||
    lower.includes('emergency') ||
    lower.includes('critical')
  ) {
    return 'bg-rose-50/80 text-rose-800 border-rose-200/90 hover:bg-rose-100 hover:border-rose-300';
  }
  if (
    lower.includes('pro bono') ||
    lower.includes('legal aid') ||
    lower.includes('public')
  ) {
    return 'bg-emerald-50/80 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300';
  }
  if (
    lower.includes('high value') ||
    lower.includes('commercial') ||
    lower.includes('corporate') ||
    lower.includes('m&a')
  ) {
    return 'bg-amber-50/80 text-amber-900 border-amber-200/90 hover:bg-amber-100 hover:border-amber-300';
  }
  if (
    lower.includes('court of appeal') ||
    lower.includes('supreme') ||
    lower.includes('appellate') ||
    lower.includes('tribunal')
  ) {
    return 'bg-indigo-50/80 text-indigo-800 border-indigo-200/90 hover:bg-indigo-100 hover:border-indigo-300';
  }
  if (
    lower.includes('ardhisasa') ||
    lower.includes('land') ||
    lower.includes('title') ||
    lower.includes('conveyanc')
  ) {
    return 'bg-teal-50/80 text-teal-800 border-teal-200/90 hover:bg-teal-100 hover:border-teal-300';
  }
  if (
    lower.includes('tax') ||
    lower.includes('kra') ||
    lower.includes('finance') ||
    lower.includes('bank') ||
    lower.includes('securit')
  ) {
    return 'bg-sky-50/80 text-sky-800 border-sky-200/90 hover:bg-sky-100 hover:border-sky-300';
  }
  if (
    lower.includes('succession') ||
    lower.includes('probate') ||
    lower.includes('estate') ||
    lower.includes('trust')
  ) {
    return 'bg-purple-50/80 text-purple-800 border-purple-200/90 hover:bg-purple-100 hover:border-purple-300';
  }
  return 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300';
};

export const MatterTagModal: React.FC<MatterTagModalProps> = ({
  isOpen,
  onClose,
  matter,
  onUpdateTags,
}) => {
  if (!isOpen || !matter) return null;

  const [currentTags, setCurrentTags] = useState<string[]>(matter.tags || []);
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTags(matter.tags || []);
    setCustomInput('');
    setErrorMsg(null);
  }, [matter]);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" is already added to this matter.`);
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }
    const updated = [...currentTags, trimmed];
    setCurrentTags(updated);
    setCustomInput('');
    setErrorMsg(null);
    onUpdateTags(matter.id, updated);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = currentTags.filter((t) => t !== tagToRemove);
    setCurrentTags(updated);
    onUpdateTags(matter.id, updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      handleAddTag(customInput);
    }
  };

  const togglePresetTag = (tag: string) => {
    if (currentTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      handleRemoveTag(currentTags.find((t) => t.toLowerCase() === tag.toLowerCase()) || tag);
    } else {
      handleAddTag(tag);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <DraggableModal
        gripLabel="CATEGORIZE MATTER"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div
          data-drag-handle="true"
          className="flex items-start justify-between pb-4 border-b border-slate-100 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Categorize Matter
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {matter.referenceNumber} • <span className="font-sans font-medium text-slate-700">{matter.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Active Tags Section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Assigned Custom Keywords ({currentTags.length})
            </label>
            {currentTags.length > 0 && (
              <span className="text-[11px] text-slate-400">
                Click <span className="font-bold">×</span> to remove
              </span>
            )}
          </div>

          <div className="min-h-[52px] rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 flex flex-wrap items-center gap-1.5">
            {currentTags.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No tags assigned yet. Type custom keywords or select standard keywords below.
              </p>
            ) : (
              currentTags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border shadow-2xs transition-all ${getTagColorClass(
                    tag
                  )}`}
                >
                  <Tag className="h-3 w-3 opacity-60" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 text-slate-500 hover:text-slate-900 cursor-pointer transition"
                    title={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Input for Custom Keywords */}
        <form onSubmit={handleFormSubmit} className="mt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Add Custom Keyword
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="e.g. Injunction, Sectional Properties, High Stake..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none shadow-2xs"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tag</span>
            </button>
          </div>
          {errorMsg && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errorMsg}
            </p>
          )}
        </form>

        {/* Suggested Quick Keywords */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Popular Firm Workspace Keywords</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {PRESET_SUGGESTED_TAGS.map((preset) => {
              const isApplied = currentTags.some(
                (t) => t.toLowerCase() === preset.toLowerCase()
              );
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => togglePresetTag(preset)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer border ${
                    isApplied
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isApplied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Plus className="h-3 w-3 text-slate-400" />
                  )}
                  <span>{preset}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Tags appear as pill labels on the register table.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </DraggableModal>
    </div>
  );
};
