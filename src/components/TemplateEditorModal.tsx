import React, { useState } from 'react';
import { X, Sparkles, Plus, Check, FileText, Code2, Eye, Info, Copy } from 'lucide-react';
import { LegalTemplate, TemplateCategory, PracticeArea, LegalMatter, Client } from '../types';
import { TEMPLATE_VARIABLES } from '../data/mockTemplates';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: LegalTemplate) => void;
  templateToEdit?: LegalTemplate | null;
  matters?: LegalMatter[];
  clients?: Client[];
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  templateToEdit,
  matters = [],
  clients = [],
}) => {
  const [title, setTitle] = useState(templateToEdit?.title || '');
  const [category, setCategory] = useState<TemplateCategory>(templateToEdit?.category || 'Pleading');
  const [practiceArea, setPracticeArea] = useState<PracticeArea | 'All Practice Areas'>(
    templateToEdit?.practiceArea || 'All Practice Areas'
  );
  const [description, setDescription] = useState(templateToEdit?.description || '');
  const [content, setContent] = useState(templateToEdit?.content || '');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedMatterId, setSelectedMatterId] = useState(matters[0]?.id || '');
  const [copiedPreview, setCopiedPreview] = useState(false);

  if (!isOpen) return null;

  // Insert variable into content
  const handleInsertVariable = (varKey: string) => {
    const varTag = `{{${varKey}}}`;
    setContent((prev) => prev + varTag);
  };

  // Find dynamic variables detected in content
  const detectedVariables = Array.from(content.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)).map(
    (m) => m[1]
  );
  const uniqueDetectedVars = Array.from(new Set(detectedVariables));

  // Render content with real matter data
  const renderSubstitutedContent = () => {
    const matter = matters.find((m) => m.id === selectedMatterId) || matters[0];
    const client = (matter ? clients.find((c) => c.name === matter.clientName) : null) || clients[0];

    let rendered = content;
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
      rendered = rendered.replace(regex, val);
    });

    return rendered;
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(renderSubstitutedContent());
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const updatedTemplate: LegalTemplate = {
      id: templateToEdit?.id || `tmpl-${Date.now()}`,
      title,
      category,
      practiceArea,
      description,
      variables: uniqueDetectedVars,
      content,
      createdDate: templateToEdit?.createdDate || new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      author: templateToEdit?.author || 'Adv. Costa Kimathi',
      isSystemDefault: templateToEdit?.isSystemDefault || false,
    };

    onSave(updatedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-[#dedbc5] my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#16181b] px-6 py-4 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0B63E5]">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif-title text-base font-bold text-stone-100">
                {templateToEdit ? 'Edit Legal Document Template' : 'Create New Legal Document Template'}
              </h2>
              <p className="text-[11px] text-[#60A5FA]">
                Muthoni Ahago Advocates • Dynamic Variable Legal Structures
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-[#e2dfd5] bg-stone-50 px-6 py-2 shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-[#0B63E5] text-white'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Template Structure Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[#0B63E5] text-white'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Live Variable Render Preview</span>
            </button>
          </div>

          <span className="text-[11px] font-mono font-semibold text-stone-500">
            Detected Variables: <strong className="text-[#0B63E5]">{uniqueDetectedVars.length}</strong>
          </span>
        </div>

        {/* Main Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'editor' ? (
            <>
              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">
                    Template Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Commercial Lease Agreement / Notice of Motion"
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 font-semibold text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Document Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 font-semibold text-stone-900 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
                  >
                    <option value="Pleading">Pleading</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Contract">Contract</option>
                    <option value="Letter / Notice">Letter / Notice</option>
                    <option value="Retainer">Retainer</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Practice Area</label>
                  <select
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value as any)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
                  >
                    <option value="All Practice Areas">All Practice Areas</option>
                    <option value="Commercial Litigation">Commercial Litigation</option>
                    <option value="Conveyancing & Real Estate">Conveyancing & Real Estate</option>
                    <option value="Constitutional & Tax">Constitutional & Tax</option>
                    <option value="Employment & Labour">Employment & Labour</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Banking & Finance">Banking & Finance</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of when this legal structure is used..."
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Variable Insertion Toolbar */}
              <div className="rounded-lg border border-[#dcd8c9] bg-[#fbf9f4] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-[#0B63E5]" />
                    <span>Click to Insert Variable Tag into Body Text:</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Format: &#123;&#123;variable_name&#125;&#123;
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      title={`Insert {{${v.key}}} - ${v.label} (Example: ${v.example})`}
                      className="inline-flex items-center space-x-1 rounded bg-white px-2 py-1 border border-stone-300 hover:border-[#0B63E5] hover:bg-blue-50 text-[11px] font-mono text-stone-800 hover:text-[#0B63E5] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3 w-3 text-[#0B63E5]" />
                      <span className="font-bold">{v.key}</span>
                      <span className="text-[9px] text-stone-400">({v.category})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Body Editor */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Legal Document Text Structure <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={14}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type or paste legal document structure here. Use variables like {{client_name}}, {{court_name}}, {{matter_title}}..."
                  className="w-full rounded-md border border-[#dcd8c9] bg-white p-3 font-mono text-xs leading-relaxed text-stone-900 focus:border-[#0B63E5] focus:outline-none shadow-inner"
                />
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-100 p-3 rounded-lg border border-stone-200">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-[#0B63E5] shrink-0" />
                  <span className="font-bold text-stone-800">
                    Test Variable Substitution with Case File:
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedMatterId}
                    onChange={(e) => setSelectedMatterId(e.target.value)}
                    className="rounded border border-[#dcd8c9] bg-white px-3 py-1.5 font-bold text-stone-900 focus:outline-none cursor-pointer"
                  >
                    {matters.length === 0 && (
                      <option value="">Sample Standard Matter (No Active Matters)</option>
                    )}
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.referenceNumber} - {m.title.slice(0, 35)}...
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="flex items-center space-x-1 rounded bg-stone-800 px-3 py-1.5 font-bold text-white hover:bg-stone-900 cursor-pointer shrink-0"
                  >
                    {copiedPreview ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPreview ? 'Copied!' : 'Copy Draft'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#dcd8c9] bg-white p-6 shadow-sm">
                <div className="border-b border-stone-200 pb-3 mb-4 flex items-center justify-between">
                  <h4 className="font-serif-title font-bold text-stone-900 text-sm">
                    {title || 'Untitled Legal Document Template'}
                  </h4>
                  <span className="rounded bg-[#0B63E5]/10 text-[#0B63E5] px-2.5 py-0.5 text-[10px] font-bold">
                    {category}
                  </span>
                </div>

                <div className="font-mono text-xs leading-relaxed text-stone-900 whitespace-pre-wrap bg-stone-50/50 p-4 rounded-lg border border-stone-200">
                  {renderSubstitutedContent()}
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-stone-300 px-4 py-2 font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 rounded-md bg-[#0B63E5] px-6 py-2 font-bold text-white shadow-sm hover:bg-[#0256D0] cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Save Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
