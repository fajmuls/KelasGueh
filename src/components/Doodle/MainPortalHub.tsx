import React from 'react';
import { KasTransaction, KasMember, ClassSettings, KolektifBill, StudentPointLog, AttendanceRecord, MeetingMinute } from '../../types/kas.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleCrown } from './DoodleDecorations.tsx';
import {
  Wallet,
  Coins,
  ArrowRight,
  Award,
  ClipboardCheck,
  FileText,
  Calendar,
  Sparkles,
  Receipt,
  Users
} from 'lucide-react';

interface MainPortalHubProps {
  settings: ClassSettings;
  members: KasMember[];
  transactions: KasTransaction[];
  kolektifBills: KolektifBill[];
  pointLogs: StudentPointLog[];
  attendanceRecords: AttendanceRecord[];
  meetingMinutes: MeetingMinute[];
  onSelectDomain: (domain: 'bendahara' | 'sekretaris', initialTab?: string) => void;
  onOpenWalkthrough?: () => void;
}

export const MainPortalHub: React.FC<MainPortalHubProps> = ({
  settings,
  members,
  transactions,
  kolektifBills,
  pointLogs,
  attendanceRecords,
  meetingMinutes,
  onSelectDomain,
  onOpenWalkthrough
}) => {
  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  // Kolektif active
  const activeKolektifCount = kolektifBills.length;

  // Secretary stats
  const totalPointsAwarded = pointLogs.reduce((sum, l) => sum + l.points, 0);
  const topStudentLog = (() => {
    const scores: Record<string, number> = {};
    pointLogs.forEach(l => {
      scores[l.memberId] = (scores[l.memberId] || 0) + l.points;
    });
    let bestId = '';
    let bestScore = -1;
    Object.entries(scores).forEach(([id, sc]) => {
      if (sc > bestScore) {
        bestScore = sc;
        bestId = id;
      }
    });
    const foundMember = members.find(m => m.id === bestId);
    return foundMember ? { name: foundMember.name, points: bestScore } : null;
  })();

  const latestAttendance = attendanceRecords[0];
  const latestMinute = meetingMinutes[0];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="card-doodle bg-white p-5 sm:p-6 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative overflow-hidden">
        <ScotchTape className="-top-3 left-8 rotate-1 hidden sm:block" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-amber-200 text-slate-900 border border-slate-900 rounded">
                Portal Manajemen Kelas
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {settings.academicYear || 'Tahun Ajaran Aktif'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {settings.className || 'Kelas Gue'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              Pilih ranah kerja kepengurusan kelas Anda di bawah ini: kelola perputaran uang kas di ranah Bendahara, atau catat presensi, poin keaktifan, dan notulensi di ranah Sekretaris.
            </p>
          </div>

          {onOpenWalkthrough && (
            <button
              onClick={() => {
                sfx.playClick();
                onOpenWalkthrough();
              }}
              className="btn-doodle px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-slate-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-2 shadow-[2px_2px_0px_#1E293B] shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Panduan Aplikasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Big Cards: Bendahara vs Sekretaris */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        
        {/* CARD 1: RANAH BENDAHARA */}
        <div
          onClick={() => {
            sfx.playPageSwitch();
            onSelectDomain('bendahara', 'ringkasan');
          }}
          className="card-doodle bg-[#FFFBEB] hover:bg-[#FEF3C7] rounded-2xl border-3 border-slate-900 p-5 sm:p-6 shadow-[5px_5px_0px_#1E293B] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group relative"
        >
          <div className="space-y-4">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#1E293B] group-hover:rotate-6 transition-transform">
                <Wallet className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-1 bg-white border border-slate-900 rounded-md shadow-[1px_1px_0px_#1E293B]">
                Ranah Bendahara
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-900 transition-colors">
                Administrasi Kas & Keuangan
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pencatatan kas masuk & keluar, nota kwitansi, checklist iuran mingguan terhindar duplikasi, dan tagihan kolektif acara.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="bg-white/90 p-3 rounded-xl border border-slate-900 shadow-[2px_2px_0px_#1E293B]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-600" />
                  Saldo Kas
                </p>
                <p className="text-sm sm:text-base font-black text-emerald-700 font-mono truncate mt-0.5">
                  {formatRupiah(currentBalance)}
                </p>
              </div>

              <div className="bg-white/90 p-3 rounded-xl border border-slate-900 shadow-[2px_2px_0px_#1E293B]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-amber-600" />
                  Tagihan Kolektif
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
                  {activeKolektifCount} Acara
                </p>
              </div>
            </div>

            {/* Features tags */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-slate-700">
              <span className="px-2 py-0.5 bg-amber-100 rounded border border-slate-400">Ringkasan Kas</span>
              <span className="px-2 py-0.5 bg-amber-100 rounded border border-slate-400">Buku Kas & Nota</span>
              <span className="px-2 py-0.5 bg-amber-100 rounded border border-slate-400">Ceklis Iuran</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black rounded border border-emerald-600">Iuran Kolektif NEW</span>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t-2 border-slate-900/10 flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 group-hover:underline">
              Kelola Keuangan Kas
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-[1px_1px_0px_#000]">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 2: RANAH SEKRETARIS */}
        <div
          onClick={() => {
            sfx.playPageSwitch();
            onSelectDomain('sekretaris', 'keaktifan');
          }}
          className="card-doodle bg-[#F0F9FF] hover:bg-[#E0F2FE] rounded-2xl border-3 border-slate-900 p-5 sm:p-6 shadow-[5px_5px_0px_#1E293B] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group relative"
        >
          <div className="space-y-4">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-sky-300 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#1E293B] group-hover:-rotate-6 transition-transform">
                <FileText className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-1 bg-white border border-slate-900 rounded-md shadow-[1px_1px_0px_#1E293B]">
                Ranah Sekretaris
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-sky-900 transition-colors">
                Sekretariat, Presensi & Akademik
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pencatatan poin keaktifan mahasiswa, presensi kehadiran harian / rapat kelas, notulensi musyawarah, dan format surat resmi.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="bg-white/90 p-3 rounded-xl border border-slate-900 shadow-[2px_2px_0px_#1E293B]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  Top Keaktifan
                </p>
                <p className="text-sm sm:text-base font-black text-sky-900 truncate mt-0.5">
                  {topStudentLog ? `${topStudentLog.name} (${topStudentLog.points}p)` : `${members.length} Siswa`}
                </p>
              </div>

              <div className="bg-white/90 p-3 rounded-xl border border-slate-900 shadow-[2px_2px_0px_#1E293B]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3 text-emerald-600" />
                  Presensi Terakhir
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                  {latestAttendance ? latestAttendance.date : 'Belum Ada Sesi'}
                </p>
              </div>
            </div>

            {/* Features tags */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-slate-700">
              <span className="px-2 py-0.5 bg-sky-100 rounded border border-slate-400">Poin Keaktifan Siswa</span>
              <span className="px-2 py-0.5 bg-sky-100 rounded border border-slate-400">Presensi Rapat & Kelas</span>
              <span className="px-2 py-0.5 bg-sky-100 rounded border border-slate-400">Notulensi & Format Surat</span>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t-2 border-slate-900/10 flex items-center justify-between">
            <span className="text-xs font-black text-sky-900 group-hover:underline">
              Buka Sekretariat Kelas
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-[1px_1px_0px_#000]">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* Quick Summary Strip */}
      <div className="card-doodle bg-amber-50/70 p-4 rounded-xl border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="font-bold text-slate-800">
            Terdaftar {members.length} siswa dalam basis data kelas.
          </span>
        </div>
        <div className="text-slate-600 font-medium">
          Dapat beralih kapan saja antar ranah Bendahara dan Sekretaris melalui menu navigasi di atas.
        </div>
      </div>
    </div>
  );
};
