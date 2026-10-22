import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, UserCheck, X } from 'lucide-react';

interface RoleSwitcherBarProps {
  onClose?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ onClose }) => {
  const { user, role, allUsers, switchUser, isLoading } = useAuth();

  const keyPersonas = [
    { roleKey: 'role_superadmin', label: 'Super Admin', desc: 'Akses Penuh' },
    { roleKey: 'role_ketua', label: 'Ketua Kelas', desc: 'Eksekutif' },
    { roleKey: 'role_wakil', label: 'Wakil Ketua', desc: 'Operasional' },
    { roleKey: 'role_bendahara', label: 'Bendahara', desc: 'Keuangan' },
    { roleKey: 'role_sekretaris', label: 'Sekretaris', desc: 'Administrasi' },
    { roleKey: 'role_anggota', label: 'Anggota', desc: 'Mahasiswa' },
    { roleKey: 'role_koordinator_acara', label: 'Koor. Acara', desc: 'Custom Role' },
  ];

  const handleSwitchToRole = (roleKey: string) => {
    const targetUser = allUsers.find(u => u.role_id === roleKey);
    if (targetUser) {
      switchUser(targetUser.id);
    }
  };

  return (
    <div className="bg-[#0B1120] text-slate-100 px-4 py-2 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Mode Uji Peran (Role Switcher)
          </span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Aktif sebagai: <strong className="text-white">{user?.name}</strong> ({role?.name})
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 hidden md:inline text-[11px] mr-1 font-medium">Uji:</span>
          {keyPersonas.map((p) => {
            const isActive = role?.id === p.roleKey;
            return (
              <button
                key={p.roleKey}
                onClick={() => handleSwitchToRole(p.roleKey)}
                disabled={isLoading || isActive}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-[11px] flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
                title={`${p.label} - ${p.desc}`}
              >
                <UserCheck className="w-3 h-3" />
                {p.label}
              </button>
            );
          })}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1 cursor-pointer"
              title="Tutup Mode Uji Peran"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
