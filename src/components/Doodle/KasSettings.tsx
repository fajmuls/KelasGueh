import React, { useState } from 'react';
import { ClassSettings, KasMember } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { LocalKasRepository } from '../../services/supabaseClient.ts';
import { updateUserLinkedMember } from '../../utils/userManagement.ts';
import { 
  Shield, 
  Sparkles, 
  Save, 
  UserPlus, 
  Lock, 
  KeyRound,
  Bell,
  Volume2,
  VolumeX,
  GraduationCap,
  Users,
  FileSpreadsheet,
  Upload,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveNewPin } from '../../utils/security.ts';
import { requestNotificationPermission, sendLocalNotification } from '../../utils/notifications.ts';
import { DoodleCurrencyInput } from '../UI/DoodleCurrencyInput.tsx';
import { DoodleSelect } from '../UI/DoodleSelect.tsx';
import { NotificationCardModal } from '../UI/NotificationCardModal.tsx';
import { showToast, showConfirm } from '../UI/DoodleDialog.tsx';
import { toTitleCase } from '../../utils/textFormatting.ts';

interface KasSettingsProps {
  settings: ClassSettings;
  members?: KasMember[];
  onSaveSettings: (settings: ClassSettings) => void;
  onResetData: () => void;
  onAddMember?: (name: string, studentId: string, phone?: string) => void;
  onAddMembers?: (newMembersList: { name: string; studentId: string; phone?: string }[]) => void;
  onUpdateMember?: (memberId: string, updates: Partial<KasMember>) => void;
}

export const KasSettings: React.FC<KasSettingsProps> = ({
  settings,
  members = [],
  onSaveSettings,
  onResetData,
  onAddMember,
  onAddMembers,
  onUpdateMember,
}) => {
  const { isSuperAdmin } = useAuth();
  const [form, setForm] = useState<ClassSettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sfx.isEnabled());

  // User Role Management state for Super Admin
  const [userList, setUserList] = useState<any[]>([]);
  const [manualEmail, setManualEmail] = useState('');

  // 6-Digit PIN Security State
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Student Management State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNim, setNewNim] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{ name: string; studentId: string; phone?: string }[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (onAddMember) {
      onAddMember(
        newName.trim(),
        newNim.trim() || `230101${(members.length + 1).toString().padStart(3, '0')}`,
        newPhone.trim() || undefined
      );
      sfx.playCoinChime();
      showToast(`Berhasil menambahkan siswa "${toTitleCase(newName.trim())}"!`, 'success');
    }
    setNewName('');
    setNewNim('');
    setNewPhone('');
    setShowAddModal(false);
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
            } else {
              name = cells[0];
              studentId = cells[1];
              phone = cells[2] || '';
            }
          }

          if (name) {
            parsedList.push({
              name: toTitleCase(name),
              studentId: studentId || `230101${(members.length + parsedList.length + 1).toString().padStart(3, '0')}`,
              phone: phone || undefined
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
        parsedList.push({ name: toTitleCase(name), studentId, phone: phone || undefined });
      }
    });
    if (parsedList.length > 0) {
      setImportPreview(parsedList);
      setPasteData('');
      sfx.playSuccess();
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    if (onAddMembers) {
      onAddMembers(importPreview);
      showToast(`Berhasil mengimpor ${importPreview.length} siswa baru!`, 'success');
    }
    sfx.playLevelUp();
    setShowImportModal(false);
    setImportPreview([]);
  };

  // Fetch whitelist on mount
  React.useEffect(() => {
    if (isSuperAdmin) {
      LocalKasRepository.getWhitelist().then(setUserList);
    }
  }, [isSuperAdmin]);

  const handleToggleSound = () => {
    const next = sfx.toggle();
    setSoundEnabled(next);
    if (next) sfx.playCoinChime();
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      setPinMessage('PIN harus terdiri dari tepat 6 angka (misal: 123456).');
      return;
    }
    try {
      saveNewPin(newPin);
      sfx.playSuccess();
      setPinMessage('✓ PIN 6-digit keamanan transaksi besar berhasil diperbarui!');
      setNewPin('');
      setTimeout(() => setPinMessage(null), 3500);
    } catch (err: any) {
      setPinMessage(`Gagal menyimpan PIN: ${err.message}`);
    }
  };

  const handleRoleToggle = async (email: string, currentRole: string) => {
    sfx.playClick();
    const newRole = currentRole === 'bendahara' ? 'anggota' : 'bendahara';
    await LocalKasRepository.updateWhitelist(email, newRole);
    const updated = await LocalKasRepository.getWhitelist();
    setUserList(updated);
    setSaveMessage(`Hak akses ${email} berhasil diubah menjadi ${newRole.toUpperCase()}.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleAddManualBendahara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) return;
    sfx.playCoinChime();
    await LocalKasRepository.updateWhitelist(manualEmail.trim(), 'bendahara');
    const updated = await LocalKasRepository.getWhitelist();
    setUserList(updated);
    setManualEmail('');
    setSaveMessage(`Email ${manualEmail.trim()} berhasil ditambahkan sebagai Bendahara.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const [showNotifCard, setShowNotifCard] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playCoinChime();
    onSaveSettings(form);
    showToast('Pengaturan iuran berhasil disimpan!', 'success');
  };

  const handleTestNotification = async () => {
    sfx.playNotification();
    showToast('Tes Notifikasi Berhasil! Sistem pengingat kas aktif.', 'success');
    if ('Notification' in window && Notification.permission !== 'granted') {
      setShowNotifCard(true);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Notification Consent Modal */}
      <NotificationCardModal
        isOpen={showNotifCard}
        onClose={() => setShowNotifCard(false)}
      />

      {/* 1. Header & Version Info */}
      <div className="relative card-doodle-yellow p-5 sm:p-6 rounded-lg">
        <ScotchTape className="absolute -top-3 left-8 rotate-[-2deg]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
              <span>Pengaturan & Preferensi</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              Kelola iuran, notifikasi, dan keamanan akses kelas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestNotification}
              className="btn-doodle px-3.5 py-2 min-h-[44px] bg-white text-slate-900 text-xs font-bold rounded-md flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#1E293B]"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Tes Notifikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Iuran Configuration Form */}
      <div className="card-doodle p-5 sm:p-6 rounded-lg bg-white relative">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-600" />
              <span>Pengaturan Iuran & Semester</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Kelas</label>
              <input
                type="text"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md outline-none focus:bg-amber-50"
              />
            </div>
            <div>
              <DoodleCurrencyInput
                label="Nominal Iuran Mingguan"
                value={form.weeklyDuesAmount}
                onChange={(val) => setForm({ ...form, weeklyDuesAmount: val })}
              />
            </div>
            <div>
              <DoodleCurrencyInput
                label="Target Kas Semester"
                value={form.kasTargetAmount}
                onChange={(val) => setForm({ ...form, kasTargetAmount: val })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tahun Akademik</label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md outline-none focus:bg-amber-50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn-doodle px-6 py-2.5 min-h-[44px] bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-2 shadow-[2px_2px_0px_#1E293B]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2.5. Student Member Management */}
      <div className="card-doodle p-5 sm:p-6 rounded-lg bg-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>Manajemen Anggota Siswa Kelas ({members.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tambah siswa baru, impor file spreadsheet Excel/CSV, atau sunting data anggota.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="btn-doodle px-3 py-2 min-h-[44px] bg-sky-100 hover:bg-sky-200 text-slate-900 border-2 border-slate-900 font-bold rounded-md text-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-800" />
              <span>Import Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-doodle px-3.5 py-2 min-h-[44px] bg-amber-300 hover:bg-amber-400 text-slate-900 border-2 border-slate-900 font-black rounded-md text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <UserPlus className="w-4 h-4 text-slate-900" />
              <span>+ Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Student List Table */}
        <div className="max-h-72 overflow-y-auto border-2 border-slate-900 rounded-md bg-[#FFFDF9]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 font-black uppercase text-slate-700 sticky top-0">
              <tr>
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Nama Siswa</th>
                <th className="p-2 w-28 font-mono">NIM / Absen</th>
                <th className="p-2 w-32 font-mono">No. WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                    Belum ada data siswa terdaftar.
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-2 text-center font-mono text-[10px] text-slate-500">{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-900">{toTitleCase(m.name)}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-600">{m.studentId}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-600">{m.phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Siswa Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-sm w-full rounded-xl p-5 relative border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B]">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-600" />
                <span>Tambah Siswa Baru</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 text-[10px] mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: M Rachman Fajri M"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 text-[10px] mb-1">
                  NIM / Nomor Absen
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 230101001"
                  value={newNim}
                  onChange={e => setNewNim(e.target.value)}
                  className="w-full px-3 py-2 font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 text-[10px] mb-1">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-doodle px-3 py-2 bg-slate-100 text-slate-800 font-bold rounded-md border-2 border-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-4 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#1E293B]"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Siswa Excel/CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-doodle bg-white max-w-lg w-full rounded-xl p-5 relative border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B]">
            <ScotchTape className="absolute -top-3 left-10 rotate-1" />
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                <span>Import Daftar Siswa (Excel / CSV)</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 rounded-lg p-5 text-center bg-slate-50 hover:bg-amber-50/50 cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <p className="font-black text-slate-900">{importFileName || 'Klik untuk memilih file .xlsx / .csv'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Format kolom: Nama Siswa, NIM, No WhatsApp</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 text-[10px] mb-1">
                  Atau Paste Teks dari Excel / Spreadsheet:
                </label>
                <textarea
                  rows={2}
                  placeholder="Paste baris data nama, nim, wa di sini..."
                  value={pasteData}
                  onChange={e => setPasteData(e.target.value)}
                  className="w-full p-2 font-mono text-[11px] border-2 border-slate-900 rounded-md focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="w-full mt-1 btn-doodle py-1.5 bg-amber-300 font-black text-slate-900 rounded-md text-xs"
                >
                  Proses Teks Paste
                </button>
              </div>

              {importError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 border border-rose-300 rounded">
                  {importError}
                </p>
              )}

              {importPreview.length > 0 && (
                <div>
                  <p className="font-bold text-slate-800 mb-1">
                    Pratinjau Siswa Siap Diimpor ({importPreview.length} Siswa):
                  </p>
                  <div className="max-h-36 overflow-y-auto border-2 border-slate-900 rounded-md bg-[#FFFDF9]">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 border-b border-slate-900 font-black">
                        <tr>
                          <th className="p-1.5">Nama Siswa</th>
                          <th className="p-1.5 w-24">NIM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((m, idx) => (
                          <tr key={idx} className="border-t border-slate-200">
                            <td className="p-1.5 font-bold text-slate-900">{m.name}</td>
                            <td className="p-1.5 font-mono text-[10px]">{m.studentId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn-doodle px-3 py-1.5 bg-slate-100 text-slate-800 font-bold rounded-md border-2 border-slate-900"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="btn-doodle px-4 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black rounded-md border-2 border-slate-900 disabled:opacity-50"
                >
                  Impor {importPreview.length} Siswa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Audio Preferences */}
      <div className="card-doodle p-4 sm:p-5 rounded-lg bg-white relative border-2 border-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Preferensi Efek Suara (SFX)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            className={`btn-doodle px-3.5 py-2 min-h-[44px] rounded-md text-xs font-black flex items-center justify-center gap-2 ${
              soundEnabled ? 'bg-emerald-300 text-slate-900' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {soundEnabled ? 'Efek Suara: AKTIF' : 'Efek Suara: SENYAP'}
          </button>
        </div>
      </div>

      {/* 4. Role & PIN Management (Only Super Admin) */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-doodle p-4 sm:p-5 rounded-lg bg-white relative">
            <div className="flex items-center justify-between mb-3 border-b-2 border-slate-900 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Whitelist Bendahara</span>
              </h3>
            </div>

            <form onSubmit={handleAddManualBendahara} className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="Email Google bendahara..."
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-slate-900 rounded-md outline-none"
              />
              <button type="submit" className="btn-doodle px-3 py-1.5 bg-emerald-400 text-slate-900 text-xs font-black rounded-md flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {userList.map(u => (
                <div key={u.id} className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-md space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border border-slate-900 ${
                      u.role === 'superadmin' ? 'bg-amber-300 text-slate-900' : 'bg-emerald-300 text-slate-900'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1 border-t border-dashed border-slate-300">
                    <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="flex-1">
                      <DoodleSelect
                        value={u.linkedMemberId || ''}
                        onChange={(selectedId) => {
                          const selectedStudent = members.find(m => m.id === selectedId);
                          updateUserLinkedMember(
                            u.email,
                            selectedId || undefined,
                            selectedStudent ? selectedStudent.name : undefined
                          );
                          LocalKasRepository.getWhitelist().then(setUserList);
                          sfx.playClick();
                          showToast('Data tautan siswa diperbarui.', 'info');
                        }}
                        options={[
                          { value: '', label: '-- Hubungkan ke Siswa --' },
                          ...members.map(m => ({ value: m.id, label: m.name }))
                        ]}
                      />
                    </div>

                    {u.role !== 'superadmin' && (
                      <button
                        onClick={() => handleRoleToggle(u.email, u.role)}
                        className="btn-doodle px-2 py-0.5 rounded text-[9px] font-black border-2 border-slate-900 bg-rose-200"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-doodle p-4 sm:p-5 rounded-lg bg-white relative">
            <h3 className="text-sm font-black text-slate-900 mb-3 border-b-2 border-slate-900 pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>PIN Keamanan</span>
            </h3>
            <p className="text-[11px] text-slate-600 mb-3">
              PIN 6 digit untuk otorisasi pengeluaran besar (&gt;500rb).
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-slate-900 rounded-md outline-none"
              />
              <button onClick={handleUpdatePin} className="btn-doodle px-3.5 py-1.5 bg-amber-300 text-slate-900 text-xs font-black rounded-md flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
            {pinMessage && <p className="text-[10px] text-emerald-700 font-bold mt-2">{pinMessage}</p>}
          </div>
        </div>
      )}

      {/* 4.5. Data Cache Management (Hapus Data Lokal) */}
      <div className="card-doodle p-4 sm:p-5 rounded-lg bg-rose-50/60 border-2 border-slate-900 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Pembersihan Data Cache Lokal
              </h3>
              <p className="text-[11px] text-slate-600">
                Hapus cache lokal sementara browser jika merasa data tidak up-to-date atau ingin menyegarkan ulang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              sfx.playPaperRustle();
              const ok = await showConfirm({
                title: 'Hapus Data Lokal?',
                message: 'Apakah Anda yakin ingin menghapus cache data lokal browser? Data yang tersimpan di cloud (jika terhubung) akan disinkronkan kembali saat halaman dimuat ulang.',
                confirmLabel: 'Ya, Hapus Data Lokal',
                cancelLabel: 'Batal',
                isDanger: true,
              });

              if (ok) {
                localStorage.removeItem('kelasgue_active_user_v2');
                localStorage.removeItem('doodle_kas_local_db_v1');
                localStorage.removeItem('kelasgue_settings_cache');
                sfx.playDeleteConfirm();
                showToast('Data lokal berhasil dibersihkan! Memuat ulang halaman...', 'success');
                if (onResetData) onResetData();
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            }}
            className="btn-doodle px-4 py-2 min-h-[44px] bg-rose-200 hover:bg-rose-300 text-rose-900 font-black text-xs rounded-md flex items-center justify-center gap-2 border-2 border-slate-900 shrink-0 shadow-[1.5px_1.5px_0px_#1E293B]"
          >
            <Trash2 className="w-4 h-4 text-rose-700" />
            <span>Hapus Data Lokal</span>
          </button>
        </div>
      </div>

      {/* 5. Patch Notes */}
      <div className="card-doodle p-6 rounded-lg bg-amber-50/80 border-2 border-slate-900">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <h3 className="text-base font-black text-slate-900">Catatan Pembaruan v{CURRENT_APP_VERSION.version}</h3>
          <span className="text-[10px] font-mono text-slate-500 italic">{CURRENT_APP_VERSION.releaseDate}</span>
        </div>
        <ul className="space-y-1.5">
          {CURRENT_APP_VERSION.changes.map((c, i) => (
            <li key={i} className="text-xs text-slate-700 flex gap-2">
              <span className="text-emerald-600 font-bold shrink-0">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
