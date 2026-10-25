import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { WelcomeScreen } from './components/Doodle/WelcomeScreen.tsx';
import { DoodleNavbar } from './components/Doodle/DoodleNavbar.tsx';
import { KasOverview } from './components/Doodle/KasOverview.tsx';
import { KasBook } from './components/Doodle/KasBook.tsx';
import { KasChecklist } from './components/Doodle/KasChecklist.tsx';
import { KasSettings } from './components/Doodle/KasSettings.tsx';
import { KasAuditLog } from './components/Doodle/KasAuditLog.tsx';
import { PrintableBinderModal } from './components/Doodle/PrintableBinderModal.tsx';
import { WhatsAppShareModal } from './components/Doodle/WhatsAppShareModal.tsx';
import { ClassShareModal } from './components/Doodle/ClassShareModal.tsx';
import { AnimatedIntroScreen } from './components/Doodle/AnimatedIntroScreen.tsx';
import {
  LocalKasRepository,
  INITIAL_TRANSACTIONS,
  INITIAL_MEMBERS,
  DEFAULT_SETTINGS,
  subscribeToRealtimeKas
} from './services/supabaseClient.ts';
import { KasTransaction, KasMember, ClassSettings } from './types/kas.ts';
import { CURRENT_APP_VERSION } from './version.ts';
import { sfx } from './utils/soundEffects.ts';

const AppContent: React.FC = () => {
  const { user, role, isLoggedIn, canEditKas } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [currentTab, setCurrentTab] = useState<'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan' | 'auditlog'>('ringkasan');
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Auto redirect from settings tab if user is read-only Anggota
  useEffect(() => {
    if (!canEditKas && (currentTab === 'pengaturan' || currentTab === 'auditlog')) {
      setCurrentTab('ringkasan');
    }
  }, [canEditKas, currentTab]);

  // State
  const [transactions, setTransactions] = useState<KasTransaction[]>(() => LocalKasRepository.getTransactions());
  const [members, setMembers] = useState<KasMember[]>(() => LocalKasRepository.getMembers());
  const [settings, setSettings] = useState<ClassSettings>(() => LocalKasRepository.getSettings());
  const [auditLogs, setAuditLogs] = useState(() => LocalKasRepository.getAuditLogs());

  // Fetch initial data from Supabase on mount
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

  // Autoplay BGM automatically on first user gesture (Click / Touch / Keypress)
  useEffect(() => {
    let initialized = false;
    const handleFirstGesture = () => {
      if (initialized) return;
      
      // Check both sfx state and localStorage to be absolutely sure
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

  // Handlers
  const handleAddTransaction = async (newTxData: Omit<KasTransaction, 'id' | 'createdAt'>) => {
    try {
      await LocalKasRepository.addTransaction(newTxData);
      await LocalKasRepository.addAuditLog({
        action: `CATAT ${newTxData.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}`,
        details: `${newTxData.title}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(newTxData.amount)}`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });
      // Refresh all states from cloud / local
      const txs = await LocalKasRepository.fetchTransactionsFromSupabase();
      setTransactions(txs);
      const logs = await LocalKasRepository.fetchAuditLogsFromSupabase();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Add transaction handler error:', err);
      alert('Gagal menyimpan transaksi ke database. Pastikan koneksi Supabase aktif.');
    }
  };

  const handleDeleteTransaction = async (id: string, skipLinkedSync: boolean = false) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Check if it's a linked iuran transaction and update checklist status
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

  const handleToggleWeek = async (memberId: string, weekKey: string) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return;

    const isNowPaid = !targetMember.weeklyStatus?.[weekKey];
    const linkedTag = `LINKED_IURAN:${memberId}:${weekKey}`;

    // Perform the checklist toggle first
    await LocalKasRepository.toggleMemberWeek(memberId, weekKey);

    // Auto-Link Logic
    if (isNowPaid) {
      // Create transaction record automatically
      const year = weekKey.split('_')[0];
      const month = weekKey.split('_')[1];
      const weekNum = weekKey.split('_W')[1];
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][parseInt(month) - 1];
      const weekLabel = `Mgg ${weekNum} ${monthName} ${year}`;
      
      const newTx: Omit<KasTransaction, 'id' | 'createdAt'> = {
        type: 'income',
        title: `Iuran: ${targetMember.name} (${weekLabel})`,
        amount: settings.weeklyDuesAmount,
        category: 'Iuran Kas',
        date: new Date().toISOString().split('T')[0],
        recordedBy: user?.name || 'Sistem',
        notes: linkedTag
      };
      await handleAddTransaction(newTx);
    } else {
      // Find and delete linked transaction record automatically
      const txToDelete = transactions.find(t => t.notes === linkedTag);
      if (txToDelete) {
        await handleDeleteTransaction(txToDelete.id, true); // true to skip re-syncing checklist
      }
    }

    await LocalKasRepository.addAuditLog({
      action: 'IURAN MINGGUAN',
      details: `${isNowPaid ? 'Mencatat LUNAS' : 'Membatalkan Lunas'} Iuran ${weekKey} untuk ${targetMember.name}`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    
    LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
    LocalKasRepository.fetchAuditLogsFromSupabase().then(setAuditLogs);
    LocalKasRepository.fetchTransactionsFromSupabase().then(setTransactions);
  };

  const handleAddMember = async (name: string, studentId: string, phone?: string) => {
    const newM = await LocalKasRepository.addMember(name, studentId, phone);
    LocalKasRepository.addAuditLog({
      action: 'TAMBAH ANGGOTA',
      details: `Menambahkan siswa baru: ${name} (NIM: ${studentId})`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setAuditLogs(LocalKasRepository.getAuditLogs());
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
    LocalKasRepository.fetchAuditLogsFromSupabase().then(setAuditLogs);
    setMembers(prev => [...prev, ...created]);
    LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
  };

  const handleToggleAllWeek = async (weekKey: string, shouldPay: boolean) => {
    // Perform bulk checklist update
    await LocalKasRepository.toggleAllMembersWeek(weekKey, shouldPay);

    // Auto-Link Logic for Bulk
    if (shouldPay) {
      const year = weekKey.split('_')[0];
      const month = weekKey.split('_')[1];
      const weekNum = weekKey.split('_W')[1];
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][parseInt(month) - 1];
      const weekLabel = `Mgg ${weekNum} ${monthName} ${year}`;

      // Create transactions for all members who weren't paid yet
      for (const m of members) {
        if (!m.weeklyStatus?.[weekKey]) {
          const linkedTag = `LINKED_IURAN:${m.id}:${weekKey}`;
          const newTx: Omit<KasTransaction, 'id' | 'createdAt'> = {
            type: 'income',
            title: `Iuran: ${m.name} (${weekLabel})`,
            amount: settings.weeklyDuesAmount,
            category: 'Iuran Kas',
            date: new Date().toISOString().split('T')[0],
            recordedBy: user?.name || 'Sistem',
            notes: linkedTag
          };
          await LocalKasRepository.addTransaction(newTx);
        }
      }
    } else {
      // Delete all linked transactions for this week
      const prefix = `LINKED_IURAN:`;
      const suffix = `:${weekKey}`;
      const txsToDelete = transactions.filter(t => t.notes?.startsWith(prefix) && t.notes?.endsWith(suffix));
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
    setAuditLogs(LocalKasRepository.getAuditLogs());

    // Refresh state
    const [freshTxs, freshMembers] = await Promise.all([
      LocalKasRepository.fetchTransactionsFromSupabase(),
      LocalKasRepository.fetchMembersFromSupabase()
    ]);
    setTransactions(freshTxs);
    setMembers(freshMembers);
  };


  const handleUpdateMember = async (memberId: string, updates: Partial<KasMember>) => {
    LocalKasRepository.updateMember(memberId, updates);
    const oldM = members.find(m => m.id === memberId);
    if (oldM) {
      LocalKasRepository.addAuditLog({
        action: 'UPDATE ANGGOTA',
        details: `Mengubah data ${oldM.name}: ${JSON.stringify(updates)}`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });
      setAuditLogs(LocalKasRepository.getAuditLogs());
    }
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

  // If user is not logged in or hasn't selected a role, show the doodle welcome screen
  if (!isLoggedIn) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen bg-paper-grid flex flex-col text-slate-900 font-sans selection:bg-amber-200 selection:text-slate-900 max-w-full overflow-x-hidden">
      {/* Animated Intro Screen (Plays on open or when replayed from navbar) */}
      {showIntro && (
        <AnimatedIntroScreen onFinish={() => setShowIntro(false)} />
      )}

      {/* Doodle Navbar with User SVG Logo & BGM controls - Only show after intro */}
      {isLoggedIn && !showIntro && (
        <DoodleNavbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          classNameTitle={settings.className}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
      )}

      {/* Main Content Viewport - Compacted for mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6">
        {currentTab === 'ringkasan' && (
          <KasOverview
            transactions={transactions}
            settings={settings}
            members={members}
            onNavigateTab={setCurrentTab}
            onOpenNewTxModal={() => setIsAddTxModalOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {currentTab === 'bukukas' && (
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
          />
        )}

        {currentTab === 'checklist' && (
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

        {currentTab === 'auditlog' && (
          <KasAuditLog
            auditLogs={auditLogs}
            onRefreshLogs={() => setAuditLogs(LocalKasRepository.getAuditLogs())}
          />
        )}

        {currentTab === 'pengaturan' && canEditKas && (
          <KasSettings
            settings={settings}
            members={members}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Printable Binder Modal */}
      <PrintableBinderModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        settings={settings}
      />

      {/* 1-Click WhatsApp Recap Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        transactions={transactions}
        settings={settings}
      />

      {/* Custom Domain Class Portal Share Modal */}
      <ClassShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        classNameTitle={settings.className}
      />

      {/* Clean Footer */}
      <footer className="border-t-2 border-slate-900 bg-white py-4 px-6 text-center text-xs text-slate-500 font-medium print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>{settings.className}</strong> — Transparansi Keuangan Kas Kelas
          </span>
          <span className="font-mono">
            v{CURRENT_APP_VERSION.version} ({CURRENT_APP_VERSION.codename})
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
