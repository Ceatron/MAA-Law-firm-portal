import { LoginAuditEntry, Advocate } from '../types';

const LOGIN_AUDIT_STORAGE_KEY = 'muthoni_ahago_login_audit_logs_v2';

export const loadLoginAuditLogs = (): LoginAuditEntry[] => {
  try {
    const saved = localStorage.getItem(LOGIN_AUDIT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse login audit logs from storage:', err);
  }
  return [];
};

export const saveLoginAuditLogs = (logs: LoginAuditEntry[]) => {
  try {
    localStorage.setItem(LOGIN_AUDIT_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(
      new CustomEvent('chambers-login-audit-updated', { detail: logs })
    );
  } catch (err) {
    console.error('Failed to save login audit logs:', err);
  }
};

// Helper to determine simple browser device string
const getClientDeviceInfo = (): string => {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'Web Client (Standard Browser)';
  }
  const ua = window.navigator.userAgent || '';
  let browser = 'Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  let os = 'Desktop';
  if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} / ${os}`;
};

export interface RecordLoginParams {
  identifier: string;
  advocate?: Advocate | null;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  loginMethod?: LoginAuditEntry['loginMethod'];
  location?: string;
  ipAddress?: string;
}

export const recordLoginAttempt = (params: RecordLoginParams): LoginAuditEntry => {
  const currentLogs = loadLoginAuditLogs();
  
  const newEntry: LoginAuditEntry = {
    id: `log-auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    identifier: params.identifier.trim(),
    userName: params.advocate ? params.advocate.name : 'Unregistered Account',
    userEmail: params.advocate ? params.advocate.email : params.identifier.trim(),
    userRole: params.advocate?.role || params.advocate?.title || (params.advocate?.isDeveloper ? 'System Admin' : undefined),
    status: params.status,
    failureReason: params.failureReason,
    ipAddress: params.ipAddress || '102.219.208.45', // Primary chambers static IP
    location: params.location || 'Nairobi, Kenya',
    deviceInfo: getClientDeviceInfo(),
    loginMethod: params.loginMethod || 'Password Credentials',
  };

  // Prepend to top of logs (limit to last 500 records)
  const updated = [newEntry, ...currentLogs].slice(0, 500);
  saveLoginAuditLogs(updated);
  return newEntry;
};

export const clearLoginAuditLogs = () => {
  saveLoginAuditLogs([]);
};

export const resetLoginAuditLogsToDefault = () => {
  saveLoginAuditLogs([]);
};

export const exportLoginAuditLogsCSV = (logs: LoginAuditEntry[]): string => {
  const headers = [
    'Log ID',
    'Timestamp (UTC)',
    'Timestamp (EAT Local)',
    'User Name',
    'User Email / Identifier',
    'Chambers Role',
    'Status',
    'Failure Reason',
    'Authentication Method',
    'IP Address',
    'Location',
    'Device / Browser',
  ];

  const rows = logs.map((log) => {
    const localDateStr = new Date(log.timestamp).toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
    });
    return [
      log.id,
      `"${log.timestamp}"`,
      `"${localDateStr}"`,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${log.userEmail.replace(/"/g, '""')}"`,
      `"${(log.userRole || 'N/A').replace(/"/g, '""')}"`,
      log.status,
      `"${(log.failureReason || '').replace(/"/g, '""')}"`,
      `"${log.loginMethod}"`,
      log.ipAddress,
      `"${log.location || 'Nairobi, KE'}"`,
      `"${log.deviceInfo.replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};
