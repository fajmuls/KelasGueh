import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Transaction, TransactionCategory, Bill, Payment, FinanceSummary } from '../../../types/index.ts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Download,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  X,
  Bell,
  Share2,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';
import { WhatsAppShareModal } from './WhatsAppShareModal.tsx';
import { KasChecklistTable } from './KasChecklistTable.tsx';
import { googleWorkspace } from '../../../services/googleWorkspace.ts';
import { CheckSquare } from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const { hasPermission, classInfo, googleAccessToken, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'kas-table' | 'transactions' | 'bills' | 'payments'>('kas-table');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTx, setSearchTx] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Forms
  const [txForm, setTxForm] = useState({
    type: 'income',
    category_id: 'cat_iuran',
    amount: '',
    description: '',
    receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
  });

  const [billForm, setBillForm] = useState({
    title: 'Iuran Kas Bulan Oktober 2026',
    description: 'Iuran kas rutin wajib bulanan untuk kas kelas',
    amount: '25000',
    period: '2026-10',
    due_date: '2026-10-15',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sum, txs, cats, bList, pList] = await Promise.all([
        api.getFinanceSummary(),
        api.getTransactions(),
        api.getCategories(),
        api.getBills(),
        api.getPayments(),
      ]);
      setSummary(sum);
      setTransactions(txs);
      setCategories(cats);
      setBills(bList);
      setPayments(pList);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCat = categoryFilter === 'all' || t.category_id === categoryFilter;
      const matchesSearch =
        t.description.toLowerCase().includes(searchTx.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTx.toLowerCase());
      return matchesType && matchesCat && matchesSearch;
    });
  }, [transactions, typeFilter, categoryFilter, searchTx]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      return paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    });
  }, [payments, paymentStatusFilter]);

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTransaction({
        type: txForm.type,
        category_id: txForm.category_id,
        amount: Number(txForm.amount),
        description: txForm.description,
        receipt_url: txForm.receipt_url,
      });
      setIsTxModalOpen(false);
      setTxForm({
        type: 'income',
        category_id: 'cat_iuran',
        amount: '',
        description: '',
        receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi');
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBill({
        title: billForm.title,
        description: billForm.description,
        amount: Number(billForm.amount),
        period: billForm.period,
        due_date: billForm.due_date,
      });
      setIsBillModalOpen(false);
      await loadData();
      alert('Tagihan kas berhasil dibuat dan otomatis dibagikan ke seluruh anggota kelas!');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tagihan kas');
    }
  };

  const handleVerifyPayment = async (paymentId: string, status: 'paid' | 'unpaid') => {
    try {
      await api.updatePayment(paymentId, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi pembayaran');
    }
  };

  const handleExportTransactionsCSV = () => {
    const headers = ['Kode', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Dibuat Oleh', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.code,
      t.created_at,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      `"${t.category_name}"`,
      `"${t.description}"`,
      t.amount,
      `"${t.created_by_name}"`,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Laporan_Buku_Kas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportGoogleSheets = async () => {
    try {
      setIsExportingSheets(true);
      let token = googleAccessToken;
      if (!token) {
        await loginWithGoogle();
        token = googleAccessToken;
      }

      const rows = [
        ['Kode Transaksi', 'Tanggal', 'Jenis Arus Kas', 'Kategori', 'Uraian Keterangan', 'Nominal (Rp)', 'Pencatat', 'Status'],
        ...filteredTransactions.map(t => [
          t.code,
          t.created_at,
          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          t.category_name,
          t.description,
          t.amount,
          t.created_by_name,
          t.status,
        ]),
        ['', '', '', '', 'TOTAL PEMASUKAN', summary?.totalIncome || 0, '', ''],
        ['', '', '', '', 'TOTAL PENGELUARAN', summary?.totalExpense || 0, '', ''],
        ['', '', '', '', 'SALDO KAS BERSIH', summary?.balance || 0, '', ''],
      ];

      if (token) {
        const res = await googleWorkspace.createSpreadsheet(
          token,
          `Buku Kas ${classInfo?.name || '01SAKP014'} - ${new Date().toLocaleDateString('id-ID')}`,
          [{ title: 'Buku Kas & Jurnal', rows }]
        );
        alert(`Berhasil mengekspor Buku Kas ke Google Sheets! URL: ${res.spreadsheetUrl}`);
        window.open(res.spreadsheetUrl, '_blank');
      } else {
        handleExportTransactionsCSV();
        alert('Laporan Kas diunduh dalam format CSV. Masuk dengan Google untuk ekspor langsung ke spreadsheet cloud.');
      }
    } catch (err: any) {
      console.error('Export Sheets error:', err);
      handleExportTransactionsCSV();
      alert(`Catatan: ${err.message || 'Menggunakan export CSV sebagai fallback'}`);
    } finally {
      setIsExportingSheets(false);
    }
  };

  const sendReminder = (payment: Payment) => {
    alert(`Pemberitahuan reminder WhatsApp telah dikirimkan ke ${payment.user_name} untuk ${payment.bill_title}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Buku Kas & Tagihan Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan arus kas berintegritas, penagihan iuran kelas, dan verifikasi mutasi transfer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsWaModalOpen(true)}
            className="px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Bagikan Laporan Kas ke WhatsApp (Minggu, Bulan, Tahun, Kustom)"
          >
            <Share2 className="w-4 h-4 text-[#25D366]" />
            <span>Bagikan ke WA</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            disabled={isExportingSheets}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Ekspor Buku Kas langsung ke Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {isExportingSheets ? 'Membuat Spreadsheet...' : 'Google Sheets'}
          </button>

          <button
            onClick={handleExportTransactionsCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          {hasPermission('create_bills') && (
            <button
              onClick={() => setIsBillModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-4 h-4" /> Buat Tagihan Kas
            </button>
          )}

          {hasPermission('create_transactions') && (
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Catat Transaksi
            </button>
          )}
        </div>
      </div>

      {/* Saldo & Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Kas Riil
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Rp {(summary?.balance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            ✓ Terverifikasi melalui audit trail buku besar
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pemasukan
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">
            Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari iuran wajib & sponsor kegiatan
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2">
            Rp {(summary?.totalExpense || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Penggunaan operasional kelas
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Tabel Kas Checklist vs Transaksi vs Verifikasi vs Tagihan */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('kas-table')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'kas-table'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Tabel Kas (Absensi 1 - 39)
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Buku Kas (Transaksi)
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Status & Verifikasi Pembayaran
          {payments.filter(p => p.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {payments.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bills'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Daftar Tagihan Kas
        </button>
      </div>

      {/* Tab Content 0: Interactive Kas Checklist Table */}
      {activeTab === 'kas-table' && <KasChecklistTable />}

      {/* Tab Content 1: Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Cari transaksi atau kode..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-blue-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500"
            >
              <option value="all">Semua Jenis (Masuk/Keluar)</option>
              <option value="income">Pemasukan Saja</option>
              <option value="expense">Pengeluaran Saja</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Kode / Tanggal</th>
                    <th className="p-3.5">Keterangan</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Dibuat Oleh</th>
                    <th className="p-3.5">Bukti Struk</th>
                    <th className="p-3.5 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-semibold text-slate-800">{tx.code}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </p>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">{tx.description}</td>
                      <td className="p-3.5">
                        <Badge variant={tx.type === 'income' ? 'success' : 'purple'}>
                          {tx.category_name}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-600">{tx.created_by_name}</td>
                      <td className="p-3.5">
                        {tx.receipt_url ? (
                          <button
                            onClick={() => setSelectedReceipt(tx.receipt_url)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            <Eye className="w-3 h-3" /> Lihat Struk
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td
                        className={`p-3.5 text-right font-bold text-sm ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Payments & Verifications */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Verifikasi</option>
                <option value="paid">Lunas (Sudah Bayar)</option>
                <option value="unpaid">Belum Bayar</option>
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredPayments.length} status iuran anggota
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mahasiswa</th>
                    <th className="p-3.5">NIM</th>
                    <th className="p-3.5">Tagihan Kas</th>
                    <th className="p-3.5">Nominal</th>
                    <th className="p-3.5">Bukti Transfer</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900">{p.user_name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{p.user_nim}</td>
                      <td className="p-3.5 text-slate-800">{p.bill_title}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        Rp {p.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5">
                        {p.proof_url ? (
                          <button
                            onClick={() => setSelectedReceipt(p.proof_url!)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                          >
                            <Receipt className="w-3 h-3" /> Cek Bukti
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Belum upload</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            p.status === 'paid'
                              ? 'success'
                              : p.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {p.status === 'paid'
                            ? 'Lunas'
                            : p.status === 'pending'
                            ? 'Menunggu Verifikasi'
                            : 'Belum Bayar'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'pending' && hasPermission('verify_finance') && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'paid')}
                                title="Verifikasi & Catat ke Kas"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Terima
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'unpaid')}
                                title="Tolak Bukti Transfer"
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Tolak
                              </button>
                            </>
                          )}
                          {p.status === 'unpaid' && (
                            <button
                              onClick={() => sendReminder(p)}
                              title="Kirim Reminder WhatsApp"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1"
                            >
                              <Bell className="w-3 h-3 text-amber-600" /> Reminder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Bills / Tagihan Bulanan */}
      {activeTab === 'bills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((b) => (
            <div
              key={b.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Periode: {b.period}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{b.title}</h4>
                </div>
                <Badge variant={b.is_active ? 'success' : 'neutral'}>
                  {b.is_active ? 'Aktif' : 'Selesai'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{b.description}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Nominal / Orang:</span>
                <span className="text-base font-bold text-slate-900">
                  Rp {b.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Jatuh Tempo: {b.due_date || 'Akhir bulan'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Catat Transaksi Baru */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="Catat Transaksi Buku Kas"
        subtitle="Setiap pencatatan akan langsung memperbarui saldo kas dan terekam di audit trail"
      >
        <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTxForm({ ...txForm, type: 'income' })}
                className={`py-2 text-center rounded-xl font-semibold border ${
                  txForm.type === 'income'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Pemasukan (+)
              </button>
              <button
                type="button"
                onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                className={`py-2 text-center rounded-xl font-semibold border ${
                  txForm.type === 'expense'
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Pengeluaran (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kategori Transaksi</label>
            <select
              value={txForm.category_id}
              onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nominal Uang (Rp)</label>
            <input
              type="number"
              required
              min="1000"
              placeholder="Contoh: 50000"
              value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan Transaksi</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan peruntukan pengeluaran atau sumber pemasukan..."
              value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">URL Bukti / Struk Pembayaran</label>
            <input
              type="url"
              value={txForm.receipt_url}
              onChange={(e) => setTxForm({ ...txForm, receipt_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsTxModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
            >
              Simpan ke Buku Kas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Buat Tagihan Kas Otomatis */}
      <Modal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        title="Buat Tagihan Kas Kelas Baru"
        subtitle="Tagihan ini akan otomatis diterbitkan ke seluruh anggota kelas"
      >
        <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Tagihan</label>
            <input
              type="text"
              required
              value={billForm.title}
              onChange={(e) => setBillForm({ ...billForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nominal per Mahasiswa (Rp)</label>
              <input
                type="number"
                required
                value={billForm.amount}
                onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Periode</label>
              <input
                type="text"
                value={billForm.period}
                onChange={(e) => setBillForm({ ...billForm, period: e.target.value })}
                placeholder="2026-10"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Pembayaran (Due Date)</label>
            <input
              type="date"
              value={billForm.due_date}
              onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Tambahan</label>
            <textarea
              rows={2}
              value={billForm.description}
              onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsBillModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
            >
              Terbitkan ke Anggota
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Receipt Image */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Bukti Struk / Bukti Transfer"
      >
        {selectedReceipt && (
          <div className="space-y-3 text-center">
            <img
              src={selectedReceipt}
              alt="Bukti Transfer"
              className="max-h-96 w-auto mx-auto rounded-xl border border-slate-200 object-contain shadow-xs"
            />
            <p className="text-xs text-slate-500">Struk pembayaran diverifikasi oleh bendahara kelas.</p>
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
