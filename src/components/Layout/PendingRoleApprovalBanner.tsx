import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Clock, ShieldAlert, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';

export const PendingRoleApprovalBanner: React.FC = () => {
  const { user, role, claimStatus, isSuperAdmin } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // If user is superadmin or has no pending request, do not show
  if (isSuperAdmin || isDismissed) return null;

  const isPending =
    claimStatus.isPendingApproval ||
    (user?.position && user.position.toLowerCase().includes('menunggu verifikasi')) ||
    (user?.role_id === 'role_anggota' && claimStatus.claimRequest?.requested_role_name);

  if (!isPending) return null;

  const requestedRoleName =
    claimStatus.claimRequest?.requested_role_name ||
    (user?.position?.match(/\(([^)]+)\)/)?.[1]?.replace('Menunggu Verifikasi', '').trim()) ||
    'Pengurus Kelas';

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-3.5 text-xs text-amber-900 shadow-2xs animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">
                Mode Anggota Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-semibold text-[10px]">
                Pengajuan: {requestedRoleName}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 truncate">
              Profil: <strong>{user?.name} ({user?.nim})</strong> • Menunggu approval Super Admin ({'mrachmanfm@gmail.com'}).
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-amber-600 hover:text-amber-900 rounded-md transition-colors cursor-pointer shrink-0"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
