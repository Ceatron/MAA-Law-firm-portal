import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Eye,
  Check,
  Sparkles,
  RotateCcw,
  BookOpen,
  DollarSign,
  Tag,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  Percent,
} from 'lucide-react';
import {
  FeeNoteTemplate,
  StandardServiceItem,
  PracticeArea,
} from '../types';
import {
  loadFeeNoteTemplates,
  saveFeeNoteTemplates,
  resetFeeNoteTemplates,
  loadStandardServiceSnippets,
  saveStandardServiceSnippets,
  resetStandardServiceSnippets,
} from '../utils/feeNoteTemplatesStorage';
import { FeeNoteTemplateEditorModal } from './FeeNoteTemplateEditorModal';
import { CompanyLogo } from './CompanyLogo';
import { loadChambersSettings } from '../utils/settingsStorage';

export const FeeNoteTemplateManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'packages' | 'services'>('packages');
  const [templates, setTemplates] = useState<FeeNoteTemplate[]>(() =>
    loadFeeNoteTemplates()
  );
  const [services, setServices] = useState<StandardServiceItem[]>(() =>
    loadStandardServiceSnippets()
  );
  const [settings] = useState(() => loadChambersSettings());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals & Drawers
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<FeeNoteTemplate | null>(null);

  // Quick Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<FeeNoteTemplate | null>(null);

  // Single Standard Service Item Editor state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<StandardServiceItem | null>(null);
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Professional Fees');
  const [servicePrice, setServicePrice] = useState<number>(25000);
  const [serviceTaxable, setServiceTaxable] = useState(true);
  const [serviceStatRef, setServiceStatRef] = useState('');
  const [servicePracticeArea, setServicePracticeArea] = useState<
    PracticeArea | 'All Practice Areas'
  >('All Practice Areas');

  // Expanded items in card view
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Record<string, boolean>>({});

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync templates & services
  const handleSaveTemplate = (savedTmpl: FeeNoteTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === savedTmpl.id);
      const updated = exists
        ? prev.map((t) => (t.id === savedTmpl.id ? savedTmpl : t))
        : [savedTmpl, ...prev];
      saveFeeNoteTemplates(updated);
      return updated;
    });
    showToast(`Fee note template "${savedTmpl.title}" saved successfully!`);
  };

  const handleDuplicateTemplate = (tmpl: FeeNoteTemplate) => {
    const copy: FeeNoteTemplate = {
      ...tmpl,
      id: `fnt-${Date.now()}`,
      title: `${tmpl.title} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      isSystemDefault: false,
    };
    const updated = [copy, ...templates];
    setTemplates(updated);
    saveFeeNoteTemplates(updated);
    showToast(`Template "${copy.title}" duplicated.`);
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    if (window.confirm(`Delete the Fee Note template "${title}"?`)) {
      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      saveFeeNoteTemplates(updated);
      showToast(`Template "${title}" deleted.`);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Reset all Fee Note templates and Standard Legal Service descriptions to Kenyan Firm Workspace defaults?'
      )
    ) {
      const resTmpl = resetFeeNoteTemplates();
      const resSvc = resetStandardServiceSnippets();
      setTemplates(resTmpl);
      setServices(resSvc);
      showToast('Fee note templates and standard services reset to firm defaults.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTemplateIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Service item CRUD
  const handleOpenNewServiceModal = () => {
    setServiceToEdit(null);
    setServiceDesc('');
    setServiceCategory('Professional Fees');
    setServicePrice(25000);
    setServiceTaxable(true);
    setServiceStatRef('ARO Schedule 6');
    setServicePracticeArea('All Practice Areas');
    setIsServiceModalOpen(true);
  };

  const handleOpenEditServiceModal = (svc: StandardServiceItem) => {
    setServiceToEdit(svc);
    setServiceDesc(svc.description);
    setServiceCategory(svc.category);
    setServicePrice(svc.unitPriceKES);
    setServiceTaxable(svc.isTaxable);
    setServiceStatRef(svc.statutoryReference || '');
    setServicePracticeArea(svc.practiceArea || 'All Practice Areas');
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceDesc.trim()) {
      alert('Please enter a description for the legal service.');
      return;
    }

    const item: StandardServiceItem = {
      id: serviceToEdit?.id || `svc-${Date.now()}`,
      description: serviceDesc.trim(),
      category: serviceCategory,
      unitPriceKES: Math.max(0, Number(servicePrice) || 0),
      isTaxable: serviceTaxable,
      statutoryReference: serviceStatRef.trim() || undefined,
      practiceArea: servicePracticeArea,
    };

    let updated: StandardServiceItem[];
    if (serviceToEdit) {
      updated = services.map((s) => (s.id === item.id ? item : s));
    } else {
      updated = [item, ...services];
    }

    setServices(updated);
    saveStandardServiceSnippets(updated);
    setIsServiceModalOpen(false);
    showToast(`Standard service "${item.description.slice(0, 30)}..." saved.`);
  };

  const handleDeleteService = (id: string, desc: string) => {
    if (window.confirm(`Delete the standard service description "${desc}"?`)) {
      const updated = services.filter((s) => s.id !== id);
      setServices(updated);
      saveStandardServiceSnippets(updated);
      showToast('Standard service description deleted.');
    }
  };

  // Filtered lists
  const filteredTemplates = templates.filter((tmpl) => {
    const matchesSearch =
      tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.items.some((it) =>
        it.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (tmpl.tags &&
        tmpl.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesPA =
      selectedPracticeArea === 'All' ||
      tmpl.practiceArea === selectedPracticeArea ||
      tmpl.practiceArea === 'All Practice Areas';

    return matchesSearch && matchesPA;
  });

  const filteredServices = services.filter((svc) => {
    const matchesSearch =
      svc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (svc.statutoryReference &&
        svc.statutoryReference
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'All' || svc.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const allPracticeAreas = [
    'All',
    'Civil Litigation',
    'Commercial Law',
    'Conveyancing Law',
    'Constitutional & Tax',
    'Succession Law',
    'Employment & Labour',
    'Intellectual Property',
    'Bank Securities',
  ];

  const allCategories = [
    'All',
    'Professional Fees',
    'Drafting Pleading',
    'Court Filing / CTS',
    'Legal Research',
    'Consultation',
    'Disbursement',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 rounded-xl bg-[#132c3f] px-4 py-3 text-xs font-semibold text-white shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Metrics Overview */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0070ba]">
                <Receipt className="h-4 w-4" />
              </div>
              <h3 className="font-serif-title text-base font-bold text-stone-900">
                Fee Note Templates & Standardized Legal Descriptions
              </h3>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Create and manage reusable fee note packages, ARO remuneration rates, and standardized statutory service descriptions for 1-click billing.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer shadow-2xs"
              title="Reset templates to Firm Workspace default presets"
            >
              <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
              <span>Reset Standards</span>
            </button>

            {activeTab === 'packages' ? (
              <button
                type="button"
                onClick={() => {
                  setTemplateToEdit(null);
                  setIsEditorOpen(true);
                }}
                className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] hover:bg-[#005a96] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Fee Note Template</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenNewServiceModal}
                className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] hover:bg-[#005a96] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Standard Service</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
            <span className="text-[11px] text-stone-500 block">Fee Note Packages</span>
            <span className="text-lg font-bold text-[#132c3f] mt-0.5 block">
              {templates.length} Active Templates
            </span>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
            <span className="text-[11px] text-stone-500 block">Service Descriptions</span>
            <span className="text-lg font-bold text-[#0070ba] mt-0.5 block">
              {services.length} Standard Items
            </span>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
            <span className="text-[11px] text-stone-500 block">VAT Policy Engine</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              16% VAT + Exempt Filings
            </span>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
            <span className="text-[11px] text-stone-500 block">Statutory Compliance</span>
            <span className="text-xs font-bold text-stone-800 mt-1">
              LSK / ARO Order Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Section Toggle & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Toggle between Package Templates and Single Standard Service Items */}
        <div className="inline-flex rounded-xl bg-stone-200/70 p-1 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition cursor-pointer ${
              activeTab === 'packages'
                ? 'bg-white text-[#132c3f] shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="h-4 w-4 text-[#0070ba]" />
            <span>Complete Fee Note Packages ({templates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition cursor-pointer ${
              activeTab === 'services'
                ? 'bg-white text-[#132c3f] shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="h-4 w-4 text-[#0070ba]" />
            <span>Standard Legal Descriptions Library ({services.length})</span>
          </button>
        </div>

        {/* Search & Practice Area / Category filters */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'packages'
                  ? 'Search templates by title, description or items...'
                  : 'Search standard legal service descriptions...'
              }
              className="w-full rounded-xl border border-stone-300 bg-white pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
            />
          </div>

          {activeTab === 'packages' ? (
            <select
              value={selectedPracticeArea}
              onChange={(e) => setSelectedPracticeArea(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shrink-0"
            >
              {allPracticeAreas.map((pa) => (
                <option key={pa} value={pa}>
                  {pa === 'All' ? 'All Practice Areas' : pa}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shrink-0"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: COMPLETE FEE NOTE PACKAGES */}
      {/* ========================================================= */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-xs text-stone-500 space-y-3">
              <Receipt className="h-8 w-8 text-stone-400 mx-auto" />
              <p className="font-semibold text-stone-700">
                No fee note templates matching your search criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPracticeArea('All');
                }}
                className="text-[#0070ba] font-bold hover:underline cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTemplates.map((tmpl) => {
                const isExpanded = Boolean(expandedTemplateIds[tmpl.id]);
                const taxableSub = tmpl.items
                  .filter((it) => it.isTaxable)
                  .reduce(
                    (sum, it) =>
                      sum + (it.unitPriceKES || 0) * (it.quantity || 1),
                    0
                  );
                const exemptSub = tmpl.items
                  .filter((it) => !it.isTaxable)
                  .reduce(
                    (sum, it) =>
                      sum + (it.unitPriceKES || 0) * (it.quantity || 1),
                    0
                  );
                const netTotal = taxableSub + exemptSub;
                const vatTotal = Math.round(taxableSub * 0.16);
                const grossTotal = netTotal + vatTotal;

                return (
                  <div
                    key={tmpl.id}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:shadow-xs transition space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-[#132c3f]">
                            {tmpl.title}
                          </h4>
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-[#0070ba]">
                            {tmpl.practiceArea}
                          </span>
                          {tmpl.isSystemDefault && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                              Firm Workspace Preset
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-600">
                          {tmpl.description}
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-1">
                          <span>
                            Author: <strong>{tmpl.author}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Items: <strong>{tmpl.items.length} Standard Services</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Updated: {tmpl.lastModified}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(tmpl)}
                          className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
                          title="Preview Sample Fee Note"
                        >
                          <Eye className="h-3.5 w-3.5 text-stone-500" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateTemplate(tmpl)}
                          className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
                          title="Duplicate Template"
                        >
                          <Copy className="h-3.5 w-3.5 text-stone-500" />
                          <span>Copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTemplateToEdit(tmpl);
                            setIsEditorOpen(true);
                          }}
                          className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-white hover:bg-blue-50 text-[#0070ba] px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>

                        {!tmpl.isSystemDefault && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTemplate(tmpl.id, tmpl.title)
                            }
                            className="rounded-lg border border-stone-200 bg-white hover:bg-red-50 text-red-600 p-1.5 text-xs font-semibold transition cursor-pointer"
                            title="Delete Template"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial Estimates Bar */}
                    <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase block font-bold">
                            Net Fees
                          </span>
                          <span className="font-mono font-bold text-stone-800">
                            KES {netTotal.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-stone-500 uppercase block font-bold">
                            16% VAT Est.
                          </span>
                          <span className="font-mono font-bold text-stone-700">
                            KES {vatTotal.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-stone-500 uppercase block font-bold">
                            Gross Total
                          </span>
                          <span className="font-mono font-bold text-[#0070ba]">
                            KES {grossTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(tmpl.id)}
                        className="flex items-center space-x-1 text-xs font-bold text-[#0070ba] hover:underline cursor-pointer"
                      >
                        <span>
                          {isExpanded ? 'Hide Line Items' : `View ${tmpl.items.length} Standard Services`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Expandable Line Items Table */}
                    {isExpanded && (
                      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden text-xs animate-in fade-in duration-150">
                        <table className="w-full text-left">
                          <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Standard Legal Service Description</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Statutory Scale Ref</th>
                              <th className="py-2.5 px-3 text-right">Rate (KES)</th>
                              <th className="py-2.5 px-3 text-center">VAT Policy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {tmpl.items.map((it, idx) => (
                              <tr key={it.id} className="hover:bg-stone-50/50">
                                <td className="py-2.5 px-3 font-mono text-stone-400 font-bold">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-stone-900">
                                  {it.description}
                                </td>
                                <td className="py-2.5 px-3 text-stone-600">
                                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold">
                                    {it.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[10px] text-stone-500">
                                  {it.statutoryReference || '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-stone-800 text-right">
                                  KES {it.unitPriceKES.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                      it.isTaxable
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-stone-200 text-stone-700'
                                    }`}
                                  >
                                    {it.isTaxable ? '+16% VAT' : 'Exempt'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {tmpl.defaultNotes && (
                          <div className="bg-stone-50/70 p-3 border-t border-stone-200 text-[11px] text-stone-600">
                            <span className="font-bold text-stone-700">Default Notes: </span>
                            {tmpl.defaultNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: STANDARDIZED LEGAL SERVICE DESCRIPTIONS CATALOG */}
      {/* ========================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Particulars & Legal Service Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Statutory Scale / ARO Ref</th>
                  <th className="py-3 px-3 text-right">Standard Rate (KES)</th>
                  <th className="py-3 px-3 text-center">Tax Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-medium text-stone-900">
                      <div className="space-y-0.5">
                        <span className="block">{svc.description}</span>
                        {svc.practiceArea && (
                          <span className="text-[10px] text-stone-400 font-normal">
                            Practice: {svc.practiceArea}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                        {svc.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[10px] text-stone-500">
                      {svc.statutoryReference || '—'}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-stone-800 text-right">
                      KES {svc.unitPriceKES.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          svc.isTaxable
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {svc.isTaxable ? '16% VAT' : 'Exempt / Zero-Rated'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditServiceModal(svc)}
                          className="rounded p-1 text-[#0070ba] hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Service Description"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteService(svc.id, svc.description)
                          }
                          className="rounded p-1 text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Service Description"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal for Full Fee Note Template */}
      {isEditorOpen && (
        <FeeNoteTemplateEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setTemplateToEdit(null);
          }}
          templateToEdit={templateToEdit}
          onSave={handleSaveTemplate}
          standardServices={services}
        />
      )}

      {/* Single Standard Service Description Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-200 bg-[#132c3f] px-5 py-3.5 text-white">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <h4 className="text-sm font-bold">
                  {serviceToEdit
                    ? 'Edit Standard Legal Service Description'
                    : 'Add Standard Legal Service Description'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Legal Service Particulars & Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="e.g. Legal Representation & Lead Counsel Appearance before High Court / Tribunal"
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => {
                      setServiceCategory(e.target.value);
                      if (
                        e.target.value === 'Court Filing / CTS' ||
                        e.target.value === 'Disbursement'
                      ) {
                        setServiceTaxable(false);
                      } else {
                        setServiceTaxable(true);
                      }
                    }}
                    className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs text-stone-900"
                  >
                    {allCategories
                      .filter((c) => c !== 'All')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Standard Rate (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={servicePrice}
                    onChange={(e) =>
                      setServicePrice(parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs font-mono font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Practice Area
                  </label>
                  <select
                    value={servicePracticeArea}
                    onChange={(e) =>
                      setServicePracticeArea(
                        e.target.value as PracticeArea | 'All Practice Areas'
                      )
                    }
                    className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs text-stone-900"
                  >
                    {allPracticeAreas.map((pa) => (
                      <option key={pa} value={pa}>
                        {pa === 'All' ? 'All Practice Areas' : pa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Tax Status (VAT)
                  </label>
                  <label className="flex items-center space-x-2 rounded-lg border border-stone-300 bg-white p-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={serviceTaxable}
                      onChange={(e) => setServiceTaxable(e.target.checked)}
                      className="rounded text-[#0070ba]"
                    />
                    <span className="text-stone-800 font-semibold">
                      {serviceTaxable ? '+16% VAT' : 'Tax Exempt'}
                    </span>
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">
                    Statutory / ARO Remuneration Reference
                  </label>
                  <input
                    type="text"
                    value={serviceStatRef}
                    onChange={(e) => setServiceStatRef(e.target.value)}
                    placeholder="e.g. Advocates (Remuneration) Order Schedule 6 Item 1"
                    className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#0070ba] hover:bg-[#005a96] px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Save Standard Description
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Preview Modal for Fee Note Template */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 bg-[#132c3f] px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Sample Fee Note Preview: {previewTemplate.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Letterhead Preview */}
            <div className="p-6 space-y-6 text-xs bg-[#fdfcfb]">
              <div className="border-b-2 border-[#132c3f] pb-4 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <CompanyLogo
                    logoUrl={settings.logoUrl}
                    firmName={settings.firmName}
                    size="md"
                  />
                  <div>
                    <h2 className="font-serif-title text-base font-bold text-[#132c3f]">
                      {settings.firmName}
                    </h2>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                      Advocates, Commissioners for Oaths & Notaries Public
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      {settings.physicalAddress} • LSK Reg: {settings.lskFirmRegNo}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded bg-[#132c3f] text-white px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider uppercase">
                    TAX FEE NOTE
                  </span>
                  <p className="font-mono text-xs font-bold text-[#0070ba] mt-1.5">
                    MAA-FN-2026-SAMPLE
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Date: {new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              {/* Sample Client & Matter Section */}
              <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    INSTRUCTING CLIENT
                  </span>
                  <p className="font-bold text-stone-800 text-xs mt-0.5">
                    Sample Client (e.g. Safaricom PLC / Individual Client)
                  </p>
                  <p className="text-[11px] text-stone-500">KRA PIN: P0512839401Z</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    MATTER & TEMPLATE PARTICULAR
                  </span>
                  <p className="font-bold text-stone-800 text-xs mt-0.5">
                    {previewTemplate.title}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Practice Area: {previewTemplate.practiceArea}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Particulars of Legal Service</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Net (KES)</th>
                      <th className="py-2 px-3 text-right">16% VAT</th>
                      <th className="py-2 px-3 text-right">Gross (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {previewTemplate.items.map((it, idx) => {
                      const net = (it.unitPriceKES || 0) * (it.quantity || 1);
                      const vat = it.isTaxable ? Math.round(net * 0.16) : 0;
                      const gross = net + vat;

                      return (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-mono text-stone-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-stone-900">
                            <div>{it.description}</div>
                            {it.statutoryReference && (
                              <div className="text-[9px] font-mono text-stone-400">
                                {it.statutoryReference}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-stone-500 text-[10px]">
                            {it.category}
                          </td>
                          <td className="py-2 px-3 font-mono text-right text-stone-700">
                            {net.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono text-right text-stone-500">
                            {it.isTaxable ? vat.toLocaleString() : 'Exempt'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-[#0070ba]">
                            {gross.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes & Bank Details */}
              <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-stone-800 text-[11px] block">
                  Firm Workspace Settlement Terms & Instructions:
                </span>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  {previewTemplate.defaultNotes}
                </p>
                <div className="text-[10px] text-stone-500 border-t border-stone-100 pt-2 flex flex-wrap gap-4">
                  <span>Bank: <strong>{settings.bankDetails.bankName}</strong></span>
                  <span>A/C No: <strong>{settings.bankDetails.accountNumber}</strong></span>
                  <span>Paybill: <strong>{settings.bankDetails.paybillNumber}</strong></span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 bg-stone-50 px-6 py-3 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                This is a sample rendering using live chambers settings.
              </span>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg bg-[#132c3f] hover:bg-[#0b1b27] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
