import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { WelcomeScreen } from './components/Doodle/WelcomeScreen.tsx';
import { DoodleNavbar, AppNavTab, AppDomain } from './components/Doodle/DoodleNavbar.tsx';
import { MainPortalHub } from './components/Doodle/MainPortalHub.tsx';
import { KasOverview } from './components/Doodle/KasOverview.tsx';
import { KasBook } from './components/Doodle/KasBook.tsx';
import { KasChecklist } from './components/Doodle/KasChecklist.tsx';
import { KolektifBillTab } from './components/Doodle/KolektifBillTab.tsx';
import { KasRecapView } from './components/Doodle/KasRecapView.tsx';
import { KasSettings } from './components/Doodle/KasSettings.tsx';
import { KasAuditLog } from './components/Doodle/KasAuditLog.tsx';
import { SecretaryHub } from './components/Doodle/Secretary/SecretaryHub.tsx';
import { PrintableBinderModal } from './components/Doodle/PrintableBinderModal.tsx';
import { WhatsAppShareModal } from './components/Doodle/WhatsAppShareModal.tsx';
import { ClassShareModal } from './components/Doodle/ClassShareModal.tsx';
import { SplitBillModal } from './components/Doodle/SplitBillModal.tsx';
import { AnimatedIntroScreen } from './components/Doodle/AnimatedIntroScreen.tsx';
import { DoodleWalkthrough } from './components/Doodle/DoodleWalkthrough.tsx';
import {
  LocalKasRepository,
  INITIAL_TRANSACTIONS,
  INITIAL_MEMBERS,
  DEFAULT_SETTINGS,
  subscribeToRealtimeKas
} from './services/supabaseClient.ts';
import {
  KasTransaction,
  KasMember,
  ClassSettings,
  KolektifBill,
  StudentPointLog,
  AttendanceRecord,
  MeetingMinute
} from './types/kas.ts';
import { CURRENT_APP_VERSION } from './version.ts';
import { sfx } from './utils/soundEffects.ts';
import { DoodleDialogContainer, showToast } from './components/UI/DoodleDialog.tsx';

// URL Routing helpers using HTML5 History API
const getRouteFromPath = (path: string): { domain: AppDomain; tab: AppNavTab } => {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/beranda' || clean === '/hub') {
    return { domain: 'hub', tab: 'beranda' };
  }
  if (clean === '/administrasi/ringkasan-kas') return { domain: 'bendahara', tab: 'ringkasan' };
  if (clean === '/administrasi/buku-kas') return { domain: 'bendahara', tab: 'bukukas' };
  if (clean === '/administrasi/ceklis-iuran') return { domain: 'bendahara', tab: 'checklist' };
  if (clean === '/administrasi/iuran-kolektif') return { domain: 'bendahara', tab: 'kolektif' };
  if (clean === '/administrasi/rekap-kas') return { domain: 'bendahara', tab: 'rekap' };
  if (clean === '/administrasi/pengaturan') return { domain: 'bendahara', tab: 'pengaturan' };
  if (clean === '/administrasi/audit-log') return { domain: 'bendahara', tab: 'auditlog' };

  if (clean === '/sekretaris/keaktifan') return { domain: 'sekretaris', tab: 'keaktifan' };
  if (clean === '/sekretaris/presensi') return { domain: 'sekretaris', tab: 'presensi' };
  if (clean === '/sekretaris/notulensi') return { domain: 'sekretaris', tab: 'notulensi' };

  if (clean.startsWith('/sekretaris')) return { domain: 'sekretaris', tab: 'keaktifan' };
  if (clean.startsWith('/administrasi')) return { domain: 'bendahara', tab: 'ringkasan' };
  return { domain: 'hub', tab: 'beranda' };
};

const getPathFromRoute = (domain: AppDomain, tab: AppNavTab): string => {
  if (domain === 'hub' || tab === 'beranda') return '/';
  if (domain === 'sekretaris') {
    if (tab === 'presensi') return '/sekretaris/presensi';
    if (tab === 'notulensi') return '/sekretaris/notulensi';
    return '/sekretaris/keaktifan';
  }
  // domain === 'bendahara'
  if (tab === 'bukukas') return '/administrasi/buku-kas';
  if (tab === 'checklist') return '/administrasi/ceklis-iuran';
  if (tab === 'kolektif') return '/administrasi/iuran-kolektif';
  if (tab === 'rekap') return '/administrasi/rekap-kas';
  if (tab === 'pengaturan') return '/administrasi/pengaturan';
  if (tab === 'auditlog') return '/administrasi/audit-log';
  return '/administrasi/ringkasan-kas';
};

const AppContent: React.FC = () => {
  const { user, role, isLoggedIn, canEditKas } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  // Initialize Route & Domain from browser URL
  const initialRoute = getRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [activeDomain, setActiveDomain] = useState<AppDomain>(initialRoute.domain);
  const [currentTab, setCurrentTab] = useState<AppNavTab>(initialRoute.tab);

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

  // Synchronized Navigation Handler with HTML5 history.pushState
  const navigateTo = (newDomain: AppDomain, newTab: AppNavTab) => {
    setActiveDomain(newDomain);
    setCurrentTab(newTab);
    const targetPath = getPathFromRoute(newDomain, newTab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ domain: newDomain, tab: newTab }, '', targetPath);
    }
  };

  const handleSelectTab = (tab: AppNavTab) => {
    let domain: AppDomain = activeDomain;
    if (['ringkasan', 'bukukas', 'checklist', 'kolektif', 'rekap', 'pengaturan', 'auditlog'].includes(tab)) {
      domain = 'bendahara';
    } else if (['keaktifan', 'presensi', 'notulensi'].includes(tab)) {
      domain = 'sekretaris';
    } else if (tab === 'beranda') {
      domain = 'hub';
    }
    navigateTo(domain, tab);
  };

  const handleSelectDomain = (domain: AppDomain, defaultTab?: AppNavTab) => {
    if (domain === 'hub') {
      navigateTo('hub', 'beranda');
    } else if (domain === 'sekretaris') {
      navigateTo('sekretaris', defaultTab || 'keaktifan');
    } else {
      navigateTo('bendahara', defaultTab || 'ringkasan');
    }
  };

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPath(window.location.pathname);
      setActiveDomain(route.domain);
      setCurrentTab(route.tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto trigger walkthrough on first visit after intro
  useEffect(() => {
    if (isLoggedIn && !showIntro) {
      const completed = localStorage.getItem('kelasgue_walkthrough_completed_v1');
      if (completed !== 'true') {
        const timer = setTimeout(() => setIsWalkthroughOpen(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, showIntro]);

  // Auto redirect from settings tab if user is read-only Anggota
  useEffect(() => {
    if (!canEditKas && (currentTab === 'pengaturan' || currentTab === 'auditlog')) {
      navigateTo('bendahara', 'ringkasan');
    }
  }, [canEditKas, currentTab]);

  // State: Financial Data
  const [transactions, setTransactions] = useState<KasTransaction[]>(() => LocalKasRepository.getTransactions());
  const [members, setMembers] = useState<KasMember[]>(() => LocalKasRepository.getMembers());
  const [settings, setSettings] = useState<ClassSettings>(() => LocalKasRepository.getSettings());
  const [auditLogs, setAuditLogs] = useState(() => LocalKasRepository.getAuditLogs());

  // State: Kolektif & Secretary Data
  const [kolektifBills, setKolektifBills] = useState<KolektifBill[]>(() => LocalKasRepository.getKolektifBills());
  const [pointLogs, setPointLogs] = useState<StudentPointLog[]>(() => LocalKasRepository.getPointLogs());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => LocalKasRepository.getAttendanceRecords());
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>(() => LocalKasRepository.getMeetingMinutes());

  // Fetch initial data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, ms, st, logs] = await Promise.all([
          LocalKasRepository.fetchTransactionsFromSupabase(),
          LocalKasRepository.fetchMembersFromSupabase(),
          LocalKasRepository.fetchSettingsFromSupabase(),
          LocalKasRepository.fetchAuditLogsFromSupabase()
        ]);
        setTransactions(txs);
        setMembers(ms);
        if (st) setSettings(st);
        setAuditLogs(logs);

        // Run self-healing integrity sanitize to ensure no orphan/duplicate linked transactions exist
        await handleSanitizeLinkedTransactions(txs, ms);
      } catch (err) {
        console.warn('Initial fetch error:', err);
      }
    };
    fetchData();
  }, []);

  // Supabase Realtime Broadcast subscription
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeKas(
      (payload) => {
        if (payload.eventType === 'INSERT') sfx.playNotification();
        LocalKasRepository.fetchTransactionsFromSupabase().then(setTransactions);
        LocalKasRepository.fetchAuditLogsFromSupabase().then(setAuditLogs);
      },
      (payload) => {
        if (payload.eventType === 'UPDATE') sfx.playNotification();
        LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
        LocalKasRepository.fetchAuditLogsFromSupabase().then(setAuditLogs);
      },
      (_payload) => {
        LocalKasRepository.fetchAuditLogsFromSupabase().then(setAuditLogs);
      },
      (_payload) => {
        LocalKasRepository.fetchSettingsFromSupabase().then(setSettings);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Autoplay BGM automatically on first user gesture
  useEffect(() => {
    let initialized = false;
    const handleFirstGesture = () => {
      if (initialized) return;
      const savedBgm = localStorage.getItem('kelasgue_bgm');
      if (!sfx.getIsBgmPlaying() && savedBgm !== 'false') {
        sfx.startBgm();
      }
      initialized = true;
      window.removeEventListener('mousedown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('mousedown', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('mousedown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // ---------------- INTEGRITY RECONCILIATION ROUTINE ----------------
  // Guarantees that if a member is not checked for a week, no money enters the cashbook
  const handleSanitizeLinkedTransactions = async (currentTxs?: KasTransaction[], currentMembers?: KasMember[]) => {
    const txList = currentTxs || transactions;
    const mList = currentMembers || members;
    let cleanedCount = 0;

    // Track seen linked tags to prevent duplicates
    const seenLinkedTags = new Set<string>();

    for (const tx of txList) {
      if (tx.notes?.startsWith('LINKED_IURAN:')) {
        const parts = tx.notes.split(':');
        if (parts.length >= 3) {
          const memberId = parts[1];
          const weekKey = parts[2];
          const member = mList.find(m => m.id === memberId);
          const isPaidInChecklist = !!member?.weeklyStatus?.[weekKey];

          // If member does not exist, or checklist is false, or tag is duplicate:
          if (!member || !isPaidInChecklist || seenLinkedTags.has(tx.notes)) {
            await LocalKasRepository.deleteTransaction(tx.id);
            cleanedCount++;
          } else {
            seenLinkedTags.add(tx.notes);
          }
        }
      }
    }

    if (cleanedCount > 0) {
      const freshTxs = await LocalKasRepository.fetchTransactionsFromSupabase();
      setTransactions(freshTxs);
      console.log(`[Kelas Gue Integrity] Dibersihkan ${cleanedCount} transaksi iuran duplikat/anomali.`);
    }
  };

  // ---------------- FINANCIAL TRANSACTION HANDLERS ----------------
  const handleAddTransaction = async (newTxData: Omit<KasTransaction, 'id' | 'createdAt'>) => {
    try {
      await LocalKasRepository.addTransaction(newTxData);
      await LocalKasRepository.addAuditLog({
        action: `CATAT ${newTxData.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}`,
        details: `${newTxData.title}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(newTxData.amount)}`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });
      const txs = await LocalKasRepository.fetchTransactionsFromSupabase();
      setTransactions(txs);
      const logs = await LocalKasRepository.fetchAuditLogsFromSupabase();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Add transaction handler error:', err);
      showToast('Gagal menyimpan transaksi ke database. Pastikan koneksi aktif.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string, skipLinkedSync: boolean = false) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (!skipLinkedSync && tx.notes?.startsWith('LINKED_IURAN:')) {
      const parts = tx.notes.split(':');
      if (parts.length >= 3) {
        const memberId = parts[1];
        const weekKey = parts[2];
        await LocalKasRepository.setMemberWeekStatus(memberId, weekKey, false);
        setMembers(prev => prev.map(m => {
          if (m.id === memberId) {
            return {
              ...m,
              weeklyStatus: { ...(m.weeklyStatus || {}), [weekKey]: false }
            };
          }
          return m;
        }));
      }
    }

    await LocalKasRepository.deleteTransaction(id);
    
    await LocalKasRepository.addAuditLog({
      action: 'HAPUS TRANSAKSI',
      details: `Menghapus ${tx.title} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tx.amount)})`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    
    LocalKasRepository.fetchTransactionsFromSupabase().then(setTransactions);
    LocalKasRepository.fetchAuditLogsFromSupabase().then(setAuditLogs);
  };

  // ---------------- CHECKLIST TOGGLE WITH MUTEX & IDEMPOTENT GUARDS ----------------
  const isTogglingRef = useRef(false);

  const handleToggleWeek = async (memberId: string, weekKey: string) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      const targetMember = members.find(m => m.id === memberId);
      if (!targetMember) return;

      const isNowPaid = !targetMember.weeklyStatus?.[weekKey];
      const linkedTag = `LINKED_IURAN:${memberId}:${weekKey}`;

      // Update state optimistically first for immediate UI responsiveness
      setMembers(prev => prev.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            weeklyStatus: { ...(m.weeklyStatus || {}), [weekKey]: isNowPaid }
          };
        }
        return m;
      }));

      // Update repository
      await LocalKasRepository.setMemberWeekStatus(memberId, weekKey, isNowPaid);

      if (isNowPaid) {
        // IDEMPOTENCY CHECK: Ensure not already in state
        const currentTxs = LocalKasRepository.getTransactions();
        const alreadyExists = currentTxs.some(t => t.notes === linkedTag);

        if (!alreadyExists) {
          const year = weekKey.split('_')[0];
          const month = weekKey.split('_')[1];
          const weekNum = weekKey.split('_W')[1];
          const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][parseInt(month) - 1];
          const weekLabel = `Mgg ${weekNum} ${monthName} ${year}`;

          // Check monthly dues override
          const monthKey = `${year}_${parseInt(month)}`;
          const duesAmount = settings.monthlyDuesOverrides?.[monthKey] !== undefined
            ? settings.monthlyDuesOverrides[monthKey]
            : settings.weeklyDuesAmount;

          const newTx: Omit<KasTransaction, 'id' | 'createdAt'> = {
            type: 'income',
            title: `Iuran: ${targetMember.name} (${weekLabel})`,
            amount: duesAmount,
            category: 'Iuran Kas',
            date: new Date().toISOString().split('T')[0],
            recordedBy: user?.name || 'Sistem',
            notes: linkedTag
          };
          await handleAddTransaction(newTx);
        }
      } else {
        // Delete all matching linked transactions for this student week
        const currentTxs = LocalKasRepository.getTransactions();
        const txsToDelete = currentTxs.filter(t => t.notes === linkedTag);
        for (const tx of txsToDelete) {
          await handleDeleteTransaction(tx.id, true);
        }
      }

      await LocalKasRepository.addAuditLog({
        action: 'IURAN MINGGUAN',
        details: `${isNowPaid ? 'Mencatat LUNAS' : 'Membatalkan Lunas'} Iuran ${weekKey} untuk ${targetMember.name}`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });

      // Refresh data
      const [freshTxs, freshMembers] = await Promise.all([
        LocalKasRepository.fetchTransactionsFromSupabase(),
        LocalKasRepository.fetchMembersFromSupabase()
      ]);
      setTransactions(freshTxs);
      setMembers(freshMembers);
    } finally {
      isTogglingRef.current = false;
    }
  };

  const handleToggleAllWeek = async (weekKey: string, shouldPay: boolean) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      // Optimistic update
      setMembers(prev => prev.map(m => ({
        ...m,
        weeklyStatus: { ...(m.weeklyStatus || {}), [weekKey]: shouldPay }
      })));

      await LocalKasRepository.toggleAllMembersWeek(weekKey, shouldPay);

      const year = weekKey.split('_')[0];
      const month = weekKey.split('_')[1];
      const weekNum = weekKey.split('_W')[1];
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][parseInt(month) - 1];
      const weekLabel = `Mgg ${weekNum} ${monthName} ${year}`;

      const monthKey = `${year}_${parseInt(month)}`;
      const duesAmount = settings.monthlyDuesOverrides?.[monthKey] !== undefined
        ? settings.monthlyDuesOverrides[monthKey]
        : settings.weeklyDuesAmount;

      const currentTxs = LocalKasRepository.getTransactions();

      if (shouldPay) {
        for (const m of members) {
          const linkedTag = `LINKED_IURAN:${m.id}:${weekKey}`;
          const alreadyExists = currentTxs.some(t => t.notes === linkedTag);

          if (!alreadyExists) {
            const newTx: Omit<KasTransaction, 'id' | 'createdAt'> = {
              type: 'income',
              title: `Iuran: ${m.name} (${weekLabel})`,
              amount: duesAmount,
              category: 'Iuran Kas',
              date: new Date().toISOString().split('T')[0],
              recordedBy: user?.name || 'Sistem',
              notes: linkedTag
            };
            await LocalKasRepository.addTransaction(newTx);
          }
        }
      } else {
        // Delete all linked transactions for this specific week
        const prefix = `LINKED_IURAN:`;
        const suffix = `:${weekKey}`;
        const txsToDelete = currentTxs.filter(t => t.notes?.startsWith(prefix) && t.notes?.endsWith(suffix));
        for (const tx of txsToDelete) {
          await LocalKasRepository.deleteTransaction(tx.id);
        }
      }

      LocalKasRepository.addAuditLog({
        action: 'IURAN MASSAL',
        details: `${shouldPay ? 'Mencatat LUNAS' : 'Membatalkan Lunas'} Seluruh Siswa untuk ${weekKey}`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });

      const [freshTxs, freshMembers] = await Promise.all([
        LocalKasRepository.fetchTransactionsFromSupabase(),
        LocalKasRepository.fetchMembersFromSupabase()
      ]);
      setTransactions(freshTxs);
      setMembers(freshMembers);
    } finally {
      isTogglingRef.current = false;
    }
  };

  // ---------------- MEMBERS & SETTINGS ----------------
  const handleAddMember = async (name: string, studentId: string, phone?: string) => {
    const newM = await LocalKasRepository.addMember(name, studentId, phone);
    LocalKasRepository.addAuditLog({
      action: 'TAMBAH ANGGOTA',
      details: `Menambahkan siswa baru: ${name} (NIM: ${studentId})`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setMembers(prev => [...prev, newM]);
    LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
  };

  const handleAddMembers = async (newMembersList: { name: string; studentId: string; phone?: string }[]) => {
    const created = await LocalKasRepository.addMembers(newMembersList);
    await LocalKasRepository.addAuditLog({
      action: 'IMPORT ANGGOTA',
      details: `Impor massal ${created.length} siswa baru`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setMembers(prev => [...prev, ...created]);
    LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<KasMember>) => {
    LocalKasRepository.updateMember(memberId, updates);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
    LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
  };

  const handleSaveSettings = async (newSettings: ClassSettings) => {
    await LocalKasRepository.saveSettings(newSettings);
    setSettings(newSettings);
    LocalKasRepository.fetchSettingsFromSupabase().then(setSettings);
  };

  const handleResetData = () => {
    LocalKasRepository.saveTransactions(INITIAL_TRANSACTIONS);
    LocalKasRepository.saveMembers(INITIAL_MEMBERS);
    LocalKasRepository.saveSettings(DEFAULT_SETTINGS);
    setTransactions(INITIAL_TRANSACTIONS);
    setMembers(INITIAL_MEMBERS);
    setSettings(DEFAULT_SETTINGS);
  };

  // ---------------- KOLEKTIF BILLS HANDLERS ----------------
  const handleAddKolektifBill = (bill: Omit<KolektifBill, 'id' | 'createdAt'>) => {
    const created = LocalKasRepository.addKolektifBill(bill);
    setKolektifBills(LocalKasRepository.getKolektifBills());
    LocalKasRepository.addAuditLog({
      action: 'BUAT KOLEKTIF',
      details: `Membuat tagihan kolektif baru: ${bill.title} (${bill.participantIds.length} peserta)`,
      performedBy: user?.name || 'Bendahara',
      userRole: role,
    });
  };

  const handleUpdateKolektifBill = (id: string, updates: Partial<KolektifBill>) => {
    LocalKasRepository.updateKolektifBill(id, updates);
    setKolektifBills(LocalKasRepository.getKolektifBills());
  };

  const handleDeleteKolektifBill = (id: string) => {
    LocalKasRepository.deleteKolektifBill(id);
    setKolektifBills(LocalKasRepository.getKolektifBills());
  };

  const handleToggleKolektifPayment = (billId: string, memberId: string) => {
    LocalKasRepository.toggleKolektifPayment(billId, memberId);
    setKolektifBills(LocalKasRepository.getKolektifBills());
  };

  const handleConvertSplitBillToKolektif = (bill: {
    title: string;
    category: string;
    amountPerPerson: number;
    totalCost: number;
    participantIds: string[];
    notes: string;
  }) => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    handleAddKolektifBill({
      title: bill.title,
      category: bill.category,
      amountPerPerson: bill.amountPerPerson,
      totalCost: bill.totalCost,
      dueDate: d.toISOString().split('T')[0],
      participantIds: bill.participantIds,
      paidMemberIds: [],
      notes: bill.notes,
      syncedToKas: false
    });
    navigateTo('bendahara', 'kolektif');
    showToast(`Berhasil dikonversi menjadi Tagihan Kolektif "${bill.title}"!`, 'success');
  };

  // ---------------- SECRETARY HANDLERS ----------------
  const handleAddPointLog = (log: Omit<StudentPointLog, 'id' | 'createdAt'>) => {
    LocalKasRepository.addPointLog(log);
    setPointLogs(LocalKasRepository.getPointLogs());
  };

  const handleDeletePointLog = (id: string) => {
    LocalKasRepository.deletePointLog(id);
    setPointLogs(LocalKasRepository.getPointLogs());
  };

  const handleSaveAttendanceRecord = (rec: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }) => {
    LocalKasRepository.saveAttendanceRecord(rec);
    setAttendanceRecords(LocalKasRepository.getAttendanceRecords());
  };

  const handleDeleteAttendanceRecord = (id: string) => {
    LocalKasRepository.deleteAttendanceRecord(id);
    setAttendanceRecords(LocalKasRepository.getAttendanceRecords());
  };

  const handleSaveMeetingMinute = (minute: Omit<MeetingMinute, 'id' | 'createdAt'> & { id?: string }) => {
    LocalKasRepository.saveMeetingMinute(minute);
    setMeetingMinutes(LocalKasRepository.getMeetingMinutes());
  };

  const handleDeleteMeetingMinute = (id: string) => {
    LocalKasRepository.deleteMeetingMinute(id);
    setMeetingMinutes(LocalKasRepository.getMeetingMinutes());
  };

  // If user is not logged in or hasn't selected a role, show the doodle welcome screen
  if (!isLoggedIn) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen bg-paper-grid flex flex-col text-slate-900 font-sans selection:bg-amber-200 selection:text-slate-900 max-w-full overflow-x-hidden">
      {/* Animated Intro Screen */}
      {showIntro && (
        <AnimatedIntroScreen onFinish={() => setShowIntro(false)} />
      )}

      {/* Doodle Navbar */}
      {isLoggedIn && !showIntro && (
        <DoodleNavbar
          currentTab={currentTab}
          activeDomain={activeDomain}
          onSelectTab={handleSelectTab}
          onSelectDomain={handleSelectDomain}
          classNameTitle={settings.className}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6">
        {/* 1. PORTAL HUB BERANDA UTAMA (Pilihan Dua Ranah Besar) */}
        {activeDomain === 'hub' && (
          <MainPortalHub
            settings={settings}
            members={members}
            transactions={transactions}
            kolektifBills={kolektifBills}
            pointLogs={pointLogs}
            attendanceRecords={attendanceRecords}
            meetingMinutes={meetingMinutes}
            onSelectDomain={handleSelectDomain}
            onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
          />
        )}

        {/* 2. RANAH SEKRETARIS */}
        {activeDomain === 'sekretaris' && (
          <SecretaryHub
            initialSubTab={
              currentTab === 'presensi' ? 'presensi' : currentTab === 'notulensi' ? 'notulensi' : 'keaktifan'
            }
            members={members}
            settings={settings}
            canEdit={canEditKas}
            pointLogs={pointLogs}
            attendanceRecords={attendanceRecords}
            meetingMinutes={meetingMinutes}
            onAddPointLog={handleAddPointLog}
            onDeletePointLog={handleDeletePointLog}
            onSaveAttendanceRecord={handleSaveAttendanceRecord}
            onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
            onSaveMeetingMinute={handleSaveMeetingMinute}
            onDeleteMeetingMinute={handleDeleteMeetingMinute}
            onBackToHub={() => handleSelectDomain('hub', 'beranda')}
          />
        )}

        {/* 3. RANAH BENDAHARA (Administrasi Kas & Keuangan) */}
        {activeDomain === 'bendahara' && currentTab === 'ringkasan' && (
          <KasOverview
            transactions={transactions}
            settings={settings}
            members={members}
            onNavigateTab={handleSelectTab as any}
            onOpenNewTxModal={() => setIsAddTxModalOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenSplitBillModal={() => setIsSplitBillModalOpen(true)}
          />
        )}

        {activeDomain === 'bendahara' && currentTab === 'bukukas' && (
          <KasBook
            transactions={transactions}
            members={members}
            settings={settings}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateSettings={handleSaveSettings}
            isModalOpen={isAddTxModalOpen}
            onCloseModal={() => setIsAddTxModalOpen(false)}
            onOpenModal={() => setIsAddTxModalOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            onOpenSplitBillModal={() => setIsSplitBillModalOpen(true)}
          />
        )}

        {activeDomain === 'bendahara' && currentTab === 'checklist' && (
          <KasChecklist
            members={members}
            settings={settings}
            onToggleWeek={handleToggleWeek}
            onToggleAllWeek={handleToggleAllWeek}
            onAddMember={handleAddMember}
            onAddMembers={handleAddMembers}
            onUpdateMember={handleUpdateMember}
          />
        )}

        {activeDomain === 'bendahara' && currentTab === 'kolektif' && (
          <KolektifBillTab
            bills={kolektifBills}
            members={members}
            settings={settings}
            canEdit={canEditKas}
            onAddBill={handleAddKolektifBill}
            onUpdateBill={handleUpdateKolektifBill}
            onDeleteBill={handleDeleteKolektifBill}
            onTogglePayment={handleToggleKolektifPayment}
            onSyncToKas={handleAddTransaction}
            onOpenSplitBillModal={() => setIsSplitBillModalOpen(true)}
          />
        )}

        {activeDomain === 'bendahara' && currentTab === 'rekap' && (
          <KasRecapView
            transactions={transactions}
            members={members}
            settings={settings}
          />
        )}

        {activeDomain === 'bendahara' && currentTab === 'auditlog' && (
          <KasAuditLog
            auditLogs={auditLogs}
            onRefreshLogs={() => setAuditLogs(LocalKasRepository.getAuditLogs())}
          />
        )}

        {activeDomain === 'bendahara' && currentTab === 'pengaturan' && canEditKas && (
          <KasSettings
            settings={settings}
            members={members}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
            onAddMember={handleAddMember}
            onAddMembers={handleAddMembers}
            onUpdateMember={handleUpdateMember}
          />
        )}
      </main>

      {/* Interactive Story Walkthrough Modal */}
      <DoodleWalkthrough
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onSelectTab={handleSelectTab as any}
      />

      {/* Printable Binder Modal */}
      <PrintableBinderModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        members={members}
        settings={settings}
      />

      {/* WhatsApp Transparency Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        transactions={transactions}
        members={members}
        settings={settings}
      />

      {/* Class Portal Direct Link Share Modal */}
      <ClassShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        settings={settings}
      />

      {/* Split Bill Calculator Modal */}
      <SplitBillModal
        isOpen={isSplitBillModalOpen}
        onClose={() => setIsSplitBillModalOpen(false)}
        members={members}
        settings={settings}
        onAddTransaction={handleAddTransaction}
        onConvertToKolektif={handleConvertSplitBillToKolektif}
      />

      {/* Global Dialog Container (Alerts, Confirms, Toasts) */}
      <DoodleDialogContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

