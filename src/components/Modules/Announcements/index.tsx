import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Announcement, Meeting } from '../../../types/index.ts';
import {
  Megaphone,
  Video,
  Plus,
  Pin,
  Trash2,
  Calendar,
  Clock,
  User,
  Share2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  MessageSquare,
  CheckSquare,
  Search,
  Filter,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

interface AnnouncementsModuleProps {
  initialTab?: 'announcements' | 'meetings';
}

export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({
  initialTab = 'announcements',
}) => {
  const { hasPermission, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'announcements' | 'meetings'>(initialTab);
  
  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target: 'all',
    is_pinned: false,
  });

  // Meetings State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [meetingSearch, setMeetingSearch] = useState('');

  const [minutesForm, setMinutesForm] = useState({
    discussion: '',
    decisions: '',
    action_items: '',
  });

  const [meetingForm, setMeetingForm] = useState({
    title: '',
    agenda: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '19:30',
    end_time: '21:00',
    location: 'Google Meet',
    link: 'https://meet.google.com/sak-p014-cls',
  });

  const loadData = async () => {
    try {
      setAnnouncementLoading(true);
      setMeetingLoading(true);
      const [annList, meetList] = await Promise.all([
        api.getAnnouncements(),
        api.getMeetings(),
      ]);
      setAnnouncements(annList);
      setMeetings(meetList);
    } catch (err) {
      console.error('Error loading announcements and meetings:', err);
    } finally {
      setAnnouncementLoading(false);
      setMeetingLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Announcements
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement(announcementForm);
      setIsAddAnnouncementOpen(false);
      setAnnouncementForm({ title: '', content: '', target: 'all', is_pinned: false });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memposting pengumuman');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      try {
        await api.deleteAnnouncement(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus pengumuman');
      }
    }
  };

  const handleShareWhatsApp = (title: string, content: string, type: 'announcement' | 'meeting') => {
    const header = type === 'announcement'
      ? `📢 *PENGUMUMAN KELAS 01 SAKP 14*\n━━━━━━━━━━━━━━━━━━━━\n*${title}*\n\n`
      : `📹 *JADWAL RAPAT KELAS 01 SAKP 14*\n━━━━━━━━━━━━━━━━━━━━\n*${title}*\n\n`;
    const text = `${header}${content}\n\n_Dikelola melalui Portal Kelas Manajer 01SAKP014_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handlers for Meetings
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMeeting(meetingForm);
      setIsAddMeetingOpen(false);
      setMeetingForm({
        title: '',
        agenda: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '19:30',
        end_time: '21:00',
        location: 'Google Meet',
        link: 'https://meet.google.com/sak-p014-cls',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat jadwal rapat');
    }
  };

  const handleOpenMinutes = (m: Meeting) => {
    setSelectedMeeting(m);
    setMinutesForm({
      discussion: m.minutes?.discussion || '',
      decisions: m.minutes?.decisions || '',
      action_items: m.minutes?.action_items?.map((a) => `${a.task} [PIC: ${a.pic}]`).join('\n') || '',
    });
    setIsMinutesModalOpen(true);
  };

  const handleSaveMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    try {
      const parsedActions = minutesForm.action_items
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => ({
          task: l.replace(/\[PIC:.*?\]/i, '').trim(),
          pic: l.match(/\[PIC:(.*?)\]/i)?.[1]?.trim() || 'Pengurus Kelas',
          deadline: 'Sesuai Kesepakatan',
        }));

      await api.updateMeetingMinutes(selectedMeeting.id, {
        discussion: minutesForm.discussion,
        decisions: minutesForm.decisions,
        action_items: parsedActions,
      });

      setIsMinutesModalOpen(false);
      await loadData();
      alert('Notulensi rapat dan action items berhasil disimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan notulensi');
    }
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
    a.content.toLowerCase().includes(announcementSearch.toLowerCase())
  );

  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    m.agenda?.toLowerCase().includes(meetingSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> Pusat Informasi & Koordinasi Rapat
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Siaran resmi kelas 01 SAKP 14, koordinasi perkuliahan, notulensi rapat, dan tindak lanjut tugas.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Pengumuman Kelas ({announcements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'meetings'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Jadwal & Notulen ({meetings.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENGUMUMAN RESMI KELAS */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-5">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengumuman..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500 shadow-2xs"
              />
            </div>

            {hasPermission('create_announcements') && (
              <button
                onClick={() => setIsAddAnnouncementOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buat Pengumuman Baru
              </button>
            )}
          </div>

          {/* Announcements List */}
          {announcementLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
              Memuat pengumuman...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Pengumuman</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pengumuman resmi dari Ketua Kelas atau Pengurus akan disiarkan di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    a.is_pinned
                      ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                        {a.is_pinned && (
                          <Badge variant="warning">
                            <Pin className="w-3 h-3 inline mr-1" /> Pinned
                          </Badge>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                          Target: {a.target || a.target_type || 'Semua'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <User className="w-3 h-3 text-slate-400" /> {a.author_name || 'Pengurus Kelas'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(a.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Share WhatsApp */}
                      <button
                        onClick={() => handleShareWhatsApp(a.title, a.content, 'announcement')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Bagikan ke WhatsApp Group"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {hasPermission('delete_announcements') && (
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {a.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JADWAL & NOTULENSI RAPAT */}
      {/* ========================================================================= */}
      {activeTab === 'meetings' && (
        <div className="space-y-5">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari agenda rapat..."
                value={meetingSearch}
                onChange={(e) => setMeetingSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500 shadow-2xs"
              />
            </div>

            {hasPermission('create_meetings') && (
              <button
                onClick={() => setIsAddMeetingOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Jadwalkan Rapat Baru
              </button>
            )}
          </div>

          {/* Meetings List */}
          {meetingLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
              Memuat jadwal rapat...
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Video className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Rapat Terjadwal</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Rapat kelas, koordinasi tugas kelompok, atau evaluasi kepengurusan akan tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{m.title}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 uppercase tracking-wider shrink-0">
                        {m.location || 'Online'}
                      </span>
                    </div>

                    {m.agenda && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {m.agenda}
                      </p>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{new Date(m.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{m.start_time} - {m.end_time} WIB</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Meet Link */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {m.link && (
                      <div className="flex items-center gap-2">
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" /> Gabung Google Meet
                        </a>
                        <button
                          onClick={() => handleCopyLink(m.link || '', m.id)}
                          className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                          title="Salin Link Rapat"
                        >
                          {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(m.title, `Agenda: ${m.agenda}\nWaktu: ${m.date} (${m.start_time} - ${m.end_time})\nLink: ${m.link}`, 'meeting')}
                          className="p-2 border border-slate-200 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title="Share ke WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleOpenMinutes(m)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {m.minutes?.discussion ? 'Lihat / Edit Notulensi' : '+ Tulis Notulensi'}
                        </span>
                      </button>

                      {m.minutes?.action_items && m.minutes.action_items.length > 0 && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {m.minutes.action_items.length} Action Items
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      
      {/* Modal: Buat Pengumuman */}
      <Modal
        isOpen={isAddAnnouncementOpen}
        onClose={() => setIsAddAnnouncementOpen(false)}
        title="Buat Pengumuman Kelas Baru"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Judul Pengumuman</label>
            <input
              type="text"
              required
              placeholder="Contoh: Jadwal Pengumpulan Tugas Kelompok Pengantar Akuntansi"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Isi Pesan Pengumuman</label>
            <textarea
              required
              rows={5}
              placeholder="Tuliskan rincian informasi selengkapnya di sini..."
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Target Audiens</label>
              <select
                value={announcementForm.target}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, target: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-medium"
              >
                <option value="all">Semua Mahasiswa (01 SAKP 14)</option>
                <option value="officers">Pengurus Kelas Saja</option>
                <option value="group_leaders">Ketua Kelompok Tugas</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={announcementForm.is_pinned}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                  className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-600" /> Sematkan di Atas (Pin)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddAnnouncementOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5" /> Siarkan Pengumuman
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Jadwalkan Rapat */}
      <Modal
        isOpen={isAddMeetingOpen}
        onClose={() => setIsAddMeetingOpen(false)}
        title="Jadwalkan Rapat Koordinasi Kelas"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Judul / Topik Rapat</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Evaluasi Kas Kelas & Persiapan UTS"
              value={meetingForm.title}
              onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Agenda Pembahasan</label>
            <textarea
              rows={3}
              placeholder="Agenda 1: Laporan kas bulan berjalan&#10;Agenda 2: Pembentukan panitia gathering"
              value={meetingForm.agenda}
              onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={meetingForm.date}
                onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Jam Mulai</label>
              <input
                type="time"
                required
                value={meetingForm.start_time}
                onChange={(e) => setMeetingForm({ ...meetingForm, start_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Jam Selesai</label>
              <input
                type="time"
                required
                value={meetingForm.end_time}
                onChange={(e) => setMeetingForm({ ...meetingForm, end_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Lokasi / Media</label>
              <input
                type="text"
                value={meetingForm.location}
                onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Link Google Meet / Zoom</label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingForm.link}
                onChange={(e) => setMeetingForm({ ...meetingForm, link: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddMeetingOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" /> Simpan Jadwal Rapat
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Notulensi Rapat & Action Items */}
      <Modal
        isOpen={isMinutesModalOpen}
        onClose={() => setIsMinutesModalOpen(false)}
        title={`Notulensi: ${selectedMeeting?.title || 'Rapat'}`}
      >
        <form onSubmit={handleSaveMinutes} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Rangkuman Pembahasan / Diskusi</label>
            <textarea
              rows={4}
              placeholder="Catatan poin-poin utama yang dibahas saat rapat..."
              value={minutesForm.discussion}
              onChange={(e) => setMinutesForm({ ...minutesForm, discussion: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Keputusan & Kesepakatan Resmi</label>
            <textarea
              rows={3}
              placeholder="Keputusan bulat atau hasil voting kelas..."
              value={minutesForm.decisions}
              onChange={(e) => setMinutesForm({ ...minutesForm, decisions: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Action Items & Penanggung Jawab (1 baris per tugas)</label>
            <textarea
              rows={3}
              placeholder="Contoh:&#10;Konfirmasi ruangan dosen [PIC: Sekretaris]&#10;Kirim tagihan kas ke mahasiswa [PIC: Bendahara]"
              value={minutesForm.action_items}
              onChange={(e) => setMinutesForm({ ...minutesForm, action_items: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMinutesModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Simpan Notulensi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
