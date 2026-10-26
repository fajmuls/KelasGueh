import React, { useState } from 'react';
import { KasTransaction, KasMember, ClassSettings } from '../../types/kas.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, PushPin } from './DoodleDecorations.tsx';
import { showToast } from '../UI/DoodleDialog.tsx';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Share2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Coins
} from 'lucide-react';

interface KasRecapViewProps {
  transactions: KasTransaction[];
  members: KasMember[];
  settings: ClassSettings;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const KasRecapView: React.FC<KasRecapViewProps> = ({
  transactions,
  members,
  settings
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'bulanan' | 'semester'>('bulanan');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper to compute monthly financial summary
  const getMonthlyBreakdown = () => {
    return MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const monthKey = `${selectedYear}_${monthNum}`;
      
      // Determine applicable weekly dues amount for this month
      const duesPerWeek = settings.monthlyDuesOverrides?.[monthKey] !== undefined
        ? settings.monthlyDuesOverrides[monthKey]
        : settings.weeklyDuesAmount;

      const isCustomDues = settings.monthlyDuesOverrides?.[monthKey] !== undefined;

      // Filter transactions in this month & year
      const monthPrefix = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
      const monthTxs = transactions.filter(t => t.date?.startsWith(monthPrefix));

      const iuranIncome = monthTxs
        .filter(t => t.type === 'income' && (t.category === 'Iuran Kas' || t.notes?.startsWith('LINKED_IURAN')))
        .reduce((sum, t) => sum + t.amount, 0);

      const otherIncome = monthTxs
        .filter(t => t.type === 'income' && !(t.category === 'Iuran Kas' || t.notes?.startsWith('LINKED_IURAN')))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = monthTxs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netBalance = iuranIncome + otherIncome - totalExpense;

      return {
        monthNum,
        monthName: name,
        duesPerWeek,
        isCustomDues,
        iuranIncome,
        otherIncome,
        totalIncome: iuranIncome + otherIncome,
        totalExpense,
        netBalance,
        txCount: monthTxs.length
      };
    });
  };

  const monthlyData = getMonthlyBreakdown();

  // Yearly Totals
  const totalYearIncome = monthlyData.reduce((sum, m) => sum + m.totalIncome, 0);
  const totalYearExpense = monthlyData.reduce((sum, m) => sum + m.totalExpense, 0);
  const netYearBalance = totalYearIncome - totalYearExpense;

  // Semester Breakdown:
  // Semester Genap: Januari - Juni (Bulan 1-6)
  // Semester Ganjil: Juli - Desember (Bulan 7-12)
  const semesterGenap = monthlyData.slice(0, 6);
  const semesterGanjil = monthlyData.slice(6, 12);

  const calcSemesterStats = (months: typeof monthlyData, title: string) => {
    const income = months.reduce((sum, m) => sum + m.totalIncome, 0);
    const expense = months.reduce((sum, m) => sum + m.totalExpense, 0);
    const net = income - expense;
    return {
      title,
      income,
      expense,
      net,
      txCount: months.reduce((sum, m) => sum + m.txCount, 0)
    };
  };

  const genapStats = calcSemesterStats(semesterGenap, `Semester Genap (Jan - Jun ${selectedYear})`);
  const ganjilStats = calcSemesterStats(semesterGanjil, `Semester Ganjil (Jul - Des ${selectedYear})`);

  // WhatsApp Recap Copy
  const handleCopyWhatsAppRecap = () => {
    sfx.playClick();
    const rows = monthlyData
      .filter(m => m.totalIncome > 0 || m.totalExpense > 0)
      .map(m => `• *${m.monthName}:* Masuk ${formatRupiah(m.totalIncome)} | Keluar ${formatRupiah(m.totalExpense)} (Net: ${formatRupiah(m.netBalance)})`)
      .join('\n');

    const message =
      `📊 *LAPORAN REKAPITULASI KAS TAHUNAN*\n` +
      `*${settings.className} (${selectedYear})*\n\n` +
      `💰 *Total Pemasukan:* ${formatRupiah(totalYearIncome)}\n` +
      `💸 *Total Pengeluaran:* ${formatRupiah(totalYearExpense)}\n` +
      `📈 *Surplus/Saldo Bersih:* ${formatRupiah(netYearBalance)}\n\n` +
      `*Rincian Per Semester:*\n` +
      `1. *${genapStats.title}:* Masuk ${formatRupiah(genapStats.income)} | Keluar ${formatRupiah(genapStats.expense)}\n` +
      `2. *${ganjilStats.title}:* Masuk ${formatRupiah(ganjilStats.income)} | Keluar ${formatRupiah(ganjilStats.expense)}\n\n` +
      `*Rincian Bulanan:*\n` +
      (rows || '- Belum ada transaksi tercatat di tahun ini -') +
      `\n\n_— Dicatat via Buku Kas Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Teks rekap bulanan & semester berhasil disalin!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="card-doodle bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />
        <PushPin className="top-3 right-4 absolute" color="amber" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-amber-200 text-slate-900 border border-slate-900 rounded">
                Ranah Bendahara
              </span>
              <span className="text-xs font-bold text-slate-500">
                Laporan & Evaluasi Periode
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-600" />
              <span>Rekap Kas Bulanan & Semester</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Tinjau perputaran uang kas kelas per bulan dan evaluasi komparasi Semester Ganjil vs Semester Genap dengan penyesuaian nominal iuran fleksibel.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white font-black text-xs shadow-[1.5px_1.5px_0px_#000]"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(yr => (
                <option key={yr} value={yr}>Tahun {yr}</option>
              ))}
            </select>

            <button
              onClick={handleCopyWhatsAppRecap}
              className="btn-doodle px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Salin Rekap WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-2">
        <button
          onClick={() => {
            sfx.playToggle();
            setViewMode('bulanan');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
            viewMode === 'bulanan'
              ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#000] -translate-y-0.5'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rekap 12 Bulan ({selectedYear})
        </button>

        <button
          onClick={() => {
            sfx.playToggle();
            setViewMode('semester');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
            viewMode === 'semester'
              ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#000] -translate-y-0.5'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rekap Per Semester (Ganjil & Genap)
        </button>
      </div>

      {/* VIEW 1: 12-MONTH TABLE */}
      {viewMode === 'bulanan' && (
        <div className="space-y-4">
          <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFFDF5] border-b-2 border-slate-900 font-black text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Bulan</th>
                    <th className="py-2.5 px-3 text-center">Tarif Iuran/Mgg</th>
                    <th className="py-2.5 px-3 text-right">Pemasukan Iuran</th>
                    <th className="py-2.5 px-3 text-right">Pemasukan Lain</th>
                    <th className="py-2.5 px-3 text-right">Total Pengeluaran</th>
                    <th className="py-2.5 px-4 text-right">Surplus / Defisit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {monthlyData.map(m => (
                    <tr key={m.monthNum} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {m.monthName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          m.isCustomDues
                            ? 'bg-purple-100 text-purple-900 border-purple-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {formatRupiah(m.duesPerWeek)}
                          {m.isCustomDues && ' ★'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                        {formatRupiah(m.iuranIncome)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-700">
                        {formatRupiah(m.otherIncome)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                        {formatRupiah(m.totalExpense)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`font-mono font-black ${
                          m.netBalance > 0
                            ? 'text-emerald-700'
                            : m.netBalance < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}>
                          {m.netBalance > 0 ? '+' : ''}{formatRupiah(m.netBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer Totals */}
                <tfoot className="bg-[#FFFDF5] border-t-2 border-slate-900 font-black text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                      Total Rekap Tahun {selectedYear}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-800">
                      {formatRupiah(monthlyData.reduce((s, m) => s + m.iuranIncome, 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sky-800">
                      {formatRupiah(monthlyData.reduce((s, m) => s + m.otherIncome, 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-800">
                      {formatRupiah(totalYearExpense)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      <span className={`px-2.5 py-1 rounded-md border ${
                        netYearBalance >= 0
                          ? 'bg-emerald-200 text-emerald-950 border-emerald-600'
                          : 'bg-rose-200 text-rose-950 border-rose-600'
                      }`}>
                        {netYearBalance >= 0 ? '+' : ''}{formatRupiah(netYearBalance)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic px-1">
            Catatan: Tanda bintang (★) menunjukkan bulan tersebut menggunakan tarif iuran spesifik yang diatur berbeda dari standar kelas.
          </p>
        </div>
      )}

      {/* VIEW 2: SEMESTER COMPARISON */}
      {viewMode === 'semester' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* SEMESTER GENAP (Jan - Jun) */}
          <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] p-5 space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-sky-100 text-sky-900 border border-slate-900 rounded">
                  Periode 1
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Semester Genap ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500">Januari s/d Juni {selectedYear}</p>
              </div>
              <Coins className="w-8 h-8 text-sky-600" />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  Total Pemasukan
                </span>
                <span className="font-black font-mono text-emerald-800 text-sm">
                  {formatRupiah(genapStats.income)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  Total Pengeluaran
                </span>
                <span className="font-black font-mono text-rose-800 text-sm">
                  {formatRupiah(genapStats.expense)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFFDF5] border-2 border-slate-900 text-xs shadow-[2px_2px_0px_#1E293B]">
                <span className="font-black text-slate-900">
                  Surplus / Saldo Bersih
                </span>
                <span className={`font-black font-mono text-base ${
                  genapStats.net >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {genapStats.net >= 0 ? '+' : ''}{formatRupiah(genapStats.net)}
                </span>
              </div>
            </div>
          </div>

          {/* SEMESTER GANJIL (Jul - Des) */}
          <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] p-5 space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 border border-slate-900 rounded">
                  Periode 2
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Semester Ganjil ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500">Juli s/d Desember {selectedYear}</p>
              </div>
              <Coins className="w-8 h-8 text-amber-600" />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  Total Pemasukan
                </span>
                <span className="font-black font-mono text-emerald-800 text-sm">
                  {formatRupiah(ganjilStats.income)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  Total Pengeluaran
                </span>
                <span className="font-black font-mono text-rose-800 text-sm">
                  {formatRupiah(ganjilStats.expense)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFFDF5] border-2 border-slate-900 text-xs shadow-[2px_2px_0px_#1E293B]">
                <span className="font-black text-slate-900">
                  Surplus / Saldo Bersih
                </span>
                <span className={`font-black font-mono text-base ${
                  ganjilStats.net >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {ganjilStats.net >= 0 ? '+' : ''}{formatRupiah(ganjilStats.net)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
