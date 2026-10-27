import React, { useState, useMemo } from 'react';
import { KasMember, CourseSchedule, CourseAssignment } from '../../../types/kas.ts';
import { LocalKasRepository } from '../../../services/supabaseClient.ts';
import { autoDetectGenderByName } from '../../../utils/userManagement.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { toTitleCase } from '../../../utils/textFormatting.ts';
import { showToast } from '../../UI/DoodleDialog.tsx';
import {
  Users,
  Shuffle,
  Send,
  Check,
  UserCheck,
  Scale,
  Lock,
  RefreshCw,
  BookOpen,
  Edit2,
  Calendar,
  ClipboardList,
  Plus
} from 'lucide-react';

interface KelompokTabProps {
  members: KasMember[];
  courseSchedules?: CourseSchedule[];
  onAddAssignment?: (courseId: string, assignment: Omit<CourseAssignment, 'id'>) => void;
}

export const KelompokTab: React.FC<KelompokTabProps> = ({
  members,
  courseSchedules = [],
  onAddAssignment
}) => {
  const [numGroups, setNumGroups] = useState<number>(4);
  const [mode, setMode] = useState<'campur' | 'seimbang_gender'>('seimbang_gender');
  const [seed, setSeed] = useState<number>(() => {
    const saved = localStorage.getItem('kelasgue_kelompok_seed');
    return saved ? Number(saved) : 0;
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem('kelasgue_kelompok_locked') === 'true';
  });

  // Course selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return courseSchedules.length > 0 ? courseSchedules[0].id : 'custom';
  });
  const [customCourseName, setCustomCourseName] = useState<string>('Matematika');

  // Custom group names & project tasks
  const [groupCustomNames, setGroupCustomNames] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('kelasgue_kelompok_names');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [groupTasks, setGroupTasks] = useState<Record<number, { title: string; deadline: string }>>(() => {
    try {
      const saved = localStorage.getItem('kelasgue_kelompok_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  // Active course name
  const currentCourseName = useMemo(() => {
    if (selectedCourseId !== 'custom') {
      const c = courseSchedules.find(item => item.id === selectedCourseId);
      if (c) return c.courseName;
    }
    return customCourseName.trim() || 'Mata Kuliah';
  }, [selectedCourseId, courseSchedules, customCourseName]);

  // Filter only active students
  const activeMembers = useMemo(() => {
    return members
      .filter(m => m.isActive !== false)
      .map(m => ({
        ...m,
        name: toTitleCase(m.name),
        gender: m.gender || autoDetectGenderByName(m.name)
      }));
  }, [members]);

  const males = useMemo(() => activeMembers.filter(m => m.gender === 'L'), [activeMembers]);
  const females = useMemo(() => activeMembers.filter(m => m.gender === 'P'), [activeMembers]);

  // Divide into groups based on seed and mode
  const groups = useMemo(() => {
    if (activeMembers.length === 0 || numGroups < 1) return [];

    const groupList: Array<{ id: number; name: string; members: typeof activeMembers }> = [];
    for (let i = 0; i < numGroups; i++) {
      const gId = i + 1;
      const defaultName = `Kelompok ${currentCourseName} ${gId}`;
      const name = groupCustomNames[gId] || defaultName;
      groupList.push({ id: gId, name, members: [] });
    }

    // Deterministic shuffle using seed
    const customShuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      let currentIndex = copy.length;
      let temporaryValue, randomIndex;
      let localSeed = seed + 123;
      while (currentIndex !== 0) {
        localSeed = (localSeed * 9301 + 49297) % 233280;
        randomIndex = Math.floor((localSeed / 233280) * currentIndex);
        currentIndex -= 1;
        temporaryValue = copy[currentIndex];
        copy[currentIndex] = copy[randomIndex];
        copy[randomIndex] = temporaryValue;
      }
      return copy;
    };

    if (mode === 'campur') {
      const shuffled = customShuffle(activeMembers);
      shuffled.forEach((member, index) => {
        const groupIndex = index % numGroups;
        groupList[groupIndex].members.push(member);
      });
    } else {
      // Seimbang Gender
      const shuffledMales = customShuffle(males);
      const shuffledFemales = customShuffle(females);

      shuffledMales.forEach((male, index) => {
        const groupIndex = index % numGroups;
        groupList[groupIndex].members.push(male);
      });

      shuffledFemales.forEach((female, index) => {
        const groupIndex = numGroups - 1 - (index % numGroups);
        groupList[groupIndex].members.push(female);
      });
    }

    return groupList;
  }, [activeMembers, numGroups, mode, seed, males, females, currentCourseName, groupCustomNames]);

  const handleGenerateOrShuffle = () => {
    sfx.playOptionSelect();
    const newSeed = Date.now();
    setSeed(newSeed);
    setIsLocked(true);
    localStorage.setItem('kelasgue_kelompok_seed', String(newSeed));
    localStorage.setItem('kelasgue_kelompok_locked', 'true');
  };

  const handleResetLock = () => {
    sfx.playDeleteConfirm();
    setIsLocked(false);
    localStorage.removeItem('kelasgue_kelompok_locked');
  };

  const handleRenameGroup = (groupId: number, newName: string) => {
    const updated = { ...groupCustomNames, [groupId]: newName };
    setGroupCustomNames(updated);
    localStorage.setItem('kelasgue_kelompok_names', JSON.stringify(updated));
  };

  const handleUpdateGroupTask = (groupId: number, field: 'title' | 'deadline', value: string) => {
    const current = groupTasks[groupId] || { title: '', deadline: '' };
    const updated = {
      ...groupTasks,
      [groupId]: { ...current, [field]: value }
    };
    setGroupTasks(updated);
    localStorage.setItem('kelasgue_kelompok_tasks', JSON.stringify(updated));
  };

  const handleSyncTaskToSchedule = (group: { id: number; name: string; members: typeof activeMembers }) => {
    const task = groupTasks[group.id];
    if (!task || !task.title.trim()) {
      showToast('Mohon isi judul tugas / proyek kelompok terlebih dahulu!', 'error');
      return;
    }

    // Determine target courseId
    let targetCourseId = selectedCourseId;
    if (targetCourseId === 'custom' || !courseSchedules.some(c => c.id === targetCourseId)) {
      // Create new course schedule if not exists
      const newCourse = LocalKasRepository.saveCourseSchedule({
        courseName: currentCourseName,
        lecturerName: 'Dosen Pengampu',
        sks: 3,
        day: 'Fleksibel',
        time: 'Sesuai Jadwal',
        assignments: []
      });
      targetCourseId = newCourse.id;
    }

    const memberNames = group.members.map(m => m.name).join(', ');
    const assignmentPayload: Omit<CourseAssignment, 'id'> = {
      title: `[${group.name}] ${task.title.trim()}`,
      deadline: task.deadline || new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: `Anggota (${group.members.length}): ${memberNames}`
    };

    if (onAddAssignment) {
      onAddAssignment(targetCourseId, assignmentPayload);
    } else {
      LocalKasRepository.addCourseAssignment(targetCourseId, assignmentPayload);
    }

    sfx.playLevelUp();
    showToast(`✓ Tugas proyek "${group.name}" berhasil dicatat ke menu Jadwal & Tugas!`, 'success');
  };

  const handleSendWhatsApp = () => {
    sfx.playFileDownload();
    let text = `📌 *PEMBAGIAN KELOMPOK - ${currentCourseName.toUpperCase()}*\n`;
    text += `Mode: ${mode === 'seimbang_gender' ? '⚖️ Seimbang Gender (L/P)' : '🎲 Acak Campur'}\n`;
    text += `Total Anggota Aktif: ${activeMembers.length} Siswa\n\n`;

    groups.forEach(g => {
      text += `*${g.name.toUpperCase()}* (${g.members.length} Orang)\n`;
      const task = groupTasks[g.id];
      if (task?.title) {
        text += `🎯 *Tugas/Proyek:* ${task.title} (Deadline: ${task.deadline || '-'})\n`;
      }
      g.members.forEach((m, idx) => {
        const gBadge = m.gender === 'P' ? '[P]' : '[L]';
        text += `${idx + 1}. ${toTitleCase(m.name)} ${gBadge}\n`;
      });
      text += `\n`;
    });

    text += `_Dibuat otomatis via Aplikasi Kelas Gue_ ✨`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amber-100 border-3 border-slate-900 rounded-xl p-3.5 sm:p-4 shadow-[4px_4px_0px_#000] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center border-2 border-slate-900 font-black shrink-0 shadow-[2px_2px_0px_#000]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                Generator Pembagian Kelompok & Proyek Kelas
              </h3>
              <p className="text-[11px] text-slate-700 font-medium">
                Pilih mata kuliah, acak tim seimbang gender, serta catat proyek langsung ke Jadwal & Tugas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleSendWhatsApp}
              disabled={groups.length === 0}
              className="btn-doodle px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xs flex items-center gap-1.5 border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-emerald-950" />
              <span>Kirim WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Matkul Selection, Jumlah Kelompok, Mode, Shuffle */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_#000] space-y-4">
        {/* Pilih Mata Kuliah */}
        <div className="p-3 bg-amber-50/70 border-2 border-slate-900 rounded-xl space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-700" />
            <span>Pilih Mata Kuliah / Pelajaran:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg focus:outline-none"
            >
              {courseSchedules.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseName} ({c.day}, {c.sks} SKS)
                </option>
              ))}
              <option value="custom">+ Ketik Mata Kuliah Manual...</option>
            </select>

            {selectedCourseId === 'custom' && (
              <input
                type="text"
                value={customCourseName}
                disabled={isLocked}
                onChange={(e) => setCustomCourseName(e.target.value)}
                placeholder="Contoh: Matematika Diskrit, Desain Web..."
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-900 rounded-lg focus:outline-none bg-white"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jumlah Kelompok (3 to 10) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              Jumlah Kelompok (3 - 10): <span className="text-amber-600 text-sm font-black">{numGroups} Kelompok</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  disabled={isLocked}
                  onClick={() => {
                    sfx.playOptionSelect();
                    setNumGroups(n);
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-black border-2 border-slate-900 transition flex items-center justify-center ${
                    numGroups === n
                      ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                      : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                  } ${isLocked ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Distribusi */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              Metode Distribusi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isLocked}
                onClick={() => {
                  sfx.playOptionSelect();
                  setMode('seimbang_gender');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black border-2 border-slate-900 flex items-center justify-center gap-1.5 transition ${
                  mode === 'seimbang_gender'
                    ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                } ${isLocked ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <Scale className="w-3.5 h-3.5" />
                Seimbang Gender (L/P)
              </button>

              <button
                disabled={isLocked}
                onClick={() => {
                  sfx.playOptionSelect();
                  setMode('campur');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black border-2 border-slate-900 flex items-center justify-center gap-1.5 transition ${
                  mode === 'campur'
                    ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                } ${isLocked ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Acak Campur Full
              </button>
            </div>
          </div>
        </div>

        {/* Shuffle / Generate Button placed BELOW distribution mode */}
        <div className="pt-3 border-t-2 border-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-700 font-bold">
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-blue-600" /> Laki-laki: <strong>{males.length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-pink-600" /> Perempuan: <strong>{females.length}</strong>
            </span>
            <span className="text-slate-400">·</span>
            <span className="italic text-slate-500">Aktif: {activeMembers.length} Siswa</span>
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <button
                onClick={handleResetLock}
                className="btn-doodle px-4 py-2 bg-rose-200 hover:bg-rose-300 text-rose-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
                title="Buka kunci untuk melakukan generate / acak ulang kelompok"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Buka Kunci (Reset Acak)</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateOrShuffle}
                className="btn-doodle px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Generate & Kunci Kelompok</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group) => {
          const groupMales = group.members.filter(m => m.gender === 'L').length;
          const groupFemales = group.members.filter(m => m.gender === 'P').length;
          const isRenaming = editingGroupId === group.id;
          const task = groupTasks[group.id] || { title: '', deadline: '' };

          return (
            <div
              key={group.id}
              className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[3px_3px_0px_#000] flex flex-col justify-between hover:translate-y-[-2px] transition"
            >
              <div>
                {/* Header Group: ID, Name (Inline editable), Member Count */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3 gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-amber-300 border-2 border-slate-900 text-slate-900 font-black text-xs flex items-center justify-center shadow-[1px_1px_0px_#000] shrink-0">
                      #{group.id}
                    </span>
                    {isRenaming ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                          className="px-2 py-0.5 text-xs font-black border-2 border-slate-900 rounded bg-amber-50 w-full"
                          autoFocus
                          onBlur={() => setEditingGroupId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingGroupId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditingGroupId(null)}
                          className="p-1 bg-emerald-300 text-slate-900 rounded border border-slate-900"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                          {group.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingGroupId(group.id)}
                          className="p-1 text-slate-500 hover:text-slate-900 transition"
                          title="Ubah nama kelompok"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border-2 border-slate-900 bg-amber-100 text-amber-950 shrink-0">
                    {group.members.length} Orang
                  </span>
                </div>

                {/* Member List */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar mb-3">
                  {group.members.map((m, idx) => (
                    <div
                      key={m.id}
                      className="text-xs py-1 px-2.5 rounded-lg bg-amber-50/60 border border-slate-900 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-900 truncate">
                        {idx + 1}. {toTitleCase(m.name)}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded border border-slate-900 shrink-0 ${
                          m.gender === 'P'
                            ? 'bg-pink-200 text-pink-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {m.gender === 'P' ? 'P' : 'L'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tugas / Proyek Kelompok Box */}
                <div className="p-2.5 bg-slate-50 border-2 border-dashed border-slate-400 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-700 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3 text-indigo-600" />
                      <span>Proyek / Tugas Kelompok:</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => handleUpdateGroupTask(group.id, 'title', e.target.value)}
                    placeholder="Judul Proyek (contoh: Makalah Bab 3)..."
                    className="w-full px-2 py-1 text-xs border border-slate-900 rounded bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={task.deadline}
                      onChange={(e) => handleUpdateGroupTask(group.id, 'deadline', e.target.value)}
                      className="px-2 py-1 text-[11px] border border-slate-900 rounded bg-white flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleSyncTaskToSchedule(group)}
                      className="btn-doodle px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] rounded flex items-center gap-1 shadow-sm shrink-0"
                      title="Simpan tugas ini ke menu Jadwal & Tugas kelas"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ke Jadwal Tugas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Ratio */}
              <div className="mt-3 pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-700 font-bold">
                <span>Rasio L/P:</span>
                <span className="font-black text-slate-900">
                  {groupMales} 👦 | {groupFemales} 👧
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
