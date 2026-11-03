import { ChambersSettings, ChambersCustomizationSettings, PdfTemplateConfig } from '../types';
import { fetchDbSettings, saveDbSettings } from '../services/chambersDbClient';

export const DEFAULT_PDF_TEMPLATES: PdfTemplateConfig[] = [
  // Invoices
  {
    id: 'tpl-inv-standard',
    name: 'Standard Template',
    category: 'invoices',
    isDefault: true,
    accentColor: '#0098db',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: true,
    showSignatureBlock: false,
    status: 'active',
  },
  {
    id: 'tpl-inv-tax',
    name: 'Tax Invoice',
    category: 'invoices',
    isDefault: false,
    accentColor: '#0284c7',
    fontFamily: 'helvetica',
    headerStyle: 'tax-invoice',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Authorized Signatory & KRA E-TIMS Officer',
    status: 'active',
  },
  {
    id: 'tpl-inv-paid',
    name: 'Paid Invoice',
    category: 'invoices',
    isDefault: false,
    accentColor: '#059669',
    fontFamily: 'helvetica',
    headerStyle: 'paid-invoice',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: true,
    showSignatureBlock: false,
    status: 'active',
  },
  {
    id: 'tpl-inv-modern',
    name: 'Modern Minimalist',
    category: 'invoices',
    isDefault: false,
    accentColor: '#1e293b',
    fontFamily: 'helvetica',
    headerStyle: 'modern-minimal',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: false,
    showDiscountColumn: false,
    showWatermarkWhenPaid: false,
    showSignatureBlock: false,
    status: 'active',
  },
  {
    id: 'tpl-inv-classic',
    name: 'Classic Chambers',
    category: 'invoices',
    isDefault: false,
    accentColor: '#1e3a8a',
    fontFamily: 'times',
    headerStyle: 'classic-law',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Advocate of the High Court of Kenya',
    status: 'active',
  },

  // Quotes
  {
    id: 'tpl-qt-standard',
    name: 'Standard Fee Quote',
    category: 'quotes',
    isDefault: true,
    accentColor: '#0098db',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Instructing Advocate / Partner',
    status: 'active',
  },
  {
    id: 'tpl-qt-formal',
    name: 'Formal Engagement Proposal',
    category: 'quotes',
    isDefault: false,
    accentColor: '#1e3a8a',
    fontFamily: 'times',
    headerStyle: 'classic-law',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Managing Partner, Muthoni Ahago Advocates',
    status: 'active',
  },

  // Sales Receipts
  {
    id: 'tpl-sr-standard',
    name: 'Standard Sales Receipt',
    category: 'sales-receipts',
    isDefault: true,
    accentColor: '#059669',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: true,
    showSignatureBlock: false,
    status: 'active',
  },

  // Credit Notes
  {
    id: 'tpl-cn-standard',
    name: 'Standard Credit Note',
    category: 'credit-notes',
    isDefault: true,
    accentColor: '#dc2626',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Accounts & Billing Department',
    status: 'active',
  },

  // Payment Receipts
  {
    id: 'tpl-rcp-standard',
    name: 'Official Chambers Receipt',
    category: 'payment-receipts',
    isDefault: true,
    accentColor: '#059669',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: false,
    showDiscountColumn: false,
    showWatermarkWhenPaid: true,
    showSignatureBlock: true,
    signatureLabel: 'Chambers Finance Cashier / Advocate',
    status: 'active',
  },
  {
    id: 'tpl-rcp-trust',
    name: 'Client Trust Account Receipt',
    category: 'payment-receipts',
    isDefault: false,
    accentColor: '#0098db',
    fontFamily: 'helvetica',
    headerStyle: 'tax-invoice',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: false,
    showDiscountColumn: false,
    showWatermarkWhenPaid: true,
    showSignatureBlock: true,
    signatureLabel: 'Trust Account Trustee Advocate',
    status: 'active',
  },

  // Customer Statements
  {
    id: 'tpl-cs-standard',
    name: 'Client Matter Ledger Statement',
    category: 'customer-statements',
    isDefault: true,
    accentColor: '#0098db',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: true,
    showTaxColumn: true,
    showDiscountColumn: true,
    showWatermarkWhenPaid: false,
    showSignatureBlock: false,
    status: 'active',
  },

  // Expenses
  {
    id: 'tpl-exp-standard',
    name: 'Disbursements & Expenses Voucher',
    category: 'expenses',
    isDefault: true,
    accentColor: '#475569',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: false,
    showTermsAndConditions: false,
    showTaxColumn: true,
    showDiscountColumn: false,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Authorizing Advocate / Clerk',
    status: 'active',
  },

  // Vendor Statements
  {
    id: 'tpl-vs-standard',
    name: 'Vendor & Service Provider Statement',
    category: 'vendor-statements',
    isDefault: true,
    accentColor: '#0098db',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: true,
    showTermsAndConditions: false,
    showTaxColumn: true,
    showDiscountColumn: false,
    showWatermarkWhenPaid: false,
    showSignatureBlock: false,
    status: 'active',
  },

  // Journals
  {
    id: 'tpl-jn-standard',
    name: 'General Accounting Journal Entry',
    category: 'journals',
    isDefault: true,
    accentColor: '#334155',
    fontFamily: 'helvetica',
    headerStyle: 'standard',
    showBankDetails: false,
    showTermsAndConditions: false,
    showTaxColumn: false,
    showDiscountColumn: false,
    showWatermarkWhenPaid: false,
    showSignatureBlock: true,
    signatureLabel: 'Certified Public Accountant / Partner',
    status: 'active',
  },
];

export const DEFAULT_CUSTOMIZATION_SETTINGS: ChambersCustomizationSettings = {
  selectedTemplates: {
    invoices: 'tpl-inv-standard',
    quotes: 'tpl-qt-standard',
    'sales-receipts': 'tpl-sr-standard',
    'credit-notes': 'tpl-cn-standard',
    'payment-receipts': 'tpl-rcp-standard',
    'customer-statements': 'tpl-cs-standard',
    expenses: 'tpl-exp-standard',
    'vendor-statements': 'tpl-vs-standard',
    journals: 'tpl-jn-standard',
  },
  customTemplates: DEFAULT_PDF_TEMPLATES,
  transactionSeries: {
    invoices: {
      prefix: 'INV-',
      nextNumber: 1,
      padding: 6,
    },
    quotes: {
      prefix: 'QT-',
      nextNumber: 101,
      padding: 4,
    },
    receipts: {
      prefix: 'MAA-RCP-',
      nextNumber: 1,
      padding: 4,
    },
    creditNotes: {
      prefix: 'CN-',
      nextNumber: 1,
      padding: 4,
    },
  },
  emailNotifications: {
    invoiceIssued: {
      name: 'Fee Note Issued Notification',
      subject: 'Fee Note #{{invoice_number}} from Muthoni Ahago Advocates',
      body: 'Dear {{client_name}},\n\nPlease find attached Fee Note #{{invoice_number}} amounting to KES {{amount}} for professional legal services regarding {{matter_title}}.\n\nKindly note that payment is due by {{due_date}}.\n\nBank Payment Details:\nBank: {{bank_name}}\nAccount Name: {{account_name}}\nAccount Number: {{account_number}}\n\nThank you for choosing Muthoni Ahago Advocates.\n\nKind regards,\nBilling & Finance Department\nMuthoni Ahago Advocates',
      ccBillingEmail: true,
      active: true,
    },
    paymentReceipt: {
      name: 'Payment Receipt Acknowledgment',
      subject: 'Official Receipt #{{receipt_number}} for Fee Note #{{invoice_number}}',
      body: 'Dear {{client_name}},\n\nWe acknowledge with thanks the receipt of your payment of KES {{amount}} via {{payment_method}} on {{payment_date}} against Fee Note #{{invoice_number}}.\n\nYour official Chambers receipt is attached for your accounting records.\n\nWarm regards,\nFinance & Accounts\nMuthoni Ahago Advocates',
      ccBillingEmail: true,
      active: true,
    },
    quoteProposal: {
      name: 'Fee Quote & Engagement Proposal',
      subject: 'Legal Representation Quote #{{quote_number}} - {{matter_title}}',
      body: 'Dear {{client_name}},\n\nPlease review our formal quotation #{{quote_number}} for legal services in respect of {{matter_title}}.\n\nTotal Estimated Fees: KES {{amount}}\n\nShould you have any questions or wish to formalize instructions, please do not hesitate to contact our chambers.\n\nYours faithfully,\nMuthoni Ahago Advocates',
      ccBillingEmail: true,
      active: true,
    },
  },
};

export const DEFAULT_CHAMBERS_SETTINGS: ChambersSettings = {
  firmName: 'Muthoni Ahago Advocates',
  tagline: 'Exceptional Legal Insight',
  logoUrl: null,
  lskFirmRegNo: 'LSK/FIRM/2026/0411',
  kraPin: 'P0512839401Z',
  physicalAddress: '1st Floor, The Triple Two Address, Along the Eastern Bypass, Ruiru',
  postalAddress: 'P.O. Box 40512-00100 Ruiru, Kenya',
  phone: '(+254) 726 113 664',
  email: 'info@muthoniahagolaw.co.ke',
  billingEmail: 'info@muthoniahagolaw.co.ke',
  website: 'www.muthoniahagolaw.co.ke',
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
  customization: DEFAULT_CUSTOMIZATION_SETTINGS,
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
        customization: {
          ...DEFAULT_CUSTOMIZATION_SETTINGS,
          ...(parsed.customization || {}),
          selectedTemplates: {
            ...DEFAULT_CUSTOMIZATION_SETTINGS.selectedTemplates,
            ...(parsed.customization?.selectedTemplates || {}),
          },
          customTemplates: Array.isArray(parsed.customization?.customTemplates) && parsed.customization.customTemplates.length > 0
            ? parsed.customization.customTemplates
            : DEFAULT_CUSTOMIZATION_SETTINGS.customTemplates,
          transactionSeries: {
            ...DEFAULT_CUSTOMIZATION_SETTINGS.transactionSeries,
            ...(parsed.customization?.transactionSeries || {}),
          },
          emailNotifications: {
            ...DEFAULT_CUSTOMIZATION_SETTINGS.emailNotifications,
            ...(parsed.customization?.emailNotifications || {}),
          },
        },
      };
    }
  } catch (err) {
    console.error('Failed to load chambers settings from storage:', err);
  }
  return DEFAULT_CHAMBERS_SETTINGS;
};

export const saveChambersSettingsCache = (settings: ChambersSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent('chambers-settings-updated', { detail: settings })
    );
  } catch (err) {
    console.error('Failed to save chambers settings to cache:', err);
  }
};

export const saveChambersSettings = (settings: ChambersSettings): ChambersSettings => {
  try {
    const updatedSettings = {
      ...settings,
      lastSaved: new Date().toISOString(),
    };
    saveChambersSettingsCache(updatedSettings);

    // Asynchronously synchronize with central database
    saveDbSettings(updatedSettings).catch((err) => {
      console.warn('[Settings Storage] Server background sync failed:', err);
    });

    return updatedSettings;
  } catch (err) {
    console.error('Failed to save chambers settings to storage:', err);
    throw err;
  }
};

export const saveChambersSettingsAsync = async (settings: ChambersSettings): Promise<ChambersSettings> => {
  const updatedSettings = {
    ...settings,
    lastSaved: new Date().toISOString(),
  };
  saveChambersSettingsCache(updatedSettings);

  try {
    const serverResult = await saveDbSettings(updatedSettings);
    if (serverResult && typeof serverResult === 'object') {
      const merged: ChambersSettings = {
        ...updatedSettings,
        ...serverResult,
        bankDetails: {
          ...updatedSettings.bankDetails,
          ...(serverResult.bankDetails || {}),
        },
      };
      saveChambersSettingsCache(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[Settings Storage] Remote save warning, stored locally:', err);
  }

  return updatedSettings;
};

export const fetchAndHydrateChambersSettings = async (): Promise<ChambersSettings> => {
  try {
    const serverSettings = await fetchDbSettings();
    if (serverSettings && typeof serverSettings === 'object' && Object.keys(serverSettings).length > 0) {
      const current = loadChambersSettings();
      const merged: ChambersSettings = {
        ...DEFAULT_CHAMBERS_SETTINGS,
        ...current,
        ...serverSettings,
        bankDetails: {
          ...DEFAULT_CHAMBERS_SETTINGS.bankDetails,
          ...current.bankDetails,
          ...(serverSettings.bankDetails || {}),
        },
        integrations: {
          ...DEFAULT_CHAMBERS_SETTINGS.integrations,
          ...current.integrations,
          ...(serverSettings.integrations || {}),
        },
        compliance: {
          ...DEFAULT_CHAMBERS_SETTINGS.compliance,
          ...current.compliance,
          ...(serverSettings.compliance || {}),
        },
        displayPreferences: {
          ...DEFAULT_CHAMBERS_SETTINGS.displayPreferences,
          ...current.displayPreferences,
          ...(serverSettings.displayPreferences || {}),
        },
      };
      saveChambersSettingsCache(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[Settings Storage] Fetching remote settings failed:', err);
  }
  return loadChambersSettings();
};

export const resetChambersSettings = (): ChambersSettings => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('chambers-settings-updated', { detail: DEFAULT_CHAMBERS_SETTINGS })
    );
    saveDbSettings(DEFAULT_CHAMBERS_SETTINGS).catch((err) => {
      console.warn('[Settings Storage] Reset central sync warning:', err);
    });
  } catch (err) {
    console.error('Failed to reset chambers settings:', err);
  }
  return DEFAULT_CHAMBERS_SETTINGS;
};
