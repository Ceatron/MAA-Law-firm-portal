import React, { useState, useEffect } from 'react';
import {
  X,
  Gavel,
  Users,
  Building2,
  Calendar,
  Receipt,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { PracticeArea, LegalMatter, Client, Advocate } from '../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../utils/staffStorage';
import { DraggableModal } from './common/DraggableModal';

interface NewMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatter: (newMatter: LegalMatter) => void;
  clients?: Client[];
  matters?: LegalMatter[];
  advocates?: Advocate[];
  onAddClient?: (newClient: Client) => void;
  currentAdvocate?: Advocate;
}

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  onAddMatter,
  clients = [],
  advocates = [],
  onAddClient,
  currentAdvocate,
}) => {
  const staffList = (advocates.length > 0 ? advocates : loadVisibleStaffRoster()).filter(
    (a) => !isSysAdminUser(a)
  );

  const isSysAdmin = isSysAdminUser(currentAdvocate);
  const isManagingAdvocate =
    isSysAdmin ||
    currentAdvocate?.role === 'Managing Advocate' ||
    currentAdvocate?.id === 'adv-1' ||
    Boolean(currentAdvocate?.title?.toLowerCase().includes('managing'));
  const canAssignMatters = isSysAdmin || isManagingAdvocate;

  // Helper for today and yesterday ISO dates
  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [isCustomClient, setIsCustomClient] = useState<boolean>(false);
  const [opposingParty, setOpposingParty] = useState('');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('Civil Litigation');
  const [courtRegistry, setCourtRegistry] = useState('');
  const [courtCaseNumber, setCourtCaseNumber] = useState('');
  const [advocateId, setAdvocateId] = useState(() => {
    if (currentAdvocate?.id && staffList.some((a) => a.id === currentAdvocate.id)) {
      return currentAdvocate.id;
    }
    return staffList[0]?.id || 'adv-1';
  });
  const [lodgedDate, setLodgedDate] = useState<string>(getTodayISO());
  const [activeDateBtn, setActiveDateBtn] = useState<'today' | 'yesterday' | 'custom'>('today');

  const [nextCourtDate, setNextCourtDate] = useState('');

  // Fee State: User enters amount or ticks "To be discussed later"
  const [estimatedFeeKES, setEstimatedFeeKES] = useState('');
  const [feeToBeDiscussedLater, setFeeToBeDiscussedLater] = useState(false);

  // Registry priority with distinct color states
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [description, setDescription] = useState('');

  // Initialize selected client
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId && !isCustomClient) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, isCustomClient]);

  // Automatically parse opposing party if title contains ' v. ' or ' vs '
  useEffect(() => {
    if (title && !opposingParty) {
      const vsMatch = title.split(/\s+v\.?\s+|\s+vs\.?\s+|\s+versus\s+/i);
      if (vsMatch.length > 1) {
        const potentialOpponent = vsMatch[1].replace(/& Anor|& Others|& 2 Others/i, '').trim();
        if (potentialOpponent && potentialOpponent.length > 2) {
          setOpposingParty(potentialOpponent);
        }
      }
    }
  }, [title]);

  if (!isOpen) return null;

  const handleSelectToday = () => {
    setActiveDateBtn('today');
    setLodgedDate(getTodayISO());
  };

  const handleSelectYesterday = () => {
    setActiveDateBtn('yesterday');
    setLodgedDate(getYesterdayISO());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let matchedClient = clients.find((c) => c.id === selectedClientId);
    let resolvedClientName = '';
    let resolvedClientId = '';

    if (isCustomClient) {
      resolvedClientName = customClientName.trim() || 'New Instructing Client';
      const existingByName = clients.find(
        (c) => c.name.toLowerCase() === resolvedClientName.toLowerCase()
      );
      if (existingByName) {
        matchedClient = existingByName;
        resolvedClientId = existingByName.id;
      } else {
        resolvedClientId = `cli-${Date.now()}`;
        // Automatically create and register new client into the directory
        if (onAddClient) {
          const autoCreatedClient: Client = {
            id: resolvedClientId,
            name: resolvedClientName,
            type: resolvedClientName.toLowerCase().includes('ltd') ||
                  resolvedClientName.toLowerCase().includes('plc') ||
                  resolvedClientName.toLowerCase().includes('inc') ||
                  resolvedClientName.toLowerCase().includes('bank') ||
                  resolvedClientName.toLowerCase().includes('corp')
              ? 'Corporate'
              : 'Individual',
            industry: practiceArea,
            contactPerson: resolvedClientName,
            email: `contact@${resolvedClientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.co.ke`,
            phone: '+254 700 000 000',
            city: 'Nairobi',
            activeMattersCount: 1,
            totalBilledKES: 0,
          };
          onAddClient(autoCreatedClient);
        }
      }
    } else if (matchedClient) {
      resolvedClientName = matchedClient.name;
      resolvedClientId = matchedClient.id;
    } else {
      resolvedClientName = clients[0]?.name || 'Instructing Client';
      resolvedClientId = clients[0]?.id || `cli-${Date.now()}`;
    }

    const selectedAdv = staffList.find((a) => a.id === advocateId) || staffList[0];

    const cleanFee = estimatedFeeKES.replace(/,/g, '').trim();
    const parsedFee = (!feeToBeDiscussedLater && cleanFee) ? parseFloat(cleanFee) || 0 : 0;
    const isFeeTBD = feeToBeDiscussedLater || !cleanFee || parsedFee === 0;

    const formatDisplayDate = (dStr: string) => {
      try {
        if (!dStr) return '';
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return dStr;
      }
    };

    const formattedLodgedDate = lodgedDate ? formatDisplayDate(lodgedDate) : '';
    const formattedNextCourtDate = nextCourtDate ? formatDisplayDate(nextCourtDate) : '';
    const defaultTodayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newMatter: LegalMatter = {
      id: `mat-${Date.now()}`,
      referenceNumber: `MAA/${practiceArea.substring(0, 3).toUpperCase()}/2026/${Math.floor(
        100 + Math.random() * 900
      )}`,
      title: title.trim(),
      clientName: resolvedClientName,
      clientId: resolvedClientId,
      opposingParty: opposingParty.trim() || 'N/A (Non-contentious)',
      conflictCheckStatus: 'Cleared',
      conflictCertificateRef: `LSK-CONF-2026-${Math.floor(100 + Math.random() * 900)}`,
      practiceArea,
      courtRegistry: courtRegistry.trim() || undefined,
      courtCaseNumber: courtCaseNumber.trim() || undefined,
      ctsFilingId: courtCaseNumber.trim() ? `CTS-2026-NBI-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      responsibleAdvocateId: selectedAdv.id,
      responsibleAdvocateName: selectedAdv.name,
      status: 'Filing Pending',
      nextCourtDate: formattedNextCourtDate || undefined,
      courtDatePurpose: nextCourtDate ? 'Mention' : undefined,
      nextDeadlineDate: formattedNextCourtDate || 'None Scheduled',
      nextDeadlineDescription: nextCourtDate ? 'Court appearance / mention' : 'Advisory / Non-court work',
      estimatedFeeKES: parsedFee,
      feeToBeDiscussedLater: isFeeTBD,
      billedKES: 0,
      paidKES: 0,
      createdDate: formattedLodgedDate || defaultTodayFormatted,
      lodgedDate: formattedLodgedDate || undefined,
      description:
        description.trim() || 'New matter registered in firm workspace registry.',
      priority,
      documentsCount: 0,
      tags: [],
      createdByAdvocateId: currentAdvocate?.id || 'adv-1',
      createdByName: currentAdvocate?.name || 'Adv. Costa Kimathi',
    };

    onAddMatter(newMatter);
    onClose();
  };

  return (
    <div
      id="new-matter-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <DraggableModal
        id="register-new-legal-matter-modal"
        gripLabel="REGISTER NEW LEGAL MATTER"
        className="w-full max-w-4xl bg-white rounded-xl border border-[#E1DFD6] overflow-hidden shadow-2xl my-auto text-[#1E1D1A]"
      >
        {/* Modal Header */}
        <div
          data-drag-handle="true"
          className="flex items-center justify-between px-7 py-4 border-b border-[#E1DFD6] bg-[#fbfaf6] cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E6F1FB] flex items-center justify-center text-[#0C447C] shrink-0 border border-blue-200">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-stone-900 leading-tight font-serif">
                Register New Legal Matter
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Create and index a new case file in the firm workspace registry
              </p>
            </div>
          </div>
          <button
            type="button"
            id="new-matter-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[72vh] overflow-y-auto px-7 py-6 space-y-6">
            {/* Matter title */}
            <div>
              <label className="block text-xs text-stone-700 mb-1.5 font-bold uppercase tracking-wider">
                Matter Title & Full Caption *
              </label>
              <input
                id="new-matter-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter matter title"
                className="w-full h-11 px-3.5 text-sm text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all placeholder:text-stone-400 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>

            {/* Section: Parties */}
            <div className="rounded-lg border border-[#e2dfd5] bg-stone-50/40 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <Users className="h-4 w-4 text-[#0B63E5]" />
                <span className="text-xs text-stone-800 font-bold uppercase tracking-wider">
                  Instruction & Parties
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Represented Client Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-stone-700 font-bold">
                      Represented Client / Instructing Party *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomClient(!isCustomClient);
                        if (!isCustomClient) {
                          setCustomClientName('');
                        }
                      }}
                      className="text-[11px] font-semibold text-[#0B63E5] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {isCustomClient ? 'Choose Existing Client' : '+ Add New Client'}
                    </button>
                  </div>

                  {isCustomClient ? (
                    <div className="space-y-1">
                      <input
                        id="new-matter-custom-client-input"
                        type="text"
                        required
                        value={customClientName}
                        onChange={(e) => setCustomClientName(e.target.value)}
                        placeholder="Enter new client or organization name"
                        className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#0B63E5] rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-100"
                        autoFocus
                      />
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Will be automatically added to the firm client directory upon registration.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="new-matter-client-select"
                        value={selectedClientId}
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setIsCustomClient(true);
                            setCustomClientName('');
                          } else {
                            setSelectedClientId(e.target.value);
                          }
                        }}
                        className="w-full h-10 px-3 pr-8 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 cursor-pointer"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type} • {c.industry || 'Client'})
                          </option>
                        ))}
                        <option value="__add_new__">+ Register New Client...</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Opposing Party */}
                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Opposing / Adverse Party
                  </label>
                  <input
                    id="new-matter-opposing-input"
                    type="text"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    placeholder="Enter opposing party name if applicable"
                    className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all placeholder:text-stone-400 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Section: Forum, Registry & Counsel */}
            <div className="rounded-lg border border-[#e2dfd5] bg-stone-50/40 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <Building2 className="h-4 w-4 text-[#0B63E5]" />
                <span className="text-xs text-stone-800 font-bold uppercase tracking-wider">
                  Court Forum, Practice Area & Assigned Counsel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Practice Area
                  </label>
                  <select
                    id="new-matter-practice-area-select"
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value as PracticeArea)}
                    className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Commercial Law">Commercial & Tax</option>
                    <option value="Conveyancing Law">Conveyancing & Land</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Succession Law">Succession & Probate</option>
                    <option value="Bank Securities">Bank Securities & Perfection</option>
                    <option value="Constitutional & Tax">Constitutional & Judicial Review</option>
                    <option value="Employment & Labour">Employment & Labour (ELRC)</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Court Registry / Forum
                  </label>
                  <input
                    id="new-matter-court-registry-input"
                    type="text"
                    value={courtRegistry}
                    onChange={(e) => setCourtRegistry(e.target.value)}
                    placeholder="Enter court registry or forum"
                    className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all placeholder:text-stone-400 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Court Suit / Petition Number
                  </label>
                  <input
                    id="new-matter-suit-no-input"
                    type="text"
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    placeholder="Enter case number"
                    className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all placeholder:text-stone-400 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Responsible Advocate
                  </label>
                  <select
                    id="new-matter-advocate-select"
                    value={advocateId}
                    onChange={(e) => setAdvocateId(e.target.value)}
                    disabled={!canAssignMatters}
                    className={`w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 ${
                      !canAssignMatters ? 'bg-stone-100 cursor-not-allowed opacity-80' : 'cursor-pointer'
                    }`}
                  >
                    {staffList.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Date Lodged
                  </label>
                  <input
                    id="date-lodged"
                    type="date"
                    required
                    value={lodgedDate}
                    onChange={(e) => {
                      setLodgedDate(e.target.value);
                      setActiveDateBtn('custom');
                    }}
                    className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      id="btn-today"
                      onClick={handleSelectToday}
                      className={`flex-1 h-6 text-[10px] rounded border transition-all cursor-pointer font-medium ${
                        activeDateBtn === 'today'
                          ? 'bg-blue-50 text-[#0B63E5] border-blue-200 font-bold'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      id="btn-yesterday"
                      onClick={handleSelectYesterday}
                      className={`flex-1 h-6 text-[10px] rounded border transition-all cursor-pointer font-medium ${
                        activeDateBtn === 'yesterday'
                          ? 'bg-blue-50 text-[#0B63E5] border-blue-200 font-bold'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      Yesterday
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Next Court Date
                  </label>
                  <input
                    type="date"
                    value={nextCourtDate}
                    onChange={(e) => setNextCourtDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Leave blank for non-court or advisory work.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Fee & Distinctly Colored Priority Options */}
            <div className="rounded-lg border border-[#e2dfd5] bg-stone-50/40 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <Receipt className="h-4 w-4 text-[#0B63E5]" />
                <span className="text-xs text-stone-800 font-bold uppercase tracking-wider">
                  Fee Arrangement & Registry Priority
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Agreed or Estimated Fee (KES)
                  </label>
                  <input
                    type="text"
                    id="fee-input"
                    disabled={feeToBeDiscussedLater}
                    value={feeToBeDiscussedLater ? '' : estimatedFeeKES}
                    onChange={(e) => setEstimatedFeeKES(e.target.value)}
                    placeholder="Enter fee amount in KES"
                    className={`w-full h-10 px-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all placeholder:text-stone-400 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 ${
                      feeToBeDiscussedLater ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''
                    }`}
                  />
                  <label className="flex items-center gap-2 mt-2 text-xs text-stone-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="fee-later"
                      checked={feeToBeDiscussedLater}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFeeToBeDiscussedLater(checked);
                        if (checked) setEstimatedFeeKES('');
                      }}
                      className="w-4 h-4 accent-[#0B63E5] cursor-pointer"
                    />
                    <span>Fee to be discussed later with client</span>
                  </label>
                </div>

                {/* Priority with Distinct Colors */}
                <div>
                  <label className="block text-xs text-stone-700 mb-1.5 font-bold">
                    Registry Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Low Priority: Emerald */}
                    <button
                      type="button"
                      onClick={() => setPriority('Low')}
                      className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        priority === 'Low'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold ring-2 ring-emerald-300'
                          : 'bg-emerald-50/70 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`h-3.5 w-3.5 ${priority === 'Low' ? 'text-white' : 'text-emerald-600'}`} />
                        <span>Low</span>
                      </div>
                      <span className={`text-[10px] mt-0.5 ${priority === 'Low' ? 'text-emerald-100' : 'text-emerald-700 font-normal'}`}>
                        Standard
                      </span>
                    </button>

                    {/* Medium Priority: Amber */}
                    <button
                      type="button"
                      onClick={() => setPriority('Medium')}
                      className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        priority === 'Medium'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs font-bold ring-2 ring-amber-300'
                          : 'bg-amber-50/70 text-amber-800 border-amber-300 hover:bg-amber-100 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className={`h-3.5 w-3.5 ${priority === 'Medium' ? 'text-white' : 'text-amber-600'}`} />
                        <span>Medium</span>
                      </div>
                      <span className={`text-[10px] mt-0.5 ${priority === 'Medium' ? 'text-amber-100' : 'text-amber-700 font-normal'}`}>
                        Normal Track
                      </span>
                    </button>

                    {/* High Priority: Rose/Red */}
                    <button
                      type="button"
                      onClick={() => setPriority('High')}
                      className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        priority === 'High'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold ring-2 ring-rose-300'
                          : 'bg-rose-50/70 text-rose-800 border-rose-300 hover:bg-rose-100 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`h-3.5 w-3.5 ${priority === 'High' ? 'text-white' : 'text-rose-600'}`} />
                        <span>High</span>
                      </div>
                      <span className={`text-[10px] mt-0.5 ${priority === 'High' ? 'text-rose-100' : 'text-rose-700 font-normal'}`}>
                        Urgent / Court
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Summary & Instruction Notes */}
            <div>
              <label className="block text-xs text-stone-700 mb-1.5 font-bold uppercase tracking-wider">
                Case Summary & Instruction Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of client instructions, key issues, relief sought"
                className="w-full min-h-[80px] p-3 text-xs text-stone-900 bg-white border border-[#C9C7BC] rounded-lg outline-none transition-all placeholder:text-stone-400 focus:border-[#0B63E5] focus:ring-2 focus:ring-blue-100 resize-y"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-7 py-4 border-t border-[#E1DFD6] bg-[#fbfaf6]">
            <span className="text-xs text-stone-500 font-medium">
              Chambers Registry System
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="new-matter-cancel-btn"
                onClick={onClose}
                className="h-9 px-4 text-xs rounded-lg border border-stone-300 text-stone-700 bg-white hover:bg-stone-100 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="new-matter-submit-btn"
                className="h-9 px-5 text-xs rounded-lg bg-[#0B63E5] text-white font-bold hover:bg-[#0256D0] shadow-xs cursor-pointer transition-colors"
              >
                Register Matter
              </button>
            </div>
          </div>
        </form>
      </DraggableModal>
    </div>
  );
};
