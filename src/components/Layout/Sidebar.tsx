import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Calendar,
  Megaphone,
  Video,
  CheckSquare,
  FileText,
  Vote,
  ClipboardCheck,
  FileSpreadsheet,
  Shield,
  History,
  Settings,
  Eye,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import { PermissionCode } from '../../types/index.ts';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  permission?: PermissionCode;
  badge?: string;
  isMemberOnly?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpen,
  onClose,
}) => {
  const { hasPermission, role } = useAuth();
  const isRegularMember = role?.id === 'role_anggota';

  // Navigation schema configured dynamically
  const navGroups: NavGroup[] = isRegularMember
    ? [
        {
          group: 'Utama',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'courses', label: 'Mata Kuliah & Tugas', icon: BookOpen },
            { id: 'my-kas', label: 'Kas Saya', icon: CreditCard },
            { id: 'agenda', label: 'Agenda Kelas', icon: Calendar, permission: 'view_agenda' },
            { id: 'announcements', label: 'Pengumuman', icon: Megaphone, permission: 'view_announcements' },
            { id: 'documents', label: 'Dokumen', icon: FileText, permission: 'view_documents' },
          ],
        },
      ]
    : [
        {
          group: 'Akademik (Jadwal & Tugas)',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'courses', label: 'Mata Kuliah & Tugas', icon: BookOpen },
            { id: 'agenda', label: 'Agenda & Kalender', icon: Calendar, permission: 'view_agenda' },
            { id: 'documents', label: 'Repositori Dokumen', icon: FileText, permission: 'view_documents' },
            { id: 'tasks', label: 'Tugas Kepengurusan', icon: CheckSquare, permission: 'view_tasks' },
          ],
        },
        {
          group: 'Keuangan & Presensi (Kas & Absen)',
          items: [
            { id: 'finance', label: 'Buku Kas & Tagihan', icon: Wallet, permission: 'view_finance' },
            { id: 'transparency', label: 'Transparansi Kas', icon: Eye, permission: 'view_transparency' },
            { id: 'attendance', label: 'Absensi Siswa', icon: ClipboardCheck, permission: 'view_attendance' },
            { id: 'reports', label: 'Laporan Kelas', icon: FileSpreadsheet, permission: 'view_reports' },
          ],
        },
        {
          group: 'Informasi (Roster & Forum)',
          items: [
            { id: 'members', label: 'Anggota Kelas', icon: Users, permission: 'view_members' },
            { id: 'announcements', label: 'Pengumuman', icon: Megaphone, permission: 'view_announcements' },
            { id: 'meetings', label: 'Rapat & Notulen', icon: Video, permission: 'view_meetings' },
            { id: 'polls', label: 'Voting & Polling', icon: Vote, permission: 'view_polls' },
            { id: 'settings', label: 'Pengaturan Kelas', icon: Settings, permission: 'manage_system_settings' },
            { id: 'roles', label: 'Role & Akses', icon: Shield, permission: 'manage_roles' },
          ],
        },
      ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar sidebar element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0F172A] text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              KM
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">Kelas Manager</p>
              <p className="text-[11px] text-slate-400 font-medium">Portal Akademik • v3.1.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {navGroups.map((group, gIdx) => {
            // Filter items user has permission for
            const visibleItems = group.items.filter(item => {
              if (!item.permission) return true;
              return hasPermission(item.permission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {group.group}
                </p>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectModule(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-400 font-semibold border-l-2 border-indigo-500'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Role Info Card */}
        <div className="p-3 border-t border-slate-800 bg-[#0A0F1D]/80">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Peran Aktif</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {role?.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
              {role?.description}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
