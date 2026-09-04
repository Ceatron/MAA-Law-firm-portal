/**
 * Server-Side Real Email Delivery Service
 * 
 * SECURITY DIRECTIVES:
 * 1. STRICTLY runs on the server (Node.js/Express). Never bundled to the browser.
 * 2. Uses server-side environment variables ONLY:
 *    - RESEND_API_KEY or EMAIL_API_KEY (Recommended for Vercel/Serverless)
 *    - SENDGRID_API_KEY
 *    - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE
 *    - EMAIL_FROM (Sender address, e.g. "Muthoni Ahago Advocates <notifications@muthoniahago.co.ke>")
 * 3. Never logs credentials, passwords, or API keys.
 * 4. Distinguishes 'submitted', 'failed', and 'unconfigured' states. Never fakes delivery.
 */

import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  type?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface EmailSendResult {
  success: boolean;
  status: 'submitted' | 'failed' | 'unconfigured';
  provider: 'resend' | 'sendgrid' | 'smtp' | 'none';
  providerMessageId?: string;
  recipient: string;
  subject: string;
  timestamp: string;
  error?: string;
  details?: any;
}

// In-memory idempotency cache: hash -> { timestamp, result }
// Prevents duplicate emails if retried within 3 minutes
const recentDispatches = new Map<string, { timestamp: number; result: EmailSendResult }>();

function cleanupRecentDispatches() {
  const now = Date.now();
  for (const [key, value] of recentDispatches.entries()) {
    if (now - value.timestamp > 180000) { // 3 minutes
      recentDispatches.delete(key);
    }
  }
}

/**
 * Resolves the active email provider based on environment variables
 */
export function getActiveEmailProvider(): 'resend' | 'sendgrid' | 'smtp' | 'none' {
  const explicit = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  if (explicit === 'resend') return 'resend';
  if (explicit === 'sendgrid') return 'sendgrid';
  if (explicit === 'smtp') return 'smtp';

  if (process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY) {
    return 'resend';
  }
  if (process.env.SENDGRID_API_KEY) {
    return 'sendgrid';
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return 'smtp';
  }

  return 'none';
}

/**
 * Resolves the default sender address
 */
export function getDefaultFromAddress(): string {
  const envFrom = process.env.EMAIL_FROM;
  if (envFrom && envFrom.trim()) {
    return envFrom.trim();
  }
  return 'Muthoni Ahago Advocates <notifications@muthoniahago.co.ke>';
}

/**
 * Builds standard firm-branded HTML for notification emails
 */
export function buildFirmBrandedHtml(options: {
  headline: string;
  subheadline?: string;
  salutation: string;
  leadParagraph: string;
  detailsTable?: Array<{ label: string; value: string; isCode?: boolean }>;
  priorityBadge?: { label: string; color: 'high' | 'medium' | 'normal' };
  actionUrl?: string;
  actionButtonText?: string;
  notes?: string;
}): string {
  const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://muthoniahago.co.ke');
  const targetUrl = options.actionUrl || appUrl;

  let badgeHtml = '';
  if (options.priorityBadge) {
    const bg = options.priorityBadge.color === 'high' ? '#be123c' : options.priorityBadge.color === 'medium' ? '#d97706' : '#0369a1';
    badgeHtml = `
      <div style="display:inline-block;background-color:${bg};color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">
        ${options.priorityBadge.label}
      </div>
    `;
  }

  let tableHtml = '';
  if (options.detailsTable && options.detailsTable.length > 0) {
    const rows = options.detailsTable
      .map(
        (row) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;width:35%;">${row.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;${row.isCode ? 'font-family:monospace;font-weight:600;color:#92400e;' : 'font-weight:500;'}">${row.value}</td>
        </tr>
      `
      )
      .join('');

    tableHtml = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background-color:#f8fafc;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        ${rows}
      </table>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0b1f2d;padding:28px 32px;text-align:left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:800;color:#f59e0b;text-transform:uppercase;letter-spacing:0.15em;display:block;margin-bottom:4px;">Muthoni Ahago Advocates</span>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">${options.headline}</h1>
                    ${options.subheadline ? `<p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">${options.subheadline}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px;">
              ${badgeHtml}
              <p style="font-size:15px;color:#0f172a;margin:0 0 16px 0;font-weight:600;">${options.salutation}</p>
              <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 16px 0;">${options.leadParagraph}</p>

              ${tableHtml}

              ${options.notes ? `<div style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:4px;font-size:13px;color:#92400e;line-height:1.5;">${options.notes}</div>` : ''}

              <!-- Action Button -->
              <div style="margin:28px 0 16px 0;text-align:center;">
                <a href="${targetUrl}" target="_blank" style="background-color:#0b1f2d;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;letter-spacing:0.02em;">
                  ${options.actionButtonText || 'Open in Chambers Portal →'}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;font-weight:600;">
                Muthoni Ahago Advocates • Chambers Practice Management System
              </p>
              <p style="margin:0 0 8px 0;font-size:11px;color:#94a3b8;line-height:1.5;">
                The Triple Two Address, 1st Floor, Ruiru • Milimani Law Courts Chambers, Nairobi, Kenya
              </p>
              <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.4;">
                CONFIDENTIALITY NOTICE: This transmission is intended solely for the designated recipient and may contain privileged attorney-work-product or legal advice. If received in error, notify the sender immediately and delete all copies.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Deliver email via Resend API (HTTPS-based, ideal for Vercel serverless)
 */
async function sendViaResend(options: EmailOptions, apiKey: string): Promise<EmailSendResult> {
  const fromAddress = options.from || getDefaultFromAddress();
  const timestamp = new Date().toISOString();

  const payload: any = {
    from: fromAddress,
    to: [options.to],
    subject: options.subject,
    text: options.text || '',
    html: options.html || options.text?.replace(/\n/g, '<br/>') || '',
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'muthoni-ahago-portal/1.0',
  };

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const responseData: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = responseData.message || responseData.error || `Resend API returned HTTP ${response.status}`;
    console.error(`[EmailService:Resend] Failed to send email to ${options.to}:`, errorMsg);
    return {
      success: false,
      status: 'failed',
      provider: 'resend',
      recipient: options.to,
      subject: options.subject,
      timestamp,
      error: errorMsg,
      details: responseData,
    };
  }

  const providerMessageId = responseData.id || `resend-${Date.now()}`;
  console.info(`[EmailService:Resend] Email successfully submitted to Resend: ${providerMessageId} -> ${options.to}`);

  return {
    success: true,
    status: 'submitted',
    provider: 'resend',
    providerMessageId,
    recipient: options.to,
    subject: options.subject,
    timestamp,
  };
}

/**
 * Deliver email via SendGrid API (HTTPS-based)
 */
async function sendViaSendGrid(options: EmailOptions, apiKey: string): Promise<EmailSendResult> {
  const fromAddress = options.from || getDefaultFromAddress();
  const timestamp = new Date().toISOString();

  // Extract pure email from 'Name <email@domain.com>' if needed
  const fromMatch = fromAddress.match(/<([^>]+)>/) || [null, fromAddress];
  const fromEmail = fromMatch[1] || fromAddress;
  const fromNameMatch = fromAddress.match(/^([^<]+)</);
  const fromName = options.fromName || (fromNameMatch ? fromNameMatch[1].trim() : 'Muthoni Ahago Advocates');

  const payload = {
    personalizations: [
      {
        to: [{ email: options.to, name: options.toName || options.to }],
        subject: options.subject,
      },
    ],
    from: { email: fromEmail, name: fromName },
    content: [
      {
        type: 'text/plain',
        value: options.text || options.subject,
      },
      ...(options.html
        ? [
            {
              type: 'text/html',
              value: options.html,
            },
          ]
        : []),
    ],
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`[EmailService:SendGrid] Failed to send email to ${options.to}:`, errorText);
    return {
      success: false,
      status: 'failed',
      provider: 'sendgrid',
      recipient: options.to,
      subject: options.subject,
      timestamp,
      error: `SendGrid returned HTTP ${response.status}: ${errorText}`,
    };
  }

  const providerMessageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
  console.info(`[EmailService:SendGrid] Email successfully submitted to SendGrid: ${providerMessageId} -> ${options.to}`);

  return {
    success: true,
    status: 'submitted',
    provider: 'sendgrid',
    providerMessageId,
    recipient: options.to,
    subject: options.subject,
    timestamp,
  };
}

/**
 * Deliver email via authenticated SMTP (nodemailer)
 */
async function sendViaSmtp(options: EmailOptions): Promise<EmailSendResult> {
  const timestamp = new Date().toISOString();
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return {
      success: false,
      status: 'unconfigured',
      provider: 'smtp',
      recipient: options.to,
      subject: options.subject,
      timestamp,
      error: 'SMTP host, username, or password is missing in environment variables.',
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Strict connection limits for serverless / Vercel execution safety
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  const fromAddress = options.from || getDefaultFromAddress();

  const mailOptions = {
    from: fromAddress,
    to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
    subject: options.subject,
    text: options.text || '',
    html: options.html || options.text?.replace(/\n/g, '<br/>') || '',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const providerMessageId = info.messageId || `smtp-${Date.now()}`;
    console.info(`[EmailService:SMTP] Email sent via SMTP: ${providerMessageId} -> ${options.to}`);

    return {
      success: true,
      status: 'submitted',
      provider: 'smtp',
      providerMessageId,
      recipient: options.to,
      subject: options.subject,
      timestamp,
    };
  } catch (err: any) {
    console.error(`[EmailService:SMTP] SMTP error sending to ${options.to}:`, err?.message || err);
    return {
      success: false,
      status: 'failed',
      provider: 'smtp',
      recipient: options.to,
      subject: options.subject,
      timestamp,
      error: err?.message || 'Failed to send message via SMTP server.',
    };
  }
}

/**
 * Main email dispatcher with retries and deduplication
 */
export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  cleanupRecentDispatches();

  const timestamp = new Date().toISOString();
  const provider = getActiveEmailProvider();

  // Basic validation
  if (!options.to || !options.to.includes('@')) {
    return {
      success: false,
      status: 'failed',
      provider,
      recipient: options.to || '',
      subject: options.subject || '',
      timestamp,
      error: "Valid recipient email address ('to') is required.",
    };
  }

  if (!options.subject || !options.subject.trim()) {
    return {
      success: false,
      status: 'failed',
      provider,
      recipient: options.to,
      subject: '',
      timestamp,
      error: "Email 'subject' is required.",
    };
  }

  // Idempotency check: prevent duplicate sends within 3 minutes
  const hashKey = options.idempotencyKey || `${options.to.toLowerCase()}|${options.subject.trim()}|${options.type || 'general'}`;
  const existing = recentDispatches.get(hashKey);
  if (existing && Date.now() - existing.timestamp < 60000) { // 1 minute duplicate suppression
    console.warn(`[EmailService] Duplicate send suppressed for ${options.to} (${options.subject}) within 60s window.`);
    return existing.result;
  }

  // Check if provider is configured
  if (provider === 'none') {
    const errorMsg = 'No real email provider configured. Please set RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials in your environment variables.';
    console.warn(`[EmailService] Unconfigured provider: email to ${options.to} was NOT sent.`);
    const result: EmailSendResult = {
      success: false,
      status: 'unconfigured',
      provider: 'none',
      recipient: options.to,
      subject: options.subject,
      timestamp,
      error: errorMsg,
    };
    return result;
  }

  // Attempt delivery with 1 retry for transient network errors
  let lastResult: EmailSendResult | null = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (provider === 'resend') {
        const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '';
        lastResult = await sendViaResend(options, apiKey);
      } else if (provider === 'sendgrid') {
        const apiKey = process.env.SENDGRID_API_KEY || '';
        lastResult = await sendViaSendGrid(options, apiKey);
      } else if (provider === 'smtp') {
        lastResult = await sendViaSmtp(options);
      }

      if (lastResult && lastResult.success) {
        recentDispatches.set(hashKey, { timestamp: Date.now(), result: lastResult });
        return lastResult;
      }

      // If failed on first attempt, wait 500ms before retrying once
      if (attempt < maxAttempts) {
        console.warn(`[EmailService] Attempt ${attempt} failed for ${options.to}. Retrying once in 500ms...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err: any) {
      console.error(`[EmailService] Uncaught error on attempt ${attempt}:`, err?.message || err);
      lastResult = {
        success: false,
        status: 'failed',
        provider,
        recipient: options.to,
        subject: options.subject,
        timestamp,
        error: err?.message || 'Unexpected server error during email dispatch.',
      };
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  return (
    lastResult || {
      success: false,
      status: 'failed',
      provider,
      recipient: options.to,
      subject: options.subject,
      timestamp,
      error: 'Delivery failed after retry attempt.',
    }
  );
}
