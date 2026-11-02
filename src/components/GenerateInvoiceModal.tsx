import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Search,
  Settings,
  MoreHorizontal,
  Info,
  GripVertical,
  Table as TableIcon,
  Trash2,
  Plus,
  ChevronDown,
  Upload,
  HelpCircle,
  X,
  UserPlus,
  Check,
  CheckCircle2,
  Eye,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  Client,
  LegalMatter,
  FeeNote,
  InvoiceLineItem,
  StandardServiceItem,
} from '../types';
import { generateInvoicePdf } from '../utils/invoicePdfGenerator';
import { loadStandardServiceSnippets } from '../utils/feeNoteTemplatesStorage';
import {
  getNextSequentialInvoiceNumber,
  recordUsedInvoiceNumber,
} from '../utils/chambersDataStorage';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  matters: LegalMatter[];
  existingInvoices?: FeeNote[];
  editingInvoice?: FeeNote | null;
  onAddInvoice: (invoice: FeeNote) => void;
  onUpdateInvoice?: (invoice: FeeNote) => void;
  onAddClient?: (client: Client) => void;
  initialSelectedMatterId?: string;
  initialClientId?: string;
}

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  clients,
  matters,
  existingInvoices,
  editingInvoice,
  onAddInvoice,
  onUpdateInvoice,
  onAddClient,
  initialSelectedMatterId,
  initialClientId,
}) => {
  if (!isOpen) return null;

  const isEditMode = Boolean(editingInvoice);

  // Selected Client State
  const [selectedClientId, setSelectedClientId] = useState<string>(() => editingInvoice?.clientId || initialClientId || '');
  const [clientSearchQuery, setClientSearchQuery] = useState<string>(() => {
    if (editingInvoice?.clientName) return editingInvoice.clientName;
    if (initialClientId) {
      const init = clients.find((c) => c.id === initialClientId);
      return init ? init.name : '';
    }
    return '';
  });
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('Nairobi, Kenya');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Invoice Meta Fields
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    if (editingInvoice?.invoiceNumber) return editingInvoice.invoiceNumber;
    return getNextSequentialInvoiceNumber(existingInvoices);
  });

  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    if (editingInvoice?.dateIssued) return editingInvoice.dateIssued;
    const today = new Date();
    return today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });

  const [terms, setTerms] = useState<string>(() => editingInvoice?.terms || 'Due on Receipt');

  const [dueDate, setDueDate] = useState<string>(() => {
    if (editingInvoice?.dueDate) return editingInvoice.dueDate;
    const today = new Date();
    return today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });

  // Subject (e.g. Website Maintenance / Legal Representation)
  const [subject, setSubject] = useState<string>(() => editingInvoice?.subject || editingInvoice?.matterTitle || '');

  // Item Table Rows
  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (editingInvoice?.items && editingInvoice.items.length > 0) {
      return editingInvoice.items.map((it) => ({ ...it }));
    }
    return [
      {
        id: 'item-1',
        description: '',
        subDescription: '',
        quantity: 0,
        unitPriceKES: 0,
        discountType: 'percent',
        discountPercent: 0,
        discountAmount: 0,
        discountKES: 0,
        totalPriceKES: 0,
        isTaxable: false,
        taxName: 'Select a Tax',
      },
    ];
  });

  // Customer Notes & Terms
  const [customerNotes, setCustomerNotes] = useState<string>(() => editingInvoice?.customerNotes || editingInvoice?.notes || 'Thanks for your business.');
  const [termsAndConditions, setTermsAndConditions] = useState<string>(() => editingInvoice?.termsAndConditions || '');
  const [attachedFiles, setAttachedFiles] = useState<string[]>(() => editingInvoice?.attachedFiles || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync form state whenever modal opens or editingInvoice changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingInvoice) {
      setSelectedClientId(editingInvoice.clientId || '');
      setClientSearchQuery(editingInvoice.clientName || '');
      setInvoiceNumber(editingInvoice.invoiceNumber || '');
      setInvoiceDate(editingInvoice.dateIssued || '');
      setTerms(editingInvoice.terms || 'Due on Receipt');
      setDueDate(editingInvoice.dueDate || '');
      setSubject(editingInvoice.subject || editingInvoice.matterTitle || '');
      if (editingInvoice.items && editingInvoice.items.length > 0) {
        setItems(editingInvoice.items.map((it) => ({ ...it })));
      } else {
        setItems([
          {
            id: 'item-1',
            description: '',
            subDescription: '',
            quantity: 1,
            unitPriceKES: 0,
            discountType: 'percent',
            discountPercent: 0,
            discountAmount: 0,
            discountKES: 0,
            totalPriceKES: 0,
            isTaxable: false,
            taxName: 'Select a Tax',
          },
        ]);
      }
      setCustomerNotes(editingInvoice.customerNotes || editingInvoice.notes || 'Thanks for your business.');
      setTermsAndConditions(editingInvoice.termsAndConditions || '');
      setAttachedFiles(editingInvoice.attachedFiles || []);
    } else {
      setSelectedClientId(initialClientId || '');
      if (initialClientId) {
        const init = clients.find((c) => c.id === initialClientId);
        setClientSearchQuery(init ? init.name : '');
      } else {
        setClientSearchQuery('');
      }
      setInvoiceNumber(getNextSequentialInvoiceNumber(existingInvoices));
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setInvoiceDate(dateStr);
      setTerms('Due on Receipt');
      setDueDate(dateStr);
      setSubject('');
      setItems([
        {
          id: 'item-1',
          description: '',
          subDescription: '',
          quantity: 0,
          unitPriceKES: 0,
          discountType: 'percent',
          discountPercent: 0,
          discountAmount: 0,
          discountKES: 0,
          totalPriceKES: 0,
          isTaxable: false,
          taxName: 'Select a Tax',
        },
      ]);
      setCustomerNotes('Thanks for your business.');
      setTermsAndConditions('');
      setAttachedFiles([]);
    }
  }, [isOpen, editingInvoice, initialClientId, existingInvoices, clients]);

  // Standard service items / quick dropdown
  const [openItemDropdownIndex, setOpenItemDropdownIndex] = useState<number | null>(null);
  const standardSnippets = loadStandardServiceSnippets();

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update Due Date whenever Terms change
  const handleTermsChange = (newTerms: string) => {
    setTerms(newTerms);
    const d = new Date();
    if (newTerms === 'Due on Receipt') {
      // same date
    } else if (newTerms === 'Net 15') {
      d.setDate(d.getDate() + 15);
    } else if (newTerms === 'Net 30') {
      d.setDate(d.getDate() + 30);
    } else if (newTerms === 'Net 45') {
      d.setDate(d.getDate() + 45);
    } else if (newTerms === 'Net 60') {
      d.setDate(d.getDate() + 60);
    } else if (newTerms === 'Due end of the month') {
      d.setMonth(d.getMonth() + 1, 0);
    } else if (newTerms === 'Due end of next month') {
      d.setMonth(d.getMonth() + 2, 0);
    }
    setDueDate(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
      const target = e.target as HTMLElement;
      if (!target.closest('.item-details-dropdown-container')) {
        setOpenItemDropdownIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter clients
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()))
  );

  const activeClient = clients.find((c) => c.id === selectedClientId);

  // Auto-fill matter subject if matter provided
  useEffect(() => {
    if (initialSelectedMatterId) {
      const target = matters.find((m) => m.id === initialSelectedMatterId);
      if (target) {
        setSubject(`${target.referenceNumber}: ${target.title}`);
        if (target.clientId) {
          setSelectedClientId(target.clientId);
          const cl = clients.find((c) => c.id === target.clientId);
          if (cl) setClientSearchQuery(cl.name);
        }
      }
    }
  }, [initialSelectedMatterId, matters, clients]);

  // Recalculate row amounts
  const updateItemRow = (
    index: number,
    field: keyof InvoiceLineItem,
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unitPriceKES) || 0;
      const gross = qty * rate;
      const discType = item.discountType || 'percent';

      let discKES = 0;
      if (discType === 'amount') {
        const amt = Number(item.discountAmount) || 0;
        discKES = Math.min(gross, Math.max(0, amt));
        item.discountKES = discKES;
        item.discountPercent = gross > 0 ? (discKES / gross) * 100 : 0;
      } else {
        const pct = Number(item.discountPercent) || 0;
        discKES = (gross * Math.min(100, Math.max(0, pct))) / 100;
        item.discountKES = discKES;
        item.discountAmount = discKES;
      }

      item.totalPriceKES = Math.max(0, gross - discKES);
      next[index] = item;
      return next;
    });
  };

  const handleToggleDiscountType = (index: number, newType: 'percent' | 'amount') => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], discountType: newType };
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unitPriceKES) || 0;
      const gross = qty * rate;

      let discKES = 0;
      if (newType === 'amount') {
        const amt = item.discountKES || 0;
        item.discountAmount = amt;
        discKES = Math.min(gross, Math.max(0, amt));
      } else {
        const pct = gross > 0 ? ((item.discountKES || 0) / gross) * 100 : (item.discountPercent || 0);
        item.discountPercent = Math.round(pct * 100) / 100;
        discKES = (gross * item.discountPercent) / 100;
      }

      item.discountKES = discKES;
      item.totalPriceKES = Math.max(0, gross - discKES);
      next[index] = item;
      return next;
    });
  };

  const handleAddNewRow = () => {
    const newRow: InvoiceLineItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      description: '',
      subDescription: '',
      quantity: 0,
      unitPriceKES: 0,
      discountType: 'percent',
      discountPercent: 0,
      discountAmount: 0,
      discountKES: 0,
      totalPriceKES: 0,
      isTaxable: false,
      taxName: 'Select a Tax',
    };
    setItems([...items, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length === 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          description: '',
          subDescription: '',
          quantity: 0,
          unitPriceKES: 0,
          discountType: 'percent',
          discountPercent: 0,
          discountAmount: 0,
          discountKES: 0,
          totalPriceKES: 0,
          isTaxable: false,
          taxName: 'Select a Tax',
        },
      ]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals (bottom discount removed per user instruction)
  const subTotal = items.reduce((acc, it) => acc + (it.totalPriceKES || 0), 0);
  const taxableItemsTotal = items.filter((it) => it.isTaxable).reduce((sum, it) => sum + (it.totalPriceKES || 0), 0);
  const vatAmount = taxableItemsTotal * 0.16;
  const totalAmount = subTotal + vatAmount;

  // Quick Client Creation
  const handleSaveNewClient = () => {
    if (!newClientName.trim()) {
      setToastMessage('Please enter a customer name.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: newClientName.trim(),
      type: 'Corporate',
      industry: 'Commercial Client',
      contactPerson: newClientName.trim(),
      email: newClientEmail.trim() || 'info@client.co.ke',
      phone: newClientPhone.trim() || '+254 700 000 000',
      city: newClientAddress.trim() || 'Nairobi',
      activeMattersCount: 0,
      totalBilledKES: 0,
    };
    if (onAddClient) onAddClient(newClient);
    setSelectedClientId(newClient.id);
    setClientSearchQuery(newClient.name);
    setIsNewClientModalOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
  };

  // Save invoice (Draft or Sent)
  const handleSaveInvoice = (status: 'Draft' | 'Sent') => {
    const finalClientName = activeClient?.name || clientSearchQuery.trim();

    if (!finalClientName) {
      setToastMessage('Please select or specify a Customer Name.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const finalInvoiceNumber = invoiceNumber.trim() || getNextSequentialInvoiceNumber(existingInvoices);
    recordUsedInvoiceNumber(finalInvoiceNumber);

    if (isEditMode && editingInvoice) {
      const prevPaid = editingInvoice.amountPaidKES !== undefined
        ? editingInvoice.amountPaidKES
        : (editingInvoice.status === 'Paid' ? editingInvoice.totalKES : 0);
      const newBalance = Math.max(0, totalAmount - prevPaid);
      let newStatus = editingInvoice.status;
      if (newBalance === 0) {
        newStatus = 'Paid';
      } else if (prevPaid > 0) {
        newStatus = 'Partially Paid';
      } else {
        newStatus = status === 'Draft' ? 'Pending' : 'Unpaid';
      }

      const updatedInvoice: FeeNote = {
        ...editingInvoice,
        invoiceNumber: finalInvoiceNumber,
        clientId: selectedClientId || editingInvoice.clientId || `client-${Date.now()}`,
        clientName: finalClientName,
        clientEmail: activeClient?.email || editingInvoice.clientEmail,
        clientAddress: activeClient?.city || editingInvoice.clientAddress || 'Nairobi, Kenya',
        matterTitle: subject.trim() || editingInvoice.matterTitle || 'Invoice Services',
        subject: subject.trim(),
        terms: terms,
        dateIssued: invoiceDate,
        dueDate: dueDate,
        items: items.filter((it) => it.description.trim() || it.totalPriceKES > 0),
        subtotalKES: subTotal,
        discountKES: editingInvoice.discountKES || 0,
        adjustmentKES: editingInvoice.adjustmentKES || 0,
        amountKES: subTotal,
        vatRatePercent: 16,
        vatKES: vatAmount,
        totalKES: totalAmount,
        amountPaidKES: prevPaid,
        balanceKES: newBalance,
        status: newStatus,
        customerNotes: customerNotes,
        notes: customerNotes,
        termsAndConditions: termsAndConditions,
        attachedFiles: attachedFiles,
      };

      if (onUpdateInvoice) {
        onUpdateInvoice(updatedInvoice);
      } else {
        onAddInvoice(updatedInvoice);
      }

      if (status === 'Sent') {
        try {
          const doc = generateInvoicePdf(updatedInvoice);
          doc.save(`${updatedInvoice.invoiceNumber}.pdf`);
        } catch (err) {
          console.warn('PDF auto-download warning:', err);
        }
      }

      onClose();
      return;
    }

    const newInvoice: FeeNote = {
      id: `fn-${Date.now()}`,
      invoiceNumber: finalInvoiceNumber,
      clientId: selectedClientId || `client-${Date.now()}`,
      clientName: finalClientName,
      clientEmail: activeClient?.email,
      clientAddress: activeClient?.city || 'Nairobi, Kenya',
      matterTitle: subject.trim() || 'Invoice Services',
      subject: subject.trim(),
      terms: terms,
      dateIssued: invoiceDate,
      dueDate: dueDate,
      items: items.filter((it) => it.description.trim() || it.totalPriceKES > 0),
      subtotalKES: subTotal,
      discountKES: 0,
      adjustmentKES: 0,
      amountKES: subTotal,
      vatRatePercent: 16,
      vatKES: vatAmount,
      totalKES: totalAmount,
      balanceKES: totalAmount,
      status: status === 'Draft' ? 'Pending' : 'Unpaid',
      customerNotes: customerNotes,
      notes: customerNotes,
      termsAndConditions: termsAndConditions,
      attachedFiles: attachedFiles,
    };

    onAddInvoice(newInvoice);

    if (status === 'Sent') {
      try {
        const doc = generateInvoicePdf(newInvoice);
        doc.save(`${newInvoice.invoiceNumber}.pdf`);
      } catch (err) {
        console.warn('PDF auto-download warning:', err);
      }
    }

    onClose();
  };

  // Preview PDF in new tab
  const handlePreviewPdf = () => {
    const finalClientName = activeClient?.name || clientSearchQuery.trim() || 'Customer';
    const tempInvoice: FeeNote = {
      id: `fn-temp-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || getNextSequentialInvoiceNumber(existingInvoices),
      clientId: selectedClientId,
      clientName: finalClientName,
      clientEmail: activeClient?.email,
      clientAddress: activeClient?.city || 'Nairobi, Kenya',
      matterTitle: subject.trim() || 'Invoice Services',
      subject: subject.trim(),
      terms: terms,
      dateIssued: invoiceDate,
      dueDate: dueDate,
      items: items.filter((it) => it.description.trim() || it.totalPriceKES > 0),
      subtotalKES: subTotal,
      discountKES: 0,
      adjustmentKES: 0,
      amountKES: subTotal,
      vatRatePercent: 16,
      vatKES: vatAmount,
      totalKES: totalAmount,
      balanceKES: totalAmount,
      status: 'Unpaid',
      customerNotes: customerNotes,
      notes: customerNotes,
      termsAndConditions: termsAndConditions,
    };

    try {
      const doc = generateInvoicePdf(tempInvoice);
      doc.save(`${tempInvoice.invoiceNumber}_Preview.pdf`);
      setToastMessage(`Generated and downloaded ${tempInvoice.invoiceNumber}_Preview.pdf`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to generate PDF preview.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Mock file attachment
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        names.push(files[i].name);
      }
      setAttachedFiles((prev) => [...prev, ...names]);
      setToastMessage(`Attached ${files.length} file(s)`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
          <div className="flex items-center space-x-2.5">
            <FileText className="h-6 w-6 text-slate-800" strokeWidth={1.8} />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900">
                  {isEditMode ? `Edit Fee Note: ${editingInvoice?.invoiceNumber}` : 'New Invoice'}
                </h1>
                {isEditMode && (
                  <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                    Editing Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditMode
                  ? 'Update line items, particulars, and billing terms for this fee note'
                  : 'Create a professional VAT-compliant legal fee note or proforma invoice'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePreviewPdf}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* In-Modal Toast / Alerts */}
        {toastMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-amber-500 hover:text-amber-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 md:p-8 space-y-6 text-sm text-slate-800 bg-white overflow-y-auto max-h-[calc(85vh-120px)]">
          
          {/* Top Metadata Section */}
          <div className="space-y-4 max-w-3xl">
            
            {/* Customer Name */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
              <label className="md:col-span-3 text-xs md:text-sm font-medium text-rose-600">
                Customer Name*
              </label>
              <div className="md:col-span-9 flex items-center space-x-2 relative" ref={clientDropdownRef}>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    placeholder="Select or add a customer"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-950 font-medium placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientSearchQuery('');
                        setSelectedClientId('');
                      }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="rounded-md bg-blue-500 hover:bg-blue-600 p-2 text-white transition cursor-pointer shadow-2xs flex items-center justify-center"
                  title="Search & select customer"
                >
                  <Search className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {isClientDropdownOpen && (
                  <div className="absolute left-0 right-10 top-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Chambers Clients</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewClientModalOpen(true);
                          setIsClientDropdownOpen(false);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add New Customer</span>
                      </button>
                    </div>

                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setClientSearchQuery(c.name);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`px-3 py-2.5 text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-between transition ${
                            c.id === selectedClientId ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-slate-800'
                          }`}
                        >
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-[11px] text-slate-500">{c.email || c.city || 'Client'}</p>
                          </div>
                          {c.id === selectedClientId && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No customer found matching "{clientSearchQuery}".
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice# */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
              <label className="md:col-span-3 text-xs md:text-sm font-medium text-rose-600">
                Invoice#*
              </label>
              <div className="md:col-span-9 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-000001"
                  className="w-full sm:w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm font-mono font-bold text-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = getNextSequentialInvoiceNumber(existingInvoices);
                    setInvoiceNumber(nextNum);
                  }}
                  className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  title="Generate next sequential number (e.g. INV-000001 series)"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Next Sequential</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const customStart = prompt('Set next sequential counter or enter starting number (e.g. 1 for INV-000001):', '1');
                    if (customStart !== null) {
                      const num = parseInt(customStart.replace(/\D/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        try {
                          localStorage.setItem('chambers_invoice_last_seq', String(num - 1));
                        } catch {}
                        setInvoiceNumber(`INV-${String(num).padStart(6, '0')}`);
                      }
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition cursor-pointer"
                  title="Configure starting sequence number (e.g. 1 -> INV-000001)"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <span className="text-[11px] font-medium text-slate-500">
                  Sequential Order (INV-000001)
                </span>
              </div>
            </div>

            {/* (Order Number REMOVED per user instruction) */}

            {/* Invoice Date, Terms, Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
              <label className="md:col-span-3 text-xs md:text-sm font-medium text-rose-600">
                Invoice Date*
              </label>
              <div className="md:col-span-9 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  placeholder="01 Nov 2026"
                  className="w-36 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />

                <span className="text-xs font-medium text-slate-600">Terms</span>
                <select
                  value={terms}
                  onChange={(e) => handleTermsChange(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due end of the month">Due end of the month</option>
                  <option value="Due end of next month">Due end of next month</option>
                  <option value="Custom">Custom</option>
                </select>

                <span className="text-xs font-medium text-slate-600">Due Date</span>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="01 Nov 2026"
                  className="w-36 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* (Salesperson REMOVED per user instruction) */}

            {/* Subject */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start">
              <label className="md:col-span-3 text-xs md:text-sm font-medium text-slate-700 flex items-center space-x-1 pt-2">
                <span>Subject</span>
                <Info className="h-3.5 w-3.5 text-slate-400" title="Project name or invoice summary" />
              </label>
              <div className="md:col-span-9">
                <textarea
                  rows={2}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Let your customer know what this Invoice is for"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-950 font-medium placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ITEM TABLE SECTION */}
          {/* ========================================================= */}
          <div className="border border-slate-200 rounded-lg overflow-visible shadow-2xs">
            {/* Table Header Bar (Scan Item & Bulk Actions removed per instruction) */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="font-bold text-xs md:text-sm text-slate-800">Item Table</span>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-left text-xs border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-8"></th>
                    <th className="py-2.5 px-3 min-w-[440px] md:min-w-[480px]">ITEM DETAILS</th>
                    <th className="py-2.5 px-3 w-24 text-right">QUANTITY</th>
                    <th className="py-2.5 px-3 w-32 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <span>RATE</span>
                        <TableIcon className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-32 text-right">DISCOUNT</th>
                    <th className="py-2.5 px-3 w-36">TAX</th>
                    <th className="py-2.5 px-3 w-28 text-right">AMOUNT</th>
                    <th className="py-2.5 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 px-2 text-slate-400 text-center">
                        <GripVertical className="h-4 w-4 mx-auto cursor-grab" />
                      </td>
                      <td className="py-3 px-3 relative item-details-dropdown-container">
                        {/* Interactive Item Input & Selection Dropdown */}
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={item.description}
                              onFocus={() => setOpenItemDropdownIndex(index)}
                              onChange={(e) => {
                                updateItemRow(index, 'description', e.target.value);
                                setOpenItemDropdownIndex(index);
                              }}
                              placeholder="Type or click to select an item."
                              className="w-full rounded-md border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 bg-white pr-8 px-3.5 py-2 text-xs md:text-sm text-slate-950 font-semibold placeholder:text-slate-500 shadow-2xs transition-colors"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenItemDropdownIndex(openItemDropdownIndex === index ? null : index);
                              }}
                              className="absolute right-1 text-slate-500 hover:text-slate-800 p-1.5 cursor-pointer"
                              title="Click to select standard practice item"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${openItemDropdownIndex === index ? 'rotate-180 text-blue-600' : ''}`} />
                            </button>
                          </div>

                          {/* Interactive Dropdown */}
                          {openItemDropdownIndex === index && (
                            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[440px] max-w-xl max-h-72 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-2xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                              <div className="p-2.5 bg-slate-50/95 sticky top-0 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-800">
                                <span className="flex items-center space-x-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                                  <span className="font-bold text-slate-900">Select Item / Fee Service</span>
                                </span>
                                <span className="text-[10px] text-slate-500">Type above to filter</span>
                              </div>
                              {standardSnippets
                                .filter((s) => {
                                  if (!item.description) return true;
                                  const q = item.description.toLowerCase();
                                  return (
                                    s.description.toLowerCase().includes(q) ||
                                    s.category.toLowerCase().includes(q) ||
                                    (s.practiceArea && s.practiceArea.toLowerCase().includes(q))
                                  );
                                })
                                .map((snippet) => (
                                  <div
                                    key={snippet.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const rate = snippet.unitPriceKES || 0;
                                      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
                                      const gross = qty * rate;
                                      const discType = item.discountType || 'percent';
                                      let discKES = 0;
                                      if (discType === 'amount') {
                                        discKES = Math.min(gross, item.discountAmount || 0);
                                      } else {
                                        discKES = (gross * (item.discountPercent || 0)) / 100;
                                      }

                                      setItems((prev) => {
                                        const next = [...prev];
                                        next[index] = {
                                          ...next[index],
                                          description: snippet.description,
                                          subDescription: snippet.category,
                                          quantity: qty,
                                          unitPriceKES: rate,
                                          discountKES: discKES,
                                          totalPriceKES: Math.max(0, gross - discKES),
                                          isTaxable: snippet.isTaxable,
                                          taxName: snippet.isTaxable ? 'VAT [16%]' : '0% Non-Taxable / Exempt',
                                        };
                                        return next;
                                      });
                                      setOpenItemDropdownIndex(null);
                                    }}
                                    className="p-2.5 hover:bg-blue-50/80 cursor-pointer transition text-left"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs font-semibold text-slate-950 leading-snug">{snippet.description}</p>
                                      <span className="font-mono font-bold text-xs text-blue-700 shrink-0">
                                        KES {snippet.unitPriceKES.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600">
                                      <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold">{snippet.category}</span>
                                      {snippet.statutoryReference && (
                                        <span className="text-slate-500">• {snippet.statutoryReference}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          value={item.subDescription || ''}
                          onChange={(e) => updateItemRow(index, 'subDescription', e.target.value)}
                          placeholder="Add description sub-line (e.g. Monthly website maintenance)"
                          className="w-full mt-1.5 rounded-md border border-slate-200 hover:border-slate-300 focus:border-blue-500 bg-slate-50/70 focus:bg-white px-3 py-1 text-xs text-slate-900 font-medium placeholder:text-slate-400 transition-colors"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.quantity === 0 || !item.quantity ? '' : item.quantity}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            updateItemRow(index, 'quantity', isNaN(val) ? 0 : val);
                          }}
                          placeholder="0"
                          className="w-20 text-right rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-950 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.unitPriceKES === 0 || !item.unitPriceKES ? '' : item.unitPriceKES}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            updateItemRow(index, 'unitPriceKES', isNaN(val) ? 0 : val);
                          }}
                          placeholder="0.00"
                          className="w-28 text-right rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-950 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end rounded-md shadow-2xs">
                          <input
                            type="number"
                            step={item.discountType === 'amount' ? '100' : '1'}
                            min="0"
                            max={item.discountType === 'amount' ? undefined : 100}
                            value={
                              item.discountType === 'amount'
                                ? (item.discountAmount === 0 || !item.discountAmount ? '' : item.discountAmount)
                                : (item.discountPercent === 0 || !item.discountPercent ? '' : item.discountPercent)
                            }
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              if (item.discountType === 'amount') {
                                updateItemRow(index, 'discountAmount', isNaN(val) ? 0 : val);
                              } else {
                                updateItemRow(index, 'discountPercent', isNaN(val) ? 0 : val);
                              }
                            }}
                            placeholder="0"
                            className="w-16 text-right rounded-l-md border border-r-0 border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-950 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <select
                            value={item.discountType || 'percent'}
                            onChange={(e) => handleToggleDiscountType(index, e.target.value as 'percent' | 'amount')}
                            className="rounded-r-md border border-slate-300 bg-slate-100 hover:bg-slate-200 px-1 py-1.5 text-[11px] font-bold text-slate-800 cursor-pointer focus:border-blue-500"
                            title="Discount mode: Percentage (%) or Amount (KES)"
                          >
                            <option value="percent">%</option>
                            <option value="amount">KES</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={item.taxName || 'Select a Tax'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isTax = val.includes('16%');
                            updateItemRow(index, 'taxName', val);
                            updateItemRow(index, 'isTaxable', isTax);
                          }}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-950 font-semibold focus:border-blue-500 shadow-2xs"
                        >
                          <option value="Select a Tax">Select a Tax</option>
                          <option value="VAT [16%]">VAT [16%]</option>
                          <option value="0% Non-Taxable / Exempt">0% Non-Taxable / Exempt</option>
                          <option value="Zero Rated [0%]">Zero Rated [0%]</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono text-xs md:text-sm text-slate-950">
                        {(item.totalPriceKES || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          className="text-slate-300 hover:text-rose-600 transition cursor-pointer p-1"
                          title="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer Buttons (Add Items in Bulk removed per instruction) */}
            <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewRow}
                className="inline-flex items-center space-x-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Row</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BOTTOM SPLIT: Customer Notes & Summary Calculations */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            
            {/* Left 7 cols: Customer Notes, Terms & File Attachments */}
            <div className="md:col-span-7 space-y-4">
              {/* Customer Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Notes
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-950 font-medium placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Will be displayed on the invoice</p>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-950 font-medium placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Attach File(s) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Attach File(s) to Invoice
                </label>
                <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileAttach}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>Upload File</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    You can upload a maximum of 10 files, 10MB each
                  </p>
                  {attachedFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                      {attachedFiles.map((fn, idx) => (
                        <span key={idx} className="inline-block bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                          {fn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 cols: Sub Total & Total (Bottom discount removed per user instruction) */}
            <div className="md:col-span-5 bg-slate-50/50 rounded-xl border border-slate-200 p-5 space-y-3.5 text-xs">
              {/* Sub Total */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Sub Total</span>
                <span className="font-bold font-mono text-slate-900">
                  {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tax / VAT if applicable */}
              {vatAmount > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-700">VAT (16%)</span>
                  <span className="font-bold font-mono text-slate-900">
                    {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Total ( KES ) */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Total ( KES )</span>
                <span className="font-heading text-lg font-bold text-slate-900 font-mono">
                  {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM ACTION BAR */}
        {/* ========================================================= */}
        <div className="border-t border-slate-200 px-6 py-4 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleSaveInvoice('Draft')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              {isEditMode ? 'Update as Draft' : 'Save as Draft'}
            </button>

            <button
              type="button"
              onClick={() => handleSaveInvoice('Sent')}
              className="inline-flex items-center space-x-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>{isEditMode ? 'Save & Update Fee Note' : 'Save and Send'}</span>
              <ChevronDown className="h-3.5 w-3.5 border-l border-blue-400/40 pl-1 -mr-1" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span>Total: <strong className="font-mono text-slate-900 text-sm">KES {totalAmount.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Modal: Add New Customer */}
        {isNewClientModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading font-bold text-base text-slate-900 flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <span>Add New Customer</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Customer / Company Name*</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Mukoma & Associates"
                    className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="accounts@client.co.ke"
                    className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Physical Address / City</label>
                  <input
                    type="text"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="Nairobi, Kenya"
                    className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewClient}
                  className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-2xs"
                >
                  Save Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End of Modals */}
      </div>
    </div>
  );
};
