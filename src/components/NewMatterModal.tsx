import React, { useState, useEffect } from 'react';
import {
  X,
  Gavel,
  Users,
  Building2,
  Calendar,
  Receipt,
  Tag,
  Plus,
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

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  onAddMatter,
  clients = [],
  advocates = [],
  onAddClient,
}) => {
  const staffList = (advocates.length > 0 ? advocates : loadVisibleStaffRoster()).filter(
    (a) => !isSysAdminUser(a)
  );

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
  const [clientInput, setClientInput] = useState(clients[0]?.name || '');
  const [opposingParty, setOpposingParty] = useState('');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('Civil Litigation');
  const [courtRegistry, setCourtRegistry] = useState('');
  const [courtCaseNumber, setCourtCaseNumber] = useState('');
  const [advocateId, setAdvocateId] = useState(staffList[0]?.id || 'staff-ma-1');
  const [lodgedDate, setLodgedDate] = useState<string>(getTodayISO());
  const [activeDateBtn, setActiveDateBtn] = useState<'today' | 'yesterday' | 'custom'>('today');

  const [nextCourtDate, setNextCourtDate] = useState('');

  // Fee State: User enters amount or ticks "To be discussed later"
  const [estimatedFeeKES, setEstimatedFeeKES] = useState('');
  const [feeToBeDiscussedLater, setFeeToBeDiscussedLater] = useState(false);

  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [description, setDescription] = useState('');

  const presetTags = [
    'Urgent',
    'Pro bono',
    'Court of appeal',
    'Supreme court',
    'High value',
    'Public interest',
  ];

  // Sync client input if empty and clients available
  useEffect(() => {
    if (!clientInput && clients.length > 0) {
      setClientInput(clients[0].name);
    }
  }, [clients]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === clientInput.trim().toLowerCase()
    );
    const resolvedClientName = clientInput.trim() || matchedClient?.name || 'Instructing Client';
    const resolvedClientId = matchedClient?.id || `cli-${Date.now()}`;
    const selectedAdv = staffList.find((a) => a.id === advocateId) || staffList[0];

    const cleanFee = estimatedFeeKES.replace(/,/g, '').trim();
    const parsedFee = (!feeToBeDiscussedLater && cleanFee) ? parseFloat(cleanFee) || 0 : 0;
    const isFeeTBD = feeToBeDiscussedLater || !cleanFee || parsedFee === 0;

    // If client wasn't existing, add to client directory
    if (!matchedClient && onAddClient && resolvedClientName !== 'Instructing Client') {
      onAddClient({
        id: resolvedClientId,
        name: resolvedClientName,
        type: 'Corporate',
        industry: practiceArea,
        kraPin: `P05${Math.floor(10000000 + Math.random() * 90000000)}X`,
        contactPerson: resolvedClientName,
        email: `contact@${resolvedClientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.co.ke`,
        phone: '+254 700 000 000',
        city: 'Nairobi',
        activeMattersCount: 1,
        totalBilledKES: 0,
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
      tags: tags.length > 0 ? tags : ['General'],
    };

    onAddMatter(newMatter);
    onClose();
  };

  return (
    <div
      id="new-matter-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/55 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="register-new-legal-matter-modal"
        className="w-full max-w-[620px] bg-white rounded-[14px] border border-[#E1DFD6] overflow-hidden shadow-2xl my-auto text-[#1E1D1A]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-[#E1DFD6] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-[#E6F1FB] flex items-center justify-center text-[#0C447C] shrink-0">
              <Gavel className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1E1D1A] leading-tight">
                Register new legal matter
              </p>
              <p className="text-[12.5px] text-[#9A9890] mt-[2px] leading-tight">
                Create new case file in firm workspace registry
              </p>
            </div>
          </div>
          <button
            type="button"
            id="new-matter-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-[#9A9890] hover:text-[#1E1D1A] hover:bg-[#F6F5F0] rounded-[6px] transition-colors cursor-pointer"
          >
            <X className="h-[19px] w-[19px]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[64vh] overflow-y-auto px-6 pt-6 pb-2 space-y-[22px]">
            {/* Matter title and full description */}
            <div>
              <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                Matter title and full description *
              </label>
              <input
                id="new-matter-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kenya Commercial Bank PLC v. National Land Commission"
                className="w-full h-[46px] px-3 text-[15px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB] font-medium"
              />
            </div>

            {/* Section Divider: Parties */}
            <div>
              <div className="flex items-center gap-2 mb-[14px]">
                <Users className="h-[15px] w-[15px] text-[#9A9890]" />
                <span className="text-[12.5px] text-[#63615A] font-medium whitespace-nowrap">
                  Parties
                </span>
                <div className="flex-1 h-px bg-[#E1DFD6]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Represented client / instructing party *
                  </label>
                  <input
                    id="new-matter-client-input"
                    type="text"
                    required
                    list="registered-clients-list"
                    value={clientInput}
                    onChange={(e) => setClientInput(e.target.value)}
                    placeholder="Kenya Commercial Bank PLC"
                    className="w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB]"
                  />
                  <datalist id="registered-clients-list">
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Opposing / adverse party
                  </label>
                  <input
                    id="new-matter-opposing-input"
                    type="text"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    placeholder="Leave blank if non-contentious"
                    className="w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB]"
                  />
                </div>
              </div>
            </div>

            {/* Section Divider: Court and registry */}
            <div>
              <div className="flex items-center gap-2 mb-[14px]">
                <Building2 className="h-[15px] w-[15px] text-[#9A9890]" />
                <span className="text-[12.5px] text-[#63615A] font-medium whitespace-nowrap">
                  Court and registry
                </span>
                <div className="flex-1 h-px bg-[#E1DFD6]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[14px]">
                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Practice area
                  </label>
                  <select
                    id="new-matter-practice-area-select"
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value as PracticeArea)}
                    className="w-full h-[40px] px-3 pr-8 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB] cursor-pointer"
                  >
                    <option value="Civil Litigation">Civil litigation</option>
                    <option value="Commercial Law">Commercial and tax</option>
                    <option value="Conveyancing Law">Conveyancing</option>
                    <option value="Family Law">Family law</option>
                    <option value="Succession Law">Succession law</option>
                    <option value="Bank Securities">Bank securities</option>
                    <option value="Constitutional & Tax">Constitutional & judicial review</option>
                    <option value="Employment & Labour">Employment and labour</option>
                    <option value="Intellectual Property">Intellectual property</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Court registry / forum
                  </label>
                  <input
                    id="new-matter-court-registry-input"
                    type="text"
                    value={courtRegistry}
                    onChange={(e) => setCourtRegistry(e.target.value)}
                    placeholder="High Court Commercial Division, Milimani"
                    className="w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Court suit / petition number
                  </label>
                  <input
                    id="new-matter-suit-no-input"
                    type="text"
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    placeholder="Suit No. E142 of 2026"
                    className="w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Responsible advocate
                  </label>
                  <select
                    id="new-matter-advocate-select"
                    value={advocateId}
                    onChange={(e) => setAdvocateId(e.target.value)}
                    className="w-full h-[40px] px-3 pr-8 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB] cursor-pointer"
                  >
                    {staffList.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section Divider: Key dates */}
            <div>
              <div className="flex items-center gap-2 mb-[14px]">
                <Calendar className="h-[15px] w-[15px] text-[#9A9890]" />
                <span className="text-[12.5px] text-[#63615A] font-medium whitespace-nowrap">
                  Key dates
                </span>
                <div className="flex-1 h-px bg-[#E1DFD6]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Date lodged
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
                    className="w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB]"
                  />
                  <div className="flex gap-[6px] mt-2">
                    <button
                      type="button"
                      id="btn-today"
                      onClick={handleSelectToday}
                      className={`flex-1 h-[27px] text-[11px] rounded-[6px] border transition-all cursor-pointer font-medium ${
                        activeDateBtn === 'today'
                          ? 'bg-[#E6F1FB] text-[#0C447C] border-transparent font-semibold'
                          : 'bg-transparent text-[#1E1D1A] border-[#C9C7BC] hover:bg-[#F6F5F0]'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      id="btn-yesterday"
                      onClick={handleSelectYesterday}
                      className={`flex-1 h-[27px] text-[11px] rounded-[6px] border transition-all cursor-pointer font-medium ${
                        activeDateBtn === 'yesterday'
                          ? 'bg-[#E6F1FB] text-[#0C447C] border-transparent font-semibold'
                          : 'bg-transparent text-[#1E1D1A] border-[#C9C7BC] hover:bg-[#F6F5F0]'
                      }`}
                    >
                      Yesterday
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Next court date
                  </label>
                  <input
                    type="date"
                    value={nextCourtDate}
                    onChange={(e) => setNextCourtDate(e.target.value)}
                    className="w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB]"
                  />
                  <p className="text-[11.5px] text-[#9A9890] mt-[6px]">
                    Leave blank for advisory or non-court work.
                  </p>
                </div>
              </div>
            </div>

            {/* Section Divider: Fee and priority */}
            <div>
              <div className="flex items-center gap-2 mb-[14px]">
                <Receipt className="h-[15px] w-[15px] text-[#9A9890]" />
                <span className="text-[12.5px] text-[#63615A] font-medium whitespace-nowrap">
                  Fee and priority
                </span>
                <div className="flex-1 h-px bg-[#E1DFD6]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Agreed or estimated fee, KES
                  </label>
                  <input
                    type="text"
                    id="fee-input"
                    disabled={feeToBeDiscussedLater}
                    value={feeToBeDiscussedLater ? '' : estimatedFeeKES}
                    onChange={(e) => setEstimatedFeeKES(e.target.value)}
                    placeholder="150,000"
                    className={`w-full h-[40px] px-3 text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB] ${
                      feeToBeDiscussedLater ? 'opacity-50 cursor-not-allowed bg-stone-50' : ''
                    }`}
                  />
                  <label className="flex items-center gap-[7px] mt-[9px] text-[12.5px] text-[#63615A] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="fee-later"
                      checked={feeToBeDiscussedLater}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFeeToBeDiscussedLater(checked);
                        if (checked) setEstimatedFeeKES('');
                      }}
                      className="w-[14px] h-[14px] accent-[#185FA5] cursor-pointer"
                    />
                    <span>To be discussed later</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                    Registry priority
                  </label>
                  <div className="flex border border-[#C9C7BC] rounded-[8px] overflow-hidden h-[40px]">
                    <button
                      type="button"
                      onClick={() => setPriority('Low')}
                      className={`flex-1 border-r border-[#C9C7BC] bg-transparent text-[12.5px] cursor-pointer transition-colors ${
                        priority === 'Low'
                          ? 'bg-[#EAF3DE] text-[#27500A] font-semibold'
                          : 'text-[#1E1D1A] hover:bg-[#F6F5F0]'
                      }`}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('Medium')}
                      className={`flex-1 border-r border-[#C9C7BC] bg-transparent text-[12.5px] cursor-pointer transition-colors ${
                        priority === 'Medium'
                          ? 'bg-[#FAEEDA] text-[#633806] font-semibold'
                          : 'text-[#1E1D1A] hover:bg-[#F6F5F0]'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('High')}
                      className={`flex-1 bg-transparent text-[12.5px] cursor-pointer transition-colors ${
                        priority === 'High'
                          ? 'bg-[#FCEBEB] text-[#791F1F] font-semibold'
                          : 'text-[#1E1D1A] hover:bg-[#F6F5F0]'
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Divider: Classification and tags */}
            <div>
              <div className="flex items-center gap-2 mb-[14px]">
                <Tag className="h-[15px] w-[15px] text-[#9A9890]" />
                <span className="text-[12.5px] text-[#63615A] font-medium whitespace-nowrap">
                  Classification and tags
                </span>
                <div className="flex-1 h-px bg-[#E1DFD6]" />
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {presetTags.map((pTag) => {
                  const isSelected = tags.includes(pTag);
                  return (
                    <button
                      key={pTag}
                      type="button"
                      onClick={() => toggleTag(pTag)}
                      className={`h-[29px] px-[13px] text-[12px] rounded-full border transition-all cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-[#E6F1FB] text-[#0C447C] border-transparent font-semibold shadow-2xs'
                          : 'bg-transparent text-[#63615A] border-[#C9C7BC] hover:border-[#185FA5]'
                      }`}
                    >
                      {pTag}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Add a custom tag, e.g. tax exemption"
                  className="flex-1 h-[34px] px-3 text-[12.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-2 focus:ring-[#E6F1FB]"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomTag()}
                  className="h-[34px] px-[15px] text-[12.5px] rounded-[8px] border border-dashed border-[#C9C7BC] bg-transparent text-[#63615A] hover:border-[#185FA5] hover:text-[#0C447C] cursor-pointer flex items-center gap-1 font-medium transition-colors"
                >
                  <Plus className="h-[13px] w-[13px]" />
                  <span>Add tag</span>
                </button>
              </div>

              {/* Custom tags rendered if any outside presets */}
              {tags.filter((t) => !presetTags.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags
                    .filter((t) => !presetTags.includes(t))
                    .map((ct) => (
                      <span
                        key={ct}
                        className="inline-flex items-center gap-1 h-[26px] px-2.5 rounded-full bg-[#E6F1FB] text-[#0C447C] text-[11.5px] font-medium"
                      >
                        <span>{ct}</span>
                        <button
                          type="button"
                          onClick={() => toggleTag(ct)}
                          className="hover:text-red-600 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Case summary and instruction notes */}
            <div>
              <label className="block text-[12.5px] text-[#63615A] mb-[7px] font-medium">
                Case summary and instruction notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of client instructions, key issues, relief sought"
                className="w-full min-h-[76px] p-[10px_12px] text-[13.5px] text-[#1E1D1A] bg-white border border-[#C9C7BC] rounded-[8px] outline-none transition-all placeholder:text-[#9A9890] focus:border-[#185FA5] focus:ring-3 focus:ring-[#E6F1FB] resize-y"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E1DFD6] bg-[#F6F5F0]">
            <span className="text-[11px] text-[#9A9890] font-medium">
              LSK firm workspace registration
            </span>
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                id="new-matter-cancel-btn"
                onClick={onClose}
                className="h-[38px] px-[18px] text-[13px] rounded-[8px] border border-[#C9C7BC] text-[#1E1D1A] bg-transparent hover:bg-white font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="new-matter-submit-btn"
                className="h-[38px] px-[18px] text-[13px] rounded-[8px] bg-[#1E1D1A] text-white font-medium hover:opacity-90 cursor-pointer transition-opacity"
              >
                Save legal matter
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
