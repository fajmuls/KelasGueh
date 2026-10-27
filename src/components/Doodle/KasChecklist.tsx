import React, { useState, useRef } from 'react';
import { KasMember, ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { LocalKasRepository } from '../../services/supabaseClient.ts';
import {
  Check,
  X,
  Search,
  UserPlus,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Download,
  MessageCircle,
  Copy,
  Send,
  AlertTriangle,
  Edit2,
  Save,
  Zap,
  Hand,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { showToast, showConfirm } from '../UI/DoodleDialog.tsx';
import { toTitleCase } from '../../utils/textFormatting.ts';

interface KasChecklistProps {
  members: KasMember[];
  settings: ClassSettings;
  onToggleWeek: (memberId: string, weekKey: string) => void;
  onToggleAllWeek?: (weekKey: string, shouldPay: boolean) => Promise<void> | void;
  onAddMember: (name: string, studentId: string, phone?: string) => void;
  onAddMembers?: (newMembersList: { name: string; studentId: string; phone?: string }[]) => void;
  onUpdateMember?: (memberId: string, updates: Partial<KasMember>) => void;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKS_LABELS = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];

export const KasChecklist: React.FC<KasChecklistProps> = ({
  members,
  settings,
  onToggleWeek,
  onToggleAllWeek,
  onAddMember,
  onAddMembers,
  onUpdateMember,
}) => {
  const { canEditKas } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Card View Mode State (Mode Kartu Per-Siswa)
  const [isFastTapMode, setIsFastTapMode] = useState(false);
  const [selectedFastTapWeek, setSelectedFastTapWeek] = useState(0); // 0..3
  
  // Helpers for month-week logic
  const currentMonthDues = (() => {
    const mKey = `${selectedYear}_${selectedMonth + 1}`;
    return settings.monthlyDuesOverrides?.[mKey] !== undefined
      ? settings.monthlyDuesOverrides[mKey]
      : settings.weeklyDuesAmount;
  })();

  const getWeekKey = (weekIndex: number) => {
    return `${selectedYear}_${(selectedMonth + 1).toString().padStart(2, '0')}_W${weekIndex + 1}`;
  };

  const getWeekRangeLabel = (weekIndex: number) => {
    const starts = [1, 8, 15, 22];
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const ends = [7, 14, 21, lastDay];
    const monthName = MONTHS[selectedMonth].substring(0, 3);
    return `${starts[weekIndex]}-${ends[weekIndex]} ${monthName}`;
  };

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', studentId: '', phone: '' });

  const startEditing = (member: KasMember) => {
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      studentId: member.studentId,
      phone: member.phone || ''
    });
    sfx.playClick();
  };

  const handleSaveEdit = () => {
    if (editingId && onUpdateMember) {
      onUpdateMember(editingId, {
        name: editForm.name,
        studentId: editForm.studentId,
        phone: editForm.phone || undefined
      });
      sfx.playSuccess();
    }
    setEditingId(null);
  };

  // Single member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNim, setNewNim] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Bulk Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{ name: string; studentId: string; phone?: string }[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // WhatsApp Reminder modal
  const [reminderMember, setReminderMember] = useState<KasMember | null>(null);
  const [showAllArrearsModal, setShowAllArrearsModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'arrears'>('all');

  // Bulk toggle loading state & anti-spam click throttle
  const [bulkLoadingWeek, setBulkLoadingWeek] = useState<{ weekKey: string; weekLabel: string; shouldPay: boolean } | null>(null);
  const lastSingleClickRef = useRef<number>(0);

  const handleSafeSingleToggle = (memberId: string, weekKey: string) => {
    if (!canEditKas) return;
    const now = Date.now();
    if (now - lastSingleClickRef.current < 280) {
      // Throttled to prevent fast clicking race condition
      return;
    }
    lastSingleClickRef.current = now;
    sfx.playCoinChime();
    onToggleWeek(memberId, weekKey);
  };

  const handleSafeToggleAllWeek = async (weekIdx: number) => {
    if (!canEditKas || !onToggleAllWeek) return;
    const wKey = getWeekKey(weekIdx);
    const allPaid = filteredMembers.length > 0 && filteredMembers.every(m => !!m.weeklyStatus?.[wKey]);
    const shouldPay = !allPaid;

    sfx.playOptionSelect();
    setBulkLoadingWeek({
      weekKey: wKey,
      weekLabel: `Minggu ke-${weekIdx + 1} (${MONTHS[selectedMonth]} ${selectedYear})`,
      shouldPay
    });

    try {
      await onToggleAllWeek(wKey, shouldPay);
      sfx.playBulkLoadingSuccess();
      showToast(
        shouldPay
          ? `Berhasil sinkronisasi kas: Seluruh siswa ditandai Lunas untuk Minggu ke-${weekIdx + 1}!`
          : `Status lunas Minggu ke-${weekIdx + 1} telah dibatalkan untuk seluruh siswa.`,
        'success'
      );
    } catch (err) {
      console.error('Bulk toggle error:', err);
      showToast('Gagal sinkronisasi kas massal.', 'error');
    } finally {
      setBulkLoadingWeek(null);
    }
  };

  const membersWithArrears = members.filter(m => {
    const monthWeekKeys = [0, 1, 2, 3].map(idx => getWeekKey(idx));
    return monthWeekKeys.some(key => !m.weeklyStatus?.[key]);
  });

  const baseList = filterMode === 'arrears' ? membersWithArrears : members;

  const filteredMembers = baseList.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.studentId.includes(search)
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddMember(
      newName.trim(),
      newNim.trim() || `230101${(members.length + 1).toString().padStart(3, '0')}`,
      newPhone.trim() || undefined
    );
    sfx.playCoinChime();
    setNewName('');
    setNewNim('');
    setNewPhone('');
    setShowAddMember(false);
  };

  const formatRupiah = (val: number) => {
    return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
  };

  const formatPhone = (raw: string): string => {
    let clean = raw.replace(/[^\d+]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('+62')) {
      clean = clean.slice(1);
    }
    return clean;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    sfx.playPaperRustle();

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          setImportError('File kosong atau tidak memiliki data tabel.');
          return;
        }

        const parsedList: { name: string; studentId: string; phone?: string }[] = [];
        let startIndex = 0;
        const firstRowStr = (rawJson[0] || []).join(' ').toLowerCase();
        if (firstRowStr.includes('nama') || firstRowStr.includes('nim') || firstRowStr.includes('siswa')) {
          startIndex = 1;
        }

        for (let i = startIndex; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;
          let name = '';
          let studentId = '';
          let phone = '';
          const cells = row.map((c: any) => String(c ?? '').trim()).filter((c: string) => c !== '');
          if (cells.length === 0) continue;

          if (cells.length === 1) {
            name = cells[0];
            studentId = `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
          } else if (cells.length >= 2) {
            const firstIsNum = /^\d+$/.test(cells[0]);
            const secondIsNum = /^\d+$/.test(cells[1]);
            if (firstIsNum && cells[0].length >= 7) {
              studentId = cells[0];
              name = cells[1];
              phone = cells[2] || '';
            } else if (secondIsNum && cells[1].length >= 7) {
              name = cells[0];
              studentId = cells[1];
              phone = cells[2] || '';
            } else if (firstIsNum && cells[0].length <= 3) {
              name = cells[1];
              studentId = cells[2] || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
              phone = cells[3] || '';
            } else {
              name = cells[0];
              studentId = cells[1];
              phone = cells[2] || '';
            }
          }

          if (name) {
            parsedList.push({
              name,
              studentId: studentId || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`,
              phone: phone ? formatPhone(phone) : undefined
            });
          }
        }

        if (parsedList.length === 0) {
          setImportError('Tidak dapat mengekstrak nama siswa dari file.');
        } else {
          setImportPreview(parsedList);
          sfx.playSuccess();
        }
      } catch (err: any) {
        setImportError(`Gagal membaca file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleParsePaste = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.trim().split(/\r?\n/);
    const parsedList: { name: string; studentId: string; phone?: string }[] = [];
    lines.forEach((line) => {
      const parts = line.split(/[\t,;]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 1) {
        let name = parts[0];
        let studentId = parts[1] || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
        let phone = parts[2] || '';
        if (/^\d+\.?$/.test(parts[0]) && parts.length >= 2) {
          name = parts[1];
          studentId = parts[2] || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
          phone = parts[3] || '';
        }
        parsedList.push({ name, studentId, phone: phone ? formatPhone(phone) : undefined });
      }
    });
    if (parsedList.length > 0) {
      setImportPreview(parsedList);
      setPasteData('');
      sfx.playSuccess();
    } else {
      setImportError('Format teks paste tidak dikenali.');
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    if (onAddMembers) {
      onAddMembers(importPreview);
    } else {
      importPreview.forEach(m => onAddMember(m.name, m.studentId, m.phone));
    }
    sfx.playLevelUp();
    setShowImportModal(false);
    setImportPreview([]);
  };

  const handleDownloadTemplate = () => {
    sfx.playFileDownload();
    const csvContent = 'No,Nama Siswa,NIM,No WhatsApp\n1,Ahmad Fauzi,230101001,081234567890\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const txs = LocalKasRepository.getTransactions();
  const totalTxIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalTxExpense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = totalTxIncome - totalTxExpense;
  const currentMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthExpenses = txs
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
    .reduce((acc, t) => acc + t.amount, 0);

  const getWhatsAppReminderMessage = (member: KasMember) => {
    const monthWeekKeys = [0, 1, 2, 3].map(idx => getWeekKey(idx));
    const unpaidWeeks = monthWeekKeys.filter(key => !member.weeklyStatus?.[key]);
    const unpaidLabels = unpaidWeeks.map(k => `Minggu ${k.split('-W')[1] || k}`).join(', ');
    const totalUnpaid = unpaidWeeks.length * currentMonthDues;

    return `*LAPORAN IURAN KAS KELAS*\n` +
      `*${settings.className}* · Periode *${MONTHS[selectedMonth]} ${selectedYear}*\n\n` +
      `Yth. Sdr/i *${toTitleCase(member.name)}* (NIM: ${member.studentId}),\n\n` +
      `Berikut rincian transparansi status iuran kas kelas Anda:\n` +
      `• *Total Kas Terkumpul:* ${formatRupiah(currentBalance)}\n` +
      `• *Pengeluaran Bulan Ini:* ${formatRupiah(monthExpenses)}\n` +
      `• *Iuran Kas Mingguan:* ${formatRupiah(currentMonthDues)}\n` +
      `• *Tunggakan Belum Bayar:* ${unpaidWeeks.length} Minggu (${unpaidLabels})\n` +
      `• *Total Tagihan Iuran:* *${formatRupiah(totalUnpaid)}*\n\n` +
      `Mohon dapat segera menyelesaikan pembayaran iuran kas melalui Bendahara Kelas.\n` +
      `Terima kasih atas kerja sama dan transparansinya. 🙏\n\n` +
      `_— Pengurus Kas ${settings.className}_`;
  };

  const handleSendWhatsApp = (member: KasMember) => {
    if (!canEditKas) return;
    sfx.playMoneyIncome();
    const msg = getWhatsAppReminderMessage(member);
    const encoded = encodeURIComponent(msg);
    const phone = member.phone ? formatPhone(member.phone) : '';
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {/* Header card - Compact and Doodle */}
      <div className="card-doodle p-3 sm:p-4 rounded-xl bg-[#FFFDF9] relative">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900 pb-2.5 mb-2.5">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              <span>Matriks Checklist Iuran Mingguan</span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Tarif Iuran: <strong className="text-slate-900">{formatRupiah(currentMonthDues)}/mgg</strong> · Saldo Kas: <strong className="text-emerald-700">{formatRupiah(currentBalance)}</strong>
            </p>
          </div>
          {/* Action buttons: Compact Mode Kartu and Tagih WA */}
          <div className="flex items-center gap-1.5 shrink-0 mt-2 sm:mt-0">
            {canEditKas && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setIsFastTapMode(!isFastTapMode);
                }}
                className={`btn-doodle px-2.5 py-1.5 min-h-[38px] text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  isFastTapMode
                    ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[1px_1px_0px_#000]'
                    : 'bg-white hover:bg-indigo-50 text-slate-800 border-2 border-slate-900'
                }`}
                title="Tampilan Mode Kartu Per-Siswa"
              >
                <Hand className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{isFastTapMode ? 'Mode Kartu (Aktif)' : 'Mode Kartu'}</span>
              </button>
            )}

            {canEditKas && (
              <button
                type="button"
                disabled={membersWithArrears.length === 0}
                onClick={() => setShowAllArrearsModal(true)}
                className={`btn-doodle px-2.5 py-1.5 min-h-[38px] border-2 border-slate-900 font-bold rounded-md text-xs flex items-center justify-center gap-1.5 transition-all ${
                  membersWithArrears.length > 0
                    ? 'bg-emerald-300 hover:bg-emerald-400 text-slate-900'
                    : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>Tagih WA ({membersWithArrears.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Selector, Quick Arrears Filter, and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Month Stepper */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-100 p-1 border-2 border-slate-900 rounded-md shrink-0">
            <button onClick={() => { sfx.playToggle(); const prev = selectedMonth === 0 ? 11 : selectedMonth - 1; if (selectedMonth === 0) setSelectedYear(y => y - 1); setSelectedMonth(prev); }} className="p-1 hover:bg-white rounded text-xs font-bold">←</button>
            <div className="px-2 text-[10px] sm:text-xs font-black text-slate-900 min-w-[90px] sm:min-w-[110px] text-center">{MONTHS[selectedMonth]} {selectedYear}</div>
            <button onClick={() => { sfx.playToggle(); const next = selectedMonth === 11 ? 0 : selectedMonth + 1; if (selectedMonth === 11) setSelectedYear(y => y + 1); setSelectedMonth(next); }} className="p-1 hover:bg-white rounded text-xs font-bold">→</button>
          </div>

          {/* Quick Filter: [Semua] vs [Hanya Belum Lunas] */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 border-2 border-slate-900 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => { sfx.playClick(); setFilterMode('all'); }}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                filterMode === 'all'
                  ? 'bg-amber-300 text-slate-900 shadow-[1px_1px_0px_#000]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({members.length})
            </button>
            <button
              type="button"
              onClick={() => { sfx.playClick(); setFilterMode('arrears'); }}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all flex items-center gap-1 ${
                filterMode === 'arrears'
                  ? 'bg-rose-300 text-slate-900 shadow-[1px_1px_0px_#000]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Belum Lunas</span>
              <span className="px-1 bg-rose-500 text-white rounded text-[8px] font-black">{membersWithArrears.length}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIM siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-[11px] bg-white border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
            />
          </div>
        </div>
      </div>

      {/* CARD VIEW MODE FOR CLASSROOM COLLECTION */}
      {isFastTapMode ? (
        <div className="card-doodle p-4 rounded-xl bg-amber-50/50 border-2 border-slate-900 space-y-4">
          {/* Week Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 border-2 border-slate-900 rounded-md">
            <div>
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-amber-600" />
                <span>Mode Kartu Per-Siswa (Pilih Minggu & Ketuk Kartu)</span>
              </p>
              <p className="text-[10px] text-slate-600">
                Pilih minggu di atas, lalu ketuk kartu siswa untuk mengubah status lunas iuran minggu tersebut.
              </p>
            </div>

            {/* Week Pills */}
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
              {[0, 1, 2, 3].map(wIdx => {
                const isActive = selectedFastTapWeek === wIdx;
                const wKey = getWeekKey(wIdx);
                const paidInWeek = members.filter(m => !!m.weeklyStatus?.[wKey]).length;

                return (
                  <button
                    key={wIdx}
                    onClick={() => {
                      sfx.playToggle();
                      setSelectedFastTapWeek(wIdx);
                    }}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-black border-2 border-slate-900 transition-all ${
                      isActive
                        ? 'bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#1E293B] -translate-y-0.5'
                        : 'bg-slate-100 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>W{wIdx + 1}</span>
                    <span className="ml-1 text-[9px] font-mono text-slate-800 bg-white/70 px-1 rounded">
                      {paidInWeek}/{members.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Week Progress Counter */}
          {(() => {
            const currentWKey = getWeekKey(selectedFastTapWeek);
            const paidCountInWeek = members.filter(m => !!m.weeklyStatus?.[currentWKey]).length;
            const weekTotalCollected = paidCountInWeek * (settings.weeklyDuesAmount || 0);

            return (
              <div className="flex items-center justify-between p-3 bg-white border-2 border-slate-900 rounded-md">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Progres {WEEKS_LABELS[selectedFastTapWeek]} ({getWeekRangeLabel(selectedFastTapWeek)})</span>
                  <p className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    {paidCountInWeek} / {members.length} Lunas <span className="text-xs text-slate-500 font-sans font-normal">({Math.round((paidCountInWeek / (members.length || 1)) * 100)}%)</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Iuran Terkumpul Minggu Ini</span>
                  <p className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                    {formatRupiah(weekTotalCollected)}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Student Tap Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[55vh] overflow-y-auto p-1 select-none">
            {filteredMembers.map((member) => {
              const currentWKey = getWeekKey(selectedFastTapWeek);
              const isPaid = !!member.weeklyStatus?.[currentWKey];

              return (
                <div
                  key={member.id}
                  onClick={() => handleSafeSingleToggle(member.id, currentWKey)}
                  className={`p-3 rounded-lg border-2 border-slate-900 transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isPaid
                      ? 'bg-emerald-300 shadow-[2px_2px_0px_#1E293B] scale-[1.01]'
                      : 'bg-white hover:bg-amber-50 shadow-[1px_1px_0px_#1E293B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate leading-tight">{toTitleCase(member.name)}</p>
                      <p className="text-[9px] font-mono text-slate-600">{member.studentId}</p>
                    </div>
                    <div className={`w-6 h-6 rounded border-2 border-slate-900 flex items-center justify-center shrink-0 ${
                      isPaid ? 'bg-slate-900 text-emerald-300' : 'bg-white text-slate-300'
                    }`}>
                      {isPaid ? <Check className="w-4 h-4 stroke-[4]" /> : <X className="w-3 h-3" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono font-bold pt-1 border-t border-slate-900/20">
                    <span className={isPaid ? 'text-slate-900' : 'text-slate-400'}>
                      {isPaid ? '✓ Lunas' : 'Belum Bayar'}
                    </span>
                    <span className={isPaid ? 'text-slate-900' : 'text-slate-500'}>
                      {formatRupiah(currentMonthDues)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative card-doodle bg-white rounded-xl overflow-hidden border-2 border-slate-900 shadow-xs">
          {/* Mobile Horizontal Scroll Hint Cue */}
          <div className="sm:hidden flex items-center justify-between px-2.5 py-1 bg-amber-50 border-b border-slate-300 text-[10px] font-bold text-slate-700">
            <span>Matriks Siswa &amp; Minggu</span>
            <span className="flex items-center gap-1 text-amber-900 font-black">
              <span>Geser tabel W1 - W4</span>
              <span>➔</span>
            </span>
          </div>

          <div className="overflow-auto max-h-[60vh] relative overscroll-contain touch-pan-x touch-pan-y">
            <table className="w-full text-left text-[10px] border-collapse min-w-[600px]">
              <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 font-black uppercase text-slate-700 sticky top-0 z-40">
                <tr>
                  <th className="py-2 px-1 w-6 text-center bg-[#FAF7F2]">#</th>
                  <th className="py-2 px-2 w-[140px] sticky left-0 z-50 bg-[#FAF7F2] border-r border-slate-200">Nama</th>
                  <th className="py-2 px-2 w-16 font-mono text-center hidden sm:table-cell">NIM</th>
                  {WEEKS_LABELS.map((label, idx) => (
                    <th key={idx} className="py-2 px-1 text-center font-mono w-14">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="text-[8px] opacity-70 scale-90">{getWeekRangeLabel(idx)}</div>
                        <div className="text-[9px] leading-tight">W{idx + 1}</div>
                        {canEditKas && (
                          <button
                            type="button"
                            onClick={() => handleSafeToggleAllWeek(idx)}
                            className="min-h-[44px] min-w-[36px] flex items-center justify-center p-1 -my-1.5"
                            title="Pilih Semua / Batal Semua Minggu Ini"
                          >
                            <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded hover:bg-slate-700 transition-colors uppercase">
                              All
                            </span>
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-right font-mono w-16">Total</th>
                  <th className="py-2 px-1 text-center w-12">Status</th>
                  <th className="py-2 px-1 text-center w-10">WA</th>
                  {canEditKas && <th className="py-2 px-1 text-center w-10">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={13} className="py-8 text-center text-slate-500 font-medium italic text-[11px]">Tidak ada data.</td></tr>
                ) : (
                  filteredMembers.map((member, index) => {
                    const monthWeekKeys = [0, 1, 2, 3].map(idx => getWeekKey(idx));
                    const paidWeeksInMonth = monthWeekKeys.filter(key => !!member.weeklyStatus?.[key]).length;
                    const totalPaid = paidWeeksInMonth * currentMonthDues;
                    const hasArrears = paidWeeksInMonth < 4;
                    const isEditing = editingId === member.id;

                    return (
                      <tr key={member.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="py-1 px-1 text-center font-mono text-[9px] text-slate-500">{index + 1}</td>
                        <td className="py-1 px-2 font-bold text-slate-900 sticky left-0 z-20 bg-white group-hover:bg-amber-50 transition-colors border-r border-slate-200">
                          {isEditing ? (
                            <input
                              className="w-full bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-[10px] focus:outline-none"
                              value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          ) : (
                            <span className="block text-[10px] sm:text-xs font-bold text-slate-900 leading-tight line-clamp-2 max-w-[130px] sm:max-w-none break-words" title={member.name}>
                              {toTitleCase(member.name)}
                            </span>
                          )}
                        </td>
                      <td className="py-1 px-2 font-mono text-[8px] text-slate-500 text-center hidden sm:table-cell">
                        {isEditing ? (
                          <input
                            className="w-full bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-[8px] focus:outline-none"
                            value={editForm.studentId}
                            onChange={e => setEditForm({ ...editForm, studentId: e.target.value })}
                          />
                        ) : (
                          member.studentId
                        )}
                      </td>

                      {/* Weekly checkboxes */}
                      {monthWeekKeys.map((wKey, idx) => {
                        const isPaid = !!member.weeklyStatus?.[wKey];
                        return (
                          <td key={idx} className="py-1 px-0.5 text-center">
                            {canEditKas ? (
                              <button
                                type="button"
                                onClick={() => handleSafeSingleToggle(member.id, wKey)}
                                className={`w-6 h-6 mx-auto rounded border-2 border-slate-800 flex items-center justify-center transition-transform active:scale-90 touch-manipulation cursor-pointer ${
                                  isPaid ? 'bg-emerald-400 text-slate-900 shadow-[1px_1px_0px_#1E293B]' : 'bg-white hover:bg-amber-100'
                                }`}
                              >
                                {isPaid && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                              </button>
                            ) : (
                              <div className={`w-5 h-5 mx-auto rounded border border-slate-800 flex items-center justify-center ${isPaid ? 'bg-emerald-400 text-slate-900' : 'bg-slate-50 text-slate-300'}`}>
                                {isPaid ? <Check className="w-3 h-3 stroke-[4]" /> : <X className="w-2 h-2" />}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-1 px-2 text-right font-mono font-black tabular-nums text-slate-900 text-[9px]">{formatRupiah(totalPaid)}</td>

                      <td className="py-1 px-1 text-center">
                        {hasArrears ? (
                          <span className="text-[7px] text-rose-700 font-black bg-rose-50 px-1 py-0.2 rounded border border-rose-200">-{4 - paidWeeksInMonth}</span>
                        ) : (
                          <span className="text-[7px] text-emerald-700 font-black bg-emerald-50 px-1 py-0.2 rounded border border-emerald-300 uppercase">Lunas</span>
                        )}
                      </td>

                      <td className="py-1 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              // If editing, phone input is in edit form
                            } else {
                              sfx.playClick();
                              setReminderMember(member);
                            }
                          }}
                          disabled={!member.phone && !isEditing}
                          className={`p-1 rounded flex items-center justify-center transition-colors ${
                            member.phone ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                      </td>

                      {canEditKas && (
                        <td className="py-1 px-1 text-center">
                          {isEditing ? (
                            <button onClick={handleSaveEdit} className="p-1 bg-sky-100 text-sky-800 rounded hover:bg-sky-200" title="Simpan"><Save className="w-3 h-3" /></button>
                          ) : (
                            <button onClick={() => startEditing(member)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200" title="Ubah Data"><Edit2 className="w-3 h-3" /></button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Bulk Import Modal (Simplified for size) */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-doodle bg-white max-w-lg w-full rounded-xl p-5 relative">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">Import Daftar Siswa (Excel/CSV)</h3>
              <button onClick={() => { sfx.playCardClose(); setShowImportModal(false); }} className="w-7 h-7 btn-doodle bg-slate-100 rounded flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 rounded p-6 text-center bg-slate-50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-black text-slate-900">{importFileName || 'Klik untuk pilih file'}</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Paste dari Excel:</label>
                <textarea rows={2} placeholder="Nama, NIM, WA..." value={pasteData} onChange={e => setPasteData(e.target.value)} className="w-full p-2 text-[10px] font-mono border-2 border-slate-900 rounded focus:outline-none" />
                <button onClick={handleParsePaste} className="w-full mt-1 btn-doodle py-1.5 bg-amber-300 text-[10px] font-black rounded">Proses Teks</button>
              </div>
              {importError && <p className="text-[10px] text-rose-600 font-bold">{importError}</p>}
              {importPreview.length > 0 && (
                <div className="max-h-32 overflow-y-auto border-2 border-slate-900 rounded text-[9px]">
                  <table className="w-full">
                    <thead className="bg-slate-100 sticky top-0"><tr><th className="p-1">Nama</th><th className="p-1">NIM</th></tr></thead>
                    <tbody>{importPreview.map((m, i) => <tr key={i} className="border-t border-slate-200"><td className="p-1 font-bold">{m.name}</td><td className="p-1">{m.studentId}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button onClick={() => setShowImportModal(false)} className="px-3 py-1.5 border border-slate-900 rounded text-[10px] font-bold">Batal</button>
                <button disabled={importPreview.length === 0} onClick={handleConfirmImport} className="btn-doodle px-4 py-1.5 bg-emerald-300 text-[10px] font-black rounded">Impor {importPreview.length} Siswa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single WhatsApp Modal */}
      {reminderMember && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-doodle bg-white max-w-md w-full rounded-xl p-5 relative">
            <ScotchTape className="absolute -top-3 right-10 rotate-[-1deg]" />
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">Pengingat WhatsApp</h3>
              <button onClick={() => setReminderMember(null)} className="w-7 h-7 btn-doodle bg-slate-100 rounded flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Nomor WhatsApp:</label>
                <input type="text" value={reminderMember.phone || ''} onChange={e => setReminderMember({ ...reminderMember, phone: e.target.value })} className="w-full px-2 py-1.5 text-[11px] font-mono border-2 border-slate-900 rounded focus:outline-none" />
              </div>
              <textarea readOnly rows={6} value={getWhatsAppReminderMessage(reminderMember)} className="w-full p-2 font-mono text-[10px] bg-slate-50 border-2 border-slate-900 rounded text-slate-800 resize-none" />
              <div className="flex justify-between gap-2 pt-2 border-t border-slate-200">
                <button onClick={() => { sfx.playClick(); navigator.clipboard.writeText(getWhatsAppReminderMessage(reminderMember)); setCopiedKey(reminderMember.id); setTimeout(() => setCopiedKey(null), 2000); }} className="btn-doodle px-3 py-1.5 bg-white text-[10px] font-bold rounded flex items-center gap-1">{copiedKey === reminderMember.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>Salin</span></button>
                <button onClick={() => handleSendWhatsApp(reminderMember)} className="btn-doodle px-4 py-1.5 bg-emerald-400 text-[10px] font-black rounded flex items-center gap-1"><Send className="w-3.5 h-3.5" /><span>Kirim Sekarang</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-sm w-full rounded-xl p-5 relative">
            <h3 className="text-lg font-black text-slate-900 mb-3 pb-2 border-b-2 border-slate-900">Tambah Siswa Baru</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div><label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Nama Lengkap *</label><input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-2 py-1.5 text-[11px] border-2 border-slate-900 rounded focus:outline-none" /></div>
              <div><label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">NIM</label><input value={newNim} onChange={e => setNewNim(e.target.value)} className="w-full px-2 py-1.5 text-[11px] font-mono border-2 border-slate-900 rounded focus:outline-none" /></div>
              <div><label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">No WhatsApp</label><input value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full px-2 py-1.5 text-[11px] font-mono border-2 border-slate-900 rounded focus:outline-none" /></div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddMember(false)} className="px-3 py-1.5 border border-slate-900 rounded text-[10px] font-bold">Batal</button>
                <button type="submit" className="btn-doodle px-4 py-1.5 bg-amber-300 text-[10px] font-black rounded">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Arrears Summary Modal */}
      {showAllArrearsModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-md w-full rounded-xl p-5 relative max-h-[80vh] overflow-y-auto">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
              <h3 className="text-lg font-black text-slate-900">Belum Lunas ({membersWithArrears.length})</h3>
              <button onClick={() => setShowAllArrearsModal(false)} className="w-7 h-7 btn-doodle bg-slate-100 rounded flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {membersWithArrears.map(m => {
                const monthWeekKeys = [0,1,2,3].map(idx => getWeekKey(idx));
                const unpaidCount = monthWeekKeys.filter(key => !m.weeklyStatus?.[key]).length;
                return (
                  <div key={m.id} className="p-2 bg-slate-50 border border-slate-800 rounded flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-900 truncate">{toTitleCase(m.name)}</p>
                      <p className="text-[9px] text-rose-600 font-mono">Tunggakan: {unpaidCount} mgg ({formatRupiah(unpaidCount * settings.weeklyDuesAmount)})</p>
                    </div>
                    <button onClick={() => handleSendWhatsApp(m)} className="btn-doodle p-1.5 bg-emerald-400 rounded text-slate-900"><Send className="w-3 h-3" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Processing Loading Modal Overlay */}
      {bulkLoadingWeek && (
        <div className="fixed inset-0 z-[1200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-sm w-full rounded-xl p-6 border-3 border-slate-900 shadow-[5px_5px_0px_#1E293B] text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Loader2 className="w-9 h-9 text-amber-600 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {bulkLoadingWeek.shouldPay ? 'Sedang Memproses Lunas Massal...' : 'Membatalkan Lunas Massal...'}
              </h3>
              <p className="text-xs font-bold text-slate-700">
                {bulkLoadingWeek.weekLabel}
              </p>
              <p className="text-[11px] text-slate-500 mt-2 bg-amber-50/80 p-2.5 rounded-xl border border-amber-300">
                Mengalkulasi mutasi kas, memperbarui saldo riil kelas, dan memastikan sinkronisasi data bebas duplikasi...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
