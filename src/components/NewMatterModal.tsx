import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  Building2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Filter,
  FileText,
  Calendar,
  ArrowRight,
  Info,
  Check,
  Tag,
} from 'lucide-react';
import { PracticeArea, LegalMatter, Client, Advocate } from '../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../utils/staffStorage';

interface NewMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatter: (newMatter: LegalMatter) => void;
  clients?: Client[];
  matters?: LegalMatter[];
  advocates?: Advocate[];
  onAddClient?: (newClient: Client) => void;
}

interface ConflictMatch {
  source: 'Active Client' | 'Existing Matter' | 'Conflict Database' | 'Contacts & Directors';
  entity: string;
  matchedField: 'Client Name' | 'Opposing Party' | 'Search Query' | 'Contact / Director';
  details: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  relatedMatterRef?: string;
}

type ConflictStatus = 'Cleared' | 'Potential Conflict' | 'Direct Conflict' | 'Waiver Recorded';

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  onAddMatter,
  clients = [],
  matters = [],
  advocates = [],
  onAddClient,
}) => {
  const staffList = (advocates.length > 0 ? advocates : loadVisibleStaffRoster()).filter(
    (a) => !isSysAdminUser(a)
  );
  if (!isOpen) return null;

  // Navigation state within modal
  const [activeTab, setActiveTab] = useState<'form' | 'conflictSearch'>('form');

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
  const [clientId, setClientId] = useState(clients[0]?.id || 'custom');
  const [clientCustomName, setClientCustomName] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('Civil Litigation');
  const [courtRegistry, setCourtRegistry] = useState('High Court Commercial & Tax Division - Milimani Law Courts');
  const [courtCaseNumber, setCourtCaseNumber] = useState('');
  const [advocateId, setAdvocateId] = useState(staffList[0]?.id || 'staff-ma-1');
  const [lodgedDate, setLodgedDate] = useState<string>(getTodayISO());
  const [estimatedFeeKES, setEstimatedFeeKES] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [courtDatePurpose, setCourtDatePurpose] = useState<string>('Mention');
  const [deadlineDescription, setDeadlineDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const presetTags = ['Urgent', 'Pro Bono', 'Court of Appeal', 'Supreme Court', 'High Value', 'Public Interest', 'ArdhiSasa', 'Commercial'];

  const toggleTag = (tagToToggle: string) => {
    if (tags.includes(tagToToggle)) {
      setTags(tags.filter((t) => t !== tagToToggle));
    } else {
      setTags([...tags, tagToToggle]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Conflict Tool State
  const [isScanning, setIsScanning] = useState(false);
  const [conflictStatus, setConflictStatus] = useState<ConflictStatus>('Cleared');
  const [conflictMatches, setConflictMatches] = useState<ConflictMatch[]>([]);
  const [certificateRef, setCertificateRef] = useState(`LSK-CONF-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [showMatchDetails, setShowMatchDetails] = useState(true);
  const [waiverNote, setWaiverNote] = useState('');
  const [isWaiverRecorded, setIsWaiverRecorded] = useState(false);

  // Standalone Conflict Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConflictMatch[]>([]);
  const [searchFilter, setSearchFilter] = useState<'All' | 'Active Clients' | 'Matters' | 'Conflict Database'>('All');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchToast, setSearchToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSearchToast(msg);
    setTimeout(() => setSearchToast(null), 3000);
  };

  // Automatically parse opposing party if title contains ' v. ' or ' vs '
  useEffect(() => {
    if (title && !opposingParty) {
      const vsMatch = title.split(/\s+v\.?\s+|\s+vs\.?\s+|\s+versus\s+/i);
      if (vsMatch.length > 1) {
        const potentialOpponent = vsMatch[1].replace(/& Anor|& Others|& 2 Others/i, '').trim();
        if (potentialOpponent && potentialOpponent.length > 3) {
          setOpposingParty(potentialOpponent);
        }
      }
    }
  }, [title]);

  // Execute Bidirectional Conflict Scan (Client + Opposing Party)
  const runConflictScan = (targetOpponent?: string, targetClientName?: string) => {
    setIsScanning(true);
    const selectedClientObj = clients.find((c) => c.id === clientId);
    const clientToScan = (targetClientName !== undefined ? targetClientName : selectedClientObj?.name || '').trim();
    const opponentToScan = (targetOpponent !== undefined ? targetOpponent : opposingParty).trim();

    setTimeout(() => {
      const matches: ConflictMatch[] = [];
      let isDirectConflict = false;

      // --- 1. OPPOSING PARTY SCAN ---
      if (opponentToScan) {
        const oppLower = opponentToScan.toLowerCase();

        // Check against Active Clients (Direct representation conflict)
        const matchedActiveClient = clients.find((c) => {
          const clientLower = c.name.toLowerCase();
          return oppLower.includes(clientLower) || clientLower.includes(oppLower);
        });

        if (matchedActiveClient) {
          isDirectConflict = true;
          matches.push({
            source: 'Active Client',
            entity: matchedActiveClient.name,
            matchedField: 'Opposing Party',
            details: `Opposing Party '${opponentToScan}' is a current Active Client of the firm (${matchedActiveClient.activeMattersCount || 0} ongoing matters). Acting against an active client is a breach of advocate-client loyalty.`,
            riskLevel: 'High',
          });
        }

        // Check against Existing Matters
        matters.forEach((m) => {
          const titleLower = m.title.toLowerCase();
          const descLower = (m.description || '').toLowerCase();

          if (titleLower.includes(oppLower) || descLower.includes(oppLower)) {
            matches.push({
              source: 'Existing Matter',
              entity: m.title,
              matchedField: 'Opposing Party',
              details: `Matched matter ${m.referenceNumber} (${m.clientName}). Practice Area: ${m.practiceArea}. Lead: ${m.responsibleAdvocateName}.`,
              riskLevel: isDirectConflict ? 'High' : 'Medium',
              relatedMatterRef: m.referenceNumber,
            });
          }
        });
      }

      // --- 2. CLIENT NAME SCAN ---
      if (clientToScan) {
        const clientLower = clientToScan.toLowerCase();

        // Check if proposed Client is listed as an Opposing Party in another active matter!
        matters.forEach((m) => {
          if (m.opposingParty && m.opposingParty.toLowerCase().includes(clientLower)) {
            matches.push({
              source: 'Existing Matter',
              entity: m.title,
              matchedField: 'Client Name',
              details: `Proposed client '${clientToScan}' is currently an Adverse Opposing Party in matter ${m.referenceNumber} (${m.title}). Check if firm represents conflicting positions.`,
              riskLevel: 'High',
              relatedMatterRef: m.referenceNumber,
            });
          }
        });
      }

      setConflictMatches(matches);

      if (isWaiverRecorded) {
        setConflictStatus('Waiver Recorded');
      } else if (isDirectConflict) {
        setConflictStatus('Direct Conflict');
      } else if (matches.length > 0) {
        setConflictStatus('Potential Conflict');
      } else {
        setConflictStatus('Cleared');
      }

      setIsScanning(false);
    }, 350);
  };

  // Run auto scan whenever client or opposing party changes
  useEffect(() => {
    runConflictScan();
  }, [clientId, opposingParty]);

  // Execute Standalone Search Query across all databases
  const handlePerformConflictSearch = (customQuery?: string) => {
    const queryToUse = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!queryToUse) return;

    setIsScanning(true);
    setHasSearched(true);
    const qLower = queryToUse.toLowerCase();

    setTimeout(() => {
      const results: ConflictMatch[] = [];

      // Search Active Clients
      if (searchFilter === 'All' || searchFilter === 'Active Clients') {
        clients.forEach((c) => {
          if (c.name.toLowerCase().includes(qLower) || c.contactPerson.toLowerCase().includes(qLower) || c.industry.toLowerCase().includes(qLower)) {
            results.push({
              source: 'Active Client',
              entity: c.name,
              matchedField: 'Search Query',
              details: `Active Client (${c.type}, ${c.industry}). Contact: ${c.contactPerson}. Active Matters: ${c.activeMattersCount || 0}.`,
              riskLevel: 'High',
            });
          }
        });
      }

      // Search Existing Matters
      if (searchFilter === 'All' || searchFilter === 'Matters') {
        matters.forEach((m) => {
          const titleMatch = m.title.toLowerCase().includes(qLower);
          const clientMatch = m.clientName.toLowerCase().includes(qLower);
          const oppMatch = m.opposingParty && m.opposingParty.toLowerCase().includes(qLower);
          const descMatch = m.description && m.description.toLowerCase().includes(qLower);

          if (titleMatch || clientMatch || oppMatch || descMatch) {
            results.push({
              source: 'Existing Matter',
              entity: m.title,
              matchedField: 'Search Query',
              details: `Matter Ref: ${m.referenceNumber} | Client: ${m.clientName} | Opposing: ${m.opposingParty || 'N/A'}. Lead: ${m.responsibleAdvocateName}. Status: ${m.status}.`,
              riskLevel: oppMatch ? 'High' : 'Medium',
              relatedMatterRef: m.referenceNumber,
            });
          }
        });
      }

      setSearchResults(results);
      setIsScanning(false);
      showToast(`Conflict search returned ${results.length} database match(es).`);
    }, 300);
  };

  const handleApplyWaiver = () => {
    if (!waiverNote.trim()) return;
    setIsWaiverRecorded(true);
    setConflictStatus('Waiver Recorded');
    showToast('Managing Partner Conflict Waiver recorded.');
  };

  const handleRemoveWaiver = () => {
    setIsWaiverRecorded(false);
    runConflictScan();
  };

  const handleSelectPresetQuery = (entityName: string) => {
    setSearchQuery(entityName);
    handlePerformConflictSearch(entityName);
  };

  const handleUseSearchResultAsOpponent = (entityName: string) => {
    setOpposingParty(entityName);
    setActiveTab('form');
    showToast(`Set '${entityName}' as Opposing Party.`);
  };

  const handleUseSearchResultAsClient = (clientObjName: string) => {
    const found = clients.find((c) => c.name.toLowerCase() === clientObjName.toLowerCase());
    if (found) {
      setClientId(found.id);
    }
    setActiveTab('form');
    showToast(`Selected '${clientObjName}' as Matter Client.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (conflictStatus === 'Direct Conflict' && !isWaiverRecorded) {
      alert(
        'CANNOT REGISTER MATTER: Direct representation conflict detected. Please record an approved LSK conflict waiver or select a non-conflicting party.'
      );
      return;
    }

    const selectedClient = clients.find((c) => c.id === clientId);
    const resolvedClientName = selectedClient?.name || clientCustomName.trim() || 'Direct Client';
    const resolvedClientId = selectedClient?.id || `cli-${Date.now()}`;
    const selectedAdv = staffList.find((a) => a.id === advocateId) || staffList[0];

    // If client wasn't existing, add to client directory
    if (!selectedClient && onAddClient && resolvedClientName !== 'Direct Client') {
      onAddClient({
        id: resolvedClientId,
        name: resolvedClientName,
        type: 'Individual',
        industry: practiceArea,
        kraPin: `P05${Math.floor(10000000 + Math.random() * 90000000)}X`,
        contactPerson: resolvedClientName,
        email: `contact@${resolvedClientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.co.ke`,
        phone: '+254 700 000 000',
        city: 'Nairobi',
        activeMattersCount: 1,
        totalBilledKES: parseFloat(estimatedFeeKES) || 0,
        retainerStatus: 'Per-Matter',
      });
    }

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
    const formattedDeadlineDate = deadlineDate ? formatDisplayDate(deadlineDate) : '';
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
      title,
      clientName: resolvedClientName,
      clientId: resolvedClientId,
      opposingParty: opposingParty || 'N/A (Non-contentious)',
      conflictCheckStatus: conflictStatus,
      conflictCertificateRef: certificateRef,
      practiceArea,
      courtRegistry: courtRegistry || undefined,
      courtCaseNumber: courtCaseNumber || undefined,
      ctsFilingId: courtCaseNumber ? `CTS-2026-NBI-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      responsibleAdvocateId: selectedAdv.id,
      responsibleAdvocateName: selectedAdv.name,
      status: 'Filing Pending',
      nextCourtDate: formattedDeadlineDate || undefined,
      courtDatePurpose: deadlineDate ? (courtDatePurpose || 'Mention') : undefined,
      nextDeadlineDate: formattedDeadlineDate || 'None Scheduled',
      nextDeadlineDescription:
        deadlineDescription ||
        (deadlineDate ? `${courtDatePurpose} milestone` : 'Advisory / Non-contentious matter'),
      estimatedFeeKES: parseFloat(estimatedFeeKES) || 3500000,
      billedKES: 0,
      paidKES: 0,
      createdDate: formattedLodgedDate || defaultTodayFormatted,
      lodgedDate: formattedLodgedDate || undefined,
      description:
        description || 'New matter initialized in chambers registry with conflict clearance certificate.',
      priority,
      documentsCount: 1,
      tags: tags.length > 0 ? tags : ['General'],
    };

    onAddMatter(newMatter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      {/* Toast Notification */}
      {searchToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-lg bg-[#16181b] px-4 py-3 text-xs text-white shadow-xl border border-blue-500/30">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{searchToast}</span>
        </div>
      )}

      <div className="relative w-full max-w-4xl rounded-xl border border-[#dedbc5] bg-[#fbf9f4] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e2dfd5] bg-[#16181b] px-6 py-4 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B63E5] text-white">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-base font-bold text-stone-100">
                Register New Legal Matter
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Top Sub-Navigation Tabs */}
        <div className="flex items-center border-b border-[#dedbc5] bg-[#f4f0e6] px-6 py-2 space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'form'
                ? 'bg-white text-[#0B63E5] shadow-2xs border border-[#dedbc5]'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Matter Details & Live Scan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflictSearch')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'conflictSearch'
                ? 'bg-white text-[#0B63E5] shadow-2xs border border-[#dedbc5]'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Search className="h-4 w-4 text-amber-600" />
            <span>Conflict Search Tool</span>
            {searchResults.length > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.2 text-[10px] font-extrabold">
                {searchResults.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1 bg-[#fbf9f4]">
          {/* TAB 1: FORM & LIVE CONFLICT STATUS */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Matter Case Title */}
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Matter Case Title / Full Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Commercial Bank PLC v. National Land Commission"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>

              {/* Client & Opposing Party Selection Pair */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-800">Represented Client / Instructing Party *</label>
                    {clients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('conflictSearch')}
                        className="text-[10px] text-[#0B63E5] font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Search className="h-3 w-3" />
                        <span>Search Client DB</span>
                      </button>
                    )}
                  </div>
                  {clients.length > 0 ? (
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none font-semibold cursor-pointer"
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kenya Commercial Bank PLC or John Doe"
                      value={clientCustomName}
                      onChange={(e) => {
                        setClientCustomName(e.target.value);
                        runConflictScan(undefined, e.target.value);
                      }}
                      className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none font-semibold"
                    />
                  )}
                </div>

                {/* Opposing Party Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-800">
                      Opposing / Adverse Party
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">Non-contentious / Advisory may leave blank</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Equity Bank Kenya Ltd (leave blank if advisory/conveyance)"
                      value={opposingParty}
                      onChange={(e) => setOpposingParty(e.target.value)}
                      className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 pr-8 text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => runConflictScan()}
                      title="Re-run Conflict Check"
                      className="absolute right-2 top-2 text-stone-400 hover:text-[#0B63E5] cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin text-[#0B63E5]' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Practice Area & Court Forum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Practice Area *</label>
                  <select
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value as PracticeArea)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  >
                    <option value="Succession Law">Succession Law</option>
                    <option value="Conveyancing Law">Conveyancing Law</option>
                    <option value="Commercial Law">Commercial Law</option>
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Bank Securities">Bank Securities</option>
                    <option value="Constitutional & Tax">Constitutional & Tax</option>
                    <option value="Employment & Labour">Employment & Labour</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Court Registry / Forum
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High Court Commercial Div. (leave blank if advisory)"
                    value={courtRegistry}
                    onChange={(e) => setCourtRegistry(e.target.value)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Suit Number & Advocate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Court Suit / Petition Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suit No. E142 of 2026"
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Responsible Person *</label>
                  <select
                    value={advocateId}
                    onChange={(e) => setAdvocateId(e.target.value)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  >
                    {staffList.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Lodged & Initial Court Deadline / Mention Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-800 flex items-center space-x-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-[#0B63E5]" />
                      <span>Date Lodged *</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setLodgedDate(getTodayISO())}
                        className="text-[10px] font-bold text-[#0B63E5] hover:underline cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                        title="Set to today's date"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setLodgedDate(getYesterdayISO())}
                        className="text-[10px] font-bold text-stone-600 hover:underline cursor-pointer bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200"
                        title="Set to yesterday's date"
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={lodgedDate}
                    onChange={(e) => setLodgedDate(e.target.value)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none text-xs font-semibold cursor-pointer"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Recorded as the official filing or entry date in Chambers / Registry.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-800 flex items-center space-x-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      <span>Next Court Date</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      {deadlineDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeadlineDate('');
                            setDeadlineDescription('');
                          }}
                          className="text-[10px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200"
                          title="Clear court date"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none text-xs font-semibold cursor-pointer"
                  />
                  {deadlineDate && (
                    <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                          Purpose of Date
                        </label>
                        <select
                          value={courtDatePurpose}
                          onChange={(e) => setCourtDatePurpose(e.target.value)}
                          className="w-full rounded-md border border-[#dcd8c9] bg-white px-2 py-1 text-xs text-stone-900 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
                        >
                          <option value="Mention">Mention</option>
                          <option value="Hearing">Hearing</option>
                          <option value="Ruling">Ruling</option>
                          <option value="Judgement">Judgement</option>
                          <option value="Directions">Directions</option>
                          <option value="Compliance">Compliance</option>
                          <option value="Pre-Trial">Pre-Trial</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                          Notes / Milestones
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. For mention to confirm filing"
                          value={deadlineDescription}
                          onChange={(e) => setDeadlineDescription(e.target.value)}
                          className="w-full rounded-md border border-[#dcd8c9] bg-stone-50 px-2 py-1 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-[#0B63E5] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Leave blank if this is an advisory, transactional, or non-court matter.
                  </span>
                </div>
              </div>

              {/* Fee & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Estimated Fee Note (KES)</label>
                  <input
                    type="number"
                    value={estimatedFeeKES}
                    onChange={(e) => setEstimatedFeeKES(e.target.value)}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Registry Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                    className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
                  >
                    <option value="High">High Priority (Urgent)</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority (Routine)</option>
                  </select>
                </div>
              </div>

              {/* Matter Custom Tags */}
              <div className="rounded-xl border border-[#dedbc5] bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-stone-900 font-bold">
                    <Tag className="h-4 w-4 text-[#0B63E5]" />
                    <span>Matter Classifications & Custom Tags</span>
                  </div>
                  <span className="text-[10px] text-stone-500">Categorize for quick filtering</span>
                </div>

                {/* Preset quick-select badges */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">Quick Select Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {presetTags.map((pTag) => {
                      const isSelected = tags.includes(pTag);
                      return (
                        <button
                          key={pTag}
                          type="button"
                          onClick={() => toggleTag(pTag)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-[#0B63E5] text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          <span>{pTag}</span>
                          {isSelected && <X className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom tag input field */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. 'Pro Bono', 'Court of Appeal', 'Tax Exemption')..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    className="flex-1 rounded-md border border-[#dcd8c9] bg-stone-50 px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#0B63E5] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomTag()}
                    className="rounded-md bg-stone-900 px-3.5 py-1.5 font-bold text-white text-xs hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>

                {/* Selected Active Tags */}
                {tags.length > 0 && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 mr-1">Active Tags:</span>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-900"
                      >
                        <Tag className="h-3 w-3 text-blue-600" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-400 hover:text-blue-900 cursor-pointer"
                        >
                          <X className="h-3 w-3 text-blue-700" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Summary */}
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Case Summary & Instruction Notes</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of client instructions, key issues, relief sought..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-[#e2dfd5] pt-4 shrink-0">
                <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>LSK Ethics Compliance Verified</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-[#dcd8c9] bg-white px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={conflictStatus === 'Direct Conflict' && !isWaiverRecorded}
                    className={`rounded-md px-5 py-2 font-semibold text-white shadow-md transition-all cursor-pointer ${
                      conflictStatus === 'Direct Conflict' && !isWaiverRecorded
                        ? 'bg-stone-400 cursor-not-allowed opacity-60'
                        : 'bg-[#0B63E5] hover:bg-[#0256D0]'
                    }`}
                  >
                    {conflictStatus === 'Direct Conflict' && !isWaiverRecorded
                      ? 'Blocked: Direct Conflict'
                      : 'Register Matter & Save Clearance'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: STANDALONE INTERACTIVE CONFLICT SEARCH TOOL */}
          {activeTab === 'conflictSearch' && (
            <div className="space-y-5">
              {/* Tool Header & Description */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B63E5] text-white shrink-0 mt-0.5">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-title font-bold text-sm text-stone-900">
                      Chambers Conflict Search Tool
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Cross-reference client candidates, corporate entities, or counterparties against firm retainers, historic litigation files, and LSK conflict records.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('form')}
                  className="flex items-center space-x-1 text-xs font-bold text-[#0B63E5] hover:underline cursor-pointer shrink-0"
                >
                  <span>Return to Registration</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search Bar Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type client name, director, company, or adverse party (e.g. Safaricom, Equity, Competition Authority, KCB, CAK...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePerformConflictSearch())}
                      className="w-full rounded-lg border border-[#dcd8c9] bg-white pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none shadow-2xs font-medium"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePerformConflictSearch()}
                    disabled={!searchQuery.trim()}
                    className="flex items-center space-x-2 rounded-lg bg-[#0B63E5] px-5 py-2.5 font-bold text-white shadow-md hover:bg-[#0256D0] transition-colors disabled:opacity-40 cursor-pointer text-xs"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search Database</span>
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-stone-600">
                    <Filter className="h-3.5 w-3.5 text-stone-500" />
                    <span>Database Filter:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['All', 'Active Clients', 'Matters', 'Conflict Database'] as const).map((filterName) => (
                      <button
                        key={filterName}
                        type="button"
                        onClick={() => setSearchFilter(filterName)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          searchFilter === filterName
                            ? 'bg-stone-900 text-white'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {filterName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Search Preset Tags */}
              <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
                <span className="text-[10px] font-bold text-stone-500 tracking-wider block">
                  Quick Conflict Search Scenarios (Click to test):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetQuery('Safaricom PLC')}
                    className="rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                  >
                    🔍 Safaricom PLC (Active Client)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetQuery('Competition Authority of Kenya')}
                    className="rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                  >
                    🔍 Competition Authority of Kenya (Adverse Opponent)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetQuery('KCB Bank Kenya Ltd')}
                    className="rounded bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                  >
                    🔍 KCB Bank (Waiver On File)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetQuery('Equity Bank Kenya Ltd')}
                    className="rounded bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                  >
                    🔍 Equity Bank (Active Client)
                  </button>
                </div>
              </div>

              {/* Search Results Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-bold text-stone-900 text-xs">
                    Conflict Search Results {hasSearched && `(${searchResults.length})`}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Database records matched in Chambers Registry
                  </span>
                </div>

                {!hasSearched ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-stone-200 p-6 text-stone-500 space-y-2">
                    <Search className="h-8 w-8 text-stone-300 mx-auto" />
                    <p className="font-semibold text-stone-700">Enter an entity name above to start conflict search</p>
                    <p className="text-xs text-stone-400">
                      You can test corporate names, directors, or opposing counsel to prevent ethical representation conflicts.
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-900 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-xs">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>Clean Clearance: No Adverse Hits Found</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Entity <span className="font-bold">"{searchQuery}"</span> has zero active adverse matches in firm retainers or ethics records.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleUseSearchResultAsOpponent(searchQuery)}
                        className="rounded bg-emerald-700 px-3 py-1.5 font-bold text-white text-xs hover:bg-emerald-800 cursor-pointer"
                      >
                        Set as Opposing Party in Form
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-4 bg-white shadow-2xs space-y-2 ${
                          res.riskLevel === 'High'
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-amber-200 bg-amber-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                res.riskLevel === 'High' ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
                              }`}
                            />
                            <span className="font-bold text-stone-900 text-xs">{res.entity}</span>
                            <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                              {res.source}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleUseSearchResultAsClient(res.entity)}
                              className="rounded border border-blue-300 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#0B63E5] hover:bg-blue-100 cursor-pointer"
                            >
                              Use as Matter Client
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUseSearchResultAsOpponent(res.entity)}
                              className="rounded border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                            >
                              Use as Opposing Party
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-stone-700 leading-relaxed font-sans">{res.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
