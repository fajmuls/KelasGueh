import { showToast, showConfirm } from "../UI/DoodleDialog.tsx";
import React, { useState, useEffect } from 'react';
import {
  KasMember,
  ClassSettings,
  ClassDefinition,
  ClassMembershipRequest,
  UserRole
} from '../../types/kas.ts';
import {
  AuditLogEntry,
  LocalKasRepository,
  generateUUID,
  DEFAULT_CLASS_DEF
} from '../../services/supabaseClient.ts';
import {
  updateUserLinkedMember,
  autoDetectGenderByName
} from '../../utils/userManagement.ts';
import { saveNewPin } from '../../utils/security.ts';
import { DoodleCurrencyInput } from '../UI/DoodleCurrencyInput.tsx';
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
  Upload,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Database,
  Download,
  UploadCloud,
  GraduationCap,
  PlusCircle,
  ArrowRightLeft,
  Clock,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Archive,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import {
  exportClassToExcelWorkbook,
  SPREADSHEET_TAB_DESCRIPTIONS
} from '../../services/excelExport.ts';
import { SupabaseAuthGuideModal } from './SupabaseAuthGuideModal.tsx';

interface AdminSettingsViewProps {
  members: KasMember[];
  settings: ClassSettings;
  onUpdateMembers: (members: KasMember[]) => void;
  onReturnToHub: () => void;
  onSaveSettings?: (settings: ClassSettings) => Promise<void> | void;
  activeClass?: ClassDefinition;
  availableClasses?: ClassDefinition[];
  onSwitchClass?: (classId: string) => Promise<void> | void;
  onCreateClass?: (input: { code: string; name: string; academicYear: string }) => Promise<void>;
  onUpdateClass?: (classId: string, updates: Partial<ClassDefinition>) => Promise<void>;
  onSyncNow?: () => Promise<void>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  members,
  settings,
  onUpdateMembers,
  onReturnToHub,
  onSaveSettings,
  activeClass,
  availableClasses,
  onSwitchClass,
  onCreateClass,
  onUpdateClass,
  onSyncNow
}) => {
  const [activeTab, setActiveTab] = useState<
    'classes' | 'sheets' | 'whitelist' | 'students' | 'audit' | 'backup' | 'pin' | 'cache' | 'version'
  >('classes');

  // Multi-class & Pending Join Requests state
  const [registryClasses, setRegistryClasses] = useState<ClassDefinition[]>(() =>
    availableClasses && availableClasses.length > 0 ? availableClasses : [DEFAULT_CLASS_DEF]
  );
  const [classMemberships, setClassMemberships] = useState<ClassMembershipRequest[]>([]);
  const [pendingRoleSelections, setPendingRoleSelections] = useState<Record<string, UserRole>>({});
  const [pendingMemberLinks, setPendingMemberLinks] = useState<Record<string, string>>({});
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassAcademicYear, setNewClassAcademicYear] = useState(
    settings.academicYear || 'Semester Ganjil 2026/2027'
  );
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isRefreshingRegistry, setIsRefreshingRegistry] = useState(false);

  // Edit existing class state
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassCode, setEditClassCode] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editClassAcademicYear, setEditClassAcademicYear] = useState('');
  const [editClassSemesterOrder, setEditClassSemesterOrder] = useState<number>(1);
  const [editClassArchived, setEditClassArchived] = useState(false);
  const [isSavingClassEdit, setIsSavingClassEdit] = useState(false);

  // Manual Spreadsheet (.xlsx) Export & Supabase Auth Guide Modal state
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [lastXlsxExportInfo, setLastXlsxExportInfo] = useState<{ filename: string; exportedAt: string } | null>(null);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);

  // Whitelist state
  const [users, setUsers] = useState<any[]>([]);
  const [whitelistSearchInput, setWhitelistSearchInput] = useState('');
  const [selectedStudentForWhitelist, setSelectedStudentForWhitelist] = useState<KasMember | null>(null);
  const [whitelistRole, setWhitelistRole] = useState<'bendahara' | 'sekretaris' | 'anggota'>('bendahara');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Backup states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState<any | null>(null);
  const [backupFileName, setBackupFileName] = useState('');

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
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Student list state
  const [memberList, setMemberList] = useState<KasMember[]>(members);

  // Security PIN & Threshold state
  const [requireTransactionPin, setRequireTransactionPin] = useState<boolean>(
    settings.requireTransactionPin !== false
  );
  const [transactionPinThreshold, setTransactionPinThreshold] = useState<number>(
    settings.transactionPinThreshold ?? 500000
  );
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [isSavingPinPolicy, setIsSavingPinPolicy] = useState(false);

  // Cache reset state
  const [cacheMsg, setCacheMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [activeClass?.id]);

  useEffect(() => {
    setMemberList(members);
  }, [members]);

  useEffect(() => {
    setRequireTransactionPin(settings.requireTransactionPin !== false);
    setTransactionPinThreshold(settings.transactionPinThreshold ?? 500000);
  }, [settings.requireTransactionPin, settings.transactionPinThreshold]);

  useEffect(() => {
    if (availableClasses && availableClasses.length > 0) {
      setRegistryClasses(availableClasses);
    }
  }, [availableClasses]);

  const loadData = async () => {
    setIsRefreshingRegistry(true);
    try {
      const [list, logs, reg] = await Promise.all([
        LocalKasRepository.getWhitelist(),
        LocalKasRepository.fetchAuditLogsFromSupabase(),
        LocalKasRepository.fetchClassRegistry()
      ]);
      setUsers(list);
      setAuditLogs(logs);
      setRegistryClasses(reg.classes);
      setClassMemberships(reg.memberships);
    } finally {
      setIsRefreshingRegistry(false);
    }
  };

  const pendingMemberships = classMemberships.filter(m => m.status === 'pending');
  const processedMemberships = classMemberships.filter(m => m.status !== 'pending');
  const currentActiveClassId = activeClass?.id || LocalKasRepository.getActiveClassId();

  const handleApproveJoinRequest = async (req: ClassMembershipRequest) => {
    const chosenRole = pendingRoleSelections[req.id] || 'anggota';
    const linkedMemberId = pendingMemberLinks[req.id] || '';
    const linkedMember = memberList.find(m => m.id === linkedMemberId);

    sfx.playPaymentConfirmed();
    await LocalKasRepository.approveClassJoinRequest(
      req.id,
      chosenRole,
      'Super Admin',
      linkedMember?.id,
      linkedMember?.name
    );
    showToast(
      `Pengajuan "${req.fullName}" disetujui masuk ke kelas ${req.className} sebagai ${chosenRole.toUpperCase()}!`,
      'success'
    );
    await loadData();
  };

  const handleRejectJoinRequest = async (req: ClassMembershipRequest) => {
    const ok = await showConfirm({
      title: 'Tolak Pengajuan Kelas',
      message: `Tolak permintaan "${req.fullName}" (${req.email}) untuk masuk kelas ${req.className}?`,
      confirmLabel: 'Ya, Tolak',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (!ok) return;
    sfx.playDeleteConfirm();
    await LocalKasRepository.rejectClassJoinRequest(req.id, 'Super Admin');
    showToast(`Pengajuan "${req.fullName}" telah ditolak.`, 'info');
    await loadData();
  };

  const handleCreateNewClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassCode.trim()) {
      showToast('Masukkan kode kelas terlebih dahulu (contoh: 01 SAKP 015).', 'error');
      return;
    }

    setIsCreatingClass(true);
    try {
      const payload = {
        code: newClassCode.trim().toUpperCase(),
        name: newClassName.trim() || newClassCode.trim().toUpperCase(),
        academicYear: newClassAcademicYear.trim() || 'Semester Ganjil 2026/2027'
      };
      if (onCreateClass) {
        await onCreateClass(payload);
      } else {
        await LocalKasRepository.createNewClass({ ...payload, createdBy: 'Super Admin' });
      }
      sfx.playCoinChime();
      showToast(`Kelas baru "${payload.code}" berhasil dibuat dengan database terisolasi!`, 'success');
      setNewClassCode('');
      setNewClassName('');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Gagal membuat kelas baru.', 'error');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleStartEditClass = (cls: ClassDefinition) => {
    sfx.playClick();
    setEditingClassId(cls.id);
    setEditClassCode(cls.code);
    setEditClassName(cls.name);
    setEditClassAcademicYear(cls.academicYear);
    setEditClassSemesterOrder(cls.semesterOrder ?? 1);
    setEditClassArchived(Boolean(cls.isArchived));
  };

  const handleSaveClassEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassId || !editClassCode.trim()) return;
    setIsSavingClassEdit(true);
    try {
      const updates: Partial<ClassDefinition> = {
        code: editClassCode.trim().toUpperCase(),
        name: editClassName.trim() || editClassCode.trim().toUpperCase(),
        academicYear: editClassAcademicYear.trim() || 'Semester Ganjil 2026/2027',
        semesterOrder: Math.max(1, Number(editClassSemesterOrder) || 1),
        isArchived: editClassArchived
      };
      if (onUpdateClass) {
        await onUpdateClass(editingClassId, updates);
      } else {
        await LocalKasRepository.updateClassDefinition(editingClassId, updates);
      }
      sfx.playPaymentConfirmed();
      showToast(`Informasi kelas "${updates.code}" berhasil diperbarui!`, 'success');
      setEditingClassId(null);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Gagal memperbarui kelas.', 'error');
    } finally {
      setIsSavingClassEdit(false);
    }
  };

  const handleExportMultiSheetExcel = async () => {
    const targetCls = registryClasses.find(c => c.id === currentActiveClassId) || activeClass || DEFAULT_CLASS_DEF;
    const cid = targetCls.id;

    setIsExportingXlsx(true);
    try {
      const result = exportClassToExcelWorkbook({
        classDef: targetCls,
        settings,
        members: memberList,
        transactions: LocalKasRepository.getTransactions(cid),
        kolektifBills: LocalKasRepository.getKolektifBills(cid),
        pointLogs: LocalKasRepository.getPointLogs(cid),
        attendanceRecords: LocalKasRepository.getAttendanceRecords(cid),
        meetingMinutes: LocalKasRepository.getMeetingMinutes(cid),
        courseSchedules: LocalKasRepository.getCourseSchedules(cid),
        savedGroups: LocalKasRepository.getSavedGroups(cid),
        auditLogs
      });

      setLastXlsxExportInfo({
        filename: result.filename,
        exportedAt: new Date().toISOString()
      });

      await LocalKasRepository.addAuditLog({
        action: 'EXPORT_SPREADSHEET_XLSX',
        performedBy: 'Super Admin',
        userRole: 'super_admin',
        details: `Mengekspor Spreadsheet Rapi (.xlsx) 8 tab untuk kelas ${targetCls.code}: ${result.filename}`
      });

      sfx.playCoinChime();
      showToast(`Spreadsheet Rapi (${result.tabNames.length} tab) berhasil diunduh: ${result.filename}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengekspor Spreadsheet (.xlsx).', 'error');
    } finally {
      setIsExportingXlsx(false);
    }
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
    if (selectedStudentForWhitelist) {
      updateUserLinkedMember(emailToAdd, selectedStudentForWhitelist.id, selectedStudentForWhitelist.name);
    }
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

  const handleLinkStudentToUser = async (email: string, memberId: string) => {
    sfx.playOptionSelect();
    const targetMember = memberList.find(m => m.id === memberId);
    if (targetMember) {
      updateUserLinkedMember(email, targetMember.id, targetMember.name);
      showToast(`Akun ${email} berhasil dihubungkan sebagai "${toTitleCase(targetMember.name)}" (NIM: ${targetMember.studentId || '-'})!`, 'success');
    } else {
      updateUserLinkedMember(email, undefined, undefined);
      showToast(`Tautan siswa untuk akun ${email} dilepas.`, 'info');
    }
    await loadData();
  };

  const handleExportFullBackup = async () => {
    try {
      setIsExporting(true);
      sfx.playPaymentConfirmed();
      const backup = await LocalKasRepository.exportFullBackupJSON('Super Admin', 'superadmin');
      showToast(`File cadangan JSON (${backup.transactions.length} transaksi, ${backup.members.length} siswa) berhasil diekspor!`, 'success');
    } catch (err: any) {
      showToast(`Gagal mengekspor data: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setBackupFileContent(json);
        sfx.playOptionSelect();
        showToast(`File cadangan "${file.name}" siap dipulihkan (${json.transactions?.length || 0} transaksi, ${json.members?.length || 0} siswa).`, 'info');
      } catch {
        showToast('File tidak valid atau rusak (bukan format JSON yang benar).', 'error');
        setBackupFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImportFullBackup = async () => {
    if (!backupFileContent) return;
    const ok = await showConfirm({
      title: 'Konfirmasi Impor & Pulihkan Data',
      message: `PERINGATAN: Tindakan ini akan menimpa database dengan data dari file cadangan (${backupFileContent.transactions?.length || 0} transaksi, ${backupFileContent.members?.length || 0} siswa). Tindakan ini akan dicatat ke Audit Log sehingga dapat di-undo. Lanjutkan?`,
      confirmLabel: 'Ya, Pulihkan Database',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (!ok) return;

    try {
      setIsImporting(true);
      sfx.playPaymentConfirmed();
      const res = await LocalKasRepository.importFullBackupJSON(backupFileContent, 'Super Admin', 'superadmin');
      if (backupFileContent.members) {
        setMemberList(backupFileContent.members);
        onUpdateMembers(backupFileContent.members);
      }
      await loadData();
      showToast(res.message, 'success');
      setBackupFileContent(null);
      setBackupFileName('');
    } catch (err: any) {
      showToast(`Gagal memulihkan database: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
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
    setSelectedLogIds([]);
    showToast("Semua riwayat audit log telah dibersihkan.", "info");
  };

  const performUndoAction = async (log: AuditLogEntry) => {
    const actionUpper = log.action.toUpperCase();
    if (actionUpper.includes("PEMASUKAN") || actionUpper.includes("PENGELUARAN") || actionUpper.includes("TRANSAKSI")) {
      const txs = await LocalKasRepository.getTransactions();
      const match = txs.find(t => (t.title && log.details.includes(t.title)) || (t.id && log.details.includes(t.id)));
      if (match) {
        await LocalKasRepository.deleteTransaction(match.id);
      }
    } else if (actionUpper.includes("IURAN") || actionUpper.includes("KAS MINGGUAN")) {
      const weekMatch = log.details.match(/Minggu\s*(\d+)/i);
      if (weekMatch) {
        const weekNum = parseInt(weekMatch[1], 10);
        const memberMatch = memberList.find(m => log.details.toLowerCase().includes(m.name.toLowerCase()));
        if (memberMatch) {
          const updatedWeekly = { ...memberMatch.weeklyStatus, [weekNum]: false };
          await handleUpdateStudent(memberMatch.id, { weeklyStatus: updatedWeekly });
        }
      }
    } else if (actionUpper.includes("TAMBAH ANGGOTA") || actionUpper.includes("TAMBAH SISWA")) {
      const memberMatch = memberList.find(m => log.details.toLowerCase().includes(m.name.toLowerCase()));
      if (memberMatch) {
        await handleDeleteStudent(memberMatch.id, memberMatch.name);
      }
    }
    await LocalKasRepository.deleteAuditLog(log.id);
  };

  const handleUndoSingleLog = async (log: AuditLogEntry) => {
    const ok = await showConfirm({
      title: "Undo Aksi Audit Log",
      message: `Apakah Anda yakin ingin membatalkan/meng-undo aksi "${log.action}" (${log.details})?`,
      confirmLabel: "Ya, Undo Aksi",
      cancelLabel: "Batal"
    });
    if (!ok) return;

    sfx.playPaperRustle();
    await performUndoAction(log);
    setAuditLogs(prev => prev.filter(l => l.id !== log.id));
    setSelectedLogIds(prev => prev.filter(id => id !== log.id));
    showToast(`Aksi "${log.action}" telah berhasil di-undo!`, "success");
  };

  const handleBulkUndo = async (logIds: string[]) => {
    const ok = await showConfirm({
      title: "Undo Massal Audit Log",
      message: `Apakah Anda yakin ingin meng-undo ${logIds.length} aksi audit log yang dipilih sekaligus?`,
      confirmLabel: `Undo ${logIds.length} Aksi`,
      cancelLabel: "Batal"
    });
    if (!ok) return;

    sfx.playPaperRustle();
    const selectedLogs = auditLogs.filter(l => logIds.includes(l.id));
    for (const log of selectedLogs) {
      await performUndoAction(log);
    }
    setAuditLogs(prev => prev.filter(l => !logIds.includes(l.id)));
    setSelectedLogIds([]);
    showToast(`Berhasil meng-undo ${selectedLogs.length} aksi audit log!`, "success");
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

  // Security PIN & Threshold
  const persistPinSettings = async (updates: Partial<ClassSettings>, successText: string) => {
    setIsSavingPinPolicy(true);
    try {
      const nextSettings: ClassSettings = {
        ...settings,
        requireTransactionPin,
        transactionPinThreshold,
        ...updates
      };
      if (onSaveSettings) {
        await onSaveSettings(nextSettings);
      } else {
        await LocalKasRepository.saveSettings(nextSettings);
      }
      setPinSuccessMsg(successText);
      showToast(successText, 'success');
      setTimeout(() => setPinSuccessMsg(''), 3500);
    } finally {
      setIsSavingPinPolicy(false);
    }
  };

  const handleSavePinPolicyOnly = async () => {
    sfx.playPaymentConfirmed();
    await persistPinSettings(
      {
        requireTransactionPin,
        transactionPinThreshold: Math.max(0, Number(transactionPinThreshold) || 0)
      },
      requireTransactionPin
        ? `Verifikasi PIN transaksi besar AKTIF (batas nominal Rp ${(transactionPinThreshold || 0).toLocaleString('id-ID')}).`
        : 'Verifikasi PIN transaksi besar DINONAKTIFKAN untuk kelas ini.'
    );
  };

  const handleSavePin = async () => {
    if (!/^\d{6}$/.test(newPin)) {
      sfx.playWarning();
      showToast('PIN transaksi wajib tepat 6 digit angka!', 'error');
      return;
    }
    sfx.playPaymentConfirmed();
    const pinHash = saveNewPin(newPin);
    setNewPin('');
    await persistPinSettings(
      {
        requireTransactionPin,
        transactionPinThreshold,
        pinHash
      },
      'PIN Keamanan 6-digit berhasil diperbarui & disinkronkan ke cloud!'
    );
  };

  // Cache Clear Action
  const handleClearLocalCache = async () => {
    const ok = await showConfirm({
      title: 'Bersihkan Cache Perangkat',
      message: 'Apakah Anda yakin ingin membersihkan cache & penyimpanan lokal di perangkat ini? Data utama di Supabase tetap aman dan dapat diunduh ulang.',
      confirmLabel: 'Ya, Bersihkan Cache',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (!ok) return;

    sfx.playDeleteConfirm();
    localStorage.removeItem('kelasgue_transactions_v3');
    localStorage.removeItem('kelasgue_members_v3');
    localStorage.removeItem('kelasgue_kolektif_bills_v1');
    setCacheMsg('Cache lokal berhasil dibersihkan! Silakan sinkron ulang atau muat ulang halaman.');
    showToast('Cache perangkat berhasil dibersihkan.', 'info');
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
          <div className="px-3 py-1 bg-white text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] font-mono">
            {activeClass?.code || settings.classCode || settings.className}
          </div>
          <div className="px-3 py-1 bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000]">
            SUPER ADMIN
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 p-2 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#000] overflow-x-auto no-scrollbar">
        {[
          { id: 'classes', label: 'Kelas & Konfirmasi', icon: GraduationCap, badge: pendingMemberships.length },
          { id: 'sheets', label: 'Spreadsheet (.xlsx)', icon: FileSpreadsheet, badge: 0 },
          { id: 'whitelist', label: 'Whitelist Roll', icon: UserCheck, badge: 0 },
          { id: 'students', label: 'Manajemen Siswa', icon: UserPlus, badge: 0 },
          { id: 'audit', label: 'Laporan Audit Log', icon: FileSpreadsheet, badge: 0 },
          { id: 'backup', label: 'Cadangan Data JSON', icon: Database, badge: 0 },
          { id: 'pin', label: 'PIN Keamanan', icon: Lock, badge: 0 },
          { id: 'cache', label: 'Reset Cache Lokal', icon: Trash2, badge: 0 },
          { id: 'version', label: 'Versi & Catatan', icon: Sparkles, badge: 0 }
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
              {t.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-500 text-white border border-slate-900 tabular-nums">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-white border-3 border-slate-900 rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_#000] space-y-6">
        {/* SUB-TAB 0: KELAS & KONFIRMASI ANGGOTA BARU */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-slate-900 text-xs text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <strong className="font-black text-amber-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-600" /> Pusat Multi-Kelas & Persetujuan Anggota Baru
                </strong>
                <p>
                  Kelas default <strong>01 SAKP 014</strong> menyimpan seluruh data SQL Anda. Tambah kelas baru, berpindah kelas, atau setujui permintaan pengguna baru untuk masuk ke kelas tertentu.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setShowSupabaseGuide(true);
                  }}
                  className="btn-doodle px-3 py-2 bg-sky-200 hover:bg-sky-300 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Panduan Login Preview Supabase</span>
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isRefreshingRegistry}
                  className="btn-doodle px-3 py-2 bg-white text-slate-900 font-black text-xs rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRegistry ? 'animate-spin' : ''}`} />
                  <span>Segarkan Daftar</span>
                </button>
              </div>
            </div>

            {/* Queue Permintaan Masuk Kelas */}
            <div className="space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Permintaan Masuk Kelas Menunggu Konfirmasi ({pendingMemberships.length})</span>
              </h4>

              {pendingMemberships.length === 0 ? (
                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-xs text-slate-500 text-center">
                  Tidak ada permintaan masuk kelas yang sedang menunggu konfirmasi.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {pendingMemberships.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-amber-50/70 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000] flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{req.fullName}</span>
                          <span className="px-2 py-0.5 text-[10px] font-black bg-amber-300 text-slate-950 rounded border border-slate-900">
                            Tujuan: {req.className}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-600">
                          Email: {req.email} · NIM/Absen: {req.nim || '-'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={pendingRoleSelections[req.id] || 'anggota'}
                          onChange={(e) =>
                            setPendingRoleSelections(prev => ({ ...prev, [req.id]: e.target.value as UserRole }))
                          }
                          className="px-2.5 py-1.5 border-2 border-slate-900 rounded-lg bg-white text-xs font-bold"
                        >
                          <option value="anggota">Role: Anggota</option>
                          <option value="bendahara">Role: Bendahara</option>
                          <option value="sekretaris">Role: Sekretaris</option>
                        </select>

                        {req.classId === currentActiveClassId && memberList.length > 0 && (
                          <select
                            value={pendingMemberLinks[req.id] || ''}
                            onChange={(e) =>
                              setPendingMemberLinks(prev => ({ ...prev, [req.id]: e.target.value }))
                            }
                            className="px-2.5 py-1.5 border-2 border-slate-900 rounded-lg bg-white text-xs font-bold max-w-[180px]"
                          >
                            <option value="">-- Tautkan Siswa (Opsional) --</option>
                            {memberList.map((m, idx) => (
                              <option key={m.id} value={m.id}>
                                {idx + 1}. {toTitleCase(m.name)}
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleApproveJoinRequest(req)}
                          className="btn-doodle px-3 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Setujui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectJoinRequest(req)}
                          className="btn-doodle px-3 py-1.5 bg-rose-200 hover:bg-rose-300 text-rose-950 font-bold text-xs rounded-lg flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daftar Kelas & Pindah Kelas + Tambah Kelas Baru */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t-2 border-slate-200">
              {/* Daftar Kelas */}
              <div className="space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-sky-600" />
                  <span>Daftar Kelas Terdaftar ({registryClasses.length})</span>
                </h4>
                <div className="space-y-2.5">
                  {registryClasses.map((cls) => {
                    const isCurrent = cls.id === currentActiveClassId;
                    const isEditingThis = editingClassId === cls.id;
                    return (
                      <div
                        key={cls.id}
                        className={`p-3.5 rounded-xl border-2 border-slate-900 space-y-3 ${
                          isCurrent ? 'bg-amber-100 shadow-[3px_3px_0px_#000]' : 'bg-white shadow-[2px_2px_0px_#000]'
                        }`}
                      >
                        {isEditingThis ? (
                          <form onSubmit={handleSaveClassEdit} className="space-y-2.5">
                            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                              <span className="text-[11px] font-black uppercase text-slate-800">
                                Edit Kelas: {cls.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingClassId(null)}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kode Kelas</label>
                                <input
                                  required
                                  type="text"
                                  value={editClassCode}
                                  onChange={(e) => setEditClassCode(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-bold bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Urutan Semester</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editClassSemesterOrder}
                                  onChange={(e) => setEditClassSemesterOrder(Number(e.target.value) || 1)}
                                  className="w-full px-2.5 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-mono font-bold bg-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Tampilan Kelas</label>
                              <input
                                type="text"
                                value={editClassName}
                                onChange={(e) => setEditClassName(e.target.value)}
                                className="w-full px-2.5 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-semibold bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tahun Akademik / Semester</label>
                              <input
                                type="text"
                                value={editClassAcademicYear}
                                onChange={(e) => setEditClassAcademicYear(e.target.value)}
                                className="w-full px-2.5 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-medium bg-white"
                              />
                            </div>
                            <label className="flex items-center gap-2 p-2 bg-white border border-slate-400 rounded-lg cursor-pointer text-xs font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={editClassArchived}
                                onChange={(e) => setEditClassArchived(e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-slate-900 accent-amber-500"
                              />
                              <Archive className="w-3.5 h-3.5 text-slate-600" />
                              <span>Tandai sebagai Semester Lama (Arsip / Kenangan)</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={isSavingClassEdit}
                                className="flex-1 btn-doodle py-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isSavingClassEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingClassId(null)}
                                className="btn-doodle px-3 py-1.5 bg-white text-slate-800 font-bold text-xs rounded-lg"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-sm text-slate-900">{cls.code}</span>
                                {cls.isDefault && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-sky-200 border border-slate-900 rounded text-slate-950">
                                    Default SQL
                                  </span>
                                )}
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border border-slate-900 rounded ${
                                  cls.isArchived ? 'bg-slate-200 text-slate-700' : 'bg-emerald-200 text-emerald-950'
                                }`}>
                                  {cls.isArchived ? 'Arsip Semester' : 'Aktif'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 truncate">
                                {cls.name} · {cls.academicYear}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditClass(cls)}
                                className="p-1.5 bg-white hover:bg-amber-200 text-slate-800 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#000]"
                                title="Edit nama/semester/status arsip kelas"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {isCurrent ? (
                                <span className="px-3 py-1 bg-emerald-300 text-slate-950 font-black text-[11px] rounded-lg border-2 border-slate-900">
                                  Sedang Aktif
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSwitchClass?.(cls.id)}
                                  className="btn-doodle px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg"
                                >
                                  Pindah ke Kelas Ini
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Tambah Kelas Baru */}
              <form
                onSubmit={handleCreateNewClassSubmit}
                className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000] space-y-3 h-fit"
              >
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Buat Kelas Baru (Database Terpisah)</span>
                </h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Setiap kelas baru memiliki penyimpanan snapshot sendiri di Supabase Storage tanpa mengubah struktur tabel SQL utama.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Kelas *</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: 01 SAKP 015"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Tampilan Kelas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kelas 01 SAKP 015 - Pagi"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tahun Akademik / Semester</label>
                  <input
                    type="text"
                    value={newClassAcademicYear}
                    onChange={(e) => setNewClassAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl text-xs font-medium bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingClass}
                  className="w-full btn-doodle py-2.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isCreatingClass ? 'Membuat Kelas...' : '+ Tambah Kelas Baru'}</span>
                </button>
              </form>
            </div>

            {processedMemberships.length > 0 && (
              <div className="pt-2 border-t-2 border-slate-200 space-y-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-600">
                  Riwayat Anggota Terkonfirmasi ({processedMemberships.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {processedMemberships.slice(0, 12).map((m) => (
                    <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[11px] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{m.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{m.className} · {m.assignedRole}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${
                            m.status === 'approved'
                              ? 'bg-emerald-200 text-emerald-950 border-emerald-600'
                              : 'bg-rose-200 text-rose-950 border-rose-600'
                          }`}
                        >
                          {m.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </span>
                        {m.autoMatched && (
                          <span className="px-1 py-0.2 text-[8px] font-black uppercase rounded bg-sky-200 text-sky-950 border border-sky-600">
                            Auto-Match
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 0B: EKSPOR MANUAL SPREADSHEET RAPI (.XLSX 8 TAB) */}
        {activeTab === 'sheets' && (
          <div className="space-y-5">
            <div className="bg-emerald-50 p-4 rounded-xl border-2 border-slate-900 text-xs text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <strong className="font-black text-emerald-950 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Dual Ekspor Manual: Spreadsheet Tabel Rapi (.xlsx) vs Cadangan (.json)
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Spreadsheet Rapi (.xlsx)</strong> menghasilkan 1 workbook Excel dengan <strong>8 tab catatan terstruktur</strong> untuk kelas{' '}
                  <strong>{activeClass?.code || settings.className}</strong> agar mudah dibaca atau diimpor manual ke Google Sheets. Untuk pemulihan sistem penuh, gunakan tab{' '}
                  <strong>Cadangan Data JSON</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playToggle();
                  setActiveTab('backup');
                }}
                className="btn-doodle px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Buka Cadangan .JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Unduh Spreadsheet .xlsx & Panduan Impor Manual ke Google Sheets */}
              <div className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#000] space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                    Unduh Workbook Excel (.xlsx) Kelas {activeClass?.code || settings.className}
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 text-[10px] font-black rounded border border-slate-900">
                    8 TAB RAPI
                  </span>
                </div>

                {lastXlsxExportInfo ? (
                  <div className="p-3 bg-emerald-50 border-2 border-slate-900 rounded-xl space-y-1">
                    <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Terakhir Diekspor: {lastXlsxExportInfo.filename}</span>
                    </p>
                    <p className="text-[11px] font-mono text-slate-600">
                      Waktu: {new Date(lastXlsxExportInfo.exportedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-xs text-slate-600">
                    Seluruh data (Buku Kas, Iuran Siswa, Tagihan Kolektif, Presensi &amp; Poin, Notulensi &amp; Jadwal, Kelompok Matkul, hingga Audit Log) otomatis dirapikan ke dalam 8 sheet siap pakai.
                  </div>
                )}

                <button
                  type="button"
                  disabled={isExportingXlsx}
                  onClick={handleExportMultiSheetExcel}
                  className="w-full btn-doodle py-2.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isExportingXlsx
                      ? 'Menyiapkan Workbook 8 Tab (.xlsx)...'
                      : 'Unduh Spreadsheet Rapi (.xlsx — 8 Tab)'}
                  </span>
                </button>

                <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-slate-900">
                      Cara Impor Manual ke Google Sheets:
                    </p>
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-doodle inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-900 font-black text-[11px] rounded-lg"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Google Sheets Baru</span>
                    </a>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-slate-700 space-y-1 leading-snug">
                    <li>Klik <strong>Unduh Spreadsheet Rapi (.xlsx — 8 Tab)</strong> di atas.</li>
                    <li>Klik <strong>Buka Google Sheets Baru</strong> (tanpa perlu hubungkan akun ke aplikasi).</li>
                    <li>Di Google Sheets pilih menu <strong>File &rarr; Impor &rarr; Upload</strong> dan pilih file <code className="font-mono">.xlsx</code> tadi &rarr; <strong>Ganti spreadsheet</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* 8 Tabs Schema Preview */}
              <div className="p-4 bg-amber-50/70 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000] space-y-2.5">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                  Struktur 8 Tab Catatan Rapi (.xlsx)
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {SPREADSHEET_TAB_DESCRIPTIONS.map((tab, idx) => (
                    <div
                      key={tab.name}
                      className="p-2.5 bg-white border border-slate-900 rounded-lg flex items-start gap-2.5 text-slate-900"
                    >
                      <span className="w-5 h-5 rounded bg-amber-200 border border-slate-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-black text-slate-950 truncate">{tab.name}</p>
                        <p className="text-[10px] text-slate-600 leading-snug">{tab.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 leading-snug pt-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>100% tanpa login Google Workspace — seluruh data tetap tersinkronisasi aman di Supabase.</span>
                </p>
              </div>
            </div>
          </div>
        )}
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
                    <th className="p-3">Siswa Terhubung (Absen & Nama)</th>
                    <th className="p-3">Role Status</th>
                    <th className="p-3 text-right">Aksi Ubah Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => {
                    const matchedMember = memberList.find(m => 
                      m.id === u.linkedMemberId ||
                      (m.email && m.email.toLowerCase() === u.email.toLowerCase()) ||
                      m.name.toLowerCase() === (u.linkedMemberName || u.name || '').toLowerCase()
                    );
                    return (
                      <tr key={u.email} className="hover:bg-amber-50/60">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{toTitleCase(u.name || matchedMember?.name || u.email.split('@')[0])}</p>
                          {matchedMember?.studentId && (
                            <p className="text-[10px] text-slate-500 font-mono font-semibold">🎓 NIM: {matchedMember.studentId}</p>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={matchedMember?.id || u.linkedMemberId || ''}
                            onChange={(e) => handleLinkStudentToUser(u.email, e.target.value)}
                            className="w-full max-w-[220px] px-2 py-1.5 border-2 border-slate-900 rounded-lg bg-white text-[11px] font-bold shadow-[1px_1px_0px_#000] cursor-pointer"
                          >
                            <option value="">-- Tetapkan Siswa --</option>
                            {memberList.map((m, idx) => (
                              <option key={m.id} value={m.id}>
                                No. {idx + 1} - {toTitleCase(m.name)} ({m.studentId || '-'})
                              </option>
                            ))}
                          </select>
                        </td>
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
                    );
                  })}
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

            {/* Bulk Undo Action Floating Bar */}
            {selectedLogIds.length > 0 && (
              <div className="p-3 bg-purple-100 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#000] flex items-center justify-between animate-in fade-in">
                <span className="text-xs font-black text-purple-950 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-700" />
                  <span>{selectedLogIds.length} Catatan Audit Terpilih untuk Di-Undo</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkUndo(selectedLogIds)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#000] flex items-center gap-1.5 active:translate-y-0.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo ({selectedLogIds.length}) Aksi Terpilih</span>
                  </button>
                  <button
                    onClick={() => setSelectedLogIds([])}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-900"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Audit Table */}
            <div className="border-2 border-slate-900 rounded-xl overflow-x-auto shadow-[2px_2px_0px_#000]">
              <div className="max-h-96 overflow-y-auto min-w-[720px]">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead className="bg-amber-100 border-b-2 border-slate-900 font-black text-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredLogs.length > 0 && filteredLogs.every(l => selectedLogIds.includes(l.id))}
                          onChange={() => {
                            const allSelected = filteredLogs.length > 0 && filteredLogs.every(l => selectedLogIds.includes(l.id));
                            if (allSelected) {
                              setSelectedLogIds([]);
                            } else {
                              setSelectedLogIds(filteredLogs.map(l => l.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-slate-900 accent-amber-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5">Waktu</th>
                      <th className="p-2.5">Aksi</th>
                      <th className="p-2.5">Oleh</th>
                      <th className="p-2.5">Rincian Detail</th>
                      <th className="p-2.5 text-center w-28">Aksi Reversal</th>
                      <th className="p-2.5 text-center w-12">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                          Tidak ada catatan audit yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isSelected = selectedLogIds.includes(log.id);
                        return (
                          <tr key={log.id} className={`hover:bg-amber-50/60 ${isSelected ? 'bg-amber-100/70' : ''}`}>
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedLogIds(prev =>
                                    prev.includes(log.id)
                                      ? prev.filter(id => id !== log.id)
                                      : [...prev, log.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-2 border-slate-900 accent-amber-500 cursor-pointer"
                              />
                            </td>
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
                                onClick={() => handleUndoSingleLog(log)}
                                className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] rounded-lg border border-purple-400 flex items-center gap-1 mx-auto shadow-[1px_1px_0px_#000] active:translate-y-0.5 transition"
                                title="Batalkan / Undo aksi ini"
                              >
                                <RotateCcw className="w-3 h-3 text-purple-700" />
                                <span>Undo</span>
                              </button>
                            </td>
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 4: CADANGAN DATA JSON (EKSPOR & IMPOR) */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-slate-900 text-xs text-slate-900 space-y-1">
              <strong className="font-black text-amber-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600" /> Pusat Cadangan & Pemulihan Data Terpadu (.JSON)
              </strong>
              <p>
                Seluruh data website (buku kas, iuran mingguan, manajemen anggota siswa, kelompok matkul, presensi, notulensi, dan pengaturan) dapat diekspor menjadi satu file cadangan JSON lengkap dan dipulihkan kembali oleh pengurus kelas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Ekspor Data */}
              <div className="p-5 bg-white rounded-xl border-3 border-slate-900 shadow-[3px_3px_0px_#000] flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-400 rounded-lg border-2 border-slate-900">
                      <Download className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Ekspor File Cadangan JSON</h4>
                      <p className="text-[11px] text-slate-500">Unduh snapshot lengkap database kelas saat ini</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 text-xs space-y-1.5 font-medium text-slate-700">
                    <p className="font-bold text-slate-900">Cakupan Data yang Diekspor:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      <li>Pengaturan Kelas & Tarif Iuran Bulanan Spesial</li>
                      <li>Buku Kas ({LocalKasRepository.getTransactions().length} Transaksi)</li>
                      <li>Daftar Siswa & Riwayat Pembayaran ({memberList.length} Siswa)</li>
                      <li>Kelompok & Tugas Matkul Tersimpan</li>
                      <li>Tagihan Kolektif & Poin Keaktifan Mahasiswa</li>
                      <li>Daftar Whitelist Role Pengurus & Audit Log</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleExportFullBackup}
                  disabled={isExporting}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Mengekspor Data...' : 'Unduh File Cadangan JSON (.json)'}</span>
                </button>
              </div>

              {/* Card 2: Impor Data */}
              <div className="p-5 bg-white rounded-xl border-3 border-slate-900 shadow-[3px_3px_0px_#000] flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-300 rounded-lg border-2 border-slate-900">
                      <UploadCloud className="w-5 h-5 text-purple-950" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Impor & Pulihkan Database</h4>
                      <p className="text-[11px] text-slate-500">Pulihkan seluruh data dari file JSON cadangan sebelumnya</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Pilih File Cadangan JSON:
                    </label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleBackupFileSelect}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-200 file:text-slate-900 hover:file:bg-amber-300 cursor-pointer p-1.5 border-2 border-slate-900 rounded-xl bg-white"
                    />
                  </div>

                  {backupFileContent && (
                    <div className="p-3 bg-purple-50 rounded-lg border-2 border-purple-300 text-xs space-y-1 animate-in fade-in">
                      <p className="font-black text-purple-950">✓ File Cadangan Terbaca:</p>
                      <p className="text-[11px] text-purple-900">Versi: <strong>{backupFileContent.version || 'v4.x'}</strong> • Pengekspor: <strong>{backupFileContent.exportedBy}</strong></p>
                      <p className="text-[11px] text-purple-800">
                        Memuat {backupFileContent.transactions?.length || 0} transaksi, {backupFileContent.members?.length || 0} siswa.
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-[10px] text-rose-900 font-medium">
                    ⚠️ Tindakan impor akan menggantikan data aktif dan otomatis dicatat ke dalam <strong>Audit Log</strong> sehingga dapat di-undo jika diperlukan.
                  </div>
                </div>

                <button
                  onClick={handleImportFullBackup}
                  disabled={!backupFileContent || isImporting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isImporting ? 'Memulihkan Database...' : 'Pulihkan Database Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: PIN KEAMANAN & BATAS TRANSAKSI */}
        {activeTab === 'pin' && (
          <div className="max-w-xl mx-auto space-y-5 py-2">
            <div className="bg-amber-50/70 p-5 rounded-xl border-3 border-slate-900 space-y-4 shadow-[3px_3px_0px_#000]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600" /> Kebijakan PIN Transaksi Besar
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Aktifkan atau nonaktifkan verifikasi PIN 6-digit ketika Bendahara mencatat transaksi dengan nominal besar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sfx.playToggle();
                    setRequireTransactionPin(prev => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 font-black text-xs flex items-center gap-1.5 shrink-0 transition shadow-[2px_2px_0px_#000] ${
                    requireTransactionPin
                      ? 'bg-emerald-300 text-slate-950'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {requireTransactionPin ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-900" />
                      <span>AKTIF</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-600" />
                      <span>NONAKTIF</span>
                    </>
                  )}
                </button>
              </div>

              {pinSuccessMsg && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg border-2 border-emerald-500">
                  {pinSuccessMsg}
                </div>
              )}

              <div className={`space-y-3 pt-2 border-t border-slate-300 transition-opacity ${requireTransactionPin ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block text-xs font-black uppercase text-slate-800">
                  Batas Nominal Minimal Wajib PIN:
                </label>
                <DoodleCurrencyInput
                  value={transactionPinThreshold}
                  onChange={(val) => setTransactionPinThreshold(Number(val) || 0)}
                  placeholder="500000"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[100000, 250000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        sfx.playOptionSelect();
                        setTransactionPinThreshold(preset);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border-2 border-slate-900 transition ${
                        transactionPinThreshold === preset
                          ? 'bg-amber-300 text-slate-950 shadow-[1px_1px_0px_#000]'
                          : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Rp {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isSavingPinPolicy}
                onClick={handleSavePinPolicyOnly}
                className="w-full btn-doodle py-2.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl disabled:opacity-50"
              >
                {isSavingPinPolicy ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Saklar & Batas PIN'}
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border-3 border-slate-900 space-y-3 shadow-[3px_3px_0px_#000]">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" /> Ubah PIN Otorisasi (6 Digit)
              </h4>
              <p className="text-xs text-slate-600">
                PIN ini digunakan bersama oleh pengelola kas kelas dan disinkronkan ke snapshot cloud. PIN default awal: <strong className="font-mono text-slate-900">123456</strong>.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">PIN Baru (Tepat 6 Angka)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Masukkan 6 digit angka"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-xl text-sm font-mono font-bold focus:outline-none bg-white"
                />
              </div>

              <button
                type="button"
                disabled={isSavingPinPolicy}
                onClick={handleSavePin}
                className="w-full btn-doodle py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl disabled:opacity-50"
              >
                Perbarui PIN 6-Digit & Sinkronkan
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

      <SupabaseAuthGuideModal
        isOpen={showSupabaseGuide}
        onClose={() => setShowSupabaseGuide(false)}
      />
    </div>
  );
};
