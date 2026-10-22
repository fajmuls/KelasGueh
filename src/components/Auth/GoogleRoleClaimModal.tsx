import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { User, Role } from '../../types/index.ts';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Send,
  Sparkles,
  RefreshCw,
  Search,
  KeyRound,
  GraduationCap,
  Building2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { TEMPLATE_39_STUDENTS } from '../../services/firestoreSync.ts';

interface GoogleRoleClaimModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const AVAILABLE_CLASSES = [
  { id: 'cls_01sakp014', name: 'Kelas 01 SAKP 14', code: '01SAKP014', major: 'S1 Akuntansi Perpajakan' },
  { id: 'cls_02sakp001', name: 'Kelas 02 SAKP 01', code: '02SAKP001', major: 'S1 Akuntansi Keuangan' },
  { id: 'cls_03mnj005', name: 'Kelas 03 MNJ 05', code: '03MNJ005', major: 'S1 Manajemen Bisnis' },
];

export const GoogleRoleClaimModal: React.FC<GoogleRoleClaimModalProps> = ({
  isOpen,
}) => {
  const {
    firebaseUser,
    logoutGoogle,
    refreshAuth,
    enterPortal,
    allUsers,
  } = useAuth();

  const [students, setStudents] = useState<User[]>(TEMPLATE_39_STUDENTS);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('cls_01sakp014');
  const [nimInput, setNimInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('role_sekretaris');
  const [proCodeInput, setProCodeInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load students & roles
  useEffect(() => {
    const init = async () => {
      try {
        let uList = allUsers.length > 0 ? allUsers : TEMPLATE_39_STUDENTS;
        const rList = await api.getRoles();
        
        // Filter out superadmin and sort students A-Z
        const filteredStudents = uList.filter(u => u.role_id !== 'role_superadmin');
        const sorted = [...filteredStudents].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
        
        setStudents(sorted.length > 0 ? sorted : TEMPLATE_39_STUDENTS);
        setRoles(rList);
        if (sorted.length > 0) {
          setSelectedStudentId(sorted[0].id);
          setNimInput(sorted[0].nim);
        }
      } catch (err) {
        console.error('Failed to load students for claim:', err);
      }
    };
    if (isOpen) {
      init();
    }
  }, [isOpen, allUsers.length]);

  // When NIM input changes, auto-select corresponding student if matched
  const handleNimChange = (val: string) => {
    setNimInput(val);
    const matched = students.find(s => s.nim === val.trim() || s.nim.endsWith(val.trim()));
    if (matched) {
      setSelectedStudentId(matched.id);
    }
  };

  // When student selection changes, sync NIM
  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const found = students.find(s => s.id === id);
    if (found) {
      setNimInput(found.nim);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser?.email || !selectedStudentId) return;

    try {
      setIsSubmitting(true);
      const chosenStudent = students.find(s => s.id === selectedStudentId);
      const chosenRole = roles.find(r => r.id === selectedRoleId);
      
      const payloadNotes = [
        notes.trim(),
        proCodeInput.trim() ? `[KODE PRO: ${proCodeInput.trim()}]` : '',
        nimInput.trim() ? `[NIM: ${nimInput.trim()}]` : '',
        `[Kelas: ${selectedClassId}]`,
      ].filter(Boolean).join(' - ');

      const res = await api.claimRole({
        google_email: firebaseUser.email,
        google_name: firebaseUser.displayName || chosenStudent?.name || 'Pengguna Google',
        google_avatar: firebaseUser.photoURL || chosenStudent?.avatar || '',
        google_uid: firebaseUser.uid,
        requested_user_id: selectedStudentId,
        requested_role_id: selectedRoleId,
        notes: payloadNotes,
        pro_code: proCodeInput.trim(),
      });

      if (res.autoApproved) {
        setSuccessNotice('Kode Master Terverifikasi! Membuka hak akses penuh...');
        setTimeout(async () => {
          await enterPortal(selectedStudentId);
        }, 500);
        return;
      }

      // Smooth entry as Anggota with pending role
      setSuccessNotice(
        `Registrasi Berhasil! Anda sekarang masuk sebagai Anggota Kelas. Pengajuan role ${chosenRole?.name || 'Sekretaris'} akan ditinjau oleh Super Admin.`
      );
      setTimeout(async () => {
        await enterPortal(selectedStudentId);
      }, 700);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pendaftaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredList = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nim.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-5 animate-in fade-in-50 zoom-in-95 border border-slate-100 my-6">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
            <GraduationCap className="w-3.5 h-3.5" /> Pendaftaran & Pemilihan Kelas Mahasiswa
          </div>
          <button
            onClick={logoutGoogle}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Ganti Akun Google
          </button>
        </div>

        {/* Google User Profile Snippet */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          <img
            src={
              firebaseUser?.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
            alt={firebaseUser?.displayName || 'User'}
            className="w-10 h-10 rounded-full border border-slate-300 shadow-2xs"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">
              {firebaseUser?.displayName || 'Mahasiswa Google'}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate">
              {firebaseUser?.email}
            </p>
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 text-blue-800 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Akses Cepat Langsung Masuk Portal
          </p>
          Silakan pilih kelas, masukkan NIM, dan pilih jabatan yang Anda ajukan. Setelah submit, Anda akan <strong>langsung masuk ke portal sebagai Anggota Kelas</strong> untuk melihat detail jadwal, kas, dan direktori, sementara pengajuan jabatan akan di-verifikasi oleh Super Admin.
        </div>

        {successNotice ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs text-center space-y-2 animate-in fade-in-50">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 animate-bounce" />
            </div>
            <p className="font-bold text-emerald-800">{successNotice}</p>
            <p className="text-[11px] text-emerald-700">Membuka menu utama kelas Anda...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
            {/* Step 1: Select Class */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Langkah 1: Pilih Kelas Perkuliahan
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500 text-slate-800 font-medium"
              >
                {AVAILABLE_CLASSES.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code}) — {cls.major}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Input NIM & Select Student */}
            <div className="space-y-2">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Langkah 2: Masukkan NIM Anda
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik NIM Anda (contoh: 261011201412)"
                  value={nimInput}
                  onChange={(e) => handleNimChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500 text-slate-800 font-mono text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Pilih Nama di Roster 39 Mahasiswa Kelas:
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500 text-slate-800 text-xs"
                >
                  {filteredList.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {idx + 1}. {s.name} (NIM: {s.nim})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Requested Role & Optional Pro Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Langkah 3: Ajukan Jabatan / Role
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500 text-slate-800 font-medium"
                >
                  {roles
                    .filter((r) => r.id !== 'role_superadmin')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Masuk awal sebagai Anggota, di-ACC Super Admin untuk role pengurus.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Kode Pro (Opsional)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    01SAKP014PRO
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ketik 01SAKP014PRO..."
                  value={proCodeInput}
                  onChange={(e) => setProCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500 text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Step 4: Notes */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Catatan / Informasi Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan permohonan untuk Ketua Kelas / Super Admin..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={logoutGoogle}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar & Masuk Kelas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
