'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const TYPE_CONFIG: Record<ToastType, { border: string; icon: React.ReactNode; iconColor: string }> = {
  success: {
    border: 'border-emerald-500/60',
    icon: <CheckCircle2 className="w-5 h-5" strokeWidth={2} />,
    iconColor: 'text-emerald-400',
  },
  error: {
    border: 'border-rose-500/60',
    icon: <XCircle className="w-5 h-5" strokeWidth={2} />,
    iconColor: 'text-rose-400',
  },
  info: {
    border: 'border-sky-500/60',
    icon: <Info className="w-5 h-5" strokeWidth={2} />,
    iconColor: 'text-sky-400',
  },
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // mount 직후 slide-in
    const t = setTimeout(() => setVisible(true), 10);
    // 3초 후 자동 dismiss
    const dismissTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, 3000);

    return () => {
      clearTimeout(t);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  const cfg = TYPE_CONFIG[toast.type];

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-3
        min-w-[260px] max-w-[380px]
        bg-zinc-900/90 backdrop-blur-xl
        border ${cfg.border}
        rounded-xl px-4 py-3
        shadow-lg shadow-black/40
        transition-all duration-200 ease-out
        ${visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="status"
      aria-live="polite"
    >
      <span className={cfg.iconColor}>{cfg.icon}</span>
      <p className="flex-1 text-sm text-zinc-100 break-words">{toast.message}</p>
      <button
        onClick={() => {
          setLeaving(true);
          setTimeout(() => onDismiss(toast.id), 200);
        }}
        className="text-zinc-500 hover:text-zinc-200 transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}
