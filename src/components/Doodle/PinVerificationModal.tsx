import React, { useState } from 'react';
import { verifyPinInput } from '../../utils/security.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { ShieldAlert, KeyRound, X, Check, Lock } from 'lucide-react';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  requiredAmount?: number;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Konfirmasi PIN Keamanan Transaksi',
  description = 'Transaksi ini memerlukan verifikasi PIN 6-digit bendahara untuk alasan keamanan.',
  requiredAmount
}) => {
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...pinDigits];
    newDigits[index] = val.slice(-1);
    setPinDigits(newDigits);
    setErrorMsg(null);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');
    if (fullPin.length !== 6) {
      setErrorMsg('Masukkan 6 digit angka PIN dengan lengkap.');
      sfx.playWarning();
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyPinInput(fullPin);
      if (isValid) {
        sfx.playLevelUp();
        setPinDigits(['', '', '', '', '', '']);
        setErrorMsg(null);
        onSuccess();
      } else {
        sfx.playWarning();
        setErrorMsg('PIN 6-digit salah! Silakan coba lagi. (PIN default: 123456)');
      }
    } catch {
      setErrorMsg('Gagal memverifikasi PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sfx.playCardClose();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="card-doodle bg-white max-w-md w-full rounded-xl p-6 relative">
        <ScotchTape className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-1" />

        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-slate-900 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-amber-900" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.playCardClose();
              onClose();
            }}
            className="w-7 h-7 btn-doodle bg-slate-100 rounded flex items-center justify-center text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          {description}
        </p>

        {requiredAmount && (
          <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-500 rounded-lg flex items-center justify-between text-xs font-bold text-rose-900">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Nominal Besar Detected:</span>
            </div>
            <span className="font-mono text-sm">{formatRupiah(requiredAmount)}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4 text-center">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
              Masukkan 6 Digit PIN Otorisasi:
            </label>
            <div className="flex justify-center gap-2">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-digit-${idx}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-xl font-mono font-black border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-100/70"
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              💡 Default PIN: <strong className="font-mono text-slate-800">123456</strong> (Dapat diubah di tab Pengaturan)
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 border-2 border-rose-600 rounded-md text-rose-900 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-dashed border-slate-200">
            <button
              type="button"
              onClick={() => {
                sfx.playCardClose();
                onClose();
              }}
              className="px-4 py-2 border-2 border-slate-900 rounded-md text-xs font-bold bg-white hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="btn-doodle px-5 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Verifikasi PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
