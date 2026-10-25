import React, { useState } from 'react';
import { KasTransaction, ClassSettings } from '../../types/kas.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleReceipt } from './DoodleDecorations.tsx';
import { Printer, X, Download } from 'lucide-react';

interface PrintableBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: KasTransaction[];
  settings: ClassSettings;
}

export const PrintableBinderModal: React.FC<PrintableBinderModalProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [pdfToast, setPdfToast] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sfx.playCardClose();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // CRITICAL FIX: Do NOT render anything if isOpen is false!
  if (!isOpen) return null;

  // Filter transactions by date range
  const filtered = transactions.filter(t => {
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filtered
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const finalBalance = totalIncome - totalExpense;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handlePrint = () => {
    sfx.playFileDownload();
    window.print();
  };

  const handleSavePdf = () => {
    sfx.playSuccess();
    // Temporarily set document title for clean PDF filename
    const originalTitle = document.title;
    const cleanDate = new Date().toISOString().slice(0, 10);
    const pdfFileName = `Laporan_Kas_${settings.className.replace(/\s+/g, '_')}_${cleanDate}`;
    document.title = pdfFileName;

    setPdfToast('Membuka dialog PDF: Pilih "Save as PDF" / "Simpan sebagai PDF" pada Tujuan Printer.');

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setTimeout(() => setPdfToast(null), 4000);
    }, 300);
  };

  // Sort transactions chronologically
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Running balance calculation
  let running = 0;
  const rowsWithBalance = sorted.map(t => {
    if (t.type === 'income') {
      running += t.amount;
    } else {
      running -= t.amount;
    }
    return { ...t, runningBalance: running };
  });

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sfx.playCardClose();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* Container */}
      <div className="bg-white max-w-4xl w-full rounded-lg shadow-2xl p-4 sm:p-8 relative my-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:m-0 print:p-0 print:overflow-visible">
        
        {/* PDF Toast Notification */}
        {pdfToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg border-2 border-amber-400 print:hidden animate-fade-in">
            📄 {pdfToast}
          </div>
        )}

        {/* Screen-only top action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b-2 border-slate-900 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <DoodleReceipt className="w-6 h-6 text-slate-900" />
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Pratinjau Lembaran Binder Laporan Kas Resmi
              </h3>
              <p className="text-xs text-slate-500">
                Format standar dokumen fisik siap cetak / simpan ke PDF.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date range filters */}
            <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-slate-900 rounded p-1 text-xs">
              <span className="font-bold text-slate-600 pl-1">Periode:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  sfx.playFilterApplied();
                  setStartDate(e.target.value);
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  sfx.playFilterApplied();
                  setEndDate(e.target.value);
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline px-1"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="btn-doodle px-3.5 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              title="Cetak langsung menggunakan printer fisik"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>

            {/* Save PDF button */}
            <button
              type="button"
              onClick={handleSavePdf}
              className="btn-doodle px-3.5 py-2 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              title="Simpan dokumen sebagai file PDF"
            >
              <Download className="w-4 h-4" />
              <span>Simpan PDF</span>
            </button>

            {/* Close X button */}
            <button
              type="button"
              onClick={() => {
                sfx.playCardClose();
                onClose();
              }}
              title="Tutup Pratinjau (Esc)"
              className="w-9 h-9 btn-doodle bg-slate-100 hover:bg-rose-100 hover:text-rose-700 rounded-md flex items-center justify-center text-slate-700 transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>


        {/* Printable Paper Area (Binder Document) */}
        <div className="printable-binder-document bg-[#FFFDF9] border-2 border-slate-900 p-6 sm:p-10 rounded-sm relative text-slate-900 font-sans print:border-none print:p-0 print:bg-white shadow-[4px_4px_0px_#1E293B]">
          {/* Notebook Binder Rings (Left Edge) */}
          <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-8 pointer-events-none print:hidden">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border-2 border-slate-400 shadow-inner"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border-2 border-slate-400 shadow-inner"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border-2 border-slate-400 shadow-inner"></div>
          </div>

          {/* Doodle Tape Accents */}
          <ScotchTape className="absolute -top-3 left-14 rotate-[-1deg]" />
          <ScotchTape className="absolute -top-3 right-14 rotate-[2deg]" />
          
          {/* Header Kop Resmi */}
          <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900">
              {settings.className}
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-slate-700 uppercase mt-0.5 tracking-wide">
              Laporan Pertanggungjawaban & Transparansi Keuangan Kas
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              {settings.academicYear} · Dokumen Resmi Kas Kelas
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Tanggal Cetak: {currentDate} · Status Audit: 100% Transparan & Terverifikasi
            </p>
          </div>

          {/* Kotak Ringkasan Kas */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-amber-50/70 border-2 border-slate-900 rounded-sm print:bg-slate-50">
            <div>
              <p className="text-[11px] uppercase font-bold text-slate-600">Total Debit (Masuk) (+)</p>
              <p className="text-lg sm:text-xl font-black font-mono text-emerald-800 tabular-nums">
                {formatRupiah(totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-slate-600">Total Kredit (Keluar) (-)</p>
              <p className="text-lg sm:text-xl font-black font-mono text-rose-800 tabular-nums">
                {formatRupiah(totalExpense)}
              </p>
            </div>
            <div className="border-l-2 border-slate-900 pl-3">
              <p className="text-[11px] uppercase font-bold text-slate-800">Saldo Kas Bersih</p>
              <p className="text-lg sm:text-xl font-black font-mono text-slate-900 tabular-nums">
                {formatRupiah(finalBalance)}
              </p>
            </div>
          </div>

          {/* Tabel Transaksi Detail */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y-2 border-slate-900 bg-slate-100 font-black uppercase text-slate-800">
                  <th className="py-2.5 px-2 w-8 text-center">No</th>
                  <th className="py-2.5 px-2 w-24">Tanggal</th>
                  <th className="py-2.5 px-2">Uraian / Keterangan</th>
                  <th className="py-2.5 px-2 w-28">Kategori</th>
                  <th className="py-2.5 px-2 text-right w-24">Debit (Masuk)</th>
                  <th className="py-2.5 px-2 text-right w-24 text-rose-700">Kredit (Keluar)</th>
                  <th className="py-2.5 px-2 text-right w-28">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {rowsWithBalance.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono whitespace-nowrap text-slate-600">{item.date}</td>
                    <td className="py-2 px-2 font-bold text-slate-900">
                      <div>{item.title}</div>
                      {item.notes && <div className="text-[10px] text-slate-500 font-normal italic">{item.notes}</div>}
                    </td>
                    <td className="py-2 px-2 text-slate-600">{item.category}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {item.type === 'income' ? formatRupiah(item.amount) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-rose-800 tabular-nums">
                      {item.type === 'expense' ? formatRupiah(item.amount) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(item.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 font-black bg-slate-100">
                  <td colSpan={4} className="py-2.5 px-2 text-right uppercase">Total Akumulasi:</td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-800 tabular-nums">{formatRupiah(totalIncome)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-rose-800 tabular-nums">{formatRupiah(totalExpense)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-900 tabular-nums">{formatRupiah(finalBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Kolom Tanda Tangan Pengesahan */}
          <div className="pt-6 border-t-2 border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-semibold text-slate-600">Mengetahui &amp; Menyetujui,</p>
              <p className="font-bold text-slate-900">Super Admin</p>
              <div className="h-20 flex items-end justify-center">
                <span className="font-serif italic text-slate-400 text-sm">( Tanda Tangan Basah )</span>
              </div>
              <p className="font-bold underline text-slate-900">M. Rahman FM</p>
              <p className="text-[10px] text-slate-500">mrachmanfm@gmail.com</p>
            </div>

            <div>
              <p className="font-semibold text-slate-600">Dibuat Dengan Sebenarnya,</p>
              <p className="font-bold text-slate-900">Bendahara Umum Kelas</p>
              <div className="h-20 flex items-end justify-center">
                <span className="font-serif italic text-slate-400 text-sm">( Tanda Tangan Basah )</span>
              </div>
              <p className="font-bold underline text-slate-900">Bendahara {settings.className}</p>
              <p className="text-[10px] text-slate-500">Divisi Keuangan & Administrasi</p>
            </div>
          </div>

          {/* Footer stempel */}
          <div className="mt-8 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-400 font-mono">
            Dokumen ini dicetak secara otomatis dari sistem informasi Kelas Gue · Terverifikasi Cloud Supabase
          </div>
        </div>
      </div>
    </div>
  );
};
