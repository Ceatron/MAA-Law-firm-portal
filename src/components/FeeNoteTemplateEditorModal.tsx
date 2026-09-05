import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle,
  Percent,
  Sparkles,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import {
  FeeNoteTemplate,
  FeeNoteLineItemTemplate,
  PracticeArea,
  StandardServiceItem,
} from '../types';
import { INITIAL_STANDARD_SERVICES } from '../data/mockFeeNoteTemplates';
import { DraggableModal } from './common/DraggableModal';

interface FeeNoteTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit: FeeNoteTemplate | null;
  onSave: (template: FeeNoteTemplate) => void;
  standardServices?: StandardServiceItem[];
}

const PRACTICE_AREAS: (PracticeArea | 'All Practice Areas')[] = [
  'All Practice Areas',
  'Civil Litigation',
  'Commercial Law',
  'Conveyancing Law',
  'Constitutional & Tax',
  'Succession Law',
  'Employment & Labour',
  'Intellectual Property',
  'Bank Securities',
];

const ITEM_CATEGORIES = [
  'Professional Fees',
  'Drafting Pleading',
  'Court Filing / CTS',
  'Legal Research',
  'Consultation',
  'Disbursement',
  'Other',
];

export const FeeNoteTemplateEditorModal: React.FC<
  FeeNoteTemplateEditorModalProps
> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSave,
  standardServices = INITIAL_STANDARD_SERVICES,
}) => {
  const isEditing = Boolean(templateToEdit);

  const [title, setTitle] = useState(templateToEdit?.title || '');
  const [description, setDescription] = useState(
    templateToEdit?.description || ''
  );
  const [practiceArea, setPracticeArea] = useState<
    PracticeArea | 'All Practice Areas'
  >(templateToEdit?.practiceArea || 'Civil Litigation');
  const [author, setAuthor] = useState(
    templateToEdit?.author || 'Adv. Costa Kimathi'
  );
  const [defaultNotes, setDefaultNotes] = useState(
    templateToEdit?.defaultNotes ||
      'Professional fees are assessed in compliance with the Advocates (Remuneration) Order. Statutory disbursements and Judiciary CTS filing fees are non-taxable and exempt from 16% VAT. Payment terms are 14 calendar days upon issuance.'
  );
  const [tagsInput, setTagsInput] = useState(
    templateToEdit?.tags?.join(', ') || ''
  );

  const [items, setItems] = useState<FeeNoteLineItemTemplate[]>(() => {
    if (templateToEdit && templateToEdit.items.length > 0) {
      return templateToEdit.items;
    }
    return [
      {
        id: `item-${Date.now()}-1`,
        description: 'Professional Legal Counsel & Case Strategy Formulation',
        category: 'Professional Fees',
        quantity: 1,
        unitPriceKES: 45000,
        isTaxable: true,
        statutoryReference: 'ARO Schedule 6',
      },
      {
        id: `item-${Date.now()}-2`,
        description:
          'Drafting of Pleadings, Affidavits & Supporting Documents',
        category: 'Drafting Pleading',
        quantity: 1,
        unitPriceKES: 35000,
        isTaxable: true,
        statutoryReference: 'ARO Schedule 6 Item 1',
      },
      {
        id: `item-${Date.now()}-3`,
        description:
          'Judiciary CTS Electronic Registry Filing Fee & Assessments',
        category: 'Court Filing / CTS',
        quantity: 1,
        unitPriceKES: 12500,
        isTaxable: false,
        statutoryReference: 'Judiciary Fee Schedule',
      },
    ];
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCatalogSuggestions, setShowCatalogSuggestions] = useState(false);

  if (!isOpen) return null;

  // Real-time calculations
  const taxableSubtotal = items
    .filter((it) => it.isTaxable)
    .reduce((sum, it) => sum + (it.unitPriceKES || 0) * (it.quantity || 1), 0);

  const exemptSubtotal = items
    .filter((it) => !it.isTaxable)
    .reduce((sum, it) => sum + (it.unitPriceKES || 0) * (it.quantity || 1), 0);

  const netSubtotal = taxableSubtotal + exemptSubtotal;
  const vatAmount = Math.round(taxableSubtotal * 0.16);
  const grossEstimatedTotal = netSubtotal + vatAmount;

  // Add blank item
  const handleAddBlankItem = () => {
    const newItem: FeeNoteLineItemTemplate = {
      id: `fnt-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: '',
      category: 'Professional Fees',
      quantity: 1,
      unitPriceKES: 15000,
      isTaxable: true,
      statutoryReference: 'ARO General Scale',
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Insert standard service item from catalog
  const handleInsertStandardService = (svc: StandardServiceItem) => {
    const newItem: FeeNoteLineItemTemplate = {
      id: `fnt-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: svc.description,
      category: svc.category,
      quantity: 1,
      unitPriceKES: svc.unitPriceKES,
      isTaxable: svc.isTaxable,
      statutoryReference: svc.statutoryReference,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update item field
  const handleUpdateItem = (
    id: string,
    field: keyof FeeNoteLineItemTemplate,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        // Auto adjust tax flag on category change if reasonable
        if (field === 'category') {
          if (value === 'Court Filing / CTS' || value === 'Disbursement') {
            updated.isTaxable = false;
          } else {
            updated.isTaxable = true;
          }
        }
        return updated;
      })
    );
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('A Fee Note template must contain at least 1 legal service line item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Please specify a title for the Fee Note template.');
      return;
    }

    if (items.length === 0) {
      setValidationError('Please add at least one line item to the template.');
      return;
    }

    const hasEmptyDesc = items.some((it) => !it.description.trim());
    if (hasEmptyDesc) {
      setValidationError('All service line items must have a clear description.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const savedTemplate: FeeNoteTemplate = {
      id: templateToEdit?.id || `fnt-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      practiceArea,
      author: author.trim() || 'Adv. Costa Kimathi',
      defaultNotes: defaultNotes.trim(),
      items: items.map((it) => ({
        ...it,
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitPriceKES: Math.max(0, Number(it.unitPriceKES) || 0),
      })),
      tags: tags.length > 0 ? tags : undefined,
      createdDate:
        templateToEdit?.createdDate || new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      isSystemDefault: templateToEdit?.isSystemDefault ?? false,
    };

    onSave(savedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <DraggableModal
        gripLabel={isEditing ? `EDIT TEMPLATE • ${templateToEdit?.title}` : 'NEW FEE NOTE TEMPLATE'}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div
          data-drag-handle="true"
          className="flex items-center justify-between border-b border-stone-200 bg-[#132c3f] px-6 py-4 text-white cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isEditing
                  ? `Edit Fee Note Template: ${templateToEdit?.title}`
                  : 'Create Reusable Fee Note Template'}
              </h3>
              <p className="text-xs text-stone-300">
                Standardize legal service descriptions, ARO remuneration rates & statutory disbursements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {validationError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Template Metadata */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
              <span className="text-xs font-bold text-[#132c3f] uppercase tracking-wider">
                1. Template Information & Practice Scope
              </span>
              <span className="text-[11px] text-stone-500">
                Used for 1-click Fee Note generation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              <div className="md:col-span-8">
                <label className="block font-bold text-stone-700 mb-1">
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High Court Commercial Litigation Standard Package"
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block font-bold text-stone-700 mb-1">
                  Practice Area
                </label>
                <select
                  value={practiceArea}
                  onChange={(e) =>
                    setPracticeArea(
                      e.target.value as PracticeArea | 'All Practice Areas'
                    )
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                >
                  {PRACTICE_AREAS.map((pa) => (
                    <option key={pa} value={pa}>
                      {pa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-8">
                <label className="block font-bold text-stone-700 mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Standard billing items for High Court civil representation per Advocates Remuneration Order."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block font-bold text-stone-700 mb-1">
                  Author / Assigned Lead
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Adv. Costa Kimathi"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>

              <div className="md:col-span-12">
                <label className="block font-bold text-stone-700 mb-1">
                  Search Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Litigation, High Court, Civil Suit, Pleadings"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items & Standardized Legal Descriptions */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#132c3f] uppercase tracking-wider">
                    2. Standardized Legal Service Line Items ({items.length})
                  </span>
                  <span className="rounded bg-blue-50 text-[#0070ba] border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
                    Per-Row VAT Enabled
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Set standard descriptions, statutory reference scales, unit pricing, and VAT status (+16% or Exempt).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogSuggestions(!showCatalogSuggestions)}
                  className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#0070ba]" />
                  <span>{showCatalogSuggestions ? 'Hide Standard Catalog' : 'Standard Services Catalog'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddBlankItem}
                  className="flex items-center space-x-1 rounded-lg bg-[#0070ba] hover:bg-[#005a96] text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Standard Catalog Suggestions Panel */}
            {showCatalogSuggestions && (
              <div className="rounded-xl border border-blue-200 bg-[#f0f7fc] p-3.5 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-[#0070ba]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Quick Insert from Standard Legal Services Catalog</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-normal">
                    Click any item to append to template
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {standardServices.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleInsertStandardService(svc)}
                      className="text-left p-2 rounded-lg bg-white border border-stone-200 hover:border-[#0070ba] hover:bg-blue-50/40 transition group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[11px] font-semibold text-stone-800 line-clamp-1 group-hover:text-[#0070ba]">
                          + {svc.description}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                        <span className="font-mono font-bold text-stone-700">
                          KES {svc.unitPriceKES.toLocaleString()}
                        </span>
                        <span
                          className={`px-1 rounded text-[9px] font-bold ${
                            svc.isTaxable
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {svc.isTaxable ? '+16% VAT' : 'Exempt / Zero-Rated'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items List */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const itemTotalNet = (item.unitPriceKES || 0) * (item.quantity || 1);
                const itemVat = item.isTaxable ? Math.round(itemTotalNet * 0.16) : 0;
                const itemGross = itemTotalNet + itemVat;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3.5 space-y-2.5 text-xs transition ${
                      item.isTaxable
                        ? 'border-blue-200 bg-blue-50/20'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#132c3f] text-white text-[10px] font-mono font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-800">
                          Legal Service Item #{idx + 1}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            item.isTaxable
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {item.isTaxable ? '16% Taxable' : 'Exempt / Zero-Rated'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[11px] text-stone-600 font-mono">
                          Net: <strong>KES {itemTotalNet.toLocaleString()}</strong>
                          {item.isTaxable && (
                            <span className="text-stone-500 font-normal">
                              {' '}
                              + VAT KES {itemVat.toLocaleString()} ={' '}
                              <strong className="text-[#0070ba]">
                                KES {itemGross.toLocaleString()}
                              </strong>
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove item"
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                      {/* Description (5 cols) */}
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          Standard Legal Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'description', e.target.value)
                          }
                          placeholder="e.g. Drafting Statement of Claim, CTS E-Filing Fee"
                          required
                          className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                        />
                      </div>

                      {/* Category (2 cols) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          Category
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'category', e.target.value)
                          }
                          className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                        >
                          {ITEM_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Unit Price (2 cols) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          Rate (KES)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={item.unitPriceKES}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              'unitPriceKES',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                        />
                      </div>

                      {/* Quantity / Units (1 col) */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-center font-mono font-bold text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                        />
                      </div>

                      {/* Taxable Toggle (2 cols) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          VAT Status
                        </label>
                        <label className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 cursor-pointer hover:bg-stone-50">
                          <input
                            type="checkbox"
                            checked={item.isTaxable}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'isTaxable', e.target.checked)
                            }
                            className="rounded text-[#0070ba] focus:ring-[#0070ba]"
                          />
                          <span className="text-[11px] font-semibold text-stone-700">
                            {item.isTaxable ? '+16% VAT' : 'Tax Exempt'}
                          </span>
                        </label>
                      </div>

                      {/* Statutory Reference Scale (Full width sub-field) */}
                      <div className="md:col-span-12">
                        <input
                          type="text"
                          value={item.statutoryReference || ''}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              'statutoryReference',
                              e.target.value
                            )
                          }
                          placeholder="Statutory / ARO Remuneration Reference (e.g. Advocates Remuneration Order Schedule 6 Item 1)"
                          className="w-full rounded border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-600 placeholder:text-stone-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Template Financial Summary Card */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Taxable Services Net:</span>
                <span className="font-mono font-bold text-stone-800">
                  KES {taxableSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Exempt / Statutory Disbursements:</span>
                <span className="font-mono font-bold text-stone-800">
                  KES {exemptSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Estimated 16% VAT:</span>
                <span className="font-mono font-bold text-stone-800">
                  KES {vatAmount.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-stone-300 pt-2 flex items-center justify-between text-sm font-bold text-[#132c3f]">
                <span>Estimated Total Package (Gross):</span>
                <span className="font-mono text-base text-[#0070ba]">
                  KES {grossEstimatedTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Standard Terms & Notes */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2">
            <span className="text-xs font-bold text-[#132c3f] uppercase tracking-wider block">
              3. Default Fee Note Notes & Remuneration Terms
            </span>
            <textarea
              rows={3}
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              placeholder="Default terms, bank settlement advice, and statutory compliance clauses..."
              className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
            />
          </div>

          {/* Modal Footer */}
          <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] hover:bg-[#005a96] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update Fee Note Template' : 'Save Fee Note Template'}</span>
            </button>
          </div>
        </form>
      </DraggableModal>
    </div>
  );
};
