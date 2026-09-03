import React, { useState } from 'react';
import {
  Mail,
  X,
  CheckCircle2,
  Calendar,
  Briefcase,
  User,
  Clock,
  Flame,
  AlertTriangle,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { TaskEmailPayload } from '../utils/taskNotificationHelper';

interface TaskEmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailPayload: TaskEmailPayload | null;
}

export const TaskEmailNotificationModal: React.FC<TaskEmailNotificationModalProps> = ({
  isOpen,
  onClose,
  emailPayload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !emailPayload) return null;

  const handleCopy = () => {
    const fullText = `
Subject: ${emailPayload.subject}
To: ${emailPayload.toName} <${emailPayload.toEmail}>
From: ${emailPayload.fromName} <${emailPayload.fromEmail}>
Date: ${emailPayload.assignedAt}

Dear ${emailPayload.toName},

You have been assigned a new ${emailPayload.priority} priority task in Muthoni Ahago Advocates Chambers Practice Engine.

TASK DETAILS:
- Action Item: ${emailPayload.taskTitle}
- Legal Matter: ${emailPayload.matterRef} ${emailPayload.matterTitle ? `(${emailPayload.matterTitle})` : ''}
- Client: ${emailPayload.clientName}
- Target Deadline: ${emailPayload.dueDate}
- Priority: ${emailPayload.priority}
- Assigned By: ${emailPayload.assignedBy}

INSTRUCTIONS / BRIEF:
${emailPayload.description}

CHECKLIST / ACTION STEPS:
${emailPayload.subtasks.map((st, i) => `${i + 1}. [${st.completed ? 'COMPLETED' : 'PENDING'}] ${st.text}`).join('\n')}

Please log in to the Muthoni Ahago Advocates practice portal to update progress, upload draft pleadings, and record billable time.
    `.trim();

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const isHigh =
    emailPayload.priority === 'High' ||
    (emailPayload.priority as string) === 'Critical' ||
    (emailPayload.priority as string) === 'Urgent';

  const isMedium = emailPayload.priority === 'Medium';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Email Client Header */}
        <div className="flex items-center justify-between bg-[#0b1f2d] px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-sm text-white">
                  Automated Task Assignment Email
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono px-2 py-0.2">
                  Dispatched via SMTP
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Automated legal workload notification sent to assigned advocate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Email Envelope Metadata Bar */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-3 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-400 w-12 text-[11px]">From:</span>
              <span className="font-medium text-slate-900 truncate">
                {emailPayload.fromName}{' '}
                <span className="font-mono text-slate-500 text-[11px]">
                  &lt;{emailPayload.fromEmail}&gt;
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-400 w-12 text-[11px]">Sent:</span>
              <span className="font-mono text-slate-700 text-[11px]">{emailPayload.assignedAt}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-600">
            <span className="font-semibold text-slate-400 w-12 text-[11px]">To:</span>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 text-blue-900 font-semibold text-[11px]">
                <User className="h-3 w-3 text-blue-700" />
                <span>{emailPayload.toName}</span>
                <span className="font-mono text-[10px] text-blue-700">({emailPayload.toEmail})</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
            <span className="font-semibold text-slate-400 w-12 text-[11px]">Subject:</span>
            <span className="font-bold text-slate-900 text-xs truncate">
              {emailPayload.subject}
            </span>
          </div>
        </div>

        {/* Email HTML Body Rendering */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white text-xs text-slate-800">
          {/* Chambers Letterhead / Email Banner */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#0b1f2d] p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-mono">
                Muthoni Ahago Advocates
              </p>
              <h4 className="font-heading text-sm font-bold text-white mt-0.5">
                Chambers Workload & Practice Dispatch System
              </h4>
            </div>
            <div className="hidden sm:flex items-center space-x-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Official Notification</span>
            </div>
          </div>

          {/* Salutation & Assignment Alert */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-900">
              Dear {emailPayload.toName},
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              This is an automated notification from Chambers Practice Management. A new legal task has been assigned to you by{' '}
              <span className="font-semibold text-slate-900">{emailPayload.assignedBy}</span>.
            </p>
          </div>

          {/* Priority Callout Banner */}
          <div
            className={`rounded-xl p-3.5 border flex items-center justify-between ${
              isHigh
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : isMedium
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {isHigh ? (
                <Flame className="h-5 w-5 text-rose-600 shrink-0" />
              ) : isMedium ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
              )}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                  {emailPayload.priority} Priority Workload
                </span>
                <span className="text-xs font-bold">{emailPayload.taskTitle}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="block text-[10px] text-slate-500 font-medium">Target Deadline</span>
              <span className="font-mono font-bold text-xs">{emailPayload.dueDate}</span>
            </div>
          </div>

          {/* Case & Matter Details Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="font-bold text-slate-700 text-xs">Attached Matter Brief</span>
              <span className="font-mono font-bold text-amber-800 text-[11px]">
                {emailPayload.matterRef}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold">Client / Instructing Party:</span>
                <span className="font-semibold text-slate-800">{emailPayload.clientName}</span>
              </div>
              {emailPayload.matterTitle && (
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold">Matter Description:</span>
                  <span className="font-medium text-slate-800 line-clamp-1">{emailPayload.matterTitle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Briefing Instructions */}
          <div className="space-y-1.5">
            <h5 className="font-bold text-slate-800 text-xs">Partner Instructions & Scope:</h5>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 leading-relaxed">
              {emailPayload.description || 'No additional instructions provided. Refer to active case file.'}
            </div>
          </div>

          {/* Subtask Action Steps */}
          {emailPayload.subtasks && emailPayload.subtasks.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 text-xs">
                Checklist Steps ({emailPayload.subtasks.length} items):
              </h5>
              <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                {emailPayload.subtasks.map((st, i) => (
                  <div key={st.id || i} className="flex items-center space-x-2 text-xs">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 shrink-0">
                      {i + 1}
                    </span>
                    <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700'}>
                      {st.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Signature */}
          <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Muthoni Ahago Advocates & Legal Consultants</p>
            <p>Upper Hill Chambers, 4th Floor, 2nd Ngong Avenue, Nairobi, Kenya</p>
            <p className="text-[10px] text-slate-400">
              This automated email alert was generated by the Chambers Legal Management Suite.
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Email Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy Full Email Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer shadow-xs transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
