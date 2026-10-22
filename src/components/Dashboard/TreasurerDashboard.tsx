import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { FinanceSummary, Transaction, Bill, Payment } from '../../types/index.ts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  FileSpreadsheet,
  ArrowRight,
  Receipt,
  Eye,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';

interface TreasurerDashboardProps {
  onNavigate: (module: string) => void;
  onOpenCreateTx?: () => void;
  onOpenCreateBill?: () => void;
}

export const TreasurerDashboard: React.FC<TreasurerDashboardProps> = ({
  onNavigate,
  onOpenCreateTx,
  onOpenCreateBill,
}) => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [sum, bList, pList] = await Promise.all([
          api.getFinanceSummary(),
          api.getBills(),
          api.getPayments(),
        ]);
        setSummary(sum);
        setBills(bList);
        setPayments(pList);
      } catch (err) {
        console.error('Error loading treasurer dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const pendingVerificationCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Financial Actions */}
      <div className="p-6 bg-[#0F172A] rounded-xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Treasury Center
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Bendahara Kelas</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Pengelolaan buku besar kas, penagihan iuran bulanan, verifikasi transfer, dan transparansi neraca.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('finance')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Kelola Kas & Transaksi
          </button>
          <button
            onClick={() => onNavigate('transparency')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <Eye className="w-4 h-4" /> Halaman Transparansi
          </button>
        </div>
      </div>

      {/* 4 Financial Stat Cards: Saldo, Pemasukan, Pengeluaran, Kas Bulan Berjalan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Saldo Kas</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Rp {(summary?.balance || 0).toLocaleString('id-ID')}
          </h3>
          <p className="mt-1 text-sm text-emerald-600 font-medium">+12.5% vs bulan lalu</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pemasukan</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
          </h3>
          <p className="mt-1 text-sm text-indigo-600 font-medium">Akumulasi penerimaan kas</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pengeluaran</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Rp {(summary?.totalExpense || 0).toLocaleString('id-ID')}
          </h3>
          <p className="mt-1 text-sm text-rose-600 font-medium">Operasional & kegiatan</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tagihan Pending</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {pendingVerificationCount}
          </h3>
          <p className="mt-1 text-sm text-amber-600 font-medium">Menunggu Verifikasi</p>
        </div>
      </div>

      {/* Grid: Anggota Sudah vs Belum Bayar & Grafik Aliran Kas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Pembayaran Mahasiswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Status Pembayaran Iuran</h3>
            <span className="text-xs text-slate-500 font-medium">Bulan Ini</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Sudah Bayar
              </div>
              <p className="text-2xl font-bold text-emerald-900 mt-2">
                {summary?.paidMembersCount || 0}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Mahasiswa</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
                <XCircle className="w-4 h-4" /> Belum Bayar
              </div>
              <p className="text-2xl font-bold text-rose-900 mt-2">
                {summary?.unpaidMembersCount || 0}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">Mahasiswa</p>
            </div>
          </div>

          {pendingVerificationCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>{pendingVerificationCount} bukti transfer perlu diverifikasi</span>
              <button
                onClick={() => onNavigate('finance')}
                className="font-bold underline cursor-pointer"
              >
                Cek
              </button>
            </div>
          )}

          <button
            onClick={() => onNavigate('reports')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Lihat Daftar Tunggakan
          </button>
        </div>

        {/* Grafik / Tren Kas Bulanan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren Pemasukan & Pengeluaran Kas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Perbandingan arus kas 4 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Pengeluaran
              </span>
            </div>
          </div>

          {/* Clean Bar Visualizer */}
          <div className="pt-4 space-y-4">
            {summary?.monthlyChart.map((c, i) => {
              const maxVal = 1000000;
              const inWidth = Math.min(100, Math.round((c.income / maxVal) * 100));
              const exWidth = Math.min(100, Math.round((c.expense / maxVal) * 100));

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{c.month} 2026</span>
                    <span className="text-slate-500 font-normal">
                      Masuk: Rp {c.income.toLocaleString('id-ID')} | Keluar: Rp {c.expense.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${inWidth}%` }}
                      />
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${exWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru (Ledger Highlights) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" /> Transaksi Terakhir
          </h4>
          <button
            onClick={() => onNavigate('finance')}
            className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-widest font-bold">
                <th className="pb-3 font-bold">Kode / Tanggal</th>
                <th className="pb-3 font-bold">Keterangan</th>
                <th className="pb-3 font-bold">Kategori</th>
                <th className="pb-3 font-bold">Tipe</th>
                <th className="pb-3 text-right font-bold">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary?.recentTransactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 text-xs">
                    <span className="font-mono font-medium text-slate-700">{tx.code}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </td>
                  <td className="py-3 font-medium text-slate-900 text-xs">{tx.description}</td>
                  <td className="py-3 text-slate-500 text-xs">{tx.category_name}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tx.type === 'income' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-bold text-xs ${tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
