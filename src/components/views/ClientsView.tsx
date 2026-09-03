import React, { useState } from 'react';
import {
  Building2,
  User,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  FileText,
  X,
  CheckCircle2,
  UserCheck,
  Building,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';
import { Client, LegalMatter } from '../../types';

interface ClientsViewProps {
  clients?: Client[];
  onUpdateClients?: (clients: Client[]) => void;
  matters?: LegalMatter[];
  onOpenNewMatter?: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients: propClients,
  onUpdateClients,
  matters = [],
  onOpenNewMatter,
}) => {
  const [internalClients, setInternalClients] = useState<Client[]>([]);
  const staffList = loadVisibleStaffRoster();
  const clients = propClients !== undefined ? propClients : internalClients;

  const updateClientsList = (newClients: Client[]) => {
    if (onUpdateClients) {
      onUpdateClients(newClients);
    } else {
      setInternalClients(newClients);
    }
  };

  const [search, setSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'All' | 'Individual' | 'Corporate'>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Client Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<'Individual' | 'Corporate'>('Individual');

  // Form State - Individual
  const [indName, setIndName] = useState('');
  const [indIdNumber, setIndIdNumber] = useState('');
  const [indKraPin, setIndKraPin] = useState('');
  const [indOccupation, setIndOccupation] = useState('');
  const [indEmail, setIndEmail] = useState('');
  const [indPhone, setIndPhone] = useState('');
  const [indCity, setIndCity] = useState('Nairobi (Kilimani)');
  const [indEmergencyContact, setIndEmergencyContact] = useState('');
  const [indRetainer, setIndRetainer] = useState<'Active Retainer' | 'Per-Matter' | 'Pending Deposit'>('Per-Matter');
  const [indAdvocate, setIndAdvocate] = useState('Adv. Costa Kimathi');

  // Form State - Corporate
  const [corpName, setCorpName] = useState('');
  const [corpRegNo, setCorpRegNo] = useState('');
  const [corpKraPin, setCorpKraPin] = useState('');
  const [corpIndustry, setCorpIndustry] = useState('Financial Services & Banking');
  const [corpContactPerson, setCorpContactPerson] = useState('');
  const [corpEmail, setCorpEmail] = useState('');
  const [corpPhone, setCorpPhone] = useState('');
  const [corpCity, setCorpCity] = useState('Nairobi (Upper Hill)');
  const [corpRetainer, setCorpRetainer] = useState<'Active Retainer' | 'Per-Matter' | 'Pending Deposit'>('Active Retainer');
  const [corpLeadPartner, setCorpLeadPartner] = useState('Adv. Paul Ahago');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenModal = (type: 'Individual' | 'Corporate') => {
    setFormType(type);
    setIsModalOpen(true);
  };

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!indName || !indKraPin) return;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: indName,
      type: 'Individual',
      industry: indOccupation || 'Private Individual',
      kraPin: indKraPin.toUpperCase(),
      contactPerson: indEmergencyContact ? `Next of Kin: ${indEmergencyContact}` : indName,
      email: indEmail || 'client@muthoniahago.co.ke',
      phone: indPhone || '+254 700 000 000',
      city: indCity,
      activeMattersCount: 1,
      totalBilledKES: 1500000,
      retainerStatus: indRetainer,
    };

    updateClientsList([newClient, ...clients]);
    setIsModalOpen(false);
    showToast(`Individual Client '${indName}' created successfully.`);
    // Reset individual fields
    setIndName('');
    setIndIdNumber('');
    setIndKraPin('');
    setIndOccupation('');
    setIndEmail('');
    setIndPhone('');
    setIndEmergencyContact('');
  };

  const handleCorporateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corpName || !corpKraPin) return;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: corpName,
      type: 'Corporate',
      industry: corpIndustry,
      kraPin: corpKraPin.toUpperCase(),
      contactPerson: corpContactPerson || 'Legal Director',
      email: corpEmail || 'legal@corporate.co.ke',
      phone: corpPhone || '+254 20 000 0000',
      city: corpCity,
      activeMattersCount: 1,
      totalBilledKES: 5000000,
      retainerStatus: corpRetainer,
    };

    updateClientsList([newClient, ...clients]);
    setIsModalOpen(false);
    showToast(`Corporate Client '${corpName}' registered successfully.`);
    // Reset corporate fields
    setCorpName('');
    setCorpRegNo('');
    setCorpKraPin('');
    setCorpContactPerson('');
    setCorpEmail('');
    setCorpPhone('');
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.kraPin.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      clientTypeFilter === 'All' ||
      (clientTypeFilter === 'Individual' && c.type === 'Individual') ||
      (clientTypeFilter === 'Corporate' && c.type === 'Corporate');

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Title Header with Separate Creation Forms Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2dfd5] pb-5">
        <div>
          <h2 className="font-serif-title text-2xl font-bold text-[#1a1d20]">
            Clients
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            Client records, individual KYC forms, and corporate retainers
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Create Individual Client Form Button */}
          <button
            onClick={() => handleOpenModal('Individual')}
            className="flex items-center space-x-1.5 rounded-md bg-stone-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <User className="h-4 w-4 text-[#f3ad82]" />
            <span>+ Individual Client Form</span>
          </button>

          {/* Create Corporate Client Form Button */}
          <button
            onClick={() => handleOpenModal('Corporate')}
            className="flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer"
          >
            <Building2 className="h-4 w-4" />
            <span>+ Corporate Client Form</span>
          </button>
        </div>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by client name, KRA PIN, industry, HQ location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[#dcd8c9] bg-white pl-9 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none"
          />
        </div>

        {/* Client Category Filter Tabs */}
        <div className="flex items-center space-x-1 bg-stone-200/60 p-1 rounded-lg text-xs font-bold">
          {(['All', 'Individual', 'Corporate'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setClientTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                clientTypeFilter === tab
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'All' ? 'All Clients' : tab === 'Individual' ? 'Individual Clients' : 'Corporate Entities'}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ebf5fc] text-[#0070ba] mb-3">
            <UserCheck className="h-7 w-7 text-[#0070ba]" />
          </div>
          <h3 className="text-base font-bold text-stone-900 font-serif">
            {clients.length === 0 ? 'No Clients in Portal' : 'No Matching Clients Found'}
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto">
            {clients.length === 0
              ? 'Onboard new private individuals or corporate entities'
              : 'No clients match your selected category or search filters. Try adjusting your search query.'}
          </p>
          {clients.length === 0 ? (
            <div className="mt-5 flex items-center justify-center space-x-3">
              <button
                onClick={() => handleOpenModal('Individual')}
                className="flex items-center space-x-2 rounded-md bg-stone-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 text-[#f3ad82]" />
                <span>Onboard Individual Client</span>
              </button>
              <button
                onClick={() => handleOpenModal('Corporate')}
                className="flex items-center space-x-2 rounded-md bg-[#0070ba] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005ea6] transition-colors cursor-pointer"
              >
                <Building2 className="h-4 w-4" />
                <span>Onboard Corporate Entity</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setClientTypeFilter('All');
              }}
              className="mt-4 text-xs font-semibold text-[#0070ba] hover:underline cursor-pointer"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const isIndividual = client.type === 'Individual';

            return (
              <div
                key={client.id}
                className={`rounded-xl border bg-white p-5 shadow-2xs transition-all hover:shadow-md flex flex-col justify-between ${
                  isIndividual ? 'border-amber-200/80 hover:border-amber-400' : 'border-[#e2dfd5] hover:border-[#0B63E5]/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm border ${
                          isIndividual
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-[#EFF6FF] text-[#0B63E5] border-[#0B63E5]/20'
                        }`}
                      >
                        {isIndividual ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-serif-title font-bold text-stone-900 text-sm">
                            {client.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-mono text-stone-500 font-semibold">
                            KRA PIN: {client.kraPin}
                          </span>
                          <span className={`text-[9px] font-extrabold  px-1.5 py-0.2 rounded border ${
                            isIndividual ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {client.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      {client.retainerStatus}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate font-semibold text-stone-800">{client.industry}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{client.city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate font-mono">{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-stone-100 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-semibold">Active Matters</span>
                    <p className="font-bold text-stone-900">{client.activeMattersCount} cases</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 font-semibold">Total Fee Billed</span>
                    <p className="font-bold text-[#0B63E5] font-mono">
                      KES {(client.totalBilledKES / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLIENT CREATION MODAL WITH SEPARATE INDIVIDUAL & CORPORATE FORMS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-stone-300 overflow-hidden text-stone-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white">
              <div className="flex items-center space-x-3">
                {formType === 'Individual' ? (
                  <User className="h-6 w-6 text-[#f3ad82]" />
                ) : (
                  <Building2 className="h-6 w-6 text-[#0B63E5]" />
                )}
                <div>
                  <h3 className="font-serif font-bold text-base">
                    {formType === 'Individual' ? 'Individual Client Registration Form' : 'Corporate Entity Registration Form'}
                  </h3>
                  <p className="text-[11px] text-stone-300">
                    {formType === 'Individual'
                      ? 'Private client onboarding & personal KYC registration'
                      : 'Corporate entity, company registration & retainer setup'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Selection Sub-Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-3">
              <button
                type="button"
                onClick={() => setFormType('Individual')}
                className={`flex items-center space-x-2 border-b-2 px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  formType === 'Individual'
                    ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <User className="h-4 w-4 text-amber-600" />
                <span>Individual Client Form</span>
              </button>

              <button
                type="button"
                onClick={() => setFormType('Corporate')}
                className={`flex items-center space-x-2 border-b-2 px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  formType === 'Corporate'
                    ? 'border-[#0B63E5] text-[#0B63E5] bg-white rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Building2 className="h-4 w-4 text-[#0B63E5]" />
                <span>Corporate Client Form</span>
              </button>
            </div>

            {/* FORM BODY: INDIVIDUAL CLIENT */}
            {formType === 'Individual' && (
              <form onSubmit={handleIndividualSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Full Name of Individual *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. James Mwangi or Hon. Beatrice Kilonzo"
                      value={indName}
                      onChange={(e) => setIndName(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      National ID / Passport Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ID No. 28910425"
                      value={indIdNumber}
                      onChange={(e) => setIndIdNumber(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Individual KRA PIN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A002891042Z"
                      value={indKraPin}
                      onChange={(e) => setIndKraPin(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Occupation / Profession / Business
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Medical Consultant, Land Developer, Trustee"
                      value={indOccupation}
                      onChange={(e) => setIndOccupation(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Personal Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client.private@gmail.com"
                      value={indEmail}
                      onChange={(e) => setIndEmail(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +254 722 890 112"
                      value={indPhone}
                      onChange={(e) => setIndPhone(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Residential Area / City Location
                    </label>
                    <input
                      type="text"
                      value={indCity}
                      onChange={(e) => setIndCity(e.target.value)}
                      placeholder="e.g. Nairobi (Karen Estates) or Nyali Mombasa"
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Next of Kin / Emergency Contact
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mary Mwangi (+254 711 223 344)"
                      value={indEmergencyContact}
                      onChange={(e) => setIndEmergencyContact(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Retainer Status
                    </label>
                    <select
                      value={indRetainer}
                      onChange={(e) => setIndRetainer(e.target.value as any)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    >
                      <option value="Per-Matter">Per-Matter Engagement</option>
                      <option value="Active Retainer">Active Private Retainer</option>
                      <option value="Pending Deposit">Pending Trust Deposit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Assigned Primary Advocate
                    </label>
                    <select
                      value={indAdvocate}
                      onChange={(e) => setIndAdvocate(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    >
                      {staffList.map((adv) => (
                        <option key={adv.id} value={adv.name}>
                          {adv.name} ({adv.practiceArea})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-stone-900 px-4 py-2 font-bold text-white hover:bg-stone-800 cursor-pointer shadow-sm"
                  >
                    Save Individual Client Form
                  </button>
                </div>
              </form>
            )}

            {/* FORM BODY: CORPORATE CLIENT */}
            {formType === 'Corporate' && (
              <form onSubmit={handleCorporateSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Registered Corporate / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Safaricom PLC or Equity Bank Kenya Ltd"
                      value={corpName}
                      onChange={(e) => setCorpName(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Certificate of Incorporation No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CPR/2012/89012"
                      value={corpRegNo}
                      onChange={(e) => setCorpRegNo(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Corporate KRA PIN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. P051123984A"
                      value={corpKraPin}
                      onChange={(e) => setCorpKraPin(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Industry Sector / Domain
                    </label>
                    <select
                      value={corpIndustry}
                      onChange={(e) => setCorpIndustry(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    >
                      <option value="Financial Services & Banking">Financial Services & Banking</option>
                      <option value="Telecommunications & FinTech">Telecommunications & FinTech</option>
                      <option value="Real Estate & Infrastructure">Real Estate & Infrastructure</option>
                      <option value="Aviation & Logistics">Aviation & Logistics</option>
                      <option value="Manufacturing & Energy">Manufacturing & Energy</option>
                      <option value="State Agency / Government">State Agency / Government Entity</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      General Counsel / Key Contact Person
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wanjiru Ndegwa (General Counsel)"
                      value={corpContactPerson}
                      onChange={(e) => setCorpContactPerson(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Official Corporate Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. legal@equitybank.co.ke"
                      value={corpEmail}
                      onChange={(e) => setCorpEmail(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Corporate Phone / HQ Telephone
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +254 20 226 2000"
                      value={corpPhone}
                      onChange={(e) => setCorpPhone(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Registered Office HQ Location & City
                    </label>
                    <input
                      type="text"
                      value={corpCity}
                      onChange={(e) => setCorpCity(e.target.value)}
                      placeholder="e.g. Nairobi (Equity Centre, Upper Hill)"
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Retainer Agreement Status
                    </label>
                    <select
                      value={corpRetainer}
                      onChange={(e) => setCorpRetainer(e.target.value as any)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    >
                      <option value="Active Retainer">Active Corporate Retainer</option>
                      <option value="Per-Matter">Per-Matter Brief</option>
                      <option value="Pending Deposit">Pending Deposit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Lead Relationship Partner
                    </label>
                    <select
                      value={corpLeadPartner}
                      onChange={(e) => setCorpLeadPartner(e.target.value)}
                      className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                    >
                      {staffList.map((adv) => (
                        <option key={adv.id} value={adv.name}>
                          {adv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-[#0B63E5] px-4 py-2 font-bold text-white hover:bg-[#0256D0] cursor-pointer shadow-sm"
                  >
                    Save Corporate Client Form
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
