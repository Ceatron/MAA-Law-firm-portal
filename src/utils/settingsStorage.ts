import { ChambersSettings } from '../types';

export const DEFAULT_CHAMBERS_SETTINGS: ChambersSettings = {
  firmName: 'Muthoni Ahago Advocates',
  tagline: 'Exceptional Legal Insight',
  logoUrl: null,
  lskFirmRegNo: 'LSK/FIRM/2026/0411',
  kraPin: 'P0512839401Z',
  physicalAddress: '1st Floor, The Triple Two Address, Along the Eastern Bypass, Ruiru',
  postalAddress: 'P.O. Box 40512-00100 Ruiru, Kenya',
  phone: '+254 (0)20 271 9900',
  email: 'info@muthoniahago.co.ke',
  billingEmail: 'billing@muthoniahago.co.ke',
  website: 'www.muthoniahago.co.ke',
  managingPartner: 'Adv. Costa Kimathi',
  bankDetails: {
    bankName: 'KCB Bank Kenya',
    accountName: 'Muthoni Ahago Advocates Client Trust A/C',
    accountNumber: '1289405821',
    branch: 'Ruiru Branch',
    swiftCode: 'KCBLKENX',
    paybillNumber: '522522',
  },
  integrations: {
    ctsAutoSync: true,
    ctsApiKey: 'CTS_SEC_AUTH_2026_MA_RUIRU',
    ardhiSasaSync: true,
    brsAutoSearch: true,
    syncFrequencyMinutes: 30,
  },
  compliance: {
    lskLicenseActive: true,
    rollRef: 'P.105/18420/26',
    auditLoggingEnforced: true,
    amlThresholdKES: 1000000,
    requireConflictCheckApproval: true,
  },
  displayPreferences: {
    defaultCurrency: 'KES',
    dateFormat: 'DD/MM/YYYY',
  },
  lastSaved: new Date().toISOString(),
};

const STORAGE_KEY = 'muthoni_ahago_chambers_settings_v1';

export const loadChambersSettings = (): ChambersSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CHAMBERS_SETTINGS,
        ...parsed,
        bankDetails: {
          ...DEFAULT_CHAMBERS_SETTINGS.bankDetails,
          ...(parsed.bankDetails || {}),
        },
        integrations: {
          ...DEFAULT_CHAMBERS_SETTINGS.integrations,
          ...(parsed.integrations || {}),
        },
        compliance: {
          ...DEFAULT_CHAMBERS_SETTINGS.compliance,
          ...(parsed.compliance || {}),
        },
        displayPreferences: {
          ...DEFAULT_CHAMBERS_SETTINGS.displayPreferences,
          ...(parsed.displayPreferences || {}),
        },
      };
    }
  } catch (err) {
    console.error('Failed to load chambers settings from storage:', err);
  }
  return DEFAULT_CHAMBERS_SETTINGS;
};

export const saveChambersSettings = (settings: ChambersSettings): void => {
  try {
    const updatedSettings = {
      ...settings,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    window.dispatchEvent(
      new CustomEvent('chambers-settings-updated', { detail: updatedSettings })
    );
  } catch (err) {
    console.error('Failed to save chambers settings to storage:', err);
    throw err;
  }
};

export const resetChambersSettings = (): ChambersSettings => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('chambers-settings-updated', { detail: DEFAULT_CHAMBERS_SETTINGS })
    );
  } catch (err) {
    console.error('Failed to reset chambers settings:', err);
  }
  return DEFAULT_CHAMBERS_SETTINGS;
};
