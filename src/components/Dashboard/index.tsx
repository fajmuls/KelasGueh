import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MemberDashboard } from './MemberDashboard.tsx';
import { ChairmanDashboard } from './ChairmanDashboard.tsx';
import { TreasurerDashboard } from './TreasurerDashboard.tsx';
import { SecretaryDashboard } from './SecretaryDashboard.tsx';
import { SuperAdminDashboard } from './SuperAdminDashboard.tsx';
import { Eye, QrCode } from 'lucide-react';
import { NoClassBanner } from '../Admin/NoClassBanner.tsx';
import { ClassSetupModal } from '../Admin/ClassSetupModal.tsx';
import { fetchClassesFromFirestore } from '../../services/firestoreSync.ts';
import { ClassInfo } from '../../types/index.ts';

interface DashboardHubProps {
  onNavigate: (module: string) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ onNavigate }) => {
  const { role, isSuperAdmin, classInfo } = useAuth();
  const [viewOverride, setViewOverride] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [existingClasses, setExistingClasses] = useState<ClassInfo[]>([]);

  const loadClasses = async () => {
    try {
      const cls = await fetchClassesFromFirestore();
      setExistingClasses(cls);
    } catch {}
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const activeRoleKey = viewOverride || role?.id || 'role_anggota';
  const hasClasses = existingClasses.length > 0 || (classInfo?.name && classInfo?.name !== 'Kelas Manajer 01SAKP014');

  return (
    <div className="space-y-6 relative pb-16">
      {/* Super Admin Notice if no classes configured */}
      {isSuperAdmin && !hasClasses && (
        <NoClassBanner
          hasClasses={false}
          onOpenSetup={() => setShowSetupModal(true)}
        />
      )}

      {/* Perspective switcher for management/superadmin (Flat Segmented Control) */}
      {(role?.id === 'role_superadmin' || role?.id === 'role_ketua') && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-1 bg-slate-100 rounded-lg max-w-2xl mx-auto shadow-inner text-xs">
          <div className="flex w-full overflow-x-auto no-scrollbar">
            {[
              { key: 'role_superadmin', label: 'Super Admin' },
              { key: 'role_ketua', label: 'Ketua' },
              { key: 'role_bendahara', label: 'Bendahara' },
              { key: 'role_sekretaris', label: 'Sekretaris' },
              { key: 'role_anggota', label: 'Anggota' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setViewOverride(p.key === role.id ? null : p.key)}
                className={`flex-1 min-w-[90px] px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 text-center ${
                  activeRoleKey === p.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render matching dashboard */}
      {activeRoleKey === 'role_superadmin' ? (
        <SuperAdminDashboard onNavigate={onNavigate} />
      ) : activeRoleKey === 'role_ketua' || activeRoleKey === 'role_wakil' ? (
        <ChairmanDashboard onNavigate={onNavigate} />
      ) : activeRoleKey === 'role_bendahara' ? (
        <TreasurerDashboard onNavigate={onNavigate} />
      ) : activeRoleKey === 'role_sekretaris' ? (
        <SecretaryDashboard onNavigate={onNavigate} />
      ) : (
        <MemberDashboard onNavigate={onNavigate} />
      )}

      {showSetupModal && (
        <ClassSetupModal
          isOpen={showSetupModal}
          onClose={() => {
            setShowSetupModal(false);
            loadClasses();
          }}
          existingClasses={existingClasses}
          onClassSelected={() => {
            loadClasses();
          }}
        />
      )}

      {/* Floating Action Button (FAB) Presensi Cepat */}
      <button
        onClick={() => onNavigate('attendance')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center z-40 group"
        title="Presensi QR Cepat"
      >
        <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
          Scan Presensi
        </span>
      </button>
    </div>
  );
};
