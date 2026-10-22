import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { WelcomeScreen } from './components/Doodle/WelcomeScreen.tsx';
import { DoodleNavbar } from './components/Doodle/DoodleNavbar.tsx';
import { KasOverview } from './components/Doodle/KasOverview.tsx';
import { KasBook } from './components/Doodle/KasBook.tsx';
import { KasChecklist } from './components/Doodle/KasChecklist.tsx';
import { KasSettings } from './components/Doodle/KasSettings.tsx';
import { PrintableBinderModal } from './components/Doodle/PrintableBinderModal.tsx';
import { WhatsAppShareModal } from './components/Doodle/WhatsAppShareModal.tsx';
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
  const { isLoggedIn, canEditKas } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [currentTab, setCurrentTab] = useState<'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan'>('ringkasan');
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Auto redirect from settings tab if user is read-only Anggota
  useEffect(() => {
    if (!canEditKas && currentTab === 'pengaturan') {
      setCurrentTab('ringkasan');
    }
  }, [canEditKas, currentTab]);

  // State
  const [transactions, setTransactions] = useState<KasTransaction[]>(() => LocalKasRepository.getTransactions());
  const [members, setMembers] = useState<KasMember[]>(() => LocalKasRepository.getMembers());
  const [settings, setSettings] = useState<ClassSettings>(() => LocalKasRepository.getSettings());

  // Supabase Realtime Broadcast subscription
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeKas(
      (payload) => {
        // When transaction is inserted/updated/deleted in Supabase by another device
        sfx.playNotification();
        setTransactions(LocalKasRepository.getTransactions());
      },
      (payload) => {
        // When member weekly dues status is updated in Supabase by another device
        sfx.playNotification();
        setMembers(LocalKasRepository.getMembers());
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Autoplay BGM automatically on first user gesture (Click / Touch / Keypress)
  useEffect(() => {
    const handleFirstGesture = () => {
      if (!sfx.getIsBgmPlaying()) {
        sfx.startBgm();
      }
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Handlers
  const handleAddTransaction = (newTxData: Omit<KasTransaction, 'id' | 'createdAt'>) => {
    const saved = LocalKasRepository.addTransaction(newTxData);
    setTransactions(prev => [saved, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    LocalKasRepository.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleWeek = (memberId: string, weekKey: string) => {
    LocalKasRepository.toggleMemberWeek(memberId, weekKey);
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          weeklyStatus: {
            ...m.weeklyStatus,
            [weekKey]: !m.weeklyStatus[weekKey]
          }
        };
      }
      return m;
    }));
  };

  const handleAddMember = (name: string, studentId: string, phone?: string) => {
    const newM = LocalKasRepository.addMember(name, studentId, phone);
    setMembers(prev => [...prev, newM]);
  };

  const handleAddMembers = (newMembersList: { name: string; studentId: string; phone?: string }[]) => {
    const created = LocalKasRepository.addMembers(newMembersList);
    setMembers(prev => [...prev, ...created]);
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
    <div className="min-h-screen bg-paper-grid flex flex-col text-slate-900 font-sans selection:bg-amber-200 selection:text-slate-900">
      {/* Animated Intro Screen (Plays on open or when replayed from navbar) */}
      {showIntro && (
        <AnimatedIntroScreen onFinish={() => setShowIntro(false)} />
      )}

      {/* Doodle Navbar with User SVG Logo & SFX/BGM controls */}
      <DoodleNavbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        classNameTitle={settings.className}
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'ringkasan' && (
          <KasOverview
            transactions={transactions}
            settings={settings}
            members={members}
            onNavigateTab={setCurrentTab}
            onOpenNewTxModal={() => setIsAddTxModalOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
          />
        )}

        {currentTab === 'bukukas' && (
          <KasBook
            transactions={transactions}
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
            onAddMember={handleAddMember}
            onAddMembers={handleAddMembers}
          />
        )}

        {currentTab === 'pengaturan' && canEditKas && (
          <KasSettings
            settings={settings}
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
