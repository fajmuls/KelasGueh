import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Role, Permission, PermissionCode } from '../../../types/index.ts';
import {
  Shield,
  Plus,
  Check,
  Edit2,
  Lock,
  KeyRound,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const RolesModule: React.FC = () => {
  const { refreshAuth } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditMatrixModalOpen, setIsEditMatrixModalOpen] = useState(false);
  const [activePermissions, setActivePermissions] = useState<PermissionCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New role form
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rList, pList] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
      ]);
      setRoles(rList);
      setPermissions(pList);
      if (!selectedRole && rList.length > 0) {
        setSelectedRole(rList[0]);
        setActivePermissions(rList[0].permissions);
      }
    } catch (err) {
      console.error('Error loading roles & permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (r: Role) => {
    setSelectedRole(r);
    setActivePermissions(r.permissions);
  };

  const handleTogglePermission = (code: PermissionCode) => {
    if (selectedRole?.id === 'role_superadmin') return; // Superadmin has all
    setActivePermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await api.updateRolePermissions(selectedRole.id, activePermissions);
      await loadData();
      await refreshAuth();
      alert(`Hak akses permission untuk role "${selectedRole.name}" berhasil diperbarui!`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui permissions');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRole({
        name: newRoleForm.name,
        description: newRoleForm.description,
        permissions: ['view_dashboard', 'view_agenda', 'view_announcements'],
      });
      setIsAddRoleModalOpen(false);
      setNewRoleForm({ name: '', description: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat role');
    }
  };

  // Group permissions by category/module
  const categories = Array.from(
    new Set(permissions.map((p) => p.category || 'Umum'))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-purple-600" /> Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi matriks hak akses otorisasi granular per modul: User → Role → Permissions → Actions.
          </p>
        </div>

        <button
          onClick={() => setIsAddRoleModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Buat Role Kustom Baru
        </button>
      </div>

      {/* 2 Column Layout: Role List on Left, Matrix on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Roles list */}
        <div className="space-y-3">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Daftar Role ({roles.length})
            </h3>
            <div className="space-y-1.5 mt-2">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 shadow-2xs'
                        : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                        {r.name}
                      </span>
                      {r.is_system && (
                        <span className="text-[10px] text-slate-400 font-medium">Bawaan</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant={isSelected ? 'purple' : 'neutral'} size="sm">
                        {r.id === 'role_superadmin' ? 'Akses Penuh' : `${r.permissions.length} Permission`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Permission Matrix Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Matriks Permission: {selectedRole?.name}
                  </h3>
                  {selectedRole?.id === 'role_superadmin' && (
                    <Badge variant="purple">Root Full Access</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole?.description}</p>
              </div>

              {selectedRole?.id !== 'role_superadmin' && (
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-center"
                >
                  <Check className="w-4 h-4" /> Simpan Perubahan Matriks
                </button>
              )}
            </div>

            {selectedRole?.id === 'role_superadmin' ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <Lock className="w-8 h-8 text-purple-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800">Super Administrator Memiliki Hak Akses Universal</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Semua permission di bawah aktif secara otomatis untuk menjaga integritas pengaturan root sistem.
                </p>
              </div>
            ) : null}

            {/* Permission Checklists Grouped by Module / Category */}
            <div className="space-y-6 pt-2">
              {categories.map((cat) => {
                const catPerms = permissions.filter((p) => (p.category || 'Umum') === cat);

                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      Modul {cat}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {catPerms.map((perm) => {
                        const isGranted =
                          selectedRole?.id === 'role_superadmin' ||
                          activePermissions.includes(perm.code);

                        return (
                          <div
                            key={perm.id || perm.code}
                            onClick={() => handleTogglePermission(perm.code)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isGranted
                                ? 'bg-purple-50/50 border-purple-200 hover:bg-purple-50'
                                : 'bg-slate-50/30 border-slate-200/70 hover:bg-slate-50 opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              disabled={selectedRole?.id === 'role_superadmin'}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800">{perm.name}</p>
                              <p className="text-[11px] text-slate-500 leading-tight">
                                {perm.description}
                              </p>
                              <code className="text-[10px] text-purple-700 font-mono block pt-0.5">
                                {perm.code}
                              </code>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add Role */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Buat Role RBAC Kustom Baru"
        subtitle="Misal: Koordinator Praktikum, Sie Perlengkapan, PJ Mata Kuliah"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Role</label>
            <input
              type="text"
              required
              placeholder="Contoh: Koordinator Praktikum Lab"
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-purple-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Tanggung Jawab</label>
            <textarea
              rows={3}
              placeholder="Jelaskan ruang lingkup wewenang role ini..."
              value={newRoleForm.description}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddRoleModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold"
            >
              Buat Role
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
