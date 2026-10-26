import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Payment, EventItem, Announcement, TaskItem, NotificationItem } from '../../types/index.ts';
import {
  CreditCard,
  Calendar,
  Megaphone,
  CheckSquare,
  ArrowRight,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Vote,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';
import { AnnouncementTicker } from '../UI/AnnouncementTicker.tsx';

interface MemberDashboardProps {
  onNavigate: (module: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ onNavigate }) => {
  const { user, classInfo } = useAuth();
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [pays, evts, anns, tsks, notifs] = await Promise.all([
          api.getPayments({ user_id: user?.id }),
          api.getEvents(),
          api.getAnnouncements(),
          api.getTasks(),
          api.getNotifications(),
        ]);

        setMyPayments(pays);
        setUpcomingEvents(evts.slice(0, 3));
        setRecentAnnouncements(anns.slice(0, 2));
        setMyTasks(tsks.filter(t => t.assignee_id === user?.id || t.creator_id === user?.id).slice(0, 3));
        setNotifications(notifs.slice(0, 3));
      } catch (err) {
        console.error('Error fetching member dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const activeBill = myPayments.find(p => p.status === 'unpaid' || p.status === 'pending');
  const isPaidUp = !activeBill;

  return (
    <div className="space-y-6">
      <AnnouncementTicker 
        announcements={recentAnnouncements} 
        onOpenAnnouncements={() => onNavigate('announcements')} 
      />

      {/* Sapaan Siswa (Clean Minimalist Dashboard Header) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Halo, {user?.name?.split(' ')[0]} <span className="text-slate-400 font-normal"> • {classInfo?.code}</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">NIM: {user?.nim} • {user?.department}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-sm" title="Statistik Kehadiran (92%)">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" strokeWidth="4"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10B981" strokeWidth="4" strokeDasharray="92 8"></circle>
              </svg>
              <span className="absolute text-[8px] font-bold text-slate-700">92</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-none">Hadir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Quick-Glance "Jadwal Hari Ini" */}
      <div className="bg-indigo-600 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-indigo-200 font-medium mb-0.5">Jadwal Kuliah Hari Ini</p>
            <h3 className="font-bold">Akuntansi Biaya Lanjutan</h3>
            <p className="text-xs text-indigo-100">08:00 - 10:30 WIB • Ruang Lab Komputer 2</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('attendance')}
          className="w-full md:w-auto px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-bold rounded-lg shadow-sm transition-colors"
        >
          Presensi Sekarang
        </button>
      </div>

      {/* Grid 2 Kolom: Kas Saya & Agenda Terdekat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Status Kas Pribadi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Status Iuran Kas</h3>
            </div>
            <Badge variant={activeBill ? 'danger' : 'success'}>
              {activeBill ? 'Menunggak' : 'Lunas'}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Terkumpul: Rp 850.000</span>
              <span className="text-slate-900 font-bold">Target: Rp 1.500.000</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '56%' }} />
            </div>
          </div>

          {activeBill && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-rose-500 block mb-0.5">
                  Tagihan Aktif
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Rp {activeBill.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={() => onNavigate('my-kas')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-md transition-colors"
              >
                Bayar
              </button>
            </div>
          )}

          {/* Quick Actions for Member */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aksi Cepat</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('transparency')}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Transparansi Kas</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Cek saldo & mutasi</p>
              </button>
              <button
                onClick={() => onNavigate('polls')}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Ikuti Polling</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Beri suara musyawarah</p>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom 2: Agenda Terdekat & Kalender Kuliah */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          
          {/* Countdown UTS / UAS Widget */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Menuju UTS Ganjil</p>
                <p className="text-xs font-semibold text-slate-800">14 Hari 8 Jam 30 Menit</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Lihat Kalender
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Agenda & Jadwal Mendatang</h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Lihat Kalender <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada agenda terdekat</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-2xs">
                      <span className="text-xs font-bold uppercase leading-tight">
                        {new Date(evt.date).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black leading-none">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{evt.title}</p>
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        {evt.start_time} - {evt.end_time} WIB • {evt.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant={evt.type === 'exam' ? 'danger' : evt.type === 'lecture' ? 'primary' : 'neutral'}>
                    {evt.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Bawah: Pengumuman Terbaru & Tugas Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengumuman Terbaru */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Pengumuman Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Semua
            </button>
          </div>

          <div className="space-y-3">
            {recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{ann.title}</span>
                  {ann.is_pinned && <Badge variant="warning">Pinned</Badge>}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-slate-400">
                  Diposting oleh {ann.author_name} • {new Date(ann.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tugas Siswa / Task Saya */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Tugas & Assignment</h3>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex gap-2">
            <button className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-800 text-white shadow-xs">Semua</button>
            <button className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">Belum Selesai</button>
            <button className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">Selesai</button>
          </div>

          {myTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Tidak ada tugas yang ditugaskan.
            </div>
          ) : (
            <div className="space-y-0 text-sm">
              {myTasks.map((t) => {
                const isLate = new Date(t.deadline) < new Date();
                const diffTime = Math.abs(new Date(t.deadline).getTime() - new Date().getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const deadlineVariant = isLate ? 'danger' : diffDays <= 1 ? 'danger' : diffDays <= 3 ? 'warning' : 'success';
                
                return (
                  <div
                    key={t.id}
                    className="py-2.5 border-b border-slate-100 last:border-0 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2 overflow-hidden">
                      <input type="checkbox" className="mt-1 w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 shrink-0 cursor-pointer" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors cursor-pointer">{t.title}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">Mata Kuliah • {t.priority}</p>
                      </div>
                    </div>
                    <Badge variant={deadlineVariant} className="shrink-0 text-[9px] px-1.5 py-0.5">
                      {isLate ? 'Terlambat' : diffDays <= 1 ? '< 24 Jam' : diffDays <= 3 ? '< 3 Hari' : 'Aman'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
