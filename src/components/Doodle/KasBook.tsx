import React, { useState } from 'react';
import { KasTransaction } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleReceipt, DoodleCoin } from './DoodleDecorations.tsx';
import { Search, Plus, Trash2, Eye, Filter, ArrowUpRight, ArrowDownRight, X, Upload } from 'lucide-react';

interface KasBookProps {
  transactions: KasTransaction[];
  onAddTransaction: (tx: Omit<KasTransaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

const CATEGORIES = [
  'Iuran Kas',
  'Perlengkapan Kelas',
  'Fotokopi & Tugas',
  'Konsumsi Kelas',
  'Sosial & Menjenguk',
  'Acara & Lomba',
  'Lain-lain'
];

export const KasBook: React.FC<KasBookProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  isModalOpen,
  onCloseModal,
  onOpenModal,
}) => {
  const { canEditKas, user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // New transaction form state
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txCategory, setTxCategory] = useState(CATEGORIES[1]);
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [txReceipt, setTxReceipt] = useState<string>('');

  // Handle image upload for receipt
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTxReceipt(reader.result as string);
        sfx.playPaperRustle();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || Number(txAmount) <= 0) {
      alert('Mohon isi judul dan nominal uang kas dengan benar!');
      return;
    }

    onAddTransaction({
      type: txType,
      title: txTitle.trim(),
      amount: Number(txAmount),
      category: txCategory,
      date: txDate,
      recordedBy: user?.name || 'Bendahara Kelas',
      notes: txNotes.trim() || undefined,
      receiptUrl: txReceipt || undefined
    });

    sfx.playCoinChime();
    // Reset form
    setTxTitle('');
    setTxAmount('');
    setTxNotes('');
    setTxReceipt('');
    onCloseModal();
  };

  // Filtered transactions
  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Controls */}
      <div className="card-doodle p-5 rounded-lg bg-[#FFFDF9] relative">
        <ScotchTape className="absolute -top-3 right-8 rotate-2" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <DoodleReceipt className="w-6 h-6 text-slate-900" />
              <span>Buku Kas & Arsip Kwitansi</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Catatan mutasi pemasukan, pengeluaran, serta bukti nota yang dapat diverifikasi anggota kelas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEditKas ? (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenModal();
                }}
                className="btn-doodle px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black rounded-md flex items-center gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Transaksi Baru</span>
              </button>
            ) : (
              <div className="text-xs bg-amber-100 border-2 border-slate-900 p-2 rounded-md font-bold text-amber-900">
                🔒 Mode Lihat Saja (Hak catat hanya untuk Bendahara)
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, nota, toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 border-2 border-slate-900 rounded-md">
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterType('all');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterType === 'all' ? 'bg-amber-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterType('income');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterType === 'income' ? 'bg-emerald-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterType('expense');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterType === 'expense' ? 'bg-rose-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Keluar
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              sfx.playToggle();
              setSelectedCategory(e.target.value);
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-900 rounded-md focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table (Paper Notebook Lined Style) */}
      <div className="card-doodle rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 text-xs font-black uppercase text-slate-700">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Keterangan / Transaksi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Bukti Nota</th>
                {canEditKas && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEditKas ? 6 : 5} className="py-8 text-center text-slate-500 font-medium">
                    Belum ada data transaksi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/40 transition-colors">
                    {/* Tanggal */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                      {tx.date}
                    </td>

                    {/* Judul & Catatan */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.title}</div>
                      {tx.notes && (
                        <div className="text-xs text-slate-500 italic mt-0.5">{tx.notes}</div>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-xs text-slate-800">
                        {tx.category}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold tabular-nums">
                      <span className={tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}>
                        {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
                    </td>

                    {/* Bukti Nota */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {tx.receiptUrl ? (
                        <button
                          onClick={() => {
                            sfx.playPaperRustle();
                            setPreviewReceiptUrl(tx.receiptUrl!);
                          }}
                          className="btn-doodle px-2.5 py-1 text-xs bg-amber-200 text-slate-900 rounded font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Nota</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tanpa Nota</span>
                      )}
                    </td>

                    {/* Aksi Hapus */}
                    {canEditKas && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus transaksi "${tx.title}"?`)) {
                              sfx.playClick();
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Hapus Transaksi"
                          className="btn-doodle p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Transaksi Baru (Hanya Bendahara) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-lg w-full rounded-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <ScotchTape className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-1" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <DoodleCoin className="w-6 h-6" />
                <span>Catat Transaksi Kas Kelas</span>
              </h3>
              <button
                onClick={() => {
                  sfx.playClick();
                  onCloseModal();
                }}
                className="w-8 h-8 btn-doodle bg-slate-100 rounded-md flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Jenis Transaksi */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Jenis Arus Kas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playToggle();
                      setTxType('income');
                      setTxCategory('Iuran Kas');
                    }}
                    className={`p-2.5 rounded-md border-2 border-slate-900 font-black text-sm flex items-center justify-center gap-2 ${
                      txType === 'income'
                        ? 'bg-emerald-300 shadow-[2px_2px_0px_#1E293B]'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-800" />
                    <span>Pemasukan (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playToggle();
                      setTxType('expense');
                      setTxCategory('Perlengkapan Kelas');
                    }}
                    className={`p-2.5 rounded-md border-2 border-slate-900 font-black text-sm flex items-center justify-center gap-2 ${
                      txType === 'expense'
                        ? 'bg-rose-300 shadow-[2px_2px_0px_#1E293B]'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-800" />
                    <span>Pengeluaran (-)</span>
                  </button>
                </div>
              </div>

              {/* Judul Transaksi */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Keterangan Transaksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Fotokopi Tugas Makalah Pertemuan 4"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
                />
              </div>

              {/* Nominal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nominal (Rupiah) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    placeholder="Contoh: 35000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Kategori
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              {/* Upload Foto Bukti Nota */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Upload Foto Nota / Bukti Kwitansi (Opsional)
                </label>
                <div className="border-2 border-dashed border-slate-400 rounded-md p-3 text-center bg-slate-50">
                  {txReceipt ? (
                    <div className="space-y-2">
                      <img
                        src={txReceipt}
                        alt="Preview Nota"
                        className="max-h-36 mx-auto rounded border-2 border-slate-800 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setTxReceipt('')}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-indigo-700">Pilih file foto nota</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Catatan Rincian (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Nama toko, rincian item, atau orang yang menalangi..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onCloseModal();
                  }}
                  className="px-4 py-2 border-2 border-slate-900 rounded-md text-sm font-bold bg-white hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 bg-emerald-300 hover:bg-emerald-400 border-2 border-slate-900 rounded-md text-sm font-black text-slate-900"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom Nota / Kwitansi */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-xl w-full rounded-lg p-5 relative">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-4">
              <h4 className="font-black text-slate-900 flex items-center gap-2">
                <DoodleReceipt className="w-5 h-5" />
                <span>Bukti Kwitansi / Struk Belanja</span>
              </h4>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="w-7 h-7 btn-doodle bg-slate-100 rounded flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-100 p-2 rounded border border-slate-300 max-h-[70vh] overflow-auto flex items-center justify-center">
              <img
                src={previewReceiptUrl}
                alt="Bukti Nota"
                className="max-h-full max-w-full rounded shadow-md object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
