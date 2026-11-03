import React, { useState } from 'react';
import {
  FileText,
  Star,
  Check,
  Edit2,
  Eye,
  Plus,
  Settings as SettingsIcon,
  Filter,
  Palette,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PdfTemplateConfig, PdfDocumentCategory, ChambersSettings } from '../../types';
import { PdfTemplateEditorModal } from './PdfTemplateEditorModal';
import { PdfTemplatePreviewModal } from './PdfTemplatePreviewModal';

interface PdfTemplateManagerProps {
  settings: ChambersSettings;
  onUpdateSettings: (newSettings: ChambersSettings) => void;
  showToast: (msg: string) => void;
}

const CATEGORIES: { id: PdfDocumentCategory; label: string; count?: number }[] = [
  { id: 'quotes', label: 'Quotes' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'sales-receipts', label: 'Sales Receipts' },
  { id: 'credit-notes', label: 'Credit Notes' },
  { id: 'payment-receipts', label: 'Payment Receipts' },
  { id: 'customer-statements', label: 'Customer Statements' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'vendor-statements', label: 'Vendor Statements' },
  { id: 'journals', label: 'Journals' },
];

export const PdfTemplateManager: React.FC<PdfTemplateManagerProps> = ({
  settings,
  onUpdateSettings,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PdfDocumentCategory>('invoices');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Default' | 'Active'>('All');

  // Modals state
  const [editingTemplate, setEditingTemplate] = useState<PdfTemplateConfig | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<PdfTemplateConfig | null>(null);

  const customization = settings.customization || {
    selectedTemplates: {},
    customTemplates: [],
    transactionSeries: {} as any,
    emailNotifications: {} as any,
  };

  const templatesList: PdfTemplateConfig[] = customization.customTemplates || [];

  // Active default template ID for current category
  const activeDefaultId =
    customization.selectedTemplates?.[selectedCategory] ||
    templatesList.find((t) => t.category === selectedCategory && t.isDefault)?.id ||
    '';

  // Filter templates for current category
  const categoryTemplates = templatesList.filter((t) => t.category === selectedCategory);

  const filteredTemplates = categoryTemplates.filter((t) => {
    const isDef = t.id === activeDefaultId || t.isDefault;
    if (statusFilter === 'Default') return isDef;
    if (statusFilter === 'Active') return t.status === 'active';
    return true;
  });

  const handleSetDefault = (templateId: string) => {
    const targetTpl = templatesList.find((t) => t.id === templateId);
    if (!targetTpl) return;

    const updatedTemplates = templatesList.map((t) => {
      if (t.category === selectedCategory) {
        return {
          ...t,
          isDefault: t.id === templateId,
        };
      }
      return t;
    });

    const updatedSettings: ChambersSettings = {
      ...settings,
      customization: {
        ...customization,
        selectedTemplates: {
          ...customization.selectedTemplates,
          [selectedCategory]: templateId,
        },
        customTemplates: updatedTemplates,
      },
    };

    onUpdateSettings(updatedSettings);
    showToast(`"${targetTpl.name}" is now the default template for ${selectedCategory.replace(/-/g, ' ')}!`);
  };

  const handleSaveTemplate = (updated: PdfTemplateConfig, setAsDefault?: boolean) => {
    const exists = templatesList.some((t) => t.id === updated.id);
    let updatedList: PdfTemplateConfig[];

    if (exists) {
      updatedList = templatesList.map((t) => (t.id === updated.id ? updated : t));
    } else {
      updatedList = [...templatesList, updated];
    }

    let newSelectedTemplates = { ...(customization.selectedTemplates || {}) };

    if (setAsDefault) {
      newSelectedTemplates[selectedCategory] = updated.id;
      updatedList = updatedList.map((t) => {
        if (t.category === selectedCategory) {
          return { ...t, isDefault: t.id === updated.id };
        }
        return t;
      });
    }

    const updatedSettings: ChambersSettings = {
      ...settings,
      customization: {
        ...customization,
        selectedTemplates: newSelectedTemplates,
        customTemplates: updatedList,
      },
    };

    onUpdateSettings(updatedSettings);
    showToast(`Template "${updated.name}" saved successfully.`);
  };

  const handleCreateNewTemplate = () => {
    const newId = `tpl-${selectedCategory.slice(0, 3)}-${Date.now().toString(36)}`;
    const newTpl: PdfTemplateConfig = {
      id: newId,
      name: `Custom ${selectedCategory.replace(/-/g, ' ')} Template`,
      category: selectedCategory,
      isDefault: false,
      accentColor: '#0098db',
      fontFamily: 'helvetica',
      headerStyle: 'standard',
      showBankDetails: true,
      showTermsAndConditions: true,
      showTaxColumn: true,
      showDiscountColumn: true,
      showWatermarkWhenPaid: true,
      showSignatureBlock: false,
      status: 'active',
    };
    setEditingTemplate(newTpl);
  };

  const currentCategoryLabel =
    CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Invoice';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[580px]">
      {/* Left Sidebar: Document Categories (matches image_0d8598d1.png) */}
      <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-3 sm:p-4 flex flex-col justify-between">
        <div>
          <div className="px-3 py-2 text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Templates</span>
          </div>

          <nav className="mt-2 space-y-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = templatesList.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-[#0070ba] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-blue-100 text-[#0070ba]' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] text-slate-500 px-3">
          <p className="leading-tight">
            Selected default template is automatically used for PDF downloads & previews.
          </p>
        </div>
      </div>

      {/* Right Main Content Area: Templates Gallery (matches image_0d8598d1.png) */}
      <div className="flex-1 flex flex-col p-5 sm:p-6 bg-white overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h3 className="text-xl font-serif-title font-bold text-slate-900 flex items-center space-x-2">
              <span>{currentCategoryLabel} Templates</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or customize the template layout used for generating {currentCategoryLabel.toLowerCase()} PDFs
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCreateNewTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0070ba] hover:bg-[#005a96] rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
          </div>
        </div>

        {/* Filter Row (matches image_0d8598d1.png: "Status : All") */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status :</span>
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0070ba] cursor-pointer shadow-2xs"
            >
              <option value="All">All</option>
              <option value="Default">Default</option>
              <option value="Active">Active</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{filteredTemplates.length}</span> templates
          </div>
        </div>

        {/* Templates Grid (matches image_0d8598d1.png card layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-6 overflow-y-auto">
          {filteredTemplates.map((template) => {
            const isDefault = template.id === activeDefaultId || template.isDefault;

            return (
              <div
                key={template.id}
                className={`group relative flex flex-col rounded-xl border transition-all duration-150 bg-white overflow-hidden ${
                  isDefault
                    ? 'border-[#0070ba] shadow-md ring-1 ring-[#0070ba]/30'
                    : 'border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-sm'
                }`}
              >
                {/* Visual Thumbnail Sheet (Realistic mini document) */}
                <div
                  onClick={() => setPreviewingTemplate(template)}
                  className="relative aspect-[3/4] bg-slate-50/80 p-3.5 border-b border-slate-200 flex flex-col justify-between cursor-pointer overflow-hidden transition-all group-hover:bg-slate-100/60"
                >
                  {/* Miniature Document Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      {/* Logo Icon */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-2xs"
                        style={{ backgroundColor: template.accentColor }}
                      >
                        Z
                      </div>
                      {/* Header Title */}
                      <div className="text-right">
                        <div
                          className="text-[9px] font-bold uppercase tracking-tight"
                          style={{ color: template.accentColor }}
                        >
                          {template.headerStyle === 'tax-invoice'
                            ? 'TAX INVOICE'
                            : template.headerStyle === 'paid-invoice'
                            ? 'PAID INVOICE'
                            : template.headerStyle === 'classic-law'
                            ? 'BILL OF COSTS'
                            : 'INVOICE'}
                        </div>
                        <div className="text-[7px] text-slate-400"># INV-17</div>
                        <div className="text-[7px] font-bold text-slate-700">Rs.4,662.75</div>
                      </div>
                    </div>

                    {/* Metadata lines */}
                    <div className="text-[6.5px] text-slate-400 leading-tight space-y-0.5">
                      <div className="w-16 h-1 bg-slate-200 rounded"></div>
                      <div className="w-12 h-1 bg-slate-200 rounded"></div>
                    </div>
                  </div>

                  {/* Miniature Items Table */}
                  <div className="my-2 space-y-1">
                    <div
                      className="h-3 rounded-xs text-[6.5px] text-white flex items-center px-1 font-bold"
                      style={{ backgroundColor: template.accentColor }}
                    >
                      <span>Item & Description</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[6.5px] text-slate-600 border-b border-slate-100 py-0.5">
                        <span className="w-20 truncate">Brochure Design</span>
                        <span className="font-mono">150.00</span>
                      </div>
                      <div className="flex justify-between text-[6.5px] text-slate-600 border-b border-slate-100 py-0.5">
                        <span className="w-20 truncate">Web Design Package</span>
                        <span className="font-mono">250.00</span>
                      </div>
                      <div className="flex justify-between text-[6.5px] text-slate-600 py-0.5">
                        <span className="w-20 truncate">Print Ad - Color</span>
                        <span className="font-mono">35.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Miniature Totals & Footer */}
                  <div className="space-y-1 text-[6.5px]">
                    <div className="flex justify-end">
                      <div className="w-20 space-y-0.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Sub Total:</span>
                          <span>435.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-700 border-t border-slate-200 pt-0.5">
                          <span>Total:</span>
                          <span>Rs.466.75</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 text-[6px] text-slate-400 text-center truncate">
                      Thanks for your business &bull; Terms apply
                    </div>
                  </div>

                  {/* Watermark Stamp Preview if Paid */}
                  {template.headerStyle === 'paid-invoice' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-emerald-600/40 text-emerald-600/60 font-black text-xs px-2 py-0.5 rounded rotate-[-20deg] tracking-widest uppercase">
                        PAID
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay with Quick Preview Action */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewingTemplate(template);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-bold shadow-md hover:bg-slate-50 flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemplate(template);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0070ba] text-white text-xs font-bold shadow-md hover:bg-[#005a96] flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Customize</span>
                    </button>
                  </div>
                </div>

                {/* Card Bottom Meta (matches image_0d8598d1.png) */}
                <div className="p-3 bg-white space-y-2">
                  {/* Default Badge if default */}
                  {isDefault ? (
                    <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>DEFAULT</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(template.id)}
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-500 hover:text-[#0070ba] transition-colors cursor-pointer"
                    >
                      <Star className="w-3 h-3 text-slate-400" />
                      <span>Set as Default</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={template.name}>
                      {template.name}
                    </h4>

                    {/* Color dot */}
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white"
                      style={{ backgroundColor: template.accentColor }}
                      title={`Accent: ${template.accentColor}`}
                    />
                  </div>

                  {/* Actions Row */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewingTemplate(template)}
                      className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      View Full
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTemplate(template)}
                      className="text-[#0070ba] hover:text-[#005a96] font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Template Placeholder Card */}
          <div
            onClick={handleCreateNewTemplate}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0070ba] hover:bg-blue-50/20 p-8 text-center cursor-pointer transition-all aspect-[3/4]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center mb-3">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">Create New Template</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
              Design custom colors, typography and headers for {currentCategoryLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <PdfTemplateEditorModal
        isOpen={Boolean(editingTemplate)}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
        category={selectedCategory}
        onSave={handleSaveTemplate}
      />

      {/* Preview Modal */}
      <PdfTemplatePreviewModal
        isOpen={Boolean(previewingTemplate)}
        onClose={() => setPreviewingTemplate(null)}
        template={previewingTemplate}
        settings={settings}
        onSetDefault={(id) => {
          handleSetDefault(id);
          setPreviewingTemplate((prev) => (prev && prev.id === id ? { ...prev, isDefault: true } : prev));
        }}
      />
    </div>
  );
};
