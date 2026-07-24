'use client';

import { AlertTriangle, CheckCircle2, Info, RefreshCcw, X } from 'lucide-react';

type NoticeVariant = 'success' | 'error' | 'info';

interface AdminNoticeProps {
  variant: NoticeVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const noticeStyles: Record<NoticeVariant, string> = {
  success:
    'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100',
  error:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
};

const noticeIcons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export function AdminNotice({ variant, title, message, onDismiss }: AdminNoticeProps) {
  const Icon = noticeIcons[variant];

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${noticeStyles[variant]}`}>
      <Icon className="mt-0.5 h-5 w-5 flex-none" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Cerrar mensaje"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface AdminStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AdminEmptyState({ title, message, actionLabel, onAction }: AdminStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
      <Info className="mx-auto mb-3 h-8 w-8 text-gray-400" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function AdminErrorState({
  title,
  message,
  actionLabel = 'Reintentar',
  onAction,
}: AdminStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm opacity-80">{message}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <RefreshCcw className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface AdminConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger,
  loading,
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-full p-2 ${
              danger
                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
