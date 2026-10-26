import React, { useState } from 'react';
import { StudentPointLog, KasMember, ClassSettings, CourseSchedule } from '../../../types/kas.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { ScotchTape, DoodleCrown } from '../DoodleDecorations.tsx';
import { showToast, showConfirm } from '../../UI/DoodleDialog.tsx';
import {
  Award,
  Plus,
  Search,
  Share2,
  Trash2,
  TrendingUp,
  Flame,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserCheck,
  BookOpen
} from 'lucide-react';

interface KeaktifanTabProps {
  pointLogs: StudentPointLog[];
  members: KasMember[];
  settings: ClassSettings;
  canEdit: boolean;
  courseSchedules?: CourseSchedule[];
  onAddPointLog: (log: Omit<StudentPointLog, 'id' | 'createdAt'>) => void;
  onDeletePointLog: (id: string) => void;
}

const PRESET_CATEGORIES = [
  { key: 'tanya', label: 'Bertanya di Kelas', points: 5, color: 'bg-sky-100 text-sky-800 border-sky-400' },
  { key: 'presentasi', label: 'Presentasi Materi', points: 10, color: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
  { key: 'menjawab', label: 'Menjawab Pertanyaan', points: 5, color: 'bg-amber-100 text-amber-800 border-amber-400' },
  { key: 'inisiatif', label: 'Inisiatif Diskusi', points: 10, color: 'bg-purple-100 text-purple-800 border-purple-400' },
  { key: 'tugas', label: 'Tugas Tepat Waktu', points: 5, color: 'bg-blue-100 text-blue-800 border-blue-400' },
  { key: 'terlambat', label: 'Terlambat Masuk Sesi', points: -5, color: 'bg-rose-100 text-rose-800 border-rose-400' },
  { key: 'lainnya', label: 'Aktivitas Khusus (Kustom)', points: 5, color: 'bg-slate-100 text-slate-800 border-slate-400' },
] as const;

export const KeaktifanTab: React.FC<KeaktifanTabProps> = ({
  pointLogs,
  members,
  settings,
  canEdit,
  courseSchedules = [],
  onAddPointLog,
  onDeletePointLog
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'leaderboard' | 'logs'>('leaderboard');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<typeof PRESET_CATEGORIES[number]['key']>('tanya');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<number>(5);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Aggregate points per member (filtered by course if selected)
  const memberScores = members.map(m => {
    const logs = pointLogs.filter(l => {
      const matchMember = l.memberId === m.id;
      const matchCourse = selectedCourseFilter === 'all' || l.courseId === selectedCourseFilter;
      return matchMember && matchCourse;
    });
    const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);
    return {
      member: m,
      totalPoints,
      logCount: logs.length
    };
  });

  // Sort descending by total points
  memberScores.sort((a, b) => b.totalPoints - a.totalPoints);

  const topThree = memberScores.slice(0, 3);

  const handleCategoryChange = (key: typeof PRESET_CATEGORIES[number]['key']) => {
    setSelectedCategory(key);
    const found = PRESET_CATEGORIES.find(c => c.key === key);
    if (found && key !== 'lainnya') {
      setCustomPoints(found.points);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      showToast('Pilih nama siswa terlebih dahulu.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Tuliskan alasan / keterangan poin.', 'error');
      return;
    }

    sfx.playSuccess();
    onAddPointLog({
      memberId: selectedMemberId,
      points: customPoints,
      category: selectedCategory,
      courseId: formCourseId || undefined,
      reason: reason.trim(),
      date,
      recordedBy: 'Sekretaris'
    });

    const studentName = members.find(m => m.id === selectedMemberId)?.name || 'Siswa';
    showToast(`Poin ${customPoints > 0 ? '+' : ''}${customPoints} berhasil dicatat untuk ${studentName}!`, 'success');
    setIsAddModalOpen(false);
    setReason('');
  };

  const handleDeleteLog = async (id: string) => {
    if (!canEdit) return;
    const ok = await showConfirm({
      title: 'Hapus Log Keaktifan?',
      message: 'Apakah Anda yakin ingin membatalkan dan menghapus catatan poin ini?',
      confirmLabel: 'Hapus Poin',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playDelete();
      onDeletePointLog(id);
      showToast('Catatan poin berhasil dihapus.', 'info');
    }
  };

  const handleCopyWhatsAppLeaderboard = () => {
    sfx.playClick();
    const topList = memberScores
      .filter(ms => ms.totalPoints > 0)
      .slice(0, 10)
      .map((ms, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        return `${medal} *${ms.member.name}* — ${ms.totalPoints} Poin (${ms.logCount}x keaktifan)`;
      })
      .join('\n');

    const message =
      `🏆 *KLASEMEN POIN KEAKTIFAN KELAS*\n` +
      `*${settings.className}*\n\n` +
      `Berikut adalah update peringkat mahasiswa teraktif saat ini:\n\n` +
      (topList || '- Belum ada poin keaktifan yang dicatat -') +
      `\n\nTetap semangat aktif bertanya, presentasi, dan berdiskusi! ✨\n` +
      `_— Dicatat via Sekretariat Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Klasemen poin berhasil disalin untuk WhatsApp!', 'success');
  };

  const filteredScores = memberScores.filter(ms => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ms.member.name.toLowerCase().includes(q) || ms.member.studentId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Action */}
      <div className="card-doodle bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-sky-200 text-slate-900 border border-slate-900 rounded">
                Ranah Sekretaris
              </span>
              <span className="text-xs font-bold text-slate-500">
                Apresiasi Partisipasi Siswa
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Poin Keaktifan & Leaderboard</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Catat setiap keaktifan siswa (bertanya, presentasi, menjawab pertanyaan, atau inisiatif diskusi) untuk motivasi dan transparansi nilai keaktifan kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyWhatsAppLeaderboard}
              className="btn-doodle px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Salin Klasemen WA</span>
            </button>

            {canEdit && (
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsAddModalOpen(true);
                }}
                className="btn-doodle px-4 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Catat Poin Siswa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Podium Top 3 (if members exist) */}
      {topThree.length > 0 && topThree[0].totalPoints > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topThree.map((item, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            const bgClass = isFirst
              ? 'bg-amber-100 border-amber-500'
              : isSecond
              ? 'bg-slate-100 border-slate-400'
              : 'bg-orange-50 border-orange-400';

            const crownColor = isFirst ? 'text-amber-500' : isSecond ? 'text-slate-400' : 'text-amber-700';

            return (
              <div
                key={item.member.id}
                className={`card-doodle p-4 rounded-xl border-2 ${bgClass} shadow-[3px_3px_0px_#1E293B] flex items-center gap-3 relative`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center font-black text-sm shrink-0 shadow-[1px_1px_0px_#1E293B]">
                  {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {item.member.name}
                    </p>
                    {isFirst && <DoodleCrown className={`w-3.5 h-3.5 ${crownColor}`} />}
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium">
                    {item.logCount}x partisipasi
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-amber-900 font-mono">
                    +{item.totalPoints}
                  </span>
                  <p className="text-[9px] uppercase font-bold text-slate-500">Poin</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-view switcher & Course Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              sfx.playToggle();
              setActiveSubView('leaderboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              activeSubView === 'leaderboard'
                ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Papan Klasemen Siswa
          </button>
          <button
            onClick={() => {
              sfx.playToggle();
              setActiveSubView('logs');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
              activeSubView === 'logs'
                ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Riwayat Log Poin</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white border border-slate-400 rounded-full font-bold">
              {pointLogs.length}
            </span>
          </button>

          {/* Course filter if schedules exist */}
          {courseSchedules.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 border border-slate-900 rounded-lg">
              <BookOpen className="w-3.5 h-3.5 text-slate-600 ml-1" />
              <select
                value={selectedCourseFilter}
                onChange={e => {
                  sfx.playClick();
                  setSelectedCourseFilter(e.target.value);
                }}
                className="bg-transparent font-bold text-xs text-slate-800 focus:outline-hidden pr-2 cursor-pointer"
              >
                <option value="all">Semua Mata Kuliah</option>
                {courseSchedules.map(c => (
                  <option key={c.id} value={c.id}>{c.courseName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeSubView === 'leaderboard' && (
          <div className="relative max-w-xs w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-slate-400 bg-white focus:bg-amber-50 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: LEADERBOARD TABLE */}
      {activeSubView === 'leaderboard' && (
        <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFDF5] border-b-2 border-slate-900 font-black text-slate-700">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-4">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIM / No Absen</th>
                  <th className="py-2.5 px-3 text-center">Frekuensi</th>
                  <th className="py-2.5 px-4 text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredScores.map((ms, idx) => (
                  <tr key={ms.member.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-black text-slate-900">
                      {ms.member.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {ms.member.studentId || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                      {ms.logCount}x
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-black border ${
                        ms.totalPoints > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}>
                        {ms.totalPoints} Poin
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredScores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      Belum ada siswa yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: LOGS FEED */}
      {activeSubView === 'logs' && (
        <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] overflow-hidden">
          <div className="divide-y divide-slate-200">
            {pointLogs.map(log => {
              const student = members.find(m => m.id === log.memberId);
              const catObj = PRESET_CATEGORIES.find(c => c.key === log.category);

              return (
                <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${catObj?.color || 'bg-slate-100'}`}>
                        {catObj?.label || log.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {log.date}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-900">
                      {student?.name || 'Siswa'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {log.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-black font-mono px-2 py-0.5 rounded border ${
                      log.points > 0
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                        : 'bg-rose-100 text-rose-800 border-rose-400'
                    }`}>
                      {log.points > 0 ? `+${log.points}` : log.points}
                    </span>

                    {canEdit && (
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="btn-doodle p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-300"
                        title="Hapus log poin ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {pointLogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada catatan aktivitas poin keaktifan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Catat Poin Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="card-doodle bg-white w-full max-w-lg rounded-2xl border-3 border-slate-900 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Catat Poin Keaktifan Siswa</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Siswa <span className="text-rose-500">*</span></label>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.studentId ? `(${m.studentId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {courseSchedules.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Terkait Mata Kuliah (Opsional)</label>
                  <select
                    value={formCourseId}
                    onChange={e => setFormCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  >
                    <option value="">Umum / Tidak Terikat Matkul Khusus</option>
                    {courseSchedules.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseName} ({c.lecturerName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Kategori Aktivitas</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        type="button"
                        key={cat.key}
                        onClick={() => handleCategoryChange(cat.key)}
                        className={`p-2 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-amber-300 border-slate-900 text-slate-900 font-black shadow-[1px_1px_0px_#000]'
                            : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{cat.label}</span>
                          <span className="font-mono font-bold text-[10px]">
                            {cat.points > 0 ? `+${cat.points}` : cat.points}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Besaran Poin</label>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={e => setCustomPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Keterangan / Alasan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bertanya kritis terkait arsitektur microservices"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 bg-amber-50/50 font-bold focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-doodle px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000]"
                >
                  Simpan Catatan Poin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
