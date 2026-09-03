import React from 'react';
import { X, Bell, Check, ShieldAlert, FileText, Banknote, Calendar, Mail } from 'lucide-react';
import { mockNotifications } from '../data/mockData';
import { NotificationItem } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  notifications?: NotificationItem[];
  onViewEmail?: (payload: any) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onMarkAllRead,
  notifications = mockNotifications,
  onViewEmail,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-sm bg-[#fbf9f4] shadow-2xl h-full flex flex-col border-l border-[#dedbc5] animate-in slide-in-from-right duration-200">
        <div className="bg-[#16181b] p-5 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-[#60A5FA]" />
            <h2 className="font-serif-title text-base font-bold text-stone-100">
              Firm Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-mono px-2 py-0.2">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 bg-[#f1eee4] border-b border-[#e2dfd5] text-xs">
          <span className="text-stone-600 font-medium">Task & CTS Dispatch Logs</span>
          <button
            onClick={onMarkAllRead}
            className="text-[#0B63E5] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-stone-500 space-y-1">
              <Bell className="h-8 w-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">No firm notifications</p>
              <p className="text-[11px]">Task assignments and court updates will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isEmailNotif =
                n.title.includes('Task Assigned') ||
                n.title.includes('Matter Assigned') ||
                n.title.includes('Matter Reassigned') ||
                n.message.includes('email') ||
                !!n.emailPayload;
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    !n.read
                      ? 'border-[#0B63E5]/40 bg-white shadow-2xs'
                      : 'border-stone-200 bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 font-bold text-stone-900">
                    <span className="flex items-start space-x-1.5">
                      {isEmailNotif ? (
                        <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      ) : (
                        <span className={`h-2 w-2 rounded-full mt-1 shrink-0 ${!n.read ? 'bg-[#0B63E5]' : 'bg-stone-300'}`} />
                      )}
                      <span className="text-xs leading-snug">{n.title}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono font-normal shrink-0">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="mt-1.5 text-stone-600 leading-relaxed text-[11px]">
                    {n.message}
                  </p>
                  {n.emailPayload && onViewEmail && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-mono font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>Dispatched to {n.recipientEmail || n.emailPayload.toEmail}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewEmail(n.emailPayload)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <Mail className="h-3 w-3" />
                        <span>View Email</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
