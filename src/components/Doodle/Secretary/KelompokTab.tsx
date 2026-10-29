import React, { useState, useMemo, useEffect } from 'react';
import { KasMember, CourseSchedule, CourseAssignment } from '../../../types/kas.ts';
import { LocalKasRepository } from '../../../services/supabaseClient.ts';
import { autoDetectGenderByName } from '../../../utils/userManagement.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { toTitleCase } from '../../../utils/textFormatting.ts';
import { showToast, showConfirm } from '../../UI/DoodleDialog.tsx';
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
  Plus,
  Sparkles,
  Save,
  CheckSquare,
  Square,
  ExternalLink,
  Trash2,
  UserPlus,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface SavedGroupItem {
  id: number;
  name: string;
  members: Array<{ id: string; name: string; studentId?: string; gender?: 'L' | 'P' }>;
  isCompleted?: boolean;
  submissionUrl?: string;
}

export interface SavedGroupCollection {
  id: string;
  courseName: string;
  taskTitle: string;
  taskDeadline: string;
  savedAt: string;
  groups: SavedGroupItem[];
}

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
  const [distributionType, setDistributionType] = useState<'auto' | 'manual'>('auto');
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
    const saved = localStorage.getItem('kelasgue_kelompok_course_id');
    if (saved) return saved;
    return courseSchedules.length > 0 ? courseSchedules[0].id : 'custom';
  });
  const [customCourseName, setCustomCourseName] = useState<string>(() => {
    return localStorage.getItem('kelasgue_kelompok_custom_course') || 'Matematika Diskrit';
  });

  // Unified course project task
  const [unifiedCourseTasks, setUnifiedCourseTasks] = useState<Record<string, { title: string; deadline: string }>>(() => {
    try {
      const saved = localStorage.getItem('kelasgue_kelompok_unified_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom group names
  const [groupCustomNames, setGroupCustomNames] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('kelasgue_kelompok_names');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Manual group assignment mapping: groupId -> memberId[]
  const [manualAssignments, setManualAssignments] = useState<Record<number, string[]>>(() => {
    try {
      const saved = localStorage.getItem('kelasgue_kelompok_manual');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Saved group collections archive & search/collapse states
  const [savedCollections, setSavedCollections] = useState<SavedGroupCollection[]>(() => {
    try {
      const saved = localStorage.getItem('kelasgue_saved_group_collections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [collapsedCollections, setCollapsedCollections] = useState<Record<string, boolean>>({});

  const toggleCollapseCollection = (colId: string) => {
    sfx.playToggle();
    setCollapsedCollections(prev => ({
      ...prev,
      [colId]: !prev[colId]
    }));
  };

  const filteredSavedCollections = useMemo(() => {
    if (!groupSearchQuery.trim()) return savedCollections;
    const q = groupSearchQuery.toLowerCase();
    return savedCollections.filter(col => {
      if (col.courseName.toLowerCase().includes(q)) return true;
      if (col.taskTitle?.toLowerCase().includes(q)) return true;
      return col.groups.some(g =>
        g.name.toLowerCase().includes(q) ||
        g.members.some(m => m.name.toLowerCase().includes(q) || (m.studentId && m.studentId.includes(q)))
      );
    });
  }, [savedCollections, groupSearchQuery]);

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  // Active course name
  const currentCourseName = useMemo(() => {
    if (selectedCourseId !== 'custom') {
      const c = courseSchedules.find(item => item.id === selectedCourseId);
      if (c) return c.courseName;
    }
    return customCourseName.trim() || 'Mata Kuliah';
  }, [selectedCourseId, courseSchedules, customCourseName]);

  // Unified task for the current active course
  const currentCourseTask = useMemo(() => {
    return unifiedCourseTasks[currentCourseName] || { title: '', deadline: '' };
  }, [unifiedCourseTasks, currentCourseName]);

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

  // Divide into groups based on seed and mode ONLY IF locked/generated
  const groups = useMemo(() => {
    if (!isLocked || activeMembers.length === 0 || numGroups < 1) return [];

    const groupList: Array<{ id: number; name: string; members: typeof activeMembers }> = [];
    for (let i = 0; i < numGroups; i++) {
      const gId = i + 1;
      const defaultName = `Kelompok ${gId}`;
      const name = groupCustomNames[gId] || defaultName;
      groupList.push({ id: gId, name, members: [] });
    }

    if (distributionType === 'manual') {
      // Manual mapping
      for (let i = 0; i < numGroups; i++) {
        const gId = i + 1;
        const assignedIds = manualAssignments[gId] || [];
        groupList[i].members = activeMembers.filter(m => assignedIds.includes(m.id));
      }
      return groupList;
    }

    // Automatic shuffle using seed
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
  }, [isLocked, activeMembers, numGroups, distributionType, mode, seed, males, females, groupCustomNames, manualAssignments]);

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    localStorage.setItem('kelasgue_kelompok_course_id', courseId);
  };

  const handleCustomCourseChange = (val: string) => {
    setCustomCourseName(val);
    localStorage.setItem('kelasgue_kelompok_custom_course', val);
  };

  const handleManualMemberToggle = (groupId: number, memberId: string) => {
    const currentList = manualAssignments[groupId] || [];
    let updatedList: string[];
    if (currentList.includes(memberId)) {
      updatedList = currentList.filter(id => id !== memberId);
    } else {
      // Remove from any other group first
      const cleanedObj: Record<number, string[]> = {};
      Object.keys(manualAssignments).forEach(k => {
        const numKey = Number(k);
        cleanedObj[numKey] = (manualAssignments[numKey] || []).filter(id => id !== memberId);
      });
      updatedList = [...(cleanedObj[groupId] || []), memberId];
    }
    const nextManual = { ...manualAssignments, [groupId]: updatedList };
    setManualAssignments(nextManual);
    localStorage.setItem('kelasgue_kelompok_manual', JSON.stringify(nextManual));
  };

  const handleGenerateOrShuffle = () => {
    if (activeMembers.length === 0) {
      showToast('Tidak ada siswa aktif terdaftar untuk dibuatkan kelompok!', 'error');
      return;
    }
    sfx.playOptionSelect();
    const newSeed = Date.now();
    setSeed(newSeed);
    setIsLocked(true);
    localStorage.setItem('kelasgue_kelompok_seed', String(newSeed));
    localStorage.setItem('kelasgue_kelompok_locked', 'true');
    showToast(`✓ Kelompok untuk mata kuliah "${currentCourseName}" berhasil dikunci!`, 'success');
  };

  const handleResetLock = () => {
    sfx.playDeleteConfirm();
    setIsLocked(false);
    localStorage.removeItem('kelasgue_kelompok_locked');
    showToast('Tampilan kelompok dibuka kunci dan dikembalikan ke awal.', 'info');
  };

  const handleRenameGroup = (groupId: number, newName: string) => {
    const updated = { ...groupCustomNames, [groupId]: newName };
    setGroupCustomNames(updated);
    localStorage.setItem('kelasgue_kelompok_names', JSON.stringify(updated));
  };

  const handleUpdateUnifiedCourseTask = (field: 'title' | 'deadline', value: string) => {
    const current = unifiedCourseTasks[currentCourseName] || { title: '', deadline: '' };
    const updated = {
      ...unifiedCourseTasks,
      [currentCourseName]: { ...current, [field]: value }
    };
    setUnifiedCourseTasks(updated);
    localStorage.setItem('kelasgue_kelompok_unified_tasks', JSON.stringify(updated));
  };

  const handleSaveGroupCollection = () => {
    if (groups.length === 0) {
      showToast('Belum ada kelompok yang ter-generate!', 'error');
      return;
    }

    const newCollection: SavedGroupCollection = {
      id: `collection_${Date.now()}`,
      courseName: currentCourseName,
      taskTitle: currentCourseTask.title.trim() || 'Tugas Proyek Kelompok',
      taskDeadline: currentCourseTask.deadline || new Date().toISOString().split('T')[0],
      savedAt: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' }),
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        members: g.members.map(m => ({ id: m.id, name: m.name, studentId: m.studentId, gender: m.gender })),
        isCompleted: false,
        submissionUrl: ''
      }))
    };

    const updatedCollections = [newCollection, ...savedCollections];
    setSavedCollections(updatedCollections);
    localStorage.setItem('kelasgue_saved_group_collections', JSON.stringify(updatedCollections));

    sfx.playLevelUp();
    showToast(`✓ Kelompok Mata Kuliah "${currentCourseName}" berhasil disimpan ke Arsip Kelompok!`, 'success');
  };

  const handleDeleteSavedCollection = async (collectionId: string, courseName: string) => {
    const ok = await showConfirm({
      title: 'Hapus Simpanan Kelompok?',
      message: `Hapus kelompok tersimpan untuk mata kuliah "${courseName}"?`,
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (!ok) return;

    sfx.playDeleteConfirm();
    const updated = savedCollections.filter(c => c.id !== collectionId);
    setSavedCollections(updated);
    localStorage.setItem('kelasgue_saved_group_collections', JSON.stringify(updated));
    showToast(`Kelompok ${courseName} dihapus dari simpanan.`, 'info');
  };

  const handleToggleGroupTaskCompleted = (collectionId: string, groupId: number) => {
    sfx.playToggle();
    const updated = savedCollections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          groups: c.groups.map(g => {
            if (g.id === groupId) {
              return { ...g, isCompleted: !g.isCompleted };
            }
            return g;
          })
        };
      }
      return c;
    });
    setSavedCollections(updated);
    localStorage.setItem('kelasgue_saved_group_collections', JSON.stringify(updated));
  };

  const handleUpdateGroupSubmissionUrl = (collectionId: string, groupId: number, url: string) => {
    const updated = savedCollections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          groups: c.groups.map(g => {
            if (g.id === groupId) {
              return { ...g, submissionUrl: url };
            }
            return g;
          })
        };
      }
      return c;
    });
    setSavedCollections(updated);
    localStorage.setItem('kelasgue_saved_group_collections', JSON.stringify(updated));
  };

  const handleSyncUnifiedTaskToSchedule = () => {
    const task = currentCourseTask;
    if (!task.title.trim()) {
      showToast('Mohon isi judul tugas / proyek kelompok terlebih dahulu!', 'error');
      return;
    }

    let targetCourseId = selectedCourseId;
    if (targetCourseId === 'custom' || !courseSchedules.some(c => c.id === targetCourseId)) {
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

    const assignmentPayload: Omit<CourseAssignment, 'id'> = {
      title: `[Tugas Kelompok ${currentCourseName}] ${task.title.trim()}`,
      deadline: task.deadline || new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: `Tugas proyek kelompok terpadu (${numGroups} Kelompok, ${activeMembers.length} Siswa Aktif)`
    };

    if (onAddAssignment) {
      onAddAssignment(targetCourseId, assignmentPayload);
    } else {
      LocalKasRepository.addCourseAssignment(targetCourseId, assignmentPayload);
    }

    sfx.playLevelUp();
    showToast(`✓ Tugas proyek "${task.title.trim()}" mata kuliah ${currentCourseName} berhasil disimpan ke Jadwal & Tugas!`, 'success');
  };

  const handleSendWhatsApp = () => {
    if (!isLocked || groups.length === 0) {
      showToast('Generate dan kunci kelompok terlebih dahulu sebelum mengirim ke WA!', 'error');
      return;
    }

    sfx.playFileDownload();
    let text = `📌 *PEMBAGIAN KELOMPOK - ${currentCourseName.toUpperCase()}*\n`;
    const task = currentCourseTask;
    if (task.title.trim()) {
      text += `🎯 *Tugas/Proyek Kelompok:* ${task.title.trim()}\n`;
      text += `📅 *Deadline:* ${task.deadline || 'Belum ditentukan'}\n`;
    }
    text += `⚖️ *Mode:* ${distributionType === 'manual' ? 'Penyusunan Manual' : mode === 'seimbang_gender' ? 'Seimbang Gender (L/P)' : 'Acak Campur'}\n`;
    text += `👥 *Total Siswa Aktif:* ${activeMembers.length} Orang (${numGroups} Kelompok)\n\n`;

    groups.forEach(g => {
      text += `*${g.name.toUpperCase()}* (${g.members.length} Orang)\n`;
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
                Pencatatan & Generator Kelompok Mata Kuliah
              </h3>
              <p className="text-[11px] text-slate-700 font-medium">
                Pilih mata kuliah, tentukan kelompok otomatis/manual, dan simpan kelompok untuk diakses semua anggota.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleSendWhatsApp}
              disabled={!isLocked || groups.length === 0}
              className="btn-doodle px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xs flex items-center gap-1.5 border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5 text-emerald-950" />
              <span>Kirim WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_#000] space-y-4">
        {/* 1. Pilih Mata Kuliah */}
        <div className="p-3.5 bg-amber-50/80 border-2 border-slate-900 rounded-xl space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-700" />
            <span>1. Pilih Mata Kuliah / Pelajaran:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedCourseId}
              onChange={(e) => handleSelectCourse(e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg focus:outline-none disabled:opacity-70 disabled:bg-slate-100"
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
                onChange={(e) => handleCustomCourseChange(e.target.value)}
                placeholder="Contoh: Matematika Diskrit, Pemrograman Web..."
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-900 rounded-lg focus:outline-none bg-white disabled:opacity-70 disabled:bg-slate-100"
              />
            )}
          </div>
        </div>

        {/* 2. Mode Distribusi (Otomatis vs Manual) & Jumlah Kelompok */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jumlah Kelompok */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              2. Jumlah Kelompok: <span className="text-amber-600 text-sm font-black">{numGroups} Kelompok</span>
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
                  } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Pengacakan / Manual */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              3. Metode Pembagian Kelompok
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                disabled={isLocked}
                onClick={() => {
                  sfx.playOptionSelect();
                  setDistributionType('auto');
                  setMode('seimbang_gender');
                }}
                className={`py-2 px-2 rounded-xl text-[11px] font-black border-2 border-slate-900 flex items-center justify-center gap-1 transition ${
                  distributionType === 'auto' && mode === 'seimbang_gender'
                    ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span>Seimbang L/P</span>
              </button>

              <button
                disabled={isLocked}
                onClick={() => {
                  sfx.playOptionSelect();
                  setDistributionType('auto');
                  setMode('campur');
                }}
                className={`py-2 px-2 rounded-xl text-[11px] font-black border-2 border-slate-900 flex items-center justify-center gap-1 transition ${
                  distributionType === 'auto' && mode === 'campur'
                    ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Shuffle className="w-3.5 h-3.5 shrink-0" />
                <span>Acak Full</span>
              </button>

              <button
                disabled={isLocked}
                onClick={() => {
                  sfx.playOptionSelect();
                  setDistributionType('manual');
                }}
                className={`py-2 px-2 rounded-xl text-[11px] font-black border-2 border-slate-900 flex items-center justify-center gap-1 transition ${
                  distributionType === 'manual'
                    ? 'bg-indigo-300 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 shadow-[1px_1px_0px_#000]'
                } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Manual</span>
              </button>
            </div>
          </div>
        </div>

        {/* Manual Group Picker Area if distributionType === 'manual' and not locked */}
        {distributionType === 'manual' && !isLocked && (
          <div className="p-3.5 bg-indigo-50/70 border-2 border-indigo-900 rounded-xl space-y-3">
            <h4 className="font-black text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-700" />
              <span>Penyusunan Anggota Kelompok Manual ({numGroups} Kelompok)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {Array.from({ length: numGroups }).map((_, idx) => {
                const gId = idx + 1;
                const assigned = manualAssignments[gId] || [];
                return (
                  <div key={gId} className="bg-white p-2.5 rounded-lg border-2 border-slate-900 space-y-1.5">
                    <span className="font-black text-xs text-slate-900 block">Kelompok #{gId} ({assigned.length} Anggota)</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {activeMembers.map(m => {
                        const isSelectedInThisGroup = assigned.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleManualMemberToggle(gId, m.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                              isSelectedInThisGroup
                                ? 'bg-indigo-600 text-white border-slate-900 font-black'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-indigo-100'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button & Student Count Info */}
        <div className="pt-3 border-t-2 border-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 font-bold">
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-blue-600" /> Laki-laki: <strong>{males.length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-pink-600" /> Perempuan: <strong>{females.length}</strong>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700 font-black">Aktif: {activeMembers.length} Siswa</span>
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <button
                onClick={handleResetLock}
                className="btn-doodle px-4 py-2 bg-rose-200 hover:bg-rose-300 text-rose-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
                title="Buka kunci untuk memilih mata kuliah baru atau mengacak ulang kelompok"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Buka Kunci (Reset Acak)</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateOrShuffle}
                className="btn-doodle px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Generate & Kunci Kelompok</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Conditional rendering based on isLocked */}
      {!isLocked ? (
        /* INITIAL EMPTY STATE BEFORE GENERATE */
        <div className="bg-amber-50/40 border-2 border-dashed border-slate-400 rounded-2xl p-8 text-center space-y-4 my-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-200 border-2 border-slate-900 flex items-center justify-center mx-auto text-slate-900 shadow-[3px_3px_0px_#000]">
            <Sparkles className="w-8 h-8 text-amber-700" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="font-black text-lg text-slate-900">
              Belum Ada Kelompok Digenerate
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Silakan pilih mata kuliah <strong>({currentCourseName})</strong>, tentukan jumlah kelompok ({numGroups}), dan pilih metode pengacakan di atas, lalu klik <span className="underline font-bold text-amber-900">"Generate & Kunci Kelompok"</span>.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleGenerateOrShuffle}
              className="btn-doodle px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>Generate Kelompok Sekarang</span>
            </button>
          </div>
        </div>
      ) : (
        /* GENERATED STATE: UNIFIED COURSE TASK & GROUPS GRID */
        <div className="space-y-6">
          {/* Header Title of Generated Course */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-slate-900 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wider text-slate-900 shadow-[1px_1px_0px_#000]">
                  Ter-kunci
                </span>
                <h3 className="font-black text-lg sm:text-xl text-slate-900">
                  Kelompok Mata Kuliah: {currentCourseName}
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {numGroups} Kelompok · {activeMembers.length} Siswa Aktif · Mode: {distributionType === 'manual' ? 'Penyusunan Manual' : mode === 'seimbang_gender' ? 'Seimbang Gender (L/P)' : 'Acak Campur'}
              </p>
            </div>

            <button
              onClick={handleSaveGroupCollection}
              className="btn-doodle px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
              title="Simpan pembagian kelompok ini secara permanen agar dapat dilihat oleh seluruh anggota"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>Simpan Kelompok {currentCourseName}</span>
            </button>
          </div>

          {/* Unified Course Project Assignment Card */}
          <div className="bg-sky-50 border-2 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_#000] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-sky-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-400 border border-slate-900 text-slate-900 flex items-center justify-center font-black shrink-0">
                  <ClipboardList className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Tugas / Proyek Kelompok Mata Kuliah ({currentCourseName})
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Tugas ini berlaku seragam untuk seluruh kelompok di bawah.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncUnifiedTaskToSchedule}
                className="btn-doodle px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 shrink-0"
                title="Simpan tugas proyek ini secara otomatis ke jadwal dan tugas kelas"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan ke Jadwal & Tugas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[11px] font-black uppercase text-slate-800">
                  Judul Tugas / Proyek Kelompok:
                </label>
                <input
                  type="text"
                  value={currentCourseTask.title}
                  onChange={(e) => handleUpdateUnifiedCourseTask('title', e.target.value)}
                  placeholder="Contoh: Makalah & Presentasi Bab 4, Demo Aplikasi Android..."
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-900 rounded-lg bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase text-slate-800">
                  Deadline Pengumpulan:
                </label>
                <input
                  type="date"
                  value={currentCourseTask.deadline}
                  onChange={(e) => handleUpdateUnifiedCourseTask('deadline', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-900 rounded-lg bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => {
              const groupMales = group.members.filter(m => m.gender === 'L').length;
              const groupFemales = group.members.filter(m => m.gender === 'P').length;
              const isRenaming = editingGroupId === group.id;

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
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar mb-3">
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
                  </div>

                  {/* Footer Ratio */}
                  <div className="pt-2.5 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-700 font-bold">
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
      )}

      {/* SAVED GROUP COLLECTIONS ARCHIVE SECTION */}
      {savedCollections.length > 0 && (
        <div className="pt-6 border-t-3 border-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-300 border-2 border-slate-900 font-black text-xs text-slate-900 shadow-[1px_1px_0px_#000]">
                📂 ARSIP
              </span>
              <h3 className="font-black text-lg text-slate-900">
                Daftar Kelompok Tersimpan ({savedCollections.length})
              </h3>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari matkul, tugas, kelompok, siswa..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border-2 border-slate-900 rounded-xl text-xs bg-white font-medium focus:outline-none shadow-[1.5px_1.5px_0px_#000]"
              />
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Seluruh anggota kelas dapat melihat daftar kelompok dan mengisi link pengumpulan tugas. Anda dapat mengecilkan (minimize) kelompok per mata kuliah.
          </p>

          {filteredSavedCollections.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-xl border-2 border-slate-900 text-center text-xs text-slate-600 italic">
              Tidak ada kelompok tersimpan yang cocok dengan pencarian "{groupSearchQuery}".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSavedCollections.map((col) => {
                const isCollapsed = !!collapsedCollections[col.id];
                const completedCount = col.groups.filter(g => g.isCompleted).length;

                return (
                  <div key={col.id} className="bg-white border-3 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[4px_4px_0px_#000] space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-base text-slate-900">
                            Mata Kuliah: {col.courseName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-amber-200 border border-slate-900 text-[10px] font-black text-amber-950">
                            {col.groups.length} Kelompok
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border border-slate-900 text-[10px] font-black ${completedCount === col.groups.length ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-100 text-slate-700'}`}>
                            {completedCount}/{col.groups.length} Tugas Selesai
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-1">
                          🎯 Proyek: <span className="text-indigo-900 font-black">{col.taskTitle}</span> (Deadline: {col.taskDeadline})
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Disimpan pada: {col.savedAt}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleCollapseCollection(col.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-200 text-slate-900 rounded-lg border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1.5 text-xs font-black active:translate-y-0.5 transition"
                          title={isCollapsed ? 'Buka detail kelompok' : 'Kecilkan / Minimize tampilan'}
                        >
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                          <span>{isCollapsed ? 'Buka Detail' : 'Minimize'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSavedCollection(col.id, col.courseName)}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#000] flex items-center gap-1 text-xs font-bold"
                          title="Hapus simpanan kelompok ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsed Compact Preview */}
                    {isCollapsed ? (
                      <div className="p-3 bg-amber-50/70 rounded-xl border-2 border-dashed border-slate-400 text-xs text-slate-600 flex items-center justify-between">
                        <span>ℹ️ Rincian {col.groups.length} kelompok disembunyikan. Klik <strong>"Buka Detail"</strong> untuk melihat pembagian siswa dan pengumpulan link.</span>
                      </div>
                    ) : (
                      /* Groups in Collection */
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {col.groups.map((g) => (
                    <div key={g.id} className="bg-amber-50/50 border-2 border-slate-900 rounded-xl p-3 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                          <span className="font-black text-xs text-slate-900">{g.name}</span>
                          
                          {/* Checklist Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleGroupTaskCompleted(col.id, g.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black border border-slate-900 flex items-center gap-1 transition ${
                              g.isCompleted
                                ? 'bg-emerald-300 text-slate-950 shadow-[1px_1px_0px_#000]'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-200'
                            }`}
                          >
                            {g.isCompleted ? <CheckSquare className="w-3 h-3 text-emerald-950" /> : <Square className="w-3 h-3 text-slate-500" />}
                            <span>{g.isCompleted ? 'Selesai ✓' : 'Belum Selesai'}</span>
                          </button>
                        </div>

                        {/* Members */}
                        <div className="space-y-1 mb-2">
                          {g.members.map((m, idx) => (
                            <p key={m.id} className="text-[11px] font-bold text-slate-800">
                              {idx + 1}. {toTitleCase(m.name)} <span className="text-[9px] text-slate-500 font-mono">[{m.gender || 'L'}]</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Link Pengumpulan Input & Button */}
                      <div className="pt-2 border-t border-slate-300 space-y-1.5">
                        <label className="block text-[9.5px] font-black uppercase text-slate-700">
                          Link Jawaban / Drive Pengumpulan:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={g.submissionUrl || ''}
                            onChange={(e) => handleUpdateGroupSubmissionUrl(col.id, g.id, e.target.value)}
                            placeholder="Paste link Google Drive/Docs..."
                            className="w-full px-2 py-1 text-[11px] font-bold border border-slate-900 rounded bg-white"
                          />
                          {g.submissionUrl && (
                            <a
                              href={g.submissionUrl.startsWith('http') ? g.submissionUrl : `https://${g.submissionUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-sky-300 text-slate-900 rounded border border-slate-900 shadow-[1px_1px_0px_#000] shrink-0"
                              title="Buka Link Pengumpulan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
