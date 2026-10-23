import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { FinanceSummary, Transaction, Bill, Payment } from '../../../types/index.ts';
import {
  Eye,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Receipt,
  PieChart,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';
import { WhatsAppShareModal } from './WhatsAppShareModal.tsx';

export const TransparencyModule: React.FC = () => {
  const { classInfo } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFinanceSummary(),
      api.getTransactions(),
      api.getBills(),
      api.getPayments(),
    ]).then(([sum, txs, bList, pList]) => {
      setSummary(sum);
      setTransactions(txs);
      setBills(bList);
      setPayments(pList);
      setIsLoading(false);
    });
  }, []);

  const expenseAllocations = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense' && !t.deleted_at);
    const totalExp = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const map: Record<string, number> = {
      cat_print: 0,
      cat_konsumsi: 0,
      cat_perlengkapan: 0,
    };

    expenses.forEach((t) => {
      map[t.category_id] = (map[t.category_id] || 0) + t.amount;
    });

    return [
      {
        id: 'cat_print',
        name: 'Operasional & ATK',
        amount: map.cat_print || 0,
        color: 'bg-blue-600',
        percent: totalExp > 0 ? Math.round(((map.cat_print || 0) / totalExp) * 100) : 0,
      },
      {
        id: 'cat_konsumsi',
        name: 'Konsumsi & Acara Rapat',
        amount: map.cat_konsumsi || 0,
        color: 'bg-amber-500',
        percent: totalExp > 0 ? Math.round(((map.cat_konsumsi || 0) / totalExp) * 100) : 0,
      },
      {
        id: 'cat_perlengkapan',
        name: 'Sewa & Perlengkapan / Sosial',
        amount: map.cat_perlengkapan || 0,
        color: 'bg-purple-500',
        percent: totalExp > 0 ? Math.round(((map.cat_perlengkapan || 0) / totalExp) * 100) : 0,
      },
    ];
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Portal Transparansi Publik Kelas
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" /> Transparansi Kas & Neraca Terbuka
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seluruh mutasi pemasukan dan pengeluaran kas kelas dipublikasikan secara transparan, akuntabel, dan dapat diverifikasi oleh setiap anggota.
          </p>
        </div>

        <button
          onClick={() => setIsWaModalOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Bagikan WA</span>
        </button>
      </div>

      {/* Saldo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-sm">
          <span className="text-[10px] font-medium text-emerald-100 uppercase tracking-wider">
            Saldo Kas Riil
          </span>
          <p className="text-2xl font-bold mt-1">
            Rp {(summary?.balance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-emerald-200 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Terekonsiliasi
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Pemasukan
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi iuran</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Pengeluaran
          </span>
          <p className="text-xl font-bold text-rose-600 mt-1">
            Rp {(summary?.totalExpense || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Operasional & ATK</p>
        </div>
      </div>

      {/* Rincian Kategori Pengeluaran */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-blue-600" /> Alokasi Pengeluaran
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {expenseAllocations.map((alloc) => (
            <div key={alloc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-500 uppercase font-bold">{alloc.name}</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                Rp {alloc.amount.toLocaleString('id-ID')}
              </p>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className={`${alloc.color} h-full transition-all duration-300`}
                  style={{ width: `${alloc.percent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">
                {alloc.percent}% dari total
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Log Mutasi Terbuka */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Riwayat Transaksi Lengkap
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total {transactions.length} Mutasi</span>
        </div>

        <div className="overflow-x-auto max-h-[500px] relative">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
              <tr>
                <th className="py-2 px-3.5">Tanggal</th>
                <th className="py-2 px-3.5">Keterangan</th>
                <th className="py-2 px-3.5">Kategori</th>
                <th className="py-2 px-3.5 text-center">Struk</th>
                <th className="py-2 px-3.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3.5 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                    {new Date(t.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                  </td>
                  <td className="py-2 px-3.5">
                    <div className="font-bold text-slate-900 leading-tight">{t.description}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">{t.code}</div>
                  </td>
                  <td className="py-2 px-3.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                      {t.category_name}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-center">
                    {t.receipt_url ? (
                      <button
                        onClick={() => setSelectedReceipt(t.receipt_url)}
                        className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        Buka
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td
                    className={`py-2 px-3.5 text-right font-bold font-mono text-[12px] tabular-nums ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Receipt Image */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Bukti Struk Pembelian / Nota Keuangan"
      >
        {selectedReceipt && (
          <div className="space-y-3 text-center">
            <img
              src={selectedReceipt}
              alt="Bukti Nota Kas"
              className="max-h-96 w-auto mx-auto rounded-xl border border-slate-200 object-contain shadow-xs"
            />
            <p className="text-xs text-slate-500">
              Setiap pengeluaran kas wajib disertai bukti nota/faktur resmi.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal: WhatsApp Share */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        classInfo={classInfo}
        transactions={transactions}
        bills={bills}
        payments={payments}
        summary={summary}
      />
    </div>
  );
};
