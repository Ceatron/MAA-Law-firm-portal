import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Eye,
  Check,
  Sparkles,
  Info,
  Code2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Send
} from 'lucide-react';
import { LegalTemplate, TemplateCategory } from '../types';
import { INITIAL_TEMPLATES, TEMPLATE_VARIABLES } from '../data/mockTemplates';
import { TemplateEditorModal } from './TemplateEditorModal';
import { mockMatters, mockClients } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'maa_chambers_legal_templates_v1';

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<LegalTemplate[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved templates:', e);
      }
    }
    return INITIAL_TEMPLATES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<LegalTemplate | null>(null);

  // Quick Test / Render Modal state
  const [testingTemplate, setTestingTemplate] = useState<LegalTemplate | null>(null);
  const [testMatterId, setTestMatterId] = useState(mockMatters[0]?.id || '');
  const [copiedText, setCopiedText] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  // Save templates to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateNew = () => {
    setTemplateToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (tmpl: LegalTemplate) => {
    setTemplateToEdit(tmpl);
    setIsEditorOpen(true);
  };

  const handleDuplicate = (tmpl: LegalTemplate) => {
    const copy: LegalTemplate = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      title: `${tmpl.title} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      isSystemDefault: false,
    };
    setTemplates((prev) => [copy, ...prev]);
    showToast(`Template "${copy.title}" duplicated.`);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the template "${title}"?`)) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast(`Template "${title}" deleted.`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all templates to Firm Workspace default system templates? Any unsaved custom templates will be replaced.')) {
      setTemplates(INITIAL_TEMPLATES);
      showToast('Templates reset to system defaults.');
    }
  };

  const handleSaveTemplate = (savedTmpl: LegalTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === savedTmpl.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTmpl.id ? savedTmpl : t));
      } else {
        return [savedTmpl, ...prev];
      }
    });
    showToast(`Template "${savedTmpl.title}" saved successfully.`);
  };

  // Render substitution for testing modal
  const renderSubstitutedText = (tmpl: LegalTemplate, matterId: string) => {
    const matter = mockMatters.find((m) => m.id === matterId) || mockMatters[0];
    const client = (matter ? mockClients.find((c) => c.name === matter.clientName) : null) || mockClients[0];

    let text = tmpl.content;
    const today = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const substitutions: Record<string, string> = {
      client_name: client?.name || matter?.clientName || '[Client Name]',
      client_address: client?.city || '[Client Address]',
      client_pin: client?.kraPin || '[KRA PIN]',
      client_email: client?.email || '[Client Email]',
      client_phone: client?.phone || '[Client Phone]',
      matter_title: matter?.title || '[Matter Title]',
      matter_ref: matter?.referenceNumber || '[Matter Reference]',
      court_name: matter?.courtRegistry || '[Court / Registry]',
      court_case_number: matter?.courtCaseNumber || '[Case Number]',
      opposing_party: matter?.opposingParty || '[Opposing Party]',
      advocate_assigned: matter?.responsibleAdvocateName || '[Assigned Advocate]',
      claim_amount: (matter?.estimatedFeeKES ? matter.estimatedFeeKES * 12 : 0).toLocaleString(),
      estimated_fee: (matter?.estimatedFeeKES || 0).toLocaleString(),
      firm_name: 'Muthoni Ahago Advocates',
      firm_address: '1st Floor, The Triple Two Address, Along the Eastern Bypass, Ruiru',
      firm_lsk_no: 'LSK/FIRM/2026/0411',
      date_today: today,
    };

    Object.entries(substitutions).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      text = text.replace(regex, val);
    });

    return text;
  };

  const handleCopyTestOutput = () => {
    if (!testingTemplate) return;
    const rendered = renderSubstitutedText(testingTemplate, testMatterId);
    navigator.clipboard.writeText(rendered);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    showToast('Rendered document copied to clipboard!');
  };

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: string[] = ['All', 'Pleading', 'Affidavit', 'Contract', 'Letter / Notice', 'Retainer', 'General'];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-lg bg-[#16181b] px-4 py-3 text-xs text-white shadow-xl border border-blue-500/30 animate-in slide-in-from-bottom duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section Header */}
      <div className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B63E5]/10 text-[#0B63E5]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-title text-lg font-bold text-stone-900">
                Legal Document Structure & Variable Templates
              </h3>
              <p className="text-xs text-stone-600">
                Create, organize, and reuse standardized Kenyan court pleadings, affidavits, agreements & demand notices with dynamic variable insertion.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCheatsheet(!showCheatsheet)}
              className="flex items-center space-x-1.5 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Code2 className="h-4 w-4 text-[#0B63E5]" />
              <span>{showCheatsheet ? 'Hide Variables' : 'Variable Cheatsheet'}</span>
            </button>

            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Template</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-semibold">Total Saved Templates</span>
            <p className="font-serif-title font-bold text-stone-900 text-lg mt-0.5">{templates.length}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-semibold">System Defaults</span>
            <p className="font-serif-title font-bold text-[#0B63E5] text-lg mt-0.5">
              {templates.filter((t) => t.isSystemDefault).length}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-semibold">Firm Workspace Custom</span>
            <p className="font-serif-title font-bold text-emerald-700 text-lg mt-0.5">
              {templates.filter((t) => !t.isSystemDefault).length}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-semibold">Active Dynamic Variables</span>
            <p className="font-serif-title font-bold text-amber-700 text-lg mt-0.5">{TEMPLATE_VARIABLES.length}</p>
          </div>
        </div>
      </div>

      {/* Variable Cheatsheet Drawer */}
      {showCheatsheet && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <span className="font-bold text-stone-900 text-xs flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-[#0B63E5]" />
              <span>Supported Dynamic Variables Cheatsheet ({TEMPLATE_VARIABLES.length})</span>
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              Use syntax: &#123;&#123;variable_name&#125;&#123;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {TEMPLATE_VARIABLES.map((v) => (
              <div key={v.key} className="rounded-lg bg-white p-2.5 border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0B63E5] text-[11px]">
                    &#123;&#123;{v.key}&#125;&#123;
                  </span>
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-600">
                    {v.category}
                  </span>
                </div>
                <p className="text-stone-800 font-semibold text-[11px]">{v.label}</p>
                <p className="text-[10px] text-stone-400 font-mono italic truncate">e.g. {v.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search template title, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-[#dcd8c9] bg-white pl-9 pr-3 py-2 text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#0B63E5] text-white shadow-2xs'
                  : 'bg-white border border-[#dcd8c9] text-stone-700 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs hover:border-[#0B63E5]/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-[#0B63E5]/10 px-2 py-0.5 text-[10px] font-bold text-[#0B63E5]">
                      {tmpl.category}
                    </span>
                    {tmpl.isSystemDefault && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        System Default
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif-title font-bold text-stone-900 text-sm mt-1.5">
                    {tmpl.title}
                  </h4>
                </div>

                <button
                  onClick={() => handleDuplicate(tmpl)}
                  title="Duplicate Template"
                  className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
                {tmpl.description}
              </p>

              {/* Variable Pills */}
              <div className="pt-1">
                <span className="text-[10px] text-stone-400 font-semibold block mb-1">
                  Embedded Variables ({tmpl.variables.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {tmpl.variables.slice(0, 6).map((vKey) => (
                    <span
                      key={vKey}
                      className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-700 border border-stone-200"
                    >
                      &#123;&#123;{vKey}&#125;&#123;
                    </span>
                  ))}
                  {tmpl.variables.length > 6 && (
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500 font-bold">
                      +{tmpl.variables.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-xs">
              <span className="text-[10px] text-stone-400 font-mono">
                Modified: {tmpl.lastModified}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTestingTemplate(tmpl)}
                  className="flex items-center space-x-1 rounded bg-[#0B63E5]/10 px-2.5 py-1 text-[11px] font-bold text-[#0B63E5] hover:bg-[#0B63E5]/20 cursor-pointer transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Test & Use</span>
                </button>

                <button
                  onClick={() => handleEdit(tmpl)}
                  className="flex items-center space-x-1 rounded bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-200 cursor-pointer transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>

                {!tmpl.isSystemDefault && (
                  <button
                    onClick={() => handleDelete(tmpl.id, tmpl.title)}
                    className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    title="Delete Custom Template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center space-y-3">
            <FileText className="h-8 w-8 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-800 text-sm">No Legal Templates Found</p>
            <p className="text-xs text-stone-500">
              Try adjusting your search query or create a new document template.
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0256D0] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Template</span>
            </button>
          </div>
        )}
      </div>

      {/* Reset Defaults Action */}
      <div className="flex items-center justify-between border-t border-[#e2dfd5] pt-4 text-xs">
        <span className="text-stone-500">
          Firm Workspace System Templates are maintained under LSK & Judiciary guidelines.
        </span>
        <button
          onClick={handleResetDefaults}
          className="flex items-center space-x-1 text-stone-500 hover:text-stone-800 hover:underline cursor-pointer font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset System Defaults</span>
        </button>
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTemplate}
        templateToEdit={templateToEdit}
      />

      {/* Test / Use Template Modal */}
      {testingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-[#dedbc5] my-8 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between bg-[#16181b] px-6 py-4 text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0B63E5]">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-100">
                    Test & Render: {testingTemplate.title}
                  </h3>
                  <p className="text-[11px] text-[#60A5FA]">
                    Dynamic Variable Substitution with Active Case File
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTestingTemplate(null)}
                className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
              >
                <Trash2 className="h-0 w-0 hidden" />
                <span className="font-bold text-sm">✕</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-100 p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-stone-800">
                  Select Active Matter to Populate Variables:
                </span>

                <select
                  value={testMatterId}
                  onChange={(e) => setTestMatterId(e.target.value)}
                  className="rounded border border-[#dcd8c9] bg-white px-3 py-1.5 font-bold text-stone-900 focus:outline-none cursor-pointer"
                >
                  {mockMatters.length === 0 && (
                    <option value="">Sample Standard Matter (No Active Matters)</option>
                  )}
                  {mockMatters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.referenceNumber} - {m.title.slice(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-stone-300 bg-[#fdfcf9] p-5 shadow-inner">
                <div className="font-mono text-xs leading-relaxed text-stone-900 whitespace-pre-wrap">
                  {renderSubstitutedText(testingTemplate, testMatterId)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-3 shrink-0 text-xs">
              <button
                onClick={() => setTestingTemplate(null)}
                className="rounded border border-stone-300 px-4 py-2 font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={handleCopyTestOutput}
                className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-5 py-2 font-bold text-white shadow-sm hover:bg-[#0256D0] cursor-pointer"
              >
                {copiedText ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Rendered Document'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
