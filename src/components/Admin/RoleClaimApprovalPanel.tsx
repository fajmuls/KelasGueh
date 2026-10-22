import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { RoleClaimRequest, Role } from '../../types/index.ts';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';

export const RoleClaimApprovalPanel: React.FC = () => {
  const [requests, setRequests] = useState<RoleClaimRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<{ [reqId: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [reqList, roleList] = await Promise.all([
        api.getRoleClaimRequests(),
        api.getRoles(),
      ]);
      setRequests(reqList);
      setRoles(roleList);

      // Pre-fill selected roles
      const roleMap: { [reqId: string]: string } = {};
      reqList.forEach((r) => {
        roleMap[r.id] = r.requested_role_id;
      });
      setSelectedRoles(roleMap);
    } catch (err) {
      console.error('Failed to load role claim requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (req: RoleClaimRequest) => {
    const roleIdToAssign = selectedRoles[req.id] || req.requested_role_id;
    try {
      setActionLoading(req.id);
      await api.approveRoleClaim(req.id, roleIdToAssign);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui permintaan role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak permohonan role ini?')) return;
    try {
      setActionLoading(reqId);
      await api.rejectRoleClaim(reqId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak permohonan');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const pastRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Persetujuan Akun Google Masuk & Penetapan Role
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Admin memverifikasi klaim akun Google login dan menentukan role/jabatan resmi pengguna di sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingRequests.length > 0 && (
            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full animate-pulse">
              {pendingRequests.length} Permintaan Menunggu
            </span>
          )}
          <button
            onClick={loadData}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pending List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Permintaan Masuk ({pendingRequests.length})
        </h4>

        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
            ✓ Tidak ada permohonan role yang menunggu verifikasi saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Google & Student info */}
                <div className="flex items-start gap-3">
                  <img
                    src={
                      req.google_avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={req.google_name}
                    className="w-10 h-10 rounded-full border border-slate-300 shadow-2xs shrink-0 mt-0.5"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{req.google_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({req.google_email})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                      <span>Mengklaim sebagai:</span>
                      <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {req.user_name}
                      </span>
                      <span className="text-slate-400 font-mono">
                        (NIM: {req.user_nim})
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-slate-600 italic bg-white/70 p-1.5 rounded border border-slate-200">
                        "{req.notes}"
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400">
                      Diajukan pada: {new Date(req.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Right: Role selection & Action buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <select
                    value={selectedRoles[req.id] || req.requested_role_id}
                    onChange={(e) =>
                      setSelectedRoles({ ...selectedRoles, [req.id]: e.target.value })
                    }
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleApprove(req)}
                    disabled={actionLoading === req.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui</span>
                  </button>

                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History List */}
      {pastRequests.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Riwayat Permintaan Selesai ({pastRequests.length})
          </h4>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
            {pastRequests.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{r.google_name}</span>
                  <span className="text-slate-400 text-[11px]">→</span>
                  <span className="text-slate-700 font-medium">{r.user_name}</span>
                  <Badge variant={r.status === 'approved' ? 'success' : 'danger'}>
                    {r.status === 'approved' ? `Disetujui: ${r.role_name}` : 'Ditolak'}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400">
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('id-ID') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
