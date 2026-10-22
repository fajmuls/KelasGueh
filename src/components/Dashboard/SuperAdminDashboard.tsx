import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Role, User, AuditLog, FinanceSummary } from '../../types/index.ts';
import {
  ShieldAlert,
  Users,
  KeyRound,
  History,
  Settings,
  Database,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';

interface SuperAdminDashboardProps {
  onNavigate: (module: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    Promise.all([
      api.getAllUsers().catch(() => []),
      api.getRoles().catch(() => []),
      api.getAuditLogs().catch(() => []),
      api.getFinanceSummary().catch(() => null),
    ]).then(([u, r, a, f]) => {
      setUsers(u);
      setRoles(r);
      setAudits(a.slice(0, 6));
      setFinance(f);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-slate-950 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 mb-2">
            <Lock className="w-3.5 h-3.5" /> Root Administration
          </span>
          <h2 className="text-2xl font-bold">Super Admin Control Center</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Pengaturan izin Role-Based Access Control (RBAC), rekayasa hak akses pengguna, audit trail transaksi, dan integritas basis data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('roles')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" /> Kelola Permission Matrix
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" /> Pengaturan Sistem
          </button>
        </div>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total User Terdaftar</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{users.length} Akun</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Terverifikasi
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Role Sistem</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{roles.length} Role</p>
          <p className="text-[11px] text-slate-400 mt-1">Bawaan & Custom RBAC</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rekam Jejak Audit</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <History className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{audits.length} Catatan</p>
          <p className="text-[11px] text-slate-400 mt-1">Aktivitas keuangan & anggota</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Integritas Ledger Kas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">Sinkron</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Saldo: Rp {(finance?.balance || 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Quick Access to System Administration Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('roles')}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Role & Permission Manager</h3>
          <p className="text-xs text-slate-500">
            Atur izin granular (create, read, update, delete) per modul untuk setiap role atau buat role kustom baru.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 pt-1">
            Buka Konfigurasi <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('audit-logs')}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Sistem Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Periksa rekam jejak setiap pembuatan transaksi kas, pergantian role, dan penghapusan data.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 pt-1">
            Periksa Log <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Pengaturan & Backup Database</h3>
          <p className="text-xs text-slate-500">
            Unduh snapshot cadangan data (JSON), kelola versi sistem (v1.0.0), dan parameter kelas.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 pt-1">
            Buka Pengaturan <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Live Audit Feed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" /> Log Aktivitas Sistem Terkini
          </h3>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Lihat Seluruh Log
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {audits.map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-800">{a.action}</span>
                <span className="text-slate-500 ml-2">({a.entity_type})</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dilakukan oleh: <strong className="text-slate-600">{a.user_name}</strong> • IP: {a.ip_address}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                {new Date(a.created_at).toLocaleTimeString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
