import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Copy,
  Check,
  Download,
  Eye,
  AlertCircle,
  Scale,
  Shield,
  FileCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { LegalMatter, Advocate, CaseFiledDocument, FiledDocumentType, FiledDocumentStatus } from '../types';

interface FiledDocumentsListProps {
  matter: LegalMatter;
  currentAdvocate?: Advocate | null;
  compact?: boolean;
  onViewAllTab?: () => void;
}

const DOCUMENT_PRESETS: { type: FiledDocumentType; defaultTitle: string; icon: any; color: string }[] = [
  {
    type: 'Plaint',
    defaultTitle: 'Plaint & Verifying Affidavit',
    icon: FileText,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  {
    type: 'Notice of Motion',
    defaultTitle: 'Notice of Motion (Under Certificate of Urgency)',
    icon: Scale,
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  {
    type: 'Affidavit',
    defaultTitle: 'Supporting Affidavit of Plaintiff',
    icon: Shield,
    color: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  {
    type: 'Replying Affidavit',
    defaultTitle: 'Replying Affidavit in Opposition',
    icon: Shield,
    color: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  },
  {
    type: 'Chamber Summons',
    defaultTitle: 'Chamber Summons for Directions',
    icon: Layers,
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    type: 'Statement of Defence',
    defaultTitle: 'Statement of Defence & Counterclaim',
    icon: FileCheck,
    color: 'border-slate-200 bg-slate-100 text-slate-800',
  },
  {
    type: 'Written Submissions',
    defaultTitle: 'Skeleton Written Submissions & Authorities',
    icon: BookOpen,
    color: 'border-purple-200 bg-purple-50 text-purple-800',
  },
  {
    type: 'Court Order',
    defaultTitle: 'Formal Order / Interim Injunction',
    icon: Scale,
    color: 'border-rose-200 bg-rose-50 text-rose-800',
  },
];

const getDefaultCaseDocuments = (_matter: LegalMatter): CaseFiledDocument[] => {
  return [];
};

export const FiledDocumentsList: React.FC<FiledDocumentsListProps> = ({
  matter,
  currentAdvocate,
  compact = false,
  onViewAllTab,
}) => {
  const storageKey = `maa_case_filed_docs_${matter.id}`;

  const [documents, setDocuments] = useState<CaseFiledDocument[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return getDefaultCaseDocuments(matter);
  });

  // Form & Interaction State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Document Form Fields
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState<FiledDocumentType>('Notice of Motion');
  const [newFilingDate, setNewFilingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newCtsRef, setNewCtsRef] = useState(`CTS-2026-NBI-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newFiledBy, setNewFiledBy] = useState(
    `${matter.responsibleAdvocateName || currentAdvocate?.name || 'Adv. Costa Kimathi'} (Counsel for ${
      matter.practiceArea.includes('Commercial') ? 'Plaintiff' : 'Applicant'
    })`
  );
  const [newStatus, setNewStatus] = useState<FiledDocumentStatus>('Filed & Endorsed');
  const [newPrayer, setNewPrayer] = useState('');
  const [newPageCount, setNewPageCount] = useState<string>('4');

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents, storageKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApplyPreset = (preset: typeof DOCUMENT_PRESETS[0]) => {
    setNewDocType(preset.type);
    setNewTitle(preset.defaultTitle);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: CaseFiledDocument = {
      id: `doc-${Date.now()}`,
      matterId: matter.id,
      matterRef: matter.referenceNumber,
      title: newTitle.trim(),
      docType: newDocType,
      filingDate: newFilingDate || new Date().toISOString().split('T')[0],
      ctsReference: newCtsRef.trim() || undefined,
      filedBy: newFiledBy.trim() || `${matter.responsibleAdvocateName} (Counsel on Record)`,
      status: newStatus,
      pageCount: parseInt(newPageCount, 10) || undefined,
      fileSize: `${(Math.random() * 3 + 0.8).toFixed(1)} MB`,
      summaryOrPrayer: newPrayer.trim() || undefined,
      createdDate: new Date().toISOString(),
    };

    setDocuments([newDoc, ...documents]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewPrayer('');
    showToast(`Filed document "${newDoc.title}" logged for case ${matter.referenceNumber}!`);
  };

  const handleDeleteDocument = (docId: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the case pleadings register?`)) {
      setDocuments(documents.filter((d) => d.id !== docId));
      showToast(`Document "${title}" removed.`);
    }
  };

  const handleUpdateStatus = (docId: string, status: FiledDocumentStatus) => {
    setDocuments(
      documents.map((d) => (d.id === docId ? { ...d, status } : d))
    );
    showToast(`Updated status to "${status}"`);
  };

  const handleCopyCitation = (doc: CaseFiledDocument) => {
    const citation = `${doc.title} (${doc.docType}) - Filed: ${doc.filingDate} [CTS Ref: ${doc.ctsReference || 'N/A'}] - In: ${matter.referenceNumber} (${matter.title})`;
    navigator.clipboard.writeText(citation);
    setCopiedId(doc.id);
    showToast('Document citation & CTS ref copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchTerm === '' ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.ctsReference && doc.ctsReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.filedBy && doc.filedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.summaryOrPrayer && doc.summaryOrPrayer.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        selectedTypeFilter === 'All' ||
        doc.docType.toLowerCase().includes(selectedTypeFilter.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, selectedTypeFilter]);

  const getDocTypeBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('plaint') || lower.includes('petition')) {
      return { label: type, badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    if (lower.includes('motion') || lower.includes('application')) {
      return { label: type, badge: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (lower.includes('replying')) {
      return { label: type, badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
    if (lower.includes('affidavit')) {
      return { label: type, badge: 'bg-blue-50 text-blue-800 border-blue-200' };
    }
    if (lower.includes('summons')) {
      return { label: type, badge: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
    }
    if (lower.includes('order') || lower.includes('decree') || lower.includes('injunction')) {
      return { label: type, badge: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
    if (lower.includes('submission') || lower.includes('authorit')) {
      return { label: type, badge: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    if (lower.includes('defence') || lower.includes('counterclaim')) {
      return { label: type, badge: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
    return { label: type, badge: 'bg-stone-100 text-stone-800 border-stone-200' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Filed & Endorsed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Served on Parties':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Listed for Hearing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending Assessment':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Counts breakdown
  const countPlaints = documents.filter((d) => d.docType.toLowerCase().includes('plaint') || d.docType.toLowerCase().includes('petition')).length;
  const countMotions = documents.filter((d) => d.docType.toLowerCase().includes('motion') || d.docType.toLowerCase().includes('summons')).length;
  const countAffidavits = documents.filter((d) => d.docType.toLowerCase().includes('affidavit')).length;

  // COMPACT VIEW (used on Overview Tab)
  if (compact) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-[#0B63E5]/10 p-1.5 text-[#0B63E5]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-stone-900 text-xs">
                  Tracked Filed Documents
                </h4>
                <span className="rounded-full bg-blue-50 text-[#0B63E5] px-2 py-0.2 text-[10px] font-bold border border-blue-100">
                  {documents.length} Filed
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                Pleadings, affidavits & applications filed for {matter.referenceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1 rounded-md bg-[#0B63E5] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-2xs"
            >
              <Plus className="h-3 w-3" />
              <span>Track Document</span>
            </button>
            {onViewAllTab && (
              <button
                type="button"
                onClick={onViewAllTab}
                className="text-[11px] font-bold text-[#0B63E5] hover:underline cursor-pointer"
              >
                View Full Tab →
              </button>
            )}
          </div>
        </div>

        {/* Quick List in Compact Mode */}
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/60 p-4 text-center">
            <p className="text-xs text-stone-500 font-medium">No documents tracked for this case yet.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 text-xs font-bold text-[#0B63E5] hover:underline cursor-pointer"
            >
              + Add Plaint, Affidavit or Notice of Motion
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.slice(0, 3).map((doc) => {
              const typeBadge = getDocTypeBadge(doc.docType);
              return (
                <div
                  key={doc.id}
                  className="flex items-start justify-between rounded-lg border border-stone-200/80 bg-stone-50/50 p-2.5 hover:bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-start space-x-2.5">
                    <FileText className="h-4 w-4 text-[#0B63E5] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-stone-900 text-xs">{doc.title}</span>
                        <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-semibold border ${typeBadge.badge}`}>
                          {typeBadge.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          <span>Filed: {doc.filingDate}</span>
                        </span>
                        {doc.ctsReference && (
                          <span className="font-mono text-stone-600 bg-white px-1.5 py-0.2 rounded border border-stone-200">
                            {doc.ctsReference}
                          </span>
                        )}
                        <span className={`rounded px-1.5 py-0.2 font-medium border text-[9px] ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCitation(doc)}
                    className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    title="Copy citation"
                  >
                    {copiedId === doc.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
            {documents.length > 3 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onViewAllTab}
                  className="text-[11px] font-semibold text-stone-500 hover:text-[#0B63E5] cursor-pointer"
                >
                  + {documents.length - 3} more filed documents in case register
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Modal Modal */}
        {isAddModalOpen && renderAddModal()}
      </div>
    );
  }

  // FULL VIEW (used in Documents Tab)
  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="rounded-lg bg-stone-900 text-white px-3.5 py-2 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Action Bar */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-white to-amber-50/40 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-[#0B63E5] p-2 text-white shadow-2xs">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span>Filed Pleadings & Court Documents</span>
                  <span className="rounded-full bg-blue-100 text-[#0B63E5] px-2.5 py-0.5 text-[10px] font-bold font-mono">
                    {documents.length} Tracked
                  </span>
                </h3>
                <p className="text-[11px] text-stone-600">
                  Track court filings, CTS e-filing references, affidavits, notices of motion & service records for{' '}
                  <strong className="text-stone-800">{matter.referenceNumber}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Track New Document</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="mt-3 pt-3 border-t border-blue-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white/80 rounded-lg p-2 border border-stone-200/80">
            <span className="text-[10px] text-stone-500 font-medium">Total Tracked</span>
            <p className="font-bold text-stone-900 text-sm">{documents.length}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-stone-200/80">
            <span className="text-[10px] text-emerald-700 font-medium">Plaints & Petitions</span>
            <p className="font-bold text-emerald-800 text-sm">{countPlaints}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-stone-200/80">
            <span className="text-[10px] text-amber-700 font-medium">Motions & Summons</span>
            <p className="font-bold text-amber-800 text-sm">{countMotions}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-stone-200/80">
            <span className="text-[10px] text-blue-700 font-medium">Affidavits</span>
            <p className="font-bold text-blue-800 text-sm">{countAffidavits}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by title, CTS reference, filing counsel or prayer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Plaint', 'Motion', 'Affidavit', 'Submissions', 'Order'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedTypeFilter(type)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedTypeFilter === type
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {type === 'All' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center space-y-3">
          <FileText className="mx-auto h-8 w-8 text-stone-300" />
          <div>
            <h4 className="font-bold text-stone-800 text-sm">No filed documents match your criteria</h4>
            <p className="text-xs text-stone-500 mt-1">
              {searchTerm || selectedTypeFilter !== 'All'
                ? 'Try clearing the search query or category filter.'
                : 'Start tracking the pleadings, affidavits, and motions filed in this suit.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedTypeFilter('All');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Track New Filed Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDocuments.map((doc) => {
            const typeConfig = getDocTypeBadge(doc.docType);
            const isExpanded = expandedDocId === doc.id;

            return (
              <div
                key={doc.id}
                className="rounded-xl border border-stone-200 bg-white p-3.5 transition hover:border-[#0B63E5]/60 hover:shadow-xs space-y-2.5"
              >
                {/* Top Row: Title, Type Badge, Status, Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 rounded-md bg-blue-50 p-1.5 text-[#0B63E5] shrink-0 border border-blue-100">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-stone-900 text-xs leading-snug">{doc.title}</h4>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${typeConfig.badge}`}>
                          {typeConfig.label}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>

                      {/* Metadata row */}
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          <span>Filed: <strong className="text-stone-700">{doc.filingDate}</strong></span>
                        </span>

                        {doc.ctsReference && (
                          <span className="flex items-center gap-1 font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded border border-stone-200">
                            CTS: {doc.ctsReference}
                          </span>
                        )}

                        {doc.pageCount && (
                          <span className="text-stone-400">
                            {doc.pageCount} pages ({doc.fileSize || '2.1 MB'})
                          </span>
                        )}

                        <span className="text-stone-500 truncate max-w-[240px]">
                          By: <strong className="text-stone-700">{doc.filedBy}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(doc)}
                      className="rounded p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Copy legal citation & CTS ref"
                    >
                      {copiedId === doc.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                      className="rounded p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Remove from register"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Summary / Key Prayer preview if available */}
                {doc.summaryOrPrayer && (
                  <p className="text-[11px] text-stone-600 bg-stone-50/70 p-2 rounded-lg border border-stone-100 italic leading-relaxed">
                    "{doc.summaryOrPrayer}"
                  </p>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in duration-150">
                    <div>
                      <span className="text-[10px] text-stone-400 font-medium block">Filed By / Deponent</span>
                      <p className="font-semibold text-stone-800 text-[11px] mt-0.5">{doc.filedBy}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 font-medium block">Service on Opposing Counsel</span>
                      <p className="font-semibold text-stone-800 text-[11px] mt-0.5">
                        {doc.servedDate ? `Served on ${doc.servedDate}` : 'Affidavit of Service Pending'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 font-medium block">Update Status</span>
                      <select
                        value={doc.status}
                        onChange={(e) => handleUpdateStatus(doc.id, e.target.value as FiledDocumentStatus)}
                        className="mt-0.5 w-full rounded border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-800 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
                      >
                        <option value="Filed & Endorsed">Filed & Endorsed</option>
                        <option value="Served on Parties">Served on Parties</option>
                        <option value="Listed for Hearing">Listed for Hearing</option>
                        <option value="Pending Assessment">Pending Assessment</option>
                        <option value="Awaiting Response">Awaiting Response</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && renderAddModal()}
    </div>
  );

  function renderAddModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-[#0B63E5] p-1.5 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Track Filed Document</h3>
                <p className="text-[11px] text-stone-500">
                  Record filed pleading, affidavit, or motion for {matter.referenceNumber}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-stone-700">
              Quick Pleading Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DOCUMENT_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = newDocType === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`flex items-center space-x-1.5 rounded-lg border p-2 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'border-[#0B63E5] bg-blue-50 text-[#0B63E5] font-bold shadow-2xs'
                        : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5 shrink-0 text-[#0B63E5]" />
                    <span className="truncate text-[11px]">{preset.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
            {/* Title */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Document Title / Pleading Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Notice of Motion (Under Certificate of Urgency), Supporting Affidavit, Plaint"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
              />
            </div>

            {/* Doc Type & Filing Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Pleading Category</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as FiledDocumentType)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
                >
                  <option value="Plaint">Plaint / Originating Summons</option>
                  <option value="Notice of Motion">Notice of Motion</option>
                  <option value="Chamber Summons">Chamber Summons</option>
                  <option value="Affidavit">Supporting Affidavit</option>
                  <option value="Replying Affidavit">Replying Affidavit</option>
                  <option value="Supplementary Affidavit">Supplementary Affidavit</option>
                  <option value="Statement of Defence">Statement of Defence</option>
                  <option value="Written Submissions">Written Submissions</option>
                  <option value="Court Order">Court Order / Injunction</option>
                  <option value="Witness Statement">Witness Statement</option>
                  <option value="List & Bundle of Documents">List & Bundle of Documents</option>
                  <option value="Decree">Decree</option>
                  <option value="Notice of Appeal">Notice of Appeal</option>
                  <option value="Other Pleading">Other Pleading</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Date of Filing</label>
                <input
                  type="date"
                  required
                  value={newFilingDate}
                  onChange={(e) => setNewFilingDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>
            </div>

            {/* CTS E-Filing Ref & Page Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">CTS / E-Filing Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. CTS-2026-NBI-8492"
                  value={newCtsRef}
                  onChange={(e) => setNewCtsRef(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-mono text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Page Count</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 8"
                  value={newPageCount}
                  onChange={(e) => setNewPageCount(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>
            </div>

            {/* Filed By & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Filed By / Counsel</label>
                <input
                  type="text"
                  value={newFiledBy}
                  onChange={(e) => setNewFiledBy(e.target.value)}
                  placeholder="e.g. Adv. Costa Kimathi (Counsel for Plaintiff)"
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Filing Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as FiledDocumentStatus)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
                >
                  <option value="Filed & Endorsed">Filed & Endorsed</option>
                  <option value="Served on Parties">Served on Parties</option>
                  <option value="Listed for Hearing">Listed for Hearing</option>
                  <option value="Pending Assessment">Pending Assessment</option>
                  <option value="Awaiting Response">Awaiting Response</option>
                </select>
              </div>
            </div>

            {/* Prayer / Summary */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Summary of Prayer / Key Relief Sought
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Prayer seeking interlocutory injunction restraining the 1st respondent from transferring LR No. 209/14294 pending hearing and determination..."
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0B63E5] px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs cursor-pointer"
              >
                Save Filed Document
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};
