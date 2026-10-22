import React, { useState, useEffect } from 'react';
import { Course, CourseSyllabus, SyllabusMeeting } from '../../../types/index.ts';
import { api } from '../../../services/api.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import {
  BookOpen,
  FolderDown,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Edit2,
  Info,
  Clock,
  MapPin,
  Share2,
} from 'lucide-react';
import { Modal } from '../../UI/Modal.tsx';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../../utils/calendarSync.ts';

interface CourseSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

export const CourseSyllabusModal: React.FC<CourseSyllabusModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const { hasPermission } = useAuth();
  const [syllabus, setSyllabus] = useState<CourseSyllabus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable form state
  const [rpsUrl, setRpsUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [assessment, setAssessment] = useState({
    attendance: 10,
    tasks: 25,
    uts: 30,
    uas: 35,
  });
  const [meetings, setMeetings] = useState<SyllabusMeeting[]>([]);

  useEffect(() => {
    if (isOpen && course) {
      loadSyllabus(course.id);
    }
  }, [isOpen, course]);

  const loadSyllabus = async (courseId: string) => {
    try {
      setIsLoading(true);
      const data = await api.getCourseSyllabus(courseId);
      setSyllabus(data);
      setRpsUrl(data.rps_document_url || '');
      setDriveUrl(data.drive_folder_url || '');
      setAssessment(data.assessment_criteria || { attendance: 10, tasks: 25, uts: 30, uas: 35 });
      setMeetings(data.meetings || []);
    } catch (err) {
      console.error('Failed to load syllabus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!course) return;
    try {
      setIsSaving(true);
      const res = await api.updateCourseSyllabus(course.id, {
        rps_document_url: rpsUrl,
        drive_folder_url: driveUrl,
        assessment_criteria: assessment,
        meetings,
      });
      setSyllabus(res.syllabus);
      setIsEditing(false);
      alert('Silabus & RPS berhasil diperbarui!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan silabus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMeeting = () => {
    const nextNo = meetings.length + 1;
    setMeetings([
      ...meetings,
      {
        meeting_no: nextNo,
        topic: `Pertemuan ke-${nextNo}: Pokok Bahasan Baru`,
        subtopics: ['Subtopik materi 1', 'Subtopik materi 2'],
        learning_outcome: 'Mahasiswa menguasai capaian pembelajaran pada pokok bahasan ini.',
      },
    ]);
  };

  const handleRemoveMeeting = (index: number) => {
    const updated = meetings.filter((_, i) => i !== index).map((m, i) => ({
      ...m,
      meeting_no: i + 1,
    }));
    setMeetings(updated);
  };

  const handleUpdateMeetingField = (index: number, field: keyof SyllabusMeeting, value: any) => {
    const updated = [...meetings];
    updated[index] = { ...updated[index], [field]: value };
    setMeetings(updated);
  };

  if (!course) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Silabus & RPS • ${course.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Course Header Banner */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                {course.code}
              </span>
              <span className="text-xs font-semibold text-blue-900 font-mono">
                {course.sks} SKS • {course.schedule_day || 'Senin'} {course.schedule_time || '08:00 WIB'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{course.name}</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Dosen Pengampu: <strong className="text-slate-800">{course.lecturer_name}</strong> {course.room ? `• Ruang: ${course.room}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const gCalUrl = generateGoogleCalendarUrl({
                  title: `[Kuliah] ${course.name} (${course.code})`,
                  details: `Dosen: ${course.lecturer_name} (${course.lecturer_phone || '-'})\nRuang: ${course.room || '-'}\nSKS: ${course.sks}\nKelas 01SAKP014 S1 Akuntansi`,
                  location: course.room || 'Kampus Universitas Pamulang',
                  startDate: new Date().toISOString(),
                });
                window.open(gCalUrl, '_blank');
              }}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Tambahkan jadwal matkul ini ke Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Calendar</span>
            </button>

            {hasPermission('create_courses') && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Silabus</span>
              </button>
            )}
          </div>
        </div>

        {/* Resources & Cloud Storage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Dokumen RPS Resmi
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Rencana Pembelajaran Semester format PDF / Google Docs
              </p>
            </div>
            {isEditing ? (
              <input
                type="url"
                value={rpsUrl}
                onChange={(e) => setRpsUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 mt-2"
              />
            ) : rpsUrl ? (
              <a
                href={rpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka RPS
              </a>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Belum diunggah</span>
            )}
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <FolderDown className="w-4 h-4 text-emerald-600" /> Folder Google Drive Materi
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Akses slide presentasi PPTX, modul PDF, dan tugas per pertemuan
              </p>
            </div>
            {isEditing ? (
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 mt-2"
              />
            ) : driveUrl ? (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Drive
              </a>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Belum diunggah</span>
            )}
          </div>
        </div>

        {/* Bobot Penilaian (Assessment Criteria) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2.5">
            Bobot Penilaian Akademik
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Kehadiran</span>
              {isEditing ? (
                <input
                  type="number"
                  value={assessment.attendance}
                  onChange={(e) => setAssessment({ ...assessment, attendance: Number(e.target.value) })}
                  className="w-16 mx-auto text-center font-bold text-sm border rounded py-0.5 mt-1"
                />
              ) : (
                <span className="text-base font-bold text-slate-800">{assessment.attendance}%</span>
              )}
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Tugas & Kuis</span>
              {isEditing ? (
                <input
                  type="number"
                  value={assessment.tasks}
                  onChange={(e) => setAssessment({ ...assessment, tasks: Number(e.target.value) })}
                  className="w-16 mx-auto text-center font-bold text-sm border rounded py-0.5 mt-1"
                />
              ) : (
                <span className="text-base font-bold text-indigo-600">{assessment.tasks}%</span>
              )}
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Ujian Tengah (UTS)</span>
              {isEditing ? (
                <input
                  type="number"
                  value={assessment.uts}
                  onChange={(e) => setAssessment({ ...assessment, uts: Number(e.target.value) })}
                  className="w-16 mx-auto text-center font-bold text-sm border rounded py-0.5 mt-1"
                />
              ) : (
                <span className="text-base font-bold text-amber-600">{assessment.uts}%</span>
              )}
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Ujian Akhir (UAS)</span>
              {isEditing ? (
                <input
                  type="number"
                  value={assessment.uas}
                  onChange={(e) => setAssessment({ ...assessment, uas: Number(e.target.value) })}
                  className="w-16 mx-auto text-center font-bold text-sm border rounded py-0.5 mt-1"
                />
              ) : (
                <span className="text-base font-bold text-emerald-600">{assessment.uas}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Daftar Pertemuan & Pokok Bahasan RPS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Rencana Pertemuan Perkuliahan ({meetings.length})
            </h4>
            {isEditing && (
              <button
                onClick={handleAddMeeting}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Pertemuan
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {meetings.map((meeting, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {meeting.meeting_no}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={meeting.topic}
                        onChange={(e) => handleUpdateMeetingField(idx, 'topic', e.target.value)}
                        className="text-xs font-bold text-slate-900 border rounded px-2 py-1 w-full max-w-sm"
                      />
                    ) : (
                      <h5 className="text-xs font-bold text-slate-900">{meeting.topic}</h5>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      onClick={() => handleRemoveMeeting(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus Pertemuan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Subtopics */}
                <div className="mt-2 pl-8">
                  {isEditing ? (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-medium">Subtopik (pisahkan dengan koma):</label>
                      <input
                        type="text"
                        value={meeting.subtopics?.join(', ') || ''}
                        onChange={(e) =>
                          handleUpdateMeetingField(
                            idx,
                            'subtopics',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        className="text-xs border rounded px-2 py-1 w-full"
                      />
                    </div>
                  ) : (
                    meeting.subtopics && (
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.subtopics.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded-md font-medium"
                          >
                            • {sub}
                          </span>
                        ))}
                      </div>
                    )
                  )}

                  {/* Learning Outcome */}
                  {meeting.learning_outcome && !isEditing && (
                    <p className="text-[11px] text-slate-500 mt-1.5 italic">
                      🎯 Capaian: {meeting.learning_outcome}
                    </p>
                  )}
                  {isEditing && (
                    <div className="mt-1.5">
                      <label className="text-[11px] text-slate-500 font-medium">Capaian Pembelajaran (Outcome):</label>
                      <input
                        type="text"
                        value={meeting.learning_outcome || ''}
                        onChange={(e) => handleUpdateMeetingField(idx, 'learning_outcome', e.target.value)}
                        className="text-xs border rounded px-2 py-1 w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
