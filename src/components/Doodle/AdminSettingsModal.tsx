import React, { useState, useEffect } from 'react';
import { KasMember, ClassSettings } from '../../types/kas.ts';
import { AuditLogEntry, LocalKasRepository } from '../../services/supabaseClient.ts';
import {
  getRegisteredUsers,
  getBendaharaWhitelist,
  getSekretarisWhitelist,
  updateUserRole,
  autoDetectGenderByName
} from '../../utils/userManagement.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { sfx } from '../../utils/soundEffects.ts';
import {
  X,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Lock,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Users,
  Copy,
  Download
} from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: KasMember[];
  settings: ClassSettings;
  onUpdateMembers: (members: KasMember[]) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  members,
  settings,
  onUpdateMembers
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'audit' | 'gender' | 'pin' | 'cache' | 'version'>('whitelist');

  // Whitelist state
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'bendahara' | 'sekretaris' | 'anggota'>('bendahara');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<'semua' | 'transaksi' | 'iuran' | 'sekretaris'>('semua');
  const [auditSearch, setAuditSearch] = useState('');

  // Gender state
  const [memberList, setMemberList] = useState<KasMember[]>(members);

  // Security PIN state
  const [pin, setPin] = useState(() => localStorage.getItem('kelasgue_security_pin') || '123456');
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Cache reset state
  const [cacheMsg, setCacheMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    // Whitelist
    const list = await LocalKasRepository.getWhitelist();
    setUsers(list);

    // Audit logs
    const logs = await LocalKasRepository.fetchAuditLogsFromSupabase();
    setAuditLogs(logs);

    setMemberList(members);
  };

  if (!isOpen) return null;

  // Whitelist Actions
  const handleAddWhitelist = async () => {
    if (!newEmail.trim()) return;
    sfx.playClick();
    await updateUserRole(newEmail, newRole);
    setNewEmail('');
    await loadData();
  };

  const handleRoleChange = async (email: string, role: 'bendahara' | 'sekretaris' | 'anggota') => {
    sfx.playOptionSelect();
    await updateUserRole(email, role);
    await loadData();
  };

  // Gender Actions
  const handleGenderChange = (memberId: string, gender: 'L' | 'P') => {
    sfx.playOptionSelect();
    const updated = memberList.map(m => m.id === memberId ? { ...m, gender } : m);
    setMemberList(updated);
    onUpdateMembers(updated);
    LocalKasRepository.updateMember(memberId, { gender });
  };

  const handleAutoDetectAllGenders = () => {
    sfx.playOptionSelect();
    const updated = memberList.map(m => ({
      ...m,
      gender: m.gender || autoDetectGenderByName(m.name)
    }));
    setMemberList(updated);
    onUpdateMembers(updated);
    updated.forEach(m => LocalKasRepository.updateMember(m.id, { gender: m.gender }));
  };

  // Security PIN
  const handleSavePin = () => {
    if (newPin.length < 4) {
      alert('PIN minimal 4 angka');
      return;
    }
    sfx.playPaymentConfirmed();
    localStorage.setItem('kelasgue_security_pin', newPin);
    setPin(newPin);
    setNewPin('');
    setPinSuccessMsg('✅ PIN Keamanan berhasil diperbarui!');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  // Cache Clear Action
  const handleClearLocalCache = () => {
    if (confirm('Apakah Anda yakin ingin membersihkan cache & penyimpanan lokal di perangkat ini? (Data Supabase tetap aman & tidak akan terhapus)')) {
      sfx.playDeleteConfirm();
      localStorage.removeItem('kelasgue_transactions_v3');
      localStorage.removeItem('kelasgue_members_v3');
      localStorage.removeItem('kelasgue_kolektif_bills_v1');
      setCacheMsg('✅ Cache lokal berhasil dibersihkan! Silakan muat ulang halaman.');
    }
  };

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(log => {
    if (auditFilter === 'transaksi' && !log.action.toLowerCase().includes('transaksi') && !log.action.toLowerCase().includes('kas')) return false;
    if (auditFilter === 'iuran' && !log.action.toLowerCase().includes('iuran')) return false;
    if (auditFilter === 'sekretaris' && !log.action.toLowerCase().includes('presensi') && !log.action.toLowerCase().includes('poin') && !log.action.toLowerCase().includes('notulensi')) return false;
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      return log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.performedBy.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 sepia:bg-amber-50 border-2 border-slate-900 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[4px_4px_0px_#000] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b-2 border-slate-900 dark:border-slate-800 flex items-center justify-between bg-amber-100 dark:bg-slate-800/80 sepia:bg-amber-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center border-2 border-slate-900 font-black shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                Pengaturan Master Admin Kelas
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pusat kontrol Whitelist Roll, Audit Log, Kelamin Siswa, Keamanan PIN & Versi v{CURRENT_APP_VERSION.version}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playCardClose();
              onClose();
            }}
            className="p-1.5 rounded-lg border-2 border-slate-900 hover:bg-rose-100 text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 sepia:bg-amber-100/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'whitelist', label: 'Whitelist Roll', icon: UserCheck },
            { id: 'audit', label: 'Laporan Audit Log', icon: FileSpreadsheet },
            { id: 'gender', label: 'Manajemen Kelamin', icon: Users },
            { id: 'pin', label: 'PIN Keamanan', icon: Lock },
            { id: 'cache', label: 'Reset Cache Lokal', icon: Trash2 },
            { id: 'version', label: 'Versi & Catatan', icon: Sparkles }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  sfx.playToggle();
                  setActiveTab(t.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-slate-900 border-slate-900 font-black shadow-[1px_1px_0px_#000]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: WHITELIST ROLL */}
          {activeTab === 'whitelist' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <strong>Whitelist Roll Hak Akses:</strong> Tambahkan email Google mahasiswa untuk memberikan wewenang sebagai <strong>Bendahara</strong> atau <strong>Sekretaris</strong> kelas.
              </div>

              {/* Add User Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Masukkan email mahasiswa (e.g. mhs@gmail.com)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-medium focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="bendahara">Bendahara Kelas</option>
                  <option value="sekretaris">Sekretaris Kelas</option>
                  <option value="anggota">Anggota Biasa</option>
                </select>
                <button
                  onClick={handleAddWhitelist}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
                >
                  + Tambah Roll
                </button>
              </div>

              {/* Users Table */}
              <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-900 font-bold text-slate-800 dark:text-slate-200">
                    <tr>
                      <th className="p-3">Pengguna</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role Akses</th>
                      <th className="p-3 text-right">Ubah Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{u.name}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                              u.role === 'superadmin'
                                ? 'bg-purple-100 text-purple-800 border-purple-400'
                                : u.role === 'bendahara'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                : u.role === 'sekretaris'
                                ? 'bg-sky-100 text-sky-800 border-sky-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {u.role === 'superadmin' ? (
                            <span className="text-[10px] text-slate-400 italic">Super Admin Utama</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.email, e.target.value as any)}
                              className="px-2 py-1 border border-slate-900 rounded bg-white dark:bg-slate-800 text-[11px] font-medium"
                            >
                              <option value="bendahara">Bendahara</option>
                              <option value="sekretaris">Sekretaris</option>
                              <option value="anggota">Anggota Biasa</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Modul:</span>
                  {(['semua', 'transaksi', 'iuran', 'sekretaris'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setAuditFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize transition ${
                        auditFilter === f
                          ? 'bg-amber-400 text-slate-900 border-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari aktivitas..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border-2 border-slate-900 rounded-xl text-xs w-full sm:w-48 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="border-2 border-slate-900 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-900 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">Waktu</th>
                      <th className="p-2.5">Aksi</th>
                      <th className="p-2.5">Oleh</th>
                      <th className="p-2.5">Rincian Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">
                          Tidak ada catatan audit yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{log.action}</td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">
                            {log.performedBy} <span className="text-[10px] text-slate-400">({log.userRole})</span>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANAJEMEN KELAMIN SISWA */}
          {activeTab === 'gender' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  Data jenis kelamin digunakan untuk modul Pembagian Kelompok Seimbang (L/P) Sekretaris.
                </p>
                <button
                  onClick={handleAutoDetectAllGenders}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg border border-slate-900 flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Detect Semua Nama
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                {memberList.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 border-2 border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-white dark:bg-slate-800"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{m.name}</p>
                      <p className="text-[10px] text-slate-500">NIM/Absen: {m.studentId || '-'}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleGenderChange(m.id, 'L')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                          (m.gender || autoDetectGenderByName(m.name)) === 'L'
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700'
                        }`}
                      >
                        Laki-laki (L)
                      </button>
                      <button
                        onClick={() => handleGenderChange(m.id, 'P')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                          (m.gender || autoDetectGenderByName(m.name)) === 'P'
                            ? 'bg-pink-600 text-white border-pink-700'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700'
                        }`}
                      >
                        Perempuan (P)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PIN KEAMANAN */}
          {activeTab === 'pin' && (
            <div className="max-w-md mx-auto space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-900 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" /> Atur PIN Keamanan Kelas
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  PIN digunakan untuk memverifikasi tindakan administratif sensitif. PIN default: <strong>123456</strong>.
                </p>

                {pinSuccessMsg && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300">
                    {pinSuccessMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">PIN Baru (Min 4 Angka)</label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="Masukkan PIN baru"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-sm font-mono focus:outline-none dark:bg-slate-900"
                  />
                </div>

                <button
                  onClick={handleSavePin}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
                >
                  Simpan PIN Keamanan
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: RESET CACHE LOKAL */}
          {activeTab === 'cache' && (
            <div className="max-w-md mx-auto space-y-4 py-4">
              <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border-2 border-rose-300 dark:border-rose-800 space-y-3 text-center">
                <Trash2 className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="font-black text-sm text-rose-950 dark:text-rose-200">
                  Pembersihan Cache & Storage Lokal
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Tindakan ini hanya akan membersihkan memori sementara di perangkat browser ini. Data utama yang telah tersimpan di Supabase <strong>tetap aman</strong> dan akan diunduh kembali secara otomatis.
                </p>

                {cacheMsg && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300">
                    {cacheMsg}
                  </div>
                )}

                <button
                  onClick={handleClearLocalCache}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
                >
                  Bersihkan Cache Perangkat Ini
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: VERSION & RELEASE NOTES */}
          {activeTab === 'version' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Aplikasi Kelas Gue</span>
                  <h3 className="font-black text-xl text-amber-300">
                    Versi {CURRENT_APP_VERSION.version} ({CURRENT_APP_VERSION.codename})
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">Rilis Resmi: {CURRENT_APP_VERSION.releaseDate}</p>
                </div>
              </div>

              {/* Release Notes */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  📋 Catatan Pembaruan Terintegrasi
                </h4>
                <ul className="space-y-1.5">
                  {CURRENT_APP_VERSION.changes.map((c, i) => (
                    <li key={i} className="text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-800 dark:text-slate-200">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Features */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  💡 Saran & Rekomendasi Fitur Masa Depan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CURRENT_APP_VERSION.suggestedUpdates.map((s, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                        {s.category}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.title}</h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
