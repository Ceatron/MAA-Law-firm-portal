import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Briefcase,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { ClientInteraction, Client, LegalMatter, Advocate } from '../../types';
import { convertProspectiveClientToClient } from '../../utils/clientServicesStorage';

interface ConvertClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: ClientInteraction | null;
  advocates: Advocate[];
  onConfirm: (newClient: Client, newMatter?: LegalMatter) => void;
}

export const ConvertClientModal: React.FC<ConvertClientModalProps> = ({
  isOpen,
  onClose,
  interaction,
  advocates,
  onConfirm,
}) => {
  if (!isOpen || !interaction) return null;

  // Form states
  const [clientType, setClientType] = useState<'Corporate' | 'Individual' | 'State Entity'>(
    interaction.companyName || interaction.clientName.toLowerCase().includes('ltd')
      ? 'Corporate'
      : 'Individual'
  );
  const [clientName, setClientName] = useState(interaction.companyName || interaction.clientName);
  const [contactPerson, setContactPerson] = useState(interaction.contactPerson || interaction.clientName);
  const [phone, setPhone] = useState(interaction.phoneNumber || '');
  const [email, setEmail] = useState(interaction.email || '');
  const [kraPin, setKraPin] = useState(
    interaction.kraPin || `P05${Math.floor(10000000 + Math.random() * 90000000)}X`
  );
  const [industry, setIndustry] = useState('Commercial / Corporate');
  const [city, setCity] = useState('Nairobi (Upper Hill / Central)');
  const [retainerStatus, setRetainerStatus] = useState<'Active Retainer' | 'Per-Matter' | 'Pending Deposit'>(
    'Pending Deposit'
  );

  // Matter Creation Toggle
  const [createInitialMatter, setCreateInitialMatter] = useState(true);
  const [matterTitle, setMatterTitle] = useState(
    interaction.subject.replace(/^(enquiry|inquiry|consultation|urgent)\s*[:-]\s*/i, '') ||
      `${clientName} Legal Representation & Advisory`
  );
  const [practiceArea, setPracticeArea] = useState('Commercial Law');
  const [responsibleAdvocateId, setResponsibleAdvocateId] = useState(
    interaction.assignedStaffId || advocates[0]?.id || 'adv-1'
  );
  const [estimatedFeeKES, setEstimatedFeeKES] = useState<string>('');
  const [feeToBeDiscussedLater, setFeeToBeDiscussedLater] = useState<boolean>(true);

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();

    const createdClient: Client = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      name: clientName.trim(),
      type: clientType,
      industry: industry.trim(),
      kraPin: kraPin.trim().toUpperCase(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      activeMattersCount: createInitialMatter ? 1 : 0,
      totalBilledKES: 0,
      retainerStatus,
    };

    let createdMatter: LegalMatter | undefined;
    if (createInitialMatter) {
      const adv = advocates.find((a) => a.id === responsibleAdvocateId) || advocates[0];
      const year = new Date().getFullYear();
      const code = practiceArea.slice(0, 3).toUpperCase();
      const refNum = `MAA/${code}/${year}/${Math.floor(100 + Math.random() * 900)}`;

      createdMatter = {
        id: `mat-${Date.now().toString().slice(-4)}`,
        referenceNumber: refNum,
        title: matterTitle.trim(),
        clientName: createdClient.name,
        clientId: createdClient.id,
        practiceArea,
        courtRegistry: 'High Court Commercial & Tax Div. - Milimani',
        courtCaseNumber: `Suit No. E${Math.floor(100 + Math.random() * 900)} of ${year}`,
        responsibleAdvocateId: adv.id,
        responsibleAdvocateName: adv.name,
        status: 'Filing Pending',
        nextDeadlineDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        nextDeadlineDescription: 'Initial Client Brief & Retainer Execution',
        estimatedFeeKES: (!feeToBeDiscussedLater && estimatedFeeKES.trim()) ? parseFloat(estimatedFeeKES) || 0 : 0,
        feeToBeDiscussedLater: feeToBeDiscussedLater || !estimatedFeeKES.trim() || parseFloat(estimatedFeeKES) === 0,
        billedKES: 0,
        paidKES: 0,
        createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        description: `Originating from Client Services Enquiry (${interaction.id}): ${interaction.description}`,
        priority: 'High',
        documentsCount: 0,
        opposingParty: 'To be determined upon formal instruction',
        conflictCheckStatus: 'Cleared',
        conflictCertificateRef: `LSK-CONF-${year}-${Math.floor(100 + Math.random() * 900)}`,
        tags: ['New Client Onboarding', practiceArea],
      };
    }

    onConfirm(createdClient, createdMatter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-gradient-to-r from-[#132c3f] to-[#1c4766] text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-title">Convert Prospective Client to Official Client</h2>
              <p className="text-xs text-blue-200">
                Onboard into Chambers Client Registry and optionally open an initial matter
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

        <form onSubmit={handleConvert} className="p-6 space-y-5 text-xs text-stone-800 max-h-[80vh] overflow-y-auto">
          {/* Client Details */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider text-stone-600 border-b border-stone-200 pb-1.5">
              Client Onboarding Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">
                  Client / Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Entity Type</label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value as any)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="Corporate">Corporate</option>
                  <option value="Individual">Individual</option>
                  <option value="State Entity">State Entity</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">KRA PIN</label>
                <input
                  type="text"
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Industry / Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Retainer Status</label>
                <select
                  value={retainerStatus}
                  onChange={(e) => setRetainerStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="Active Retainer">Active Retainer</option>
                  <option value="Per-Matter">Per-Matter</option>
                  <option value="Pending Deposit">Pending Deposit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Initial Matter Creation Section */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <label className="flex items-center space-x-2 text-xs font-bold text-[#132c3f] cursor-pointer">
                <input
                  type="checkbox"
                  checked={createInitialMatter}
                  onChange={(e) => setCreateInitialMatter(e.target.checked)}
                  className="rounded border-blue-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                />
                <span>Simultaneously Open Initial Legal Matter / Case File</span>
              </label>
              <Briefcase className="h-4 w-4 text-[#0B63E5]" />
            </div>

            {createInitialMatter && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Matter Title</label>
                  <input
                    type="text"
                    value={matterTitle}
                    onChange={(e) => setMatterTitle(e.target.value)}
                    required={createInitialMatter}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Practice Area</label>
                  <select
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="Commercial Law">Commercial Law</option>
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Conveyancing Law">Conveyancing Law</option>
                    <option value="Constitutional & Tax">Constitutional & Tax</option>
                    <option value="Succession Law">Succession Law</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Responsible Person</label>
                  <select
                    value={responsibleAdvocateId}
                    onChange={(e) => setResponsibleAdvocateId(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    {advocates.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-stone-700">Estimated Legal Fee (KES)</label>
                    {feeToBeDiscussedLater && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Fee TBD
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    disabled={feeToBeDiscussedLater}
                    placeholder={feeToBeDiscussedLater ? 'Fee to be discussed later' : 'e.g. 150000'}
                    value={feeToBeDiscussedLater ? '' : estimatedFeeKES}
                    onChange={(e) => setEstimatedFeeKES(e.target.value)}
                    className={`w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono ${
                      feeToBeDiscussedLater ? 'bg-stone-100 text-stone-400 cursor-not-allowed italic' : 'bg-white'
                    }`}
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={feeToBeDiscussedLater}
                      onChange={(e) => {
                        setFeeToBeDiscussedLater(e.target.checked);
                        if (e.target.checked) setEstimatedFeeKES('');
                      }}
                      className="h-3.5 w-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <span className="text-[11px] text-stone-600 font-medium">Fee to be discussed later</span>
                  </label>
                </div>

                <div className="flex items-center pt-5 text-[11px] text-stone-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 mr-1.5 shrink-0" />
                  <span>Conflict check certificate auto-generated</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-lg bg-[#0B63E5] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0256D0] cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Onboard Client</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
