import React, { useState, useRef } from 'react';
import { KasTransaction } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleReceipt, DoodleCoin } from './DoodleDecorations.tsx';
import {
  Search,
  Plus,
  Trash2,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Upload,
  Loader2,
  Printer,
  Camera,
  ScanLine,
  Sparkles,
  CheckCheck,
  Check
} from 'lucide-react';
import { uploadReceiptToSupabase, LocalKasRepository } from '../../services/supabaseClient.ts';
import { scanReceiptOcr, OcrDetectionResult } from '../../utils/receiptOcr.ts';
import { PinVerificationModal } from './PinVerificationModal.tsx';
import { generateGoogleSheetsCsv, downloadCsvFile, openGoogleSheetsImportGuide } from '../../utils/exportToGoogleSheets.ts';

import { ClassSettings, KasMember } from '../../types/kas.ts';
import { Settings as SettingsIcon, MessageSquare, FileSpreadsheet, ExternalLink, Calculator } from 'lucide-react';
import { DoodleSelect } from '../UI/DoodleSelect.tsx';
import { DoodleDatePicker } from '../UI/DoodleDatePicker.tsx';
import { DoodleCurrencyInput } from '../UI/DoodleCurrencyInput.tsx';
import { showToast, showConfirm } from '../UI/DoodleDialog.tsx';
import { ExportPreviewModal } from './ExportPreviewModal.tsx';

interface KasBookProps {
  transactions: KasTransaction[];
  members?: KasMember[];
  settings: ClassSettings;
  onAddTransaction: (tx: Omit<KasTransaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateSettings?: (settings: ClassSettings) => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
  onOpenPrintModal?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenSplitBillModal?: () => void;
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
  members = [],
  settings,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateSettings,
  isModalOpen,
  onCloseModal,
  onOpenModal,
  onOpenPrintModal,
  onOpenWhatsAppModal,
  onOpenSplitBillModal,
}) => {
  const { canEditKas, isSuperAdmin, user, role } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideWeeklyDues, setHideWeeklyDues] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);
  const [duesForm, setDuesForm] = useState({
    weeklyDuesAmount: settings.weeklyDuesAmount,
    kasTargetAmount: settings.kasTargetAmount,
    academicYear: settings.academicYear
  });

  // PIN Verification State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingTxData, setPendingTxData] = useState<Omit<KasTransaction, 'id' | 'createdAt'> | null>(null);

  // New transaction form state
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txCategory, setTxCategory] = useState(CATEGORIES[1]);
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [txReceipt, setTxReceipt] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // OCR Scanner state
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrDetectionResult | null>(null);
  const [ocrPreviewImg, setOcrPreviewImg] = useState<string | null>(null);
  const ocrCameraInputRef = useRef<HTMLInputElement | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessOcrImage = async (file: File) => {
    sfx.playPaperRustle();
    setIsScanningOcr(true);
    setOcrProgress(5);
    setOcrStatus('Membuka foto nota...');
    setOcrResult(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setOcrPreviewImg(previewUrl);

    try {
      // In background, also initiate Supabase Storage upload
      uploadReceiptToSupabase(file).then(res => {
        if (res.url) {
          setTxReceipt(res.url);
        }
      }).catch(() => {});

      const res = await scanReceiptOcr(file, (pct, status) => {
        setOcrProgress(pct);
        setOcrStatus(status);
      });

      setOcrResult(res);
      if (res.success && res.detectedAmount) {
        sfx.playLevelUp();
      } else {
        sfx.playWarning();
      }
    } catch (err: any) {
      setOcrResult({
        success: false,
        rawText: '',
        candidateAmounts: [],
        error: err?.message || 'Gagal memproses OCR'
      });
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleApplyOcrAmount = (amount: number, snippet?: string) => {
    sfx.playMoneyIncome();
    setTxType('expense');
    setTxAmount(amount);
    if (!txTitle && ocrResult?.storeName) {
      setTxTitle(`Belanja di ${ocrResult.storeName}`);
    } else if (!txTitle) {
      setTxTitle('Pengeluaran Nota Belanja Kelas');
    }
    if (snippet && !txNotes) {
      setTxNotes(`OCR Terdeteksi: "${snippet}"`);
    }

    // Attach receipt image preview if txReceipt not yet set
    if (ocrPreviewImg && !txReceipt) {
      setTxReceipt(ocrPreviewImg);
    }

    setIsOcrModalOpen(false);
    onOpenModal(); // Open transaction modal so user can review and save
  };

  // Handle image upload with Supabase Storage integration
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    setUploadNotice('Mengompres dan mengunggah ke Supabase Storage (bucket: nota-kas)...');

    try {
      const res = await uploadReceiptToSupabase(file);
      if (res.url) {
        setTxReceipt(res.url);
        setUploadNotice('✓ Berhasil diunggah ke Supabase Storage Cloud!');
        sfx.playCoinChime();
      } else {
        // Fallback to local compressed preview
        const reader = new FileReader();
        reader.onload = () => {
          setTxReceipt(reader.result as string);
        };
        reader.readAsDataURL(file);
        setUploadNotice(res.error || 'Menggunakan pratinjau lokal.');
        sfx.playPaperRustle();
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setTxReceipt(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const executeSaveTransaction = (txPayload: Omit<KasTransaction, 'id' | 'createdAt'>) => {
    onAddTransaction(txPayload);
    sfx.playCoinChime();

    // Log to Audit Trail
    LocalKasRepository.addAuditLog({
      action: txPayload.amount >= 500000 ? 'CATAT_TRANSAKSI_BESAR' : 'CATAT_TRANSAKSI',
      details: `Dicatat ${txPayload.type === 'income' ? 'Debit' : 'Kredit'} "${txPayload.title}" senilai Rp ${txPayload.amount.toLocaleString('id-ID')} (${txPayload.category})`,
      performedBy: user?.name || 'Bendahara',
      userRole: role
    });

    // Reset form
    setTxTitle('');
    setTxAmount('');
    setTxNotes('');
    setTxReceipt('');
    setPendingTxData(null);
    setIsPinModalOpen(false);
    onCloseModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || Number(txAmount) <= 0) {
      showToast('Mohon isi judul dan nominal uang kas dengan benar!', 'error');
      return;
    }

    const payload: Omit<KasTransaction, 'id' | 'createdAt'> = {
      type: txType,
      title: txTitle.trim(),
      amount: Number(txAmount),
      category: txCategory,
      date: txDate,
      recordedBy: user?.name || 'Bendahara Kelas',
      notes: txNotes.trim() || undefined,
      receiptUrl: txReceipt || undefined
    };

    if (Number(txAmount) >= 500000) {
      setPendingTxData(payload);
      setIsPinModalOpen(true);
    } else {
      executeSaveTransaction(payload);
    }
  };

  // Filtered transactions
  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (hideWeeklyDues && (t.category === 'Iuran Kas' || t.title.startsWith('Iuran:') || t.notes?.startsWith('LINKED_IURAN:'))) {
      return false;
    }
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
              Catatan mutasi debit (masuk), kredit (keluar), serta bukti nota yang dapat diverifikasi anggota kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {canEditKas && onOpenWhatsAppModal && (
              <button
                type="button"
                onClick={() => {
                  sfx.playCardOpen();
                  onOpenWhatsAppModal();
                }}
                className="btn-doodle px-2.5 py-1 bg-emerald-300 hover:bg-emerald-400 text-slate-900 text-[11px] font-black rounded-md flex items-center gap-1"
                title="Bagikan Ringkasan Kas ke WhatsApp Kelas"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WA</span>
              </button>
            )}

            {onOpenPrintModal && (
              <button
                type="button"
                onClick={() => {
                  sfx.playPaperRustle();
                  onOpenPrintModal();
                }}
                className="btn-doodle px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-slate-900 text-[11px] font-black rounded-md flex items-center gap-1"
                title="Buka Lembaran Binder Siap Cetak & Simpan PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sfx.playCardOpen();
                setIsExportPreviewOpen(true);
              }}
              className="btn-doodle px-2.5 py-1 bg-sky-200 hover:bg-sky-300 text-slate-900 text-[11px] font-black rounded-md flex items-center gap-1"
              title="Pratinjau Data Laporan Kas Sebelum Mengunduh CSV / Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>

            {onOpenSplitBillModal && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onOpenSplitBillModal();
                }}
                className="btn-doodle px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-slate-900 text-[11px] font-black rounded-md flex items-center gap-1"
                title="Kalkulator Pembagian Biaya Acara (Split Bill)"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Split Bill</span>
              </button>
            )}

            {canEditKas ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playPaperRustle();
                    setIsOcrModalOpen(true);
                  }}
                  className="btn-doodle px-2.5 py-1 bg-indigo-200 hover:bg-indigo-300 text-slate-900 text-[11px] font-black rounded-md flex items-center gap-1"
                  title="Pindai Struk / Nota dengan Kamera HP (OCR Pembaca Nominal Otomatis)"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>OCR</span>
                </button>

                <button
                  onClick={() => {
                    sfx.playCardOpen();
                    onOpenModal();
                  }}
                  className="btn-doodle px-3 py-1 bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs font-black rounded-md flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Catat Transaksi</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, nota..."
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

          {/* Custom Doodle Category Dropdown */}
          <DoodleSelect
            value={selectedCategory}
            onChange={(val) => {
              sfx.playToggle();
              setSelectedCategory(val);
            }}
            options={[
              { value: 'all', label: 'Semua Kategori' },
              ...CATEGORIES.map(cat => ({ value: cat, label: cat }))
            ]}
          />

          {/* Toggle Sembunyikan Iuran Mingguan */}
          <button
            type="button"
            onClick={() => {
              sfx.playToggle();
              setHideWeeklyDues(!hideWeeklyDues);
            }}
            className={`py-2 px-3 rounded-md border-2 border-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              hideWeeklyDues
                ? 'bg-amber-400 text-slate-900 font-black shadow-[1px_1px_0px_#000]'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
            title="Sembunyikan entri iuran mingguan siswa dari buku kas agar fokus pada transaksi umum"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{hideWeeklyDues ? '✓ Tanpa Iuran' : 'Sembunyikan Iuran'}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table (Minimalist Doodle Notebook Style) */}
      <div className="card-doodle rounded-lg bg-white overflow-hidden shadow-sm border-2 border-slate-900">
        <div className="overflow-x-auto max-h-[600px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 font-black uppercase text-slate-700 sticky top-0 z-20">
              <tr>
                <th className="py-2 px-2.5 text-[10px] sm:text-xs">Tanggal</th>
                <th className="py-2 px-2.5 min-w-[170px] text-[10px] sm:text-xs">Keterangan / Transaksi</th>
                <th className="py-2 px-2.5 text-[10px] sm:text-xs">Kategori</th>
                <th className="py-2 px-2.5 text-right text-[10px] sm:text-xs">Nominal</th>
                <th className="py-2 px-2.5 text-center text-[10px] sm:text-xs">Bukti</th>
                {canEditKas && <th className="py-2 px-2.5 text-center text-[10px] sm:text-xs">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEditKas ? 6 : 5} className="py-10 text-center text-slate-400 font-medium italic text-xs">
                    Belum ada data transaksi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Tanggal */}
                    <td className="py-1.5 px-2.5 whitespace-nowrap font-mono text-[10px] sm:text-[11px] text-slate-500">
                      {tx.date}
                    </td>

                    {/* Judul & Catatan */}
                    <td className="py-1.5 px-2.5">
                      <div className="font-bold text-slate-900 leading-tight text-[11px] sm:text-xs">{tx.title}</div>
                      {tx.notes && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">{tx.notes}</div>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="py-1.5 px-2.5 whitespace-nowrap">
                      <span className="text-[9px] sm:text-[10px] font-bold bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-slate-700">
                        {tx.category}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="py-1.5 px-2.5 text-right whitespace-nowrap font-mono font-black tabular-nums text-[11px] sm:text-xs">
                      <span className={tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}>
                        {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
                    </td>

                    {/* Bukti Nota */}
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                      {tx.receiptUrl ? (
                        <button
                          onClick={() => {
                            sfx.playPaperRustle();
                            setPreviewReceiptUrl(tx.receiptUrl!);
                          }}
                          className="btn-doodle px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-amber-200 hover:bg-amber-300 text-slate-900 rounded font-black inline-flex items-center gap-1 cursor-pointer border border-slate-900"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Nota</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">-</span>
                      )}
                    </td>

                    {/* Aksi Hapus */}
                    {canEditKas && (
                      <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                        <button
                          onClick={async () => {
                            const ok = await showConfirm({
                              title: 'Hapus Transaksi?',
                              message: `Apakah Anda yakin ingin menghapus transaksi "${tx.title}"?`,
                              confirmLabel: 'Ya, Hapus',
                              cancelLabel: 'Batal',
                              isDanger: true,
                            });
                            if (ok) {
                              sfx.playClick();
                              onDeleteTransaction(tx.id);
                              showToast('Transaksi berhasil dihapus.', 'info');
                            }
                          }}
                          className="p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    <span>Debit (+)</span>
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
                    <span>Kredit (-)</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-600">
                      Nominal (Rupiah) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playPaperRustle();
                        setIsOcrModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer"
                      title="Pindai foto struk dengan kamera HP untuk otomatis mengisi nominal"
                    >
                      <Camera className="w-3 h-3 text-indigo-600" />
                      <span>Scan Nota (OCR)</span>
                    </button>
                  </div>
                  <DoodleCurrencyInput
                    label="Nominal Rp *"
                    required
                    value={txAmount}
                    onChange={(val) => setTxAmount(val)}
                  />
                  {/* Live Currency Formatting Badge with Dots */}
                  <div className="mt-1.5 p-1.5 bg-emerald-50 border border-emerald-400 rounded flex items-center justify-between text-xs font-mono font-black text-emerald-950">
                    <span>Terbaca:</span>
                    <span className="text-sm underline text-emerald-800">
                      {txAmount ? `Rp ${Number(txAmount).toLocaleString('id-ID')}` : 'Rp 0'}
                    </span>
                  </div>

                  {/* Quick Nominal Shortcut Buttons */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="font-bold text-slate-500 mr-1">Tambah:</span>
                    {[5000, 10000, 20000, 50000, 100000, 500000].map(addVal => (
                      <button
                        key={addVal}
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          setTxAmount(prev => (typeof prev === 'number' ? prev + addVal : addVal));
                        }}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-amber-200 border border-slate-800 rounded font-black text-slate-900"
                      >
                        +{addVal >= 1000000 ? `${addVal/1000000}Jt` : `${addVal/1000}rb`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTxAmount('')}
                      className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded font-bold ml-auto"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div>
                  <DoodleSelect
                    label="Kategori"
                    value={txCategory}
                    onChange={(val) => setTxCategory(val)}
                    options={CATEGORIES}
                  />
                </div>
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <DoodleDatePicker
                  label="Tanggal Transaksi"
                  value={txDate}
                  onChange={(val) => setTxDate(val)}
                />
              </div>

              {/* Upload Foto Bukti Nota */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Upload Foto Nota / Bukti Kwitansi (Opsional)
                </label>
                <div className="border-2 border-dashed border-slate-400 rounded-md p-3 text-center bg-slate-50">
                  {isUploadingReceipt ? (
                    <div className="py-4 space-y-2">
                      <Loader2 className="w-6 h-6 mx-auto animate-spin text-amber-600" />
                      <p className="text-xs font-bold text-slate-700">Mengompres & Mengunggah ke Supabase Storage...</p>
                    </div>
                  ) : txReceipt ? (
                    <div className="space-y-2">
                      <img
                        src={txReceipt}
                        alt="Preview Nota"
                        className="max-h-36 mx-auto rounded border-2 border-slate-800 object-contain"
                      />
                      <div className="flex items-center justify-center gap-2">
                        {txReceipt.startsWith('http') && (
                          <span className="text-[10px] bg-emerald-100 border border-emerald-400 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            Cloud Supabase Storage (nota-kas)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setTxReceipt('');
                            setUploadNotice(null);
                          }}
                          className="text-xs text-rose-600 font-bold hover:underline"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-2">
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-indigo-700 hover:underline">Pilih file foto nota</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Otomatis dikompres & disimpan ke Supabase Storage (bucket: nota-kas)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  {uploadNotice && (
                    <p className="text-[11px] font-medium text-slate-600 mt-2 border-t border-slate-200 pt-1.5">
                      {uploadNotice}
                    </p>
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
                  className="btn-doodle px-4 py-2 border-2 border-slate-900 rounded-md text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
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

      {/* Super Admin Dues Setting Modal */}
      {isDuesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-md w-full rounded-lg p-6 relative">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-indigo-700" />
                <span>Pengaturan Iuran Kas (Super Admin)</span>
              </h3>
              <button
                onClick={() => {
                  sfx.playCardClose();
                  setIsDuesModalOpen(false);
                }}
                className="w-8 h-8 btn-doodle bg-slate-100 rounded flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateSettings) {
                  onUpdateSettings({
                    ...settings,
                    weeklyDuesAmount: Number(duesForm.weeklyDuesAmount),
                    kasTargetAmount: Number(duesForm.kasTargetAmount),
                    academicYear: duesForm.academicYear
                  });
                  sfx.playMoneyIncome();
                }
                setIsDuesModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nominal Iuran per Minggu (Rupiah) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={duesForm.weeklyDuesAmount}
                  onChange={(e) => setDuesForm({ ...duesForm, weeklyDuesAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
                <div className="mt-1 text-[11px] font-mono font-bold text-slate-700">
                  Terbaca: <span className="text-emerald-800">Rp {Number(duesForm.weeklyDuesAmount || 0).toLocaleString('id-ID')}</span> per minggu
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Target Kas Semester (Rupiah) *
                </label>
                <input
                  type="number"
                  min="50000"
                  step="10000"
                  required
                  value={duesForm.kasTargetAmount}
                  onChange={(e) => setDuesForm({ ...duesForm, kasTargetAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
                <div className="mt-1 text-[11px] font-mono font-bold text-slate-700">
                  Terbaca: <span className="text-emerald-800">Rp {Number(duesForm.kasTargetAmount || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Tahun Ajaran / Semester
                </label>
                <input
                  type="text"
                  value={duesForm.academicYear}
                  onChange={(e) => setDuesForm({ ...duesForm, academicYear: e.target.value })}
                  placeholder="Semester Ganjil 2026/2027"
                  className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playCardClose();
                    setIsDuesModalOpen(false);
                  }}
                  className="btn-doodle px-4 py-2 border-2 border-slate-900 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 bg-emerald-300 hover:bg-emerald-400 border-2 border-slate-900 rounded-md text-xs font-black text-slate-900"
                >
                  Simpan Iuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pindai Nota Kamera HP (OCR Pembaca Nominal Otomatis) */}
      {isOcrModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sfx.playCardClose();
              setIsOcrModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="card-doodle bg-white max-w-xl w-full rounded-xl p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto">
            <ScotchTape className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-1" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-slate-900 flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Pindai Nota dengan Kamera HP (OCR Otomatis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem mendeteksi total rupiah pada struk dan langsung mengisi kolom nominal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playCardClose();
                  setIsOcrModalOpen(false);
                }}
                className="w-8 h-8 btn-doodle bg-slate-100 rounded flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons to capture or pick image */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => ocrCameraInputRef.current?.click()}
                  className="btn-doodle p-3.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black rounded-lg flex flex-col items-center justify-center gap-1.5 text-xs sm:text-sm text-center"
                >
                  <Camera className="w-5 h-5" />
                  <span>Ambil Foto Kamera HP</span>
                  <span className="text-[10px] font-normal text-slate-700">Kamera Belakang Ponsel</span>
                </button>

                <button
                  type="button"
                  onClick={() => ocrFileInputRef.current?.click()}
                  className="btn-doodle p-3.5 bg-sky-200 hover:bg-sky-300 text-slate-900 font-black rounded-lg flex flex-col items-center justify-center gap-1.5 text-xs sm:text-sm text-center"
                >
                  <Upload className="w-5 h-5" />
                  <span>Pilih dari Galeri / File</span>
                  <span className="text-[10px] font-normal text-slate-700">File Foto Struk Belanja</span>
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={ocrCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessOcrImage(f);
                }}
                className="hidden"
              />
              <input
                ref={ocrFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessOcrImage(f);
                }}
                className="hidden"
              />

              {/* Scanning status and progress bar */}
              {isScanningOcr && (
                <div className="p-4 bg-indigo-50 border-2 border-slate-900 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      {ocrStatus}
                    </span>
                    <span className="font-mono">{ocrProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Image Preview with scanner effect */}
              {ocrPreviewImg && (
                <div className="relative border-2 border-slate-900 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center max-h-64">
                  <img
                    src={ocrPreviewImg}
                    alt="Nota Kamera"
                    className="max-h-64 w-auto object-contain"
                  />
                  {isScanningOcr && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-center">
                      <div className="w-full h-1 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse" />
                    </div>
                  )}
                </div>
              )}

              {/* Detected Results Card */}
              {ocrResult && (
                <div className="space-y-3 pt-2">
                  {ocrResult.detectedAmount ? (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                            Total Rupiah Berhasil Dideteksi:
                          </span>
                          <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-900 tabular-nums">
                            {formatRupiah(ocrResult.detectedAmount)}
                          </p>
                          {ocrResult.storeName && (
                            <p className="text-xs text-slate-600 mt-0.5">
                              Toko: <strong>{ocrResult.storeName}</strong>
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyOcrAmount(ocrResult.detectedAmount!)}
                          className="btn-doodle px-4 py-2.5 bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-black rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-md"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Gunakan Nominal Ini</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border-2 border-amber-500 rounded-lg text-xs text-amber-900 font-bold">
                      ⚠️ Tidak ditemukan angka total yang jelas pada foto. Silakan pilih foto dengan pencahayaan lebih terang atau pilih salah satu nominal kandidat di bawah ini:
                    </div>
                  )}

                  {/* Candidate amounts list if multiple items detected */}
                  {ocrResult.candidateAmounts.length > 1 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Kandidat Nominal Lain pada Struk:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ocrResult.candidateAmounts.slice(0, 6).map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyOcrAmount(c.amount, c.rawSnippet)}
                            className="btn-doodle px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-900 text-xs font-mono font-bold rounded-md flex items-center gap-1"
                          >
                            <span>{formatRupiah(c.amount)}</span>
                            <span className="text-[10px] text-slate-500 font-sans">({c.label.slice(0, 15)})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(false)}
                  className="px-4 py-2 border-2 border-slate-900 rounded-md text-xs font-bold bg-white hover:bg-slate-100"
                >
                  Tutup Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PIN Verification Modal for Large Transactions >= 500k */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingTxData(null);
        }}
        onSuccess={() => {
          if (pendingTxData) {
            executeSaveTransaction(pendingTxData);
          }
        }}
        requiredAmount={pendingTxData?.amount}
      />

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={isExportPreviewOpen}
        onClose={() => setIsExportPreviewOpen(false)}
        transactions={transactions}
        members={members}
        settings={settings}
      />
    </div>
  );
};

