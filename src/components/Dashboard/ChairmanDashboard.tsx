import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { FinanceSummary, EventItem, TaskItem, User, AuditLog, Payment } from '../../types/index.ts';
import {
  Users,
  Wallet,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';

interface ChairmanDashboardProps {
  onNavigate: (module: string) => void;
}

export const ChairmanDashboard: React.FC<ChairmanDashboardProps> = ({ onNavigate }) => {
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [fin, mem, ev, tsk, pays, aud] = await Promise.all([
          api.getFinanceSummary().catch(() => null),
          api.getMembers().catch(() => []),
          api.getEvents().catch(() => []),
          api.getTasks().catch(() => []),
          api.getPayments().catch(() => []),
          api.getAuditLogs().catch(() => []),
        ]);
        setFinance(fin);
        setMembers(mem);
        setEvents(ev.slice(0, 4));
        setTasks(tsk);
        setPendingPayments(pays.filter(p => p.status === 'pending'));
        setRecentAudits(aud.slice(0, 5));
      } catch (err) {
        console.error('Error loading chairman dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const totalMembers = members.length;
  const totalOfficers = members.filter(m => m.role_id !== 'role_anggota').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-[#0F172A] rounded-xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Executive Command
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Ketua Kelas</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Pantau performa administrasi, status kas kelas, agenda, dan tindak lanjut tugas pengurus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Buka Rekap Laporan
          </button>
        </div>
      </div>

      {/* KPI Cards: Total Anggota, Jumlah Pengurus, Saldo Kas, Task Pending */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Mahasiswa</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{totalMembers} / 40</h3>
          <p className="mt-1 text-sm text-slate-500 font-medium">95% Partisipasi Terdaftar</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personel Pengurus</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{totalOfficers}</h3>
          <p className="mt-1 text-sm text-indigo-600 font-medium">Pengurus Aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Saldo Kas</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Rp {(finance?.balance || 0).toLocaleString('id-ID')}
          </h3>
          <p className="mt-1 text-sm text-emerald-600 font-medium">+12.5% vs bulan lalu</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tugas Belum Selesai</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{pendingTasks}</h3>
          <p className="mt-1 text-sm text-amber-600 font-medium">Perlu Pemantauan</p>
        </div>
      </div>

      {/* Approval yang Menunggu (Pending Approvals) */}
      {pendingPayments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {pendingPayments.length} Pembayaran Kas Menunggu Verifikasi
              </p>
              <p className="text-xs text-amber-700">
                Anggota telah mengunggah bukti transfer kas dan menunggu verifikasi bendahara.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('finance')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tinjau Kas
          </button>
        </div>
      )}

      {/* Grid: Agenda & Aktivitas Audit Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Terdekat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Agenda Kelas Terdekat
            </h3>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {events.map((e) => (
              <div
                key={e.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{e.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {e.date} • {e.start_time} WIB • PIC: {e.pic_name}
                  </p>
                </div>
                <Badge variant={e.type === 'meeting' ? 'purple' : e.type === 'exam' ? 'danger' : 'primary'}>
                  {e.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terbaru (Audit Trail) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" /> Aktivitas & Audit Trail
            </h3>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Lihat Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentAudits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{a.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(a.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">Oleh: {a.user_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
