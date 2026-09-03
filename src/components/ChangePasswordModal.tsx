import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Advocate } from '../types';
import { updateStaffPasswordDirectly, loadStaffRoster } from '../utils/staffStorage';
import { recordLoginAttempt } from '../utils/authAuditStorage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdvocate: Advocate;
  onPasswordUpdated?: (updatedAdvocate: Advocate) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentAdvocate,
  onPasswordUpdated,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-stone-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Fetch latest advocate record from roster
    const roster = loadStaffRoster();
    const fresh = roster.find(
      (a) => a.id === currentAdvocate.id || a.email.toLowerCase() === currentAdvocate.email.toLowerCase()
    );

    const actualCurrentPass = fresh?.password || currentAdvocate.password || 'password123';

    if (!currentPassword) {
      setErrorMessage('Please enter your current account password.');
      return;
    }

    if (currentPassword.trim() !== actualCurrentPass.trim()) {
      setErrorMessage('Current password is incorrect. Please verify and try again.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.trim() === actualCurrentPass.trim()) {
      setErrorMessage('New password must be different from your current password.');
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      const res = updateStaffPasswordDirectly(currentAdvocate.email, newPassword.trim());

      if (res.success && res.staff) {
        // Record audit
        recordLoginAttempt({
          identifier: currentAdvocate.email,
          advocate: res.staff,
          status: 'SUCCESS',
          loginMethod: 'Password Credentials',
          failureReason: 'Password changed by user in portal profile',
        });

        setSuccessMessage('Password changed successfully! Your new password is now active.');
        if (onPasswordUpdated) {
          onPasswordUpdated(res.staff);
        }

        setTimeout(() => {
          onClose();
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMessage(null);
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Failed to update password. Please try again.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Change Account Password</h3>
              <p className="text-xs text-stone-500">Update login credentials for your portal account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3 border border-stone-200">
          <img
            src={currentAdvocate.avatar}
            alt={currentAdvocate.name}
            className="h-10 w-10 rounded-lg object-cover ring-1 ring-stone-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-stone-900 truncate">{currentAdvocate.name}</p>
            <p className="text-[11px] text-stone-500 truncate">{currentAdvocate.email}</p>
            <p className="text-[10px] font-mono text-amber-800">{currentAdvocate.title}</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                id="input-change-current-pass"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                id="input-change-new-pass"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                required
                minLength={6}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength Bar */}
            {newPassword && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all duration-300 ${
                        step <= strength.score ? strength.color : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-stone-600 w-12 text-right">
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="input-change-confirm-pass"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none pr-10 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
                    : 'border-stone-300 bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword === newPassword && (
              <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-change-password"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Updating...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
