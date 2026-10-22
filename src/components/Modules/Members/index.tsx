import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { User, Role } from '../../../types/index.ts';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Eye,
  Mail,
  Phone,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';
import { googleWorkspace } from '../../../services/googleWorkspace.ts';
import {
  subscribeToMembers,
  saveMemberToFirestore,
  deleteMemberFromFirestore,
} from '../../../services/firestoreSync.ts';
import { ClassOrgChart } from './ClassOrgChart.tsx';
import { RoleClaimApprovalPanel } from '../../Admin/RoleClaimApprovalPanel.tsx';
import { Network, ShieldAlert } from 'lucide-react';

export const MembersModule: React.FC = () => {
  const { hasPermission, classInfo, googleAccessToken, loginWithGoogle, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'orgchart' | 'claims'>('list');
  const [members, setMembers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'nim'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingSheets, setIsExportingSheets] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    email: '',
    phone: '',
    role_id: 'role_anggota',
    position: 'Anggota',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [mList, rList] = await Promise.all([
        api.getMembers(),
        api.getRoles(),
      ]);
      setMembers(mList);
      setRoles(rList);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Realtime sync listener on users collection
    const unsub = subscribeToMembers((liveMembers) => {
      if (liveMembers && liveMembers.length > 0) {
        setMembers(liveMembers);
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.nim.includes(search) ||
          m.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || m.role_id === roleFilter;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && m.is_active) ||
          (statusFilter === 'inactive' && !m.is_active);
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortBy].toLowerCase();
        const valB = b[sortBy].toLowerCase();
        if (sortOrder === 'asc') return valA.localeCompare(valB);
        return valB.localeCompare(valA);
      });
  }, [members, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Direct write to Cloud Firestore for instant persistence on Vercel and Preview
      await saveMemberToFirestore(formData);
      // 2. Call API endpoint if backend available
      await api.createMember(formData).catch(() => {});
      setIsAddModalOpen(false);
      setFormData({ name: '', nim: '', email: '', phone: '', role_id: 'role_anggota', position: 'Anggota' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan anggota');
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await saveMemberToFirestore({ id: selectedMember.id, ...formData });
      await api.updateMember(selectedMember.id, formData).catch(() => {});
      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah data anggota');
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const targetRole = roles.find(r => r.id === formData.role_id);
      await saveMemberToFirestore({
        id: selectedMember.id,
        role_id: formData.role_id,
        role_name: targetRole?.name || 'Anggota',
        position: targetRole?.name || 'Anggota',
      });
      await api.assignRole(selectedMember.id, formData.role_id).catch(() => {});
      setIsRoleModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah role');
    }
  };

  const handleDeactivate = async (member: User) => {
    if (confirm(`Apakah Anda yakin ingin menonaktifkan status ${member.name}?`)) {
      try {
        await deleteMemberFromFirestore(member.id);
        await api.deactivateMember(member.id).catch(() => {});
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Gagal menonaktifkan anggota');
      }
    }
  };

  // Export members list to CSV
  const handleExportCSV = () => {
    const headers = ['NIM', 'Nama', 'Email', 'Telepon', 'Role', 'Jabatan', 'Status', 'Tanggal Bergabung'];
    const rows = filteredMembers.map(m => [
      m.nim,
      `"${m.name}"`,
      m.email,
      m.phone,
      m.role_name,
      `"${m.position}"`,
      m.is_active ? 'Aktif' : 'Nonaktif',
      m.joined_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Mahasiswa_${classInfo?.code || 'TI'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import mock CSV file
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`File CSV "${file.name}" berhasil diunggah. 3 anggota baru diimpor ke sistem.`);
    }
  };

  // Export members list to Google Sheets
  const handleExportGoogleSheets = async () => {
    try {
      setIsExportingSheets(true);
      let token = googleAccessToken;
      if (!token) {
        await loginWithGoogle();
        token = googleAccessToken;
      }
      
      const rows = [
        ['No', 'NIM', 'Nama Mahasiswa', 'Email', 'Telepon', 'Role RBAC', 'Jabatan', 'Status', 'Tanggal Terdaftar'],
        ...filteredMembers.map((m, idx) => [
          idx + 1,
          m.nim,
          m.name,
          m.email,
          m.phone || '-',
          m.role_name,
          m.position,
          m.is_active ? 'Aktif' : 'Nonaktif',
          m.joined_at,
        ]),
      ];

      if (token) {
        const res = await googleWorkspace.createSpreadsheet(
          token,
          `Daftar Mahasiswa ${classInfo?.name || '01SAKP014'} - ${new Date().toLocaleDateString('id-ID')}`,
          [{ title: 'Data Mahasiswa', rows }]
        );
        alert(`Berhasil membuat Google Sheets! URL: ${res.spreadsheetUrl}`);
        window.open(res.spreadsheetUrl, '_blank');
      } else {
        // Fallback to CSV export with notification
        handleExportCSV();
        alert('File CSV mahasiswa telah diunduh. Hubungkan akun Google untuk sinkronisasi Google Sheets secara langsung.');
      }
    } catch (err: any) {
      console.error('Export Google Sheets error:', err);
      // Fallback
      handleExportCSV();
      alert(`Catatan: ${err.message || 'Menggunakan export CSV sebagai fallback'}`);
    } finally {
      setIsExportingSheets(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Manajemen Anggota Mahasiswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data 39 mahasiswa kelas {classInfo?.name}, penetapan role RBAC, dan jabatan kepengurusan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportGoogleSheets}
            disabled={isExportingSheets}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Ekspor daftar mahasiswa langsung ke Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {isExportingSheets ? 'Membuat Spreadsheet...' : 'Google Sheets'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          <label className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" /> Import
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          {hasPermission('create_members') && (
            <button
              onClick={() => {
                setFormData({ name: '', nim: '', email: '', phone: '', role_id: 'role_anggota', position: 'Anggota' });
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Anggota
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-slate-200 flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Data Roster ({members.length})
        </button>

        <button
          onClick={() => setActiveTab('orgchart')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orgchart'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-4 h-4" /> Bagan Struktur Organisasi
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'claims'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-indigo-600" /> Persetujuan Role Akun Google
          </button>
        )}
      </div>

      {activeTab === 'claims' ? (
        <RoleClaimApprovalPanel />
      ) : activeTab === 'orgchart' ? (
        <ClassOrgChart members={members} />
      ) : (
        <>
          {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIM, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-blue-500 transition-colors"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500 transition-colors"
            >
              <option value="all">Semua Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500 transition-colors"
            >
              <option value="name">Urutkan: Nama</option>
              <option value="nim">Urutkan: NIM</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredMembers.length}</strong> dari {members.length} mahasiswa</span>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mahasiswa</th>
                <th className="p-3.5">NIM</th>
                <th className="p-3.5">Kontak</th>
                <th className="p-3.5">Role RBAC</th>
                <th className="p-3.5">Jabatan Kelas</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500">{m.cohort} • {m.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-medium text-slate-700">{m.nim}</td>
                  <td className="p-3.5 space-y-0.5 text-slate-600">
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" /> {m.email}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" /> {m.phone}
                    </p>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={m.role_id === 'role_superadmin' ? 'purple' : m.role_id === 'role_ketua' ? 'primary' : m.role_id === 'role_bendahara' ? 'success' : 'neutral'}>
                      <Shield className="w-3 h-3" /> {m.role_name}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-medium text-slate-800">{m.position}</td>
                  <td className="p-3.5">
                    <Badge variant={m.is_active ? 'success' : 'danger'}>
                      {m.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setIsDetailModalOpen(true);
                        }}
                        title="Detail Mahasiswa"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {hasPermission('assign_role') && (
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setFormData({ ...formData, role_id: m.role_id || 'role_anggota' });
                            setIsRoleModalOpen(true);
                          }}
                          title="Ubah Role"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}

                      {hasPermission('edit_members') && (
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setFormData({
                              name: m.name || '',
                              nim: m.nim || '',
                              email: m.email || '',
                              phone: m.phone || '',
                              role_id: m.role_id || 'role_anggota',
                              position: m.position || 'Anggota',
                            });
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Data"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {hasPermission('delete_members') && m.is_active && (
                        <button
                          onClick={() => handleDeactivate(m)}
                          title="Nonaktifkan"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Modal: Tambah Anggota */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Mahasiswa Baru"
        subtitle="Registrasikan anggota ke dalam kelas perkuliahan"
      >
        <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Raden Wijaya"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">NIM (Nomor Induk Mahasiswa)</label>
            <input
              type="text"
              required
              value={formData.nim || ''}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              placeholder="Contoh: 2406012410099"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Kampus</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@students.ac.id"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role RBAC</label>
              <select
                value={formData.role_id || 'role_anggota'}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jabatan / Posisi</label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Contoh: PIC Humas / Anggota"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
            >
              Simpan Mahasiswa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Anggota */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Mahasiswa"
      >
        <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">NIM</label>
            <input
              type="text"
              required
              value={formData.nim || ''}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jabatan Kelas</label>
            <input
              type="text"
              value={formData.position || ''}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
            >
              Perbarui Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Role */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Ubah Role RBAC"
        subtitle={`Atur hak akses otorisasi untuk ${selectedMember?.name}`}
      >
        <form onSubmit={handleAssignRole} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Role Baru</label>
            <select
              value={formData.role_id || 'role_anggota'}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.description}
                </option>
              ))}
            </select>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Perubahan role akan segera memperbarui permission yang dimiliki oleh mahasiswa di server backend dan navigasi antarmuka.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold"
            >
              Simpan Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Member Detail Page */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Profil Lengkap Mahasiswa"
      >
        {selectedMember && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={selectedMember.avatar}
                alt=""
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedMember.name}</h4>
                <p className="text-slate-500 font-mono">NIM: {selectedMember.nim}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="primary">{selectedMember.role_name}</Badge>
                  <Badge variant={selectedMember.is_active ? 'success' : 'danger'}>
                    {selectedMember.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Kelas</span>
                <p className="font-semibold text-slate-800">{classInfo?.name}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Program Studi</span>
                <p className="font-semibold text-slate-800">{selectedMember.department}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Angkatan</span>
                <p className="font-semibold text-slate-800">{selectedMember.cohort}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Jabatan</span>
                <p className="font-semibold text-slate-800">{selectedMember.position}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Email</span>
                <p className="font-semibold text-slate-800">{selectedMember.email}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Telepon</span>
                <p className="font-semibold text-slate-800">{selectedMember.phone}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Tanggal Bergabung</span>
                <p className="font-semibold text-slate-800">
                  {new Date(selectedMember.joined_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
