import React, { useState } from 'react';
import { Mail, Save, CheckCircle2, Copy, Send, Sparkles } from 'lucide-react';
import { ChambersSettings, EmailNotificationTemplate } from '../../types';

interface EmailNotificationManagerProps {
  settings: ChambersSettings;
  onUpdateSettings: (newSettings: ChambersSettings) => void;
  showToast: (msg: string) => void;
}

export const EmailNotificationManager: React.FC<EmailNotificationManagerProps> = ({
  settings,
  onUpdateSettings,
  showToast,
}) => {
  const currentNotifs = settings.customization?.emailNotifications || {
    invoiceIssued: {
      name: 'Fee Note Issued Notification',
      subject: 'Fee Note #{{invoice_number}} from Muthoni Ahago Advocates',
      body: 'Dear {{client_name}},\n\nPlease find attached Fee Note #{{invoice_number}} amounting to KES {{amount}} for professional legal services regarding {{matter_title}}.\n\nKindly note that payment is due by {{due_date}}.\n\nBank Payment Details:\nBank: {{bank_name}}\nAccount Name: {{account_name}}\nAccount Number: {{account_number}}\n\nThank you for choosing Muthoni Ahago Advocates.\n\nKind regards,\nBilling & Finance Department\nMuthoni Ahago Advocates',
      ccBillingEmail: true,
      active: true,
    },
    paymentReceived: {
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
  };

  const [activeTemplateKey, setActiveTemplateKey] = useState<'invoiceIssued' | 'paymentReceived' | 'quoteProposal'>('invoiceIssued');
  const [templates, setTemplates] = useState(currentNotifs);

  const activeTemplate: EmailNotificationTemplate = templates[activeTemplateKey];

  const handleUpdateActiveTemplate = (partial: Partial<EmailNotificationTemplate>) => {
    setTemplates((prev) => ({
      ...prev,
      [activeTemplateKey]: {
        ...prev[activeTemplateKey],
        ...partial,
      },
    }));
  };

  const handleSave = () => {
    const updatedSettings: ChambersSettings = {
      ...settings,
      customization: {
        ...(settings.customization || ({} as any)),
        selectedTemplates: settings.customization?.selectedTemplates || {},
        customTemplates: settings.customization?.customTemplates || [],
        transactionSeries: settings.customization?.transactionSeries || ({} as any),
        emailNotifications: templates,
      },
    };

    onUpdateSettings(updatedSettings);
    showToast('Email notification templates saved successfully!');
  };

  const insertVariable = (variableName: string) => {
    const token = `{{${variableName}}}`;
    handleUpdateActiveTemplate({
      body: `${activeTemplate.body} ${token}`,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h3 className="text-xl font-serif-title font-bold text-slate-900 flex items-center space-x-2">
            <Mail className="w-5 h-5 text-[#0070ba]" />
            <span>Email Notification Templates</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated email notifications dispatched to clients for fee notes, receipts, and quote proposals
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0070ba] hover:bg-[#005a96] rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Templates</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-px text-xs font-semibold">
        {[
          { key: 'invoiceIssued', label: 'Fee Note Issued' },
          { key: 'paymentReceived', label: 'Payment Receipt' },
          { key: 'quoteProposal', label: 'Retainer Quote' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTemplateKey(tab.key as any)}
            className={`px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
              activeTemplateKey === tab.key
                ? 'border-b-2 border-[#0070ba] text-[#0070ba] font-bold bg-blue-50/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Template Form */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeTemplate.active}
              onChange={(e) => handleUpdateActiveTemplate({ active: e.target.checked })}
              className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
            />
            <span>Enable Automated Email for this Event</span>
          </label>

          <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={activeTemplate.ccBillingEmail}
              onChange={(e) => handleUpdateActiveTemplate({ ccBillingEmail: e.target.checked })}
              className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
            />
            <span>CC Chambers Billing Desk ({settings.billingEmail || settings.email})</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Subject Line
          </label>
          <input
            type="text"
            value={activeTemplate.subject}
            onChange={(e) => handleUpdateActiveTemplate({ subject: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Body Content
            </label>
            <span className="text-[11px] text-slate-400">Supports variable tags</span>
          </div>

          <textarea
            rows={8}
            value={activeTemplate.body}
            onChange={(e) => handleUpdateActiveTemplate({ body: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0070ba] leading-relaxed"
          />
        </div>

        {/* Variable tokens helper */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block">Click to insert dynamic variable tag:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'client_name',
              'invoice_number',
              'amount',
              'due_date',
              'matter_title',
              'bank_name',
              'account_name',
              'account_number',
              'receipt_number',
              'payment_method',
            ].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-[#0070ba] border border-slate-200 rounded cursor-pointer transition-colors"
              >
                + {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
