import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { EventItem, Announcement, Meeting, DocumentItem, TaskItem } from '../../types/index.ts';
import {
  Calendar,
  Megaphone,
  Video,
  FileText,
  CheckSquare,
  Plus,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';

interface SecretaryDashboardProps {
  onNavigate: (module: string) => void;
}

export const SecretaryDashboard: React.FC<SecretaryDashboardProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [adminTasks, setAdminTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [ev, ann, meet, docs, tsks] = await Promise.all([
          api.getEvents(),
          api.getAnnouncements(),
          api.getMeetings(),
          api.getDocuments(),
          api.getTasks(),
        ]);
        setEvents(ev.slice(0, 4));
        setAnnouncements(ann.slice(0, 3));
        setMeetings(meet.slice(0, 3));
        setDocuments(docs.slice(0, 4));
        setAdminTasks(tsks.slice(0, 4));
      } catch (err) {
        console.error('Error loading secretary dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-violet-800 to-purple-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Secretariat Command
          </span>
          <h2 className="text-2xl font-bold">Dashboard Sekretaris Kelas</h2>
          <p className="text-violet-100 text-xs sm:text-sm mt-1">
            Pusat tata kelola persuratan, notulensi rapat, arsip dokumen, kalender akademik, dan siaran pengumuman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('announcements')}
            className="px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Buat Pengumuman
          </button>
          <button
            onClick={() => onNavigate('meetings')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Video className="w-4 h-4" /> Tulis Notulen Rapat
          </button>
        </div>
      </div>

      {/* KPI Cards: Agenda, Pengumuman, Notulen, Dokumen, Task Administrasi */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Agenda Kelas</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{events.length} Jadwal</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Pengumuman</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{announcements.length} Postingan</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Notulen Rapat</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{meetings.length} Berkas</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Arsip Dokumen</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{documents.length} File</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-medium text-slate-500">Task Administrasi</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{adminTasks.length} Tugas</p>
        </div>
      </div>

      {/* Grid: Agenda & Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Terjadwal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Agenda Kelas Terdekat
            </h3>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Lihat Kalender <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{evt.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {evt.date} • {evt.start_time} - {evt.end_time} WIB
                  </p>
                </div>
                <Badge variant={evt.type === 'lecture' ? 'primary' : evt.type === 'exam' ? 'danger' : 'neutral'}>
                  {evt.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Pengumuman Siaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600" /> Pengumuman Kelas
            </h3>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Kelola <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</span>
                  {a.is_pinned && <Badge variant="warning">Pin</Badge>}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Bawah: Notulensi Rapat & Repositori Dokumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notulen Rapat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600" /> Hasil & Notulen Rapat
            </h3>
            <button
              onClick={() => onNavigate('meetings')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Semua Rapat <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{m.title}</span>
                  <Badge variant={m.status === 'finished' ? 'success' : 'neutral'}>
                    {m.status === 'finished' ? 'Notulen Siap' : 'Terjadwal'}
                  </Badge>
                </div>
                {m.minutes ? (
                  <p className="text-xs text-slate-600 line-clamp-2 italic bg-white p-2 rounded-lg border border-slate-200/60">
                    "{m.minutes.decisions || m.minutes.discussion}"
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">Belum ada notulensi yang disimpan.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dokumen & Berkas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Arsip Dokumen Kelas
            </h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Repositori <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {documents.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{d.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {d.category} • {d.file_size} • {d.version}
                    </p>
                  </div>
                </div>
                <Badge variant="neutral">{d.permission_level}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
