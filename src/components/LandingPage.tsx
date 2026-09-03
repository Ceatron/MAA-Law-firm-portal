import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Send,
  Copy,
  Check,
  ArrowRight,
  SlidersHorizontal,
  PenLine,
} from 'lucide-react';
import { Advocate } from '../types';
import { loadChambersSettings } from '../utils/settingsStorage';
import {
  loadStaffRoster,
  requestPasswordResetByEmail,
  updateStaffPasswordDirectly,
  PasswordResetEmailPayload,
} from '../utils/staffStorage';
import { recordLoginAttempt } from '../utils/authAuditStorage';

interface LandingPageProps {
  onLogin: (advocate: Advocate) => void;
  advocates?: Advocate[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, advocates: initialAdvocates }) => {
  const settings = loadChambersSettings();
  
  // Use latest live staff roster from storage (ensures password updates and canonical emails are instant)
  const [staffList, setStaffList] = useState<Advocate[]>(() => {
    const loaded = loadStaffRoster();
    return loaded && loaded.length > 0 ? loaded : initialAdvocates || [];
  });

  // Views: 'credentials' | 'reset_password'
  const [viewMode, setViewMode] = useState<'credentials' | 'reset_password'>('credentials');

  // Sign In Form State
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password Reset Form State (Email-Only Workflow)
  const [resetEmail, setResetEmail] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [dispatchedResetPayload, setDispatchedResetPayload] = useState<PasswordResetEmailPayload | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Retain vs Change Choice State
  const [resetChoiceMode, setResetChoiceMode] = useState<'overview' | 'customize'>('overview');
  const [customNewPassword, setCustomNewPassword] = useState('');
  const [customConfirmPassword, setCustomConfirmPassword] = useState('');
  const [showCustomNewPassword, setShowCustomNewPassword] = useState(false);
  const [showCustomConfirmPassword, setShowCustomConfirmPassword] = useState(false);
  const [customPasswordError, setCustomPasswordError] = useState<string | null>(null);
  const [isCustomSaving, setIsCustomSaving] = useState(false);

  // Helper for password strength calculation
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

  const customStrength = getStrength(customNewPassword);

  // Find advocate by identifier in staffList
  const findAdvocate = (identifier: string): Advocate | undefined => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return undefined;

    const isDeveloperKeyword = ['dev', 'admin', 'developer', 'sysadmin', 'eahago', 'eric'].includes(clean);

    return staffList.find(
      (a) =>
        (isDeveloperKeyword && (a.id === 'dev-admin' || a.isDeveloper || a.isSystemAdmin)) ||
        a.email.toLowerCase() === clean ||
        a.name.toLowerCase() === clean ||
        a.email.toLowerCase().startsWith(clean) ||
        a.id.toLowerCase() === clean ||
        (clean === 'eahago@gmail.com' && (a.id === 'dev-admin' || a.email === 'eahago@gmail.com'))
    );
  };

  // Handle Login submission with STRICT password enforcement
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const identifier = usernameOrEmail.trim();
    if (!identifier) {
      setErrorMessage('Please enter your work email or username.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required. Please enter your password to sign in.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const matched = findAdvocate(identifier);

      if (!matched) {
        // Record failed login audit log (unregistered user)
        recordLoginAttempt({
          identifier,
          advocate: null,
          status: 'FAILED',
          failureReason: `Account not found in roster for identifier "${identifier}"`,
          loginMethod: 'Password Credentials',
        });
        setErrorMessage(`No user account found matching "${identifier}". Please verify your email or username.`);
        return;
      }

      // Check password strictly against advocate's stored password
      const expectedPassword = matched.password || 'password123';
      if (password.trim() !== expectedPassword.trim()) {
        // Record failed login audit log (bad password)
        recordLoginAttempt({
          identifier,
          advocate: matched,
          status: 'FAILED',
          failureReason: 'Invalid password provided',
          loginMethod: 'Password Credentials',
        });
        setErrorMessage(`Invalid password for ${matched.name}. Please try again or use the Password Reset option below.`);
        return;
      }

      // Record successful login audit log
      recordLoginAttempt({
        identifier,
        advocate: matched,
        status: 'SUCCESS',
        loginMethod: 'Password Credentials',
      });

      // Successful password verification
      onLogin(matched);
    }, 350);
  };

  // Handle Password Reset submission: user enters email -> new password is created and sent to their email
  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setDispatchedResetPayload(null);

    const email = resetEmail.trim().toLowerCase();
    if (!email) {
      setResetErrorMessage('Please enter your registered work email address.');
      return;
    }

    setIsResetting(true);

    setTimeout(() => {
      setIsResetting(false);
      const result = requestPasswordResetByEmail(email);

      if (!result.success || !result.staff || !result.emailPayload) {
        recordLoginAttempt({
          identifier: email,
          advocate: null,
          status: 'FAILED',
          failureReason: `Password reset request failed: ${result.message || 'Email not found in registered staff roster'}`,
          loginMethod: 'Password Reset',
        });
        setResetErrorMessage(result.message || 'Unable to find any active staff account with this email address.');
        return;
      }

      // Record successful password reset audit entry
      recordLoginAttempt({
        identifier: email,
        advocate: result.staff,
        status: 'SUCCESS',
        loginMethod: 'Password Reset',
      });

      // Refresh staff roster state
      const updatedRoster = loadStaffRoster();
      setStaffList(updatedRoster);

      setDispatchedResetPayload(result.emailPayload);
    }, 450);
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleProceedToSignInWithReset = () => {
    if (dispatchedResetPayload) {
      const email = dispatchedResetPayload.recipientEmail;
      const matched = findAdvocate(email);
      if (matched) {
        // Record successful login audit
        recordLoginAttempt({
          identifier: email,
          advocate: matched,
          status: 'SUCCESS',
          loginMethod: 'Password Reset',
          failureReason: 'Retained dispatched secure password for session login',
        });
        onLogin(matched);
        return;
      }
      setUsernameOrEmail(dispatchedResetPayload.recipientEmail);
      setPassword(dispatchedResetPayload.newPassword);
      setSuccessMessage(
        `Retained password for ${dispatchedResetPayload.recipientEmail}. Signed in successfully.`
      );
    }
    setErrorMessage(null);
    setViewMode('credentials');
    setDispatchedResetPayload(null);
  };

  const handleCustomPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomPasswordError(null);

    if (!dispatchedResetPayload) return;

    if (!customNewPassword || customNewPassword.trim().length < 6) {
      setCustomPasswordError('Password must be at least 6 characters in length.');
      return;
    }

    if (customNewPassword !== customConfirmPassword) {
      setCustomPasswordError('New password and confirmation password do not match.');
      return;
    }

    setIsCustomSaving(true);

    setTimeout(() => {
      setIsCustomSaving(false);
      const email = dispatchedResetPayload.recipientEmail;
      const res = updateStaffPasswordDirectly(email, customNewPassword.trim());

      if (res.success && res.staff) {
        // Record audit
        recordLoginAttempt({
          identifier: email,
          advocate: res.staff,
          status: 'SUCCESS',
          loginMethod: 'Password Reset',
          failureReason: 'User customized dispatched password upon email reset',
        });

        const updatedRoster = loadStaffRoster();
        setStaffList(updatedRoster);

        // Directly authenticate user with their newly customized password
        onLogin(res.staff);
      } else {
        setCustomPasswordError(res.message || 'Failed to update custom password. Please try again.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F5F0] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-amber-200 selection:text-slate-900">
      {/* Centered Auth Card Container */}
      <div className="w-full max-w-[500px] bg-transparent py-4 px-2 sm:px-4">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-[15px] sm:text-base font-semibold text-[#0B2540] tracking-normal">
              {settings.firmName || 'Muthoni Ahago Advocates'}
            </h2>
            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest text-[#8A98A8] uppercase mt-0.5">
              LEGAL PRACTICE MANAGEMENT PORTAL
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {viewMode !== 'credentials' && (
              <button
                type="button"
                id="btn-nav-signin"
                onClick={() => {
                  setViewMode('credentials');
                  setErrorMessage(null);
                }}
                className="text-xs font-medium text-[#2C4560] bg-[#EAEFF4]/90 hover:bg-[#DEE6ED] border border-[#D3DEE8] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full border-b border-[#E5E0D5] mb-6 sm:mb-8" />

        {/* Main Content Area */}
        <div>

          {/* ========================================================================= */}
          {/* VIEW 1: CREDENTIALS SIGN IN (PASSWORD REQUIRED) */}
          {/* ========================================================================= */}
          {viewMode === 'credentials' && (
            <div>
              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-[34px] font-bold text-[#0B2540] tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-[#5B6D80] mt-1.5 leading-relaxed">
                  Sign in with your work email and password to access chambers workspace.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {/* Username / Email Input */}
                <div>
                  <label className="block text-xs text-[#526377] font-medium mb-1.5">
                    Work Email or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-login-email"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="Enter your official email"
                      required
                      className="w-full rounded-2xl bg-[#FCFBFA] px-4 py-3 text-xs sm:text-sm text-[#0B2540] placeholder:text-[#9AA8B6] border border-[#DBD5C9] shadow-2xs focus:bg-white focus:border-[#0B2540] focus:ring-1 focus:ring-[#0B2540] focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Password Input (Strictly Required) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-[#526377] font-medium">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      id="btn-forgot-password"
                      onClick={() => {
                        setResetEmail('');
                        setResetErrorMessage(null);
                        setDispatchedResetPayload(null);
                        setViewMode('reset_password');
                      }}
                      className="text-xs font-semibold text-[#0070ba] hover:text-[#005a96] hover:underline cursor-pointer transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-2xl bg-[#FCFBFA] px-4 py-3 pr-11 text-xs sm:text-sm text-[#0B2540] placeholder:text-[#9AA8B6] border border-[#DBD5C9] shadow-2xs focus:bg-white focus:border-[#0B2540] focus:ring-1 focus:ring-[#0B2540] focus:outline-none transition"
                    />
                    <button
                      type="button"
                      id="btn-toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#95A5B5] hover:text-[#526377] transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoading}
                  className="w-full mt-2 rounded-xl bg-[#0B2840] hover:bg-[#071E30] active:bg-[#051624] text-white font-semibold py-3.5 px-6 text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating credentials...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Sign In</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: PASSWORD RESET WORKFLOW (EMAIL-ONLY) */}
          {/* ========================================================================= */}
          {viewMode === 'reset_password' && (
            <div>
              {!dispatchedResetPayload ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-semibold w-fit mb-3">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Account Security</span>
                    </div>
                    <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B2540] tracking-tight">
                      Reset Portal Password
                    </h1>
                    <p className="text-xs sm:text-sm text-[#5B6D80] mt-1.5 leading-relaxed">
                      Enter your registered work email address. A new secure login password will be generated and dispatched to your email inbox.
                    </p>
                  </div>

                  {/* Reset Error Alert */}
                  {resetErrorMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{resetErrorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                    {/* Work Email Address Only */}
                    <div>
                      <label className="block text-xs text-[#526377] font-medium mb-1.5">
                        Registered Work Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="input-reset-email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="e.g. advocate@muthoniahagolaw.co.ke"
                          required
                          autoFocus
                          className="w-full rounded-2xl bg-[#FCFBFA] px-4 py-3 text-xs sm:text-sm text-[#0B2540] placeholder:text-[#9AA8B6] border border-[#DBD5C9] shadow-2xs focus:bg-white focus:border-[#0B2540] focus:ring-1 focus:ring-[#0B2540] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2.5">
                      <button
                        type="submit"
                        id="btn-submit-password-reset"
                        disabled={isResetting}
                        className="w-full rounded-xl bg-[#0B2840] hover:bg-[#071E30] active:bg-[#051624] text-white font-semibold py-3.5 px-6 text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isResetting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Generating & Sending Password...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            <span>Send New Password to Email</span>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        id="btn-cancel-reset"
                        onClick={() => {
                          setViewMode('credentials');
                          setResetErrorMessage(null);
                        }}
                        className="w-full py-2.5 text-xs font-semibold text-[#526377] hover:text-[#0B2540] transition cursor-pointer"
                      >
                        Cancel and return to Sign In
                      </button>
                    </div>
                  </form>
                </>
              ) : resetChoiceMode === 'customize' ? (
                /* Customize Password Form View */
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center pb-1">
                    <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-2.5">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0B2540]">
                      Set Your Custom Password
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5B6D80] mt-1 leading-relaxed">
                      Replace the temporary password for{' '}
                      <span className="font-semibold text-slate-900">{dispatchedResetPayload.recipientEmail}</span>{' '}
                      with your own custom password.
                    </p>
                  </div>

                  {customPasswordError && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200 animate-fadeIn">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{customPasswordError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCustomPasswordSubmit} className="space-y-3.5 pt-1">
                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        New Custom Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCustomNewPassword ? 'text' : 'password'}
                          id="input-custom-new-password"
                          value={customNewPassword}
                          onChange={(e) => setCustomNewPassword(e.target.value)}
                          placeholder="Enter new password (min. 6 characters)"
                          required
                          minLength={6}
                          autoFocus
                          className="w-full rounded-xl border border-stone-300 bg-[#FCFBFA] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#0B2840] focus:ring-2 focus:ring-blue-100 focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomNewPassword(!showCustomNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                        >
                          {showCustomNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Strength Indicator */}
                      {customNewPassword && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-full flex-1 transition-all duration-300 ${
                                  step <= customStrength.score ? customStrength.color : 'bg-stone-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-stone-600 w-12 text-right">
                            {customStrength.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCustomConfirmPassword ? 'text' : 'password'}
                          id="input-custom-confirm-password"
                          value={customConfirmPassword}
                          onChange={(e) => setCustomConfirmPassword(e.target.value)}
                          placeholder="Re-enter your new password"
                          required
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none pr-10 ${
                            customConfirmPassword && customConfirmPassword !== customNewPassword
                              ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
                              : 'border-stone-300 bg-[#FCFBFA] focus:border-[#0B2840] focus:ring-2 focus:ring-blue-100'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomConfirmPassword(!showCustomConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                        >
                          {showCustomConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {customConfirmPassword && customConfirmPassword === customNewPassword && (
                        <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        id="btn-save-custom-password-signin"
                        disabled={isCustomSaving}
                        className="w-full rounded-xl bg-[#0B2840] hover:bg-[#071E30] active:bg-[#051624] text-white font-semibold py-3.5 px-6 text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isCustomSaving ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving & Signing In...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Save Custom Password & Sign In</span>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        id="btn-cancel-custom-password"
                        onClick={() => {
                          setResetChoiceMode('overview');
                          setCustomPasswordError(null);
                        }}
                        className="w-full py-2.5 text-xs font-semibold text-[#526377] hover:text-[#0B2540] transition cursor-pointer"
                      >
                        &larr; Keep sent password instead
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Success Dispatched Card View with Retain vs Change Options */
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0B2540]">
                      New Password Dispatched
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5B6D80] mt-1 leading-relaxed">
                      A new secure login password has been generated and sent to{' '}
                      <span className="font-semibold text-slate-900">{dispatchedResetPayload.recipientEmail}</span>.
                    </p>
                  </div>

                  {/* Dispatched Email Preview Card */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dispatched Email Summary</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-mono">
                        {dispatchedResetPayload.sentAt}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">To: </span>
                        {dispatchedResetPayload.recipientName} &lt;{dispatchedResetPayload.recipientEmail}&gt;
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Subject: </span>
                        {dispatchedResetPayload.subject}
                      </div>
                    </div>

                    {/* New Password Display Box */}
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Your New Password
                        </div>
                        <div className="font-mono text-sm sm:text-base font-bold text-[#0B2540] tracking-wide">
                          {dispatchedResetPayload.newPassword}
                        </div>
                      </div>
                      <button
                        type="button"
                        id="btn-copy-dispatched-password"
                        onClick={() => handleCopyPassword(dispatchedResetPayload.newPassword)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Copy Password</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-normal">
                      Please check your email inbox for these credentials. You can retain this password or change it to your own custom password.
                    </p>
                  </div>

                  {/* Retain vs Change Choices */}
                  <div className="pt-2 space-y-2.5">
                    {/* Primary Option: Retain this password */}
                    <button
                      type="button"
                      id="btn-retain-password-signin"
                      onClick={handleProceedToSignInWithReset}
                      className="w-full rounded-xl bg-[#0B2840] hover:bg-[#071E30] active:bg-[#051624] text-white font-semibold py-3.5 px-6 text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Retain this Password & Sign In</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </button>

                    {/* Secondary Option: Change to custom password */}
                    <button
                      type="button"
                      id="btn-change-custom-password"
                      onClick={() => {
                        setResetChoiceMode('customize');
                        setCustomNewPassword('');
                        setCustomConfirmPassword('');
                        setCustomPasswordError(null);
                      }}
                      className="w-full rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 font-semibold py-3 px-5 text-xs sm:text-sm shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Change to My Own Password</span>
                    </button>

                    <button
                      type="button"
                      id="btn-reset-another"
                      onClick={() => {
                        setDispatchedResetPayload(null);
                        setResetEmail('');
                        setResetErrorMessage(null);
                        setResetChoiceMode('overview');
                      }}
                      className="w-full py-2 text-xs font-semibold text-[#526377] hover:text-[#0B2540] transition cursor-pointer"
                    >
                      Send reset to a different email
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-[#8C9DAE] flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Encrypted Law Practice Portal &bull; Muthoni Ahago Advocates</span>
          </p>
        </div>

      </div>
    </div>
  );
};
