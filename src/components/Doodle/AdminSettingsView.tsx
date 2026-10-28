import { showToast, showConfirm } from "../UI/DoodleDialog.tsx";
import React, { useState, useEffect } from 'react';
import { KasMember, ClassSettings } from '../../types/kas.ts';
import { AuditLogEntry, LocalKasRepository, generateUUID } from '../../services/supabaseClient.ts';
import {
  getBendaharaWhitelist,
  getSekretarisWhitelist,
  updateUserRole,
  autoDetectGenderByName
} from '../../utils/userManagement.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { toTitleCase } from '../../utils/textFormatting.ts';
import {
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Lock,
  Trash2,
  Search,
  CheckCircle2,
  Sparkles,
  Users,
  ArrowLeft,
  UserPlus,
  FileText,
  Upload,
  User,
  Edit2,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

interface AdminSettingsViewProps {
  members: KasMember[];
  settings: ClassSettings;
  onUpdateMembers: (members: KasMember[]) => void;
  onReturnToHub: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  members,
  settings,
  onUpdateMembers,
  onReturnToHub
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'students' | 'audit' | 'pin' | 'cache' | 'version'>('whitelist');

  // Whitelist state
  const [users, setUsers] = useState<any[]>([]);
  const [whitelistSearchInput, setWhitelistSearchInput] = useState('');
  const [selectedStudentForWhitelist, setSelectedStudentForWhitelist] = useState<KasMember | null>(null);
  const [whitelistRole, setWhitelistRole] = useState<'bendahara' | 'sekretaris' | 'anggota'>('bendahara');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Student Management state (Unified with Gender & Status Aktif)
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');
  const [studentSuccessMsg, setStudentSuccessMsg] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');
  const [editingStudentNim, setEditingStudentNim] = useState('');

  // Import Modal/Area state
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<'semua' | 'transaksi' | 'iuran' | 'sekretaris'>('semua');
  const [auditSearch, setAuditSearch] = useState('');

  // Student list state
  const [memberList, setMemberList] = useState<KasMember[]>(members);

  // Security PIN state
  const [pin, setPin] = useState(() => localStorage.getItem('kelasgue_security_pin') || '123456');
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Cache reset state
  const [cacheMsg, setCacheMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setMemberList(members);
  }, [members]);

  const loadData = async () => {
    const list = await LocalKasRepository.getWhitelist();
    setUsers(list);

    const logs = await LocalKasRepository.fetchAuditLogsFromSupabase();
    setAuditLogs(logs);
  };

  // Auto-complete suggestions for Whitelist search
  const filteredStudentSuggestions = members.filter(m => {
    if (!whitelistSearchInput.trim()) return false;
    const q = whitelistSearchInput.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.studentId && m.studentId.toLowerCase().includes(q));
  });

  const handleSelectStudentForWhitelist = (student: KasMember) => {
    sfx.playOptionSelect();
    setSelectedStudentForWhitelist(student);
    setWhitelistSearchInput(toTitleCase(student.name));
    setIsDropdownOpen(false);
  };

  const handleAddWhitelist = async () => {
    let emailToAdd = '';
    let nameToAdd = '';

    if (selectedStudentForWhitelist) {
      emailToAdd = selectedStudentForWhitelist.email || `${selectedStudentForWhitelist.studentId || selectedStudentForWhitelist.id.substring(0, 6)}@gmail.com`;
      nameToAdd = toTitleCase(selectedStudentForWhitelist.name);
    } else if (whitelistSearchInput.trim()) {
      emailToAdd = whitelistSearchInput.trim();
      nameToAdd = whitelistSearchInput.trim().split('@')[0];
    } else {
      return;
    }

    sfx.playPaymentConfirmed();
    await LocalKasRepository.updateWhitelist(emailToAdd, whitelistRole, nameToAdd);
    showToast(`Role ${whitelistRole.toUpperCase()} untuk "${nameToAdd}" berhasil disimpan ke database!`, 'success');
    setWhitelistSearchInput('');
    setSelectedStudentForWhitelist(null);
    await loadData();
  };

  const handleRoleChange = async (email: string, role: 'bendahara' | 'sekretaris' | 'anggota') => {
    sfx.playOptionSelect();
    await LocalKasRepository.updateWhitelist(email, role);
    showToast(`Role ${email} berhasil diubah ke ${role.toUpperCase()} & tersimpan di database!`, 'success');
    await loadData();
  };

  const handleDeleteWhitelist = async (email: string, name: string) => {
    const ok = await showConfirm({
      title: 'Hapus / Reset Whitelist Role',
      message: `Hapus role whitelist untuk "${name}" (${email})? Pengguna akan dikembalikan ke role Anggota Biasa.`,
      confirmLabel: 'Ya, Hapus / Reset',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (!ok) return;

    sfx.playDeleteConfirm();
    await LocalKasRepository.deleteWhitelistUser(email);
    showToast(`Role whitelist untuk ${name} berhasil dihapus dari database!`, 'info');
    await loadData();
  };

  // Update specific student field and sync to DB
  const handleUpdateStudent = async (memberId: string, updates: Partial<KasMember>) => {
    sfx.playOptionSelect();
    const updated = memberList.map(m => m.id === memberId ? { ...m, ...updates } : m);
    setMemberList(updated);
    onUpdateMembers(updated);
    await LocalKasRepository.saveMembers(updated);
    showToast("Data siswa berhasil diperbarui ke database!", "success");
  };

  // Delete student with confirmation
  const handleDeleteStudent = async (memberId: string, name: string) => {
    const ok = await showConfirm({
      title: "Hapus Siswa",
      message: `Hapus data siswa "${name}" dari database kelas?`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true
    });
    if (!ok) return;
    sfx.playPaperRustle();
    const updated = memberList.filter(m => m.id !== memberId);
    setMemberList(updated);
    onUpdateMembers(updated);
    await LocalKasRepository.saveMembers(updated);
    showToast(`Siswa "${name}" dihapus`, "info");
  };

  // Add individual student
  const handleAddIndividualStudent = () => {
    if (!newStudentName.trim()) return;
    sfx.playPaymentConfirmed();

    const formattedName = toTitleCase(newStudentName.trim());
    const detectedGender = newStudentGender || autoDetectGenderByName(formattedName);

    const newMember: KasMember = {
      id: generateUUID(),
      name: formattedName,
      studentId: newStudentId.trim() || `230101${(memberList.length + 1).toString().padStart(3, '0')}`,
      gender: detectedGender,
      isActive: true,
      weeklyStatus: {}
    };

    const updated = [newMember, ...memberList];
    setMemberList(updated);
    onUpdateMembers(updated);
    LocalKasRepository.saveMembers(updated);

    setNewStudentName('');
    setNewStudentId('');
    setNewStudentGender('L');
    setStudentSuccessMsg(`✅ Siswa "${formattedName}" berhasil ditambahkan!`);
    setTimeout(() => setStudentSuccessMsg(''), 3000);
  };

  // Import batch students
  const handleBatchImport = () => {
    if (!importText.trim()) return;
    sfx.playPaymentConfirmed();

    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const newMembers: KasMember[] = [];

    lines.forEach(line => {
      // Format support: "Nama, NIM" or "NIM - Nama" or bare "Nama"
      let name = line;
      let studentId = '';

      if (line.includes(',')) {
        const parts = line.split(',');
        name = parts[0].trim();
        studentId = parts[1]?.trim() || '';
      } else if (line.includes('-')) {
        const parts = line.split('-');
        if (/^\d+$/.test(parts[0].trim())) {
          studentId = parts[0].trim();
          name = parts[1].trim();
        } else {
          name = parts[0].trim();
          studentId = parts[1].trim();
        }
      }

      if (name) {
        const formattedName = toTitleCase(name);
        newMembers.push({
          id: generateUUID(),
          name: formattedName,
          studentId: studentId || `230101${(memberList.length + newMembers.length + 1).toString().padStart(3, '0')}`,
          gender: autoDetectGenderByName(formattedName),
          isActive: true,
          weeklyStatus: {}
        });
      }
    });

    if (newMembers.length > 0) {
      const updated = [...newMembers, ...memberList];
      setMemberList(updated);
      onUpdateMembers(updated);
      LocalKasRepository.saveMembers(updated);
      setImportText('');
      setShowImportBox(false);
      setStudentSuccessMsg(`✅ Berhasil mengimpor ${newMembers.length} data siswa!`);
      setTimeout(() => setStudentSuccessMsg(''), 3000);
    }
  };

  // Gender & Active Status Actions
  const handleGenderChange = async (memberId: string, gender: 'L' | 'P') => {
    sfx.playOptionSelect();
    const updated = memberList.map(m => m.id === memberId ? { ...m, gender } : m);
    setMemberList(updated);
    onUpdateMembers(updated);
    await LocalKasRepository.updateMember(memberId, { gender });
    showToast(`Jenis kelamin diubah menjadi ${gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'} & tersimpan!`, 'success');
  };

  const handleToggleStudentActive = async (memberId: string) => {
    sfx.playToggle();
    const target = memberList.find(m => m.id === memberId);
    if (!target) return;
    const newActive = target.isActive === false; // toggle
    const updated = memberList.map(m => m.id === memberId ? { ...m, isActive: newActive } : m);
    setMemberList(updated);
    onUpdateMembers(updated);
    await LocalKasRepository.updateMember(memberId, { isActive: newActive });
    showToast(`Status ${toTitleCase(target.name)}: ${newActive ? 'Aktif' : 'Tidak Aktif (Pindah/Keluar)'}`, newActive ? 'success' : 'info');
  };

  const handleStartEditStudent = (student: KasMember) => {
    sfx.playClick();
    setEditingStudentId(student.id);
    setEditingStudentName(student.name);
    setEditingStudentNim(student.studentId || '');
  };

  const handleSaveEditStudent = async () => {
    if (!editingStudentId || !editingStudentName.trim()) return;
    sfx.playPaymentConfirmed();
    const formattedName = toTitleCase(editingStudentName.trim());
    const updated = memberList.map(m => m.id === editingStudentId ? {
      ...m,
      name: formattedName,
      studentId: editingStudentNim.trim()
    } : m);
    setMemberList(updated);
    onUpdateMembers(updated);
    await LocalKasRepository.updateMember(editingStudentId, {
      name: formattedName,
      studentId: editingStudentNim.trim()
    });
    setEditingStudentId(null);
    showToast(`Perubahan data siswa berhasil disimpan!`, 'success');
  };

  const handleDeleteAuditLog = async (logId: string) => {
    const ok = await showConfirm({
      title: "Hapus Catatan Audit",
      message: "Yakin ingin menghapus catatan riwayat audit log ini?",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true
    });
    if (!ok) return;
    sfx.playPaperRustle();
    await LocalKasRepository.deleteAuditLog(logId);
    setAuditLogs(prev => prev.filter(l => l.id !== logId));
    showToast("Catatan audit berhasil dihapus.", "info");
  };

  const handleClearAllAuditLogs = async () => {
    const ok = await showConfirm({
      title: "Bersihkan Semua Audit Log",
      message: "PERINGATAN: Seluruh riwayat catatan audit akan dibersihkan secara permanen. Lanjutkan?",
      confirmLabel: "Hapus Semua",
      cancelLabel: "Batal",
      isDanger: true
    });
    if (!ok) return;
    sfx.playPaperRustle();
    await LocalKasRepository.clearAuditLogs();
    setAuditLogs([]);
    showToast("Semua riwayat audit log telah dibersihkan.", "info");
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
    showToast("Auto-detect jenis kelamin berhasil diperbarui untuk semua siswa!", "success");
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
    <div className="min-h-screen bg-amber-50/60 p-3 sm:p-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-amber-100 border-3 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[4px_4px_0px_#000] relative overflow-visible flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Decorative Tape & Badge */}
        <div className="absolute -top-3.5 left-8 z-30 bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-wider px-3 py-0.5 border-2 border-slate-900 rotate-[-2deg] shadow-[1px_1px_0px_#000]">
          ★ RANAH MASTER ADMIN
        </div>

        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => {
              sfx.playCardClose();
              onReturnToHub();
            }}
            className="p-2.5 bg-white border-2 border-slate-900 rounded-xl hover:bg-amber-300 transition shadow-[2px_2px_0px_#000] active:translate-y-0.5 flex items-center gap-1.5 font-bold text-xs text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Hub Utama</span>
          </button>

          <div className="h-8 w-0.5 bg-slate-900/20 hidden sm:block" />

          <div>
            <h1 className="font-black text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
              Pengaturan Master Admin Kelas
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Kontrol terpusat Whitelist Roll, Manajemen Anggota Siswa, Audit Log, dan Keamanan System (v{CURRENT_APP_VERSION.version})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3 py-1 bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000]">
            SUPER ADMIN
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 p-2 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#000] overflow-x-auto no-scrollbar">
        {[
          { id: 'whitelist', label: 'Whitelist Roll', icon: UserCheck },
          { id: 'students', label: 'Manajemen Siswa', icon: UserPlus },
          { id: 'audit', label: 'Laporan Audit Log', icon: FileSpreadsheet },
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-amber-400 text-slate-900 border-slate-900 font-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                  : 'bg-amber-50/50 border-slate-300 text-slate-700 hover:bg-amber-100 shadow-[1px_1px_0px_#000]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-white border-3 border-slate-900 rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_#000] space-y-6">
        {/* SUB-TAB 1: WHITELIST ROLL */}
        {activeTab === 'whitelist' && (
          <div className="space-y-5">
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-slate-900 text-xs text-slate-900 space-y-1">
              <strong className="font-black text-amber-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" /> Whitelist Roll Hak Akses Pengurus
              </strong>
              <p>
                Ketik nama atau NIM siswa untuk mencari otomatis dari daftar anggota kelas, lalu tetapkan role wewenang sebagai <strong>Bendahara Kelas</strong> atau <strong>Sekretaris Kelas</strong>.
              </p>
            </div>

            {/* Auto-Complete Search Bar */}
            <div className="relative space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                🔍 Cari Nama / NIM Siswa atau Masukkan Email Google:
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ketik Nama Siswa atau NIM..."
                    value={whitelistSearchInput}
                    onChange={(e) => {
                      setWhitelistSearchInput(e.target.value);
                      setSelectedStudentForWhitelist(null);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-900 rounded-xl text-xs font-semibold focus:outline-none bg-white shadow-[1px_1px_0px_#000]"
                  />

                  {/* Dropdown Auto-Complete */}
                  {isDropdownOpen && filteredStudentSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#000] z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredStudentSuggestions.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStudentForWhitelist(st)}
                          className="p-2.5 hover:bg-amber-100 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{toTitleCase(st.name)}</p>
                            <p className="text-[10px] text-slate-500">NIM: {st.studentId || 'Belum diset'}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-slate-900">
                            Pilih Siswa
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={whitelistRole}
                  onChange={(e) => {
                    sfx.playOptionSelect();
                    setWhitelistRole(e.target.value as any);
                  }}
                  className="px-3.5 py-2.5 border-2 border-slate-900 rounded-xl text-xs font-black bg-amber-100 shadow-[1.5px_1.5px_0px_#000] cursor-pointer appearance-none"
                >
                  <option value="bendahara">Bendahara Kelas</option>
                  <option value="sekretaris">Sekretaris Kelas</option>
                  <option value="anggota">Anggota Biasa</option>
                </select>

                <button
                  onClick={handleAddWhitelist}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
                >
                  + Tetapkan Role Whitelist
                </button>
              </div>

              {selectedStudentForWhitelist && (
                <div className="p-2 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-400 flex items-center justify-between">
                  <span>Siswa Terpilih: <strong>{toTitleCase(selectedStudentForWhitelist.name)}</strong> (NIM: {selectedStudentForWhitelist.studentId || '-'})</span>
                  <button onClick={() => { setSelectedStudentForWhitelist(null); setWhitelistSearchInput(''); }} className="text-rose-600 underline text-[10px]">Batal</button>
                </div>
              )}
            </div>

            {/* Whitelist Users Table */}
            <div className="border-2 border-slate-900 rounded-xl overflow-x-auto shadow-[2px_2px_0px_#000]">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-amber-100 border-b-2 border-slate-900 font-black text-slate-900">
                  <tr>
                    <th className="p-3">Pengguna / Nama</th>
                    <th className="p-3">Email / ID Whitelist</th>
                    <th className="p-3">Role Status</th>
                    <th className="p-3 text-right">Aksi Ubah Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-amber-50/60">
                      <td className="p-3 font-bold text-slate-900">{toTitleCase(u.name || u.email.split('@')[0])}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] uppercase border-2 border-slate-900 shadow-[1px_1px_0px_#000] ${
                            u.role === 'superadmin'
                              ? 'bg-purple-300 text-purple-950'
                              : u.role === 'bendahara'
                              ? 'bg-emerald-300 text-emerald-950'
                              : u.role === 'sekretaris'
                              ? 'bg-sky-300 text-sky-950'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role === 'superadmin' ? (
                          <span className="text-[10px] text-slate-400 italic font-bold">Super Admin Utama</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.email, e.target.value as any)}
                              className="px-2 py-1 border-2 border-slate-900 rounded-lg bg-white text-[11px] font-bold shadow-[1px_1px_0px_#000] cursor-pointer"
                            >
                              <option value="bendahara">Bendahara</option>
                              <option value="sekretaris">Sekretaris</option>
                              <option value="anggota">Anggota Biasa</option>
                            </select>

                            <button
                              onClick={() => handleDeleteWhitelist(u.email, u.name || u.email.split('@')[0])}
                              className="btn-doodle p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-slate-900 rounded-lg shadow-[1px_1px_0px_#000]"
                              title="Hapus / Reset whitelist pengguna ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: MANAJEMEN SISWA (Tambah & Import) */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-slate-900 text-xs text-slate-900 space-y-1">
              <strong className="font-black text-amber-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-600" /> Pusat Manajemen Anggota Siswa Kelas
              </strong>
              <p>
                Kelola penambahan anggota siswa baru secara individual atau impor massal melalui format teks/CSV.
              </p>
            </div>

            {studentSuccessMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border-2 border-emerald-400">
                {studentSuccessMsg}
              </div>
            )}

            {/* Individual Student Form */}
            <div className="p-4 bg-amber-50/60 rounded-xl border-2 border-slate-900 space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                + Tambah Siswa Individual
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ahmad Budi Pratama"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-medium focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIM</label>
                  <input
                    type="text"
                    placeholder="Contoh: 230101001"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-medium focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => {
                      sfx.playOptionSelect();
                      setNewStudentGender(e.target.value as any);
                    }}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-bold bg-white shadow-[1px_1px_0px_#000] cursor-pointer appearance-none"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddIndividualStudent}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
              >
                + Simpan Siswa Baru
              </button>
            </div>

            {/* Batch Import Area */}
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-500" /> Impor Massal Daftar Siswa Kelas
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Masukkan daftar nama siswa bertumpuk (satu nama per baris). Format: "Nama, NIM" atau "NIM - Nama".
                  </p>
                </div>
                <button
                  onClick={() => setShowImportBox(!showImportBox)}
                  className="px-3 py-1.5 bg-amber-400 text-slate-900 font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#000]"
                >
                  {showImportBox ? 'Sembunyikan' : 'Buka Form Impor'}
                </button>
              </div>

              {showImportBox && (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={5}
                    placeholder={`Ahmad Budi, 230101001\nSiti Rahmawati, 230101002\nEko Prasetyo - 230101003`}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full p-3 border-2 border-slate-900 rounded-xl text-xs font-mono focus:outline-none bg-white"
                  />
                  <button
                    onClick={handleBatchImport}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
                  >
                    Proses Impor Daftar Siswa
                  </button>
                </div>
              )}
            </div>

            {/* Current Member List Preview with Direct Edit, Gender, Active Status, and Delete */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t-2 border-slate-900/10">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Daftar Siswa Terdaftar ({memberList.length} Siswa)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {memberList.filter(m => m.isActive !== false).length} Siswa Aktif • {memberList.filter(m => m.isActive === false).length} Siswa Tidak Aktif (Pindah/Keluar)
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama / NIM siswa..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border-2 border-slate-900 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <button
                    onClick={handleAutoDetectAllGenders}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000] shrink-0"
                    title="Otomatis deteksi jenis kelamin semua siswa dari nama"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Auto-Detect L/P</span>
                  </button>
                </div>
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {memberList
                  .filter(m => {
                    if (!studentSearch.trim()) return true;
                    const q = studentSearch.toLowerCase();
                    return m.name.toLowerCase().includes(q) || (m.studentId && m.studentId.toLowerCase().includes(q));
                  })
                  .map((m, index) => {
                    const isEditing = editingStudentId === m.id;
                    const isInactive = m.isActive === false;

                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border-2 border-slate-900 transition-all flex flex-col justify-between gap-3 shadow-[2px_2px_0px_#000] ${
                          isInactive ? 'bg-slate-100/80 opacity-75 border-dashed' : 'bg-white'
                        }`}
                      >
                        {/* Top: Absen, Name, NIM */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-amber-200 border border-slate-900 flex items-center justify-center font-mono font-black text-[10px] text-slate-900 shrink-0">
                              {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={editingStudentName}
                                    onChange={(e) => setEditingStudentName(e.target.value)}
                                    placeholder="Nama siswa"
                                    className="w-full px-2 py-1 border-2 border-slate-900 rounded-lg text-xs font-bold bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={editingStudentNim}
                                    onChange={(e) => setEditingStudentNim(e.target.value)}
                                    placeholder="NIM / No. Absen"
                                    className="w-full px-2 py-1 border-2 border-slate-900 rounded-lg text-xs font-mono bg-white"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <p className={`font-black text-xs text-slate-900 truncate leading-snug ${isInactive ? 'line-through text-slate-500' : ''}`}>
                                    {toTitleCase(m.name)}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    NIM: {m.studentId || '-'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Edit Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSaveEditStudent}
                                  className="p-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-900 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#000]"
                                  title="Simpan Perubahan"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => setEditingStudentId(null)}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg border-2 border-slate-900"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEditStudent(m)}
                                  className="p-1.5 bg-slate-100 hover:bg-amber-200 text-slate-700 rounded-lg border border-slate-400"
                                  title="Edit Nama / NIM"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(m.id, m.name)}
                                  className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg border border-rose-400"
                                  title="Hapus Siswa dari Database"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Gender Selector & Active Status Toggle */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                          {/* Gender L / P toggle */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500 mr-0.5">Kelamin:</span>
                            <button
                              type="button"
                              onClick={() => handleGenderChange(m.id, 'L')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border-2 border-slate-900 transition-all ${
                                (m.gender || autoDetectGenderByName(m.name)) === 'L'
                                  ? 'bg-blue-400 text-slate-950 shadow-[1.5px_1.5px_0px_#000] font-black'
                                  : 'bg-slate-100 text-slate-600 hover:bg-blue-100'
                              }`}
                            >
                              Laki-laki (L)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenderChange(m.id, 'P')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border-2 border-slate-900 transition-all ${
                                (m.gender || autoDetectGenderByName(m.name)) === 'P'
                                  ? 'bg-pink-400 text-slate-950 shadow-[1.5px_1.5px_0px_#000] font-black'
                                  : 'bg-slate-100 text-slate-600 hover:bg-pink-100'
                              }`}
                            >
                              Perempuan (P)
                            </button>
                          </div>

                          {/* Active / Inactive Status Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStudentActive(m.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border-2 border-slate-900 flex items-center gap-1 transition-all ${
                              !isInactive
                                ? 'bg-emerald-300 text-slate-950 shadow-[1.5px_1.5px_0px_#000]'
                                : 'bg-rose-200 text-rose-950 shadow-[1.5px_1.5px_0px_#000]'
                            }`}
                            title={!isInactive ? 'Klik untuk menandai siswa pindah/keluar' : 'Klik untuk mengaktifkan kembali'}
                          >
                            {!isInactive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                                <span>Status: Aktif</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-800" />
                                <span>Tidak Aktif / Pindah</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-slate-700">Filter:</span>
                {(['semua', 'transaksi', 'iuran', 'sekretaris'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAuditFilter(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border-2 capitalize transition ${
                      auditFilter === f
                        ? 'bg-amber-400 text-slate-900 border-slate-900 shadow-[1px_1px_0px_#000]'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari aktivitas..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border-2 border-slate-900 rounded-xl text-xs w-full bg-white"
                  />
                </div>

                {auditLogs.length > 0 && (
                  <button
                    onClick={handleClearAllAuditLogs}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1.5 shrink-0"
                    title="Hapus seluruh riwayat audit log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bersihkan Log</span>
                  </button>
                )}
              </div>
            </div>

            <div className="border-2 border-slate-900 rounded-xl overflow-hidden max-h-96 overflow-y-auto shadow-[2px_2px_0px_#000]">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100 border-b-2 border-slate-900 font-black text-slate-900 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Waktu</th>
                    <th className="p-2.5">Aksi</th>
                    <th className="p-2.5">Oleh</th>
                    <th className="p-2.5">Rincian Detail</th>
                    <th className="p-2.5 text-center w-12">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                        Tidak ada catatan audit yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-amber-50/60">
                        <td className="p-2.5 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-900 ${
                            log.action.includes("PEMASUKAN") ? "bg-emerald-200 text-emerald-950" :
                            log.action.includes("PENGELUARAN") || log.action.includes("HAPUS") ? "bg-rose-200 text-rose-950" :
                            log.action.includes("IURAN") ? "bg-amber-200 text-amber-950" :
                            log.action.includes("PRESENSI") || log.action.includes("SEKRETARIS") ? "bg-sky-200 text-sky-950" :
                            "bg-purple-200 text-purple-950"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {log.performedBy} <span className="text-[10px] text-slate-400">({log.userRole})</span>
                        </td>
                        <td className="p-2.5 text-slate-600">{log.details}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteAuditLog(log.id)}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded transition"
                            title="Hapus baris audit log ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: PIN KEAMANAN */}
        {activeTab === 'pin' && (
          <div className="max-w-md mx-auto space-y-4 py-4">
            <div className="bg-slate-50 p-5 rounded-xl border-3 border-slate-900 space-y-3 shadow-[3px_3px_0px_#000]">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" /> Atur PIN Keamanan Kelas
              </h4>
              <p className="text-xs text-slate-600">
                PIN digunakan untuk memverifikasi tindakan administratif sensitif. PIN default: <strong>123456</strong>.
              </p>

              {pinSuccessMsg && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300">
                  {pinSuccessMsg}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">PIN Baru (Min 4 Angka)</label>
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Masukkan PIN baru"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-xl text-sm font-mono focus:outline-none bg-white"
                />
              </div>

              <button
                onClick={handleSavePin}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
              >
                Simpan PIN Keamanan
              </button>
            </div>
          </div>
        )}

        {/* SUB-TAB 6: RESET CACHE LOKAL */}
        {activeTab === 'cache' && (
          <div className="max-w-md mx-auto space-y-4 py-4">
            <div className="bg-rose-50 p-5 rounded-xl border-3 border-rose-300 space-y-3 text-center shadow-[3px_3px_0px_#000]">
              <Trash2 className="w-9 h-9 text-rose-600 mx-auto" />
              <h4 className="font-black text-sm text-rose-950">
                Pembersihan Cache & Storage Lokal
              </h4>
              <p className="text-xs text-rose-800">
                Tindakan ini hanya akan membersihkan memori sementara di perangkat browser ini. Data utama yang telah tersimpan di Supabase <strong>tetap aman</strong> dan akan diunduh kembali secara otomatis.
              </p>

              {cacheMsg && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300">
                  {cacheMsg}
                </div>
              )}

              <button
                onClick={handleClearLocalCache}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
              >
                Bersihkan Cache Perangkat Ini
              </button>
            </div>
          </div>
        )}

        {/* SUB-TAB 7: VERSION & RELEASE NOTES */}
        {activeTab === 'version' && (
          <div className="space-y-5">
            <div className="bg-slate-900 text-white p-5 rounded-xl border-3 border-slate-900 shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 bg-slate-800 rounded border border-amber-400/40">
                  Aplikasi Kelas Gue Official
                </span>
                <h3 className="font-black text-xl text-amber-300 mt-1">
                  Versi {CURRENT_APP_VERSION.version} ({CURRENT_APP_VERSION.codename})
                </h3>
                <p className="text-xs text-slate-300 mt-1">Tanggal Rilis: {CURRENT_APP_VERSION.releaseDate}</p>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-700">
                📋 Catatan Pembaruan Terintegrasi
              </h4>
              <ul className="space-y-2">
                {CURRENT_APP_VERSION.changes.map((c, i) => (
                  <li key={i} className="text-xs p-3 rounded-xl bg-amber-50/70 border-2 border-slate-900 flex items-start gap-2 shadow-[2px_2px_0px_#000]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-900 font-medium">{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Features */}
            <div className="space-y-2 pt-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-amber-900">
                💡 Saran & Rekomendasi Pembaruan Aplikasi Masa Depan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CURRENT_APP_VERSION.suggestedUpdates.map((s, idx) => (
                  <div key={idx} className="p-3.5 bg-amber-100/60 border-2 border-slate-900 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-300 text-amber-950 border border-slate-900">
                      {s.category}
                    </span>
                    <h5 className="font-black text-xs text-slate-900">{s.title}</h5>
                    <p className="text-[11px] text-slate-700 leading-snug">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
