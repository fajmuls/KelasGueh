import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { User } from '../../types/index.ts';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Users,
  KeyRound,
  ArrowRight,
  BookOpen,
  Search,
  CheckCircle2,
  ChevronRight,
  Building2,
  ArrowLeft,
  AlertCircle,
  Check,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { TEMPLATE_39_STUDENTS } from '../../services/firestoreSync.ts';
import { api } from '../../services/api.ts';

interface SplashScreenProps {
  onEnterAsUser: (userId: string) => void;
  onLoginGoogle: () => void;
}

interface AvailableClass {
  id: string;
  name: string;
  code: string;
  major: string;
  faculty: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  advisor: string;
  description: string;
}

const INITIAL_CLASSES: AvailableClass[] = [
  {
    id: 'cls_01sakp014',
    name: 'Kelas 01 SAKP 14',
    code: '01SAKP014',
    major: 'S1 Akuntansi Perpajakan',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    semester: 'Semester 1 (Ganjil)',
    academicYear: '2026/2027',
    studentCount: 39,
    advisor: 'Dr. H. Rahman, M.Si., Ak., CA',
    description: 'Kelas perkuliahan konsentrasi Akuntansi Perpajakan & Audit Keuangan.',
  },
  {
    id: 'cls_02sakp001',
    name: 'Kelas 02 SAKP 01',
    code: '02SAKP001',
    major: 'S1 Akuntansi Keuangan',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    semester: 'Semester 3 (Ganjil)',
    academicYear: '2026/2027',
    studentCount: 36,
    advisor: 'Dra. Hj. Nurjanah, M.Ak.',
    description: 'Kelas perkuliahan konsentrasi Akuntansi Keuangan Publik & Perbankan.',
  },
  {
    id: 'cls_03mnj005',
    name: 'Kelas 03 MNJ 05',
    code: '03MNJ005',
    major: 'S1 Manajemen Bisnis',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    semester: 'Semester 1 (Ganjil)',
    academicYear: '2026/2027',
    studentCount: 40,
    advisor: 'M. Firdaus, S.E., M.M.',
    description: 'Kelas perkuliahan konsentrasi Manajemen Pemasaran & Strategi Bisnis.',
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnterAsUser,
  onLoginGoogle,
}) => {
  const { allUsers, isSuperAdmin, firebaseUser, logoutGoogle, openDomainHelper, enterPortal } = useAuth();
  const [classesList, setClassesList] = useState<AvailableClass[]>(INITIAL_CLASSES);
  const [selectedClass, setSelectedClass] = useState<AvailableClass | null>(null);

  // Student Profile Selector (For when entering a class after login)
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [nimInput, setNimInput] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role_anggota');
  const [proCodeInput, setProCodeInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  // Admin PIN Login Drawer (Alternative to Google Login)
  const [showAdminPinLogin, setShowAdminPinLogin] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  // Class Management Modal (Only accessible by Super Admin)
  const [showClassEditor, setShowClassEditor] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<AvailableClass | null>(null);
  const [isCreatingNewClass, setIsCreatingNewClass] = useState<boolean>(false);

  // Super Admin Check (True if role is superadmin or logged in with superadmin email)
  const isUserSuperAdmin = isSuperAdmin || firebaseUser?.email?.toLowerCase() === 'mrachmanfm@gmail.com';

  const studentList = allUsers.length > 0 ? allUsers : TEMPLATE_39_STUDENTS;
  const filteredStudents = studentList.filter((s) =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.nim.includes(searchStudent) ||
    (s.role_name || '').toLowerCase().includes(searchStudent.toLowerCase())
  );

  // When class is clicked
  const handleSelectClass = (cls: AvailableClass) => {
    setSelectedClass(cls);
    setVerificationSuccess(null);
    if (studentList.length > 0) {
      setSelectedStudentId(studentList[0].id);
      setNimInput(studentList[0].nim);
    }
  };

  const handleNimChange = (val: string) => {
    setNimInput(val);
    const matched = studentList.find(s => s.nim === val.trim() || s.nim.endsWith(val.trim()));
    if (matched) {
      setSelectedStudentId(matched.id);
    }
  };

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const found = studentList.find(s => s.id === id);
    if (found) {
      setNimInput(found.nim);
    }
  };

  // Submit student verification and enter portal directly
  const handleSubmitClassEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      setIsSubmitting(true);
      const chosenStudent = studentList.find(s => s.id === selectedStudentId);

      // Claim role & link profile
      const res = await api.claimRole({
        google_email: firebaseUser?.email || chosenStudent?.email || `${nimInput}@student.ac.id`,
        google_name: firebaseUser?.displayName || chosenStudent?.name || 'Mahasiswa',
        google_avatar: firebaseUser?.photoURL || chosenStudent?.avatar || '',
        google_uid: firebaseUser?.uid || `splash_${selectedStudentId}`,
        requested_user_id: selectedStudentId,
        requested_role_id: selectedRoleId,
        notes: [
          notes.trim(),
          proCodeInput.trim() ? `[KODE PRO: ${proCodeInput.trim()}]` : '',
          `[NIM: ${nimInput}]`,
          `[Kelas: ${selectedClass?.code || '01SAKP014'}]`,
        ].filter(Boolean).join(' - '),
        pro_code: proCodeInput.trim(),
      });

      if (res.autoApproved) {
        setVerificationSuccess('Kode Master Terverifikasi! Membuka hak akses penuh...');
      } else {
        setVerificationSuccess('Terdaftar! Membuka portal kelas sebagai Anggota...');
      }

      setTimeout(() => {
        onEnterAsUser(selectedStudentId);
      }, 500);
    } catch (err: any) {
      // Fallback: enter directly
      onEnterAsUser(selectedStudentId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Super Admin PIN Login
  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPin.trim().toUpperCase();
    if (clean === '01SAKP014PRO' || clean === '01SAKP014' || clean === 'ADMIN123' || clean === 'SUPERADMIN' || clean === 'SAKP2026') {
      setAdminPinError(null);
      onEnterAsUser('usr_member_25'); // Super Admin
    } else {
      setAdminPinError('PIN Pengurus tidak valid. Gunakan 01SAKP014PRO atau login Google.');
    }
  };

  // Class Management (Super Admin ONLY)
  const handleDeleteClass = (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isUserSuperAdmin) return;
    if (classesList.length <= 1) {
      alert('Tidak dapat menghapus kelas terakhir.');
      return;
    }
    if (confirm('Hapus kelas ini dari daftar?')) {
      setClassesList(prev => prev.filter(c => c.id !== classId));
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
    }
  };

  const handleOpenEditClass = (cls: AvailableClass, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isUserSuperAdmin) return;
    setEditingClass({ ...cls });
    setIsCreatingNewClass(false);
    setShowClassEditor(true);
  };

  const handleOpenCreateClass = () => {
    if (!isUserSuperAdmin) return;
    setEditingClass({
      id: `cls_${Date.now()}`,
      name: '',
      code: '',
      major: 'S1 Akuntansi',
      faculty: 'Fakultas Ekonomi dan Bisnis',
      semester: 'Semester 1 (Ganjil)',
      academicYear: '2026/2027',
      studentCount: 35,
      advisor: '',
      description: '',
    });
    setIsCreatingNewClass(true);
    setShowClassEditor(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !isUserSuperAdmin) return;

    if (isCreatingNewClass) {
      setClassesList(prev => [...prev, editingClass]);
    } else {
      setClassesList(prev => prev.map(c => c.id === editingClass.id ? editingClass : c));
      if (selectedClass?.id === editingClass.id) {
        setSelectedClass(editingClass);
      }
    }
    setShowClassEditor(false);
    setEditingClass(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
              Kelas Manager
            </h1>
            <p className="text-[11px] text-slate-400">Portal Kolaborasi Mahasiswa</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Simple Clean Online Indicator */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
            v3.3.0
          </span>
        </div>
      </header>

      {/* Main Card Container */}
      <main className="max-w-2xl mx-auto w-full my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* STAGE 1: NOT LOGGED IN WITH GOOGLE -> LOGIN GOOGLE FIRST */}
          {!firebaseUser ? (
            <div className="space-y-6 text-center animate-in fade-in-50 duration-200">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Langkah 1: Autentikasi Pengguna
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Selamat Datang di <span className="text-indigo-400">Kelas Manager</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Silakan masuk menggunakan Akun Google Anda terlebih dahulu untuk memilih kelas perkuliahan.
                </p>
              </div>

              {/* Main Prominent Google Login Button */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={onLoginGoogle}
                  className="w-full px-6 py-4 bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Akun Google</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Secondary Option: Admin PIN Login Drawer Toggle */}
                <button
                  onClick={() => setShowAdminPinLogin(!showAdminPinLogin)}
                  className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 py-1 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akses Pengurus / Super Admin (PIN)</span>
                </button>

                {showAdminPinLogin && (
                  <form
                    onSubmit={handleAdminPinSubmit}
                    className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 text-left space-y-2.5 animate-in fade-in-50"
                  >
                    <label className="block text-xs font-semibold text-amber-300">
                      Masukkan PIN / Kode Pengurus Kelas:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Ketik 01SAKP014PRO..."
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-indigo-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Buka Akses
                      </button>
                    </div>
                    {adminPinError && (
                      <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {adminPinError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Feature Highlights Minimalist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800/80">
                <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <p className="font-semibold text-slate-200">Presensi QR</p>
                  <p className="text-[10px] text-slate-400">Absensi Cepat</p>
                </div>
                <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <p className="font-semibold text-slate-200">Transparansi Kas</p>
                  <p className="text-[10px] text-slate-400">Laporan Real-Time</p>
                </div>
                <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <p className="font-semibold text-slate-200">Jadwal Kuliah</p>
                  <p className="text-[10px] text-slate-400">Notifikasi H-1</p>
                </div>
                <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <p className="font-semibold text-slate-200">Forum Akademik</p>
                  <p className="text-[10px] text-slate-400">Diskusi Kelas</p>
                </div>
              </div>
            </div>
          ) : !selectedClass ? (
            /* STAGE 2: ALREADY LOGGED IN WITH GOOGLE -> SELECT CLASS */
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Authenticated User Status Bar */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={
                      firebaseUser.photoURL ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={firebaseUser.displayName || 'User'}
                    className="w-9 h-9 rounded-full border border-slate-700 shadow-xs"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">
                      {firebaseUser.displayName || 'Mahasiswa'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {firebaseUser.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logoutGoogle}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Ganti Akun Google"
                >
                  <LogOut className="w-3.5 h-3.5" /> Ganti Akun
                </button>
              </div>

              {/* Header Title Section */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" /> Pilih Kelas Perkuliahan:
                  </h2>

                  {/* Super Admin ONLY Button: Tambah Kelas */}
                  {isUserSuperAdmin && (
                    <button
                      onClick={handleOpenCreateClass}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      title="Tambah Kelas Baru (Khusus Super Admin)"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Kelas
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Pilih kelas untuk melanjutkan ke profil mahasiswa dan melihat aktivitas perkuliahan.
                </p>
              </div>

              {/* List of Available Classes */}
              <div className="space-y-3">
                {classesList.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => handleSelectClass(cls)}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-500/60 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-xs font-mono">
                          {cls.code}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-indigo-300 transition-colors">
                          {cls.name}
                        </h3>
                        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {cls.semester}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{cls.major} • {cls.faculty}</p>
                      <p className="text-[11px] text-slate-400">
                        Dosen Wali: {cls.advisor} • {cls.studentCount} Mahasiswa
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Super Admin ONLY Controls: Edit & Delete Class */}
                      {isUserSuperAdmin && (
                        <>
                          <button
                            onClick={(e) => handleOpenEditClass(cls, e)}
                            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                            title="Edit Kelas Ini (Super Admin)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClass(cls.id, e)}
                            className="p-2 rounded-xl bg-slate-700 hover:bg-rose-900/60 text-slate-200 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Hapus Kelas (Super Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <span className="text-xs font-semibold text-indigo-300 group-hover:text-white px-3 py-1.5 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-600 transition-colors flex items-center gap-1">
                        Pilih Kelas <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STAGE 3: CLASS SELECTED -> CHOOSE STUDENT PROFILE & ENTER WITHOUT RE-LOGIN */
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Back to Class Selection Button & Selected Class Banner */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Ganti Kelas
                </button>

                <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {selectedClass.name} ({selectedClass.code})
                </span>
              </div>

              {/* If Super Admin, allow instant entry as Super Admin */}
              {isUserSuperAdmin ? (
                <div className="p-5 bg-indigo-950/50 border border-indigo-500/40 rounded-2xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-white">
                      Akses Terverifikasi: Super Admin
                    </h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      Akun <strong>{firebaseUser.email}</strong> memiliki wewenang penuh atas seluruh modul dan tata kelola kelas.
                    </p>
                  </div>
                  <button
                    onClick={() => onEnterAsUser('usr_member_25')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>Masuk Portal Sebagai Super Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : verificationSuccess ? (
                <div className="p-5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-2 animate-in fade-in-50">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 animate-bounce" />
                  </div>
                  <p className="font-bold text-sm text-emerald-300">{verificationSuccess}</p>
                  <p className="text-xs text-slate-300">Membuka menu utama kelas Anda...</p>
                </div>
              ) : (
                /* Student Profile Form (No need to log in again!) */
                <form onSubmit={handleSubmitClassEntry} className="space-y-4 text-xs">
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-slate-300 leading-relaxed">
                    <p className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-3.5 h-3.5" /> Pilih Profil Mahasiswa Anda di {selectedClass.code}
                    </p>
                    Akun Google Anda (<strong>{firebaseUser.email}</strong>) akan dihubungkan ke profil mahasiswa yang dipilih di bawah ini. Anda langsung masuk sebagai <strong>Anggota Kelas</strong>.
                  </div>

                  {/* Step A: Input NIM */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Ketik NIM Anda:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 261011201412"
                      value={nimInput}
                      onChange={(e) => handleNimChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-indigo-500"
                    />
                  </div>

                  {/* Step B: Select Name from Roster */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Pilih Nama di Roster {selectedClass.code}:
                    </label>
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-indigo-500"
                    >
                      {filteredStudents.map((s, idx) => (
                        <option key={s.id} value={s.id}>
                          {idx + 1}. {s.name} (NIM: {s.nim})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step C: Role Claim & Optional Master Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Ajukan Jabatan / Role:
                      </label>
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                      >
                        <option value="role_anggota">Anggota Kelas</option>
                        <option value="role_sekretaris">Sekretaris Kelas</option>
                        <option value="role_bendahara">Bendahara Kelas</option>
                        <option value="role_pj">PJ Mata Kuliah</option>
                        <option value="role_ketua">Ketua Kelas</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Jabatan pengurus akan diverifikasi oleh Super Admin.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Kode Pro (Opsional):
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 01SAKP014PRO"
                        value={proCodeInput}
                        onChange={(e) => setProCodeInput(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedClass(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    >
                      <span>Masuk ke Kelas Sekarang</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Class Editor Modal (Super Admin ONLY) */}
      {showClassEditor && editingClass && isUserSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                {isCreatingNewClass ? 'Tambah Kelas Baru' : `Edit Kelas: ${editingClass.code}`}
              </h3>
              <button
                onClick={() => setShowClassEditor(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="Contoh: Kelas 01 SAKP 14"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Kode Kelas</label>
                  <input
                    type="text"
                    required
                    value={editingClass.code}
                    onChange={(e) => setEditingClass({ ...editingClass, code: e.target.value })}
                    placeholder="01SAKP014"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Kapasitas Mahasiswa</label>
                  <input
                    type="number"
                    value={editingClass.studentCount}
                    onChange={(e) => setEditingClass({ ...editingClass, studentCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Program Studi</label>
                  <input
                    type="text"
                    value={editingClass.major}
                    onChange={(e) => setEditingClass({ ...editingClass, major: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fakultas</label>
                  <input
                    type="text"
                    value={editingClass.faculty}
                    onChange={(e) => setEditingClass({ ...editingClass, faculty: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Semester</label>
                  <input
                    type="text"
                    value={editingClass.semester}
                    onChange={(e) => setEditingClass({ ...editingClass, semester: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tahun Akademik</label>
                  <input
                    type="text"
                    value={editingClass.academicYear}
                    onChange={(e) => setEditingClass({ ...editingClass, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Dosen Wali / Pembimbing</label>
                <input
                  type="text"
                  value={editingClass.advisor}
                  onChange={(e) => setEditingClass({ ...editingClass, advisor: e.target.value })}
                  placeholder="Dr. H. Rahman, M.Si., Ak., CA"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassEditor(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simplified Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 space-y-1 pb-2">
        <p>© 2026 Kelas Manager • Tata Kelola & Kolaborasi Perkuliahan</p>
      </footer>
    </div>
  );
};
