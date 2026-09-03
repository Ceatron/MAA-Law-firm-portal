import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { ClientServicesConfig, defaultConfig } from '../../utils/clientServicesStorage';

interface ClientServicesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClientServicesConfig;
  onSave: (newConfig: ClientServicesConfig) => void;
}

export const ClientServicesConfigModal: React.FC<ClientServicesConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [currentConfig, setCurrentConfig] = useState<ClientServicesConfig>({ ...config });
  const [newEnquiryCat, setNewEnquiryCat] = useState('');
  const [newComplaintCat, setNewComplaintCat] = useState('');
  const [newRequestType, setNewRequestType] = useState('');

  if (!isOpen) return null;

  const handleAddEnquiryCat = () => {
    if (!newEnquiryCat.trim()) return;
    if (!currentConfig.enquiryCategories.includes(newEnquiryCat.trim() as any)) {
      setCurrentConfig({
        ...currentConfig,
        enquiryCategories: [...currentConfig.enquiryCategories, newEnquiryCat.trim() as any],
      });
    }
    setNewEnquiryCat('');
  };

  const handleRemoveEnquiryCat = (cat: string) => {
    setCurrentConfig({
      ...currentConfig,
      enquiryCategories: currentConfig.enquiryCategories.filter((c) => c !== cat),
    });
  };

  const handleAddComplaintCat = () => {
    if (!newComplaintCat.trim()) return;
    if (!currentConfig.complaintCategories.includes(newComplaintCat.trim() as any)) {
      setCurrentConfig({
        ...currentConfig,
        complaintCategories: [...currentConfig.complaintCategories, newComplaintCat.trim() as any],
      });
    }
    setNewComplaintCat('');
  };

  const handleRemoveComplaintCat = (cat: string) => {
    setCurrentConfig({
      ...currentConfig,
      complaintCategories: currentConfig.complaintCategories.filter((c) => c !== cat),
    });
  };

  const handleAddRequestType = () => {
    if (!newRequestType.trim()) return;
    if (!currentConfig.clientRequestTypes.includes(newRequestType.trim() as any)) {
      setCurrentConfig({
        ...currentConfig,
        clientRequestTypes: [...currentConfig.clientRequestTypes, newRequestType.trim() as any],
      });
    }
    setNewRequestType('');
  };

  const handleRemoveRequestType = (type: string) => {
    setCurrentConfig({
      ...currentConfig,
      clientRequestTypes: currentConfig.clientRequestTypes.filter((t) => t !== type),
    });
  };

  const handleResetDefaults = () => {
    if (confirm('Reset Client Services settings to system defaults?')) {
      setCurrentConfig({ ...defaultConfig });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#132c3f] text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300 border border-white/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-title">Client Services Module Settings</h2>
              <p className="text-xs text-blue-200">Configure interaction categories, channels & SLA rules</p>
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

        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs text-stone-800 max-h-[80vh] overflow-y-auto">
          {/* General SLA & Automation */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider text-stone-600 border-b border-stone-200 pb-1.5">
              SLA & Automation Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Standard Enquiry SLA (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={currentConfig.slaResponseHours}
                  onChange={(e) =>
                    setCurrentConfig({ ...currentConfig, slaResponseHours: parseInt(e.target.value) || 24 })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.autoCreateTasksForFollowups}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, autoCreateTasksForFollowups: e.target.checked })
                    }
                    className="rounded border-stone-300 text-[#0B63E5] focus:ring-[#0B63E5]"
                  />
                  <span>Automatically sync follow-ups to Tasks module</span>
                </label>
              </div>
            </div>
          </div>

          {/* Enquiry Categories */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider text-stone-600">
              Enquiry Classification Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentConfig.enquiryCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-amber-900 font-medium"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEnquiryCat(cat)}
                    className="text-amber-700 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newEnquiryCat}
                onChange={(e) => setNewEnquiryCat(e.target.value)}
                placeholder="Add new enquiry category..."
                className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleAddEnquiryCat}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Complaint Categories */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider text-stone-600">
              Complaint / Grievance Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentConfig.complaintCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs text-rose-900 font-medium"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveComplaintCat(cat)}
                    className="text-rose-700 hover:text-rose-900 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newComplaintCat}
                onChange={(e) => setNewComplaintCat(e.target.value)}
                placeholder="Add new complaint category..."
                className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleAddComplaintCat}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Request Types */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider text-stone-600">
              Client Request Types
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentConfig.clientRequestTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-900 font-medium"
                >
                  <span>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequestType(type)}
                    className="text-blue-700 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newRequestType}
                onChange={(e) => setNewRequestType(e.target.value)}
                placeholder="Add new request type..."
                className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleAddRequestType}
                className="rounded-lg bg-[#0B63E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0256D0] cursor-pointer flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center space-x-3">
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
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
