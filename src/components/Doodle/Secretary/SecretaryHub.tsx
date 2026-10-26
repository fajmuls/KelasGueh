import React, { useState } from 'react';
import {
  KasMember,
  ClassSettings,
  StudentPointLog,
  AttendanceRecord,
  MeetingMinute,
  ClassInventoryItem,
  CourseSchedule,
  CourseAssignment
} from '../../../types/kas.ts';
import { KeaktifanTab } from './KeaktifanTab.tsx';
import { PresensiTab } from './PresensiTab.tsx';
import { NotulensiTab } from './NotulensiTab.tsx';
import { InventarisTab } from './InventarisTab.tsx';
import { JadwalTugasTab } from './JadwalTugasTab.tsx';
import { sfx } from '../../../utils/soundEffects.ts';
import { Award, ClipboardCheck, FileText, ArrowLeft, Package, Calendar } from 'lucide-react';

interface SecretaryHubProps {
  initialSubTab?: 'keaktifan' | 'presensi' | 'notulensi' | 'inventaris' | 'jadwal';
  members: KasMember[];
  settings: ClassSettings;
  canEdit: boolean;
  pointLogs: StudentPointLog[];
  attendanceRecords: AttendanceRecord[];
  meetingMinutes: MeetingMinute[];
  inventoryItems?: ClassInventoryItem[];
  courseSchedules?: CourseSchedule[];
  onAddPointLog: (log: Omit<StudentPointLog, 'id' | 'createdAt'>) => void;
  onDeletePointLog: (id: string) => void;
  onSaveAttendanceRecord: (rec: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteAttendanceRecord: (id: string) => void;
  onSaveMeetingMinute: (minute: Omit<MeetingMinute, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteMeetingMinute: (id: string) => void;
  onSaveInventoryItem?: (item: Omit<ClassInventoryItem, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteInventoryItem?: (id: string) => void;
  onSaveCourseSchedule?: (course: Omit<CourseSchedule, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteCourseSchedule?: (id: string) => void;
  onAddAssignment?: (courseId: string, assignment: Omit<CourseAssignment, 'id'>) => void;
  onToggleAssignment?: (courseId: string, assignmentId: string) => void;
  onDeleteAssignment?: (courseId: string, assignmentId: string) => void;
  onBackToHub: () => void;
}

export const SecretaryHub: React.FC<SecretaryHubProps> = ({
  initialSubTab = 'keaktifan',
  members,
  settings,
  canEdit,
  pointLogs,
  attendanceRecords,
  meetingMinutes,
  inventoryItems = [],
  courseSchedules = [],
  onAddPointLog,
  onDeletePointLog,
  onSaveAttendanceRecord,
  onDeleteAttendanceRecord,
  onSaveMeetingMinute,
  onDeleteMeetingMinute,
  onSaveInventoryItem,
  onDeleteInventoryItem,
  onSaveCourseSchedule,
  onDeleteCourseSchedule,
  onAddAssignment,
  onToggleAssignment,
  onDeleteAssignment,
  onBackToHub
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'keaktifan' | 'presensi' | 'notulensi' | 'inventaris' | 'jadwal'>(initialSubTab);

  const tabs = [
    { id: 'keaktifan', label: 'Poin Keaktifan', icon: Award, count: pointLogs.length },
    { id: 'presensi', label: 'Presensi', icon: ClipboardCheck, count: attendanceRecords.length },
    { id: 'notulensi', label: 'Notulensi', icon: FileText, count: meetingMinutes.length },
    { id: 'inventaris', label: 'Inventaris Barang', icon: Package, count: inventoryItems.length },
    { id: 'jadwal', label: 'Jadwal & Tugas', icon: Calendar, count: courseSchedules.length }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Secretary Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playClick();
              onBackToHub();
            }}
            className="btn-doodle px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-900 text-xs font-bold flex items-center gap-1 shrink-0"
            title="Kembali ke Beranda Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda Hub</span>
          </button>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs font-black text-slate-900 hidden sm:inline">
            Sekretariat & Akademik
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = currentSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  sfx.playToggle();
                  setCurrentSubTab(t.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-sky-200 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-slate-800" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Secretary View */}
      {currentSubTab === 'keaktifan' && (
        <KeaktifanTab
          pointLogs={pointLogs}
          members={members}
          settings={settings}
          canEdit={canEdit}
          courseSchedules={courseSchedules}
          onAddPointLog={onAddPointLog}
          onDeletePointLog={onDeletePointLog}
        />
      )}

      {currentSubTab === 'presensi' && (
        <PresensiTab
          attendanceRecords={attendanceRecords}
          members={members}
          settings={settings}
          canEdit={canEdit}
          onSaveRecord={onSaveAttendanceRecord}
          onDeleteRecord={onDeleteAttendanceRecord}
        />
      )}

      {currentSubTab === 'notulensi' && (
        <NotulensiTab
          meetingMinutes={meetingMinutes}
          members={members}
          settings={settings}
          canEdit={canEdit}
          onSaveMinute={onSaveMeetingMinute}
          onDeleteMinute={onDeleteMeetingMinute}
        />
      )}

      {currentSubTab === 'inventaris' && (
        <InventarisTab
          items={inventoryItems}
          settings={settings}
          canEdit={canEdit}
          onSaveItem={onSaveInventoryItem || (() => {})}
          onDeleteItem={onDeleteInventoryItem || (() => {})}
        />
      )}

      {currentSubTab === 'jadwal' && (
        <JadwalTugasTab
          schedules={courseSchedules}
          settings={settings}
          canEdit={canEdit}
          onSaveCourse={onSaveCourseSchedule || (() => {})}
          onDeleteCourse={onDeleteCourseSchedule || (() => {})}
          onAddAssignment={onAddAssignment || (() => {})}
          onToggleAssignment={onToggleAssignment || (() => {})}
          onDeleteAssignment={onDeleteAssignment || (() => {})}
        />
      )}
    </div>
  );
};
