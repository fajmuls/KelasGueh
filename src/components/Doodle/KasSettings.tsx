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
  Trash2,
  Database,
  Download,
  UploadCloud
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

  // Monthly Dues Overrides State
  const [overrideYear, setOverrideYear] = useState<number>(() => new Date().getFullYear());
  const [overrideMonth, setOverrideMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [overrideAmount, setOverrideAmount] = useState<number | ''>(settings.weeklyDuesAmount || 5000);

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

          {/* Penyesuaian Iuran Spesifik Bulan Tertentu */}
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-amber-50/60 space-y-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Pengaturan Iuran Spesifik Bulan Tertentu (Opsional)</span>
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Atur nominal iuran yang berbeda khusus untuk bulan tertentu (misalnya bulan-bulan lampau atau promo kegiatan).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={overrideMonth}
                onChange={e => setOverrideMonth(parseInt(e.target.value))}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-900 bg-white"
              >
                {[
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ].map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>{mName}</option>
                ))}
              </select>

              <select
                value={overrideYear}
                onChange={e => setOverrideYear(parseInt(e.target.value))}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-900 bg-white"
              >
                {[2025, 2026, 2027].map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>

              <div className="w-36">
                <DoodleCurrencyInput
                  value={overrideAmount}
                  onChange={setOverrideAmount}
                  placeholder="Nominal"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const num = typeof overrideAmount === 'number' ? overrideAmount : 0;
                  const key = `${overrideYear}_${overrideMonth}`;
                  setForm(prev => ({
                    ...prev,
                    monthlyDuesOverrides: {
                      ...(prev.monthlyDuesOverrides || {}),
                      [key]: num
                    }
                  }));
                  sfx.playClick();
                  showToast(`Tarif bulan ${overrideMonth}/${overrideYear} diset Rp ${new Intl.NumberFormat('id-ID').format(num)}! Klik Simpan Perubahan untuk menerapkan.`, 'info');
                }}
                className="btn-doodle px-3 py-1.5 bg-amber-300 hover:bg-amber-200 text-slate-900 font-black text-xs rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#000]"
              >
                + Terapkan Bulan Ini
              </button>
            </div>

            {/* Active overrides list */}
            {form.monthlyDuesOverrides && Object.keys(form.monthlyDuesOverrides).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-300">
                {Object.entries(form.monthlyDuesOverrides).map(([key, amount]) => {
                  const [yr, mo] = key.split('_');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                  const label = `${monthNames[parseInt(mo) - 1]} ${yr}`;

                  return (
                    <div key={key} className="px-2.5 py-1 rounded-md bg-white border border-slate-900 shadow-[1px_1px_0px_#000] flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800">{label}:</span>
                      <span className="font-mono font-black text-emerald-700">Rp {new Intl.NumberFormat('id-ID').format(Number(amount))}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...(form.monthlyDuesOverrides || {}) };
                          delete updated[key];
                          setForm(prev => ({ ...prev, monthlyDuesOverrides: updated }));
                          sfx.playClick();
                        }}
                        className="text-rose-600 font-bold hover:text-rose-800 ml-1 text-sm"
                        title="Hapus penyesuaian bulan ini"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn-doodle px-6 py-2.5 min-h-[44px] bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-2 shadow-[2px_2px_0px_#1E293B]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Iuran</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cadangan Data Terpadu (.JSON) untuk Bendahara */}
      <div className="card-doodle p-5 rounded-lg bg-white border-2 border-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 border border-slate-900 flex items-center justify-center">
              <Database className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Cadangan Data Aplikasi (.JSON)
              </h3>
              <p className="text-xs text-slate-600">
                Ekspor seluruh data buku kas, iuran, dan anggota ke file JSON untuk cadangan offline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              sfx.playPaymentConfirmed();
              await LocalKasRepository.exportFullBackupJSON('Bendahara', 'bendahara');
              showToast('File cadangan JSON berhasil diekspor!', 'success');
            }}
            className="btn-doodle px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg border-2 border-slate-900 flex items-center gap-2 shrink-0 shadow-[2px_2px_0px_#000]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor File Cadangan JSON</span>
          </button>
        </div>
      </div>

      {/* Catatan Pembaruan Iuran & Versi App */}
      <div className="card-doodle p-6 rounded-lg bg-amber-50/80 border-2 border-slate-900 space-y-5">
        <div>
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Catatan Pembaruan Kas v{CURRENT_APP_VERSION.version} ({CURRENT_APP_VERSION.codename})</span>
              </h3>
            </div>
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
    </div>
  );
};
