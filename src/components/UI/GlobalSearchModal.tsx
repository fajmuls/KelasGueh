import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, LayoutDashboard, Users, Wallet, Calendar, Megaphone, CheckSquare, FileText, Vote, ClipboardCheck, Settings, Shield } from 'lucide-react';
import { Modal } from './Modal.tsx';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
}) => {
  const [query, setQuery] = useState('');

  const quickNavItems = [
    { id: 'dashboard', label: 'Dashboard Kelas', group: 'Navigasi', icon: LayoutDashboard },
    { id: 'members', label: 'Daftar Anggota & Mahasiswa', group: 'Modul', icon: Users },
    { id: 'finance', label: 'Buku Kas & Verifikasi Tagihan', group: 'Keuangan', icon: Wallet },
    { id: 'my-kas', label: 'Kas Saya & Upload Bukti Transfer', group: 'Keuangan', icon: Wallet },
    { id: 'transparency', label: 'Transparansi Kas & Mutasi Saldo', group: 'Keuangan', icon: Wallet },
    { id: 'agenda', label: 'Agenda Perkuliahan & Ujian', group: 'Akademik', icon: Calendar },
    { id: 'announcements', label: 'Pengumuman Resmi Kelas', group: 'Komunikasi', icon: Megaphone },
    { id: 'tasks', label: 'Tugas & Penugasan Panitia', group: 'Manajemen', icon: CheckSquare },
    { id: 'documents', label: 'Repositori Dokumen & Silabus', group: 'Arsip', icon: FileText },
    { id: 'polls', label: 'Voting & Polling Musyawarah', group: 'Aspirasi', icon: Vote },
    { id: 'attendance', label: 'Presensi & Absensi QR', group: 'Akademik', icon: ClipboardCheck },
    { id: 'roles', label: 'Role & Matriks Permissions (RBAC)', group: 'Admin', icon: Shield },
    { id: 'settings', label: 'Pengaturan Identitas Kelas & Versi', group: 'Sistem', icon: Settings },
  ];

  const filteredItems = quickNavItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.group.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pencarian Cepat Modul & Navigasi" maxWidth="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Ketik nama modul, tugas, atau keuangan (mis: kas, agenda, anggota)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada hasil navigasi yang cocok dengan kata kunci.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectModule(item.id);
                    onClose();
                  }}
                  className="p-3 hover:bg-indigo-50/50 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {item.group}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
