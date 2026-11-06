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
  Database,
  Download,
  Activity,
  Search,
  Filter,
  Briefcase,
  Award,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  Sliders,
  Palette,
  Hash,
  ArrowLeft,
  Users,
  Percent,
  Settings2,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { TemplateManager } from '../TemplateManager';
import { FeeNoteTemplateManager } from '../FeeNoteTemplateManager';
import { PdfTemplateManager } from '../customization/PdfTemplateManager';
import { TransactionNumberSeriesManager } from '../customization/TransactionNumberSeriesManager';
import { EmailNotificationManager } from '../customization/EmailNotificationManager';
import { CompanyLogo } from '../CompanyLogo';
import { LoginAuditLogViewer } from '../LoginAuditLogViewer';
import { DataHealthCheck } from '../DataHealthCheck';
import { ChambersSettings, Advocate } from '../../types';
import { isSysAdminUser, loadStaffRoster } from '../../utils/staffStorage';
import {
  loadChambersSettings,
  saveChambersSettings,
  saveChambersSettingsAsync,
  fetchAndHydrateChambersSettings,
  resetChambersSettings,
} from '../../utils/settingsStorage';

interface SettingsViewProps {
  currentAdvocate?: Advocate;
  isSystemAdmin?: boolean;
  onOpenBackupModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentAdvocate,
  isSystemAdmin,
  onOpenBackupModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'hub' | 'customization' | 'profile' | 'taxes' | 'users' | 'roles' | 'templates' | 'fee-notes' | 'integrations' | 'security' | 'data-health'
  >('hub');
  const [customizationSubTab, setCustomizationSubTab] = useState<
    'pdf-templates' | 'transaction-series' | 'email-notifications'
  >('pdf-templates');
  const [settings, setSettings] = useState<ChambersSettings>(() => loadChambersSettings());
  const [staffRoster, setStaffRoster] = useState<Advocate[]>(() => loadStaffRoster());
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Hydrate settings on mount and listen for real-time firm & staff updates
  React.useEffect(() => {
    fetchAndHydrateChambersSettings()
      .then((fresh) => {
        if (fresh) setSettings(fresh);
      })
      .catch((err) => console.warn('Failed to hydrate settings from DB:', err));

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ChambersSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    const handleStaffUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Advocate[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setStaffRoster(customEvent.detail);
      } else {
        setStaffRoster(loadStaffRoster());
      }
    };

    window.addEventListener('chambers-settings-updated', handleSettingsUpdate);
    window.addEventListener('chambers-staff-updated', handleStaffUpdate);
    return () => {
      window.removeEventListener('chambers-settings-updated', handleSettingsUpdate);
      window.removeEventListener('chambers-staff-updated', handleStaffUpdate);
    };
  }, []);

  const isDevAdmin = isSysAdminUser(currentAdvocate);

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
        showToast('Company logo updated! Click "Save Firm Workspace Settings" to apply across the app.');
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await saveChambersSettingsAsync(settings);
      setSettings(saved);
      showToast('All chambers settings & firm profile saved and synced across all user dashboards!');
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

  const handleUpdateSettings = (newSettings: ChambersSettings) => {
    setSettings(newSettings);
    try {
      saveChambersSettings(newSettings);
    } catch (err) {
      console.error('Failed to auto-save settings:', err);
    }
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

      {/* View Header with Save Button & Contextual Navigation */}
      <div className="border-b border-[#e2dfd5] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs (only when navigated inside a sub-setting) */}
          {activeTab !== 'hub' && (
            <div className="flex items-center space-x-1.5 text-xs text-stone-500 mb-1">
              <button
                type="button"
                onClick={() => setActiveTab('hub')}
                className="hover:text-[#0070ba] transition-colors cursor-pointer font-medium text-stone-600 flex items-center space-x-1"
              >
                <span>All Settings</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-bold text-[#0070ba]">
                {activeTab === 'users'
                  ? 'Users & Staff Roster'
                  : activeTab === 'roles'
                  ? 'Roles & Permissions'
                  : activeTab === 'customization'
                  ? customizationSubTab === 'pdf-templates'
                    ? 'PDF Templates'
                    : 'Transaction Number Series'
                  : activeTab === 'profile'
                  ? 'Firm Profile'
                  : activeTab === 'taxes'
                  ? 'Taxes & Compliance'
                  : activeTab === 'templates'
                  ? 'Legal Document Templates'
                  : activeTab === 'fee-notes'
                  ? 'Fee Note Templates'
                  : activeTab === 'integrations'
                  ? 'Judiciary Integrations'
                  : activeTab === 'data-health'
                  ? 'Data Health Diagnostics'
                  : 'Security & Compliance'}
              </span>
            </div>
          )}

          <h2 className="font-serif-title text-2xl font-bold text-[#1a1d20]">
            {activeTab === 'hub'
              ? 'Organization Settings'
              : activeTab === 'users'
              ? 'Users & Chambers Staff'
              : activeTab === 'roles'
              ? 'Chambers Roles & Permissions'
              : activeTab === 'customization'
              ? customizationSubTab === 'pdf-templates'
                ? 'PDF Templates Customizer'
                : 'Transaction Number Series'
              : activeTab === 'profile'
              ? 'Firm Practice Profile & Details'
              : activeTab === 'taxes'
              ? 'Taxes & Statutory Compliance'
              : activeTab === 'data-health'
              ? 'System & Storage Health Diagnostics'
              : 'Workspace Preferences'}
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            {activeTab === 'hub'
              ? 'Configure your practice entity, roles, tax compliance, default numbering, and custom document templates.'
              : activeTab === 'users'
              ? 'Manage active advocates, partners, registry clerks, and chambers administrators across Muthoni & Ahago Advocates.'
              : activeTab === 'roles'
              ? 'Review role classifications, access control permissions, and statutory authorization matrices.'
              : activeTab === 'customization'
              ? 'Configure document styling, color schemes, and numbering series for Muthoni & Ahago Advocates'
              : activeTab === 'taxes'
              ? 'Configure Kenya Revenue Authority (KRA) tax identification, standard 16% VAT, and withholding tax terms'
              : activeTab === 'data-health'
              ? 'Real-time database connectivity, index integrity, and persistent browser storage diagnostics.'
              : `Configure ${settings.firmName} workspace details & preferences`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab !== 'hub' && (
            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-stone-500" />
              <span>All Settings</span>
            </button>
          )}

          {isDevAdmin && (
            <button
              type="button"
              id="btn-settings-header-data-health"
              onClick={() => setActiveTab('data-health')}
              className={`flex items-center space-x-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                activeTab === 'data-health'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
              }`}
              title="Database & Storage Health Diagnostics (Developer Only)"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>Data Health</span>
            </button>
          )}

          {isDevAdmin && onOpenBackupModal && (
            <button
              type="button"
              id="btn-settings-header-export-backup"
              onClick={onOpenBackupModal}
              className="flex items-center space-x-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs"
              title="Admin Only: Non-destructive local storage backup export"
            >
              <Database className="h-3.5 w-3.5 text-amber-700" />
              <span>Backup</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
            title="Reset to default settings"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span>Reset</span>
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

      {/* ============================================================ */}
      {/* 1. ORGANIZATION SETTINGS HUB OVERVIEW (Cards Section) */}
      {/* ============================================================ */}
      {activeTab === 'hub' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            {/* The 4 Columns / Cards with active & marked-inactive sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Column 1: Organization */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-emerald-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm border-b border-emerald-100 pb-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>Organization</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="hover:text-[#0070ba] hover:underline cursor-pointer py-1 block w-full text-left font-medium text-slate-700"
                      >
                        Profile
                      </button>
                    </li>
                    {isDevAdmin && (
                      <li>
                        <button
                          type="button"
                          onClick={() => setActiveTab('data-health')}
                          className="hover:text-emerald-700 hover:underline cursor-pointer py-1 flex items-center justify-between w-full text-left font-semibold text-emerald-800"
                        >
                          <span>Data Health & Diagnostics</span>
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </li>
                    )}
                    {/* Branding: Marked inactive in production per user directive */}
                    <li className="flex items-center justify-between py-1 text-slate-400 cursor-not-allowed select-none">
                      <span className="font-medium text-slate-400">Branding</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Column 2: Users & Roles (Active) */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-rose-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-rose-700 font-bold text-sm border-b border-rose-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>Users & Roles</span>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      {staffRoster.length} Active
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className="hover:text-[#0070ba] hover:underline cursor-pointer py-1 block w-full text-left font-medium text-slate-700"
                      >
                        Users
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveTab('roles')}
                        className="hover:text-[#0070ba] hover:underline cursor-pointer py-1 block w-full text-left font-medium text-slate-700"
                      >
                        Roles
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Column 3: Taxes & Compliance (Active) */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-blue-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-[#0070ba] font-bold text-sm border-b border-blue-100 pb-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#0070ba]">
                      <Percent className="w-4 h-4" />
                    </div>
                    <span>Taxes & Compliance</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveTab('taxes')}
                        className="hover:text-[#0070ba] hover:underline cursor-pointer py-1 block w-full text-left font-medium text-slate-700"
                      >
                        Taxes
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Column 4: Customization */}
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4 shadow-xs space-y-3 ring-1 ring-amber-400/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm border-b border-amber-200/80 pb-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span>Customization</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-800 mt-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('customization');
                          setCustomizationSubTab('transaction-series');
                        }}
                        className="hover:text-[#0070ba] hover:underline cursor-pointer py-1 block w-full text-left font-semibold text-slate-700 hover:text-[#0070ba]"
                      >
                        Transaction Number Series
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('customization');
                          setCustomizationSubTab('pdf-templates');
                        }}
                        className="text-[#0070ba] hover:text-[#005a96] hover:underline cursor-pointer py-1 block w-full text-left font-bold flex items-center justify-between"
                      >
                        <span>PDF Templates</span>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      </button>
                    </li>
                    {/* Email Notifications: Marked inactive in production per user directive */}
                    <li className="flex items-center justify-between py-1 text-slate-400 cursor-not-allowed select-none">
                      <span className="font-medium text-slate-400">Email Notifications</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-amber-100/60 border border-amber-200/60 px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CUSTOMIZATION SECTION (Requested Feature) */}
      {/* ============================================================ */}
      {activeTab === 'customization' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Customization Sub-Tabs Bar */}
          <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCustomizationSubTab('pdf-templates')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                customizationSubTab === 'pdf-templates'
                  ? 'bg-white text-[#0070ba] shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4 text-[#0070ba]" />
              <span>PDF Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomizationSubTab('transaction-series')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                customizationSubTab === 'transaction-series'
                  ? 'bg-white text-[#0070ba] shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Hash className="w-4 h-4 text-slate-600" />
              <span>Transaction Number Series</span>
            </button>

            <div
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed select-none opacity-60 rounded-lg"
              title="Email Notifications are inactive pending production configuration"
            >
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email Notifications</span>
              <span className="text-[9px] font-semibold bg-slate-200/90 text-slate-500 px-1.5 py-0.5 rounded">
                Inactive
              </span>
            </div>
          </div>

          {/* Sub-tab Contents */}
          {customizationSubTab === 'pdf-templates' && (
            <PdfTemplateManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}

          {customizationSubTab === 'transaction-series' && (
            <TransactionNumberSeriesManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}

          {customizationSubTab === 'email-notifications' && (
            <EmailNotificationManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}
        </div>
      )}

      {/* Tab Contents: Existing Sections */}
      {activeTab === 'templates' && <TemplateManager />}
      {activeTab === 'fee-notes' && <FeeNoteTemplateManager />}

      {/* ============================================================ */}
      {/* USERS & ROLES SECTIONS (ACTIVE IN PRODUCTION) */}
      {/* ============================================================ */}
      {(activeTab === 'users' || activeTab === 'roles') && (
        <div className="space-y-5 text-xs animate-in fade-in duration-150">
          {/* Sub-Tabs Switcher */}
          <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-[#0070ba] shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-[#0070ba]" />
              <span>Users & Chambers Staff ({staffRoster.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-white text-[#0070ba] shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Roles & Access Permissions Matrix</span>
            </button>
          </div>

          {/* ACTIVE TAB: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Role Filter Header */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Search by advocate name, email, roll number, or practice area..."
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0070ba] focus:outline-none"
                  />
                  {staffSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStaffSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap">Role Filter:</span>
                  <select
                    value={staffRoleFilter}
                    onChange={(e) => setStaffRoleFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-[#0070ba] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Roles ({staffRoster.length})</option>
                    <option value="Managing Advocate">Managing Advocate</option>
                    <option value="Consultant Advocate">Consultant Advocate</option>
                    <option value="Advocate">Advocate</option>
                    <option value="Office Manager">Office Manager</option>
                    <option value="Legal Support Clerk">Legal Support Clerk</option>
                    <option value="System Admin">System Admin</option>
                  </select>
                </div>
              </div>

              {/* Staff Cards Grid */}
              {(() => {
                const query = staffSearchQuery.trim().toLowerCase();
                const filtered = staffRoster.filter((member) => {
                  const matchesRole = staffRoleFilter === 'All' || member.role === staffRoleFilter;
                  if (!query) return matchesRole;
                  const matchesSearch =
                    member.name.toLowerCase().includes(query) ||
                    member.email.toLowerCase().includes(query) ||
                    member.role.toLowerCase().includes(query) ||
                    (member.lskRollNo && member.lskRollNo.toLowerCase().includes(query)) ||
                    (member.title && member.title.toLowerCase().includes(query)) ||
                    (member.practiceArea && member.practiceArea.toLowerCase().includes(query));
                  return matchesRole && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No matching staff members found</p>
                      <p className="text-[11px] text-slate-400 mt-1">Try clearing your search query or role filter.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((member) => {
                      const isSysAdmin = member.role === 'System Admin' || Boolean(member.isSystemAdmin);
                      const isManagingPartner = member.role === 'Managing Advocate';
                      
                      const roleBadgeColor = (() => {
                        switch (member.role) {
                          case 'Managing Advocate':
                            return 'bg-purple-50 text-purple-800 border-purple-200';
                          case 'Consultant Advocate':
                            return 'bg-blue-50 text-blue-800 border-blue-200';
                          case 'Advocate':
                            return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          case 'Office Manager':
                            return 'bg-amber-50 text-amber-800 border-amber-200';
                          case 'Legal Support Clerk':
                            return 'bg-teal-50 text-teal-800 border-teal-200';
                          case 'System Admin':
                            return 'bg-slate-800 text-white border-slate-700';
                          default:
                            return 'bg-slate-100 text-slate-800 border-slate-200';
                        }
                      })();

                      return (
                        <div
                          key={member.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#0070ba]/40 transition-all flex flex-col justify-between space-y-3"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={member.avatar || '/avatars/african_lawyer.jpg'}
                                alt={member.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0 bg-slate-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/avatars/african_lawyer.jpg';
                                }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <h4 className="font-serif-title font-bold text-slate-900 text-sm truncate">
                                    {member.name}
                                  </h4>
                                  {isManagingPartner && (
                                    <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-300 font-bold px-1.5 py-0.2 rounded shrink-0">
                                      Partner
                                    </span>
                                  )}
                                  {isSysAdmin && (
                                    <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-300 font-bold px-1.5 py-0.2 rounded shrink-0">
                                      Dev / Sys Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-600 truncate mt-0.5" title={member.title}>
                                  {member.title}
                                </p>
                                <div className="mt-1 flex items-center space-x-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleBadgeColor}`}>
                                    {member.role}
                                  </span>
                                  {member.practiceArea && (
                                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {member.practiceArea}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Active</span>
                            </span>
                          </div>

                          {/* Contact & Statutory Metadata */}
                          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 space-y-1.5 text-[11px]">
                            {member.lskRollNo && (
                              <div className="flex items-center justify-between text-slate-700">
                                <span className="font-medium text-slate-500">Roll / Registration No:</span>
                                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {member.lskRollNo}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-slate-700 truncate">
                              <span className="font-medium text-slate-500 shrink-0">Official Email:</span>
                              <a
                                href={`mailto:${member.email}`}
                                className="font-medium text-[#0070ba] hover:underline truncate ml-2 text-right"
                              >
                                {member.email}
                              </a>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="font-medium text-slate-500">Chambers Phone:</span>
                              <a href={`tel:${member.phone}`} className="font-medium text-slate-800 hover:text-[#0070ba]">
                                {member.phone}
                              </a>
                            </div>
                            {member.joinedDate && (
                              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                                <span>Appointment Date:</span>
                                <span>{member.joinedDate}</span>
                              </div>
                            )}
                          </div>

                          {/* Permissions Chips */}
                          <div className="pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                              Authorized Permissions:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {member.permissions?.canViewAllMatters ? (
                                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  ✓ All Matters
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                                  Assigned Matters Only
                                </span>
                              )}

                              {member.permissions?.canEditBilling && (
                                <span className="text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                                  ✓ Invoicing & Billing
                                </span>
                              )}

                              {member.permissions?.canManageStaff && (
                                <span className="text-[10px] font-medium bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">
                                  ✓ Staff Admin
                                </span>
                              )}

                              {member.permissions?.canAccessTrustAudit && (
                                <span className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                  ✓ Trust Escrow Audit
                                </span>
                              )}

                              {member.permissions?.canViewFinancialInsights && (
                                <span className="text-[10px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded">
                                  ✓ Revenue Insights
                                </span>
                              )}

                              {member.permissions?.canExportReports && (
                                <span className="text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                                  ✓ Export Reports
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ACTIVE TAB: ROLES & PERMISSIONS MATRIX */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {/* Role Classifications Description Cards */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif-title font-bold text-slate-900 text-sm">
                        Chambers Role Classifications & Governance
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Configured pursuant to the Advocates Act (Cap 16, Laws of Kenya) and LSK Practice Guidelines.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded">
                    6 Practice Roles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 text-xs">Managing Advocate</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                        Partner Tier
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-900/80 leading-relaxed">
                      Statutory practice partner with universal authorization over matter dockets, trust account audits, partner disbursements, fee notes, and advocate assignments.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 text-xs">Consultant Advocate</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        Senior Advisory
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-900/80 leading-relaxed">
                      Senior counsel providing high-level constitutional, energy, and tax law advisory. Exercises case oversight and exports statutory compliance reports.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs">Advocate</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Associate Tier
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                      Practicing advocate handling assigned litigation, pleadings drafting, conveyancing transactions, court diary schedules, and client communications.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs">Office Manager</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Operations Head
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Oversees day-to-day chambers administration, client onboarding, invoicing and fee note dispatch, and task coordination across practice groups.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-950 text-xs">Legal Support Clerk</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                        Registry & CTS
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-900/80 leading-relaxed">
                      Registry filing, court service of process, Judiciary CTS portal document upload, and hearing date confirmation across Kenyan court stations.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">System Admin</span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                        Technical Lead
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Technical administrator managing workspace database integrity, local storage backups, API integrations, and developer health diagnostics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprehensive Permissions Matrix Table */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-serif-title font-bold text-slate-900 text-sm">
                      Role & Permissions Access Matrix
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Granular operational authorization by practice role.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    Strict RBAC Enforced
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                        <th className="py-2.5 px-3 font-bold text-left">Security Permission / Capability</th>
                        <th className="py-2.5 px-2.5 font-bold text-center">System Admin</th>
                        <th className="py-2.5 px-2.5 font-bold text-center">Managing Advocate</th>
                        <th className="py-2.5 px-2.5 font-bold text-center">Consultant Advocate</th>
                        <th className="py-2.5 px-2.5 font-bold text-center">Advocate</th>
                        <th className="py-2.5 px-2.5 font-bold text-center">Office Manager</th>
                        <th className="py-2.5 px-2.5 font-bold text-center">Legal Clerk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">View All Practice Matters</span>
                          <span className="text-[11px] text-slate-500">Access files across all practice departments</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">Manage Staff Accounts & Roster</span>
                          <span className="text-[11px] text-slate-500">Invite, configure roles, and set practicing credentials</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">Draft & Issue Invoices / Fee Notes</span>
                          <span className="text-[11px] text-slate-500">Create tax fee notes, record client disbursements</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">Financial Insights & Revenue</span>
                          <span className="text-[11px] text-slate-500">Chambers billings, partner draw calculations</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">Trust & Escrow Account Audit</span>
                          <span className="text-[11px] text-slate-500">Advocates Trust Account Rules audit access</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">Export Statutory & Practice Reports</span>
                          <span className="text-[11px] text-slate-500">Case summaries, matter export PDFs, client statements</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /></td>
                        <td className="py-2.5 px-2.5 text-center text-slate-300 font-bold">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Taxes & Statutory Compliance View */}
      {activeTab === 'taxes' && (
        <div className="space-y-6 text-xs animate-in fade-in duration-150">
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center space-x-2.5 font-serif-title font-bold text-stone-900 text-base">
                <Percent className="h-5 w-5 text-[#0070ba]" />
                <span>Taxes & Practice Compliance Settings</span>
              </div>
              <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#0070ba]">
                Kenya Tax Compliance (KRA & LSK)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KRA PIN */}
              <div className="space-y-1.5">
                <label className="block text-stone-700 font-bold">
                  KRA Tax PIN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.kraPin}
                  onChange={(e) => setSettings({ ...settings, kraPin: e.target.value.toUpperCase() })}
                  placeholder="e.g. P0512839401Z"
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2.5 font-mono font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none uppercase"
                />
                <p className="text-[11px] text-stone-500">
                  Statutory PIN required for Tax Invoices, withholding tax certificates, and iTax filing reconciliations.
                </p>
              </div>

              {/* LSK Firm Reg */}
              <div className="space-y-1.5">
                <label className="block text-stone-700 font-bold">
                  Law Society of Kenya (LSK) Firm Reg No.
                </label>
                <input
                  type="text"
                  value={settings.lskFirmRegNo}
                  onChange={(e) => setSettings({ ...settings, lskFirmRegNo: e.target.value })}
                  placeholder="e.g. LSK/FIRM/2026/0411"
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2.5 font-mono font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
                <p className="text-[11px] text-stone-500">
                  Regulatory registration displayed on fee notes, formal statements of account, and court pleadings.
                </p>
              </div>

              {/* Standard VAT Card */}
              <div className="rounded-xl border border-stone-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                    Standard Value Added Tax (VAT)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    16.0% (Statutory Rate)
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Kenya VAT Act standard statutory rate applied to professional legal fees, advisory charges, and retainer billing.
                </p>
                <div className="flex items-center space-x-2 pt-1 text-slate-700">
                  <input
                    type="checkbox"
                    id="vat-auto-enabled"
                    checked={true}
                    disabled
                    className="rounded border-slate-300 text-[#0070ba]"
                  />
                  <label htmlFor="vat-auto-enabled" className="text-[11px] font-medium text-slate-700">
                    Auto-calculate 16% VAT on taxable professional fee note items
                  </label>
                </div>
              </div>

              {/* Withholding Tax Card */}
              <div className="rounded-xl border border-stone-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                    Withholding Tax (WHT) Particulars
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    5% Professional Fees
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Clients withholding 5% income tax and 2% withholding VAT should remit against firm PIN: <strong className="font-mono">{settings.kraPin || 'P0512839401Z'}</strong>.
                </p>
                <div className="text-[11px] text-slate-500">
                  Compliant with Income Tax Act (Cap 470, Laws of Kenya).
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 rounded-lg bg-[#0070ba] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Tax Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6 text-xs animate-in fade-in duration-150">
          {/* SECTION 1: Company Logo Upload */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2 font-serif-title font-bold text-stone-900 text-sm">
                <ImageIcon className="h-4 w-4 text-[#0070ba]" />
                <span>Firm Workspace Company Logo & Visual Identity</span>
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

          {/* SECTION 2: Firm Workspace Profile Information */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3 font-serif-title font-bold text-stone-900 text-sm">
              <Building2 className="h-4 w-4 text-[#0070ba]" />
              <span>Firm Workspace Registration & Contact Information</span>
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
                <label className="block text-stone-700 font-bold mb-1">Firm Workspace Motto / Tagline</label>
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
                <label className="block text-stone-700 font-bold mb-1">Physical Firm Workspace Location</label>
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
                <label className="block text-stone-700 font-bold mb-1">Official Firm Workspace Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 font-medium text-stone-900 focus:border-[#0070ba] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Official Firm Workspace Email</label>
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
                <label className="block text-stone-700 font-bold mb-1">Firm Workspace Website</label>
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
              <span>Firm Workspace Bank & Escrow Accounts (For Fee Notes & Trust Accounts)</span>
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
              <span>{isSaving ? 'Saving Changes...' : 'Save Firm Workspace Settings'}</span>
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

          {/* Dedicated Admin Data Backup & Local Storage Archive */}
          {isDevAdmin && onOpenBackupModal && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                <div className="flex items-center space-x-2 font-serif-title font-bold text-amber-950 text-sm">
                  <Database className="h-4 w-4 text-amber-700" />
                  <span>Firm Data Preservation & Backup (Admin Only)</span>
                </div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                  SYSTEM ADMIN
                </span>
              </div>

              <p className="text-xs text-amber-900/90 leading-relaxed">
                Generate an immediate, non-destructive JSON backup of all browser localStorage datasets.
                This utility is strictly read-only and will not delete, reset, or overwrite any existing firm records.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-amber-800">
                  <span>Captures matters, clients, tasks, fee notes, documents, staff accounts, client interactions & case notes.</span>
                </div>
                <button
                  type="button"
                  id="btn-settings-security-export-backup"
                  onClick={onOpenBackupModal}
                  className="flex items-center justify-center space-x-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Data Backup</span>
                </button>
              </div>
            </div>
          )}

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

      {/* ============================================================ */}
      {/* 8. DATABASE & STORAGE HEALTH CHECK (Developer Only) */}
      {/* ============================================================ */}
      {activeTab === 'data-health' && isDevAdmin && (
        <DataHealthCheck currentAdvocate={currentAdvocate} />
      )}

      {activeTab === 'data-health' && !isDevAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-serif-title font-bold text-amber-950 text-base">Restricted Technical Diagnostics</h3>
          <p className="text-xs text-amber-900/80 max-w-md mx-auto">
            Database & storage health checks are restricted to technical administrators and system developers.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            className="mt-2 inline-flex items-center space-x-1.5 rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-bold text-white hover:bg-[#005a96] transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to All Settings</span>
          </button>
        </div>
      )}
    </div>
  );
};
