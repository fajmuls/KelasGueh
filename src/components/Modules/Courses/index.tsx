import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Course, CourseAssignment, AssignmentSubmission } from '../../../types/index.ts';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Eye,
  Trash2,
  Edit,
  GraduationCap,
  Sparkles,
  Users,
  Download,
  CalendarPlus,
  Layers,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';
import { CourseSyllabusModal } from './CourseSyllabusModal.tsx';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../../utils/calendarSync.ts';
import { GpaSimulator } from './GpaSimulator.tsx';
import { CourseDiscussionForum } from './CourseDiscussionForum.tsx';
import {
  Bell,
  BellRing,
  Calculator,
  MessageSquare,
} from 'lucide-react';

export const CoursesModule: React.FC = () => {
  const { user, role, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'gpa' | 'forum'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission === 'granted' : false
  );

  // Modals
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isViewSubmissionsModalOpen, setIsViewSubmissionsModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState<Course | null>(null);

  // Selected items
  const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<AssignmentSubmission[]>([]);
  const [mySubmission, setMySubmission] = useState<AssignmentSubmission | null>(null);

  // Forms
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    sks: 2,
    lecturer_name: '',
    lecturer_phone: '',
    description: '',
    room: 'R. 402',
    schedule_day: 'Senin',
    schedule_time: '08:00 - 10:00 WIB',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    course_id: '',
    title: '',
    description: '',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    drive_folder_url: '',
  });

  const [submitForm, setSubmitForm] = useState({
    submission_url: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [crsList, asgList] = await Promise.all([
        api.getCourses(),
        api.getAssignments(),
      ]);
      setCourses(crsList);
      setAssignments(asgList);
      if (crsList.length > 0 && !assignmentForm.course_id) {
        setAssignmentForm(prev => ({ ...prev, course_id: crsList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load courses data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse(courseForm);
      setIsAddCourseModalOpen(false);
      setCourseForm({
        name: '',
        code: '',
        sks: 2,
        lecturer_name: '',
        lecturer_phone: '',
        description: '',
        room: 'R. 402',
        schedule_day: 'Senin',
        schedule_time: '08:00 - 10:00 WIB',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan mata kuliah');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssignment(assignmentForm);
      setIsAddAssignmentModalOpen(false);
      setAssignmentForm({
        course_id: courses[0]?.id || '',
        title: '',
        description: '',
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        drive_folder_url: '',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tugas');
    }
  };

  const handleOpenSubmitModal = async (assignment: CourseAssignment) => {
    setSelectedAssignment(assignment);
    try {
      const subs = await api.getAssignmentSubmissions(assignment.id);
      const mine = subs.find(s => s.user_id === user?.id);
      setMySubmission(mine || null);
      setSubmitForm({
        submission_url: mine?.submission_url || '',
        notes: mine?.notes || '',
      });
      setIsSubmitModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setIsSubmitModalOpen(true);
    }
  };

  const handleOpenViewSubmissions = async (assignment: CourseAssignment) => {
    setSelectedAssignment(assignment);
    try {
      const subs = await api.getAssignmentSubmissions(assignment.id);
      setSubmissionsList(subs);
      setIsViewSubmissionsModalOpen(true);
    } catch (err: any) {
      alert('Gagal mengambil daftar pengumpulan');
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      setIsSubmitting(true);
      await api.submitAssignment(selectedAssignment.id, submitForm);
      alert('Tugas berhasil dikumpulkan via link Google Drive / tautan!');
      setIsSubmitModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengumpulkan tugas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Hapus tugas ini?')) {
      try {
        await api.deleteAssignment(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus tugas');
      }
    }
  };

  const totalSKS = useMemo(() => {
    return courses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);
  }, [courses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Semester 3 • Tahun Akademik 2025/2026
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Mata Kuliah & Tugas Perkuliahan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar 8 mata kuliah aktif, kontak dosen pengampu, jadwal kuliah, dan pengumpulan tugas terintegrasi Google Drive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              // Generate bulk iCal download for all 8 courses
              downloadIcsFile({
                filename: 'Jadwal_Kuliah_01SAKP014.ics',
                title: 'Jadwal Kuliah Semester 1 Kelas 01SAKP014',
                events: courses.map(c => ({
                  title: `[Kuliah] ${c.name} (${c.code})`,
                  details: `Dosen: ${c.lecturer_name} (${c.lecturer_phone || '-'})\nRuang: ${c.room || '-'}\nSKS: ${c.sks} SKS\nKelas 01SAKP014`,
                  location: c.room || 'Universitas Pamulang',
                  startDate: new Date().toISOString(),
                })),
              });
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Ekspor seluruh jadwal ke file .ics untuk Apple Calendar / Outlook / Google Calendar HP"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Kalender (.ics)</span>
          </button>

          {hasPermission('create_courses') && (
            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-blue-600" /> Tambah Matkul
            </button>
          )}

          <button
            onClick={() => setIsAddAssignmentModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Terbitkan Tugas Baru
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Beban Studi</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalSKS} SKS</p>
          <p className="text-[11px] text-blue-600 font-medium mt-0.5">8 Mata Kuliah Terdaftar</p>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tugas Kuliah Berjalan</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{assignments.length} Tugas</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pengumpulan via tautan Google Drive</p>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dosen Pengampu</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{courses.length} Dosen</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Kontak WhatsApp Terhubung</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Daftar Mata Kuliah ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Tugas & Deadline ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('gpa')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'gpa'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" /> Simulasi IPK & IPS
        </button>

        <button
          onClick={() => setActiveTab('forum')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'forum'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Forum Tanya Jawab
        </button>
      </div>

      {/* Tab 1: Mata Kuliah Cards */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => {
            const cleanPhone = (course.lecturer_phone || '').replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
            const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Bapak/Ibu ${course.lecturer_name}, saya mahasiswa kelas 01SAKP014 mata kuliah ${course.name}.`)}` : '#';

            return (
              <div
                key={course.id || idx}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold font-mono">
                      {course.sks} SKS
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{course.code}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{course.name}</h3>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{course.lecturer_name}</span>
                    </div>

                    {course.lecturer_phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-600">{course.lecturer_phone}</span>
                      </div>
                    )}

                    {course.schedule_day && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{course.schedule_day}, {course.schedule_time || 'Jadwal Reguler'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {waNumber ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WA Dosen</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">No WA belum ada</span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedCourseForSyllabus(course);
                        setIsSyllabusModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Lihat Silabus perkuliahan dan dokumen RPS"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Silabus & RPS</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setAssignmentForm(prev => ({ ...prev, course_id: course.id }));
                      setIsAddAssignmentModalOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    + Tugas Matkul
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Tugas & Pengumpulan Homework */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* H-1 Push Notification Alert & Permission Banner */}
          {(() => {
            const now = Date.now();
            const urgentAssignments = assignments.filter((a) => {
              const diffHours = (new Date(a.deadline).getTime() - now) / (1000 * 60 * 60);
              return diffHours > 0 && diffHours <= 36; // H-1 window
            });

            return (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                    <BellRing className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                      Pengingat Deadline Tugas (H-1 Push Notification)
                      {urgentAssignments.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                          {urgentAssignments.length} Tugas Segera Berakhir!
                        </span>
                      )}
                    </h4>
                    <p className="text-amber-800 mt-0.5">
                      {urgentAssignments.length > 0
                        ? `Perhatian: Tugas "${urgentAssignments[0].title}" (${urgentAssignments[0].course_name}) jatuh tempo kurang dari 24 jam!`
                        : 'Semua deadline penugasan terorganisir rapi. Aktifkan notifikasi peramban agar Anda tidak melewatkan tenggat pengumpulan.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!hasNotificationPermission ? (
                    <button
                      onClick={async () => {
                        if ('Notification' in window) {
                          const perm = await Notification.requestPermission();
                          if (perm === 'granted') {
                            setHasNotificationPermission(true);
                            new Notification('Kelas Manager', {
                              body: 'Notifikasi Deadline Tugas H-1 berhasil diaktifkan!',
                            });
                          }
                        } else {
                          alert('Browser Anda tidak mendukung push notification.');
                        }
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Aktifkan Notifikasi H-1</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Notifikasi H-1 Aktif</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {assignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Belum ada tugas perkuliahan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Semua tugas kuliah yang diterbitkan akan muncul di sini. Mahasiswa dapat mengumpulkan link Google Drive / tugas masing-masing.
              </p>
              <button
                onClick={() => setIsAddAssignmentModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Buat Tugas Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((asg) => {
                const isOverdue = new Date(asg.deadline).getTime() < Date.now();
                return (
                  <div
                    key={asg.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {asg.course_name}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            Deadline: {new Date(asg.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap line-clamp-3">
                        {asg.description || 'Tidak ada deskripsi tambahan.'}
                      </p>

                      {asg.drive_folder_url && (
                        <a
                          href={asg.drive_folder_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Folder Soal / Template Google Drive</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        📊 <strong className="text-slate-800">{asg.submission_count || 0}</strong> mahasiswa mengumpulkan
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenViewSubmissions(asg)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Lihat daftar pengumpulan mahasiswa"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Pengumpulan</span>
                        </button>

                        <button
                          onClick={() => handleOpenSubmitModal(asg)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Kumpulkan Tugas</span>
                        </button>

                        {(hasPermission('manage_assignments') || role?.id === 'role_superadmin') && (
                          <button
                            onClick={() => handleDeleteAssignment(asg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Simulasi IPK & IPS */}
      {activeTab === 'gpa' && <GpaSimulator courses={courses} />}

      {/* Tab 4: Forum Diskusi & Tanya Jawab */}
      {activeTab === 'forum' && <CourseDiscussionForum courses={courses} />}

      {/* Modal: Tambah Mata Kuliah */}
      <Modal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        title="Tambah Mata Kuliah Baru"
      >
        <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Mata Kuliah</label>
            <input
              type="text"
              required
              placeholder="e.g. Audit Forensik & Akuntansi Publik"
              value={courseForm.name}
              onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jumlah SKS</label>
              <select
                value={courseForm.sks}
                onChange={e => setCourseForm({ ...courseForm, sks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
              >
                <option value={1}>1 SKS</option>
                <option value={2}>2 SKS</option>
                <option value={3}>3 SKS</option>
                <option value={4}>4 SKS</option>
                <option value={6}>6 SKS</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Matkul</label>
              <input
                type="text"
                placeholder="e.g. MK301"
                value={courseForm.code}
                onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Dosen Pengampu</label>
            <input
              type="text"
              required
              placeholder="e.g. Wiwit Irawati, S.E., M.Ak."
              value={courseForm.lecturer_name}
              onChange={e => setCourseForm({ ...courseForm, lecturer_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP Dosen</label>
            <input
              type="text"
              placeholder="e.g. 08128002843"
              value={courseForm.lecturer_phone}
              onChange={e => setCourseForm({ ...courseForm, lecturer_phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hari Kuliah</label>
              <input
                type="text"
                placeholder="e.g. Senin"
                value={courseForm.schedule_day}
                onChange={e => setCourseForm({ ...courseForm, schedule_day: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Waktu / Jam</label>
              <input
                type="text"
                placeholder="e.g. 08:00 - 10:30 WIB"
                value={courseForm.schedule_time}
                onChange={e => setCourseForm({ ...courseForm, schedule_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddCourseModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs"
            >
              Simpan Mata Kuliah
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Terbitkan Tugas Baru */}
      <Modal
        isOpen={isAddAssignmentModalOpen}
        onClose={() => setIsAddAssignmentModalOpen(false)}
        title="Terbitkan Tugas Perkuliahan Baru"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Mata Kuliah</label>
            <select
              value={assignmentForm.course_id}
              onChange={e => setAssignmentForm({ ...assignmentForm, course_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.sks} SKS - {c.lecturer_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Tugas</label>
            <input
              type="text"
              required
              placeholder="e.g. Tugas 1: Analisis Laporan Keuangan Neraca & Laba Rugi"
              value={assignmentForm.title}
              onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Pengumpulan (Deadline)</label>
            <input
              type="date"
              required
              value={assignmentForm.deadline}
              onChange={e => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Link Folder Google Drive (Opsional untuk Soal/Template)</label>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={assignmentForm.drive_folder_url}
              onChange={e => setAssignmentForm({ ...assignmentForm, drive_folder_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Instruksi & Deskripsi Tugas</label>
            <textarea
              rows={3}
              placeholder="Jelaskan format file, instruksi pengerjaan, kelompok/individu..."
              value={assignmentForm.description}
              onChange={e => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddAssignmentModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs"
            >
              Terbitkan Tugas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Kumpulkan Tugas (Submit Homework Link) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Kumpulkan Tugas: ${selectedAssignment?.title || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitHomework} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
            <p className="font-bold text-xs">Instruksi Pengumpulan:</p>
            <p className="text-[11px] text-blue-700 mt-1">
              Upload file tugas Anda ke <strong>Google Drive</strong>, atur izin akses menjadi <em>"Anyone with the link / Siapa saja yang memiliki link (Viewer)"</em>, lalu tempel tautannya di bawah.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> Tautan Link Tugas (Google Drive / Docs / PDF)
            </label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/file/d/... atau link tugas Anda"
              value={submitForm.submission_url}
              onChange={e => setSubmitForm({ ...submitForm, submission_url: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-blue-500 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan untuk Dosen/Koor (Opsional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Tugas Kelompok 3 (Anggota: Budi, Ani, Citra)"
              value={submitForm.notes}
              onChange={e => setSubmitForm({ ...submitForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
            />
          </div>

          {mySubmission && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Anda sudah pernah mengumpulkan tugas ini
              </span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Dikumpulkan pada: {new Date(mySubmission.submitted_at).toLocaleString('id-ID')}
              </p>
              <a
                href={mySubmission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 underline"
              >
                Buka link yang tersimpan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Pengumpulan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Lihat Daftar Pengumpulan Mahasiswa */}
      <Modal
        isOpen={isViewSubmissionsModalOpen}
        onClose={() => setIsViewSubmissionsModalOpen(false)}
        title={`Daftar Pengumpulan: ${selectedAssignment?.title || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Daftar seluruh mahasiswa yang telah mengumpulkan tugas ini beserta tautan Google Drive dan waktu pengumpulan.
          </p>

          {submissionsList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-600">Belum ada mahasiswa yang mengumpulkan tugas ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Mahasiswa</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tautan Tugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissionsList.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        {sub.user_name}
                        {sub.user_nim && <span className="block font-mono text-[10px] text-slate-400">{sub.user_nim}</span>}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(sub.submitted_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'late'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {sub.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="p-3">
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg border border-blue-200 text-[11px] transition-colors"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>Buka Google Drive</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsViewSubmissionsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Silabus & RPS Modal */}
      <CourseSyllabusModal
        isOpen={isSyllabusModalOpen}
        onClose={() => {
          setIsSyllabusModalOpen(false);
          setSelectedCourseForSyllabus(null);
        }}
        course={selectedCourseForSyllabus}
      />
    </div>
  );
};
