import React, { useState, useId, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  UserPlus,
  Building,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Printer,
  Download,
  AlertCircle,
  Percent,
  Sparkles,
  Layers,
  BookOpen,
  BookmarkPlus,
  ChevronDown,
} from 'lucide-react';
import {
  Client,
  LegalMatter,
  FeeNote,
  InvoiceLineItem,
  FeeNoteTemplate,
  StandardServiceItem,
} from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  loadFeeNoteTemplates,
  loadStandardServiceSnippets,
  saveFeeNoteTemplates,
} from '../utils/feeNoteTemplatesStorage';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  matters: LegalMatter[];
  onAddInvoice: (invoice: FeeNote) => void;
  onAddClient?: (client: Client) => void;
  initialSelectedMatterId?: string;
  initialClientId?: string;
}

const COMMON_ITEM_TEMPLATES = [
  { description: 'Legal Representation & Counsel Court Appearance', category: 'Professional Fees', unitPriceKES: 25000, isTaxable: true },
  { description: 'Drafting of Pleadings, Affidavits & Chamber Summons', category: 'Drafting Pleading', unitPriceKES: 35000, isTaxable: true },
  { description: 'Judiciary CTS e-Filing Fee & Registry Assessments', category: 'Court Filing / CTS', unitPriceKES: 12500, isTaxable: false },
  { description: 'Legal Research, Opinion & Precedents Analysis', category: 'Legal Research', unitPriceKES: 18000, isTaxable: true },
  { description: 'Client Consultation & Pre-Trial Conference (Hours)', category: 'Consultation', unitPriceKES: 15000, isTaxable: true },
  { description: 'Official Ministry of Lands / ArdhiSasa Search & Disbursements', category: 'Disbursement', unitPriceKES: 7500, isTaxable: false },
];

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  clients,
  matters,
  onAddInvoice,
  onAddClient,
  initialSelectedMatterId,
  initialClientId,
}) => {
  const clientIdSelectId = useId();
  const matterIdSelectId = useId();
  const invoiceNumberId = useId();
  const dateIssuedId = useId();
  const dueDateId = useId();

  // Mode: 'create' or 'preview'
  const [modalView, setModalView] = useState<'form' | 'preview'>('form');

  // Client Selection / Creation state
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients[0]?.id || '')
  );
  const [selectedMatterId, setSelectedMatterId] = useState<string>(
    initialSelectedMatterId || (matters[0]?.id || '')
  );

  // New Client quick fields if adding new client
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('Nairobi, Kenya');
  const [newClientCategory, setNewClientCategory] = useState<'Corporate' | 'Individual' | 'Government'>('Corporate');

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `MAA-INV-2026-${randomNum}`;
  });
  const [dateIssued, setDateIssued] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14-day terms standard
    return d.toISOString().split('T')[0];
  });
  const vatRatePercent = 16; // Standard Kenya 16% VAT rate
  const [invoiceNotes, setInvoiceNotes] = useState<string>(
    'Payment is due within 14 calendar days. Please quote the invoice number on your RTGS or wire transfer reference.'
  );

  // Line items state with per-item tax configuration
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: 'item-1',
      description: 'Professional Legal Counsel & Case Strategy Formulation',
      category: 'Professional Fees',
      quantity: 1,
      unitPriceKES: 45000,
      totalPriceKES: 45000,
      isTaxable: true,
      vatAmountKES: Math.round(45000 * 0.16),
    },
    {
      id: 'item-2',
      description: 'Judiciary CTS Electronic Registry Filing and Court Assessment Fees',
      category: 'Court Filing / CTS',
      quantity: 1,
      unitPriceKES: 12500,
      totalPriceKES: 12500,
      isTaxable: false,
      vatAmountKES: 0,
    },
  ]);

  // Toast / Feedback state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Fee Note Reusable Templates from Settings
  const [feeNoteTemplates, setFeeNoteTemplates] = useState<FeeNoteTemplate[]>(() =>
    loadFeeNoteTemplates()
  );
  const [standardServices, setStandardServices] = useState<StandardServiceItem[]>(() =>
    loadStandardServiceSnippets()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
  const [saveTemplateTitle, setSaveTemplateTitle] = useState('');
  const [saveTemplateDesc, setSaveTemplateDesc] = useState('');
  const [saveTemplatePA, setSaveTemplatePA] = useState('Civil Litigation');

  useEffect(() => {
    const handleTemplatesUpdated = () => {
      setFeeNoteTemplates(loadFeeNoteTemplates());
      setStandardServices(loadStandardServiceSnippets());
    };
    window.addEventListener('fee-note-templates-updated', handleTemplatesUpdated);
    window.addEventListener('standard-services-updated', handleTemplatesUpdated);
    return () => {
      window.removeEventListener('fee-note-templates-updated', handleTemplatesUpdated);
      window.removeEventListener('standard-services-updated', handleTemplatesUpdated);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleApplyFeeNoteTemplate = (templateId: string) => {
    if (!templateId) return;
    const tmpl = feeNoteTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const newItems: InvoiceLineItem[] = tmpl.items.map((it, idx) => {
      const qty = it.quantity || 1;
      const rate = it.unitPriceKES || 0;
      const total = qty * rate;
      const vat = it.isTaxable ? Math.round(total * 0.16) : 0;

      return {
        id: `tmpl-item-${Date.now()}-${idx}`,
        description: it.description,
        category: (it.category as any) || 'Professional Fees',
        quantity: qty,
        unitPriceKES: rate,
        totalPriceKES: total,
        isTaxable: it.isTaxable,
        vatAmountKES: vat,
      };
    });

    setItems(newItems);
    if (tmpl.defaultNotes) {
      setInvoiceNotes(tmpl.defaultNotes);
    }
    setSelectedTemplateId(templateId);
    triggerToast(`Applied Fee Note template: "${tmpl.title}"`);
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTemplateTitle.trim()) {
      alert('Please provide a title for the Fee Note template.');
      return;
    }
    if (items.length === 0) {
      alert('Cannot save an empty fee note as a template.');
      return;
    }

    const newTemplate: FeeNoteTemplate = {
      id: `fnt-${Date.now()}`,
      title: saveTemplateTitle.trim(),
      description: saveTemplateDesc.trim() || `Saved from ${invoiceNumber}`,
      practiceArea: (saveTemplatePA as any) || 'Civil Litigation',
      author: 'Adv. Costa Kimathi',
      defaultNotes: invoiceNotes,
      items: items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        description: it.description,
        category: it.category || 'Professional Fees',
        quantity: it.quantity || 1,
        unitPriceKES: it.unitPriceKES || 0,
        isTaxable: it.isTaxable !== false,
      })),
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      isSystemDefault: false,
    };

    const updated = [newTemplate, ...feeNoteTemplates];
    setFeeNoteTemplates(updated);
    saveFeeNoteTemplates(updated);
    setIsSaveAsTemplateOpen(false);
    setSaveTemplateTitle('');
    setSaveTemplateDesc('');
    triggerToast(`Fee note saved to Settings templates as "${newTemplate.title}"!`);
  };

  if (!isOpen) return null;

  // Selected client object
  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const activeMatter = matters.find((m) => m.id === selectedMatterId);

  // Calculations per row
  const taxableSubtotalKES = items
    .filter((it) => it.isTaxable !== false)
    .reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);

  const nonTaxableSubtotalKES = items
    .filter((it) => it.isTaxable === false)
    .reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);

  const subtotalKES = items.reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);
  const totalVatAmountKES = Math.round((taxableSubtotalKES * vatRatePercent) / 100);
  const totalPayableKES = subtotalKES + totalVatAmountKES;

  // Line item manipulation
  const handleAddItem = (template?: { description: string; category?: string; unitPriceKES: number; isTaxable?: boolean }) => {
    const isTaxable = template?.isTaxable !== undefined
      ? template.isTaxable
      : template?.category === 'Court Filing / CTS' || template?.category === 'Disbursement'
      ? false
      : true;
    const unitPrice = template?.unitPriceKES || 15000;
    const qty = 1;
    const total = unitPrice * qty;
    const vat = isTaxable ? Math.round(total * (vatRatePercent / 100)) : 0;

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: template?.description || '',
      category: (template?.category as any) || 'Professional Fees',
      quantity: qty,
      unitPriceKES: unitPrice,
      totalPriceKES: total,
      isTaxable: isTaxable,
      vatAmountKES: vat,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // If category is changed and isTaxable wasn't manually touched, apply standard default
        if (field === 'category') {
          if (value === 'Court Filing / CTS' || value === 'Disbursement') {
            updated.isTaxable = false;
          } else {
            updated.isTaxable = true;
          }
        }

        const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
        const rate = field === 'unitPriceKES' ? parseFloat(value) || 0 : item.unitPriceKES;
        const isTax = field === 'isTaxable' ? Boolean(value) : (updated.isTaxable !== false);

        updated.totalPriceKES = Math.round(qty * rate);
        updated.isTaxable = isTax;
        updated.vatAmountKES = isTax ? Math.round(updated.totalPriceKES * (vatRatePercent / 100)) : 0;

        return updated;
      })
    );
  };

  const handleToggleItemTax = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newTaxable = item.isTaxable === false ? true : false;
        return {
          ...item,
          isTaxable: newTaxable,
          vatAmountKES: newTaxable ? Math.round((item.totalPriceKES || 0) * (vatRatePercent / 100)) : 0,
        };
      })
    );
  };

  const handleSetAllTaxable = (taxable: boolean) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        isTaxable: taxable,
        vatAmountKES: taxable ? Math.round((item.totalPriceKES || 0) * (vatRatePercent / 100)) : 0,
      }))
    );
  };

  const handleApplyDefaultTaxByCategory = () => {
    setItems((prev) =>
      prev.map((item) => {
        const isTax = item.category === 'Court Filing / CTS' || item.category === 'Disbursement' ? false : true;
        return {
          ...item,
          isTaxable: isTax,
          vatAmountKES: isTax ? Math.round((item.totalPriceKES || 0) * (vatRatePercent / 100)) : 0,
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Generate & Save invoice
  const handleSaveAndIssueInvoice = (status: 'Pending' | 'Paid' = 'Pending') => {
    let finalClientName = activeClient?.name || 'Walk-in Client';
    let finalClientId = selectedClientId;
    let finalClientAddress = activeClient?.address || 'Nairobi, Kenya';
    let finalClientEmail = activeClient?.email || 'accounts@client.co.ke';

    // If new client is being created
    if (isCreatingNewClient) {
      if (!newClientName.trim()) {
        alert('Please enter a valid Client or Organization Name');
        return;
      }
      finalClientName = newClientName.trim();
      finalClientId = `cli-${Date.now()}`;
      finalClientAddress = newClientAddress.trim() || 'Nairobi, Kenya';
      finalClientEmail = newClientEmail.trim() || `${finalClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.co.ke`;

      const newClientObj: Client = {
        id: finalClientId,
        name: finalClientName,
        type: newClientCategory === 'Individual' ? 'Individual' : 'Corporate',
        industry: 'General Practice',
        contactPerson: finalClientName,
        email: finalClientEmail,
        phone: newClientPhone.trim() || '+254 700 000 000',
        city: finalClientAddress || 'Nairobi',
        activeMattersCount: 1,
        totalBilledKES: totalPayableKES,
      };

      if (onAddClient) {
        onAddClient(newClientObj);
      }
    }

    if (items.length === 0 || subtotalKES <= 0) {
      alert('Please add at least one line item with a valid amount before issuing the invoice.');
      return;
    }

    const newInvoice: FeeNote = {
      id: `fn-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `MAA-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: finalClientId,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      clientKraPin: activeClient?.kraPin || undefined,
      clientAddress: finalClientAddress,
      matterId: activeMatter?.id,
      matterRef: activeMatter?.referenceNumber,
      matterTitle: activeMatter
        ? `${activeMatter.referenceNumber}: ${activeMatter.title}`
        : 'General Legal Counsel & Advisory Services',
      dateIssued: new Date(dateIssued).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: items.map((it) => ({
        ...it,
        isTaxable: it.isTaxable !== false,
        vatAmountKES: it.isTaxable !== false ? Math.round((it.totalPriceKES || 0) * (vatRatePercent / 100)) : 0,
      })),
      subtotalKES: subtotalKES,
      taxableAmountKES: taxableSubtotalKES,
      nonTaxableAmountKES: nonTaxableSubtotalKES,
      amountKES: subtotalKES,
      vatRatePercent: vatRatePercent,
      vatKES: totalVatAmountKES,
      totalKES: totalPayableKES,
      status: status,
      notes: invoiceNotes,
      paymentRef: status === 'Paid' ? `SETTLED-RTGS-${Date.now().toString().slice(-6)}` : 'Pending Remittance',
    };

    onAddInvoice(newInvoice);
    triggerToast(`Invoice ${newInvoice.invoiceNumber} successfully created and added to Fee Note Ledger!`);
    
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-stone-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0098db]/20 text-[#0098db] border border-[#0098db]/40">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-base font-bold">
                {modalView === 'form' ? 'Generate Tax Fee Note & Invoice' : 'Preview Generated Invoice'}
              </h2>
              <p className="text-xs text-stone-300">
                Kenya Law Firm LSK & KRA iTax Compliant Billing Generator
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher Pills */}
            <div className="flex items-center rounded-md bg-stone-800/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalView('form')}
                className={`rounded px-3 py-1 transition-all cursor-pointer ${
                  modalView === 'form' ? 'bg-[#0098db] text-white font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                1. Invoice Form
              </button>
              <button
                type="button"
                onClick={() => setModalView('preview')}
                className={`rounded px-3 py-1 transition-all cursor-pointer ${
                  modalView === 'preview' ? 'bg-[#0098db] text-white font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                2. Live Document Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {showToast && (
          <div className="m-4 rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View 1: Standard Invoice Creation Form */}
        {modalView === 'form' && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-[#fafafa]">
            
            {/* Section 1: Client Selection or Quick Add */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm">
                  <Building className="h-4 w-4 text-[#0098db]" />
                  <span>Step 1: Select Client & Associated Matter</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                  className="flex items-center space-x-1 text-xs font-bold text-[#0098db] hover:text-[#0070ba] cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>{isCreatingNewClient ? 'Select Existing Client' : '+ Add / Bill New Client'}</span>
                </button>
              </div>

              {!isCreatingNewClient ? (
                /* Select Existing Client Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label htmlFor={clientIdSelectId} className="block font-bold text-stone-700 mb-1">
                      Choose Client / Corporate Entity <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={clientIdSelectId}
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full rounded-md border border-stone-300 bg-white p-2.5 text-xs font-medium text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type || c.category || 'Client'})
                        </option>
                      ))}
                    </select>
                    {activeClient && (
                      <p className="mt-1 text-[11px] text-stone-500">
                        Email: <strong className="text-stone-700">{activeClient.email}</strong> • Address: <strong className="text-stone-700">{activeClient.address}</strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={matterIdSelectId} className="block font-bold text-stone-700 mb-1">
                      Link Legal Matter (Optional)
                    </label>
                    <select
                      id={matterIdSelectId}
                      value={selectedMatterId}
                      onChange={(e) => setSelectedMatterId(e.target.value)}
                      className="w-full rounded-md border border-stone-300 bg-white p-2.5 text-xs font-medium text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
                    >
                      <option value="">-- General Firm Workspace Legal Retainer / Non-Litigation --</option>
                      {matters.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.referenceNumber}] {m.clientName} - {m.title}
                        </option>
                      ))}
                    </select>
                    {activeMatter && (
                      <p className="mt-1 text-[11px] text-[#0070ba] font-medium">
                        Registry: {activeMatter.courtRegistry} • Advocate: {activeMatter.responsibleAdvocateName}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* New Client Quick Creation Sub-form */
                <div className="rounded-lg bg-blue-50/50 p-4 border border-blue-200/70 space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 text-xs">Enter New Client Details</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">New Client Registration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-stone-700 mb-1">
                        Client / Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Standard Chartered Bank PLC or John Kamau"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Client Type</label>
                      <select
                        value={newClientCategory}
                        onChange={(e) => setNewClientCategory(e.target.value as any)}
                        className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-medium"
                      >
                        <option value="Corporate">Corporate / Bank / NGO</option>
                        <option value="Individual">Individual Client</option>
                        <option value="Government">Government / Parastatal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="finance@client.co.ke"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full rounded border border-stone-300 bg-white p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+254 7..."
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-stone-700 mb-1">Physical / Postal Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Upper Hill, P.O. Box 40192-00100, Nairobi"
                        value={newClientAddress}
                        onChange={(e) => setNewClientAddress(e.target.value)}
                        className="w-full rounded border border-stone-300 bg-white p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Invoice Metadata & Tax Strategy */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm border-b border-stone-100 pb-3">
                <Calendar className="h-4 w-4 text-[#0098db]" />
                <span>Step 2: Invoice Dates & Tax Reference</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label htmlFor={invoiceNumberId} className="block font-bold text-stone-700 mb-1">Invoice Number</label>
                  <input
                    id={invoiceNumberId}
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono font-bold text-[#0070ba]"
                  />
                </div>

                <div>
                  <label htmlFor={dateIssuedId} className="block font-bold text-stone-700 mb-1">Date of Issue</label>
                  <input
                    id={dateIssuedId}
                    type="date"
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={dueDateId} className="block font-bold text-stone-700 mb-1">Due Date (Payment Terms)</label>
                  <input
                    id={dueDateId}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* VAT Per-Item Policy Note & Batch Controls */}
              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[#132c3f]">Per-Item / Per-Row VAT Control (16% Kenya iTax)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Apply 16% VAT individually to taxable legal services while keeping statutory CTS court filing fees and registry disbursements tax-exempt.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleApplyDefaultTaxByCategory}
                    title="Professional fees taxable, CTS & disbursements exempt"
                    className="rounded bg-white border border-blue-300 px-2.5 py-1 text-[11px] font-semibold text-[#0070ba] hover:bg-blue-100/70 transition-colors cursor-pointer"
                  >
                    Auto-Set by Category
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllTaxable(true)}
                    className="rounded bg-white border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Tax All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllTaxable(false)}
                    className="rounded bg-white border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Exempt All
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Dynamic Items & Descriptions with Per-Item VAT & Reusable Templates */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm">
                    <DollarSign className="h-4 w-4 text-[#0098db]" />
                    <span>Step 3: Line Items & Standardized Particulars</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Select a reusable Fee Note Template from Firm Workspace Settings or add standardized legal services.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveTemplateTitle(activeMatter ? `${activeMatter.title} Fee Note Package` : '');
                      setSaveTemplateDesc(`Reusable standard legal services package for ${activeMatter?.practiceArea || 'general matters'}`);
                      setSaveTemplatePA(activeMatter?.practiceArea || 'Civil Litigation');
                      setIsSaveAsTemplateOpen(true);
                    }}
                    className="flex items-center space-x-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    title="Save current line items as a reusable template in Settings"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-[#0070ba]" />
                    <span>Save as Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="flex items-center space-x-1.5 rounded-md bg-[#0098db] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0087c2] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Saved Fee Note Template Selector Bar */}
              <div className="rounded-xl border border-blue-100 bg-[#f0f7fc] p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#132c3f]">
                    <Layers className="h-4 w-4 text-[#0070ba]" />
                    <span>Apply Saved Fee Note Template:</span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Configured in <strong>Settings &gt; Fee Note Templates</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => {
                        setSelectedTemplateId(e.target.value);
                        handleApplyFeeNoteTemplate(e.target.value);
                      }}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                    >
                      <option value="">-- Choose a standard Fee Note package ({feeNoteTemplates.length} available) --</option>
                      {feeNoteTemplates.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.title} ({tmpl.practiceArea} • {tmpl.items.length} items)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => handleApplyFeeNoteTemplate(selectedTemplateId)}
                        className="w-full rounded-lg bg-[#0070ba] hover:bg-[#005a96] text-white px-3 py-2 text-xs font-bold transition cursor-pointer text-center"
                      >
                        Reload Template Items
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Standard Legal Service Snippet Chips */}
              <div className="space-y-1.5 pt-1 pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#0070ba]" />
                    <span>Insert Standardized Legal Service Descriptions:</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Click to append item</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {standardServices.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() =>
                        handleAddItem({
                          description: svc.description,
                          category: svc.category,
                          unitPriceKES: svc.unitPriceKES,
                          isTaxable: svc.isTaxable,
                        })
                      }
                      className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-[#0098db] hover:bg-blue-50/50 hover:text-[#0070ba] transition-all cursor-pointer text-left"
                    >
                      + {svc.description.slice(0, 36)}... (KES {svc.unitPriceKES.toLocaleString()})
                      <span
                        className={`ml-1 text-[9px] px-1 py-0.2 rounded font-bold ${
                          svc.isTaxable ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {svc.isTaxable ? '+16% VAT' : 'Exempt'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List Table / Form Inputs */}
              <div className="space-y-3">
                {items.map((item, index) => {
                  const isItemTaxable = item.isTaxable !== false;
                  const itemVat = isItemTaxable ? Math.round((item.totalPriceKES || 0) * (vatRatePercent / 100)) : 0;
                  const itemGross = (item.totalPriceKES || 0) + itemVat;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-3.5 space-y-3 text-xs transition-colors ${
                        isItemTaxable
                          ? 'border-blue-200 bg-blue-50/20'
                          : 'border-stone-200 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#132c3f] text-white text-[10px] font-mono font-bold">
                            {index + 1}
                          </span>
                          <span className="font-bold text-stone-800">Particulars of Service / Disbursement</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isItemTaxable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {isItemTaxable ? 'Taxable (16% VAT)' : 'Exempt / Zero-Rated'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-[11px] text-stone-600 font-mono">
                            Net: <strong>KES {(item.totalPriceKES || 0).toLocaleString()}</strong>
                            {isItemTaxable && (
                              <span className="text-stone-500 font-normal"> + VAT KES {itemVat.toLocaleString()} = <strong className="text-[#0070ba]">KES {itemGross.toLocaleString()}</strong></span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove item"
                            className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Description (5 cols) */}
                        <div className="md:col-span-5">
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            Item Description <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            placeholder="e.g. Drafting Replying Affidavit, Court Appearance, Registry Searches"
                            className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-medium text-stone-800"
                          />
                        </div>

                        {/* Category (2 cols) */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">Category</label>
                          <select
                            value={item.category || 'Professional Fees'}
                            onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                            className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-medium text-stone-800"
                          >
                            <option value="Professional Fees">Prof. Fees</option>
                            <option value="Drafting Pleading">Drafting</option>
                            <option value="Court Filing / CTS">CTS Filing</option>
                            <option value="Disbursement">Disbursement</option>
                            <option value="Legal Research">Research</option>
                            <option value="Consultation">Consultation</option>
                          </select>
                        </div>

                        {/* Quantity / Hours (1 col) */}
                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">Qty / Hrs</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                            className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono font-bold text-stone-800"
                          />
                        </div>

                        {/* Unit Rate KES (2 cols) */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">Rate / Unit (KES)</label>
                          <input
                            type="number"
                            step="500"
                            min="0"
                            value={item.unitPriceKES}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPriceKES', e.target.value)}
                            className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono font-bold text-stone-800"
                          />
                        </div>

                        {/* Per-Item VAT Control Toggle (2 cols) */}
                        <div className="md:col-span-2 flex flex-col justify-end">
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">VAT (16%)</label>
                          <label className="flex items-center space-x-1.5 rounded border border-stone-300 bg-white px-2.5 py-1.5 cursor-pointer hover:bg-stone-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={isItemTaxable}
                              onChange={() => handleToggleItemTax(item.id)}
                              className="rounded border-stone-300 text-[#0098db] focus:ring-[#0098db]"
                            />
                            <span className="font-semibold text-stone-800 text-[11px]">
                              {isItemTaxable ? 'Add 16% Tax' : 'No Tax / Exempt'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Invoice Notes / Payment instructions */}
              <div className="pt-2">
                <label className="block font-bold text-stone-700 text-xs mb-1">
                  Payment Remittance Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-white p-2 text-xs text-stone-700"
                />
              </div>

              {/* Total Calculation Card with Itemized Tax Breakdown */}
              <div className="rounded-lg bg-stone-100 p-4 border border-stone-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-stone-600 space-y-1">
                  <p>
                    <strong className="text-stone-900">Total Line Items:</strong> {items.length} particulars entered
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Taxable Items: <span className="font-semibold text-stone-800">{items.filter(i => i.isTaxable !== false).length}</span> | Exempt / Zero-Rated: <span className="font-semibold text-stone-800">{items.filter(i => i.isTaxable === false).length}</span>
                  </p>
                </div>

                <div className="w-full sm:w-80 space-y-1.5 text-xs text-right sm:text-left">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Legal Services:</span>
                    <span className="font-mono font-bold text-stone-800">
                      KES {taxableSubtotalKES.toLocaleString()}
                    </span>
                  </div>

                  {nonTaxableSubtotalKES > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Exempt CTS & Disbursements:</span>
                      <span className="font-mono font-bold text-stone-800">
                        KES {nonTaxableSubtotalKES.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>Total Net Amount:</span>
                    <span className="font-mono font-bold text-stone-800">
                      KES {subtotalKES.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>16% VAT (Calculated on Taxable Rows):</span>
                    <span className="font-mono font-bold text-stone-800">
                      KES {totalVatAmountKES.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-stone-300 text-sm font-bold text-stone-900">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-[#0070ba] text-base font-extrabold">
                      KES {totalPayableKES.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* View 2: Live Document Printable Tax Fee Note Preview */}
        {modalView === 'preview' && (
          <div className="p-6 md:p-8 flex-1 bg-stone-100 overflow-y-auto">
            <div className="bg-white rounded-lg border border-stone-300 shadow-md p-8 text-stone-800 space-y-6 text-xs max-w-2xl mx-auto">
              
              {/* Firm Header */}
              <div className="border-b-2 border-[#0098db] pb-5 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CompanyLogo variant="horizontal" size="md" darkBg={false} />
                  <div className="mt-3 text-[11px] text-stone-600 leading-tight space-y-0.5">
                    <p className="font-semibold text-stone-800">Muthoni Ahago Advocates</p>
                    <p>1st Floor, The Triple Two Address, Along the Eastern Bypass</p>
                    <p>Ruiru, Kenya</p>
                    <p>Tel: +254 (0)20 271 9900 | Email: billing@muthoniahago.co.ke</p>
                  </div>
                </div>

                <div className="text-right sm:self-start space-y-1 text-[11px]">
                  <div className="inline-block rounded bg-blue-50 border border-blue-200 px-3 py-1 font-mono font-extrabold text-[#0070ba]">
                    TAX FEE NOTE / INVOICE
                  </div>
                  <p className="font-mono text-stone-700 font-bold mt-1">NO: {invoiceNumber}</p>
                  <p className="text-stone-500">Date: {new Date(dateIssued).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-stone-500">Due: {new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Client & Matter Info Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-md border border-stone-200">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 tracking-wider">Bill To Client:</p>
                  <p className="font-bold text-stone-900 text-sm mt-0.5">
                    {isCreatingNewClient ? newClientName || 'New Client' : activeClient?.name}
                  </p>
                  <p className="text-stone-600 mt-0.5">
                    {isCreatingNewClient ? newClientAddress : activeClient?.address || 'Nairobi, Kenya'}
                  </p>
                  <p className="text-stone-500 text-[11px]">
                    {isCreatingNewClient ? newClientEmail : activeClient?.email}
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 tracking-wider">Matter Details:</p>
                  {activeMatter ? (
                    <>
                      <p className="font-mono font-bold text-[#0070ba] text-xs">{activeMatter.referenceNumber}</p>
                      <p className="font-semibold text-stone-800 text-xs">{activeMatter.title}</p>
                      <p className="text-stone-500 text-[11px]">{activeMatter.courtRegistry}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-mono font-bold text-[#0070ba] text-xs">MAA/GEN/2026/001</p>
                      <p className="font-semibold text-stone-800 text-xs">General Legal Advisory & Retainer Representation</p>
                    </>
                  )}
                  <p className="font-mono text-[10px] text-stone-500 mt-1">Firm KRA PIN: P0512839401Z</p>
                </div>
              </div>

              {/* Items Table with VAT column */}
              <div>
                <p className="font-bold text-stone-900 mb-2 text-[11px] tracking-wider">
                  Particulars of Professional Services & Disbursements Rendered
                </p>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-300 bg-stone-100 text-[10px] font-bold text-stone-600">
                      <th className="py-2 px-3">Description of Work</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">Qty / Hrs</th>
                      <th className="py-2 px-3 text-right">Rate (KES)</th>
                      <th className="py-2 px-3 text-center">VAT Rate</th>
                      <th className="py-2 px-3 text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-[11px]">
                    {items.map((it) => {
                      const isItemTaxable = it.isTaxable !== false;
                      return (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-stone-900">{it.description || 'Legal Representation'}</p>
                          </td>
                          <td className="py-2.5 px-3 text-stone-500 text-[10px]">{it.category || 'Professional Fees'}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{it.unitPriceKES.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                                isItemTaxable
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {isItemTaxable ? '16%' : 'Exempt'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                            {it.totalPriceKES.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end pt-2 border-t border-stone-200">
                <div className="w-full sm:w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Legal Services:</span>
                    <span className="font-mono font-bold">KES {taxableSubtotalKES.toLocaleString()}</span>
                  </div>
                  {nonTaxableSubtotalKES > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Exempt Disbursements:</span>
                      <span className="font-mono font-bold">KES {nonTaxableSubtotalKES.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Net Subtotal:</span>
                    <span className="font-mono font-bold">KES {subtotalKES.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>16% VAT (KRA iTax):</span>
                    <span className="font-mono font-bold text-stone-800">KES {totalVatAmountKES.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-[#132c3f] text-white p-2.5 rounded font-bold text-sm mt-2">
                    <span>TOTAL PAYABLE:</span>
                    <span className="font-mono text-[#00c0ef]">KES {totalPayableKES.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bank Remittance Instructions */}
              <div className="rounded border border-blue-200 bg-blue-50/60 p-3 text-[11px] text-blue-950 space-y-1">
                <p className="font-bold text-stone-900">Bank Remittance Instructions (Client Trust Account)</p>
                <p>Bank: <strong className="text-stone-900">Stanbic Bank Kenya Ltd</strong> • Branch: <strong className="text-stone-900">Upper Hill Nairobi</strong></p>
                <p>Account Name: <strong className="text-stone-900">Muthoni Ahago Advocates Client Acc</strong></p>
                <p>Account No: <strong className="font-mono text-stone-900">0100004918239</strong> | Swift: <strong className="font-mono text-stone-900">SBKENXNA</strong></p>
              </div>

              {/* Footer */}
              <div className="border-t border-stone-200 pt-3 flex items-center justify-end text-[10px] text-stone-400">
                <p className="font-mono">Computer Generated Tax Invoice</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="border-t border-stone-200 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600">
            Total Payable: <strong className="font-mono text-stone-900 text-sm font-bold">KES {totalPayableKES.toLocaleString()}</strong> ({items.length} items)
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>

            {modalView === 'form' ? (
              <>
                <button
                  type="button"
                  onClick={() => setModalView('preview')}
                  className="flex items-center space-x-1.5 rounded border border-[#0098db] text-[#0098db] bg-blue-50/50 px-3.5 py-2 text-xs font-bold hover:bg-blue-100/60 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>Preview Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndIssueInvoice('Pending')}
                  className="flex items-center space-x-1.5 rounded bg-[#0098db] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0087c2] transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Generate & Issue Invoice</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModalView('form')}
                  className="rounded border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Back to Edit Form
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndIssueInvoice('Pending')}
                  className="flex items-center space-x-1.5 rounded bg-[#0098db] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0087c2] transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Confirm & Save to Ledger</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Save as Reusable Template Modal Dialog */}
        {isSaveAsTemplateOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-200 bg-[#132c3f] px-5 py-3.5 text-white">
                <div className="flex items-center space-x-2">
                  <BookmarkPlus className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-bold">Save Current Items as Reusable Fee Note Template</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSaveAsTemplateOpen(false)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCurrentAsTemplate} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Template Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={saveTemplateTitle}
                    onChange={(e) => setSaveTemplateTitle(e.target.value)}
                    placeholder="e.g. Standard High Court Litigation Package"
                    required
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Practice Area
                  </label>
                  <select
                    value={saveTemplatePA}
                    onChange={(e) => setSaveTemplatePA(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
                  >
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Commercial Law">Commercial Law</option>
                    <option value="Conveyancing Law">Conveyancing Law</option>
                    <option value="Corporate & Tax">Corporate & Tax</option>
                    <option value="Family & Succession">Family & Succession</option>
                    <option value="Criminal Law">Criminal Law</option>
                    <option value="IP & ICT Law">IP & ICT Law</option>
                    <option value="Land & Environment">Land & Environment</option>
                    <option value="All Practice Areas">All Practice Areas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={saveTemplateDesc}
                    onChange={(e) => setSaveTemplateDesc(e.target.value)}
                    placeholder="Brief description of the legal service scope and applicable scale..."
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5 text-[11px] text-stone-600 space-y-1">
                  <span className="font-bold text-stone-800">Items to be saved ({items.length}):</span>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                    {items.map((it, idx) => (
                      <li key={idx} className="truncate">
                        {it.description || 'Untitled Item'} (KES {(it.unitPriceKES || 0).toLocaleString()})
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsSaveAsTemplateOpen(false)}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-lg bg-[#0070ba] hover:bg-[#005a96] px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    Save to Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
