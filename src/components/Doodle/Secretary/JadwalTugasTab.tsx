import React, { useState } from 'react';
import { CourseSchedule, CourseAssignment, ClassSettings } from '../../../types/kas.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { ScotchTape } from '../DoodleDecorations.tsx';
import { showToast, showConfirm } from '../../UI/DoodleDialog.tsx';
import {
  CalendarDays,
  Plus,
  BookOpen,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Share2,
  Trash2,
  Edit2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface JadwalTugasTabProps {
  schedules?: CourseSchedule[];
  courseSchedules?: CourseSchedule[];
  settings: ClassSettings;
  canEdit: boolean;
  onSaveCourse: (course: Omit<CourseSchedule, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteCourse: (id: string) => void;
  onAddAssignment: (courseId: string, assignment: Omit<CourseAssignment, 'id'>) => void;
  onToggleAssignment: (courseId: string, assignmentId: string) => void;
  onDeleteAssignment: (courseId: string, assignmentId: string) => void;
}

const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const JadwalTugasTab: React.FC<JadwalTugasTabProps> = ({
  schedules,
  courseSchedules: propCourseSchedules,
  settings,
  canEdit,
  onSaveCourse,
  onDeleteCourse,
  onAddAssignment,
  onToggleAssignment,
  onDeleteAssignment
}) => {
  const courseSchedules = schedules || propCourseSchedules || [];
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSchedule | null>(null);

  // Form states for Course
  const [courseName, setCourseName] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [sks, setSks] = useState<number>(3);
  const [day, setDay] = useState<string>('Senin');
  const [time, setTime] = useState('08:00 - 09:40');
  const [room, setRoom] = useState('Ruang 201');

  // Form states for Assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState<string>(courseSchedules[0]?.id || '');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDeadline, setAssignDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [assignNotes, setAssignNotes] = useState('');

  const handleOpenAddCourse = () => {
    sfx.playClick();
    setEditingCourse(null);
    setCourseName('');
    setLecturerName('');
    setSks(3);
    setDay('Senin');
    setTime('08:00 - 09:40');
    setRoom('Ruang Teori');
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: CourseSchedule) => {
    sfx.playClick();
    setEditingCourse(course);
    setCourseName(course.courseName);
    setLecturerName(course.lecturerName);
    setSks(course.sks);
    setDay(course.day);
    setTime(course.time);
    setRoom(course.room || '');
    setIsCourseModalOpen(true);
  };

  const handleSaveCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      showToast('Nama mata kuliah/pelajaran wajib diisi.', 'error');
      return;
    }
    if (!lecturerName.trim()) {
      showToast('Nama dosen atau guru pengampu wajib diisi.', 'error');
      return;
    }

    sfx.playSuccess();
    onSaveCourse({
      id: editingCourse?.id,
      courseName: courseName.trim(),
      lecturerName: lecturerName.trim(),
      sks: Number(sks) || 2,
      day,
      time: time.trim() || '08:00 - 09:40',
      room: room.trim() || undefined,
      assignments: editingCourse?.assignments || []
    });

    showToast(editingCourse ? 'Jadwal kuliah berhasil diperbarui!' : 'Mata kuliah baru berhasil didaftarkan!', 'success');
    setIsCourseModalOpen(false);
  };

  const handleDeleteCourse = async (course: CourseSchedule) => {
    const ok = await showConfirm({
      title: 'Hapus Mata Kuliah?',
      message: `Hapus "${course.courseName}" beserta seluruh daftar tugasnya?`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playDelete();
      onDeleteCourse(course.id);
      showToast('Mata kuliah berhasil dihapus.', 'info');
    }
  };

  const handleSaveAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) {
      showToast('Judul tugas wajib diisi.', 'error');
      return;
    }
    if (!selectedCourseForAssign) {
      showToast('Pilih mata kuliah untuk tugas ini.', 'error');
      return;
    }

    sfx.playSuccess();
    onAddAssignment(selectedCourseForAssign, {
      title: assignTitle.trim(),
      deadline: assignDeadline,
      status: 'pending',
      notes: assignNotes.trim() || undefined
    });

    showToast('Tugas kuliah baru berhasil dicatat!', 'success');
    setIsAssignModalOpen(false);
    setAssignTitle('');
    setAssignNotes('');
  };

  // WhatsApp Recap
  const handleCopyWhatsAppSchedule = () => {
    sfx.playClick();
    const rows = courseSchedules.map((c, idx) => {
      const pendingCount = (c.assignments || []).filter(a => a.status === 'pending').length;
      return `📌 *${c.courseName}* (${c.sks} SKS)\n   👨‍🏫 Dosen: ${c.lecturerName}\n   ⏰ Jadwal: ${c.day}, ${c.time} (R. ${c.room || '-'})\n   📝 Tugas Aktif: ${pendingCount} tugas pending`;
    }).join('\n\n');

    const message =
      `📚 *JADWAL KULIAH & TUGAS KELAS*\n` +
      `*${settings.className}*\n\n` +
      (rows || '- Belum ada jadwal kuliah tercatat -') +
      `\n\n_— Dicatat via Sekretariat Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Jadwal kuliah berhasil disalin untuk WhatsApp!', 'success');
  };

  const filteredCourses = courseSchedules.filter(c => {
    if (selectedDay === 'all') return true;
    return c.day.toLowerCase() === selectedDay.toLowerCase();
  });

  const totalSks = courseSchedules.reduce((sum, c) => sum + c.sks, 0);
  const allAssignments = courseSchedules.flatMap(c => (c.assignments || []).map(a => ({ ...a, courseName: c.courseName, courseId: c.id })));
  const pendingAssignments = allAssignments.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="card-doodle bg-white p-3 sm:p-4 rounded-xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-sky-200 text-slate-900 border border-slate-900 rounded">
                Ranah Sekretaris
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Akademik & Jadwal Kuliah
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sky-600" />
              <span>Jadwal Kuliah & Deadline Tugas</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 max-w-2xl leading-relaxed">
              Kelola daftar mata kuliah, nama dosen pengampu, bobot SKS, ruangan, dan deadline tugas kuliah. Data mata kuliah di sini otomatis terhubung ke filter Poin Keaktifan dan Presensi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyWhatsAppSchedule}
              className="btn-doodle px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Salin Jadwal WA</span>
            </button>

            {canEdit && (
              <>
                <button
                  onClick={() => {
                    sfx.playClick();
                    if (courseSchedules.length === 0) {
                      showToast('Tambahkan mata kuliah terlebih dahulu sebelum mencatat tugas.', 'error');
                      return;
                    }
                    setSelectedCourseForAssign(courseSchedules[0].id);
                    setIsAssignModalOpen(true);
                  }}
                  className="btn-doodle px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
                >
                  <FileCheck className="w-4 h-4 text-amber-800" />
                  <span>Tugas Baru</span>
                </button>

                <button
                  onClick={handleOpenAddCourse}
                  className="btn-doodle px-4 py-2 bg-sky-300 hover:bg-sky-400 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tambah Matkul</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Mata Kuliah</p>
          <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{courseSchedules.length} Matkul</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Semester berjalan</p>
        </div>

        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Beban SKS</p>
          <p className="text-xl font-black text-sky-800 font-mono mt-0.5">{totalSks} SKS</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Akumulasi kelas</p>
        </div>

        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Tugas Pending</span>
          </p>
          <p className="text-xl font-black text-rose-600 font-mono mt-0.5">{pendingAssignments.length} Tugas</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Perlu dikerjakan</p>
        </div>

        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Tugas Selesai</span>
          </p>
          <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">{allAssignments.length - pendingAssignments.length} Tugas</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Telah dituntaskan</p>
        </div>
      </div>

      {/* Day Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white p-2.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
        <button
          onClick={() => {
            sfx.playClick();
            setSelectedDay('all');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap shrink-0 ${
            selectedDay === 'all'
              ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Hari ({courseSchedules.length})
        </button>
        {DAYS_OF_WEEK.map(d => {
          const count = courseSchedules.filter(c => c.day.toLowerCase() === d.toLowerCase()).length;
          return (
            <button
              key={d}
              onClick={() => {
                sfx.playClick();
                setSelectedDay(d);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap shrink-0 ${
                selectedDay.toLowerCase() === d.toLowerCase()
                  ? 'bg-sky-200 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      {/* Course Schedule Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map(course => {
            const assignments = course.assignments || [];
            return (
              <div
                key={course.id}
                className="card-doodle bg-white rounded-xl border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-2 border-b-2 border-slate-900 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 border border-slate-900 rounded">
                          {course.day}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded">
                          {course.sks} SKS
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {course.courseName}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-black text-slate-900 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{course.time}</span>
                      </p>
                      {course.room && (
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 justify-end mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{course.room}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lecturer */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Dosen: {course.lecturerName}</span>
                  </div>

                  {/* Course Assignments List */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tugas Kuliah ({assignments.length})</span>
                      </p>
                      {canEdit && (
                        <button
                          onClick={() => {
                            sfx.playClick();
                            setSelectedCourseForAssign(course.id);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-sky-700 hover:underline"
                        >
                          + Tambah Tugas
                        </button>
                      )}
                    </div>

                    {assignments.length > 0 ? (
                      <div className="space-y-1.5">
                        {assignments.map(asg => {
                          const isDone = asg.status === 'selesai';
                          return (
                            <div
                              key={asg.id}
                              className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                                isDone
                                  ? 'bg-slate-50 border-slate-300 opacity-60'
                                  : 'bg-amber-50/50 border-amber-300'
                              }`}
                            >
                              <div
                                onClick={() => {
                                  if (!canEdit) return;
                                  sfx.playToggle();
                                  onToggleAssignment(course.id, asg.id);
                                }}
                                className={`flex items-start gap-2 flex-1 ${canEdit ? 'cursor-pointer' : ''}`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-amber-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold leading-tight ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                    {asg.title}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                    Deadline: {asg.deadline}
                                  </p>
                                  {asg.notes && (
                                    <p className="text-[10px] text-slate-500 italic mt-0.5">
                                      {asg.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {canEdit && (
                                <button
                                  onClick={() => {
                                    sfx.playDelete();
                                    onDeleteAssignment(course.id, asg.id);
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 text-xs shrink-0"
                                  title="Hapus Tugas"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Tidak ada tugas pending untuk mata kuliah ini.
                      </p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditCourse(course)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-900 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Matkul</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-doodle bg-white p-10 rounded-xl border-2 border-slate-900 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-800">Belum Ada Jadwal Kuliah</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedDay !== 'all' ? `Tidak ada jadwal kuliah di hari ${selectedDay}.` : 'Mulai daftarkan jadwal mata kuliah semester ini dengan menekan tombol Tambah Matkul di atas.'}
          </p>
        </div>
      )}

      {/* Modal Add / Edit Course */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-doodle bg-white max-w-md w-full rounded-xl p-5 border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative animate-in zoom-in-95 my-auto">
            <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-sky-600" />
                <span>{editingCourse ? 'Edit Jadwal Mata Kuliah' : 'Tambah Mata Kuliah Baru'}</span>
              </h3>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Mata Kuliah / Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Algoritma & Struktur Data"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-amber-50/40 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dosen / Guru Pengampu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. Budi Santoso, M.Kom"
                  value={lecturerName}
                  onChange={e => setLecturerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hari Perkuliahan</label>
                  <select
                    value={day}
                    onChange={e => {
                      sfx.playOptionSelect();
                      setDay(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white shadow-[1px_1px_0px_#000] cursor-pointer appearance-none"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bobot SKS</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={sks}
                    onChange={e => setSks(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Perkuliahan</label>
                  <input
                    type="text"
                    placeholder="08:00 - 10:30"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ruangan / Lab</label>
                  <input
                    type="text"
                    placeholder="Lab Komputer 3"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 rounded-xl border-2 border-slate-900 bg-sky-300 font-black text-xs shadow-[2px_2px_0px_#000]"
                >
                  {editingCourse ? 'Simpan Perubahan' : 'Daftarkan Matkul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Assignment */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-doodle bg-white max-w-md w-full rounded-xl p-5 border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative animate-in zoom-in-95 my-auto">
            <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <span>Tambah Tugas / Deadline Baru</span>
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mata Kuliah</label>
                <select
                  value={selectedCourseForAssign}
                  onChange={e => {
                    sfx.playOptionSelect();
                    setSelectedCourseForAssign(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white shadow-[1px_1px_0px_#000] cursor-pointer appearance-none"
                >
                  {courseSchedules.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseName} ({c.day}, {c.lecturerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Judul Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Makalah Analisis Algoritma Dijkstra"
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-amber-50/40 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Batas Waktu (Deadline)</label>
                <input
                  type="date"
                  required
                  value={assignDeadline}
                  onChange={e => setAssignDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Petunjuk Pengumpulan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Kirim via e-learning / hardcopy kelompok..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-white text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 rounded-xl border-2 border-slate-900 bg-amber-300 font-black text-xs shadow-[2px_2px_0px_#000]"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
