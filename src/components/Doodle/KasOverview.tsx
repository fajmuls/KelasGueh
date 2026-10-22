import React from 'react';
import { KasTransaction, ClassSettings, KasMember } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleCoin, PushPin, DoodleReceipt } from './DoodleDecorations.tsx';
import { ArrowDownRight, ArrowUpRight, PlusCircle, FileText, CheckCircle2, Printer, MessageSquare } from 'lucide-react';

interface KasOverviewProps {
  transactions: KasTransaction[];
  settings: ClassSettings;
  members: KasMember[];
  onNavigateTab: (tab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan') => void;
  onOpenNewTxModal: () => void;
  onOpenPrintModal?: () => void;
  onOpenWhatsAppModal?: () => void;
}

export const KasOverview: React.FC<KasOverviewProps> = ({
  transactions,
  settings,
  members,
  onNavigateTab,
  onOpenNewTxModal,
  onOpenPrintModal,
  onOpenWhatsAppModal,
}) => {
  const { canEditKas, isBendahara, isSuperAdmin } = useAuth();

  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense;
  const targetProgress = Math.min(100, Math.round((currentBalance / (settings.kasTargetAmount || 1)) * 100));

  // Category breakdown for expenses
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  // Calculate unpaid members this week
  const recentWeekKey = 'M4';
  const paidCount = members.filter(m => m.weeklyStatus[recentWeekKey]).length;
  const unpaidCount = members.length - paidCount;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Welcome */}
      <div className="relative card-doodle-yellow p-5 sm:p-6 rounded-lg">
        <ScotchTape className="absolute -top-3 left-8 rotate-[-2deg]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200 border border-slate-900 px-2 py-0.5 rounded-xs">
                {settings.academicYear}
              </span>
              <span className="text-xs text-slate-700 font-semibold">
                Status: {canEditKas ? (isSuperAdmin ? '👑 Super Admin Mode' : '🛡️ Bendahara Aktif') : '👀 Mode Transparansi Anggota'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Laporan Kas {settings.className}
            </h2>
            <p className="text-sm text-slate-700 mt-1 max-w-xl">
              Setiap rupiah tercatat dengan bukti nota kuitansi. Seluruh anggota berhak memantau arus kas secara terbuka.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEditKas && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenNewTxModal();
                }}
                className="btn-doodle px-4 py-2.5 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black rounded-md flex items-center gap-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catat Transaksi</span>
              </button>
            )}
            <button
              onClick={() => {
                sfx.playClick();
                onNavigateTab('bukukas');
              }}
              className="btn-doodle px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-md flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Buka Buku Kas</span>
            </button>

            {onOpenPrintModal && (
              <button
                onClick={() => {
                  sfx.playPaperRustle();
                  onOpenPrintModal();
                }}
                className="btn-doodle px-3.5 py-2.5 bg-amber-200 hover:bg-amber-300 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4 text-slate-800" />
                <span>Cetak / PDF Binder</span>
              </button>
            )}

            {onOpenWhatsAppModal && (
              <button
                onClick={() => {
                  sfx.playCardOpen();
                  onOpenWhatsAppModal();
                }}
                className="btn-doodle px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <MessageSquare className="w-4 h-4 text-emerald-800" />
                <span>Bagikan WA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Paper Cutout cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Saldo Card */}
        <div className="relative card-doodle p-5 rounded-lg bg-white">
          <div className="absolute top-3 right-3">
            <DoodleCoin className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Saldo Kas Bersih
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {formatRupiah(currentBalance)}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Kas Tersedia di Bendahara</span>
            <span className="text-emerald-700">Aman</span>
          </div>
        </div>

        {/* Total Pemasukan Card */}
        <div className="relative card-doodle-mint p-5 rounded-lg">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-200 border-2 border-slate-900 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-emerald-800" />
          </div>
          <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
            Total Pemasukan
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {formatRupiah(totalIncome)}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-xs font-bold text-emerald-950">
            <span>Iuran & Dana Masuk</span>
            <span>+ Masuk</span>
          </div>
        </div>

        {/* Total Pengeluaran Card */}
        <div className="relative card-doodle-rose p-5 rounded-lg">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-200 border-2 border-slate-900 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-rose-800" />
          </div>
          <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">
            Total Pengeluaran
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {formatRupiah(totalExpense)}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-xs font-bold text-rose-950">
            <span>Fotokopi, ATK & Acara</span>
            <span>- Keluar</span>
          </div>
        </div>

        {/* Target Kas Semester Card */}
        <div className="relative card-doodle-blue p-5 rounded-lg">
          <div className="absolute top-3 right-3">
            <PushPin className="w-6 h-6 text-sky-700" />
          </div>
          <p className="text-xs font-bold text-sky-900 uppercase tracking-wider">
            Target Kas Semester
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {targetProgress}%
          </p>
          {/* Hand-drawn progress meter */}
          <div className="mt-3">
            <div className="w-full h-3.5 bg-white border-2 border-slate-900 rounded-sm overflow-hidden p-0.5">
              <div
                className="h-full bg-amber-400 border-r-2 border-slate-900 transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-bold text-sky-900 font-mono">
              <span>{formatRupiah(currentBalance)}</span>
              <span>{formatRupiah(settings.kasTargetAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Recent Transactions Notepad & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Binder Notepad (2 cols) */}
        <div className="lg:col-span-2 relative card-doodle p-5 sm:p-6 rounded-lg bg-[#FFFDF9]">
          <ScotchTape className="absolute -top-3 right-12 rotate-3" />
          
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <DoodleReceipt className="w-5 h-5 text-slate-900" />
              <h3 className="text-lg font-black text-slate-900">
                Mutasi Kas Terbaru
              </h3>
            </div>
            <button
              onClick={() => {
                sfx.playClick();
                onNavigateTab('bukukas');
              }}
              className="text-xs font-bold text-indigo-700 hover:underline"
            >
              Lihat Semua ({transactions.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3 border-2 border-slate-800 rounded-md bg-white hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-3 shadow-[2px_2px_0px_#1E293B]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md border-2 border-slate-900 flex items-center justify-center font-bold text-xs shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-300 text-slate-900' : 'bg-rose-300 text-slate-900'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 line-clamp-1">{tx.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{tx.date}</span>
                      <span>·</span>
                      <span className="font-sans text-[11px] bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded-xs font-semibold text-slate-700">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                    tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">Oleh: {tx.recordedBy.split(' ')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Iuran Summary & Checklist Card (1 col) */}
        <div className="relative card-doodle p-5 sm:p-6 rounded-lg bg-amber-50/60">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>Status Iuran ({recentWeekKey})</span>
            </h3>
            <span className="text-xs font-bold text-amber-900 bg-amber-200 border border-slate-900 px-2 py-0.5 rounded-xs">
              Rp {settings.weeklyDuesAmount.toLocaleString('id-ID')}/mgg
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-slate-900 rounded-md shadow-[2px_2px_0px_#1E293B] mb-4 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase">Tingkat Kepatuhan Kelas</p>
            <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
              {paidCount} <span className="text-sm font-normal text-slate-500">/ {members.length} Orang Lunas</span>
            </p>
            <p className="text-xs text-rose-600 font-bold mt-1">
              {unpaidCount} anggota belum melunasi minggu ini
            </p>
          </div>

          <p className="text-xs text-slate-600 mb-3 font-medium">
            Bendahara dapat langsung mencentang bukti pembayaran iuran di tab Checklist Iuran.
          </p>

          <button
            onClick={() => {
              sfx.playClick();
              onNavigateTab('checklist');
            }}
            className="w-full btn-doodle py-2.5 px-4 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black rounded-md text-xs sm:text-sm text-center"
          >
            Buka Checklist Iuran Siswa →
          </button>
        </div>
      </div>
    </div>
  );
};
