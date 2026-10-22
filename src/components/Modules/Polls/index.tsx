import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Poll } from '../../../types/index.ts';
import {
  Vote,
  Plus,
  Clock,
  CheckCircle2,
  Lock,
  Globe,
  Trash2,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const PollsModule: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    question: '',
    description: '',
    options: ['', '', ''],
    deadline: '2026-09-20',
    is_anonymous: false,
  });

  const loadPolls = async () => {
    try {
      setIsLoading(true);
      const list = await api.getPolls();
      setPolls(list);
    } catch (err) {
      console.error('Error loading polls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await api.votePoll(pollId, optionId);
      await loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal memberikan suara');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = formData.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      alert('Minimal masukkan 2 opsi pilihan voting!');
      return;
    }
    try {
      await api.createPoll({
        question: formData.question,
        description: formData.description,
        options: validOptions,
        deadline: formData.deadline,
        is_anonymous: formData.is_anonymous,
      });
      setIsAddModalOpen(false);
      setFormData({
        question: '',
        description: '',
        options: ['', '', ''],
        deadline: '2026-09-20',
        is_anonymous: false,
      });
      await loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat polling');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Vote className="w-5 h-5 text-indigo-600" /> Voting & Musyawarah Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengambilan keputusan mufakat kelas: jadwal kuliah pengganti, jaket kelas, dan destinasi makrab.
          </p>
        </div>

        {hasPermission('create_polls') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Voting Baru
          </button>
        )}
      </div>

      {/* Poll Cards */}
      <div className="space-y-4">
        {polls.map((p) => {
          const hasVoted = p.voted_users?.includes(user?.id || '');
          const totalVotes = p.total_votes || 1;

          return (
            <div
              key={p.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{p.question}</h3>
                    <Badge variant={p.is_active ? 'success' : 'neutral'}>
                      {p.is_active ? 'Sedang Berjalan' : 'Selesai'}
                    </Badge>
                    {p.is_anonymous ? (
                      <Badge variant="purple">
                        <Lock className="w-3 h-3" /> Anonim
                      </Badge>
                    ) : (
                      <Badge variant="neutral">
                        <Globe className="w-3 h-3" /> Publik
                      </Badge>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-slate-600">{p.description}</p>}
                </div>

                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  Batas: {p.deadline || 'Tidak ada'}
                </span>
              </div>

              {/* Voting Options & Results */}
              <div className="space-y-2.5">
                {p.options.map((opt) => {
                  const percent = Math.round((opt.votes_count / totalVotes) * 100) || 0;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !hasVoted && p.is_active && handleVote(p.id, opt.id)}
                      className={`p-3 rounded-xl border transition-all relative overflow-hidden ${
                        !hasVoted && p.is_active
                          ? 'hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer border-slate-200'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      {/* Fill bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-100/60 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />

                      <div className="relative flex items-center justify-between z-10 text-xs">
                        <span className="font-semibold text-slate-800">{opt.text}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">
                            {opt.votes_count} Suara ({percent}%)
                          </span>
                          {!hasVoted && p.is_active && (
                            <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px]">
                              Pilih
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Partisipasi: <strong>{p.total_votes}</strong> Mahasiswa</span>
                {hasVoted ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Anda telah memberikan suara
                  </span>
                ) : p.is_active ? (
                  <span className="text-indigo-600 font-medium">Klik salah satu opsi di atas untuk memilih</span>
                ) : (
                  <span className="text-slate-400">Voting telah ditutup</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Poll */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Polling / Voting Kelas"
        subtitle="Himpun suara dan aspirasi mahasiswa secara terstruktur"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pertanyaan / Topik</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kesepakatan Warna & Desain Jaket Angkatan"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan / Konteks</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan opsi atau konteks pemilihan..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Pilihan Opsi (Minimal 2)</label>
            {formData.options.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Opsi Pilihan ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const updated = [...formData.options];
                  updated[i] = e.target.value;
                  setFormData({ ...formData, options: updated });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
              className="text-blue-600 hover:underline font-semibold text-[11px]"
            >
              + Tambah Opsi Lainnya
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Voting</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold text-slate-700">
              Voting Bersifat Rahasia / Anonim (Identitas pemilih disembunyikan)
            </span>
          </label>

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
              Mulai Polling
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
