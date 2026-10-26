import React, { useState } from 'react';
import { KasTransaction, KasMember, ClassSettings } from '../../types/kas.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { DoodleCurrencyInput } from '../UI/DoodleCurrencyInput.tsx';
import { DoodleSelect } from '../UI/DoodleSelect.tsx';
import { showToast } from '../UI/DoodleDialog.tsx';
import { Calculator, X, Save, Copy, Check, Users, Receipt } from 'lucide-react';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: KasMember[];
  settings: ClassSettings;
  onAddTransaction?: (tx: Omit<KasTransaction, 'id' | 'createdAt'>) => void;
  onConvertToKolektif?: (bill: {
    title: string;
    category: string;
    amountPerPerson: number;
    totalCost: number;
    participantIds: string[];
    notes: string;
  }) => void;
}

const EVENT_CATEGORIES = [
  'Acara & Lomba',
  'Konsumsi Kelas',
  'Perlengkapan Kelas',
  'Fotokopi & Tugas',
  'Sosial & Menjenguk',
  'Lain-lain'
];

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  members,
  settings,
  onAddTransaction,
  onConvertToKolektif,
}) => {
  const [eventName, setEventName] = useState('');
  const [totalCost, setTotalCost] = useState<number | ''>(50000);
  const [selectedCategory, setSelectedCategory] = useState(EVENT_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Student selection state (default: all checked)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    members.map(m => m.id)
  );

  if (!isOpen) return null;

  const activeCount = selectedMemberIds.length || 1;
  const costNumber = typeof totalCost === 'number' ? totalCost : 0;
  const sharePerStudent = Math.ceil(costNumber / activeCount);

  const formatRupiah = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const toggleMember = (id: string) => {
    sfx.playClick();
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    sfx.playToggle();
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map(m => m.id));
    }
  };

  const getWaRecapMessage = () => {
    const participantNames = members
      .filter(m => selectedMemberIds.includes(m.id))
      .map((m, idx) => `${idx + 1}. ${m.name}`)
      .join('\n');

    return (
      `*KALKULATOR SPLIT BILL ACARA KELAS*\n` +
      `*${settings.className}*\n\n` +
      `📌 *Acara/Kegiatan:* ${eventName || 'Acara Kelas'}\n` +
      `💰 *Total Biaya:* ${formatRupiah(costNumber)}\n` +
      `👥 *Peserta Ikut:* ${activeCount} Siswa\n` +
      `👉 *Iuran per Siswa:* *${formatRupiah(sharePerStudent)}*\n` +
      (notes ? `📝 *Catatan:* ${notes}\n\n` : '\n') +
      `*Daftar Peserta Iuran:*\n${participantNames || 'Belum ada'}\n\n` +
      `_— Dicatat via Aplikasi Kelas Gue_`
    );
  };

  const handleCopyRecap = () => {
    sfx.playClick();
    navigator.clipboard.writeText(getWaRecapMessage());
    setCopiedText(true);
    showToast('Teks rekap split bill berhasil disalin!', 'success');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSaveToKas = () => {
    if (!eventName.trim()) {
      showToast('Mohon isi nama acara/kegiatan.', 'error');
      return;
    }
    if (!costNumber || costNumber <= 0) {
      showToast('Mohon masukkan total biaya yang valid.', 'error');
      return;
    }

    if (onAddTransaction) {
      sfx.playMoneyIncome();
      onAddTransaction({
        type: 'expense',
        title: `Acara: ${eventName.trim()}`,
        amount: costNumber,
        category: selectedCategory,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Kalkulator Split Bill',
        notes: `Split Bill (${activeCount} siswa @ ${formatRupiah(sharePerStudent)}). ${notes}`.trim(),
      });
      showToast('Transaksi split bill berhasil disimpan ke Buku Kas!', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-doodle bg-[#FFFDF9] max-w-lg sm:max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-xl p-4 sm:p-6 relative border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B] animate-in zoom-in-95 duration-150 my-auto">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-300 border-2 border-slate-900 flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <Calculator className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Kalkulator Split Bill Acara
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                Hitung pembagian biaya kegiatan per siswa &amp; simpan ke kas
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

        {/* Main Form Inputs */}
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 text-[10px] mb-1">
              Nama Acara / Kegiatan *
            </label>
            <input
              type="text"
              placeholder="Contoh: Makrab, Konsumsi Kerja Kelompok, Fotokopi..."
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <DoodleCurrencyInput
                label="Total Biaya Acara"
                required
                value={totalCost}
                onChange={val => setTotalCost(val)}
              />
            </div>
            <div>
              <DoodleSelect
                label="Kategori Kas"
                value={selectedCategory}
                onChange={val => setSelectedCategory(val)}
                options={EVENT_CATEGORIES}
              />
            </div>
          </div>

          {/* Computed Share Card */}
          <div className="p-3.5 bg-amber-100/80 border-2 border-slate-900 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_#1E293B]">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                Patungan Per Siswa ({activeCount} Orang)
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono [font-variant-numeric:tabular-nums] mt-0.5">
                {formatRupiah(sharePerStudent)}
              </p>
            </div>
            <div className="text-right text-[10px] font-bold text-slate-700">
              <p>Total: {formatRupiah(costNumber)}</p>
              <p className="text-emerald-800">Siswa Ikut: {activeCount}/{members.length}</p>
            </div>
          </div>

          {/* Participant Selector List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold uppercase text-slate-600 text-[10px] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-800" />
                <span>Pilih Siswa yang Ikut Patungan ({activeCount}):</span>
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[10px] font-black text-slate-900 hover:underline"
              >
                {selectedMemberIds.length === members.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto p-2 bg-white border-2 border-slate-900 rounded-md grid grid-cols-2 sm:grid-cols-3 gap-1.5 no-scrollbar">
              {members.map(m => {
                const isChecked = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`p-1.5 rounded border text-left flex items-center justify-between gap-1 transition-all ${
                      isChecked
                        ? 'bg-emerald-100 border-slate-900 font-bold text-slate-900'
                        : 'bg-slate-50 border-slate-300 text-slate-500'
                    }`}
                  >
                    <span className="truncate text-[10px]">{m.name}</span>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[9px] ${
                      isChecked ? 'bg-slate-900 text-emerald-300 border-slate-900' : 'bg-white border-slate-400'
                    }`}>
                      {isChecked && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 text-[10px] mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Nota pembelian via Bpk. Slamet..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium border-2 border-slate-900 rounded-md focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-3 border-t-2 border-slate-900 space-y-2">
          {/* Main Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onConvertToKolektif && (
              <button
                type="button"
                onClick={() => {
                  if (!eventName.trim()) {
                    showToast('Mohon beri nama acara terlebih dahulu.', 'error');
                    return;
                  }
                  onConvertToKolektif({
                    title: eventName.trim(),
                    category: selectedCategory,
                    amountPerPerson: sharePerStudent,
                    totalCost: costNumber,
                    participantIds: selectedMemberIds,
                    notes: notes.trim()
                  });
                  onClose();
                }}
                className="btn-doodle w-full px-3 py-2.5 min-h-[42px] bg-amber-200 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-lg border-2 border-slate-900 flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#1E293B]"
                title="Jadikan tagihan kolektif dengan checklist pembayaran per siswa"
              >
                <Receipt className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="truncate">+ Jadi Iuran Kolektif</span>
              </button>
            )}
            {onAddTransaction && (
              <button
                type="button"
                onClick={handleSaveToKas}
                className="btn-doodle w-full px-3 py-2.5 min-h-[42px] bg-emerald-300 hover:bg-emerald-400 text-slate-900 text-xs font-black rounded-lg border-2 border-slate-900 flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#1E293B]"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span className="truncate">Simpan Pengeluaran Kas</span>
              </button>
            )}
          </div>

          {/* Secondary Utilities: Salin WA & Tutup */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyRecap}
              className="btn-doodle flex-1 px-3 py-2 min-h-[38px] bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border-2 border-slate-900"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-700" />}
              <span>Salin Rekap WA</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-doodle px-5 py-2 min-h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border-2 border-slate-900"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
