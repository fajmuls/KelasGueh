import React, { useState } from 'react';
import { Bell, Check, X, ShieldAlert } from 'lucide-react';
import { ScotchTape } from '../Doodle/DoodleDecorations.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { showToast } from './DoodleDialog.tsx';

interface NotificationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const NotificationCardModal: React.FC<NotificationCardModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const [permissionDeniedHelp, setPermissionDeniedHelp] = useState(false);

  if (!isOpen) return null;

  const handleRequest = async () => {
    sfx.playClick();
    if (!('Notification' in window)) {
      showToast('Peramban ini tidak mendukung Web Notifications, tetapi toast aplikasi tetap aktif.', 'info');
      onClose();
      return;
    }

    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        showToast('Notifikasi berhasil diaktifkan!', 'success');
        if (onPermissionGranted) onPermissionGranted();
        onClose();
      } else {
        setPermissionDeniedHelp(true);
        showToast('Izin notifikasi ditolak oleh browser.', 'error');
      }
    } catch {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="card-doodle bg-[#FFFDF9] max-w-sm w-full rounded-xl p-5 relative z-10 border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B] animate-in zoom-in-95 duration-150">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-2deg]" />
        
        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-900 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-slate-900 flex items-center justify-center">
            <Bell className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Aktifkan Pengingat Iuran?
            </h3>
            <p className="text-[10px] text-slate-500 font-bold">PWA Notifikasi Kas Kelas</p>
          </div>
        </div>

        <p className="text-xs text-slate-700 font-medium leading-relaxed mb-4">
          Dapatkan pengingat otomatis jika ada transaksi kas masuk baru, penagihan iuran mingguan, atau laporan audit kas yang diperbarui.
        </p>

        {permissionDeniedHelp && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-[11px] text-rose-900 mb-4 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Izin Terkunci di Browser:</strong>
              <p className="text-[10px] text-rose-800 mt-0.5">
                Buka ikon gembok di sebelah kiri URL browser ➔ Izin Situs ➔ Ubah Notifikasi menjadi Izinkan.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.playCardClose();
              onClose();
            }}
            className="btn-doodle px-3 py-2 min-h-[44px] bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-md"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={handleRequest}
            className="btn-doodle px-4 py-2 min-h-[44px] bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs font-black rounded-md shadow-[2px_2px_0px_#1E293B] flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Aktifkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
