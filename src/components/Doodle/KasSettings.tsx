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
  GraduationCap
} from 'lucide-react';
import { saveNewPin } from '../../utils/security.ts';
import { requestNotificationPermission, sendLocalNotification } from '../../utils/notifications.ts';
import { DoodleCurrencyInput } from '../UI/DoodleCurrencyInput.tsx';
import { DoodleSelect } from '../UI/DoodleSelect.tsx';
import { NotificationCardModal } from '../UI/NotificationCardModal.tsx';
import { showToast } from '../UI/DoodleDialog.tsx';

interface KasSettingsProps {
  settings: ClassSettings;
  members?: KasMember[];
  onSaveSettings: (settings: ClassSettings) => void;
  onResetData: () => void;
}

export const KasSettings: React.FC<KasSettingsProps> = ({
  settings,
  members = [],
  onSaveSettings,
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
