import React, { useState } from 'react';
import { KolektifBill, KasMember, KasTransaction, ClassSettings } from '../../types/kas.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, PushPin } from './DoodleDecorations.tsx';
import { DoodleCurrencyInput } from '../UI/DoodleCurrencyInput.tsx';
import { DoodleSelect } from '../UI/DoodleSelect.tsx';
import { showToast, showConfirm } from '../UI/DoodleDialog.tsx';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Share2,
  Trash2,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

interface KolektifBillTabProps {
  bills: KolektifBill[];
  members: KasMember[];
  settings: ClassSettings;
  canEdit: boolean;
  onAddBill: (bill: Omit<KolektifBill, 'id' | 'createdAt'>) => void;
  onUpdateBill: (id: string, updates: Partial<KolektifBill>) => void;
  onDeleteBill: (id: string) => void;
  onTogglePayment: (billId: string, memberId: string) => void;
  onSyncToKas?: (tx: Omit<KasTransaction, 'id' | 'createdAt'>) => void;
  onOpenSplitBillModal?: () => void;
}

const CATEGORIES = [
  'Acara & Seminar',
  'Patungan & Kaos',
  'Konsumsi Kelas',
  'Perlengkapan Kelas',
  'Fotokopi & Modul',
  'Sosial & Donasi',
  'Lain-lain'
];

export const KolektifBillTab: React.FC<KolektifBillTabProps> = ({
  bills,
  members,
  settings,
  canEdit,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onTogglePayment,
  onSyncToKas,
  onOpenSplitBillModal
}) => {
  const [selectedBillId, setSelectedBillId] = useState<string>(bills[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Form state for creating new bill
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [calcMode, setCalcMode] = useState<'fixed_per_person' | 'split_total'>('fixed_per_person');
  const [amountValue, setAmountValue] = useState<number | ''>(35000);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(() =>
    members.map(m => m.id)
  );
  const [modalSearchFilter, setModalSearchFilter] = useState('');

  const activeBill = bills.find(b => b.id === selectedBillId) || bills[0];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Participant selection handlers inside Modal
  const handleToggleParticipant = (id: string) => {
    sfx.playClick();
    setSelectedParticipantIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllParticipants = () => {
    sfx.playToggle();
    setSelectedParticipantIds(members.map(m => m.id));
  };

  const handleDeselectAllParticipants = () => {
    sfx.playToggle();
    setSelectedParticipantIds([]);
  };

  // Calculated per-person amount
  const computedAmountPerPerson = () => {
    const num = typeof amountValue === 'number' ? amountValue : 0;
    if (calcMode === 'fixed_per_person') return num;
    const count = selectedParticipantIds.length || 1;
    return Math.ceil(num / count);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Mohon masukkan nama acara atau tagihan kolektif.', 'error');
      return;
    }
    if (selectedParticipantIds.length === 0) {
      showToast('Pilih minimal satu siswa peserta tagihan.', 'error');
      return;
    }
    const finalAmount = computedAmountPerPerson();
    if (finalAmount <= 0) {
      showToast('Nominal biaya harus lebih dari Rp 0.', 'error');
      return;
    }

    sfx.playSuccess();
    onAddBill({
      title: title.trim(),
      category,
      amountPerPerson: finalAmount,
      totalCost: calcMode === 'split_total' && typeof amountValue === 'number' ? amountValue : finalAmount * selectedParticipantIds.length,
      dueDate,
      notes: notes.trim(),
      participantIds: selectedParticipantIds,
      paidMemberIds: [],
      syncedToKas: false
    });

    showToast(`Tagihan "${title}" berhasil dibuat!`, 'success');
    setIsCreateModalOpen(false);
    // Reset form
    setTitle('');
    setAmountValue(35000);
    setNotes('');
  };

  // Bulk Payment actions for active bill
  const handleMarkAllPaid = async () => {
    if (!activeBill || !canEdit) return;
    const ok = await showConfirm({
      title: 'Tandai Semua Lunas?',
      message: `Semua ${activeBill.participantIds.length} peserta akan ditandai Lunas untuk tagihan "${activeBill.title}".`,
      confirmLabel: 'Ya, Tandai Semua',
      cancelLabel: 'Batal'
    });
    if (ok) {
      sfx.playSuccess();
      onUpdateBill(activeBill.id, { paidMemberIds: [...activeBill.participantIds] });
      showToast('Semua peserta berhasil ditandai lunas.', 'success');
    }
  };

  const handleUnmarkAllPaid = async () => {
    if (!activeBill || !canEdit) return;
    const ok = await showConfirm({
      title: 'Batalkan Semua Status Lunas?',
      message: `Status lunas untuk seluruh peserta akan dikosongkan.`,
      confirmLabel: 'Ya, Batalkan',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playWarning();
      onUpdateBill(activeBill.id, { paidMemberIds: [] });
      showToast('Semua status pembayaran berhasil dibatalkan.', 'info');
    }
  };

  const handleDeleteActiveBill = async () => {
    if (!activeBill || !canEdit) return;
    const ok = await showConfirm({
      title: 'Hapus Tagihan Kolektif?',
      message: `Apakah Anda yakin ingin menghapus tagihan "${activeBill.title}"? Data pembayaran peserta tagihan ini akan dihapus.`,
      confirmLabel: 'Hapus Tagihan',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playDelete();
      onDeleteBill(activeBill.id);
      showToast('Tagihan kolektif berhasil dihapus.', 'info');
    }
  };

  // WhatsApp Recap Generator
  const handleCopyWhatsAppRecap = () => {
    if (!activeBill) return;
    sfx.playClick();

    const participants = members.filter(m => activeBill.participantIds.includes(m.id));
    const paidList = participants.filter(m => activeBill.paidMemberIds.includes(m.id));
    const unpaidList = participants.filter(m => !activeBill.paidMemberIds.includes(m.id));

    const totalCollected = paidList.length * activeBill.amountPerPerson;
    const totalTarget = participants.length * activeBill.amountPerPerson;

    const message =
      `📢 *REKAP PEMBAYARAN TAGIHAN KOLEKTIF*\n` +
      `*${settings.className}*\n\n` +
      `📌 *Acara/Tagihan:* ${activeBill.title}\n` +
      `🏷️ *Kategori:* ${activeBill.category}\n` +
      `💰 *Biaya per Siswa:* ${formatRupiah(activeBill.amountPerPerson)}\n` +
      `📅 *Tenggat Waktu:* ${activeBill.dueDate}\n` +
      `📊 *Progres:* ${paidList.length}/${participants.length} Siswa (${formatRupiah(totalCollected)} / ${formatRupiah(totalTarget)})\n` +
      (activeBill.notes ? `📝 *Catatan:* ${activeBill.notes}\n\n` : '\n') +
      `✅ *SUDAH LUNAS (${paidList.length}):*\n` +
      (paidList.length > 0
        ? paidList.map((m, idx) => `${idx + 1}. ${m.name}`).join('\n')
        : '- Belum ada -') +
      `\n\n❌ *BELUM LUNAS (${unpaidList.length}):*\n` +
      (unpaidList.length > 0
        ? unpaidList.map((m, idx) => `${idx + 1}. ${m.name}`).join('\n')
        : '- Semua sudah lunas! 🎉-') +
      `\n\n_— Dicatat via Aplikasi Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Teks rekap tagihan kolektif berhasil disalin untuk WhatsApp!', 'success');
  };

  // Sync collected funds into Buku Kas
  const handleSyncToBukuKas = async () => {
    if (!activeBill || !onSyncToKas) return;
    const collectedAmount = activeBill.paidMemberIds.length * activeBill.amountPerPerson;

    if (collectedAmount <= 0) {
      showToast('Belum ada dana yang terkumpul untuk dicatat ke Buku Kas.', 'error');
      return;
    }

    const ok = await showConfirm({
      title: 'Catat Dana Kolektif ke Buku Kas?',
      message: `Dana terkumpul sebesar ${formatRupiah(collectedAmount)} dari ${activeBill.paidMemberIds.length} siswa akan dicatat sebagai pemasukan resmi kas kelas.`,
      confirmLabel: 'Ya, Catat ke Buku Kas',
      cancelLabel: 'Batal'
    });

    if (ok) {
      sfx.playSuccess();
      onSyncToKas({
        type: 'income',
        title: `Kolektif: ${activeBill.title}`,
        amount: collectedAmount,
        category: 'Iuran Kas',
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Bendahara',
        notes: `KOLEKTIF_SYNC:${activeBill.id} (${activeBill.paidMemberIds.length} Siswa)`
      });
      onUpdateBill(activeBill.id, { syncedToKas: true });
      showToast(`Dana kolektif berhasil dicatat ke Buku Kas & Nota!`, 'success');
    }
  };

  // Filtered members for active bill payment checklist
  const activeParticipants = activeBill
    ? members.filter(m => activeBill.participantIds.includes(m.id))
    : [];

  const filteredParticipants = activeParticipants.filter(m => {
    if (!memberSearchQuery) return true;
    const q = memberSearchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="card-doodle bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />
        <PushPin className="top-3 right-4 absolute" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-200 text-slate-900 border border-slate-900 rounded">
                Ranah Bendahara
              </span>
              <span className="text-xs font-bold text-slate-500">
                Pencatatan Non-Iuran Mingguan
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-600" />
              <span>Iuran Khusus & Tagihan Kolektif</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Catat pembayaran patungan acara kelas, seminar, uang jaket/seragam, atau modul pembelajaran. Pantau siapa saja yang ikut dan centang yang sudah melunasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenSplitBillModal && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenSplitBillModal();
                }}
                className="btn-doodle px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-slate-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
              >
                <Calculator className="w-4 h-4 text-amber-700" />
                <span>Kalkulator Cepat</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsCreateModalOpen(true);
                }}
                className="btn-doodle px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Buat Tagihan Acara</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Selector Pills / Strip */}
      {bills.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {bills.map(b => {
            const isSelected = activeBill?.id === b.id;
            const paidCount = b.paidMemberIds.length;
            const totalCount = b.participantIds.length;
            const isFinished = paidCount >= totalCount && totalCount > 0;

            return (
              <button
                key={b.id}
                onClick={() => {
                  sfx.playToggle();
                  setSelectedBillId(b.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-300 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_#1E293B] -translate-y-0.5'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50'
                }`}
              >
                <span>{b.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-black border ${
                  isFinished
                    ? 'bg-emerald-200 border-emerald-500 text-emerald-900'
                    : 'bg-white border-slate-400 text-slate-700'
                }`}>
                  {paidCount}/{totalCount}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card-doodle bg-white p-8 rounded-2xl border-2 border-slate-900 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-800">Belum Ada Tagihan Kolektif</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Buat tagihan pertama untuk acara seminar, jaket angkatan, atau patungan kegiatan kelas Anda.
          </p>
          {canEdit && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-doodle px-4 py-2 bg-amber-300 text-slate-900 font-bold text-xs rounded-xl border-2 border-slate-900"
            >
              + Buat Tagihan Baru
            </button>
          )}
        </div>
      )}

      {/* Active Campaign Detail Box */}
      {activeBill && (
        <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] overflow-hidden">
          {/* Top Info Bar */}
          <div className="bg-[#FFFDF5] p-5 border-b-2 border-slate-900 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-200 border border-slate-900 rounded">
                    {activeBill.category}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Tenggat: {activeBill.dueDate}
                  </span>
                  {activeBill.syncedToKas && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-1.5 py-0.5 rounded">
                      Tercatat di Kas
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeBill.title}
                </h3>
                {activeBill.notes && (
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    {activeBill.notes}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyWhatsAppRecap}
                  className="btn-doodle px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[1px_1px_0px_#1E293B]"
                  title="Salin rekap pesan untuk dibagikan ke WhatsApp grup kelas"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Salin Rekap WA</span>
                </button>

                {canEdit && onSyncToKas && (
                  <button
                    onClick={handleSyncToBukuKas}
                    disabled={activeBill.syncedToKas}
                    className={`btn-doodle px-3 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[1px_1px_0px_#1E293B] ${
                      activeBill.syncedToKas
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-sky-200 hover:bg-sky-300 text-slate-900'
                    }`}
                    title="Catat total dana terkumpul saat ini sebagai transaksi pemasukan di Buku Kas"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{activeBill.syncedToKas ? 'Sudah di Kas' : 'Catat ke Buku Kas'}</span>
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={handleDeleteActiveBill}
                    className="btn-doodle p-2 bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-[1px_1px_0px_#1E293B]"
                    title="Hapus tagihan kolektif ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress & Metrics Strip */}
            {(() => {
              const totalPeserta = activeBill.participantIds.length;
              const paidCount = activeBill.paidMemberIds.length;
              const percent = totalPeserta > 0 ? Math.round((paidCount / totalPeserta) * 100) : 0;
              const totalTarget = totalPeserta * activeBill.amountPerPerson;
              const totalCollected = paidCount * activeBill.amountPerPerson;

              return (
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-900 shadow-[1px_1px_0px_#1E293B]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Biaya / Siswa</p>
                      <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                        {formatRupiah(activeBill.amountPerPerson)}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-900 shadow-[1px_1px_0px_#1E293B]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Partisipan</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {paidCount} / {totalPeserta} Lunas
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-900 shadow-[1px_1px_0px_#1E293B]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Dana Terkumpul</p>
                      <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                        {formatRupiah(totalCollected)}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-900 shadow-[1px_1px_0px_#1E293B]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Target</p>
                      <p className="text-sm font-black text-slate-700 font-mono mt-0.5">
                        {formatRupiah(totalTarget)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-900 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300 border-r border-slate-900"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Checklist Controls Bar */}
          <div className="p-4 border-b-2 border-slate-900 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search participant */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau NIM siswa..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-slate-900 bg-white focus:outline-hidden focus:bg-amber-50"
              />
            </div>

            {/* Quick check all / uncheck all */}
            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleMarkAllPaid}
                  className="btn-doodle px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-slate-900 rounded-md text-[11px] font-bold flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tandai Semua Lunas</span>
                </button>
                <button
                  onClick={handleUnmarkAllPaid}
                  className="btn-doodle px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-slate-900 rounded-md text-[11px] font-bold flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Batal Semua</span>
                </button>
              </div>
            )}
          </div>

          {/* Student Payment Checklist Table / Grid */}
          <div className="p-4 bg-paper-grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredParticipants.map(member => {
                const isPaid = activeBill.paidMemberIds.includes(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      if (!canEdit) return;
                      sfx.playToggle();
                      onTogglePayment(activeBill.id, member.id);
                    }}
                    className={`card-doodle p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                      canEdit ? 'cursor-pointer hover:-translate-y-0.5' : ''
                    } ${
                      isPaid
                        ? 'bg-emerald-50/90 border-emerald-600 shadow-[2px_2px_0px_#059669]'
                        : 'bg-white border-slate-900 shadow-[2px_2px_0px_#1E293B]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {member.studentId || 'Tanpa NIM'}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          BELUM
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredParticipants.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                Tidak ada siswa yang sesuai dengan filter pencarian.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Buat Tagihan Kolektif Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="card-doodle bg-white w-full max-w-xl rounded-2xl border-3 border-slate-900 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Buat Tagihan Acara / Kolektif Baru
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Acara / Tagihan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Seminar AI Nasional, Kaos Angkatan, dll."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 bg-amber-50/50 font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <DoodleSelect
                    value={category}
                    onChange={setCategory}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
              </div>

              {/* Calculation Mode */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Metode Perhitungan Biaya</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcMode('fixed_per_person')}
                    className={`py-2 px-3 rounded-lg border-2 text-left font-bold ${
                      calcMode === 'fixed_per_person'
                        ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    Biaya Tetap per Orang
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('split_total')}
                    className={`py-2 px-3 rounded-lg border-2 text-left font-bold ${
                      calcMode === 'split_total'
                        ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    Bagi Rata Total Biaya
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {calcMode === 'fixed_per_person' ? 'Biaya per Siswa' : 'Total Biaya Acara (Dibagi Peserta)'}
                </label>
                <DoodleCurrencyInput
                  value={amountValue}
                  onChange={setAmountValue}
                  placeholder="0"
                />
                {calcMode === 'split_total' && (
                  <p className="text-[11px] text-amber-800 font-bold mt-1">
                    👉 Biaya per peserta: {formatRupiah(computedAmountPerPerson())} ({selectedParticipantIds.length} siswa)
                  </p>
                )}
              </div>

              {/* Participant Selection */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Peserta yang Mengikuti ({selectedParticipantIds.length}/{members.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllParticipants}
                      className="text-[11px] text-sky-700 font-bold hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllParticipants}
                      className="text-[11px] text-rose-600 font-bold hover:underline"
                    >
                      Batal Semua
                    </button>
                  </div>
                </div>

                {/* Filter participant in modal */}
                <input
                  type="text"
                  placeholder="Cari nama peserta..."
                  value={modalSearchFilter}
                  onChange={e => setModalSearchFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-400 bg-white"
                />

                <div className="max-h-40 overflow-y-auto border-2 border-slate-900 rounded-lg p-2 bg-slate-50 space-y-1">
                  {members
                    .filter(m => m.name.toLowerCase().includes(modalSearchFilter.toLowerCase()))
                    .map(m => {
                      const checked = selectedParticipantIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleParticipant(m.id)}
                          className={`p-1.5 rounded flex items-center justify-between text-xs cursor-pointer select-none ${
                            checked ? 'bg-amber-100 font-bold text-slate-900' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {checked ? '✓ Ikut' : '-'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Rincian fasilitas, nomor rekening panitia, dll."
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-doodle px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000]"
                >
                  Simpan Tagihan Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
