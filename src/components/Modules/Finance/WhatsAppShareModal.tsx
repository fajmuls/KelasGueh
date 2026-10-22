import React, { useState, useMemo } from 'react';
import { Transaction, Bill, Payment, ClassInfo, FinanceSummary } from '../../../types/index.ts';
import { Modal } from '../../UI/Modal.tsx';
import { MessageSquare, Copy, Check, ExternalLink, Calendar, Filter, Share2 } from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo | null;
  transactions: Transaction[];
  bills: Bill[];
  payments: Payment[];
  summary: FinanceSummary | null;
}

type PeriodType = 'week' | 'month' | 'year' | 'all';

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  classInfo,
  transactions,
  bills,
  payments,
  summary,
}) => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [copied, setCopied] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeBills, setIncludeBills] = useState(true);

  // Filter transactions according to selected period
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);

    if (period === 'week') {
      const day = now.getDay() || 7; // Sunday as 7
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const txs = transactions.filter(t => !t.deleted_at && new Date(t.date || t.created_at) >= startDate);
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const periodBalance = income - expense;

    const periodLabel =
      period === 'week'
        ? 'Minggu Ini'
        : period === 'month'
        ? `Bulan ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
        : period === 'year'
        ? `Tahun ${now.getFullYear()}`
        : 'Seluruh Periode';

    return {
      txs,
      income,
      expense,
      periodBalance,
      periodLabel,
      totalBalance: summary?.balance || 0,
    };
  }, [period, transactions, summary]);

  // Generate WhatsApp formatted text
  const messageText = useMemo(() => {
    const className = classInfo?.name || '01SAKP014';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let text = `📢 *LAPORAN TRANSPARANSI KAS KELAS*\n`;
    text += `🏛 *${className}*\n`;
    text += `📅 Periode: *${filteredData.periodLabel}* (Update: ${dateStr})\n`;
    text += `──────────────────────\n\n`;

    text += `📊 *RINGKASAN KEUANGAN (${filteredData.periodLabel}):*\n`;
    text += `🟢 *Total Pemasukan:* Rp ${filteredData.income.toLocaleString('id-ID')}\n`;
    text += `🔴 *Total Pengeluaran:* Rp ${filteredData.expense.toLocaleString('id-ID')}\n`;
    text += `💵 *Sisa Saldo Kas Kelas:* *Rp ${filteredData.totalBalance.toLocaleString('id-ID')}*\n\n`;

    if (includeDetails && filteredData.txs.length > 0) {
      text += `📝 *RINCIAN TRANSAKSI:*\n`;
      filteredData.txs.slice(0, 10).forEach((t, i) => {
        const sign = t.type === 'income' ? '(+)' : '(-)';
        const dateFormatted = new Date(t.date || t.created_at).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
        });
        text += `${i + 1}. [${dateFormatted}] ${sign} Rp ${t.amount.toLocaleString('id-ID')} - ${t.description}\n`;
      });
      if (filteredData.txs.length > 10) {
        text += `_...dan ${filteredData.txs.length - 10} transaksi lainnya_\n`;
      }
      text += `\n`;
    } else if (includeDetails && filteredData.txs.length === 0) {
      text += `📝 *RINCIAN TRANSAKSI:*\n_Belum ada transaksi tercatat pada periode ini._\n\n`;
    }

    if (includeBills && bills.length > 0) {
      const activeBill = bills[0];
      const paidCount = payments.filter(p => p.bill_id === activeBill.id && p.status === 'paid').length;
      const totalCount = payments.filter(p => p.bill_id === activeBill.id).length || 1;

      text += `📌 *STATUS IURAN KAS:* \n`;
      text += `• *${activeBill.title}*\n`;
      text += `• Nominal: Rp ${activeBill.amount.toLocaleString('id-ID')} / mahasiswa\n`;
      text += `• Progres Pembayaran: ${paidCount}/${totalCount} Mahasiswa (${Math.round((paidCount / totalCount) * 100)}%)\n\n`;
    }

    text += `──────────────────────\n`;
    text += `✨ _Laporan ini dihasilkan secara otomatis melalui Classify Pro Transparansi Kas._\n`;
    text += `Terima kasih atas partisipasi dan kerja samanya! 🙏`;

    return text;
  }, [classInfo, filteredData, includeDetails, includeBills, bills, payments]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Laporan Kas ke WhatsApp" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Pilih periode laporan kas yang ingin Anda bagikan langsung ke grup WhatsApp kelas atau broadcast mahasiswa.
        </p>

        {/* Period Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'week', label: 'Minggu Ini' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'year', label: 'Tahun Ini' },
              { id: 'all', label: 'Semua Periode' },
            ] as const
          ).map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Customization Options */}
        <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDetails}
              onChange={e => setIncludeDetails(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-700 font-medium">Sertakan Rincian Transaksi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeBills}
              onChange={e => setIncludeBills(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-700 font-medium">Sertakan Status Tagihan Kas</span>
          </label>
        </div>

        {/* Live Preview of WhatsApp message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Pratinjau Teks WhatsApp:
            </label>
            <span className="text-[11px] text-slate-400">Siap dikirim</span>
          </div>
          <div className="p-4 bg-[#EFEAE2] rounded-xl border border-slate-300 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed selection:bg-emerald-200">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Teks Pesan</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Buka di WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
