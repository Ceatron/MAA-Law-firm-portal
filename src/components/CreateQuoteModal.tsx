import React, { useState, useId, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Building,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Percent,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { Client, LegalMatter, Quotation, QuoteLineItem, QuoteStatus } from '../types';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  matters: LegalMatter[];
  onSaveQuote: (quote: Quotation) => void;
  onAddClient?: (client: Client) => void;
  editingQuote?: Quotation | null;
}

const COMMON_QUOTE_TEMPLATES = [
  { description: 'Legal Representation & Senior Counsel Chamber Appearance', category: 'Professional Fees', unitPriceKES: 25000, isTaxable: true },
  { description: 'Drafting of Pleadings, Affidavits, Submissions & Case Digest', category: 'Drafting Pleading', unitPriceKES: 35000, isTaxable: true },
  { description: 'Judiciary CTS e-Filing Fee & Registry Stamp Assessment', category: 'Court Filing / CTS', unitPriceKES: 12500, isTaxable: false },
  { description: 'Comprehensive Trademark/Patent Search & Legal Opinion', category: 'Legal Research', unitPriceKES: 18000, isTaxable: true },
  { description: 'Pre-Trial Conference & Client Advisory Consultation (Hours)', category: 'Consultation', unitPriceKES: 15000, isTaxable: true },
  { description: 'Ministry of Lands / ArdhiSasa Official Searches & Registration', category: 'Disbursement', unitPriceKES: 7500, isTaxable: false },
];

export const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  isOpen,
  onClose,
  clients,
  matters,
  onSaveQuote,
  onAddClient,
  editingQuote,
}) => {
  const quoteNumberId = useId();
  const titleId = useId();
  const clientIdSelectId = useId();
  const quoteDateId = useId();
  const expiryDateId = useId();
  const termsId = useId();
  const notesId = useId();

  // State
  const [quoteNumber, setQuoteNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedMatterId, setSelectedMatterId] = useState<string>('');
  const [quoteDate, setQuoteDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('Draft');
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>(
    '1. This quotation is valid for thirty (30) calendar days from the date of issue.\n2. Professional legal fees are assessed pursuant to the Advocates (Remuneration) Order.\n3. Statutory disbursements (Judiciary CTS filing fees, registry levies, and stamp duty) are exempt from 16% VAT and subject to actual disbursements.'
  );

  // New Client quick fields if adding new client
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientKraPin, setNewClientKraPin] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('Nairobi, Kenya');

  // Line items
  const [items, setItems] = useState<QuoteLineItem[]>([
    {
      id: 'qitem-1',
      description: 'Legal Representation & Counsel Court Appearance',
      category: 'Professional Fees',
      quantity: 1,
      unitPriceKES: 17241.38,
      discountPercent: 0,
      discountKES: 0,
      totalPriceKES: 17241.38,
      isTaxable: true,
      vatAmountKES: 2758.62,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (editingQuote) {
        setQuoteNumber(editingQuote.quoteNumber);
        setTitle(editingQuote.title);
        setSelectedClientId(editingQuote.clientId);
        setQuoteDate(editingQuote.quoteDate);
        setExpiryDate(editingQuote.expiryDate);
        setQuoteStatus(editingQuote.status);
        setNotes(editingQuote.notes || '');
        setTerms(editingQuote.termsAndConditions || '');
        setItems(editingQuote.items || []);
        setIsCreatingNewClient(false);
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setQuoteNumber(`MAA-QUO-2026-${randomNum}`);
        setTitle('Legal Fee Quotation & Proforma Estimate');
        setSelectedClientId(clients[0]?.id || '');
        setSelectedMatterId('');
        const today = new Date();
        setQuoteDate(today.toISOString().split('T')[0]);
        const expiry = new Date();
        expiry.setDate(today.getDate() + 30);
        setExpiryDate(expiry.toISOString().split('T')[0]);
        setQuoteStatus('Draft');
        setNotes('Prepared by Muthoni Ahago & Associates Advocates.');
        setItems([
          {
            id: `qitem-${Date.now()}`,
            description: 'Professional Legal Counsel & Case Advisory Representation',
            category: 'Professional Fees',
            quantity: 1,
            unitPriceKES: 17241.38,
            discountPercent: 0,
            discountKES: 0,
            totalPriceKES: 17241.38,
            isTaxable: true,
            vatAmountKES: 2758.62,
          },
        ]);
        setIsCreatingNewClient(false);
      }
    }
  }, [isOpen, editingQuote, clients]);

  // Calculations
  const subtotalKES = items.reduce((sum, it) => sum + (it.quantity * it.unitPriceKES), 0);
  const totalDiscountKES = items.reduce((sum, it) => sum + (it.discountKES || 0), 0);
  const taxableSubtotalKES = items.reduce((sum, it) => {
    if (it.isTaxable !== false) {
      return sum + (it.totalPriceKES || 0);
    }
    return sum;
  }, 0);
  const nonTaxableSubtotalKES = items.reduce((sum, it) => {
    if (it.isTaxable === false) {
      return sum + (it.totalPriceKES || 0);
    }
    return sum;
  }, 0);
  const totalVatKES = Math.round(taxableSubtotalKES * 0.16);
  const grandTotalKES = taxableSubtotalKES + nonTaxableSubtotalKES + totalVatKES;

  // Add Item
  const handleAddItem = (template?: typeof COMMON_QUOTE_TEMPLATES[0]) => {
    const newItem: QuoteLineItem = template
      ? {
          id: `qitem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          description: template.description,
          category: template.category,
          quantity: 1,
          unitPriceKES: template.unitPriceKES,
          discountPercent: 0,
          discountKES: 0,
          totalPriceKES: template.unitPriceKES,
          isTaxable: template.isTaxable,
          vatAmountKES: template.isTaxable ? Math.round(template.unitPriceKES * 0.16) : 0,
        }
      : {
          id: `qitem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          description: 'Legal Advisory & Professional Consultation',
          category: 'Professional Fees',
          quantity: 1,
          unitPriceKES: 10000,
          discountPercent: 0,
          discountKES: 0,
          totalPriceKES: 10000,
          isTaxable: true,
          vatAmountKES: 1600,
        };

    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<QuoteLineItem>) => {
    setItems(
      items.map((it) => {
        if (it.id !== id) return it;
        const merged = { ...it, ...updates };
        const rawTotal = (merged.quantity || 1) * (merged.unitPriceKES || 0);
        const discountK = merged.discountPercent ? Math.round((rawTotal * merged.discountPercent) / 100) : 0;
        const lineTotal = Math.max(0, rawTotal - discountK);
        const isTaxable = merged.isTaxable !== false;
        const vatK = isTaxable ? Math.round(lineTotal * 0.16) : 0;

        return {
          ...merged,
          discountKES: discountK,
          totalPriceKES: lineTotal,
          vatAmountKES: vatK,
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('A quotation must contain at least one line item.');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientId = selectedClientId;
    let finalClientName = '';
    let finalClientEmail = '';
    let finalClientPhone = '';
    let finalKraPin = '';
    let finalClientAddress = '';

    if (isCreatingNewClient) {
      if (!newClientName.trim()) {
        alert('Please enter the client or company name.');
        return;
      }
      finalClientId = `client-${Date.now()}`;
      finalClientName = newClientName.trim();
      finalClientEmail = newClientEmail.trim() || 'contact@client.co.ke';
      finalClientPhone = newClientPhone.trim() || '+254 700 000 000';
      finalKraPin = newClientKraPin.trim().toUpperCase() || 'P000000000X';
      finalClientAddress = newClientAddress.trim();

      const newClientObj: Client = {
        id: finalClientId,
        name: finalClientName,
        type: 'Corporate',
        industry: 'Legal Services Client',
        kraPin: finalKraPin,
        contactPerson: finalClientName,
        email: finalClientEmail,
        phone: finalClientPhone,
        city: finalClientAddress,
        activeMattersCount: 0,
        totalBilledKES: 0,
        retainerStatus: 'Per-Matter',
      };

      if (onAddClient) {
        onAddClient(newClientObj);
      }
    } else {
      const existingClient = clients.find((c) => c.id === selectedClientId);
      if (existingClient) {
        finalClientName = existingClient.name;
        finalClientEmail = existingClient.email;
        finalClientPhone = existingClient.phone;
        finalKraPin = existingClient.kraPin;
        finalClientAddress = existingClient.city;
      }
    }

    if (items.length === 0 || subtotalKES <= 0) {
      alert('Please add at least one line item with a valid price.');
      return;
    }

    const newQuote: Quotation = {
      id: editingQuote ? editingQuote.id : `quo-${Date.now()}`,
      quoteNumber: quoteNumber.trim() || `MAA-QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim() || 'Legal Fee Quotation & Proforma Estimate',
      clientId: finalClientId,
      clientName: finalClientName || 'Prospective Client',
      clientEmail: finalClientEmail,
      clientPhone: finalClientPhone,
      clientAddress: finalClientAddress,
      clientKraPin: finalKraPin,
      matterId: selectedMatterId || undefined,
      matterTitle: matters.find((m) => m.id === selectedMatterId)?.title,
      quoteDate: quoteDate,
      expiryDate: expiryDate,
      items: items,
      subtotalKES: subtotalKES,
      discountPercent: subtotalKES > 0 ? (totalDiscountKES / subtotalKES) * 100 : 0,
      discountKES: totalDiscountKES,
      taxableAmountKES: taxableSubtotalKES,
      nonTaxableAmountKES: nonTaxableSubtotalKES,
      vatKES: totalVatKES,
      totalKES: grandTotalKES,
      status: quoteStatus,
      notes: notes.trim(),
      termsAndConditions: terms.trim(),
      createdAt: editingQuote ? editingQuote.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveQuote(newQuote);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-stone-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0098db]/20 text-[#0098db] border border-[#0098db]/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-base font-bold text-white">
                {editingQuote ? 'Edit Quotation / Estimate' : 'Generate Legal Fee Quotation'}
              </h2>
              <p className="text-xs text-stone-300">
                Create official proforma fee estimate with itemized VAT & terms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Quote Meta Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor={quoteNumberId} className="block text-xs font-bold text-stone-700 mb-1">
                Quote Number <span className="text-red-500">*</span>
              </label>
              <input
                id={quoteNumberId}
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono font-bold text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>

            <div>
              <label htmlFor={quoteDateId} className="block text-xs font-bold text-stone-700 mb-1">
                Quote Date <span className="text-red-500">*</span>
              </label>
              <input
                id={quoteDateId}
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>

            <div>
              <label htmlFor={expiryDateId} className="block text-xs font-bold text-stone-700 mb-1">
                Expiry Date (Validity) <span className="text-red-500">*</span>
              </label>
              <input
                id={expiryDateId}
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
              />
            </div>
          </div>

          {/* Subject / Title */}
          <div>
            <label htmlFor={titleId} className="block text-xs font-bold text-stone-700 mb-1">
              Quotation Subject / Matter Description <span className="text-red-500">*</span>
            </label>
            <input
              id={titleId}
              type="text"
              placeholder="e.g. Legal Fee Quotation for Intellectual Property & Trademark Protection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
            />
          </div>

          {/* Client Selection / Creation */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                <Building className="h-4 w-4 text-[#0098db]" />
                <span>Client & Particulars</span>
              </span>

              <button
                type="button"
                onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                className="text-xs font-bold text-[#0098db] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{isCreatingNewClient ? 'Select Existing Client' : '+ Add New Client'}</span>
              </button>
            </div>

            {isCreatingNewClient ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Kenya Ltd"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    KRA PIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. P051234567X"
                    value={newClientKraPin}
                    onChange={(e) => setNewClientKraPin(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs uppercase font-mono text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="legal@client.co.ke"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Phone / City
                  </label>
                  <input
                    type="text"
                    placeholder="+254 700 000 000 • Nairobi"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor={clientIdSelectId} className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Select Client
                  </label>
                  <select
                    id={clientIdSelectId}
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Quote Status
                  </label>
                  <select
                    value={quoteStatus}
                    onChange={(e) => setQuoteStatus(e.target.value as QuoteStatus)}
                    className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800"
                  >
                    <option value="Draft">Draft (Internal Review)</option>
                    <option value="Sent">Sent to Client</option>
                    <option value="Accepted">Accepted by Client</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-stone-800">
                  Quotation Line Items & Fee Particulars
                </h3>
                <p className="text-[11px] text-stone-500">
                  Itemize professional fees and disbursements. Toggle 16% VAT per row.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="flex items-center space-x-1 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Quick Template Presets */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center mr-1">
                <Sparkles className="h-3 w-3 text-[#0098db] mr-1" />
                Quick Templates:
              </span>
              {COMMON_QUOTE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddItem(tmpl)}
                  className="rounded bg-white border border-stone-200 px-2 py-1 text-[11px] text-stone-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900 transition-colors cursor-pointer"
                >
                  + {tmpl.category} (KES {tmpl.unitPriceKES.toLocaleString()})
                </button>
              ))}
            </div>

            {/* Items Table */}
            <div className="rounded-xl border border-stone-200 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Description & Particulars</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty / Hrs</th>
                    <th className="py-2.5 px-3 w-28 text-right">Rate (KES)</th>
                    <th className="py-2.5 px-2 w-20 text-center">Disc. %</th>
                    <th className="py-2.5 px-2 w-24 text-center">VAT 16%</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (KES)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          className="w-full rounded border border-stone-200 px-2 py-1 text-xs font-medium text-stone-900"
                        />
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-stone-400">Category:</span>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                            className="text-[10px] rounded border border-stone-200 py-0.5 px-1 bg-white text-stone-600"
                          >
                            <option value="Professional Fees">Professional Fees</option>
                            <option value="Drafting Pleading">Drafting Pleading</option>
                            <option value="Court Filing / CTS">Court Filing / CTS</option>
                            <option value="Legal Research">Legal Research</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Disbursement">Disbursement</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                          className="w-16 rounded border border-stone-200 px-1 py-1 text-xs text-center font-mono"
                        />
                      </td>

                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={item.unitPriceKES}
                          onChange={(e) => handleUpdateItem(item.id, { unitPriceKES: parseFloat(e.target.value) || 0 })}
                          className="w-24 rounded border border-stone-200 px-1 py-1 text-xs text-right font-mono font-semibold"
                        />
                      </td>

                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="0%"
                          value={item.discountPercent || ''}
                          onChange={(e) => handleUpdateItem(item.id, { discountPercent: parseFloat(e.target.value) || 0 })}
                          className="w-14 rounded border border-stone-200 px-1 py-1 text-xs text-center font-mono"
                        />
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, { isTaxable: item.isTaxable === false ? true : false })}
                          className={`rounded px-2 py-1 text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                            item.isTaxable !== false
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {item.isTaxable !== false ? '16% Tax' : 'Exempt'}
                        </button>
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {item.totalPriceKES.toLocaleString()}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-stone-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-1.5 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="flex justify-between text-stone-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-semibold">KES {subtotalKES.toLocaleString()}</span>
                </div>
                {totalDiscountKES > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">- KES {totalDiscountKES.toLocaleString()}</span>
                  </div>
                )}
                {taxableSubtotalKES > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Fees:</span>
                    <span className="font-mono">KES {taxableSubtotalKES.toLocaleString()}</span>
                  </div>
                )}
                {nonTaxableSubtotalKES > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Exempt Disbursements:</span>
                    <span className="font-mono">KES {nonTaxableSubtotalKES.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-700 font-semibold pt-1 border-t border-stone-200">
                  <span>VAT (16% on taxable):</span>
                  <span className="font-mono font-bold">KES {totalVatKES.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-[#132c3f] text-white p-2.5 rounded-lg font-bold text-sm mt-2">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-[#00c0ef]">KES {grandTotalKES.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <label htmlFor={termsId} className="block text-xs font-bold text-stone-700 mb-1">
              Standard Terms & Conditions (Remuneration & Validity)
            </label>
            <textarea
              id={termsId}
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={notesId} className="block text-xs font-bold text-stone-700 mb-1">
              Internal Notes / Special Instructions (Optional)
            </label>
            <textarea
              id={notesId}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:border-[#0098db] focus:ring-1 focus:ring-[#0098db]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0098db] hover:bg-[#0087c2] text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {editingQuote ? 'Save Changes' : 'Save Quotation'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
