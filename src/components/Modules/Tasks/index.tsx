import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { TaskItem, User } from '../../../types/index.ts';
import {
  CheckSquare,
  Plus,
  Clock,
  UserCheck,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const TasksModule: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: 'usr_anggota_1',
    priority: 'medium',
    deadline: '2026-09-18',
  });

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const [tList, mList] = await Promise.all([
        api.getTasks(),
        api.getMembers(),
      ]);
      setTasks(tList);
      setMembers(mList);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);
  }, [tasks, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = members.find(m => m.id === formData.assignee_id);
    try {
      await api.createTask({
        ...formData,
        assignee_name: assignedUser?.name || 'Mahasiswa',
        status: 'pending',
      } as any);
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        description: '',
        assignee_id: members[0]?.id || '',
        priority: 'medium',
        deadline: '2026-09-18',
      });
      await loadTasks();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan tugas');
    }
  };

  const handleUpdateStatus = async (task: TaskItem, newStatus: string) => {
    try {
      await api.updateTask(task.id, { status: newStatus as any });
      await loadTasks();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus tugas ini?')) {
      try {
        await api.deleteTask(id);
        await loadTasks();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus tugas');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" /> Manajemen Tugas & Penugasan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau beban penugasan pengurus, koordinasi kepanitiaan kelas, dan tenggat waktu tugas.
          </p>
        </div>

        {hasPermission('create_tasks') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Berikan Tugas Baru
          </button>
        )}
      </div>

      {/* Status Filter Bar */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 mr-2">Status:</span>
        {[
          { id: 'all', label: `Semua (${tasks.length})` },
          { id: 'pending', label: `Belum Mulai (${tasks.filter(t => t.status === 'pending').length})` },
          { id: 'in_progress', label: `Dikerjakan (${tasks.filter(t => t.status === 'in_progress').length})` },
          { id: 'completed', label: `Selesai (${tasks.filter(t => t.status === 'completed').length})` },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterStatus(s.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              filterStatus === s.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-indigo-200 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant={
                    t.priority === 'high'
                      ? 'danger'
                      : t.priority === 'medium'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  Prioritas: {t.priority}
                </Badge>
                {hasPermission('delete_tasks') && (
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  {t.assignee_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {t.deadline}
                </span>
              </div>

              {/* Status Updater */}
              <div className="flex items-center gap-1.5 pt-1">
                {(['pending', 'in_progress', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(t, st)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer text-center ${
                      t.status === st
                        ? st === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : st === 'in_progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'completed' ? 'Selesai' : st === 'in_progress' ? 'Proses' : 'Pending'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Task */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tugaskan Tugas Baru"
        subtitle="Berikan tanggung jawab tugas kepada anggota atau pengurus kelas"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Tugas</label>
            <input
              type="text"
              required
              placeholder="Contoh: Cetak Buklet Acara & Rundown"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Penerima Tugas (Assignee)</label>
            <select
              value={formData.assignee_id}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.position})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Prioritas</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High / Urgent)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Waktu (Deadline)</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Rinci</label>
            <textarea
              rows={3}
              placeholder="Jelaskan deliverable dan instruksi pengerjaan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
            >
              Tugaskan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
