import React, { useState } from 'react';
import { KasTransaction, ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleReceipt } from './DoodleDecorations.tsx';
import { X, Send, Copy, Check, ShieldAlert } from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: KasTransaction[];
  settings: ClassSettings;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
}) => {
  const { canEditKas } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'minggu_ini' | 'bulan_ini' | 'keseluruhan'>('bulan_ini');

  if (!isOpen) return null;

  // Filter transactions by period
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Calculate 7 days ago for "minggu_ini"
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const filteredTransactions = transactions.filter(t => {
    if (selectedPeriod === 'minggu_ini') {
      return t.date >= sevenDaysAgoStr;
    }
    if (selectedPeriod === 'bulan_ini') {
      return t.date.startsWith(currentMonthPrefix);
    }
    return true; // keseluruhan
  });

  const periodLabel = selectedPeriod === 'minggu_ini'
    ? '7 Hari Terakhir / Minggu Ini'
    : selectedPeriod === 'bulan_ini'
    ? `Bulan ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
    : 'Keseluruhan (All Time)';

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  // All-time balance
  const allTimeBalance = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0) -
    transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Recent 5 expenses in selected period
  const recentExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .slice(0, 5)
    .map(t => `- ${t.date} | ${t.title}: ${formatRupiah(t.amount)}`)
    .join('\n');

  // WhatsApp formatted message text
  const messageText = `*LAPORAN PERTANGGUNGJAWABAN KAS - ${settings.className.toUpperCase()}*
Periode: *${periodLabel.toUpperCase()}*
Tanggal Rilis: ${currentDate}
Tahun Ajaran: ${settings.academicYear}

RINGKASAN KEUANGAN KAS:
• Saldo Kas Total Aktif : ${formatRupiah(allTimeBalance)}
• Pemasukan (${periodLabel}) : ${formatRupiah(totalIncome)}
• Pengeluaran (${periodLabel}) : ${formatRupiah(totalExpense)}
• Selisih Periode Ini   : ${formatRupiah(balance)}
• Tarif Iuran Mingguan  : ${formatRupiah(settings.weeklyDuesAmount)}/minggu

DAFTAR PENGELUARAN (${periodLabel}):
${recentExpenses || '- Belum ada pengeluaran tercatat pada periode ini.'}

---
Laporan resmi kas kelas diverifikasi transparan melalui sistem Kelas Gue.
Foto kuitansi belanja & status checklist siswa dapat dicek langsung di aplikasi.`;

  const handleCopy = () => {
    sfx.playClick();
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!canEditKas) {
      alert('Hanya Bendahara atau Super Admin yang berhak membagikan laporan resmi ke WhatsApp.');
      return;
    }
    sfx.playMoneyIncome();
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-doodle bg-white max-w-xl w-full rounded-xl p-6 relative">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border-2 border-slate-900 flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Bagikan Rekap ke WhatsApp Kelas (1-Klik)
              </h3>
              <p className="text-xs text-slate-500">
                Format pesan rapi beserta tautan bukti nota kas.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playCardClose();
              onClose();
            }}
            className="w-8 h-8 btn-doodle bg-slate-100 rounded-md flex items-center justify-center text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Period Selector Tabs: Minggu Ini, Bulan Ini, Keseluruhan */}
        <div className="mb-4 space-y-1.5">
          <label className="block text-xs font-black uppercase text-slate-800">
            Pilih Rentang Periode Laporan Rekap:
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl">
            {[
              { id: 'minggu_ini', label: '📅 Minggu Ini' },
              { id: 'bulan_ini', label: '🗓️ Bulan Ini' },
              { id: 'keseluruhan', label: '📊 Keseluruhan' }
            ].map(p => {
              const isActive = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sfx.playOptionSelect();
                    setSelectedPeriod(p.id as any);
                  }}
                  className={`py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-black rounded-lg border-2 transition-all text-center ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 border-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                      : 'bg-white border-transparent text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message preview */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Pratinjau Pesan WhatsApp ({periodLabel}):
          </label>
          <textarea
            readOnly
            rows={10}
            value={messageText}
            className="w-full p-3 font-mono text-xs bg-slate-50 border-2 border-slate-900 rounded-md text-slate-800 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t-2 border-dashed border-slate-200">
          <button
            type="button"
            onClick={handleCopy}
            className="btn-doodle px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-bold rounded-md flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Pesan Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="btn-doodle px-5 py-2 bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Kirim ke WhatsApp →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
