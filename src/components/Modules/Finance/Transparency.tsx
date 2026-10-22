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
          className="px-4 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4 text-[#25D366]" />
          <span>Bagikan ke WhatsApp</span>
        </button>
      </div>

      {/* Saldo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-sm">
          <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
            Saldo Kas Riil Saat Ini
          </span>
          <p className="text-3xl font-bold mt-2">
            Rp {(summary?.balance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saldo riil terekonsiliasi
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Seluruh Pemasukan
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Iuran mahasiswa & sponsor</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Seluruh Pengeluaran
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            Rp {(summary?.totalExpense || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Operasional, ATK, & konsumsi</p>
        </div>
      </div>

      {/* Rincian Kategori Pengeluaran */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-blue-600" /> Rincian Alokasi Pengeluaran Kas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {expenseAllocations.map((alloc) => (
            <div key={alloc.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500">{alloc.name}</p>
              <p className="text-base font-bold text-slate-800 mt-1">
                Rp {alloc.amount.toLocaleString('id-ID')}
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`${alloc.color} h-full transition-all duration-300`}
                  style={{ width: `${alloc.percent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">
                {alloc.percent}% dari total beban
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Log Mutasi Terbuka */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" /> Catatan Riwayat Transaksi Lengkap
          </h3>
          <span className="text-xs text-slate-400">Total {transactions.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kode</th>
                <th className="p-3.5">Keterangan</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Bukti Struk</th>
                <th className="p-3.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </td>
                  <td className="p-3.5 font-mono font-medium text-slate-700">{t.code}</td>
                  <td className="p-3.5 font-medium text-slate-900">{t.description}</td>
                  <td className="p-3.5">
                    <Badge variant={t.type === 'income' ? 'success' : 'purple'}>
                      {t.category_name}
                    </Badge>
                  </td>
                  <td className="p-3.5">
                    {t.receipt_url ? (
                      <button
                        onClick={() => setSelectedReceipt(t.receipt_url)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Buka Struk
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td
                    className={`p-3.5 text-right font-bold ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
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
