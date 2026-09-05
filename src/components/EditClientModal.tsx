import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Client } from '../types';
import { DraggableModal } from './common/DraggableModal';

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (updatedClient: Client) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'Individual' | 'Corporate' | 'State Entity'>('Individual');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setType(client.type || 'Individual');
      setIndustry(client.industry || '');
      setContactPerson(client.contactPerson || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setCity(client.city || 'Nairobi');
      setError(null);
      setIsSaved(false);
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client name cannot be empty');
      return;
    }

    const updatedClient: Client = {
      ...client,
      name: name.trim(),
      type,
      industry: industry.trim() || (type === 'Individual' ? 'Private Individual' : 'General Business'),
      contactPerson: contactPerson.trim() || name.trim(),
      email: email.trim() || 'client@muthoniahago.co.ke',
      phone: phone.trim() || '+254 700 000 000',
      city: city.trim() || 'Nairobi',
    };

    onSave(updatedClient);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const isIndividual = type === 'Individual';

  return (
    <div
      id="edit-client-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto"
    >
      <DraggableModal
        id="edit-client-modal-container"
        gripLabel={`EDIT CLIENT • ${client.name.toUpperCase().slice(0, 30)}`}
        className="w-full max-w-2xl rounded-xl border border-stone-300 bg-[#fbf9f4] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div
          data-drag-handle="true"
          className="flex items-center justify-between border-b border-stone-200 bg-[#16181b] px-6 py-4 text-white shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                isIndividual
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                  : 'bg-blue-950/40 border-blue-500/30 text-blue-400'
              }`}
            >
              {isIndividual ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-bold text-stone-100">
                  Edit Client Profile
                </h2>
                <span className="font-mono text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
                  ID: {client.id}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Update party identification, communications, and organizational record
              </p>
            </div>
          </div>

          <button
            id="edit-client-close-btn"
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs font-semibold text-rose-800 flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Client Type Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Client Category <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Individual', 'Corporate', 'State Entity'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    type === t
                      ? 'bg-[#0B2840] text-white border-[#0B2840] shadow-sm'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {t === 'Individual' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : t === 'Corporate' ? (
                    <Building2 className="h-3.5 w-3.5" />
                  ) : (
                    <Briefcase className="h-3.5 w-3.5" />
                  )}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {isIndividual ? 'Full Legal Name' : 'Company / Entity Name'}{' '}
                <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="edit-client-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isIndividual ? 'e.g. David Mutiso Mwangi' : 'e.g. Standard Chartered Bank PLC'}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 font-semibold focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {isIndividual ? 'Emergency Contact / Next of Kin' : 'Authorized Representative / Officer'}
              </label>
              <input
                id="edit-client-contact-input"
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder={isIndividual ? 'e.g. Jane Mwangi (Spouse)' : 'e.g. Sarah Jenkins (Head of Legal)'}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
              />
            </div>
          </div>

          {/* Industry / Profession & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {isIndividual ? 'Occupation / Field' : 'Industry / Sector'}
              </label>
              <input
                id="edit-client-industry-input"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={isIndividual ? 'e.g. Real Estate Investor' : 'e.g. Banking & Financial Services'}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                City / Location <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  id="edit-client-city-input"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nairobi (Upper Hill) or Mombasa"
                  className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 py-2 text-stone-900 focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  id="edit-client-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@domain.co.ke"
                  className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 py-2 text-stone-900 focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Official Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  id="edit-client-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 py-2 text-stone-900 focus:border-[#0B2840] focus:ring-1 focus:ring-[#0B2840] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <span>All changes sync immediately to Chambers cloud repository</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="edit-client-cancel-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="edit-client-save-btn"
                type="submit"
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold text-white shadow-sm transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#0B2840] hover:bg-[#133d5f]'
                }`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </DraggableModal>
    </div>
  );
};
