import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { WelcomeScreen } from './components/Doodle/WelcomeScreen.tsx';
import { DoodleNavbar } from './components/Doodle/DoodleNavbar.tsx';
import { KasOverview } from './components/Doodle/KasOverview.tsx';
import { KasBook } from './components/Doodle/KasBook.tsx';
import { KasChecklist } from './components/Doodle/KasChecklist.tsx';
import { KasSettings } from './components/Doodle/KasSettings.tsx';
import { LocalKasRepository, INITIAL_TRANSACTIONS, INITIAL_MEMBERS, DEFAULT_SETTINGS } from './services/supabaseClient.ts';
import { KasTransaction, KasMember, ClassSettings } from './types/kas.ts';
import { CURRENT_APP_VERSION } from './version.ts';

const AppContent: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [currentTab, setCurrentTab] = useState<'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan'>('ringkasan');
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);

  // State
  const [transactions, setTransactions] = useState<KasTransaction[]>(() => LocalKasRepository.getTransactions());
  const [members, setMembers] = useState<KasMember[]>(() => LocalKasRepository.getMembers());
  const [settings, setSettings] = useState<ClassSettings>(() => LocalKasRepository.getSettings());

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

  const handleAddMember = (name: string, studentId: string) => {
    const newM = LocalKasRepository.addMember(name, studentId);
    setMembers(prev => [...prev, newM]);
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
      {/* Doodle Navbar */}
      <DoodleNavbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        classNameTitle={settings.className}
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
          />
        )}

        {currentTab === 'bukukas' && (
          <KasBook
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isModalOpen={isAddTxModalOpen}
            onCloseModal={() => setIsAddTxModalOpen(false)}
            onOpenModal={() => setIsAddTxModalOpen(true)}
          />
        )}

        {currentTab === 'checklist' && (
          <KasChecklist
            members={members}
            settings={settings}
            onToggleWeek={handleToggleWeek}
            onAddMember={handleAddMember}
          />
        )}

        {currentTab === 'pengaturan' && (
          <KasSettings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t-2 border-slate-900 bg-white py-4 px-6 text-center text-xs text-slate-500 font-medium">
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
