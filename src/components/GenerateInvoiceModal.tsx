import React, { useState, useId, useEffect, useRef } from 'react';
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
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  BookmarkPlus,
  Eye,
  ArrowRight,
  ShieldCheck,
  Check,
  Search,
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

// Category to VAT treatment mapping
const CATEGORY_TAX_MAP: Record<string, boolean> = {
  'Prof. Fees': true,
  'Professional Fees': true,
  'Court Attendance': true,
  'Drafting Pleading': true,
  'Legal Research': true,
  'Consultation': true,
  'Conveyancing': true,
  'Commercial Law': true,
  'CTS Filing': false,
  'Court Filing / CTS': false,
  'Disbursement': false,
};

// Standardized Legal Service Descriptions quick-insert chips
const QUICK_CHIPS = [
  {
    label: 'Legal Representation & Lead Counsel',
    price: 35000,
    category: 'Prof. Fees',
    isTaxable: true,
  },
  {
    label: 'Senior Advocate Hearing Day',
    price: 50000,
    category: 'Court Attendance',
    isTaxable: true,
  },
  {
    label: 'CTS Electronic Filing & Registry',
    price: 12500,
    category: 'CTS Filing',
    isTaxable: false,
  },
  {
    label: 'Drafting Pleadings & Chamber Summons',
    price: 35000,
    category: 'Drafting Pleading',
    isTaxable: true,
  },
  {
    label: 'Official Lands Search & Disbursements',
    price: 7500,
    category: 'Disbursement',
    isTaxable: false,
  },
];

type PaymentTerm = 'Net 14' | 'Net 30' | 'Due on receipt';

const calculateDueDateFromTerms = (issueDateStr: string, terms: PaymentTerm): string => {
  const date = new Date(issueDateStr);
  if (isNaN(date.getTime())) return issueDateStr;
  if (terms === 'Net 14') {
    date.setDate(date.getDate() + 14);
  } else if (terms === 'Net 30') {
    date.setDate(date.getDate() + 30);
  }
  // 'Due on receipt' retains issue date
  return date.toISOString().split('T')[0];
};

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
  const paymentTermsId = useId();
  const dateIssuedId = useId();
  const dueDateId = useId();

  // Mode: Full Detailed Invoice vs. Quick Invoice
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);

  // Mobile preview view switch ('form' or 'preview')
  const [mobileActivePane, setMobileActivePane] = useState<'form' | 'preview'>('form');

  // Accordion state for "Details" section
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);
  const [hasManuallyToggledDetails, setHasManuallyToggledDetails] = useState<boolean>(false);

  // Client Selection / Creation state
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients[0]?.id || '')
  );
  const [clientSearchQuery, setClientSearchQuery] = useState<string>(() => {
    const init = clients.find((c) => c.id === (initialClientId || clients[0]?.id));
    return init ? init.name : '';
  });
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState<boolean>(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string>(
    initialSelectedMatterId || ''
  );

  // Inline New Client Fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('Nairobi, Kenya');
  const [newClientCategory, setNewClientCategory] = useState<'Corporate' | 'Individual'>('Corporate');

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `MAA-INV-2026-${randomNum}`;
  });
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm>('Net 14');
  const [dateIssued, setDateIssued] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [isDueDateOverridden, setIsDueDateOverridden] = useState<boolean>(false);
  const vatRatePercent = 16;

  const [invoiceNotes, setInvoiceNotes] = useState<string>(
    'Payment is due within 14 calendar days. Please quote the invoice number on your RTGS or wire transfer reference.'
  );

  // Quick Invoice Fields
  const [quickDescription, setQuickDescription] = useState('General Legal Counsel & Advisory Services');
  const [quickAmountKES, setQuickAmountKES] = useState<number>(35000);
  const [quickIncludeVat, setQuickIncludeVat] = useState<boolean>(true);

  // Detailed Line items state
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: 'item-1',
      description: 'Professional Legal Counsel & Case Strategy Formulation',
      category: 'Prof. Fees',
      quantity: 1,
      unitPriceKES: 45000,
      totalPriceKES: 45000,
      isTaxable: true,
      vatAmountKES: Math.round(45000 * 0.16),
    },
    {
      id: 'item-2',
      description: 'Judiciary CTS Electronic Registry Filing & Court Assessment Fees',
      category: 'CTS Filing',
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

  // Templates
  const [feeNoteTemplates, setFeeNoteTemplates] = useState<FeeNoteTemplate[]>(() =>
    loadFeeNoteTemplates()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
  const [saveTemplateTitle, setSaveTemplateTitle] = useState('');
  const [saveTemplateDesc, setSaveTemplateDesc] = useState('');
  const [saveTemplatePA, setSaveTemplatePA] = useState('Civil Litigation');

  useEffect(() => {
    const handleTemplatesUpdated = () => {
      setFeeNoteTemplates(loadFeeNoteTemplates());
    };
    window.addEventListener('fee-note-templates-updated', handleTemplatesUpdated);
    return () => {
      window.removeEventListener('fee-note-templates-updated', handleTemplatesUpdated);
    };
  }, []);

  // Sync initial selections
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedMatterId) {
        setSelectedMatterId(initialSelectedMatterId);
        const targetMatter = matters.find((m) => m.id === initialSelectedMatterId);
        if (targetMatter) {
          if (targetMatter.clientId) {
            setSelectedClientId(targetMatter.clientId);
          }
          if (targetMatter.estimatedFeeKES && targetMatter.estimatedFeeKES > 0) {
            setItems([
              {
                id: `item-${Date.now()}-1`,
                description: `Professional Legal Representation: ${targetMatter.title}`,
                category: 'Prof. Fees',
                quantity: 1,
                unitPriceKES: targetMatter.estimatedFeeKES,
                totalPriceKES: targetMatter.estimatedFeeKES,
                isTaxable: true,
                vatAmountKES: Math.round(targetMatter.estimatedFeeKES * 0.16),
              },
            ]);
            setQuickAmountKES(targetMatter.estimatedFeeKES);
            setQuickDescription(`Professional Legal Representation: ${targetMatter.title}`);
          }
        }
      } else if (initialClientId) {
        setSelectedClientId(initialClientId);
        const cli = clients.find((c) => c.id === initialClientId);
        if (cli) setClientSearchQuery(cli.name);
      }
    }
  }, [isOpen, initialSelectedMatterId, initialClientId, matters, clients]);

  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync clientSearchQuery when selectedClientId changes or initial props load
  useEffect(() => {
    if (selectedClientId) {
      const match = clients.find((c) => c.id === selectedClientId);
      if (match) {
        setClientSearchQuery(match.name);
      }
    }
  }, [selectedClientId, clients]);

  // When terms or issue date change, automatically compute due date unless overridden
  useEffect(() => {
    if (!isDueDateOverridden) {
      const computed = calculateDueDateFromTerms(dateIssued, paymentTerms);
      setDueDate(computed);
    }
  }, [paymentTerms, dateIssued, isDueDateOverridden]);

  // Auto-collapse accordion when required fields are present and user has not manually opened it
  useEffect(() => {
    if (!hasManuallyToggledDetails && (selectedClientId || isCreatingNewClient) && invoiceNumber && dateIssued && dueDate) {
      // Auto-collapse so line items dominate the view
      setIsDetailsExpanded(false);
    }
  }, [selectedClientId, isCreatingNewClient, invoiceNumber, dateIssued, dueDate, hasManuallyToggledDetails]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  if (!isOpen) return null;

  // Selected client object
  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const activeMatter = matters.find((m) => m.id === selectedMatterId);

  // Filter matters for the chosen client
  const clientMatters = matters.filter((m) => !selectedClientId || m.clientId === selectedClientId);

  // Filter clients for searchable combobox: pulls clients dynamically as user types (e.g. first 3 letters)
  const filteredClients = clients.filter((c) => {
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase().trim();
    if (activeClient && activeClient.name.toLowerCase() === q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.kraPin && c.kraPin.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setClientSearchQuery(client.name);
    setIsClientDropdownOpen(false);
    const firstMatter = matters.find((m) => m.clientId === client.id);
    if (firstMatter) {
      setSelectedMatterId(firstMatter.id);
    } else {
      setSelectedMatterId('');
    }
  };

  // Calculations for Full Detailed Mode
  const detailedTaxableSubtotalKES = items
    .filter((it) => it.isTaxable !== false)
    .reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);

  const detailedNonTaxableSubtotalKES = items
    .filter((it) => it.isTaxable === false)
    .reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);

  const detailedSubtotalKES = items.reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);
  const detailedVatKES = Math.round((detailedTaxableSubtotalKES * vatRatePercent) / 100);
  const detailedTotalPayableKES = detailedSubtotalKES + detailedVatKES;

  // Calculations for Quick Mode
  const quickSubtotalKES = quickAmountKES || 0;
  const quickVatKES = quickIncludeVat ? Math.round((quickSubtotalKES * vatRatePercent) / 100) : 0;
  const quickTotalPayableKES = quickSubtotalKES + quickVatKES;

  // Active totals depending on mode
  const currentSubtotalKES = isQuickMode ? quickSubtotalKES : detailedSubtotalKES;
  const currentTaxableSubtotalKES = isQuickMode
    ? (quickIncludeVat ? quickSubtotalKES : 0)
    : detailedTaxableSubtotalKES;
  const currentNonTaxableSubtotalKES = isQuickMode
    ? (!quickIncludeVat ? quickSubtotalKES : 0)
    : detailedNonTaxableSubtotalKES;
  const currentVatKES = isQuickMode ? quickVatKES : detailedVatKES;
  const currentTotalPayableKES = isQuickMode ? quickTotalPayableKES : detailedTotalPayableKES;

  // Line item manipulation
  const handleAddChipItem = (chip: typeof QUICK_CHIPS[0]) => {
    const isTax = chip.isTaxable;
    const unitPrice = chip.price;
    const qty = 1;
    const total = unitPrice * qty;
    const vat = isTax ? Math.round(total * (vatRatePercent / 100)) : 0;

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: chip.label,
      category: chip.category as any,
      quantity: qty,
      unitPriceKES: unitPrice,
      totalPriceKES: total,
      isTaxable: isTax,
      vatAmountKES: vat,
    };
    setItems((prev) => [...prev, newItem]);
    triggerToast(`Added "${chip.label}"`);
  };

  const handleAddCustomBlankItem = () => {
    const defaultCat = 'Prof. Fees';
    const isTax = CATEGORY_TAX_MAP[defaultCat] ?? true;
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: '',
      category: defaultCat as any,
      quantity: 1,
      unitPriceKES: 0,
      totalPriceKES: 0,
      isTaxable: isTax,
      vatAmountKES: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // Auto-apply VAT by category
        if (field === 'category') {
          const autoTax = CATEGORY_TAX_MAP[value] ?? true;
          updated.isTaxable = autoTax;
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

  const handleToggleRowTax = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextTaxable = item.isTaxable === false;
        return {
          ...item,
          isTaxable: nextTaxable,
          vatAmountKES: nextTaxable ? Math.round((item.totalPriceKES || 0) * (vatRatePercent / 100)) : 0,
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

  const handleApplyFeeNoteTemplate = (templateId: string) => {
    if (!templateId) return;
    const tmpl = feeNoteTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const newItems: InvoiceLineItem[] = tmpl.items.map((it, idx) => {
      const qty = it.quantity || 1;
      const rate = it.unitPriceKES || 0;
      const total = qty * rate;
      const autoTax = CATEGORY_TAX_MAP[it.category] ?? (it.isTaxable !== false);
      const vat = autoTax ? Math.round(total * 0.16) : 0;

      return {
        id: `tmpl-item-${Date.now()}-${idx}`,
        description: it.description,
        category: (it.category as any) || 'Prof. Fees',
        quantity: qty,
        unitPriceKES: rate,
        totalPriceKES: total,
        isTaxable: autoTax,
        vatAmountKES: vat,
      };
    });

    setItems(newItems);
    if (tmpl.defaultNotes) {
      setInvoiceNotes(tmpl.defaultNotes);
    }
    setSelectedTemplateId(templateId);
    triggerToast(`Applied template: "${tmpl.title}"`);
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
      author: 'Managing Advocate',
      defaultNotes: invoiceNotes,
      items: items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        description: it.description,
        category: it.category || 'Prof. Fees',
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
    triggerToast(`Fee note saved to templates as "${newTemplate.title}"!`);
  };

  // Generate & Save Invoice Handler
  const handleSaveAndIssueInvoice = (status: 'Pending' | 'Paid' = 'Pending') => {
    let finalClientName = activeClient?.name || 'Walk-in Client';
    let finalClientId = selectedClientId;
    let finalClientAddress = activeClient?.address || 'Nairobi, Kenya';
    let finalClientEmail = activeClient?.email || 'accounts@client.co.ke';

    // If new client is being created inline
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
        totalBilledKES: currentTotalPayableKES,
      };

      if (onAddClient) {
        onAddClient(newClientObj);
      }
    }

    if (isQuickMode) {
      if (!quickDescription.trim() || quickAmountKES <= 0) {
        alert('Please enter a service description and a valid amount.');
        return;
      }
    } else {
      if (items.length === 0 || currentSubtotalKES <= 0) {
        alert('Please add at least one line item with a valid amount before issuing the invoice.');
        return;
      }
    }

    // Construct line items
    const finalItems: InvoiceLineItem[] = isQuickMode
      ? [
          {
            id: `item-quick-${Date.now()}`,
            description: quickDescription.trim(),
            category: 'Prof. Fees',
            quantity: 1,
            unitPriceKES: quickAmountKES,
            totalPriceKES: quickAmountKES,
            isTaxable: quickIncludeVat,
            vatAmountKES: quickVatKES,
          },
        ]
      : items.map((it) => ({
          ...it,
          isTaxable: it.isTaxable !== false,
          vatAmountKES: it.isTaxable !== false ? Math.round((it.totalPriceKES || 0) * (vatRatePercent / 100)) : 0,
        }));

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
      items: finalItems,
      subtotalKES: currentSubtotalKES,
      taxableAmountKES: currentTaxableSubtotalKES,
      nonTaxableAmountKES: currentNonTaxableSubtotalKES,
      amountKES: currentSubtotalKES,
      vatRatePercent: vatRatePercent,
      vatKES: currentVatKES,
      totalKES: currentTotalPayableKES,
      status: status,
      notes: invoiceNotes,
      paymentRef: status === 'Paid' ? `SETTLED-RTGS-${Date.now().toString().slice(-6)}` : 'Pending Remittance',
    };

    onAddInvoice(newInvoice);
    triggerToast(`Invoice ${newInvoice.invoiceNumber} created and added to Fee Note Ledger!`);
    
    setTimeout(() => {
      onClose();
    }, 700);
  };

  // Summary line for Details section when collapsed
  const activeClientDisplayName = isCreatingNewClient
    ? (newClientName.trim() || 'New Client')
    : (activeClient?.name || 'Select Client');
  const detailsSummaryLine = `${activeClientDisplayName} · ${invoiceNumber} · Due ${new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#101826]/75 backdrop-blur-xs flex flex-col animate-in fade-in duration-150">
      
      {/* Top Bar */}
      <div className="h-16 shrink-0 bg-[#101826] border-b border-[#DFD9CB]/25 px-4 md:px-6 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B8873B]/20 text-[#B8873B] border border-[#B8873B]/40">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-fraunces text-base md:text-lg font-bold text-white tracking-tight truncate">
              {isQuickMode ? 'Generate Quick Fee Note' : 'Generate Tax Fee Note & Invoice'}
            </h2>
            <p className="text-xs text-[#EFEAE0]/75 truncate">
              Kenya Law Firm LSK & KRA iTax Compliant Billing Generator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4 shrink-0">
          {/* Quick invoice alternate path toggle */}
          <button
            type="button"
            onClick={() => setIsQuickMode(!isQuickMode)}
            className="text-xs font-medium text-[#B8873B] hover:text-[#d49e49] underline underline-offset-2 transition-colors cursor-pointer py-1 px-1.5 focus:outline-none focus:ring-2 focus:ring-[#B8873B] rounded"
          >
            {isQuickMode ? 'Detailed invoice instead' : 'Quick invoice instead'}
          </button>

          {/* Narrow viewport toggle between Form and Preview */}
          <div className="lg:hidden flex items-center rounded-md bg-stone-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMobileActivePane('form')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mobileActivePane === 'form' ? 'bg-[#B8873B] text-white font-bold' : 'text-stone-300'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setMobileActivePane('preview')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mobileActivePane === 'preview' ? 'bg-[#B8873B] text-white font-bold' : 'text-stone-300'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Close Control */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice generator"
            className="rounded-full p-2 text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8873B]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {showToast && (
        <div className="absolute top-18 right-6 z-50 max-w-md rounded-lg bg-emerald-900/95 text-emerald-100 border border-emerald-500/50 p-3 text-xs font-semibold shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Two-Pane Split View */}
      <div className="flex-1 flex overflow-hidden bg-[#F6F4EF]">
        
        {/* ======================================================== */}
        {/* LEFT PANE: Form (Scrollable independently with Sticky Footer) */}
        {/* ======================================================== */}
        <div
          className={`w-full lg:w-[54%] xl:w-[52%] flex flex-col h-full border-r border-[#DFD9CB] bg-[#F6F4EF] ${
            mobileActivePane === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            
            {/* Quick Invoice Mode Banner */}
            {isQuickMode && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-[#B8873B] shrink-0" />
                  <span>
                    <strong>Quick Mode:</strong> Lightweight 3-field invoice entry without per-line particulars.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickMode(false)}
                  className="font-bold underline text-[#B8873B] hover:text-[#946927] ml-2 shrink-0 cursor-pointer"
                >
                  Switch to full KRA breakdown
                </button>
              </div>
            )}

            {/* ==================================================== */}
            {/* ACCORDION: Details Section */}
            {/* ==================================================== */}
            <div className="rounded-xl border border-[#DFD9CB] bg-white shadow-xs overflow-hidden transition-all">
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => {
                  setHasManuallyToggledDetails(true);
                  setIsDetailsExpanded(!isDetailsExpanded);
                }}
                aria-expanded={isDetailsExpanded}
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-[#F6F4EF]/70 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#B8873B]"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#101826]/5 text-[#101826]">
                    <Building className="h-4 w-4 text-[#B8873B]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-fraunces font-bold text-sm text-[#101826]">Details</span>
                    {!isDetailsExpanded && (
                      <p className="text-xs text-[#5B6472] font-mono truncate mt-0.5">
                        {detailsSummaryLine}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[11px] font-semibold text-[#5B6472] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    {paymentTerms}
                  </span>
                  <div className="text-stone-400 p-1">
                    {isDetailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {/* Accordion Expanded Body: Compact 2-Column Grid */}
              {isDetailsExpanded && (
                <div className="p-4 pt-1 border-t border-[#DFD9CB]/60 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    
                    {/* Field 1: Client / Corporate Entity */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor={clientIdSelectId} className="font-semibold text-[#101826]">
                          Client / Corporate Entity <span className="text-[#9C3B3B]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                          className="text-[11px] font-semibold text-[#B8873B] hover:text-[#946927] cursor-pointer"
                        >
                          {isCreatingNewClient ? '← Select existing' : '+ Add / bill new client'}
                        </button>
                      </div>

                      {isCreatingNewClient ? (
                        <div className="space-y-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                          <input
                            type="text"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Client or Company Name *"
                            required
                            className="w-full rounded border border-[#DFD9CB] bg-white px-2.5 py-1.5 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="email"
                              value={newClientEmail}
                              onChange={(e) => setNewClientEmail(e.target.value)}
                              placeholder="Email address"
                              className="rounded border border-[#DFD9CB] bg-white px-2 py-1 text-[11px] text-[#101826]"
                            />
                            <input
                              type="tel"
                              value={newClientPhone}
                              onChange={(e) => setNewClientPhone(e.target.value)}
                              placeholder="Phone / Mobile"
                              className="rounded border border-[#DFD9CB] bg-white px-2 py-1 text-[11px] text-[#101826]"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-[#5B6472]">Entity Type:</span>
                            <div className="flex space-x-2">
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name="clientType"
                                  checked={newClientCategory === 'Corporate'}
                                  onChange={() => setNewClientCategory('Corporate')}
                                  className="text-[#B8873B] focus:ring-[#B8873B]"
                                />
                                <span>Corporate</span>
                              </label>
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name="clientType"
                                  checked={newClientCategory === 'Individual'}
                                  onChange={() => setNewClientCategory('Individual')}
                                  className="text-[#B8873B] focus:ring-[#B8873B]"
                                />
                                <span>Individual</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative" ref={clientDropdownRef}>
                          <div className="relative flex items-center">
                            <Search className="absolute left-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                            <input
                              id={clientIdSelectId}
                              type="text"
                              value={clientSearchQuery}
                              onChange={(e) => {
                                setClientSearchQuery(e.target.value);
                                setIsClientDropdownOpen(true);
                              }}
                              onFocus={() => setIsClientDropdownOpen(true)}
                              placeholder="Type first 3 letters to search clients..."
                              autoComplete="off"
                              className="w-full rounded border border-[#DFD9CB] bg-white pl-8 pr-16 py-1.5 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                            />
                            <div className="absolute right-1.5 flex items-center space-x-0.5">
                              {clientSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClientSearchQuery('');
                                    setIsClientDropdownOpen(true);
                                  }}
                                  className="p-1 text-stone-400 hover:text-stone-600 rounded cursor-pointer"
                                  title="Clear client search"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                className="p-1 text-stone-400 hover:text-stone-600 rounded cursor-pointer"
                                title="Show client list"
                              >
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Dropdown list of clients */}
                          {isClientDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-[#DFD9CB] bg-white shadow-xl z-50 divide-y divide-stone-100">
                              {filteredClients.length > 0 ? (
                                filteredClients.map((c) => {
                                  const isSelected = c.id === selectedClientId;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleSelectClient(c)}
                                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer hover:bg-[#F6F4EF] ${
                                        isSelected ? 'bg-amber-50/70 font-semibold text-[#101826]' : 'text-stone-800'
                                      }`}
                                    >
                                      <div className="min-w-0 pr-2">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="truncate font-medium">{c.name}</span>
                                          <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[9px] font-semibold text-stone-500 uppercase shrink-0">
                                            {c.type}
                                          </span>
                                        </div>
                                        {(c.contactPerson || c.email) && (
                                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                            {c.contactPerson ? `${c.contactPerson} • ` : ''}{c.email || ''}
                                          </p>
                                        )}
                                      </div>
                                      {isSelected && <Check className="h-3.5 w-3.5 text-[#B8873B] shrink-0" />}
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="p-3 text-center text-xs text-stone-500 space-y-1.5">
                                  <p>No client found matching "{clientSearchQuery}"</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewClientName(clientSearchQuery);
                                      setIsCreatingNewClient(true);
                                      setIsClientDropdownOpen(false);
                                    }}
                                    className="inline-flex items-center space-x-1 text-xs font-semibold text-[#B8873B] hover:underline cursor-pointer"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                    <span>Create "{clientSearchQuery}" as new client</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Field 2: Legal Matter (Optional) */}
                    <div>
                      <label htmlFor={matterIdSelectId} className="block font-semibold text-[#101826] mb-1">
                        Legal Matter <span className="text-[#5B6472] font-normal">(Optional)</span>
                      </label>
                      <select
                        id={matterIdSelectId}
                        value={selectedMatterId}
                        onChange={(e) => setSelectedMatterId(e.target.value)}
                        className="w-full rounded border border-[#DFD9CB] bg-white px-2.5 py-1.5 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                      >
                        <option value="">General Firm Retainer / Non-Litigation</option>
                        {clientMatters.length > 0 && (
                          <optgroup label="Client Matters">
                            {clientMatters.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.referenceNumber}: {m.title}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {matters
                          .filter((m) => !selectedClientId || m.clientId !== selectedClientId)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.referenceNumber}: {m.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Field 3: Invoice Number */}
                    <div>
                      <label htmlFor={invoiceNumberId} className="block font-semibold text-[#101826] mb-1">
                        Invoice / Fee Note Number
                      </label>
                      <input
                        id={invoiceNumberId}
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full rounded border border-[#DFD9CB] bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                      />
                    </div>

                    {/* Field 4: Payment Terms */}
                    <div>
                      <label htmlFor={paymentTermsId} className="block font-semibold text-[#101826] mb-1">
                        Payment Terms
                      </label>
                      <select
                        id={paymentTermsId}
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value as PaymentTerm)}
                        className="w-full rounded border border-[#DFD9CB] bg-white px-2.5 py-1.5 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                      >
                        <option value="Net 14">Net 14 (Due in 14 days)</option>
                        <option value="Net 30">Net 30 (Due in 30 days)</option>
                        <option value="Due on receipt">Due on receipt (Immediate)</option>
                      </select>
                    </div>

                    {/* Field 5: Date of Issue */}
                    <div>
                      <label htmlFor={dateIssuedId} className="block font-semibold text-[#101826] mb-1">
                        Date of Issue
                      </label>
                      <input
                        id={dateIssuedId}
                        type="date"
                        value={dateIssued}
                        onChange={(e) => setDateIssued(e.target.value)}
                        className="w-full rounded border border-[#DFD9CB] bg-white px-2.5 py-1.5 text-xs font-mono text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                      />
                    </div>

                    {/* Field 6: Due Date (Computed with Override option) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor={dueDateId} className="font-semibold text-[#101826]">
                          Due Date
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsDueDateOverridden(!isDueDateOverridden)}
                          className="text-[11px] font-semibold text-[#B8873B] hover:text-[#946927] cursor-pointer"
                        >
                          {isDueDateOverridden ? 'Reset to auto-term' : 'Override date'}
                        </button>
                      </div>
                      <input
                        id={dueDateId}
                        type="date"
                        value={dueDate}
                        disabled={!isDueDateOverridden}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={`w-full rounded border border-[#DFD9CB] px-2.5 py-1.5 text-xs font-mono focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B] ${
                          isDueDateOverridden ? 'bg-white text-[#101826]' : 'bg-stone-100 text-stone-600 cursor-not-allowed'
                        }`}
                      />
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* ==================================================== */}
            {/* QUICK INVOICE MODE FORM */}
            {/* ==================================================== */}
            {isQuickMode ? (
              <div className="rounded-xl border border-[#DFD9CB] bg-white p-4 space-y-4 shadow-xs">
                <div className="border-b border-[#DFD9CB]/60 pb-2">
                  <h3 className="font-fraunces font-bold text-sm text-[#101826]">
                    Quick Fee Note Particulars
                  </h3>
                  <p className="text-xs text-[#5B6472]">
                    Single professional fee entry with immediate calculation.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#101826] mb-1">
                      Service Description <span className="text-[#9C3B3B]">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickDescription}
                      onChange={(e) => setQuickDescription(e.target.value)}
                      placeholder="e.g. Legal Advisory Retainer Fee & Counsel Services"
                      className="w-full rounded border border-[#DFD9CB] bg-white px-3 py-2 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#101826] mb-1">
                        Professional Fee Amount (KES) <span className="text-[#9C3B3B]">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={quickAmountKES}
                        onChange={(e) => setQuickAmountKES(parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-[#DFD9CB] bg-white px-3 py-2 text-xs font-mono font-bold text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center space-x-2 rounded border border-[#DFD9CB] bg-[#F6F4EF]/50 p-2 cursor-pointer hover:bg-[#F6F4EF] transition-colors">
                        <input
                          type="checkbox"
                          checked={quickIncludeVat}
                          onChange={(e) => setQuickIncludeVat(e.target.checked)}
                          className="rounded text-[#3F6B4F] focus:ring-[#3F6B4F]"
                        />
                        <span className="text-xs font-medium text-[#101826]">
                          Apply standard 16% KRA VAT
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#101826] mb-1">
                      Payment Remittance Notes
                    </label>
                    <textarea
                      rows={2}
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      className="w-full rounded border border-[#DFD9CB] bg-white p-2 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ==================================================== */
              /* DETAILED LINE ITEMS SECTION */
              /* ==================================================== */
              <div className="rounded-xl border border-[#DFD9CB] bg-white p-4 space-y-4 shadow-xs">
                
                {/* Section Header */}
                <div className="flex items-center justify-between gap-2 border-b border-[#DFD9CB]/60 pb-2.5">
                  <h3 className="font-fraunces font-bold text-sm text-[#101826]">
                    Line Items
                  </h3>

                  {/* Apply Saved Fee Note Template Dropdown */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="template-dropdown" className="text-xs font-medium text-[#5B6472] shrink-0">
                      Package:
                    </label>
                    <select
                      id="template-dropdown"
                      value={selectedTemplateId}
                      onChange={(e) => handleApplyFeeNoteTemplate(e.target.value)}
                      className="rounded border border-[#DFD9CB] bg-[#F6F4EF] px-2 py-1 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B] cursor-pointer"
                    >
                      <option value="">Apply Saved Template...</option>
                      {feeNoteTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.items.length} items)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Standardized Legal Service Descriptions Quick Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#5B6472] uppercase tracking-wider">
                      Standardized Legal Service Descriptions (Click to insert):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddChipItem(chip)}
                        className="inline-flex items-center space-x-1.5 rounded-full border border-[#DFD9CB] bg-[#F6F4EF] hover:bg-[#EFEAE0] hover:border-[#B8873B] px-2.5 py-1 text-[11px] text-[#101826] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8873B]"
                      >
                        <Plus className="h-3 w-3 text-[#B8873B]" />
                        <span>{chip.label}</span>
                        <span className="font-mono text-stone-500 font-semibold">
                          — KES {chip.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact Table */}
                <div className="overflow-x-auto border border-[#DFD9CB] rounded-lg">
                  <table className="w-full text-left border-collapse min-w-[580px]">
                    <thead>
                      <tr className="border-b border-[#DFD9CB] bg-[#F6F4EF] text-[11px] font-semibold text-[#5B6472]">
                        <th className="py-2 px-2.5 w-[38%]">Description of Work</th>
                        <th className="py-2 px-2 w-[22%]">Category</th>
                        <th className="py-2 px-2 w-[12%] text-center">Qty / Hrs</th>
                        <th className="py-2 px-2 w-[16%] text-right">Rate (KES)</th>
                        <th className="py-2 px-2 w-[12%] text-center">VAT</th>
                        <th className="py-2 px-1.5 w-[5%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CB]/60 text-xs">
                      {items.map((item) => {
                        const isTaxable = item.isTaxable !== false;
                        return (
                          <tr key={item.id} className="hover:bg-[#F6F4EF]/40 transition-colors">
                            {/* Description Input */}
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                placeholder="Service description..."
                                className="w-full rounded border border-[#DFD9CB] bg-white px-2 py-1 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                              />
                            </td>

                            {/* Category Dropdown */}
                            <td className="py-1.5 px-2">
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                className="w-full rounded border border-[#DFD9CB] bg-white px-1.5 py-1 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                              >
                                <option value="Prof. Fees">Prof. Fees</option>
                                <option value="Court Attendance">Court Attendance</option>
                                <option value="Drafting Pleading">Drafting Pleading</option>
                                <option value="Legal Research">Legal Research</option>
                                <option value="Consultation">Consultation</option>
                                <option value="CTS Filing">CTS Filing</option>
                                <option value="Disbursement">Disbursement</option>
                              </select>
                            </td>

                            {/* Qty / Hrs */}
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                className="w-full rounded border border-[#DFD9CB] bg-white px-1 py-1 text-xs font-mono font-medium text-center text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                              />
                            </td>

                            {/* Rate / Unit (KES) */}
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={item.unitPriceKES}
                                onChange={(e) => handleUpdateItem(item.id, 'unitPriceKES', e.target.value)}
                                className="w-full rounded border border-[#DFD9CB] bg-white px-1.5 py-1 text-xs font-mono font-bold text-right text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                              />
                            </td>

                            {/* VAT Tag: Auto-applied by category, clickable to override */}
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRowTax(item.id)}
                                title="Click to override tax treatment"
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                                  isTaxable
                                    ? 'bg-[#3F6B4F]/10 text-[#3F6B4F] border border-[#3F6B4F]/30 hover:bg-[#3F6B4F]/20'
                                    : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                                }`}
                              >
                                {isTaxable ? '16% VAT' : 'Exempt'}
                              </button>
                            </td>

                            {/* Delete Control */}
                            <td className="py-1.5 px-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                title="Remove line item"
                                className="p-1 rounded text-stone-400 hover:text-[#9C3B3B] hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Secondary Actions Row */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomBlankItem}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-[#5B6472] hover:text-[#101826] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#B8873B]" />
                    <span>+ Add custom item</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSaveAsTemplateOpen(true)}
                    className="inline-flex items-center space-x-1 text-xs font-medium text-[#B8873B] hover:text-[#946927] cursor-pointer"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span>Save items as reusable template</span>
                  </button>
                </div>

                {/* Remittance Notes */}
                <div className="pt-2 border-t border-[#DFD9CB]/60">
                  <label className="block font-semibold text-[#101826] text-xs mb-1">
                    Payment Remittance Notes & Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full rounded border border-[#DFD9CB] bg-white p-2 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                  />
                </div>

              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* STICKY FOOTER: Pinned to bottom of Form Pane */}
          {/* ======================================================== */}
          <div className="shrink-0 bg-white border-t border-[#DFD9CB] p-3.5 md:p-4 shadow-lg z-10 space-y-3">
            {/* Totals Summary Breakdown */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#5B6472]">
                <div>
                  Taxable Legal: <strong className="font-mono text-[#101826]">KES {currentTaxableSubtotalKES.toLocaleString()}</strong>
                </div>
                {currentNonTaxableSubtotalKES > 0 && (
                  <div>
                    Exempt / CTS: <strong className="font-mono text-[#101826]">KES {currentNonTaxableSubtotalKES.toLocaleString()}</strong>
                  </div>
                )}
                <div>
                  16% VAT: <strong className="font-mono text-[#3F6B4F]">KES {currentVatKES.toLocaleString()}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#5B6472]">Total Payable:</span>
                <span className="font-mono font-bold text-base md:text-lg text-[#101826] bg-[#EFEAE0] px-2.5 py-0.5 rounded border border-[#DFD9CB]">
                  KES {currentTotalPayableKES.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-[#DFD9CB] bg-white px-3.5 py-2 text-xs font-semibold text-[#5B6472] hover:bg-stone-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8873B]"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                {/* Mobile Preview Button */}
                <button
                  type="button"
                  onClick={() => setMobileActivePane('preview')}
                  className="lg:hidden rounded border border-[#DFD9CB] bg-[#F6F4EF] px-3 py-2 text-xs font-semibold text-[#101826] hover:bg-[#EFEAE0] cursor-pointer"
                >
                  View Preview
                </button>

                {/* Primary Generate Button */}
                <button
                  type="button"
                  onClick={() => handleSaveAndIssueInvoice('Pending')}
                  className="inline-flex items-center space-x-1.5 rounded bg-[#101826] hover:bg-[#1a2538] border border-[#B8873B]/50 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8873B]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#B8873B]" />
                  <span>Generate & Issue Invoice</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: Live Document Preview (Persistent split view) */}
        {/* ======================================================== */}
        <div
          className={`flex-1 lg:w-[46%] xl:w-[48%] flex-col h-full bg-[#EFEAE0] overflow-y-auto p-4 md:p-6 items-center justify-start ${
            mobileActivePane === 'form' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Mobile Back to Form button if active on mobile */}
          <div className="w-full max-w-xl lg:hidden mb-3 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setMobileActivePane('form')}
              className="rounded bg-white border border-[#DFD9CB] px-3 py-1.5 text-xs font-semibold text-[#101826]"
            >
              ← Back to Invoice Form
            </button>
            <span className="text-xs text-[#5B6472] font-medium">Live Document Preview</span>
          </div>

          {/* Authentic Printed Invoice Sheet */}
          <div className="w-full max-w-xl bg-white shadow-lg rounded-lg border border-[#DFD9CB] p-6 md:p-8 text-xs text-[#101826] space-y-5 animate-in fade-in duration-100">
            
            {/* Document Header */}
            <div className="border-b-2 border-[#101826] pb-4 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CompanyLogo variant="horizontal" size="md" darkBg={false} />
                <div className="mt-2.5 text-[11px] text-[#5B6472] leading-tight space-y-0.5">
                  <p className="font-semibold text-[#101826]">Muthoni Ahago Advocates</p>
                  <p>1st Floor, The Triple Two Address, Along the Eastern Bypass</p>
                  <p>Ruiru, Kenya</p>
                  <p>Tel: +254 (0)20 271 9900 | Email: billing@muthoniahago.co.ke</p>
                </div>
              </div>

              <div className="text-right sm:self-start space-y-1 text-[11px]">
                <div className="inline-block rounded bg-[#EFEAE0] border border-[#DFD9CB] px-2.5 py-1 font-mono font-extrabold text-[#101826]">
                  TAX FEE NOTE / INVOICE
                </div>
                <p className="font-mono text-[#101826] font-bold mt-1">NO: {invoiceNumber}</p>
                <p className="text-[#5B6472]">
                  Date: {new Date(dateIssued).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[#5B6472]">
                  Due: {new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-[#B8873B] font-semibold">{paymentTerms}</p>
              </div>
            </div>

            {/* Bill To & Matter Information Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F6F4EF] p-3.5 rounded-md border border-[#DFD9CB]">
              <div>
                <p className="text-[10px] font-bold text-[#5B6472] uppercase tracking-wider">Bill To Client:</p>
                <p className="font-bold text-[#101826] text-sm mt-0.5">
                  {isCreatingNewClient ? (newClientName || 'New Client') : (activeClient?.name || 'Selected Client')}
                </p>
                <p className="text-[#5B6472] text-[11px] mt-0.5">
                  {isCreatingNewClient ? newClientAddress : (activeClient?.address || 'Nairobi, Kenya')}
                </p>
                <p className="text-[#5B6472] text-[11px]">
                  {isCreatingNewClient ? newClientEmail : activeClient?.email}
                </p>
                {activeClient?.kraPin && (
                  <p className="font-mono text-[10px] text-[#5B6472] mt-0.5">
                    Client KRA PIN: {activeClient.kraPin}
                  </p>
                )}
              </div>

              <div className="sm:text-right space-y-0.5">
                <p className="text-[10px] font-bold text-[#5B6472] uppercase tracking-wider">Legal Matter Reference:</p>
                {activeMatter ? (
                  <>
                    <p className="font-mono font-bold text-[#B8873B] text-xs">{activeMatter.referenceNumber}</p>
                    <p className="font-semibold text-[#101826] text-xs">{activeMatter.title}</p>
                    <p className="text-[#5B6472] text-[11px]">{activeMatter.courtRegistry}</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono font-bold text-[#B8873B] text-xs">MAA/GEN/2026/001</p>
                    <p className="font-semibold text-[#101826] text-xs">General Legal Advisory & Retainer</p>
                  </>
                )}
                <p className="font-mono text-[10px] text-[#5B6472] pt-1">Firm KRA PIN: P0512839401Z</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <p className="font-bold text-[#101826] mb-2 text-[11px] tracking-wider uppercase">
                Particulars of Professional Legal Services Rendered
              </p>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DFD9CB] bg-[#F6F4EF] text-[10px] font-bold text-[#5B6472]">
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Rate (KES)</th>
                    <th className="py-2 px-2 text-center">VAT</th>
                    <th className="py-2 px-2.5 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD9CB]/60 text-[11px]">
                  {isQuickMode ? (
                    <tr>
                      <td className="py-2.5 px-2.5 font-bold text-[#101826]">
                        {quickDescription || 'General Legal Representation'}
                      </td>
                      <td className="py-2.5 px-2 text-[#5B6472]">Prof. Fees</td>
                      <td className="py-2.5 px-2 text-center font-mono">1</td>
                      <td className="py-2.5 px-2 text-right font-mono">{quickAmountKES.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                            quickIncludeVat
                              ? 'bg-[#3F6B4F]/10 text-[#3F6B4F]'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {quickIncludeVat ? '16%' : 'Exempt'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#101826]">
                        {quickAmountKES.toLocaleString()}
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const isItemTaxable = it.isTaxable !== false;
                      return (
                        <tr key={it.id}>
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-[#101826]">{it.description || 'Legal Representation'}</p>
                          </td>
                          <td className="py-2 px-2 text-[#5B6472] text-[10px]">{it.category || 'Prof. Fees'}</td>
                          <td className="py-2 px-2 text-center font-mono">{it.quantity}</td>
                          <td className="py-2 px-2 text-right font-mono">{it.unitPriceKES.toLocaleString()}</td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                                isItemTaxable
                                  ? 'bg-[#3F6B4F]/10 text-[#3F6B4F]'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {isItemTaxable ? '16%' : 'Exempt'}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-[#101826]">
                            {it.totalPriceKES.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown in Document */}
            <div className="flex justify-end pt-2 border-t border-[#DFD9CB]">
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5B6472]">
                  <span>Taxable Legal Services:</span>
                  <span className="font-mono font-bold text-[#101826]">
                    KES {currentTaxableSubtotalKES.toLocaleString()}
                  </span>
                </div>
                {currentNonTaxableSubtotalKES > 0 && (
                  <div className="flex justify-between text-[#5B6472]">
                    <span>Exempt CTS & Disbursements:</span>
                    <span className="font-mono font-bold text-[#101826]">
                      KES {currentNonTaxableSubtotalKES.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#5B6472]">
                  <span>Net Subtotal:</span>
                  <span className="font-mono font-bold text-[#101826]">
                    KES {currentSubtotalKES.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#5B6472]">
                  <span>16% VAT (KRA iTax):</span>
                  <span className="font-mono font-bold text-[#3F6B4F]">
                    KES {currentVatKES.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between bg-[#101826] text-white p-2.5 rounded font-bold text-sm mt-2 border border-[#B8873B]/40">
                  <span>TOTAL PAYABLE:</span>
                  <span className="font-mono text-[#B8873B] text-base font-extrabold">
                    KES {currentTotalPayableKES.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Remittance Instructions */}
            <div className="rounded border border-[#DFD9CB] bg-[#F6F4EF] p-3 text-[11px] text-[#101826] space-y-0.5">
              <p className="font-bold text-[#101826]">Bank Remittance Instructions (Client Trust Account)</p>
              <p>Bank: <strong>Stanbic Bank Kenya Ltd</strong> • Branch: <strong>Upper Hill Nairobi</strong></p>
              <p>Account Name: <strong>Muthoni Ahago Advocates Client Acc</strong></p>
              <p>Account No: <strong className="font-mono">0100004918239</strong> | Swift: <strong className="font-mono">SBKENXNA</strong></p>
            </div>

            {/* Footer */}
            <div className="border-t border-[#DFD9CB] pt-2 flex items-center justify-between text-[10px] text-[#5B6472]">
              <span>LSK Electronic Fee Note Specification</span>
              <span className="font-mono">Computer Generated Tax Invoice</span>
            </div>

          </div>
        </div>

      </div>

      {/* Save as Reusable Template Modal Dialog */}
      {isSaveAsTemplateOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#101826]/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#DFD9CB] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DFD9CB] bg-[#101826] px-5 py-3.5 text-white">
              <div className="flex items-center space-x-2">
                <BookmarkPlus className="h-4 w-4 text-[#B8873B]" />
                <h4 className="font-fraunces text-sm font-bold">Save as Reusable Fee Note Template</h4>
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
                <label className="block font-bold text-[#101826] mb-1">
                  Template Title <span className="text-[#9C3B3B]">*</span>
                </label>
                <input
                  type="text"
                  value={saveTemplateTitle}
                  onChange={(e) => setSaveTemplateTitle(e.target.value)}
                  placeholder="e.g. Standard High Court Litigation Package"
                  required
                  className="w-full rounded-lg border border-[#DFD9CB] bg-white px-3 py-2 text-xs text-[#101826] focus:border-[#B8873B] focus:ring-1 focus:ring-[#B8873B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#101826] mb-1">
                  Practice Area
                </label>
                <select
                  value={saveTemplatePA}
                  onChange={(e) => setSaveTemplatePA(e.target.value)}
                  className="w-full rounded-lg border border-[#DFD9CB] bg-white px-3 py-2 text-xs text-[#101826]"
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
                <label className="block font-bold text-[#101826] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={saveTemplateDesc}
                  onChange={(e) => setSaveTemplateDesc(e.target.value)}
                  placeholder="Brief description of the legal service scope and applicable scale..."
                  className="w-full rounded-lg border border-[#DFD9CB] bg-white px-3 py-2 text-xs text-[#101826]"
                />
              </div>

              <div className="rounded-lg bg-[#F6F4EF] border border-[#DFD9CB] p-2.5 text-[11px] text-[#5B6472] space-y-1">
                <span className="font-bold text-[#101826]">Items to be saved ({items.length}):</span>
                <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                  {items.map((it, idx) => (
                    <li key={idx} className="truncate">
                      {it.description || 'Untitled Item'} (KES {(it.unitPriceKES || 0).toLocaleString()})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#DFD9CB] pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsSaveAsTemplateOpen(false)}
                  className="rounded-lg border border-[#DFD9CB] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B6472] hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#101826] hover:bg-[#1a2538] border border-[#B8873B]/50 px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Save to Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
