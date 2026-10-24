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
        const [txs, ms] = await Promise.all([
          LocalKasRepository.fetchTransactionsFromSupabase(),
          LocalKasRepository.fetchMembersFromSupabase()
        ]);
        setTransactions(txs);
        setMembers(ms);
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
        // When transaction is inserted/updated/deleted in Supabase by another device
        if (payload.eventType === 'INSERT') {
          sfx.playNotification();
        }
        LocalKasRepository.fetchTransactionsFromSupabase().then(setTransactions);
        setAuditLogs(LocalKasRepository.getAuditLogs());
      },
      (payload) => {
        // When member weekly dues status is updated in Supabase by another device
        if (payload.eventType === 'UPDATE') {
          sfx.playNotification();
        }
        LocalKasRepository.fetchMembersFromSupabase().then(setMembers);
        setAuditLogs(LocalKasRepository.getAuditLogs());
      },
      (_payload) => {
        setAuditLogs(LocalKasRepository.getAuditLogs());
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
  const handleAddTransaction = (newTxData: Omit<KasTransaction, 'id' | 'createdAt'>) => {
    const saved = LocalKasRepository.addTransaction(newTxData);
    LocalKasRepository.addAuditLog({
      action: `CATAT ${newTxData.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}`,
      details: `${newTxData.title}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(newTxData.amount)}`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setTransactions(prev => [saved, ...prev]);
    setAuditLogs(LocalKasRepository.getAuditLogs());
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    LocalKasRepository.deleteTransaction(id);
    if (tx) {
      LocalKasRepository.addAuditLog({
        action: 'HAPUS TRANSAKSI',
        details: `Menghapus ${tx.title} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tx.amount)})`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    setAuditLogs(LocalKasRepository.getAuditLogs());
  };

  const handleToggleWeek = (memberId: string, weekKey: string) => {
    LocalKasRepository.toggleMemberWeek(memberId, weekKey);
    const targetMember = members.find(m => m.id === memberId);
    if (targetMember) {
      const isNowPaid = !targetMember.weeklyStatus?.[weekKey];
      LocalKasRepository.addAuditLog({
        action: 'IURAN MINGGUAN',
        details: `${isNowPaid ? 'Mencatat LUNAS' : 'Membatalkan Status Lunas'} Iuran ${weekKey} untuk ${targetMember.name}`,
        performedBy: user?.name || 'Unknown',
        userRole: role,
      });
      setAuditLogs(LocalKasRepository.getAuditLogs());
    }
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          weeklyStatus: {
            ...(m.weeklyStatus || {}),
            [weekKey]: !m.weeklyStatus?.[weekKey]
          }
        };
      }
      return m;
    }));
  };

  const handleAddMember = (name: string, studentId: string, phone?: string) => {
    const newM = LocalKasRepository.addMember(name, studentId, phone);
    LocalKasRepository.addAuditLog({
      action: 'TAMBAH ANGGOTA',
      details: `Menambahkan siswa baru: ${name} (NIM: ${studentId})`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setAuditLogs(LocalKasRepository.getAuditLogs());
    setMembers(prev => [...prev, newM]);
  };

  const handleAddMembers = (newMembersList: { name: string; studentId: string; phone?: string }[]) => {
    const created = LocalKasRepository.addMembers(newMembersList);
    LocalKasRepository.addAuditLog({
      action: 'IMPORT ANGGOTA',
      details: `Impor massal ${created.length} siswa baru`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setAuditLogs(LocalKasRepository.getAuditLogs());
    setMembers(prev => [...prev, ...created]);
  };

  const handleToggleAllWeek = (weekKey: string, shouldPay: boolean) => {
    // 1. Optimistic instant React state update
    setMembers(prev => prev.map(m => ({
      ...m,
      weeklyStatus: {
        ...(m.weeklyStatus || {}),
        [weekKey]: shouldPay
      }
    })));

    // 2. Persist to storage and Supabase batch upsert
    LocalKasRepository.toggleAllMembersWeek(weekKey, shouldPay);

    // 3. Record audit log
    LocalKasRepository.addAuditLog({
      action: 'IURAN MASSAL',
      details: `${shouldPay ? 'Mencatat LUNAS' : 'Membatalkan Lunas'} Seluruh Siswa untuk ${weekKey}`,
      performedBy: user?.name || 'Unknown',
      userRole: role,
    });
    setAuditLogs(LocalKasRepository.getAuditLogs());
  };


  const handleUpdateMember = (memberId: string, updates: Partial<KasMember>) => {
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
  };

  const handleSaveSettings = (newSettings: ClassSettings) => {
    LocalKasRepository.saveSettings(newSettings);
    setSettings(newSettings);
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
