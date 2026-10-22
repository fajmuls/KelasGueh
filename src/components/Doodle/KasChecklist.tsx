import React, { useState, useRef } from 'react';
import { KasMember, ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
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
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface KasChecklistProps {
  members: KasMember[];
  settings: ClassSettings;
  onToggleWeek: (memberId: string, weekKey: string) => void;
  onAddMember: (name: string, studentId: string, phone?: string) => void;
  onAddMembers?: (newMembersList: { name: string; studentId: string; phone?: string }[]) => void;
}

const WEEKS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];

export const KasChecklist: React.FC<KasChecklistProps> = ({
  members,
  settings,
  onToggleWeek,
  onAddMember,
  onAddMembers,
}) => {
  const { canEditKas } = useAuth();
  const [search, setSearch] = useState('');
  
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

  const filteredMembers = members.filter(m =>
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Process Excel / CSV file
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

        // Parse rows
        const parsedList: { name: string; studentId: string; phone?: string }[] = [];
        
        // Find header row or assume row 0 is header if it contains text like 'nama' or 'nim'
        let startIndex = 0;
        const firstRowStr = (rawJson[0] || []).join(' ').toLowerCase();
        if (firstRowStr.includes('nama') || firstRowStr.includes('nim') || firstRowStr.includes('siswa')) {
          startIndex = 1;
        }

        for (let i = startIndex; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          // Expect: col 0 = No/NIM/Nama, col 1 = Nama/NIM, etc.
          let name = '';
          let studentId = '';
          let phone = '';

          // Heuristic parser
          const cells = row.map((c: any) => String(c ?? '').trim()).filter((c: string) => c !== '');
          if (cells.length === 0) continue;

          if (cells.length === 1) {
            name = cells[0];
            studentId = `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
          } else if (cells.length >= 2) {
            // Check if first is numeric (NIM/No) or text (Nama)
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
              // Col 0 is sequence number (1, 2, 3)
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
          setImportError('Tidak dapat mengekstrak nama siswa dari file. Pastikan format kolom: Nama, NIM, No HP.');
        } else {
          setImportPreview(parsedList);
          sfx.playSuccess();
        }
      } catch (err: any) {
        setImportError(`Gagal membaca file Excel/CSV: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Helper to format phone numbers to standard 628xxx format
  const formatPhone = (raw: string): string => {
    let clean = raw.replace(/[^\d+]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('+62')) {
      clean = clean.slice(1);
    }
    return clean;
  };

  // Handle direct text paste
  const handleParsePaste = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.trim().split(/\r?\n/);
    const parsedList: { name: string; studentId: string; phone?: string }[] = [];

    lines.forEach((line) => {
      // Split by tab, comma, or semicolon
      const parts = line.split(/[\t,;]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 1) {
        let name = parts[0];
        let studentId = parts[1] || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
        let phone = parts[2] || '';

        // If first part was just a number like "1."
        if (/^\d+\.?$/.test(parts[0]) && parts.length >= 2) {
          name = parts[1];
          studentId = parts[2] || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`;
          phone = parts[3] || '';
        }

        parsedList.push({
          name,
          studentId,
          phone: phone ? formatPhone(phone) : undefined
        });
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

  // Execute bulk import
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
    setImportFileName('');
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    sfx.playFileDownload();
    const csvContent =
      'No,Nama Siswa,NIM,No WhatsApp\n' +
      '1,Ahmad Fauzi,230101001,081234567890\n' +
      '2,Bella Cantika,230101002,082198765432\n' +
      '3,Citra Kirana,230101003,085712345678\n' +
      '4,Dimas Ramadhan,230101004,089912345678\n' +
      '5,Eka Pratama,230101005,087812345678\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_daftar_siswa_kelasgue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate WhatsApp reminder text
  const getWhatsAppReminderMessage = (member: KasMember) => {
    const unpaidWeeks = WEEKS.filter(w => !member.weeklyStatus[w]);
    const totalUnpaid = unpaidWeeks.length * settings.weeklyDuesAmount;

    return `Halo *${member.name}* 👋\n\n` +
      `Mengingatkan mengenai kewajiban iuran kas kelas *${settings.className}*.\n` +
      `Tercatat masih ada tunggakan untuk *${unpaidWeeks.length} minggu* (${unpaidWeeks.join(', ')}) dengan total *${formatRupiah(totalUnpaid)}*.\n\n` +
      `Iuran kas mingguan kelas: ${formatRupiah(settings.weeklyDuesAmount)}/minggu.\n` +
      `Mohon agar dapat segera melunasi kepada Bendahara kelas demi kelancaran kegiatan kelas kita bersama ya.\n\n` +
      `Terima kasih banyak atas kerjasamanya! 🙏✨`;
  };

  const handleSendWhatsApp = (member: KasMember) => {
    sfx.playMoneyIncome();
    const msg = getWhatsAppReminderMessage(member);
    const encoded = encodeURIComponent(msg);
    const phone = member.phone ? formatPhone(member.phone) : '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Calculate overall arrears
  const membersWithArrears = members.filter(m => {
    const paidWeeks = WEEKS.filter(w => m.weeklyStatus[w]).length;
    return paidWeeks < WEEKS.length;
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card-doodle p-5 rounded-lg bg-[#FFFDF9] relative">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <span>Matriks Checklist Iuran Kas Mingguan</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Iuran per minggu: <strong className="text-slate-900">{formatRupiah(settings.weeklyDuesAmount)}</strong>.
              {canEditKas
                ? ' Klik kotak untuk menandai status lunas anggota.'
                : ' Mode transparansi: Periksa status pembayaran Anda secara mandiri.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Tunggakan Broadcast button (Khusus Bendahara & Super Admin) */}
            {canEditKas && membersWithArrears.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sfx.playCardOpen();
                  setShowAllArrearsModal(true);
                }}
                className="btn-doodle px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
                title="Kirim pengingat WhatsApp ke siswa yang belum lunas"
              >
                <MessageCircle className="w-4 h-4 text-emerald-800" />
                <span>Pengingat WA ({membersWithArrears.length})</span>
              </button>
            )}

            {/* Excel / CSV Import button */}
            {canEditKas && (
              <button
                type="button"
                onClick={() => {
                  sfx.playPaperRustle();
                  setShowImportModal(true);
                }}
                className="btn-doodle px-3.5 py-2 bg-sky-200 hover:bg-sky-300 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
                title="Import puluhan nama siswa dari file Excel / CSV (1-Klik)"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-900" />
                <span>Import Excel / CSV</span>
              </button>
            )}

            {/* Manual add member button */}
            {canEditKas && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShowAddMember(true);
                }}
                className="btn-doodle px-3.5 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Anggota</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama anggota atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
          />
        </div>
      </div>

      {/* Checklist Table */}
      <div className="card-doodle rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 text-xs font-black uppercase text-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa / Mahasiswa</th>
                <th className="py-3 px-3 font-mono">NIM</th>
                {WEEKS.map(w => (
                  <th key={w} className="py-3 px-2 text-center font-mono w-12">
                    {w}
                  </th>
                ))}
                <th className="py-3 px-3 text-right font-mono">Total Bayar</th>
                {canEditKas ? (
                  <th className="py-3 px-3 text-center">Aksi / WA</th>
                ) : (
                  <th className="py-3 px-3 text-center">Status</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500 font-medium">
                    {members.length === 0 ? (
                      <div className="space-y-3 py-4">
                        <p className="text-slate-600 font-bold">Daftar siswa masih kosong.</p>
                        {canEditKas && (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setShowImportModal(true)}
                              className="btn-doodle px-4 py-2 bg-sky-200 text-slate-900 font-bold rounded-md text-xs inline-flex items-center gap-1.5"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>Import File Excel / CSV</span>
                            </button>
                            <button
                              onClick={() => setShowAddMember(true)}
                              className="btn-doodle px-4 py-2 bg-amber-300 text-slate-900 font-bold rounded-md text-xs inline-flex items-center gap-1.5"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Tambah Manual</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      'Tidak ditemukan anggota yang sesuai pencarian.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => {
                  const paidWeeks = WEEKS.filter(w => member.weeklyStatus[w]).length;
                  const totalPaid = paidWeeks * settings.weeklyDuesAmount;
                  const unpaidWeeks = WEEKS.filter(w => !member.weeklyStatus[w]);
                  const hasArrears = unpaidWeeks.length > 0;

                  return (
                    <tr key={member.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{member.name}</span>
                          {canEditKas && member.phone && (
                            <span className="text-[10px] bg-slate-100 border border-slate-300 px-1 py-0.2 rounded font-mono text-slate-500">
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {member.studentId}
                      </td>

                      {/* Weekly checkboxes */}
                      {WEEKS.map(w => {
                        const isPaid = !!member.weeklyStatus[w];
                        return (
                          <td key={w} className="py-3 px-2 text-center">
                            {canEditKas ? (
                              <button
                                type="button"
                                onClick={() => {
                                  sfx.playCoinChime();
                                  onToggleWeek(member.id, w);
                                }}
                                title={`${member.name} - ${w}: ${isPaid ? 'Sudah Lunas' : 'Belum Bayar'}`}
                                className={`w-7 h-7 mx-auto rounded border-2 border-slate-900 flex items-center justify-center transition-all ${
                                  isPaid
                                    ? 'bg-emerald-400 text-slate-900 shadow-[1px_1px_0px_#1E293B]'
                                    : 'bg-white hover:bg-slate-100 text-transparent'
                                }`}
                              >
                                {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-[10px] text-slate-300">-</span>}
                              </button>
                            ) : (
                              <div
                                className={`w-7 h-7 mx-auto rounded border-2 border-slate-900 flex items-center justify-center ${
                                  isPaid ? 'bg-emerald-400 text-slate-900' : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap tabular-nums text-slate-900">
                        {formatRupiah(totalPaid)}
                      </td>

                      {/* WhatsApp Reminder Button or Status Text */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {canEditKas ? (
                          hasArrears ? (
                            <button
                              type="button"
                              onClick={() => {
                                sfx.playClick();
                                setReminderMember(member);
                              }}
                              title={`Kirim Pengingat WA (${unpaidWeeks.length} Minggu Belum Bayar)`}
                              className="btn-doodle px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-md text-xs font-bold inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                              <span>WA</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                              ✓ Lunas
                            </span>
                          )
                        ) : (
                          hasArrears ? (
                            <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Belum Lunas ({unpaidWeeks.length} mgg)
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                              ✓ Lunas
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Import Excel / CSV */}
      {showImportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sfx.playCardClose();
              setShowImportModal(false);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="card-doodle bg-white max-w-2xl w-full rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-sky-600" />
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Import Daftar Siswa dari File Excel / CSV (1-Klik)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unggah daftar nama siswa dan NIM agar tidak perlu mengetik manual satu per satu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playCardClose();
                  setShowImportModal(false);
                }}
                className="w-8 h-8 btn-doodle bg-slate-100 rounded-md flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Upload or Paste */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-sky-50 p-3 rounded-md border-2 border-slate-900 text-xs text-slate-700">
                <span>Format kolom yang didukung: <strong>Nama Siswa</strong>, <strong>NIM</strong>, <strong>No HP/WA (opsional)</strong>.</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn-doodle px-3 py-1 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded flex items-center gap-1 shrink-0 ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template CSV</span>
                </button>
              </div>

              {/* Drag/Drop Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 rounded-lg p-6 text-center bg-slate-50 hover:bg-amber-50/50 cursor-pointer transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-black text-slate-900">
                  {importFileName ? `File Terpilih: ${importFileName}` : 'Klik untuk memilih file Excel (.xlsx, .xls) atau CSV (.csv)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung pembacaan otomatis format Excel tabel kelas Anda.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Alternative: Paste CSV or Spreadsheet rows */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Atau Paste Langsung Teks dari Excel / Notepad:
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    placeholder="Contoh:&#10;Ahmad Fauzi, 230101001, 081234567890&#10;Bella Cantika, 230101002, 082198765432"
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    className="flex-1 p-2 text-xs font-mono border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
                  />
                  <button
                    type="button"
                    onClick={handleParsePaste}
                    className="btn-doodle px-4 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-md shrink-0"
                  >
                    Proses Teks
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {importError && (
                <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-md text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2 border-t-2 border-slate-900 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800">
                      Pratinjau Data Siswa Terdeteksi ({importPreview.length} Orang):
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportPreview([])}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Batal Pilih
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border-2 border-slate-900 rounded-md bg-slate-50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-200 text-slate-700 font-bold border-b border-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2 w-8 text-center">No</th>
                          <th className="p-2">Nama Siswa</th>
                          <th className="p-2">NIM</th>
                          <th className="p-2">No HP / WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {importPreview.map((m, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{m.name}</td>
                            <td className="p-2 font-mono text-slate-600">{m.studentId}</td>
                            <td className="p-2 font-mono text-slate-500">{m.phone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-dashed border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border-2 border-slate-900 rounded-md text-xs sm:text-sm font-bold bg-white hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleConfirmImport}
                  className={`btn-doodle px-5 py-2 rounded-md text-xs sm:text-sm font-black flex items-center gap-1.5 ${
                    importPreview.length > 0
                      ? 'bg-emerald-300 hover:bg-emerald-400 text-slate-900'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Impor {importPreview.length} Siswa Sekarang (1-Klik)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Single Student WhatsApp Reminder */}
      {reminderMember && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sfx.playCardClose();
              setReminderMember(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="card-doodle bg-white max-w-lg w-full rounded-xl p-6 relative">
            <ScotchTape className="absolute -top-3 right-10 rotate-[-1deg]" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-slate-900 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Pengingat Tunggakan Kas WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pesan sopan & otomatis ke {reminderMember.name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReminderMember(null)}
                className="w-7 h-7 btn-doodle bg-slate-100 rounded flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nomor WhatsApp Siswa:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  value={reminderMember.phone || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReminderMember(prev => prev ? { ...prev, phone: val } : null);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Pratinjau Pesan yang Akan Dikirim:
                </label>
                <textarea
                  readOnly
                  rows={8}
                  value={getWhatsAppReminderMessage(reminderMember)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border-2 border-slate-900 rounded-md text-slate-800 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    navigator.clipboard.writeText(getWhatsAppReminderMessage(reminderMember));
                    setCopiedKey(reminderMember.id);
                    setTimeout(() => setCopiedKey(null), 2500);
                  }}
                  className="btn-doodle px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-md flex items-center gap-1.5"
                >
                  {copiedKey === reminderMember.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === reminderMember.id ? 'Tersalin!' : 'Salin Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(reminderMember)}
                  className="btn-doodle px-5 py-2 bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Buka WhatsApp Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: All Arrears Summary & Batch Reminder */}
      {showAllArrearsModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sfx.playCardClose();
              setShowAllArrearsModal(false);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="card-doodle bg-white max-w-xl w-full rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-slate-900 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Daftar Siswa Belum Lunas Kas ({membersWithArrears.length} Orang)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kirim pesan WhatsApp langsung ke masing-masing siswa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllArrearsModal(false)}
                className="w-8 h-8 btn-doodle bg-slate-100 rounded-md flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {membersWithArrears.map((m) => {
                const unpaidWeeks = WEEKS.filter(w => !m.weeklyStatus[w]);
                const totalUnpaid = unpaidWeeks.length * settings.weeklyDuesAmount;

                return (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        NIM: {m.studentId} · Belum bayar: <strong className="text-rose-600">{unpaidWeeks.length} mgg</strong> ({unpaidWeeks.join(', ')})
                      </p>
                      <p className="text-xs font-bold text-rose-700 font-mono mt-0.5">
                        Tunggakan: {formatRupiah(totalUnpaid)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          navigator.clipboard.writeText(getWhatsAppReminderMessage(m));
                          setCopiedKey(m.id);
                          setTimeout(() => setCopiedKey(null), 2500);
                        }}
                        className="btn-doodle p-1.5 bg-white text-slate-700 rounded text-xs font-bold"
                        title="Salin teks pesan"
                      >
                        {copiedKey === m.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(m)}
                        className="btn-doodle px-3 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-bold rounded text-xs flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual Add Single Member */}
      {showAddMember && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sfx.playCardClose();
              setShowAddMember(false);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="card-doodle bg-white max-w-md w-full rounded-lg p-6 relative">
            <h3 className="text-xl font-black text-slate-900 mb-4 pb-2 border-b-2 border-slate-900">
              Tambah Anggota Kelas Baru
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kevin Sanjaya"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  NIM / No. Absen
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 230101011"
                  value={newNim}
                  onChange={(e) => setNewNim(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nomor WhatsApp Siswa (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Digunakan untuk pengiriman pengingat iuran kas via WhatsApp 1-klik.
                </p>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border-2 border-slate-900 rounded-md text-sm font-bold bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-4 py-2 bg-amber-300 border-2 border-slate-900 rounded-md text-sm font-black text-slate-900"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
