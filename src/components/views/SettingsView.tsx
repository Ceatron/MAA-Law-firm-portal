import React, { useState, useRef } from 'react';
import {
  Building2,
  Shield,
  Scale,
  FileText,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Phone,
  Mail,
  Globe,
  MapPin,
  Landmark,
  Receipt,
} from 'lucide-react';
import { TemplateManager } from '../TemplateManager';
import { FeeNoteTemplateManager } from '../FeeNoteTemplateManager';
import { CompanyLogo } from '../CompanyLogo';
import { LoginAuditLogViewer } from '../LoginAuditLogViewer';
import { ChambersSettings } from '../../types';
import {
  loadChambersSettings,
  saveChambersSettings,
  resetChambersSettings,
} from '../../utils/settingsStorage';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'fee-notes' | 'integrations' | 'security'>('profile');
  const [settings, setSettings] = useState<ChambersSettings>(() => loadChambersSettings());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSettings((prev) => ({
          ...prev,
          logoUrl: e.target?.result as string,
        }));
        showToast('Company logo updated! Click "Save Chambers Settings" to apply across the app.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logoUrl: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Custom logo removed. Reset to default chambers monogram.');
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveChambersSettings(settings);
      showToast('All chambers settings & branding saved successfully!');
    } catch (err) {
      showToast('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all chambers settings and branding to firm defaults?')) {
      const reset = resetChambersSettings();
      setSettings(reset);
      showToast('Settings reset to chambers default profile.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 rounded-lg bg-[#1c2d3d] px-4 py-3 text-xs font-semibold text-white shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View Header with Save Button */}
      <div className="border-b border-[#e2dfd5] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-title text-2xl font-bold text-[#1a1d20]">
            Chambers & System Preferences
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            Configure {settings.firmName} chambers branding, company logo, LSK practicing setup, templates & integrations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
            title="Reset to default settings"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#e2dfd5] pb-px overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-md'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Firm Profile & Company Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'templates'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-md'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Legal Document Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('fee-notes')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'fee-notes'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-md'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Fee Note & Billing Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-md'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Judiciary CTS & e-Citizen Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-[#0070ba] text-[#0070ba] font-bold bg-[#ebf5fc]/60 rounded-t-md'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>LSK Compliance & Audit Rules</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'templates' && <TemplateManager />}
      {activeTab === 'fee-notes' && <FeeNoteTemplateManager />}

      {activeTab === 'profile' && (
        <div className="space-y-6 text-xs animate-in fade-in duration-150">
          {/* SECTION 1: Company Logo Upload */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2 font-serif-title font-bold text-stone-900 text-sm">
                <ImageIcon className="h-4 w-4 text-[#0070ba]" />
                <span>Chambers Company Logo & Visual Identity</span>
              </div>
              <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0070ba]">
                {settings.logoUrl ? 'Custom Logo Active' : 'Default Monogram'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Dropzone & Upload Area */}
              <div className="md:col-span-7 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#0070ba] bg-[#ebf5fc]'
                      : 'border-[#cbd5e1] bg-[#f8fafc] hover:border-[#0070ba] hover:bg-white'
                  }`}
                >
                  <div className="rounded-full bg-[#ebf5fc] p-3 text-[#0070ba] mb-2 shadow-2xs">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="font-bold text-stone-800 text-xs">
                    Click to browse or drag & drop company logo here
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500">
                    Supports PNG, SVG, JPG, or WebP (Max 5MB). High resolution with transparent background recommended.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1 rounded-lg border border-[#c3e1f7] bg-[#ebf5fc] px-3 py-1.5 text-xs font-bold text-[#0070ba] hover:bg-[#d6ecfa] transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload New File</span>
                  </button>

                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center space-x-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Custom Logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Preview Card */}
              <div className="md:col-span-5 rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
                <span className="text-[10px] font-bold text-stone-500 tracking-wider block">
                  Branding Live Previews
                </span>

                {/* Dark Background Preview (Sidebar style) */}
                <div className="rounded-lg bg-[#16181b] p-3.5 flex items-center justify-center border border-stone-800 shadow-inner">
                  <CompanyLogo
                    variant="horizontal"
                    size="sm"
                    darkBg={true}
                    customLogoUrl={settings.logoUrl}
                  />
                </div>

                {/* Light Background Preview (Invoice & Letterhead style) */}
                <div className="rounded-lg bg-white p-3.5 flex items-center justify-center border border-stone-200 shadow-xs">
                  <CompanyLogo
                    variant="horizontal"
                    size="sm"
                    darkBg={false}
                    customLogoUrl={settings.logoUrl}
                  />
                </div>

                <p className="text-[10px] text-stone-500 text-center leading-tight">
                  This logo displays in the main sidebar, formal fee notes, invoice PDFs, and client communications.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Firm Chambers Profile Information */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3 font-serif-title font-bold text-stone-900 text-sm">
              <Building2 className="h-4 w-4 text-[#0070ba]" />
              <span>Chambers Registration & Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Firm Registered Name</label>
                <input
                  type="text"
                  value={settings.firmName}
                  onChange={(e) => setSettings({ ...settings, firmName: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-semibold text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Chambers Motto / Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">LSK Firm Registration No.</label>
                <input
                  type="text"
                  value={settings.lskFirmRegNo}
                  onChange={(e) => setSettings({ ...settings, lskFirmRegNo: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-mono font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">KRA PIN Number</label>
                <input
                  type="text"
                  value={settings.kraPin}
                  onChange={(e) => setSettings({ ...settings, kraPin: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-mono font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Physical Chambers Location</label>
                <input
                  type="text"
                  value={settings.physicalAddress}
                  onChange={(e) => setSettings({ ...settings, physicalAddress: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Postal Address</label>
                <input
                  type="text"
                  value={settings.postalAddress}
                  onChange={(e) => setSettings({ ...settings, postalAddress: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Official Chambers Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Official Chambers Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Accounts & Billing Email</label>
                <input
                  type="email"
                  value={settings.billingEmail}
                  onChange={(e) => setSettings({ ...settings, billingEmail: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Chambers Website</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Managing / Senior Partner</label>
                <input
                  type="text"
                  value={settings.managingPartner}
                  onChange={(e) => setSettings({ ...settings, managingPartner: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Client Trust & Bank Escrow Accounts */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3 font-serif-title font-bold text-stone-900 text-sm">
              <Landmark className="h-4 w-4 text-[#0070ba]" />
              <span>Chambers Bank & Escrow Accounts (For Fee Notes & Trust Accounts)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settings.bankDetails.bankName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Account Name</label>
                <input
                  type="text"
                  value={settings.bankDetails.accountName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, accountName: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Account Number</label>
                <input
                  type="text"
                  value={settings.bankDetails.accountNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Branch</label>
                <input
                  type="text"
                  value={settings.bankDetails.branch}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, branch: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">M-Pesa Paybill / Till Number</label>
                <input
                  type="text"
                  value={settings.bankDetails.paybillNumber || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, paybillNumber: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={settings.bankDetails.swiftCode || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, swiftCode: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 rounded-lg bg-[#0070ba] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Chambers Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-5 text-xs animate-in fade-in duration-150">
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3 font-serif-title font-bold text-stone-900 text-sm">
              <Scale className="h-4 w-4 text-[#0070ba]" />
              <span>Judiciary CTS & e-Citizen Portal Integrations</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">Judiciary Court Tracking System (CTS)</p>
                  <p className="text-[11px] text-stone-500">Auto-fetches High Court & ELC cause lists, court appearance dates & e-filing receipts</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">CONNECTED</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.integrations.ctsAutoSync}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: { ...settings.integrations, ctsAutoSync: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0070ba]"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">Ministry of Lands ArdhiSasa Portal</p>
                  <p className="text-[11px] text-stone-500">Title search verification, land valuation & stamp duty land registration</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">CONNECTED</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.integrations.ardhiSasaSync}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: { ...settings.integrations, ardhiSasaSync: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0070ba]"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">Business Registration Service (BRS) e-Citizen Portal</p>
                  <p className="text-[11px] text-stone-500">Official CR12 company searches, director verification & beneficial ownership filing</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">CONNECTED</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.integrations.brsAutoSearch}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: { ...settings.integrations, brsAutoSearch: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0070ba]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 rounded-lg bg-[#0070ba] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Integrations</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-5 text-xs animate-in fade-in duration-150">
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3 font-serif-title font-bold text-stone-900 text-sm">
              <Shield className="h-4 w-4 text-[#0070ba]" />
              <span>Law Society of Kenya (LSK) Compliance & Audit Trail Rules</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">2026 LSK Practicing Certificate Status</p>
                  <p className="text-[11px] text-stone-500 font-mono">Roll Ref: {settings.compliance.rollRef} — Active License</p>
                </div>
                <span className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">VERIFIED</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">Client Trust Account Audit Log</p>
                  <p className="text-[11px] text-stone-500">Immutable transaction logging enabled under Advocates Trust Account Rules</p>
                </div>
                <span className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">ENFORCED</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">Mandatory Conflict of Interest Clearance</p>
                  <p className="text-[11px] text-stone-500">Require formal conflict search check prior to assigning new matter files</p>
                </div>
                <span className="rounded bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-[#0070ba]">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Dedicated Login Audit Trail in Compliance Settings */}
          <div className="pt-2">
            <LoginAuditLogViewer />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 rounded-lg bg-[#0070ba] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Compliance Rules</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
