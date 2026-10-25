import React from 'react';
import { KasTransaction, KasMember, ClassSettings } from '../../types/kas.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { generateGoogleSheetsCsv, downloadCsvFile, openGoogleSheetsImportGuide } from '../../utils/exportToGoogleSheets.ts';
import { FileSpreadsheet, X, Download, ExternalLink, CheckCircle2 } from 'lucide-react';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: KasTransaction[];
  members: KasMember[];
  settings: ClassSettings;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  members,
  settings,
}) => {
  if (!isOpen) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  const formatRupiah = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const handleDownload = () => {
    sfx.playFileDownload();
    const csvContent = generateGoogleSheetsCsv(transactions, members, settings);
    downloadCsvFile(`laporan_kas_${settings.className.replace(/\s+/g, '_')}_${Date.now()}.csv`, csvContent);
  };

  const handleOpenSheetsGuide = () => {
    sfx.playClick();
    openGoogleSheetsImportGuide();
  };

  // Sort transactions chronologically for preview
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const previewRows = sortedTransactions.slice(0, 15);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sfx.playCardClose();
          onClose();
        }
      }}
      className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="card-doodle bg-[#FFFDF9] max-w-2xl w-full rounded-xl p-4 sm:p-6 relative border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B] max-h-[92vh] flex flex-col my-auto">
        <ScotchTape className="absolute -top-3 left-10 rotate-[2deg]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-200 border-2 border-slate-900 flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <FileSpreadsheet className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Pratinjau Data Ekspor CSV &amp; Google Sheets
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                Verifikasi ringkasan data sebelum mengunduh file spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playCardClose();
              onClose();
            }}
            className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 shrink-0">
          <div className="p-2.5 bg-white border-2 border-slate-900 rounded-lg shadow-[1px_1px_0px_#000]">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Jumlah Baris</p>
            <p className="text-base font-black text-slate-900 font-mono mt-0.5">{transactions.length} Transaksi</p>
          </div>
          <div className="p-2.5 bg-emerald-50 border-2 border-slate-900 rounded-lg shadow-[1px_1px_0px_#000]">
            <p className="text-[9px] font-bold text-emerald-800 uppercase">Total Debit (+)</p>
            <p className="text-base font-black text-emerald-900 font-mono mt-0.5">{formatRupiah(totalIncome)}</p>
          </div>
          <div className="p-2.5 bg-rose-50 border-2 border-slate-900 rounded-lg shadow-[1px_1px_0px_#000]">
            <p className="text-[9px] font-bold text-rose-800 uppercase">Total Kredit (-)</p>
            <p className="text-base font-black text-rose-900 font-mono mt-0.5">{formatRupiah(totalExpense)}</p>
          </div>
          <div className="p-2.5 bg-amber-50 border-2 border-slate-900 rounded-lg shadow-[1px_1px_0px_#000]">
            <p className="text-[9px] font-bold text-amber-900 uppercase">Saldo Bersih</p>
            <p className="text-base font-black text-slate-900 font-mono mt-0.5">{formatRupiah(currentBalance)}</p>
          </div>
        </div>

        {/* Table Preview Container */}
        <div className="flex-1 overflow-y-auto border-2 border-slate-900 rounded-lg bg-white mb-4 max-h-[35vh]">
          <div className="bg-amber-100 px-3 py-1.5 border-b-2 border-slate-900 flex items-center justify-between text-[10px] font-bold text-slate-800">
            <span>Pratinjau Data Transaksi (Tampilan 15 Terbaru Dari Total {transactions.length})</span>
            <span className="text-slate-600">Format: CSV Standard (UTF-8)</span>
          </div>
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 font-black text-slate-800 uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="p-2">Tanggal</th>
                <th className="p-2">Keterangan</th>
                <th className="p-2">Kategori</th>
                <th className="p-2">Jenis</th>
                <th className="p-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {previewRows.map((tx) => (
                <tr key={tx.id} className="hover:bg-amber-50/50">
                  <td className="p-2 text-slate-500 whitespace-nowrap">{tx.date}</td>
                  <td className="p-2 font-sans font-bold text-slate-900">{tx.title}</td>
                  <td className="p-2 font-sans text-slate-600">{tx.category}</td>
                  <td className="p-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans border ${
                      tx.type === 'income' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {tx.type === 'income' ? 'DEBIT' : 'KREDIT'}
                    </span>
                  </td>
                  <td className={`p-2 text-right font-black ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenSheetsGuide}
            className="btn-doodle w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] bg-sky-100 hover:bg-sky-200 text-slate-900 text-xs font-bold rounded-md border-2 border-slate-900 flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4 text-sky-800" />
            <span>Panduan Import Google Sheets</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-doodle flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-slate-100 text-slate-800 text-xs font-bold rounded-md border-2 border-slate-900"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn-doodle flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-emerald-300 hover:bg-emerald-400 text-slate-900 text-xs font-black rounded-md border-2 border-slate-900 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <Download className="w-4 h-4" />
              <span>Download File CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
