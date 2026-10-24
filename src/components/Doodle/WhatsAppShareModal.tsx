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

  if (!isOpen) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Recent 5 expenses with concise notation
  const recentExpenses = transactions
    .filter(t => t.type === 'expense')
    .slice(0, 5)
    .map(t => `- ${t.date} | ${t.title}: ${formatRupiah(t.amount)}`)
    .join('\n');

  // WhatsApp formatted message text (Clean, official, no emoji clutter)
  const messageText = `*LAPORAN PERTANGGUNGJAWABAN KAS - ${settings.className.toUpperCase()}*
Tanggal: ${currentDate}
Tahun Ajaran: ${settings.academicYear}

RINGKASAN KEUANGAN KAS:
• Saldo Kas Sekarang : ${formatRupiah(balance)}
• Total Pemasukan    : ${formatRupiah(totalIncome)}
• Total Pengeluaran  : ${formatRupiah(totalExpense)}
• Tarif Iuran Kas    : ${formatRupiah(settings.weeklyDuesAmount)}/minggu

5 PENGELUARAN TERAKHIR:
${recentExpenses || '- Belum ada pengeluaran tercatat.'}

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

        {/* Message preview */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Pratinjau Pesan WhatsApp:
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
