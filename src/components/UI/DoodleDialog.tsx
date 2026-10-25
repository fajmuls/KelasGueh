import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { ScotchTape } from '../Doodle/DoodleDecorations.tsx';
import { sfx } from '../../utils/soundEffects.ts';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDanger: boolean;
  resolve: (value: boolean) => void;
}

interface PromptState {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (value: string | null) => void;
}

// Global handler holders
let addToastFn: ((msg: string, type?: ToastType) => void) | null = null;
let confirmFn: ((options: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}) => Promise<boolean>) | null = null;
let promptFn: ((options: {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) => Promise<string | null>) | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
  if (addToastFn) {
    addToastFn(message, type);
  } else {
    console.log(`[Toast ${type}]: ${message}`);
  }
};

export const showConfirm = (options: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}): Promise<boolean> => {
  if (confirmFn) {
    return confirmFn(options);
  }
  return Promise.resolve(window.confirm(`${options.title}\n\n${options.message}`));
};

export const showPrompt = (options: {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}): Promise<string | null> => {
  if (promptFn) {
    return promptFn(options);
  }
  return Promise.resolve(window.prompt(options.message, options.defaultValue || ''));
};

export const DoodleDialogContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    addToastFn = (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts(prev => {
        const next = [...prev, { id, message, type }];
        return next.slice(-3); // Max 3 toasts stacked
      });

      if (type === 'success') sfx.playSuccess();
      else if (type === 'error') sfx.playWarning();
      else sfx.playNotification();

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3800);
    };

    confirmFn = (options) => {
      sfx.playPaperRustle();
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          isOpen: true,
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel || 'Ya, Lanjut',
          cancelLabel: options.cancelLabel || 'Batal',
          isDanger: options.isDanger ?? false,
          resolve,
        });
      });
    };

    promptFn = (options) => {
      sfx.playPaperRustle();
      setPromptValue(options.defaultValue || '');
      return new Promise<string | null>((resolve) => {
        setPromptState({
          isOpen: true,
          title: options.title,
          message: options.message,
          placeholder: options.placeholder,
          defaultValue: options.defaultValue,
          inputType: options.inputType || 'text',
          confirmLabel: options.confirmLabel || 'Kirim',
          cancelLabel: options.cancelLabel || 'Batal',
          resolve,
        });
      });
    };

    return () => {
      addToastFn = null;
      confirmFn = null;
      promptFn = null;
    };
  }, []);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState?.isOpen) {
          sfx.playCardClose();
          confirmState.resolve(false);
          setConfirmState(null);
        } else if (promptState?.isOpen) {
          sfx.playCardClose();
          promptState.resolve(null);
          setPromptState(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState, promptState]);

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* Toast Notification Stack */}
      <div
        className="fixed top-3 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2 w-[92vw] sm:w-auto sm:max-w-md pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto card-doodle p-3 sm:p-3.5 rounded-lg flex items-start gap-2.5 shadow-[3px_3px_0px_#1E293B] animate-in fade-in slide-in-from-top-2 duration-200 border-2 border-slate-900 ${
              toast.type === 'success'
                ? 'bg-emerald-100 text-emerald-950'
                : toast.type === 'error'
                ? 'bg-rose-100 text-rose-950'
                : 'bg-amber-100 text-slate-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-700" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-amber-700" />}
            </div>
            <p className="text-xs sm:text-sm font-black flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => handleDismissToast(toast.id)}
              className="shrink-0 p-1 rounded hover:bg-black/10 text-slate-700 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => {
              sfx.playCardClose();
              confirmState.resolve(false);
              setConfirmState(null);
            }}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="doodle-confirm-title"
            aria-describedby="doodle-confirm-desc"
            className="card-doodle bg-[#FFFDF9] max-w-sm w-full rounded-xl p-5 relative z-10 border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B] animate-in zoom-in-95 duration-150"
          >
            <ScotchTape className="absolute -top-3 left-10 rotate-[-2deg]" />
            <h3 id="doodle-confirm-title" className="text-base sm:text-lg font-black text-slate-900 mb-2 border-b-2 border-slate-900 pb-2">
              {confirmState.title}
            </h3>
            <p id="doodle-confirm-desc" className="text-xs sm:text-sm text-slate-700 font-medium mb-5 leading-relaxed">
              {confirmState.message}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.playCardClose();
                  confirmState.resolve(false);
                  setConfirmState(null);
                }}
                className="btn-doodle px-3.5 py-2 min-h-[44px] min-w-[70px] bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold rounded-md"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  sfx.playClick();
                  confirmState.resolve(true);
                  setConfirmState(null);
                }}
                className={`btn-doodle px-4 py-2 min-h-[44px] text-xs sm:text-sm font-black rounded-md ${
                  confirmState.isDanger
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[2px_2px_0px_#1E293B]'
                    : 'bg-emerald-400 hover:bg-emerald-500 text-slate-900 shadow-[2px_2px_0px_#1E293B]'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptState?.isOpen && (
        <div className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => {
              sfx.playCardClose();
              promptState.resolve(null);
              setPromptState(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="doodle-prompt-title"
            className="card-doodle bg-[#FFFDF9] max-w-sm w-full rounded-xl p-5 relative z-10 border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B] animate-in zoom-in-95 duration-150"
          >
            <ScotchTape className="absolute -top-3 left-10 rotate-[-2deg]" />
            <h3 id="doodle-prompt-title" className="text-base sm:text-lg font-black text-slate-900 mb-2 border-b-2 border-slate-900 pb-2">
              {promptState.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mb-3">
              {promptState.message}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sfx.playClick();
                promptState.resolve(promptValue);
                setPromptState(null);
              }}
            >
              <input
                type={promptState.inputType || 'text'}
                autoFocus
                placeholder={promptState.placeholder}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50 mb-4"
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playCardClose();
                    promptState.resolve(null);
                    setPromptState(null);
                  }}
                  className="btn-doodle px-3.5 py-2 min-h-[44px] bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold rounded-md"
                >
                  {promptState.cancelLabel}
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-4 py-2 min-h-[44px] bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs sm:text-sm font-black rounded-md shadow-[2px_2px_0px_#1E293B]"
                >
                  {promptState.confirmLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
