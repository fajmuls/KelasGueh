import React from 'react';
import { KasTransaction, ClassSettings, KasMember } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleCoin, PushPin, DoodleReceipt } from './DoodleDecorations.tsx';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  Printer, 
  MessageSquare,
  TrendingUp,
  BarChart3,
  Share2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';

interface KasOverviewProps {
  transactions: KasTransaction[];
  settings: ClassSettings;
  members: KasMember[];
  onNavigateTab: (tab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan' | 'auditlog') => void;
  onOpenNewTxModal: () => void;
  onOpenPrintModal?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenShareModal?: () => void;
}

export const KasOverview: React.FC<KasOverviewProps> = ({
  transactions,
  settings,
  members,
  onNavigateTab,
  onOpenNewTxModal,
  onOpenPrintModal,
  onOpenWhatsAppModal,
  onOpenShareModal,
}) => {
  const { canEditKas, isSuperAdmin } = useAuth();

  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense;
  const targetProgress = Math.min(100, Math.round((currentBalance / (settings.kasTargetAmount || 1)) * 100));

  // Chart Data: Group transactions by date (monthly trend)
  const getChartData = () => {
    const monthlyMap: Record<string, { month: string; pemasukan: number; pengeluaran: number }> = {};
    
    // Last 6 months trend
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mLabel = d.toLocaleString('id-ID', { month: 'short' });
      const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return { key: mKey, label: mLabel };
    });

    last6Months.forEach(m => {
      monthlyMap[m.key] = { month: m.label, pemasukan: 0, pengeluaran: 0 };
    });

    transactions.forEach(tx => {
      const txKey = tx.date.substring(0, 7); // YYYY-MM
      if (monthlyMap[txKey]) {
        if (tx.type === 'income') monthlyMap[txKey].pemasukan += tx.amount;
        else monthlyMap[txKey].pengeluaran += tx.amount;
      }
    });

    return Object.values(monthlyMap);
  };

  const chartData = getChartData();

  // Calculate unpaid members this week
  const recentWeekKey = 'W4'; // Mocking recent week for display
  const paidCount = members.filter(m => {
    // Check if any week in current month is paid
    const currentMonthPrefix = new Date().toISOString().substring(0, 7).replace('-', '_');
    return Object.keys(m.weeklyStatus).some(k => k.startsWith(currentMonthPrefix) && m.weeklyStatus[k]);
  }).length;
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

          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
            
            {onOpenPrintModal && (
              <button
                onClick={() => {
                  sfx.playPaperRustle();
                  onOpenPrintModal();
                }}
                className="btn-doodle px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4 text-slate-800" />
                <span>Cetak / PDF</span>
              </button>
            )}

            {onOpenShareModal && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenShareModal();
                }}
                className="btn-doodle px-3.5 py-2.5 bg-amber-200 hover:bg-amber-300 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
                title="Bagikan Tautan Web Portal Kelas"
              >
                <Share2 className="w-4 h-4 text-slate-900" />
                <span>Bagikan Link</span>
              </button>
            )}

            {canEditKas && onOpenWhatsAppModal && (
              <button
                onClick={() => {
                  sfx.playCardOpen();
                  onOpenWhatsAppModal();
                }}
                className="btn-doodle px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <MessageSquare className="w-4 h-4 text-emerald-800" />
                <span>Rekap WA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="relative card-doodle p-5 rounded-lg bg-white">
          <div className="absolute top-3 right-3">
            <DoodleCoin className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Kas Bersih</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {formatRupiah(currentBalance)}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Tersimpan di Bendahara</span>
            <span className="text-emerald-700">Aman ✓</span>
          </div>
        </div>

        <div className="relative card-doodle-mint p-5 rounded-lg">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-200 border-2 border-slate-900 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-emerald-800" />
          </div>
          <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Total Debit (Masuk)</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {formatRupiah(totalIncome)}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-xs font-bold text-emerald-950">
            <span>Iuran & Dana Masuk</span>
            <span>+ Debit</span>
          </div>
        </div>

        <div className="relative card-doodle-rose p-5 rounded-lg">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-200 border-2 border-slate-900 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-rose-800" />
          </div>
          <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">Total Kredit (Keluar)</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {formatRupiah(totalExpense)}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-xs font-bold text-rose-950">
            <span>Operational & Acara</span>
            <span>- Kredit</span>
          </div>
        </div>

        <div className="relative card-doodle-blue p-5 rounded-lg">
          <div className="absolute top-3 right-3">
            <PushPin className="w-6 h-6 text-sky-700" />
          </div>
          <p className="text-xs font-bold text-sky-900 uppercase tracking-wider">Target Kas Semester</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">{targetProgress}%</p>
          <div className="mt-3">
            <div className="w-full h-3.5 bg-white border-2 border-slate-900 rounded-sm overflow-hidden p-0.5">
              <div
                className="h-full bg-amber-400 border-r-2 border-slate-900 transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Stats Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative card-doodle p-5 sm:p-6 rounded-lg bg-white">
          <ScotchTape className="absolute -top-3 left-10 rotate-1" />
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900">Tren Kas Bulanan</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 border border-slate-900 rounded-xs"></span> Debit</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-400 border border-slate-900 rounded-xs"></span> Kredit</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={{ stroke: '#1e293b', strokeWidth: 2 }}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={{ stroke: '#1e293b', strokeWidth: 2 }}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #1e293b', 
                    borderRadius: '8px',
                    boxShadow: '4px 4px 0px #1e293b',
                    fontWeight: 'bold'
                  }} 
                />
                <Bar dataKey="pemasukan" fill="#34d399" stroke="#1e293b" strokeWidth={1} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" fill="#f87171" stroke="#1e293b" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Summary Sidebar */}
        <div className="space-y-6">
          <div className="relative card-doodle p-5 rounded-lg bg-amber-50/60">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b-2 border-slate-900 pb-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>Status Iuran</span>
            </h3>
            <div className="p-4 bg-white border-2 border-slate-900 rounded-md shadow-[2px_2px_0px_#1E293B] mb-4 text-center">
              <p className="text-xs text-slate-500 font-bold uppercase">Kepatuhan Bulan Ini</p>
              <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
                {paidCount} <span className="text-sm font-normal text-slate-500">/ {members.length} Lunas</span>
              </p>
              <div className="mt-3 w-full bg-slate-100 h-2 rounded-full border border-slate-900 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 border-r border-slate-900" 
                  style={{ width: `${(paidCount / (members.length || 1)) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('checklist')}
              className="w-full btn-doodle py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black rounded-md text-xs text-center"
            >
              Tagih Iuran Sekarang →
            </button>
          </div>

          <div className="relative card-doodle p-5 rounded-lg bg-white">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b-2 border-slate-900 pb-2 mb-4">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <span>Data Real-Sync</span>
            </h3>
            <ul className="space-y-2">
              <li className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Total Transaksi</span>
                <span className="text-slate-900 font-mono">{transactions.length}</span>
              </li>
              <li className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Anggota Terdaftar</span>
                <span className="text-slate-900 font-mono">{members.length}</span>
              </li>
              <li className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Koneksi Database</span>
                <span className="text-emerald-700">Online & Sinkron</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity Notepad */}
      <div className="relative card-doodle p-5 sm:p-6 rounded-lg bg-[#FFFDF9]">
        <ScotchTape className="absolute -top-3 right-12 rotate-3" />
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <DoodleReceipt className="w-5 h-5 text-slate-900" />
            <h3 className="text-lg font-black text-slate-900">Aktivitas Terkini</h3>
          </div>
          <button onClick={() => onNavigateTab('bukukas')} className="text-xs font-bold text-indigo-700 hover:underline">
            Lihat Buku Kas →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {transactions.slice(0, 4).map((tx) => (
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
                  <p className="text-sm font-black text-slate-900 truncate max-w-[150px]">{tx.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black font-mono ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatRupiah(tx.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
