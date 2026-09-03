import React, { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import { loadChambersSettings } from '../utils/settingsStorage';

interface CompanyLogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  darkBg?: boolean;
  className?: string;
  customLogoUrl?: string | null;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  variant = 'full',
  size = 'md',
  darkBg = false,
  className = '',
  customLogoUrl,
}) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    if (customLogoUrl !== undefined) return customLogoUrl;
    return loadChambersSettings().logoUrl;
  });
  const [firmName, setFirmName] = useState<string>(() => loadChambersSettings().firmName || 'Muthoni Ahago');

  useEffect(() => {
    if (customLogoUrl !== undefined) {
      setLogoSrc(customLogoUrl);
      return;
    }

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setLogoSrc(customEvent.detail.logoUrl || null);
        if (customEvent.detail.firmName) setFirmName(customEvent.detail.firmName);
      }
    };

    window.addEventListener('chambers-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('chambers-settings-updated', handleSettingsUpdate);
    };
  }, [customLogoUrl]);

  const displayName = firmName.replace(/\s+Advocates$/i, '').trim() || 'Muthoni Ahago';

  // If a custom uploaded logo image is available
  if (logoSrc) {
    if (variant === 'icon') {
      return (
        <div className={`inline-flex items-center justify-center ${className}`}>
          <img
            src={logoSrc}
            alt={firmName}
            className="h-9 w-9 object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    if (variant === 'horizontal') {
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <img
            src={logoSrc}
            alt={firmName}
            className="h-10 w-10 shrink-0 object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <p className={`font-heading text-sm font-semibold tracking-wide truncate ${darkBg ? 'text-white' : 'text-slate-900'}`}>
              {displayName}
            </p>
            <p className="text-[10px] tracking-[0.23em] text-slate-400 font-semibold">
              Advocates
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <img
          src={logoSrc}
          alt={firmName}
          className="h-14 w-14 object-contain rounded-2xl mb-2"
          referrerPolicy="no-referrer"
        />
        <h2 className={`font-heading font-bold tracking-wide text-base ${darkBg ? 'text-white' : 'text-slate-900'}`}>
          {displayName}
        </h2>
        <p className="text-[10px] tracking-[0.23em] text-slate-400 font-semibold mt-0.5">
          Advocates
        </p>
      </div>
    );
  }

  // Default Emblem: Amber Icon Container with Scale
  const ScaleIconContainer = (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20 transition-transform group-hover:scale-105">
      <Scale className="h-5 w-5" strokeWidth={2.2} />
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{ScaleIconContainer}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {ScaleIconContainer}
        <div className="min-w-0">
          <p className={`font-heading text-sm font-semibold tracking-wide truncate ${darkBg ? 'text-white' : 'text-slate-900'}`}>
            {displayName}
          </p>
          <p className="text-[10px] tracking-[0.23em] text-slate-400 font-semibold">
            Advocates
          </p>
        </div>
      </div>
    );
  }

  // Full stacked variant
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20 mb-2.5">
        <Scale className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <h2 className={`font-heading font-bold tracking-wide text-base ${darkBg ? 'text-white' : 'text-slate-900'}`}>
        {displayName}
      </h2>
      <p className="text-[10px] tracking-[0.23em] text-slate-400 font-semibold mt-0.5">
        Advocates
      </p>
    </div>
  );
};

