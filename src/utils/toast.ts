/**
 * Global Toast Notification System for Muthoni & Ahago Advocates Chambers Portal
 * Dispatches and manages non-intrusive, styled status toasts across all views and modals.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  details?: string;
  duration?: number;
}

export const showGlobalToast = (
  message: string,
  type: ToastType = 'info',
  options?: { title?: string; details?: string; duration?: number }
) => {
  const toastItem: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    message,
    title: options?.title,
    details: options?.details,
    duration: options?.duration || (type === 'error' ? 8000 : 4000),
  };

  window.dispatchEvent(new CustomEvent<ToastItem>('chambers-app-toast', { detail: toastItem }));
};

export const toast = {
  success: (message: string, title?: string) => showGlobalToast(message, 'success', { title }),
  error: (message: string, title?: string, details?: string) => showGlobalToast(message, 'error', { title, details, duration: 8000 }),
  warning: (message: string, title?: string) => showGlobalToast(message, 'warning', { title }),
  info: (message: string, title?: string) => showGlobalToast(message, 'info', { title }),
};
