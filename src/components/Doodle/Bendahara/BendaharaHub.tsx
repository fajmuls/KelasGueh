import React, { useState } from 'react';
import {
  KasTransaction,
  KasMember,
  ClassSettings,
  KolektifBill
} from '../../../types/kas.ts';
import { AuditLogEntry } from '../../../services/supabaseClient.ts';
import { KasOverview } from '../KasOverview.tsx';
import { KasBook } from '../KasBook.tsx';
import { KasChecklist } from '../KasChecklist.tsx';
import { KolektifBillTab } from '../KolektifBillTab.tsx';
import { KasRecapView } from '../KasRecapView.tsx';
import { KasSettings } from '../KasSettings.tsx';
import { KasAuditLog } from '../KasAuditLog.tsx';
import { sfx } from '../../../utils/soundEffects.ts';
import {
  PieChart,
  BookOpen,
  CheckSquare,
  Receipt,
  TrendingUp,
  Settings,
  FileCheck2,
  ArrowLeft
} from 'lucide-react';

interface BendaharaHubProps {
  initialSubTab?: 'ringkasan' | 'bukukas' | 'checklist' | 'kolektif' | 'rekap' | 'pengaturan' | 'auditlog';
  transactions: KasTransaction[];
  members: KasMember[];
  settings: ClassSettings;
  kolektifBills: KolektifBill[];
  auditLogs: AuditLogEntry[];
  canEdit: boolean;
  isSuperAdmin: boolean;
  canViewAudit: boolean;
  
  // Handlers
  onAddTransaction: (tx: Omit<KasTransaction, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateTransaction?: (id: string, updates: Partial<KasTransaction>) => Promise<void>;
  onDeleteTransaction: (id: string, skipLinkedSync?: boolean) => Promise<void>;
  onDeleteMultipleTransactions?: (ids: string[]) => Promise<void>;
  onToggleWeek: (memberId: string, weekKey: string) => Promise<void>;
  onToggleAllWeek: (weekKey: string, shouldPay: boolean) => Promise<void>;
  onAddMember: (name: string, studentId: string, phone?: string) => Promise<void>;
  onAddMembers: (membersList: { name: string; studentId: string; phone?: string }[]) => Promise<void>;
  onUpdateMember: (memberId: string, updates: Partial<KasMember>) => Promise<void>;
  onSaveSettings: (settings: ClassSettings) => Promise<void>;
  onResetData: () => void;
  
  // Kolektif Handlers
  onAddKolektifBill: (bill: Omit<KolektifBill, 'id' | 'createdAt'>) => void;
  onUpdateKolektifBill: (id: string, updates: Partial<KolektifBill>) => void;
  onDeleteKolektifBill: (id: string) => void;
  onToggleKolektifPayment: (billId: string, memberId: string) => void;
  
  // Audit Logs
  onRefreshAuditLogs: () => void;

  // Modals
  isAddTxModalOpen: boolean;
  onOpenNewTxModal: () => void;
  onCloseNewTxModal: () => void;
  onOpenPrintModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenShareModal: () => void;
  onOpenSplitBillModal: () => void;
  onBackToHub: () => void;
  onSubTabChange?: (tab: string) => void;
}

export const BendaharaHub: React.FC<BendaharaHubProps> = ({
  initialSubTab = 'ringkasan',
  transactions,
  members,
  settings,
  kolektifBills,
  auditLogs,
  canEdit,
  isSuperAdmin,
  canViewAudit,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteMultipleTransactions,
  onToggleWeek,
  onToggleAllWeek,
  onAddMember,
  onAddMembers,
  onUpdateMember,
  onSaveSettings,
  onResetData,
  onAddKolektifBill,
  onUpdateKolektifBill,
  onDeleteKolektifBill,
  onToggleKolektifPayment,
  onRefreshAuditLogs,
  isAddTxModalOpen,
  onOpenNewTxModal,
  onCloseNewTxModal,
  onOpenPrintModal,
  onOpenWhatsAppModal,
  onOpenShareModal,
  onOpenSplitBillModal,
  onBackToHub,
  onSubTabChange
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<
    'ringkasan' | 'bukukas' | 'checklist' | 'kolektif' | 'rekap' | 'pengaturan' | 'auditlog'
  >(initialSubTab);

  const handleSelectSubTab = (tab: typeof currentSubTab) => {
    sfx.playToggle();
    setCurrentSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  const tabs = [
    { id: 'ringkasan' as const, label: 'Ringkasan Kas', icon: PieChart },
    { id: 'bukukas' as const, label: 'Buku Kas & Nota', icon: BookOpen },
    { id: 'checklist' as const, label: 'Ceklis Iuran', icon: CheckSquare },
    { id: 'kolektif' as const, label: 'Iuran Khusus', icon: Receipt },
    { id: 'rekap' as const, label: 'Rekap Kas', icon: TrendingUp },
    ...(canEdit ? [{ id: 'pengaturan' as const, label: 'Pengaturan Kas', icon: Settings }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Bendahara Sub Navigation Bar (Identical in style to SecretaryHub) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playClick();
              onBackToHub();
            }}
            className="btn-doodle px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-900 text-xs font-bold flex items-center gap-1 shrink-0"
            title="Kembali ke Beranda Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda Hub</span>
          </button>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs font-black text-slate-900 hidden sm:inline">
            Administrasi Kas & Keuangan
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = currentSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectSubTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-300 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-slate-800" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active View */}
      {currentSubTab === 'ringkasan' && (
        <KasOverview
          transactions={transactions}
          settings={settings}
          members={members}
          onNavigateTab={handleSelectSubTab as any}
          onOpenNewTxModal={onOpenNewTxModal}
          onOpenPrintModal={onOpenPrintModal}
          onOpenWhatsAppModal={onOpenWhatsAppModal}
          onOpenShareModal={onOpenShareModal}
          onOpenSplitBillModal={onOpenSplitBillModal}
        />
      )}

      {currentSubTab === 'bukukas' && (
        <KasBook
          transactions={transactions}
          members={members}
          settings={settings}
          onAddTransaction={onAddTransaction}
          onUpdateTransaction={onUpdateTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onDeleteMultipleTransactions={onDeleteMultipleTransactions}
          onUpdateSettings={onSaveSettings}
          isModalOpen={isAddTxModalOpen}
          onCloseModal={onCloseNewTxModal}
          onOpenModal={onOpenNewTxModal}
          onOpenPrintModal={onOpenPrintModal}
          onOpenWhatsAppModal={onOpenWhatsAppModal}
          onOpenSplitBillModal={onOpenSplitBillModal}
        />
      )}

      {currentSubTab === 'checklist' && (
        <KasChecklist
          members={members}
          settings={settings}
          onToggleWeek={onToggleWeek}
          onToggleAllWeek={onToggleAllWeek}
          onAddMember={onAddMember}
          onAddMembers={onAddMembers}
          onUpdateMember={onUpdateMember}
        />
      )}

      {currentSubTab === 'kolektif' && (
        <KolektifBillTab
          bills={kolektifBills}
          members={members}
          settings={settings}
          canEdit={canEdit}
          onAddBill={onAddKolektifBill}
          onUpdateBill={onUpdateKolektifBill}
          onDeleteBill={onDeleteKolektifBill}
          onTogglePayment={onToggleKolektifPayment}
          onSyncToKas={onAddTransaction}
          onOpenSplitBillModal={onOpenSplitBillModal}
        />
      )}

      {currentSubTab === 'rekap' && (
        <KasRecapView
          transactions={transactions}
          members={members}
          settings={settings}
        />
      )}

      {currentSubTab === 'pengaturan' && canEdit && (
        <KasSettings
          settings={settings}
          members={members}
          onSaveSettings={onSaveSettings}
          onResetData={onResetData}
          onAddMember={onAddMember}
          onAddMembers={onAddMembers}
          onUpdateMember={onUpdateMember}
        />
      )}
    </div>
  );
};
